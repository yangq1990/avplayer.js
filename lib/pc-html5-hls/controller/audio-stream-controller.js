'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _binarySearch = require('../../utils/binary-search');

var _binarySearch2 = _interopRequireDefault(_binarySearch);

var _bufferHelper = require('../helper/buffer-helper');

var _bufferHelper2 = _interopRequireDefault(_bufferHelper);

var _demuxer = require('../demux/demuxer');

var _demuxer2 = _interopRequireDefault(_demuxer);

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../../core/event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _levelHelper = require('../helper/level-helper');

var _levelHelper2 = _interopRequireDefault(_levelHelper);

var _timeRanges = require('../../utils/timeRanges');

var _timeRanges2 = _interopRequireDefault(_timeRanges);

var _errors = require('../../core/errors');

var _logger = require('../../utils/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Audio Stream Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var State = {
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  IDLE: 'IDLE',
  PAUSED: 'PAUSED',
  KEY_LOADING: 'KEY_LOADING',
  FRAG_LOADING: 'FRAG_LOADING',
  FRAG_LOADING_WAITING_RETRY: 'FRAG_LOADING_WAITING_RETRY',
  WAITING_TRACK: 'WAITING_TRACK',
  PARSING: 'PARSING',
  PARSED: 'PARSED',
  BUFFER_FLUSHING: 'BUFFER_FLUSHING',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
  WAITING_INIT_PTS: 'WAITING_INIT_PTS'
};

var AudioStreamController = function (_EventHandler) {
  _inherits(AudioStreamController, _EventHandler);

  function AudioStreamController(AVPLAYER) {
    _classCallCheck(this, AudioStreamController);

    var _this = _possibleConstructorReturn(this, (AudioStreamController.__proto__ || Object.getPrototypeOf(AudioStreamController)).call(this, AVPLAYER, _events2.default.MEDIA_ATTACHED, _events2.default.MEDIA_DETACHING, _events2.default.AUDIO_TRACKS_UPDATED, _events2.default.AUDIO_TRACK_SWITCHING, _events2.default.AUDIO_TRACK_LOADED, _events2.default.KEY_LOADED, _events2.default.FRAG_LOADED, _events2.default.FRAG_PARSING_INIT_SEGMENT, _events2.default.FRAG_PARSING_DATA, _events2.default.FRAG_PARSED, _events2.default.ERROR, _events2.default.BUFFER_CREATED, _events2.default.BUFFER_APPENDED, _events2.default.BUFFER_FLUSHED, _events2.default.INIT_PTS_FOUND));

    _this.config = _this.AVPLAYER.config;
    _this.audioCodecSwap = false;
    _this.ticks = 0;
    _this._state = State.STOPPED;
    _this.ontick = _this.tick.bind(_this);
    _this.initPTS = [];
    _this.waitingFragment = null;
    return _this;
  }

  _createClass(AudioStreamController, [{
    key: 'destroy',
    value: function destroy() {
      this.stopLoad();
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      _eventHandler2.default.prototype.destroy.call(this);
      this.state = State.STOPPED;
    }

    //Signal that video PTS was found

  }, {
    key: 'onInitPtsFound',
    value: function onInitPtsFound(data) {
      var demuxerId = data.id,
          cc = data.frag.cc,
          initPTS = data.initPTS;
      if (demuxerId === 'main') {
        //Always update the new INIT PTS
        //Can change due level switch
        this.initPTS[cc] = initPTS;
        _logger.logger.log('InitPTS for cc:' + cc + ' found from video track:' + initPTS);

        //If we are waiting we need to demux/remux the waiting frag
        //With the new initPTS
        if (this.state === State.WAITING_INIT_PTS) {
          _logger.logger.log('sending pending audio frag to demuxer');
          this.state = State.FRAG_LOADING;
          //We have audio frag waiting or video pts
          //Let process it
          this.onFragLoaded(this.waitingFragment);
          //Lets clean the waiting frag
          this.waitingFragment = null;
        }
      }
    }
  }, {
    key: 'startLoad',
    value: function startLoad(startPosition) {
      if (this.tracks) {
        var lastCurrentTime = this.lastCurrentTime;
        this.stopLoad();
        if (!this.timer) {
          this.timer = setInterval(this.ontick, 100);
        }
        this.fragLoadError = 0;
        if (lastCurrentTime > 0 && startPosition === -1) {
          _logger.logger.log('audio:override startPosition with lastCurrentTime @' + lastCurrentTime.toFixed(3));
          this.state = State.IDLE;
        } else {
          this.lastCurrentTime = this.startPosition ? this.startPosition : startPosition;
          this.state = State.STARTING;
        }
        this.nextLoadPosition = this.startPosition = this.lastCurrentTime;
        this.tick();
      } else {
        this.startPosition = startPosition;
        this.state = State.STOPPED;
      }
    }
  }, {
    key: 'stopLoad',
    value: function stopLoad() {
      var frag = this.fragCurrent;
      if (frag) {
        if (frag.loader) {
          frag.loader.abort();
        }
        this.fragCurrent = null;
      }
      this.fragPrevious = null;
      if (this.demuxer) {
        this.demuxer.destroy();
        this.demuxer = null;
      }
      this.state = State.STOPPED;
    }
  }, {
    key: 'tick',
    value: function tick() {
      this.ticks++;
      if (this.ticks === 1) {
        this.doTick();
        if (this.ticks > 1) {
          setTimeout(this.tick, 1);
        }
        this.ticks = 0;
      }
    }
  }, {
    key: 'doTick',
    value: function doTick() {
      var pos,
          track,
          trackDetails,
          hls = this.AVPLAYER,
          config = this.AVPLAYER.config;
      //logger.log('audioStream:' + this.state);
      switch (this.state) {
        case State.ERROR:
        //don't do anything in error state to avoid breaking further ...
        case State.PAUSED:
        //don't do anything in paused state either ...
        case State.BUFFER_FLUSHING:
          break;
        case State.STARTING:
          this.state = State.WAITING_TRACK;
          this.loadedmetadata = false;
          break;
        case State.IDLE:
          var tracks = this.tracks;
          // audio tracks not received => exit loop
          if (!tracks) {
            break;
          }
          // if video not attached AND
          // start fragment already requested OR start frag prefetch disable
          // exit loop
          // => if media not attached but start frag prefetch is enabled and start frag not requested yet, we will not exit loop
          if (!this.media && (this.startFragRequested || !config.startFragPrefetch)) {
            break;
          }
          // determine next candidate fragment to be loaded, based on current position and
          //  end of buffer position
          // if we have not yet loaded any fragment, start loading from start position
          if (this.loadedmetadata) {
            pos = this.media.currentTime;
          } else {
            pos = this.nextLoadPosition;
          }
          var media = this.mediaBuffer ? this.mediaBuffer : this.media,
              bufferInfo = _bufferHelper2.default.bufferInfo(media, pos, config.maxBufferHole),
              bufferLen = bufferInfo.len,
              bufferEnd = bufferInfo.end,
              fragPrevious = this.fragPrevious,
              maxBufLen = config.maxMaxBufferLength,
              audioSwitch = this.audioSwitch,
              trackId = this.trackId;

          // if buffer length is less than maxBufLen try to load a new fragment
          if (bufferLen < maxBufLen && trackId < tracks.length) {
            trackDetails = tracks[trackId].details;
            // if track info not retrieved yet, switch state and wait for track retrieval
            if (typeof trackDetails === 'undefined') {
              this.state = State.WAITING_TRACK;
              break;
            }

            // we just got done loading the final fragment, check if we need to finalize media stream
            if (!audioSwitch && !trackDetails.live && fragPrevious && fragPrevious.sn === trackDetails.endSN) {
              // if we are not seeking or if we are seeking but everything (almost) til the end is buffered, let's signal eos
              // we don't compare exactly media.duration === bufferInfo.end as there could be some subtle media duration difference when switching
              // between different renditions. using half frag duration should help cope with these cases.
              if (!this.media.seeking || this.media.duration - bufferEnd < fragPrevious.duration / 2) {
                // Finalize the media stream
                this.AVPLAYER.trigger(_events2.default.BUFFER_EOS, { type: 'audio' });
                this.state = State.ENDED;
                break;
              }
            }

            // find fragment index, contiguous with end of buffer position
            var fragments = trackDetails.fragments,
                fragLen = fragments.length,
                start = fragments[0].start,
                end = fragments[fragLen - 1].start + fragments[fragLen - 1].duration,
                frag = void 0;

            // When switching audio track, reload audio as close as possible to currentTime
            if (audioSwitch) {
              if (trackDetails.live && !trackDetails.PTSKnown) {
                _logger.logger.log('switching audiotrack, live stream, unknown PTS,load first fragment');
                bufferEnd = 0;
              } else {
                bufferEnd = pos;
                // if currentTime (pos) is less than alt audio playlist start time, it means that alt audio is ahead of currentTime
                if (trackDetails.PTSKnown && pos < start) {
                  // if everything is buffered from pos to start or if audio buffer upfront, let's seek to start
                  if (bufferInfo.end > start || bufferInfo.nextStart) {
                    _logger.logger.log('alt audio track ahead of main track, seek to start of alt audio track');
                    this.media.currentTime = start + 0.05;
                  } else {
                    return;
                  }
                }
              }
            }
            if (trackDetails.initSegment && !trackDetails.initSegment.data) {
              frag = trackDetails.initSegment;
            }
            // if bufferEnd before start of playlist, load first fragment
            else if (bufferEnd <= start) {
                frag = fragments[0];
                if (trackDetails.live && frag.loadIdx && frag.loadIdx === this.fragLoadIdx) {
                  // we just loaded this first fragment, and we are still lagging behind the start of the live playlist
                  // let's force seek to start
                  var nextBuffered = bufferInfo.nextStart ? bufferInfo.nextStart : start;
                  _logger.logger.log('no alt audio available @currentTime:' + this.media.currentTime + ', seeking @' + (nextBuffered + 0.05));
                  this.media.currentTime = nextBuffered + 0.05;
                  return;
                }
              } else {
                var foundFrag = void 0;
                var maxFragLookUpTolerance = config.maxFragLookUpTolerance;
                var fragNext = fragPrevious ? fragments[fragPrevious.sn - fragments[0].sn + 1] : undefined;
                var fragmentWithinToleranceTest = function fragmentWithinToleranceTest(candidate) {
                  // offset should be within fragment boundary - config.maxFragLookUpTolerance
                  // this is to cope with situations like
                  // bufferEnd = 9.991
                  // frag[Ø] : [0,10]
                  // frag[1] : [10,20]
                  // bufferEnd is within frag[0] range ... although what we are expecting is to return frag[1] here
                  //              frag start               frag start+duration
                  //                  |-----------------------------|
                  //              <--->                         <--->
                  //  ...--------><-----------------------------><---------....
                  // previous frag         matching fragment         next frag
                  //  return -1             return 0                 return 1
                  //logger.log(`level/sn/start/end/bufEnd:${level}/${candidate.sn}/${candidate.start}/${(candidate.start+candidate.duration)}/${bufferEnd}`);
                  // Set the lookup tolerance to be small enough to detect the current segment - ensures we don't skip over very small segments
                  var candidateLookupTolerance = Math.min(maxFragLookUpTolerance, candidate.duration);
                  if (candidate.start + candidate.duration - candidateLookupTolerance <= bufferEnd) {
                    return 1;
                  } // if maxFragLookUpTolerance will have negative value then don't return -1 for first element
                  else if (candidate.start - candidateLookupTolerance > bufferEnd && candidate.start) {
                      return -1;
                    }
                  return 0;
                };

                if (bufferEnd < end) {
                  if (bufferEnd > end - maxFragLookUpTolerance) {
                    maxFragLookUpTolerance = 0;
                  }
                  // Prefer the next fragment if it's within tolerance
                  if (fragNext && !fragmentWithinToleranceTest(fragNext)) {
                    foundFrag = fragNext;
                  } else {
                    foundFrag = _binarySearch2.default.search(fragments, fragmentWithinToleranceTest);
                  }
                } else {
                  // reach end of playlist
                  foundFrag = fragments[fragLen - 1];
                }
                if (foundFrag) {
                  frag = foundFrag;
                  start = foundFrag.start;
                  //logger.log('find SN matching with pos:' +  bufferEnd + ':' + frag.sn);
                  if (fragPrevious && frag.level === fragPrevious.level && frag.sn === fragPrevious.sn) {
                    if (frag.sn < trackDetails.endSN) {
                      frag = fragments[frag.sn + 1 - trackDetails.startSN];
                      _logger.logger.log('SN just loaded, load next one: ' + frag.sn);
                    } else {
                      frag = null;
                    }
                  }
                }
              }
            if (frag) {
              //logger.log('      loading frag ' + i +',pos/bufEnd:' + pos.toFixed(3) + '/' + bufferEnd.toFixed(3));
              if (frag.decryptdata && frag.decryptdata.uri != null && frag.decryptdata.key == null) {
                _logger.logger.log('Loading key for ' + frag.sn + ' of [' + trackDetails.startSN + ' ,' + trackDetails.endSN + '],track ' + trackId);
                this.state = State.KEY_LOADING;
                this.AVPLAYER.trigger(_events2.default.KEY_LOADING, { frag: frag });
              } else {
                _logger.logger.log('Loading ' + frag.sn + ' of [' + trackDetails.startSN + ' ,' + trackDetails.endSN + '],track ' + trackId + ', currentTime:' + pos + ',bufferEnd:' + bufferEnd.toFixed(3));
                // ensure that we are not reloading the same fragments in loop ...
                if (this.fragLoadIdx !== undefined) {
                  this.fragLoadIdx++;
                } else {
                  this.fragLoadIdx = 0;
                }
                if (frag.loadCounter) {
                  frag.loadCounter++;
                  var maxThreshold = config.fragLoadingLoopThreshold;
                  // if this frag has already been loaded 3 times, and if it has been reloaded recently
                  if (frag.loadCounter > maxThreshold && Math.abs(this.fragLoadIdx - frag.loadIdx) < maxThreshold) {
                    this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.FRAG_LOOP_LOADING_ERROR, fatal: false, frag: frag });
                    return;
                  }
                } else {
                  frag.loadCounter = 1;
                }
                frag.loadIdx = this.fragLoadIdx;
                this.fragCurrent = frag;
                this.startFragRequested = true;
                if (!isNaN(frag.sn)) {
                  this.nextLoadPosition = frag.start + frag.duration;
                }
                this.AVPLAYER.trigger(_events2.default.FRAG_LOADING, { frag: frag });
                this.state = State.FRAG_LOADING;
              }
            }
          }
          break;
        case State.WAITING_TRACK:
          track = this.tracks[this.trackId];
          // check if playlist is already loaded
          if (track && track.details) {
            this.state = State.IDLE;
          }
          break;
        case State.FRAG_LOADING_WAITING_RETRY:
          var now = performance.now();
          var retryDate = this.retryDate;
          media = this.media;
          var isSeeking = media && media.seeking;
          // if current time is gt than retryDate, or if media seeking let's switch to IDLE state to retry loading
          if (!retryDate || now >= retryDate || isSeeking) {
            _logger.logger.log('audioStreamController: retryDate reached, switch back to IDLE state');
            this.state = State.IDLE;
          }
          break;
        case State.WAITING_INIT_PTS:
        case State.STOPPED:
        case State.FRAG_LOADING:
        case State.PARSING:
        case State.PARSED:
        case State.ENDED:
          break;
        default:
          break;
      }
    }
  }, {
    key: 'onMediaAttached',
    value: function onMediaAttached(data) {
      var media = this.media = this.mediaBuffer = data.media;
      this.onvseeking = this.onMediaSeeking.bind(this);
      this.onvended = this.onMediaEnded.bind(this);
      media.addEventListener('seeking', this.onvseeking);
      media.addEventListener('ended', this.onvended);
      var config = this.config;
      if (this.tracks && config.autoStartLoad) {
        this.startLoad(config.startPosition);
      }
    }
  }, {
    key: 'onMediaDetaching',
    value: function onMediaDetaching() {
      var media = this.media;
      if (media && media.ended) {
        _logger.logger.log('MSE detaching and video ended, reset startPosition');
        this.startPosition = this.lastCurrentTime = 0;
      }

      // reset fragment loading counter on MSE detaching to avoid reporting FRAG_LOOP_LOADING_ERROR after error recovery
      var tracks = this.tracks;
      if (tracks) {
        // reset fragment load counter
        tracks.forEach(function (track) {
          if (track.details) {
            track.details.fragments.forEach(function (fragment) {
              fragment.loadCounter = undefined;
            });
          }
        });
      }
      // remove video listeners
      if (media) {
        media.removeEventListener('seeking', this.onvseeking);
        media.removeEventListener('ended', this.onvended);
        this.onvseeking = this.onvseeked = this.onvended = null;
      }
      this.media = this.mediaBuffer = null;
      this.loadedmetadata = false;
      this.stopLoad();
    }
  }, {
    key: 'onMediaSeeking',
    value: function onMediaSeeking() {
      if (this.state === State.ENDED) {
        // switch to IDLE state to check for potential new fragment
        this.state = State.IDLE;
      }
      if (this.media) {
        this.lastCurrentTime = this.media.currentTime;
      }
      // avoid reporting fragment loop loading error in case user is seeking several times on same position
      if (this.fragLoadIdx !== undefined) {
        this.fragLoadIdx += 2 * this.config.fragLoadingLoopThreshold;
      }
      // tick to speed up processing
      this.tick();
    }
  }, {
    key: 'onMediaEnded',
    value: function onMediaEnded() {
      // reset startPosition and lastCurrentTime to restart playback @ stream beginning
      this.startPosition = this.lastCurrentTime = 0;
    }
  }, {
    key: 'onAudioTracksUpdated',
    value: function onAudioTracksUpdated(data) {
      _logger.logger.log('audio tracks updated');
      this.tracks = data.audioTracks;
    }
  }, {
    key: 'onAudioTrackSwitching',
    value: function onAudioTrackSwitching(data) {
      // if any URL found on new audio track, it is an alternate audio track
      var altAudio = !!data.url;
      this.trackId = data.id;
      this.state = State.IDLE;

      this.fragCurrent = null;
      this.state = State.PAUSED;
      this.waitingFragment = null;
      // destroy useless demuxer when switching audio to main
      if (!altAudio) {
        if (this.demuxer) {
          this.demuxer.destroy();
          this.demuxer = null;
        }
      } else {
        // switching to audio track, start timer if not already started
        if (!this.timer) {
          this.timer = setInterval(this.ontick, 100);
        }
      }

      //should we switch tracks ?
      if (altAudio) {
        this.audioSwitch = true;
        //main audio track are handled by stream-controller, just do something if switching to alt audio track
        this.state = State.IDLE;
        // increase fragment load Index to avoid frag loop loading error after buffer flush
        if (this.fragLoadIdx !== undefined) {
          this.fragLoadIdx += 2 * this.config.fragLoadingLoopThreshold;
        }
      }
      this.tick();
    }
  }, {
    key: 'onAudioTrackLoaded',
    value: function onAudioTrackLoaded(data) {
      var newDetails = data.details,
          trackId = data.id,
          track = this.tracks[trackId],
          duration = newDetails.totalduration,
          sliding = 0;

      _logger.logger.log('track ' + trackId + ' loaded [' + newDetails.startSN + ',' + newDetails.endSN + '],duration:' + duration);

      if (newDetails.live) {
        var curDetails = track.details;
        if (curDetails && newDetails.fragments.length > 0) {
          // we already have details for that level, merge them
          _levelHelper2.default.mergeDetails(curDetails, newDetails);
          sliding = newDetails.fragments[0].start;
          // TODO
          //this.liveSyncPosition = this.computeLivePosition(sliding, curDetails);
          if (newDetails.PTSKnown) {
            _logger.logger.log('live audio playlist sliding:' + sliding.toFixed(3));
          } else {
            _logger.logger.log('live audio playlist - outdated PTS, unknown sliding');
          }
        } else {
          newDetails.PTSKnown = false;
          _logger.logger.log('live audio playlist - first load, unknown sliding');
        }
      } else {
        newDetails.PTSKnown = false;
      }
      track.details = newDetails;

      // compute start position
      if (!this.startFragRequested) {
        // compute start position if set to -1. use it straight away if value is defined
        if (this.startPosition === -1) {
          // first, check if start time offset has been set in playlist, if yes, use this value
          var startTimeOffset = newDetails.startTimeOffset;
          if (!isNaN(startTimeOffset)) {
            _logger.logger.log('start time offset found in playlist, adjust startPosition to ' + startTimeOffset);
            this.startPosition = startTimeOffset;
          } else {
            this.startPosition = 0;
          }
        }
        this.nextLoadPosition = this.startPosition;
      }
      // only switch batck to IDLE state if we were waiting for track to start downloading a new fragment
      if (this.state === State.WAITING_TRACK) {
        this.state = State.IDLE;
      }
      //trigger handler right now
      this.tick();
    }
  }, {
    key: 'onKeyLoaded',
    value: function onKeyLoaded() {
      if (this.state === State.KEY_LOADING) {
        this.state = State.IDLE;
        this.tick();
      }
    }
  }, {
    key: 'onFragLoaded',
    value: function onFragLoaded(data) {
      var fragCurrent = this.fragCurrent,
          fragLoaded = data.frag;
      if (this.state === State.FRAG_LOADING && fragCurrent && fragLoaded.type === 'audio' && fragLoaded.level === fragCurrent.level && fragLoaded.sn === fragCurrent.sn) {
        var track = this.tracks[this.trackId],
            details = track.details,
            duration = details.totalduration,
            trackId = fragCurrent.level,
            sn = fragCurrent.sn,
            cc = fragCurrent.cc,
            audioCodec = this.config.defaultAudioCodec || track.audioCodec || 'mp4a.40.2',
            stats = this.stats = data.stats;
        if (sn === 'initSegment') {
          this.state = State.IDLE;

          stats.tparsed = stats.tbuffered = performance.now();
          details.initSegment.data = data.payload;
          this.AVPLAYER.trigger(_events2.default.FRAG_BUFFERED, { stats: stats, frag: fragCurrent, id: 'audio' });
          this.tick();
        } else {
          this.state = State.PARSING;
          // transmux the MPEG-TS data to ISO-BMFF segments
          this.appended = false;
          if (!this.demuxer) {
            this.demuxer = new _demuxer2.default(this.AVPLAYER, 'audio');
          }
          //Check if we have video initPTS
          // If not we need to wait for it
          var initPTS = this.initPTS[cc];
          var initSegmentData = details.initSegment ? details.initSegment.data : [];
          if (initSegmentData || initPTS !== undefined) {
            this.pendingBuffering = true;
            _logger.logger.log('Demuxing ' + sn + ' of [' + details.startSN + ' ,' + details.endSN + '],track ' + trackId);
            // time Offset is accurate if level PTS is known, or if playlist is not sliding (not live)
            var accurateTimeOffset = false; //details.PTSKnown || !details.live;
            this.demuxer.push(data.payload, initSegmentData, audioCodec, null, fragCurrent, duration, accurateTimeOffset, initPTS);
          } else {
            _logger.logger.log('unknown video PTS for continuity counter ' + cc + ', waiting for video PTS before demuxing audio frag ' + sn + ' of [' + details.startSN + ' ,' + details.endSN + '],track ' + trackId);
            this.waitingFragment = data;
            this.state = State.WAITING_INIT_PTS;
          }
        }
      }
      this.fragLoadError = 0;
    }
  }, {
    key: 'onFragParsingInitSegment',
    value: function onFragParsingInitSegment(data) {
      var fragCurrent = this.fragCurrent;
      var fragNew = data.frag;
      if (fragCurrent && data.id === 'audio' && fragNew.sn === fragCurrent.sn && fragNew.level === fragCurrent.level && this.state === State.PARSING) {
        var tracks = data.tracks,
            track = void 0;

        // delete any video track found on audio demuxer
        if (tracks.video) {
          delete tracks.video;
        }

        // include levelCodec in audio and video tracks
        track = tracks.audio;
        if (track) {
          track.levelCodec = 'mp4a.40.2';
          track.id = data.id;
          this.AVPLAYER.trigger(_events2.default.BUFFER_CODECS, tracks);
          _logger.logger.log('audio track:audio,container:' + track.container + ',codecs[level/parsed]=[' + track.levelCodec + '/' + track.codec + ']');
          var initSegment = track.initSegment;
          if (initSegment) {
            var appendObj = { type: 'audio', data: initSegment, parent: 'audio', content: 'initSegment' };
            if (this.audioSwitch) {
              this.pendingData = [appendObj];
            } else {
              this.appended = true;
              // arm pending Buffering flag before appending a segment
              this.pendingBuffering = true;
              this.AVPLAYER.trigger(_events2.default.BUFFER_APPENDING, appendObj);
            }
          }
          //trigger handler right now
          this.tick();
        }
      }
    }
  }, {
    key: 'onFragParsingData',
    value: function onFragParsingData(data) {
      var _this2 = this;

      var fragCurrent = this.fragCurrent;
      var fragNew = data.frag;
      if (fragCurrent && data.id === 'audio' && data.type === 'audio' && fragNew.sn === fragCurrent.sn && fragNew.level === fragCurrent.level && this.state === State.PARSING) {
        var trackId = this.trackId,
            track = this.tracks[trackId],
            hls = this.AVPLAYER;

        if (isNaN(data.endPTS)) {
          data.endPTS = data.startPTS + fragCurrent.duration;
          data.endDTS = data.startDTS + fragCurrent.duration;
        }

        _logger.logger.log('parsed ' + data.type + ',PTS:[' + data.startPTS.toFixed(3) + ',' + data.endPTS.toFixed(3) + '],DTS:[' + data.startDTS.toFixed(3) + '/' + data.endDTS.toFixed(3) + '],nb:' + data.nb);
        _levelHelper2.default.updateFragPTSDTS(track.details, fragCurrent.sn, data.startPTS, data.endPTS);

        var audioSwitch = this.audioSwitch,
            media = this.media,
            appendOnBufferFlush = false;
        //Only flush audio from old audio tracks when PTS is known on new audio track
        if (audioSwitch && media) {
          if (media.readyState) {
            var currentTime = media.currentTime;
            _logger.logger.log('switching audio track : currentTime:' + currentTime);
            if (currentTime >= data.startPTS) {
              _logger.logger.log('switching audio track : flushing all audio');
              this.state = State.BUFFER_FLUSHING;
              this.AVPLAYER.trigger(_events2.default.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: 'audio' });
              appendOnBufferFlush = true;
              //Lets announce that the initial audio track switch flush occur
              this.audioSwitch = false;
              this.AVPLAYER.trigger(_events2.default.AUDIO_TRACK_SWITCHED, { id: trackId });
            }
          } else {
            //Lets announce that the initial audio track switch flush occur
            this.audioSwitch = false;
            this.AVPLAYER.trigger(_events2.default.AUDIO_TRACK_SWITCHED, { id: trackId });
          }
        }

        var pendingData = this.pendingData;
        if (!this.audioSwitch) {
          [data.data1, data.data2].forEach(function (buffer) {
            if (buffer && buffer.length) {
              pendingData.push({ type: data.type, data: buffer, parent: 'audio', content: 'data' });
            }
          });
          if (!appendOnBufferFlush && pendingData.length) {
            pendingData.forEach(function (appendObj) {
              // only append in PARSING state (rationale is that an appending error could happen synchronously on first segment appending)
              // in that case it is useless to append following segments
              if (_this2.state === State.PARSING) {
                // arm pending Buffering flag before appending a segment
                _this2.pendingBuffering = true;
                _this2.AVPLAYER.trigger(_events2.default.BUFFER_APPENDING, appendObj);
              }
            });
            this.pendingData = [];
            this.appended = true;
          }
        }
        //trigger handler right now
        this.tick();
      }
    }
  }, {
    key: 'onFragParsed',
    value: function onFragParsed(data) {
      var fragCurrent = this.fragCurrent;
      var fragNew = data.frag;
      if (fragCurrent && data.id === 'audio' && fragNew.sn === fragCurrent.sn && fragNew.level === fragCurrent.level && this.state === State.PARSING) {
        this.stats.tparsed = performance.now();
        this.state = State.PARSED;
        this._checkAppendedParsed();
      }
    }
  }, {
    key: 'onBufferCreated',
    value: function onBufferCreated(data) {
      var audioTrack = data.tracks.audio;
      if (audioTrack) {
        this.mediaBuffer = audioTrack.buffer;
        this.loadedmetadata = true;
      }
    }
  }, {
    key: 'onBufferAppended',
    value: function onBufferAppended(data) {
      if (data.parent === 'audio') {
        var state = this.state;
        if (state === State.PARSING || state === State.PARSED) {
          // check if all buffers have been appended
          this.pendingBuffering = data.pending > 0;
          this._checkAppendedParsed();
        }
      }
    }
  }, {
    key: '_checkAppendedParsed',
    value: function _checkAppendedParsed() {
      //trigger handler right now
      if (this.state === State.PARSED && (!this.appended || !this.pendingBuffering)) {
        var frag = this.fragCurrent,
            stats = this.stats,
            hls = this.AVPLAYER;
        if (frag) {
          this.fragPrevious = frag;
          stats.tbuffered = performance.now();
          this.AVPLAYER.trigger(_events2.default.FRAG_BUFFERED, { stats: stats, frag: frag, id: 'audio' });
          var media = this.mediaBuffer ? this.mediaBuffer : this.media;
          _logger.logger.log('audio buffered : ' + _timeRanges2.default.toString(media.buffered));
          if (this.audioSwitch && this.appended) {
            this.audioSwitch = false;
            this.AVPLAYER.trigger(_events2.default.AUDIO_TRACK_SWITCHED, { id: this.trackId });
          }
          this.state = State.IDLE;
        }
        this.tick();
      }
    }
  }, {
    key: 'onError',
    value: function onError(data) {
      var frag = data.frag;
      // don't handle frag error not related to audio fragment
      if (frag && frag.type !== 'audio') {
        return;
      }
      switch (data.details) {
        case _errors.ErrorDetails.FRAG_LOAD_ERROR:
        case _errors.ErrorDetails.FRAG_LOAD_TIMEOUT:
          if (!data.fatal) {
            var loadError = this.fragLoadError;
            if (loadError) {
              loadError++;
            } else {
              loadError = 1;
            }
            var config = this.config;
            if (loadError <= config.fragLoadingMaxRetry) {
              this.fragLoadError = loadError;
              // reset load counter to avoid frag loop loading error
              frag.loadCounter = 0;
              // exponential backoff capped to config.fragLoadingMaxRetryTimeout
              var delay = Math.min(Math.pow(2, loadError - 1) * config.fragLoadingRetryDelay, config.fragLoadingMaxRetryTimeout);
              _logger.logger.warn('audioStreamController: frag loading failed, retry in ' + delay + ' ms');
              this.retryDate = performance.now() + delay;
              // retry loading state
              this.state = State.FRAG_LOADING_WAITING_RETRY;
            } else {
              _logger.logger.error('audioStreamController: ' + data.details + ' reaches max retry, redispatch as fatal ...');
              // switch error to fatal
              data.fatal = true;
              this.state = State.ERROR;
            }
          }
          break;
        case _errors.ErrorDetails.FRAG_LOOP_LOADING_ERROR:
        case _errors.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
        case _errors.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
        case _errors.ErrorDetails.KEY_LOAD_ERROR:
        case _errors.ErrorDetails.KEY_LOAD_TIMEOUT:
          //  when in ERROR state, don't switch back to IDLE state in case a non-fatal error is received
          if (this.state !== State.ERROR) {
            // if fatal error, stop processing, otherwise move to IDLE to retry loading
            this.state = data.fatal ? State.ERROR : State.IDLE;
            _logger.logger.warn('audioStreamController: ' + data.details + ' while loading frag,switch to ' + this.state + ' state ...');
          }
          break;
        case _errors.ErrorDetails.BUFFER_FULL_ERROR:
          // if in appending state
          if (data.parent === 'audio' && (this.state === State.PARSING || this.state === State.PARSED)) {
            var media = this.mediaBuffer,
                currentTime = this.media.currentTime,
                mediaBuffered = media && _bufferHelper2.default.isBuffered(media, currentTime) && _bufferHelper2.default.isBuffered(media, currentTime + 0.5);
            // reduce max buf len if current position is buffered
            if (mediaBuffered) {
              var _config = this.config;
              if (_config.maxMaxBufferLength >= _config.maxBufferLength) {
                // reduce max buffer length as it might be too high. we do this to avoid loop flushing ...
                _config.maxMaxBufferLength /= 2;
                _logger.logger.warn('audio:reduce max buffer length to ' + _config.maxMaxBufferLength + 's');
                // increase fragment load Index to avoid frag loop loading error after buffer flush
                this.fragLoadIdx += 2 * _config.fragLoadingLoopThreshold;
              }
              this.state = State.IDLE;
            } else {
              // current position is not buffered, but browser is still complaining about buffer full error
              // this happens on IE/Edge, refer to https://github.com/dailymotion/hls.js/pull/708
              // in that case flush the whole audio buffer to recover
              _logger.logger.warn('buffer full error also media.currentTime is not buffered, flush audio buffer');
              this.fragCurrent = null;
              // flush everything
              this.state = State.BUFFER_FLUSHING;
              this.AVPLAYER.trigger(_events2.default.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: 'audio' });
            }
          }
          break;
        default:
          break;
      }
    }
  }, {
    key: 'onBufferFlushed',
    value: function onBufferFlushed() {
      var _this3 = this;

      var pendingData = this.pendingData;
      if (pendingData && pendingData.length) {
        _logger.logger.log('appending pending audio data on Buffer Flushed');
        pendingData.forEach(function (appendObj) {
          _this3.AVPLAYER.trigger(_events2.default.BUFFER_APPENDING, appendObj);
        });
        this.appended = true;
        this.pendingData = [];
        this.state = State.PARSED;
      } else {
        // move to IDLE once flush complete. this should trigger new fragment loading
        this.state = State.IDLE;
        // reset reference to frag
        this.fragPrevious = null;
        this.tick();
      }
    }
  }, {
    key: 'state',
    set: function set(nextState) {
      if (this.state !== nextState) {
        var previousState = this.state;
        this._state = nextState;
        _logger.logger.log('audio stream:' + previousState + '->' + nextState);
      }
    },
    get: function get() {
      return this._state;
    }
  }]);

  return AudioStreamController;
}(_eventHandler2.default);

exports.default = AudioStreamController;