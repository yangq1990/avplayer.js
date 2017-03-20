'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*  inline demuxer.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *   probe fragments and instantiate appropriate demuxer depending on content type (TSDemuxer, AACDemuxer, ...)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _errors = require('../../core/errors');

var _decrypter = require('../crypt/decrypter');

var _decrypter2 = _interopRequireDefault(_decrypter);

var _aacdemuxer = require('../demux/aacdemuxer');

var _aacdemuxer2 = _interopRequireDefault(_aacdemuxer);

var _mp4demuxer = require('../demux/mp4demuxer');

var _mp4demuxer2 = _interopRequireDefault(_mp4demuxer);

var _tsdemuxer = require('../demux/tsdemuxer');

var _tsdemuxer2 = _interopRequireDefault(_tsdemuxer);

var _mp4Remuxer = require('../remux/mp4-remuxer');

var _mp4Remuxer2 = _interopRequireDefault(_mp4Remuxer);

var _passthroughRemuxer = require('../remux/passthrough-remuxer');

var _passthroughRemuxer2 = _interopRequireDefault(_passthroughRemuxer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DemuxerInline = function () {
  function DemuxerInline(observer, typeSupported, config, vendor) {
    _classCallCheck(this, DemuxerInline);

    this.observer = observer;
    this.typeSupported = typeSupported;
    this.config = config;
    this.vendor = vendor;
  }

  _createClass(DemuxerInline, [{
    key: 'destroy',
    value: function destroy() {
      var demuxer = this.demuxer;
      if (demuxer) {
        demuxer.destroy();
      }
    }
  }, {
    key: 'push',
    value: function push(data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS) {
      if (data.byteLength > 0 && decryptdata != null && decryptdata.key != null && decryptdata.method === 'AES-128') {
        var decrypter = this.decrypter;
        if (decrypter == null) {
          decrypter = this.decrypter = new _decrypter2.default(this.observer, this.config);
        }
        var localthis = this;
        // performance.now() not available on WebWorker, at least on Safari Desktop
        var startTime;
        try {
          startTime = performance.now();
        } catch (error) {
          startTime = Date.now();
        }
        decrypter.decrypt(data, decryptdata.key.buffer, decryptdata.iv.buffer, function (decryptedData) {
          var endTime;
          try {
            endTime = performance.now();
          } catch (error) {
            endTime = Date.now();
          }
          localthis.observer.trigger(_events2.default.FRAG_DECRYPTED, { stats: { tstart: startTime, tdecrypt: endTime } });
          localthis.pushDecrypted(new Uint8Array(decryptedData), decryptdata, new Uint8Array(initSegment), audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
        });
      } else {
        this.pushDecrypted(new Uint8Array(data), decryptdata, new Uint8Array(initSegment), audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS);
      }
    }
  }, {
    key: 'pushDecrypted',
    value: function pushDecrypted(data, decryptdata, initSegment, audioCodec, videoCodec, timeOffset, discontinuity, trackSwitch, contiguous, duration, accurateTimeOffset, defaultInitPTS) {
      var demuxer = this.demuxer;
      if (!demuxer ||
      // in case of continuity change, we might switch from content type (AAC container to TS container for example)
      // so let's check that current demuxer is still valid
      discontinuity && !this.probe(data)) {
        var observer = this.observer;
        var typeSupported = this.typeSupported;
        var config = this.config;
        var muxConfig = [{ demux: _tsdemuxer2.default, remux: _mp4Remuxer2.default }, { demux: _aacdemuxer2.default, remux: _mp4Remuxer2.default }, { demux: _mp4demuxer2.default, remux: _passthroughRemuxer2.default }];

        // probe for content type
        for (var i in muxConfig) {
          var mux = muxConfig[i];
          var probe = mux.demux.probe;
          if (probe(data)) {
            var _remuxer = this.remuxer = new mux.remux(observer, config, typeSupported, this.vendor);
            demuxer = new mux.demux(observer, _remuxer, config, typeSupported);
            this.probe = probe;
            break;
          }
        }
        if (!demuxer) {
          observer.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.FRAG_PARSING_ERROR, fatal: true, reason: 'no demux matching with content found' });
          return;
        }
        this.demuxer = demuxer;
      }
      var remuxer = this.remuxer;

      if (discontinuity || trackSwitch) {
        demuxer.resetInitSegment(initSegment, audioCodec, videoCodec, duration);
        remuxer.resetInitSegment();
      }
      if (discontinuity) {
        demuxer.resetTimeStamp();
        remuxer.resetTimeStamp(defaultInitPTS);
      }
      if (typeof demuxer.setDecryptData === 'function') {
        demuxer.setDecryptData(decryptdata);
      }
      demuxer.append(data, timeOffset, contiguous, accurateTimeOffset);
    }
  }]);

  return DemuxerInline;
}();

exports.default = DemuxerInline;