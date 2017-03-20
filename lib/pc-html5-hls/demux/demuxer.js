'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _demuxerInline = require('../demux/demuxer-inline');

var _demuxerInline2 = _interopRequireDefault(_demuxerInline);

var _demuxerWorker = require('../demux/demuxer-worker');

var _demuxerWorker2 = _interopRequireDefault(_demuxerWorker);

var _logger = require('../../utils/logger');

var _avlog = require('../../utils/avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

var _commonFunctions = require('../../utils/common-functions.js');

var _errors = require('../../core/errors');

var _events3 = require('events');

var _events4 = _interopRequireDefault(_events3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Demuxer = function () {
  function Demuxer(AVPLAYER, id) {
    _classCallCheck(this, Demuxer);

    this.AVPLAYER = AVPLAYER;
    this.id = id;
    // observer setup
    var observer = this.observer = new _events4.default();
    var config = AVPLAYER.config;
    observer.trigger = function trigger(event) {
      for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        data[_key - 1] = arguments[_key];
      }

      observer.emit.apply(observer, [event, event].concat(data));
    };

    observer.off = function off(event) {
      for (var _len2 = arguments.length, data = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        data[_key2 - 1] = arguments[_key2];
      }

      observer.removeListener.apply(observer, [event].concat(data));
    };

    var forwardMessage = function (ev, data) {
      data = data || {};
      data.frag = this.frag;
      data.id = this.id;
      AVPLAYER.trigger(ev, data);
    }.bind(this);

    // forward events to main thread
    observer.on(_events2.default.FRAG_DECRYPTED, forwardMessage);
    observer.on(_events2.default.FRAG_PARSING_INIT_SEGMENT, forwardMessage);
    observer.on(_events2.default.FRAG_PARSING_DATA, forwardMessage);
    observer.on(_events2.default.FRAG_PARSED, forwardMessage);
    observer.on(_events2.default.ERROR, forwardMessage);
    observer.on(_events2.default.FRAG_PARSING_METADATA, forwardMessage);
    observer.on(_events2.default.FRAG_PARSING_USERDATA, forwardMessage);
    observer.on(_events2.default.INIT_PTS_FOUND, forwardMessage);

    var typeSupported = {
      mp4: MediaSource.isTypeSupported('video/mp4'),
      mpeg: MediaSource.isTypeSupported('audio/mpeg'),
      mp3: MediaSource.isTypeSupported('audio/mp4; codecs="mp3"')
    };
    // navigator.vendor is not always available in Web Worker
    // refer to https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/navigator
    var vendor = navigator.vendor;
    if (config.enableWorker && typeof Worker !== 'undefined') {
      _avlog2.default.print('demuxing in webworker');
      var w = void 0;
      try {
        var work = require('webworkify');
        w = this.w = work(_demuxerWorker2.default);
        this.onwmsg = this.onWorkerMessage.bind(this);
        w.addEventListener('message', this.onwmsg);
        w.onerror = function (event) {
          AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.OTHER_ERROR, details: _errors.ErrorDetails.INTERNAL_EXCEPTION, fatal: true, event: 'demuxerWorker', err: { message: event.message + ' (' + event.filename + ':' + event.lineno + ')' } });
        };
        w.postMessage({ cmd: 'init', typeSupported: typeSupported, vendor: vendor, id: id, config: JSON.stringify(config) });
      } catch (err) {
        _avlog2.default.print('error while initializing DemuxerWorker, fallback on DemuxerInline');
        if (w) {
          // revoke the Object URL that was used to create demuxer worker, so as not to leak it
          URL.revokeObjectURL(w.objectURL);
        }
        this.demuxer = new _demuxerInline2.default(observer, typeSupported, config, vendor);
        this.w = undefined;
      }
    } else {
      this.demuxer = new _demuxerInline2.default(observer, typeSupported, config, vendor);
    }
  }

  _createClass(Demuxer, [{
    key: 'destroy',
    value: function destroy() {
      var w = this.w;
      if (w) {
        w.removeEventListener('message', this.onwmsg);
        w.terminate();
        this.w = null;
      } else {
        var demuxer = this.demuxer;
        if (demuxer) {
          demuxer.destroy();
          this.demuxer = null;
        }
      }
      var observer = this.observer;
      if (observer) {
        observer.removeAllListeners();
        this.observer = null;
      }
    }
  }, {
    key: 'push',
    value: function push(data, initSegment, audioCodec, videoCodec, frag, duration, accurateTimeOffset, defaultInitPTS) {
      this._demux_remux_start = performance.now();

      var w = this.w;
      var timeOffset = !isNaN(frag.startDTS) ? frag.startDTS : frag.start;
      var decryptdata = frag.decryptdata;
      var lastFrag = this.frag;
      var discontinuity = !(lastFrag && frag.cc === lastFrag.cc);
      var trackSwitch = !(lastFrag && frag.level === lastFrag.level);
      var nextSN = lastFrag && frag.sn === lastFrag.sn + 1;
      var contiguous = !discontinuity && !trackSwitch && nextSN;
      if (discontinuity) {
        _logger.logger.log(this.id + ':discontinuity detected');
      }
      if (trackSwitch) {
        _logger.logger.log(this.id + ':switch detected');
      }
      this.frag = frag;
      if (w) {
        // post fragment payload as transferable objects (no copy)
        w.postMessage({ cmd: 'demux', data: data, decryptdata: decryptdata, initSegment: initSegment, audioCodec: audioCodec, videoCodec: videoCodec, timeOffset: timeOffset, discontinuity: discontinuity, trackSwitch: trackSwitch, contiguous: contiguous, duration: duration, accurateTimeOffset: accurateTimeOffset, defaultInitPTS: defaultInitPTS }, [data]);
      } else {
        var demuxer = this.demuxer;
        if (demuxer) {
          demuxer.push(data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
        }
      }
    }
  }, {
    key: 'onWorkerMessage',
    value: function onWorkerMessage(ev) {
      var data = ev.data;
      //console.log('onWorkerMessage:' + data.event);
      switch (data.event) {
        case 'init':
          // revoke the Object URL that was used to create demuxer worker, so as not to leak it
          URL.revokeObjectURL(this.w.objectURL);
          break;
        // special case for FRAG_PARSING_DATA: data1 and data2 are transferable objects
        case _events2.default.FRAG_PARSING_DATA:
          data.data.data1 = new Uint8Array(data.data1);
          if (data.data2) {
            data.data.data2 = new Uint8Array(data.data2);
          }
        /* falls through */
        default:
          if (data.event === _events2.default.FRAG_PARSED) {
            //yangq
            _avlog2.default.print('demux_remux \u7B2C' + this.frag.sn + '\u7247ts \u8017\u65F6 ' + (0, _commonFunctions.toFixed)(performance.now() - this._demux_remux_start) + ' ms');
          }

          data.data = data.data || {};
          data.data.frag = this.frag;
          data.data.id = this.id;
          this.AVPLAYER.trigger(data.event, data.data);
          break;
      }
    }
  }]);

  return Demuxer;
}();

exports.default = Demuxer;