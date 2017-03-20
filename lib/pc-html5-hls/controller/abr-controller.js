'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../../core/event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _bufferHelper = require('../helper/buffer-helper');

var _bufferHelper2 = _interopRequireDefault(_bufferHelper);

var _errors = require('../../core/errors');

var _logger = require('../../utils/logger');

var _ewmaBandwidthEstimator = require('../../utils/ewma-bandwidth-estimator');

var _ewmaBandwidthEstimator2 = _interopRequireDefault(_ewmaBandwidthEstimator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * simple ABR Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  - compute next level based on last fragment bw heuristics
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                *  - implement an abandon rules triggered if we have less than 2 frag buffered and if computed bw shows that we risk buffer stalling
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var AbrController = function (_EventHandler) {
  _inherits(AbrController, _EventHandler);

  function AbrController(AVPLAYER) {
    _classCallCheck(this, AbrController);

    var _this = _possibleConstructorReturn(this, (AbrController.__proto__ || Object.getPrototypeOf(AbrController)).call(this, AVPLAYER, _events2.default.FRAG_LOADING, _events2.default.FRAG_LOADED, _events2.default.FRAG_BUFFERED, _events2.default.ERROR));

    _this.lastLoadedFragLevel = 0;
    _this._nextAutoLevel = -1;
    _this.onCheck = _this._abandonRulesCheck.bind(_this);
    return _this;
  }

  _createClass(AbrController, [{
    key: 'destroy',
    value: function destroy() {
      this.clearTimer();
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onFragLoading',
    value: function onFragLoading(data) {
      var frag = data.frag;
      if (frag.type === 'main') {
        if (!this.timer) {
          this.timer = setInterval(this.onCheck, 100);
        }
        // lazy init of bw Estimator, rationale is that we use different params for Live/VoD
        // so we need to wait for stream manifest / playlist type to instantiate it.
        if (!this._bwEstimator) {
          var hls = this.AVPLAYER,
              level = data.frag.level,
              isLive = hls.levels[level].details.live,
              config = hls.config,
              ewmaFast = void 0,
              ewmaSlow = void 0;

          if (isLive) {
            ewmaFast = config.abrEwmaFastLive;
            ewmaSlow = config.abrEwmaSlowLive;
          } else {
            ewmaFast = config.abrEwmaFastVoD;
            ewmaSlow = config.abrEwmaSlowVoD;
          }
          this._bwEstimator = new _ewmaBandwidthEstimator2.default(hls, ewmaSlow, ewmaFast, config.abrEwmaDefaultEstimate);
        }
        this.fragCurrent = frag;
      }
    }
  }, {
    key: '_abandonRulesCheck',
    value: function _abandonRulesCheck() {
      /*
        monitor fragment retrieval time...
        we compute expected time of arrival of the complete fragment.
        we compare it to expected time of buffer starvation
      */
      var hls = this.AVPLAYER,
          v = hls.media,
          frag = this.fragCurrent,
          loader = frag.loader,
          minAutoLevel = hls.minAutoLevel;

      // if loader has been destroyed or loading has been aborted, stop timer and return
      if (!loader || loader.stats && loader.stats.aborted) {
        _logger.logger.warn('frag loader destroy or aborted, disarm abandonRules');
        this.clearTimer();
        return;
      }
      var stats = loader.stats;
      /* only monitor frag retrieval time if
      (video not paused OR first fragment being loaded(ready state === HAVE_NOTHING = 0)) AND autoswitching enabled AND not lowest level (=> means that we have several levels) */
      if (v && (!v.paused && v.playbackRate !== 0 || !v.readyState) && frag.autoLevel && frag.level) {
        var requestDelay = performance.now() - stats.trequest,
            playbackRate = Math.abs(v.playbackRate);
        // monitor fragment load progress after half of expected fragment duration,to stabilize bitrate
        if (requestDelay > 500 * frag.duration / playbackRate) {
          var levels = hls.levels,
              loadRate = Math.max(1, stats.bw ? stats.bw / 8 : stats.loaded * 1000 / requestDelay),
              // byte/s; at least 1 byte/s to avoid division by zero
          // compute expected fragment length using frag duration and level bitrate. also ensure that expected len is gte than already loaded size
          level = levels[frag.level],
              levelBitrate = level.realBitrate ? Math.max(level.realBitrate, level.bitrate) : level.bitrate,
              expectedLen = stats.total ? stats.total : Math.max(stats.loaded, Math.round(frag.duration * levelBitrate / 8)),
              pos = v.currentTime,
              fragLoadedDelay = (expectedLen - stats.loaded) / loadRate,
              bufferStarvationDelay = (_bufferHelper2.default.bufferInfo(v, pos, hls.config.maxBufferHole).end - pos) / playbackRate;
          // consider emergency switch down only if we have less than 2 frag buffered AND
          // time to finish loading current fragment is bigger than buffer starvation delay
          // ie if we risk buffer starvation if bw does not increase quickly
          if (bufferStarvationDelay < 2 * frag.duration / playbackRate && fragLoadedDelay > bufferStarvationDelay) {
            var fragLevelNextLoadedDelay = void 0,
                nextLoadLevel = void 0;
            // lets iterate through lower level and try to find the biggest one that could avoid rebuffering
            // we start from current level - 1 and we step down , until we find a matching level
            for (nextLoadLevel = frag.level - 1; nextLoadLevel > minAutoLevel; nextLoadLevel--) {
              // compute time to load next fragment at lower level
              // 0.8 : consider only 80% of current bw to be conservative
              // 8 = bits per byte (bps/Bps)
              var levelNextBitrate = levels[nextLoadLevel].realBitrate ? Math.max(levels[nextLoadLevel].realBitrate, levels[nextLoadLevel].bitrate) : levels[nextLoadLevel].bitrate;
              fragLevelNextLoadedDelay = frag.duration * levelNextBitrate / (8 * 0.8 * loadRate);
              if (fragLevelNextLoadedDelay < bufferStarvationDelay) {
                // we found a lower level that be rebuffering free with current estimated bw !
                break;
              }
            }
            // only emergency switch down if it takes less time to load new fragment at lowest level instead
            // of finishing loading current one ...
            if (fragLevelNextLoadedDelay < fragLoadedDelay) {
              _logger.logger.warn('loading too slow, abort fragment loading and switch to level ' + nextLoadLevel + ':fragLoadedDelay[' + nextLoadLevel + ']<fragLoadedDelay[' + (frag.level - 1) + '];bufferStarvationDelay:' + fragLevelNextLoadedDelay.toFixed(1) + '<' + fragLoadedDelay.toFixed(1) + ':' + bufferStarvationDelay.toFixed(1));
              // force next load level in auto mode
              hls.nextLoadLevel = nextLoadLevel;
              // update bw estimate for this fragment before cancelling load (this will help reducing the bw)
              this._bwEstimator.sample(requestDelay, stats.loaded);
              //abort fragment loading
              loader.abort();
              // stop abandon rules timer
              this.clearTimer();
              hls.trigger(_events2.default.FRAG_LOAD_EMERGENCY_ABORTED, { frag: frag, stats: stats });
            }
          }
        }
      }
    }
  }, {
    key: 'onFragLoaded',
    value: function onFragLoaded(data) {
      var frag = data.frag;
      if (frag.type === 'main' && !isNaN(frag.sn)) {
        // stop monitoring bw once frag loaded
        this.clearTimer();
        // store level id after successful fragment load
        this.lastLoadedFragLevel = frag.level;
        // reset forced auto level value so that next level will be selected
        this._nextAutoLevel = -1;

        // compute level average bitrate
        if (this.AVPLAYER.config.abrMaxWithRealBitrate) {
          var level = this.AVPLAYER.levels[frag.level];
          var loadedBytes = (level.loaded ? level.loaded.bytes : 0) + data.stats.loaded;
          var loadedDuration = (level.loaded ? level.loaded.duration : 0) + data.frag.duration;
          level.loaded = { bytes: loadedBytes, duration: loadedDuration };
          level.realBitrate = Math.round(8 * loadedBytes / loadedDuration);
        }
        // if fragment has been loaded to perform a bitrate test,
        if (data.frag.bitrateTest) {
          var stats = data.stats;
          stats.tparsed = stats.tbuffered = stats.tload;
          this.onFragBuffered(data);
        }
      }
    }
  }, {
    key: 'onFragBuffered',
    value: function onFragBuffered(data) {
      var stats = data.stats,
          frag = data.frag;
      // only update stats on first frag buffering
      // if same frag is loaded multiple times, it might be in browser cache, and loaded quickly
      // and leading to wrong bw estimation
      // on bitrate test, also only update stats once (if tload = tbuffered == on FRAG_LOADED)
      if (stats.aborted !== true && frag.loadCounter === 1 && frag.type === 'main' && !isNaN(frag.sn) && (!frag.bitrateTest || stats.tload === stats.tbuffered)) {
        // use tparsed-trequest instead of tbuffered-trequest to compute fragLoadingProcessing; rationale is that  buffer appending only happens once media is attached
        // in case we use config.startFragPrefetch while media is not attached yet, fragment might be parsed while media not attached yet, but it will only be buffered on media attached
        // as a consequence it could happen really late in the process. meaning that appending duration might appears huge ... leading to underestimated throughput estimation
        var fragLoadingProcessingMs = stats.tparsed - stats.trequest;
        _logger.logger.log('latency/loading/parsing/append/kbps:' + Math.round(stats.tfirst - stats.trequest) + '/' + Math.round(stats.tload - stats.tfirst) + '/' + Math.round(stats.tparsed - stats.tload) + '/' + Math.round(stats.tbuffered - stats.tparsed) + '/' + Math.round(8 * stats.loaded / (stats.tbuffered - stats.trequest)));
        this._bwEstimator.sample(fragLoadingProcessingMs, stats.loaded);
        // if fragment has been loaded to perform a bitrate test, (hls.startLevel = -1), store bitrate test delay duration
        if (frag.bitrateTest) {
          this.bitrateTestDelay = fragLoadingProcessingMs / 1000;
        } else {
          this.bitrateTestDelay = 0;
        }
      }
    }
  }, {
    key: 'onError',
    value: function onError(data) {
      // stop timer in case of frag loading error
      switch (data.details) {
        case _errors.ErrorDetails.FRAG_LOAD_ERROR:
        case _errors.ErrorDetails.FRAG_LOAD_TIMEOUT:
          this.clearTimer();
          break;
        default:
          break;
      }
    }
  }, {
    key: 'clearTimer',
    value: function clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    // return next auto level

  }, {
    key: '_findBestLevel',
    value: function _findBestLevel(currentLevel, currentFragDuration, currentBw, minAutoLevel, maxAutoLevel, maxFetchDuration, bwFactor, bwUpFactor, levels) {
      for (var i = maxAutoLevel; i >= minAutoLevel; i--) {
        var levelInfo = levels[i],
            levelDetails = levelInfo.details,
            avgDuration = levelDetails ? levelDetails.totalduration / levelDetails.fragments.length : currentFragDuration,
            live = levelDetails ? levelDetails.live : false,
            adjustedbw = void 0;
        // follow algorithm captured from stagefright :
        // https://android.googlesource.com/platform/frameworks/av/+/master/media/libstagefright/httplive/LiveSession.cpp
        // Pick the highest bandwidth stream below or equal to estimated bandwidth.
        // consider only 80% of the available bandwidth, but if we are switching up,
        // be even more conservative (70%) to avoid overestimating and immediately
        // switching back.
        if (i <= currentLevel) {
          adjustedbw = bwFactor * currentBw;
        } else {
          adjustedbw = bwUpFactor * currentBw;
        }
        var bitrate = levels[i].realBitrate ? Math.max(levels[i].realBitrate, levels[i].bitrate) : levels[i].bitrate,
            fetchDuration = bitrate * avgDuration / adjustedbw;

        _logger.logger.trace('level/adjustedbw/bitrate/avgDuration/maxFetchDuration/fetchDuration: ' + i + '/' + Math.round(adjustedbw) + '/' + bitrate + '/' + avgDuration + '/' + maxFetchDuration + '/' + fetchDuration);
        // if adjusted bw is greater than level bitrate AND
        if (adjustedbw > bitrate && (
        // fragment fetchDuration unknown OR live stream OR fragment fetchDuration less than max allowed fetch duration, then this level matches
        // we don't account for max Fetch Duration for live streams, this is to avoid switching down when near the edge of live sliding window ...
        !fetchDuration || live || fetchDuration < maxFetchDuration)) {
          // as we are looping from highest to lowest, this will return the best achievable quality level

          return i;
        }
      }
      // not enough time budget even with quality level 0 ... rebuffering might happen
      return -1;
    }
  }, {
    key: 'nextAutoLevel',
    get: function get() {
      var forcedAutoLevel = this._nextAutoLevel;
      var bwEstimator = this._bwEstimator;
      // in case next auto level has been forced, and bw not available or not reliable, return forced value
      if (forcedAutoLevel !== -1 && (!bwEstimator || !bwEstimator.canEstimate())) {
        return forcedAutoLevel;
      }
      // compute next level using ABR logic
      var nextABRAutoLevel = this._nextABRAutoLevel;
      // if forced auto level has been defined, use it to cap ABR computed quality level
      if (forcedAutoLevel !== -1) {
        nextABRAutoLevel = Math.min(forcedAutoLevel, nextABRAutoLevel);
      }
      return nextABRAutoLevel;
    },
    set: function set(nextLevel) {
      this._nextAutoLevel = nextLevel;
    }
  }, {
    key: '_nextABRAutoLevel',
    get: function get() {
      var hls = this.AVPLAYER,
          maxAutoLevel = hls.maxAutoLevel,
          levels = hls.levels,
          config = hls.config,
          minAutoLevel = hls.minAutoLevel;
      var v = hls.media,
          currentLevel = this.lastLoadedFragLevel,
          currentFragDuration = this.fragCurrent ? this.fragCurrent.duration : 0,
          pos = v ? v.currentTime : 0,

      // playbackRate is the absolute value of the playback rate; if v.playbackRate is 0, we use 1 to load as
      // if we're playing back at the normal rate.
      playbackRate = v && v.playbackRate !== 0 ? Math.abs(v.playbackRate) : 1.0,
          avgbw = this._bwEstimator ? this._bwEstimator.getEstimate() : config.abrEwmaDefaultEstimate,

      // bufferStarvationDelay is the wall-clock time left until the playback buffer is exhausted.
      bufferStarvationDelay = (_bufferHelper2.default.bufferInfo(v, pos, config.maxBufferHole).end - pos) / playbackRate;

      // First, look to see if we can find a level matching with our avg bandwidth AND that could also guarantee no rebuffering at all
      var bestLevel = this._findBestLevel(currentLevel, currentFragDuration, avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay, config.abrBandWidthFactor, config.abrBandWidthUpFactor, levels);
      if (bestLevel >= 0) {
        return bestLevel;
      } else {
        _logger.logger.trace('rebuffering expected to happen, lets try to find a quality level minimizing the rebuffering');
        // not possible to get rid of rebuffering ... let's try to find level that will guarantee less than maxStarvationDelay of rebuffering
        // if no matching level found, logic will return 0
        var maxStarvationDelay = currentFragDuration ? Math.min(currentFragDuration, config.maxStarvationDelay) : config.maxStarvationDelay,
            bwFactor = config.abrBandWidthFactor,
            bwUpFactor = config.abrBandWidthUpFactor;
        if (bufferStarvationDelay === 0) {
          // in case buffer is empty, let's check if previous fragment was loaded to perform a bitrate test
          var bitrateTestDelay = this.bitrateTestDelay;
          if (bitrateTestDelay) {
            // if it is the case, then we need to adjust our max starvation delay using maxLoadingDelay config value
            // max video loading delay used in  automatic start level selection :
            // in that mode ABR controller will ensure that video loading time (ie the time to fetch the first fragment at lowest quality level +
            // the time to fetch the fragment at the appropriate quality level is less than ```maxLoadingDelay``` )
            // cap maxLoadingDelay and ensure it is not bigger 'than bitrate test' frag duration
            var maxLoadingDelay = currentFragDuration ? Math.min(currentFragDuration, config.maxLoadingDelay) : config.maxLoadingDelay;
            maxStarvationDelay = maxLoadingDelay - bitrateTestDelay;
            _logger.logger.trace('bitrate test took ' + Math.round(1000 * bitrateTestDelay) + 'ms, set first fragment max fetchDuration to ' + Math.round(1000 * maxStarvationDelay) + ' ms');
            // don't use conservative factor on bitrate test
            bwFactor = bwUpFactor = 1;
          }
        }
        bestLevel = this._findBestLevel(currentLevel, currentFragDuration, avgbw, minAutoLevel, maxAutoLevel, bufferStarvationDelay + maxStarvationDelay, bwFactor, bwUpFactor, levels);
        return Math.max(bestLevel, 0);
      }
    }
  }]);

  return AbrController;
}(_eventHandler2.default);

exports.default = AbrController;