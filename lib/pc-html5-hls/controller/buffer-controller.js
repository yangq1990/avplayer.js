'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../../core/event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _logger = require('../../utils/logger');

var _errors = require('../../core/errors');

var _avlog = require('../../utils/avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Buffer Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var BufferController = function (_EventHandler) {
  _inherits(BufferController, _EventHandler);

  function BufferController(AVPLAYER) {
    _classCallCheck(this, BufferController);

    // the value that we have set mediasource.duration to
    // (the actual duration may be tweaked slighly by the browser)
    var _this = _possibleConstructorReturn(this, (BufferController.__proto__ || Object.getPrototypeOf(BufferController)).call(this, AVPLAYER, _events2.default.MEDIA_ATTACHING, _events2.default.MEDIA_DETACHING, _events2.default.MANIFEST_PARSED, _events2.default.BUFFER_RESET, _events2.default.BUFFER_APPENDING, _events2.default.BUFFER_CODECS, _events2.default.BUFFER_EOS, _events2.default.BUFFER_FLUSHING, _events2.default.LEVEL_PTS_UPDATED, _events2.default.LEVEL_UPDATED));

    _this._msDuration = null;
    // the value that we want to set mediaSource.duration to
    _this._levelDuration = null;

    // Source Buffer listeners
    _this.onsbue = _this.onSBUpdateEnd.bind(_this);
    _this.onsbe = _this.onSBUpdateError.bind(_this);
    _this.pendingTracks = {};
    _this.tracks = {};
    return _this;
  }

  _createClass(BufferController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onLevelPtsUpdated',
    value: function onLevelPtsUpdated(data) {
      var type = data.type;
      var audioTrack = this.tracks.audio;

      // Adjusting `SourceBuffer.timestampOffset` (desired point in the timeline where the next frames should be appended)
      // in Chrome browser when we detect MPEG audio container and time delta between level PTS and `SourceBuffer.timestampOffset`
      // is greater than 100ms (this is enough to handle seek for VOD or level change for LIVE videos). At the time of change we issue
      // `SourceBuffer.abort()` and adjusting `SourceBuffer.timestampOffset` if `SourceBuffer.updating` is false or awaiting `updateend`
      // event if SB is in updating state.
      // More info here: https://github.com/dailymotion/hls.js/issues/332#issuecomment-257986486

      if (type === 'audio' && audioTrack && audioTrack.container === 'audio/mpeg') {
        // Chrome audio mp3 track
        var audioBuffer = this.sourceBuffer.audio;
        var delta = Math.abs(audioBuffer.timestampOffset - data.start);

        // adjust timestamp offset if time delta is greater than 100ms
        if (delta > 0.1) {
          var updating = audioBuffer.updating;

          try {
            audioBuffer.abort();
          } catch (err) {
            updating = true;
            _logger.logger.warn('can not abort audio buffer: ' + err);
          }

          if (!updating) {
            _logger.logger.warn('change mpeg audio timestamp offset from ' + audioBuffer.timestampOffset + ' to ' + data.start);
            audioBuffer.timestampOffset = data.start;
          } else {
            this.audioTimestampOffset = data.start;
          }
        }
      }
    }
  }, {
    key: 'onManifestParsed',
    value: function onManifestParsed(data) {
      var audioExpected = data.audio,
          videoExpected = data.video,
          sourceBufferNb = 0;
      // in case of alt audio 2 BUFFER_CODECS events will be triggered, one per stream controller
      // sourcebuffers will be created all at once when the expected nb of tracks will be reached
      // in case alt audio is not used, only one BUFFER_CODEC event will be fired from main stream controller
      // it will contain the expected nb of source buffers, no need to compute it
      if (data.altAudio && (audioExpected || videoExpected)) {
        sourceBufferNb = (audioExpected ? 1 : 0) + (videoExpected ? 1 : 0);
        _logger.logger.log(sourceBufferNb + ' sourceBuffer(s) expected');
      }
      this.sourceBufferNb = sourceBufferNb;
    }
  }, {
    key: 'onMediaAttaching',
    value: function onMediaAttaching(data) {
      var media = this.media = data.media;
      if (media) {
        // setup the media source
        var ms = this.mediaSource = new MediaSource();
        //Media Source listeners
        this.onmso = this.onMediaSourceOpen.bind(this);
        this.onmse = this.onMediaSourceEnded.bind(this);
        this.onmsc = this.onMediaSourceClose.bind(this);
        ms.addEventListener('sourceopen', this.onmso);
        ms.addEventListener('sourceended', this.onmse);
        ms.addEventListener('sourceclose', this.onmsc);
        // link video and media Source
        media.src = URL.createObjectURL(ms);
        _avlog2.default.print('media.src->' + media.src);
      }
    }
  }, {
    key: 'onMediaDetaching',
    value: function onMediaDetaching() {
      _logger.logger.log('media source detaching');
      var ms = this.mediaSource;
      if (ms) {
        if (ms.readyState === 'open') {
          try {
            // endOfStream could trigger exception if any sourcebuffer is in updating state
            // we don't really care about checking sourcebuffer state here,
            // as we are anyway detaching the MediaSource
            // let's just avoid this exception to propagate
            ms.endOfStream();
          } catch (err) {
            _logger.logger.warn('onMediaDetaching:' + err.message + ' while calling endOfStream');
          }
        }
        ms.removeEventListener('sourceopen', this.onmso);
        ms.removeEventListener('sourceended', this.onmse);
        ms.removeEventListener('sourceclose', this.onmsc);

        // Detach properly the MediaSource from the HTMLMediaElement as
        // suggested in https://github.com/w3c/media-source/issues/53.
        if (this.media) {
          URL.revokeObjectURL(this.media.src);
          this.media.removeAttribute('src');
          this.media.load();
        }

        this.mediaSource = null;
        this.media = null;
        this.pendingTracks = {};
        this.tracks = {};
        this.sourceBuffer = {};
        this.flushRange = [];
        this.segments = [];
        this.appended = 0;
      }
      this.onmso = this.onmse = this.onmsc = null;
      this.AVPLAYER.trigger(_events2.default.MEDIA_DETACHED);
    }
  }, {
    key: 'onMediaSourceOpen',
    value: function onMediaSourceOpen() {
      this.AVPLAYER.trigger(_events2.default.MEDIA_ATTACHED, { media: this.media });
      var mediaSource = this.mediaSource;
      if (mediaSource) {
        // once received, don't listen anymore to sourceopen event
        mediaSource.removeEventListener('sourceopen', this.onmso);
      }
      this.checkPendingTracks();
    }
  }, {
    key: 'checkPendingTracks',
    value: function checkPendingTracks() {
      // if any buffer codecs pending, check if we have enough to create sourceBuffers
      var pendingTracks = this.pendingTracks,
          pendingTracksNb = Object.keys(pendingTracks).length;
      // if any pending tracks and (if nb of pending tracks gt or equal than expected nb or if unknown expected nb)
      if (pendingTracksNb && (this.sourceBufferNb <= pendingTracksNb || this.sourceBufferNb === 0)) {
        // ok, let's create them now !
        this.createSourceBuffers(pendingTracks);
        this.pendingTracks = {};
        // append any pending segments now !
        this.doAppending();
      }
    }
  }, {
    key: 'onMediaSourceClose',
    value: function onMediaSourceClose() {
      _logger.logger.log('media source closed');
    }
  }, {
    key: 'onMediaSourceEnded',
    value: function onMediaSourceEnded() {
      _logger.logger.log('media source ended');
    }
  }, {
    key: 'onSBUpdateEnd',
    value: function onSBUpdateEnd() {
      // update timestampOffset
      if (this.audioTimestampOffset) {
        var audioBuffer = this.sourceBuffer.audio;
        _logger.logger.warn('change mpeg audio timestamp offset from ' + audioBuffer.timestampOffset + ' to ' + this.audioTimestampOffset);
        audioBuffer.timestampOffset = this.audioTimestampOffset;
        delete this.audioTimestampOffset;
      }

      if (this._needsFlush) {
        this.doFlush();
      }

      if (this._needsEos) {
        this.checkEos();
      }
      this.appending = false;
      var parent = this.parent;
      // count nb of pending segments waiting for appending on this sourcebuffer
      var pending = this.segments.reduce(function (counter, segment) {
        return segment.parent === parent ? counter + 1 : counter;
      }, 0);
      this.AVPLAYER.trigger(_events2.default.BUFFER_APPENDED, { parent: parent, pending: pending });

      // don't append in flushing mode
      if (!this._needsFlush) {
        this.doAppending();
      }

      this.updateMediaElementDuration();
    }
  }, {
    key: 'onSBUpdateError',
    value: function onSBUpdateError(event) {
      _logger.logger.error('sourceBuffer error:', event);
      // according to http://www.w3.org/TR/media-source/#sourcebuffer-append-error
      // this error might not always be fatal (it is fatal if decode error is set, in that case
      // it will be followed by a mediaElement error ...)
      this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.BUFFER_APPENDING_ERROR, fatal: false });
      // we don't need to do more than that, as accordin to the spec, updateend will be fired just after
    }
  }, {
    key: 'onBufferReset',
    value: function onBufferReset() {
      var sourceBuffer = this.sourceBuffer;
      for (var type in sourceBuffer) {
        var sb = sourceBuffer[type];
        try {
          this.mediaSource.removeSourceBuffer(sb);
          sb.removeEventListener('updateend', this.onsbue);
          sb.removeEventListener('error', this.onsbe);
        } catch (err) {}
      }
      this.sourceBuffer = {};
      this.flushRange = [];
      this.segments = [];
      this.appended = 0;
    }
  }, {
    key: 'onBufferCodecs',
    value: function onBufferCodecs(tracks) {
      // if source buffer(s) not created yet, appended buffer tracks in this.pendingTracks
      // if sourcebuffers already created, do nothing ...
      if (Object.keys(this.sourceBuffer).length === 0) {
        for (var trackName in tracks) {
          this.pendingTracks[trackName] = tracks[trackName];
        }
        var mediaSource = this.mediaSource;
        if (mediaSource && mediaSource.readyState === 'open') {
          // try to create sourcebuffers if mediasource opened
          this.checkPendingTracks();
        }
      }
    }
  }, {
    key: 'createSourceBuffers',
    value: function createSourceBuffers(tracks) {
      var sourceBuffer = this.sourceBuffer,
          mediaSource = this.mediaSource;

      for (var trackName in tracks) {
        if (!sourceBuffer[trackName]) {
          var track = tracks[trackName];
          // use levelCodec as first priority
          var codec = track.levelCodec || track.codec;
          var mimeType = track.container + ';codecs=' + codec;
          _logger.logger.log('creating sourceBuffer(' + mimeType + ')');
          try {
            var sb = sourceBuffer[trackName] = mediaSource.addSourceBuffer(mimeType);
            sb.addEventListener('updateend', this.onsbue);
            sb.addEventListener('error', this.onsbe);
            this.tracks[trackName] = { codec: codec, container: track.container };
            track.buffer = sb;
          } catch (err) {
            _logger.logger.error('error while trying to add sourceBuffer:' + err.message);
            this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.BUFFER_ADD_CODEC_ERROR, fatal: false, err: err, mimeType: mimeType });
          }
        }
      }
      this.AVPLAYER.trigger(_events2.default.BUFFER_CREATED, { tracks: tracks });
    }
  }, {
    key: 'onBufferAppending',
    value: function onBufferAppending(data) {
      if (!this._needsFlush) {
        if (!this.segments) {
          this.segments = [data];
        } else {
          this.segments.push(data);
        }
        this.doAppending();
      }
    }
  }, {
    key: 'onBufferAppendFail',
    value: function onBufferAppendFail(data) {
      _logger.logger.error('sourceBuffer error:', data.event);
      // according to http://www.w3.org/TR/media-source/#sourcebuffer-append-error
      // this error might not always be fatal (it is fatal if decode error is set, in that case
      // it will be followed by a mediaElement error ...)
      this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.BUFFER_APPENDING_ERROR, fatal: false });
    }

    // on BUFFER_EOS mark matching sourcebuffer(s) as ended and trigger checkEos()

  }, {
    key: 'onBufferEos',
    value: function onBufferEos(data) {
      var sb = this.sourceBuffer;
      var dataType = data.type;
      for (var type in sb) {
        if (!dataType || type === dataType) {
          if (!sb[type].ended) {
            sb[type].ended = true;
            _logger.logger.log(type + ' sourceBuffer now EOS');
          }
        }
      }
      this.checkEos();
    }

    // if all source buffers are marked as ended, signal endOfStream() to MediaSource.

  }, {
    key: 'checkEos',
    value: function checkEos() {
      var sb = this.sourceBuffer,
          mediaSource = this.mediaSource;
      if (!mediaSource || mediaSource.readyState !== 'open') {
        this._needsEos = false;
        return;
      }
      for (var type in sb) {
        var sbobj = sb[type];
        if (!sbobj.ended) {
          return;
        }
        if (sbobj.updating) {
          this._needsEos = true;
          return;
        }
      }
      _logger.logger.log('all media data available, signal endOfStream() to MediaSource and stop loading fragment');
      //Notify the media element that it now has all of the media data
      try {
        mediaSource.endOfStream();
      } catch (e) {
        _logger.logger.warn('exception while calling mediaSource.endOfStream()');
      }
      this._needsEos = false;
    }
  }, {
    key: 'onBufferFlushing',
    value: function onBufferFlushing(data) {
      this.flushRange.push({ start: data.startOffset, end: data.endOffset, type: data.type });
      // attempt flush immediatly
      this.flushBufferCounter = 0;
      this.doFlush();
    }
  }, {
    key: 'onLevelUpdated',
    value: function onLevelUpdated(event) {
      var details = event.details;
      if (details.fragments.length === 0) {
        return;
      }
      this._levelDuration = details.totalduration + details.fragments[0].start;
      this.updateMediaElementDuration();
    }

    // https://github.com/dailymotion/hls.js/issues/355

  }, {
    key: 'updateMediaElementDuration',
    value: function updateMediaElementDuration() {
      var media = this.media,
          mediaSource = this.mediaSource,
          sourceBuffer = this.sourceBuffer,
          levelDuration = this._levelDuration;
      if (levelDuration === null || !media || !mediaSource || !sourceBuffer || media.readyState === 0 || mediaSource.readyState !== 'open') {
        return;
      }
      for (var type in sourceBuffer) {
        if (sourceBuffer[type].updating) {
          // can't set duration whilst a buffer is updating
          return;
        }
      }
      if (this._msDuration === null) {
        // initialise to the value that the media source is reporting
        this._msDuration = mediaSource.duration;
      }
      var duration = media.duration;
      // levelDuration was the last value we set.
      // not using mediaSource.duration as the browser may tweak this value
      // only update mediasource duration if its value increase, this is to avoid
      // flushing already buffered portion when switching between quality level
      if (levelDuration > this._msDuration && levelDuration > duration || duration === Infinity || isNaN(duration)) {
        _logger.logger.log('Updating mediasource duration to ' + levelDuration.toFixed(3));
        this._msDuration = mediaSource.duration = levelDuration;
      }
    }
  }, {
    key: 'doFlush',
    value: function doFlush() {
      // loop through all buffer ranges to flush
      while (this.flushRange.length) {
        var range = this.flushRange[0];
        // flushBuffer will abort any buffer append in progress and flush Audio/Video Buffer
        if (this.flushBuffer(range.start, range.end, range.type)) {
          // range flushed, remove from flush array
          this.flushRange.shift();
          this.flushBufferCounter = 0;
        } else {
          this._needsFlush = true;
          // avoid looping, wait for SB update end to retrigger a flush
          return;
        }
      }
      if (this.flushRange.length === 0) {
        // everything flushed
        this._needsFlush = false;

        // let's recompute this.appended, which is used to avoid flush looping
        var appended = 0;
        var sourceBuffer = this.sourceBuffer;
        try {
          for (var type in sourceBuffer) {
            appended += sourceBuffer[type].buffered.length;
          }
        } catch (error) {
          // error could be thrown while accessing buffered, in case sourcebuffer has already been removed from MediaSource
          // this is harmess at this stage, catch this to avoid reporting an internal exception
          _logger.logger.error('error while accessing sourceBuffer.buffered');
        }
        this.appended = appended;
        this.AVPLAYER.trigger(_events2.default.BUFFER_FLUSHED);
      }
    }
  }, {
    key: 'doAppending',
    value: function doAppending() {
      var hls = this.AVPLAYER,
          sourceBuffer = this.sourceBuffer,
          segments = this.segments;
      if (Object.keys(sourceBuffer).length) {
        if (this.media.error) {
          this.segments = [];
          _logger.logger.error('trying to append although a media error occured, flush segment and abort');
          return;
        }
        if (this.appending) {
          //logger.log(`sb appending in progress`);
          return;
        }
        if (segments && segments.length) {
          var segment = segments.shift();
          try {
            var type = segment.type,
                sb = sourceBuffer[type];
            if (sb) {
              if (!sb.updating) {
                // reset sourceBuffer ended flag before appending segment
                sb.ended = false;
                //logger.log(`appending ${segment.content} ${type} SB, size:${segment.data.length}, ${segment.parent}`);
                this.parent = segment.parent;
                sb.appendBuffer(segment.data);
                this.appendError = 0;
                this.appended++;
                this.appending = true;
              } else {
                segments.unshift(segment);
              }
            } else {
              // in case we don't have any source buffer matching with this segment type,
              // it means that Mediasource fails to create sourcebuffer
              // discard this segment, and trigger update end
              this.onSBUpdateEnd();
            }
          } catch (err) {
            // in case any error occured while appending, put back segment in segments table
            _logger.logger.error('error while trying to append buffer:' + err.message);
            segments.unshift(segment);
            var event = { type: _errors.ErrorTypes.MEDIA_ERROR, parent: segment.parent };
            if (err.code !== 22) {
              if (this.appendError) {
                this.appendError++;
              } else {
                this.appendError = 1;
              }
              event.details = _errors.ErrorDetails.BUFFER_APPEND_ERROR;
              /* with UHD content, we could get loop of quota exceeded error until
                browser is able to evict some data from sourcebuffer. retrying help recovering this
              */
              if (this.appendError > AVPLAYER.config.appendErrorMaxRetry) {
                _logger.logger.log('fail ' + AVPLAYER.config.appendErrorMaxRetry + ' times to append segment in sourceBuffer');
                segments = [];
                event.fatal = true;
                this.AVPLAYER.trigger(_events2.default.ERROR, event);
                return;
              } else {
                event.fatal = false;
                this.AVPLAYER.trigger(_events2.default.ERROR, event);
              }
            } else {
              // QuotaExceededError: http://www.w3.org/TR/html5/infrastructure.html#quotaexceedederror
              // let's stop appending any segments, and report BUFFER_FULL_ERROR error
              this.segments = [];
              event.details = _errors.ErrorDetails.BUFFER_FULL_ERROR;
              event.fatal = false;
              this.AVPLAYER.trigger(_events2.default.ERROR, event);
              return;
            }
          }
        }
      }
    }

    /*
      flush specified buffered range,
      return true once range has been flushed.
      as sourceBuffer.remove() is asynchronous, flushBuffer will be retriggered on sourceBuffer update end
    */

  }, {
    key: 'flushBuffer',
    value: function flushBuffer(startOffset, endOffset, typeIn) {
      var sb,
          i,
          bufStart,
          bufEnd,
          flushStart,
          flushEnd,
          sourceBuffer = this.sourceBuffer;
      if (Object.keys(sourceBuffer).length) {
        _logger.logger.log('flushBuffer,pos/start/end: ' + this.media.currentTime.toFixed(3) + '/' + startOffset + '/' + endOffset);
        // safeguard to avoid infinite looping : don't try to flush more than the nb of appended segments
        if (this.flushBufferCounter < this.appended) {
          for (var type in sourceBuffer) {
            // check if sourcebuffer type is defined (typeIn): if yes, let's only flush this one
            // if no, let's flush all sourcebuffers
            if (typeIn && type !== typeIn) {
              continue;
            }
            sb = sourceBuffer[type];
            // we are going to flush buffer, mark source buffer as 'not ended'
            sb.ended = false;
            if (!sb.updating) {
              try {
                for (i = 0; i < sb.buffered.length; i++) {
                  bufStart = sb.buffered.start(i);
                  bufEnd = sb.buffered.end(i);
                  // workaround firefox not able to properly flush multiple buffered range.
                  if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1 && endOffset === Number.POSITIVE_INFINITY) {
                    flushStart = startOffset;
                    flushEnd = endOffset;
                  } else {
                    flushStart = Math.max(bufStart, startOffset);
                    flushEnd = Math.min(bufEnd, endOffset);
                  }
                  /* sometimes sourcebuffer.remove() does not flush
                     the exact expected time range.
                     to avoid rounding issues/infinite loop,
                     only flush buffer range of length greater than 500ms.
                  */
                  if (Math.min(flushEnd, bufEnd) - flushStart > 0.5) {
                    this.flushBufferCounter++;
                    _logger.logger.log('flush ' + type + ' [' + flushStart + ',' + flushEnd + '], of [' + bufStart + ',' + bufEnd + '], pos:' + this.media.currentTime);
                    sb.remove(flushStart, flushEnd);
                    return false;
                  }
                }
              } catch (e) {
                _logger.logger.warn('exception while accessing sourcebuffer, it might have been removed from MediaSource');
              }
            } else {
              //logger.log('abort ' + type + ' append in progress');
              // this will abort any appending in progress
              //sb.abort();
              _logger.logger.warn('cannot flush, sb updating in progress');
              return false;
            }
          }
        } else {
          _logger.logger.warn('abort flushing too many retries');
        }
        _logger.logger.log('buffer flushed');
      }
      // everything flushed !
      return true;
    }
  }]);

  return BufferController;
}(_eventHandler2.default);

exports.default = BufferController;