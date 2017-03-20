'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * passthrough remuxer
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */


var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PassThroughRemuxer = function () {
  function PassThroughRemuxer(observer) {
    _classCallCheck(this, PassThroughRemuxer);

    this.observer = observer;
  }

  _createClass(PassThroughRemuxer, [{
    key: 'destroy',
    value: function destroy() {}
  }, {
    key: 'resetTimeStamp',
    value: function resetTimeStamp() {}
  }, {
    key: 'resetInitSegment',
    value: function resetInitSegment() {}
  }, {
    key: 'remux',
    value: function remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset, contiguous, accurateTimeOffset, rawData) {
      var observer = this.observer;
      var streamType = '';
      if (audioTrack) {
        streamType += 'audio';
      }
      if (videoTrack) {
        streamType += 'video';
      }
      observer.trigger(_events2.default.FRAG_PARSING_DATA, {
        data1: rawData,
        startPTS: timeOffset,
        startDTS: timeOffset,
        type: streamType,
        nb: 1,
        dropped: 0
      });
      //notify end of parsing
      observer.trigger(_events2.default.FRAG_PARSED);
    }
  }]);

  return PassThroughRemuxer;
}();

exports.default = PassThroughRemuxer;