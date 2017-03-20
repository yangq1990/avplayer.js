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

var _bufferHelper = require('../helper/buffer-helper');

var _bufferHelper2 = _interopRequireDefault(_bufferHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Level Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var LevelController = function (_EventHandler) {
  _inherits(LevelController, _EventHandler);

  function LevelController(AVPLAYER) {
    _classCallCheck(this, LevelController);

    var _this = _possibleConstructorReturn(this, (LevelController.__proto__ || Object.getPrototypeOf(LevelController)).call(this, AVPLAYER, _events2.default.MANIFEST_LOADED, _events2.default.LEVEL_LOADED, _events2.default.FRAG_LOADED, _events2.default.ERROR));

    _this.ontick = _this.tick.bind(_this);
    _this._manualLevel = -1;
    return _this;
  }

  _createClass(LevelController, [{
    key: 'destroy',
    value: function destroy() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this._manualLevel = -1;
    }
  }, {
    key: 'startLoad',
    value: function startLoad() {
      this.canload = true;
      var levels = this._levels;
      // clean up live level details to force reload them, and reset load errors
      if (levels) {
        levels.forEach(function (level) {
          level.loadError = 0;
          var levelDetails = level.details;
          if (levelDetails && levelDetails.live) {
            level.details = undefined;
          }
        });
      }
      // speed up live playlist refresh if timer exists
      if (this.timer) {
        this.tick();
      }
    }
  }, {
    key: 'stopLoad',
    value: function stopLoad() {
      this.canload = false;
    }
  }, {
    key: 'onManifestLoaded',
    value: function onManifestLoaded(data) {
      var levels0 = [],
          levels = [],
          bitrateStart,
          bitrateSet = {},
          videoCodecFound = false,
          audioCodecFound = false,
          hls = this.AVPLAYER,
          brokenmp4inmp3 = /chrome|firefox/.test(navigator.userAgent.toLowerCase()),
          checkSupported = function checkSupported(type, codec) {
        return MediaSource.isTypeSupported(type + '/mp4;codecs=' + codec);
      };

      // regroup redundant level together
      data.levels.forEach(function (level) {
        if (level.videoCodec) {
          videoCodecFound = true;
        }
        // erase audio codec info if browser does not support mp4a.40.34. demuxer will autodetect codec and fallback to mpeg/audio
        if (brokenmp4inmp3 && level.audioCodec && level.audioCodec.indexOf('mp4a.40.34') !== -1) {
          level.audioCodec = undefined;
        }
        if (level.audioCodec || level.attrs && level.attrs.AUDIO) {
          audioCodecFound = true;
        }
        var redundantLevelId = bitrateSet[level.bitrate];
        if (redundantLevelId === undefined) {
          bitrateSet[level.bitrate] = levels0.length;
          level.url = [level.url];
          level.urlId = 0;
          levels0.push(level);
        } else {
          levels0[redundantLevelId].url.push(level.url);
        }
      });

      // remove audio-only level if we also have levels with audio+video codecs signalled
      if (videoCodecFound && audioCodecFound) {
        levels0.forEach(function (level) {
          if (level.videoCodec) {
            levels.push(level);
          }
        });
      } else {
        levels = levels0;
      }
      // only keep level with supported audio/video codecs
      levels = levels.filter(function (level) {
        var audioCodec = level.audioCodec,
            videoCodec = level.videoCodec;
        return (!audioCodec || checkSupported('audio', audioCodec)) && (!videoCodec || checkSupported('video', videoCodec));
      });

      if (levels.length) {
        // start bitrate is the first bitrate of the manifest
        bitrateStart = levels[0].bitrate;
        // sort level on bitrate
        levels.sort(function (a, b) {
          return a.bitrate - b.bitrate;
        });
        this._levels = levels;
        // find index of first level in sorted levels
        for (var i = 0; i < levels.length; i++) {
          if (levels[i].bitrate === bitrateStart) {
            this._firstLevel = i;
            _logger.logger.log('manifest loaded,' + levels.length + ' level(s) found, first bitrate:' + bitrateStart);
            break;
          }
        }
        hls.trigger(_events2.default.MANIFEST_PARSED, { levels: levels, firstLevel: this._firstLevel, stats: data.stats, audio: audioCodecFound, video: videoCodecFound, altAudio: data.audioTracks.length > 0 });
      } else {
        hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR, fatal: true, url: hls.url, reason: 'no level with compatible codecs found in manifest' });
      }
      return;
    }
  }, {
    key: 'setLevelInternal',
    value: function setLevelInternal(newLevel) {
      var levels = this._levels;
      var hls = this.AVPLAYER;
      // check if level idx is valid
      if (newLevel >= 0 && newLevel < levels.length) {
        // stopping live reloading timer if any
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        if (this._level !== newLevel) {
          _logger.logger.log('switching to level ' + newLevel);
          this._level = newLevel;
          var levelProperties = levels[newLevel];
          levelProperties.level = newLevel;
          // LEVEL_SWITCH to be deprecated in next major release
          hls.trigger(_events2.default.LEVEL_SWITCH, levelProperties);
          hls.trigger(_events2.default.LEVEL_SWITCHING, levelProperties);
        }
        var level = levels[newLevel],
            levelDetails = level.details;
        // check if we need to load playlist for this level
        if (!levelDetails || levelDetails.live === true) {
          // level not retrieved yet, or live playlist we need to (re)load it
          var urlId = level.urlId;
          hls.trigger(_events2.default.LEVEL_LOADING, { url: level.url[urlId], level: newLevel, id: urlId });
        }
      } else {
        // invalid level id given, trigger error
        hls.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.OTHER_ERROR, details: _errors.ErrorDetails.LEVEL_SWITCH_ERROR, level: newLevel, fatal: false, reason: 'invalid level idx' });
      }
    }
  }, {
    key: 'onError',
    value: function onError(data) {
      if (data.fatal) {
        return;
      }

      var details = data.details,
          hls = this.AVPLAYER,
          levelId = void 0,
          level = void 0,
          levelError = false;
      // try to recover not fatal errors
      switch (details) {
        case _errors.ErrorDetails.FRAG_LOAD_ERROR:
        case _errors.ErrorDetails.FRAG_LOAD_TIMEOUT:
        case _errors.ErrorDetails.FRAG_LOOP_LOADING_ERROR:
        case _errors.ErrorDetails.KEY_LOAD_ERROR:
        case _errors.ErrorDetails.KEY_LOAD_TIMEOUT:
          levelId = data.frag.level;
          break;
        case _errors.ErrorDetails.LEVEL_LOAD_ERROR:
        case _errors.ErrorDetails.LEVEL_LOAD_TIMEOUT:
          levelId = data.context.level;
          levelError = true;
          break;
        case _errors.ErrorDetails.REMUX_ALLOC_ERROR:
          levelId = data.level;
          break;
        default:
          break;
      }
      /* try to switch to a redundant stream if any available.
       * if no redundant stream available, emergency switch down (if in auto mode and current level not 0)
       * otherwise, we cannot recover this network error ...
       */
      if (levelId !== undefined) {
        level = this._levels[levelId];
        if (!level.loadError) {
          level.loadError = 1;
        } else {
          level.loadError++;
        }
        // if any redundant streams available and if we haven't try them all (level.loadError is reseted on successful frag/level load.
        // if level.loadError reaches nbRedundantLevel it means that we tried them all, no hope  => let's switch down
        var nbRedundantLevel = level.url.length;
        if (nbRedundantLevel > 1 && level.loadError < nbRedundantLevel) {
          level.urlId = (level.urlId + 1) % nbRedundantLevel;
          level.details = undefined;
          _logger.logger.warn('level controller,' + details + ' for level ' + levelId + ': switching to redundant stream id ' + level.urlId);
        } else {
          // we could try to recover if in auto mode and current level not lowest level (0)
          var recoverable = this._manualLevel === -1 && levelId;
          if (recoverable) {
            _logger.logger.warn('level controller,' + details + ': switch-down for next fragment');
            hls.nextAutoLevel = Math.max(0, levelId - 1);
          } else if (level && level.details && level.details.live) {
            _logger.logger.warn('level controller,' + details + ' on live stream, discard');
            if (levelError) {
              // reset this._level so that another call to set level() will retrigger a frag load
              this._level = undefined;
            }
            // other errors are handled by stream controller
          } else if (details === _errors.ErrorDetails.LEVEL_LOAD_ERROR || details === _errors.ErrorDetails.LEVEL_LOAD_TIMEOUT) {
            var media = hls.media,

            // 0.5 : tolerance needed as some browsers stalls playback before reaching buffered end
            mediaBuffered = media && _bufferHelper2.default.isBuffered(media, media.currentTime) && _bufferHelper2.default.isBuffered(media, media.currentTime + 0.5);
            if (mediaBuffered) {
              var retryDelay = hls.config.levelLoadingRetryDelay;
              _logger.logger.warn('level controller,' + details + ', but media buffered, retry in ' + retryDelay + 'ms');
              this.timer = setTimeout(this.ontick, retryDelay);
            } else {
              _logger.logger.error('cannot recover ' + details + ' error');
              this._level = undefined;
              // stopping live reloading timer if any
              if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
              }
              // switch error to fatal
              data.fatal = true;
            }
          }
        }
      }
    }

    // reset level load error counter on successful frag loaded

  }, {
    key: 'onFragLoaded',
    value: function onFragLoaded(data) {
      var fragLoaded = data.frag;
      if (fragLoaded && fragLoaded.type === 'main') {
        var level = this._levels[fragLoaded.level];
        if (level) {
          level.loadError = 0;
        }
      }
    }
  }, {
    key: 'onLevelLoaded',
    value: function onLevelLoaded(data) {
      var levelId = data.level;
      // only process level loaded events matching with expected level
      if (levelId === this._level) {
        var curLevel = this._levels[levelId];
        // reset level load error counter on successful level loaded
        curLevel.loadError = 0;
        var newDetails = data.details;
        // if current playlist is a live playlist, arm a timer to reload it
        if (newDetails.live) {
          var reloadInterval = 1000 * (newDetails.averagetargetduration ? newDetails.averagetargetduration : newDetails.targetduration),
              curDetails = curLevel.details;
          if (curDetails && newDetails.endSN === curDetails.endSN) {
            // follow HLS Spec, If the client reloads a Playlist file and finds that it has not
            // changed then it MUST wait for a period of one-half the target
            // duration before retrying.
            reloadInterval /= 2;
            _logger.logger.log('same live playlist, reload twice faster');
          }
          // decrement reloadInterval with level loading delay
          reloadInterval -= performance.now() - data.stats.trequest;
          // in any case, don't reload more than every second
          reloadInterval = Math.max(1000, Math.round(reloadInterval));
          _logger.logger.log('live playlist, reload in ' + reloadInterval + ' ms');
          this.timer = setTimeout(this.ontick, reloadInterval);
        } else {
          this.timer = null;
        }
      }
    }
  }, {
    key: 'tick',
    value: function tick() {
      var levelId = this._level;
      if (levelId !== undefined && this.canload) {
        var level = this._levels[levelId],
            urlId = level.urlId;
        this.AVPLAYER.trigger(_events2.default.LEVEL_LOADING, { url: level.url[urlId], level: levelId, id: urlId });
      }
    }
  }, {
    key: 'levels',
    get: function get() {
      return this._levels;
    }
  }, {
    key: 'level',
    get: function get() {
      return this._level;
    },
    set: function set(newLevel) {
      var levels = this._levels;
      if (levels && levels.length > newLevel) {
        if (this._level !== newLevel || levels[newLevel].details === undefined) {
          this.setLevelInternal(newLevel);
        }
      }
    }
  }, {
    key: 'manualLevel',
    get: function get() {
      return this._manualLevel;
    },
    set: function set(newLevel) {
      this._manualLevel = newLevel;
      if (this._startLevel === undefined) {
        this._startLevel = newLevel;
      }
      if (newLevel !== -1) {
        this.level = newLevel;
      }
    }
  }, {
    key: 'firstLevel',
    get: function get() {
      return this._firstLevel;
    },
    set: function set(newLevel) {
      this._firstLevel = newLevel;
    }
  }, {
    key: 'startLevel',
    get: function get() {
      // hls.startLevel takes precedence over config.startLevel
      // if none of these values are defined, fallback on this._firstLevel (first quality level appearing in variant manifest)
      if (this._startLevel === undefined) {
        var configStartLevel = this.AVPLAYER.config.startLevel;
        if (configStartLevel !== undefined) {
          return configStartLevel;
        } else {
          return this._firstLevel;
        }
      } else {
        return this._startLevel;
      }
    },
    set: function set(newLevel) {
      this._startLevel = newLevel;
    }
  }, {
    key: 'nextLoadLevel',
    get: function get() {
      if (this._manualLevel !== -1) {
        return this._manualLevel;
      } else {
        return this.AVPLAYER.nextAutoLevel;
      }
    },
    set: function set(nextLevel) {
      this.level = nextLevel;
      if (this._manualLevel === -1) {
        this.AVPLAYER.nextAutoLevel = nextLevel;
      }
    }
  }]);

  return LevelController;
}(_eventHandler2.default);

exports.default = LevelController;