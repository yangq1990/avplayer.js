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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * FPS Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var FPSController = function (_EventHandler) {
  _inherits(FPSController, _EventHandler);

  function FPSController(AVPLAYER) {
    _classCallCheck(this, FPSController);

    return _possibleConstructorReturn(this, (FPSController.__proto__ || Object.getPrototypeOf(FPSController)).call(this, AVPLAYER, _events2.default.MEDIA_ATTACHING));
  }

  _createClass(FPSController, [{
    key: 'destroy',
    value: function destroy() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.isVideoPlaybackQualityAvailable = false;
    }
  }, {
    key: 'onMediaAttaching',
    value: function onMediaAttaching(data) {
      var config = this.AVPLAYER.config;
      if (config.capLevelOnFPSDrop) {
        var video = this.video = data.media instanceof HTMLVideoElement ? data.media : null;
        if (typeof video.getVideoPlaybackQuality === 'function') {
          this.isVideoPlaybackQualityAvailable = true;
        }
        clearInterval(this.timer);
        this.timer = setInterval(this.checkFPSInterval.bind(this), config.fpsDroppedMonitoringPeriod);
      }
    }
  }, {
    key: 'checkFPS',
    value: function checkFPS(video, decodedFrames, droppedFrames) {
      var currentTime = performance.now();
      if (decodedFrames) {
        if (this.lastTime) {
          var currentPeriod = currentTime - this.lastTime,
              currentDropped = droppedFrames - this.lastDroppedFrames,
              currentDecoded = decodedFrames - this.lastDecodedFrames,
              droppedFPS = 1000 * currentDropped / currentPeriod,
              hls = this.AVPLAYER;
          hls.trigger(_events2.default.FPS_DROP, { currentDropped: currentDropped, currentDecoded: currentDecoded, totalDroppedFrames: droppedFrames });
          if (droppedFPS > 0) {
            //logger.log('checkFPS : droppedFPS/decodedFPS:' + droppedFPS/(1000 * currentDecoded / currentPeriod));
            if (currentDropped > hls.config.fpsDroppedMonitoringThreshold * currentDecoded) {
              var currentLevel = hls.currentLevel;
              _logger.logger.warn('drop FPS ratio greater than max allowed value for currentLevel: ' + currentLevel);
              if (currentLevel > 0 && (hls.autoLevelCapping === -1 || hls.autoLevelCapping >= currentLevel)) {
                currentLevel = currentLevel - 1;
                hls.trigger(_events2.default.FPS_DROP_LEVEL_CAPPING, { level: currentLevel, droppedLevel: hls.currentLevel });
                hls.autoLevelCapping = currentLevel;
                hls.streamController.nextLevelSwitch();
              }
            }
          }
        }
        this.lastTime = currentTime;
        this.lastDroppedFrames = droppedFrames;
        this.lastDecodedFrames = decodedFrames;
      }
    }
  }, {
    key: 'checkFPSInterval',
    value: function checkFPSInterval() {
      var video = this.video;
      if (video) {
        if (this.isVideoPlaybackQualityAvailable) {
          var videoPlaybackQuality = video.getVideoPlaybackQuality();
          this.checkFPS(video, videoPlaybackQuality.totalVideoFrames, videoPlaybackQuality.droppedVideoFrames);
        } else {
          this.checkFPS(video, video.webkitDecodedFrameCount, video.webkitDroppedFrameCount);
        }
      }
    }
  }]);

  return FPSController;
}(_eventHandler2.default);

exports.default = FPSController;