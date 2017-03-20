/**
 * AVPlayer config
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
      value: true
});
exports.AVPlayerDefaultConfig = undefined;

var _abrController = require('./pc-html5-hls/controller/abr-controller');

var _abrController2 = _interopRequireDefault(_abrController);

var _bufferController = require('./pc-html5-hls/controller/buffer-controller');

var _bufferController2 = _interopRequireDefault(_bufferController);

var _capLevelController = require('./pc-html5-hls/controller/cap-level-controller');

var _capLevelController2 = _interopRequireDefault(_capLevelController);

var _fpsController = require('./pc-html5-hls/controller/fps-controller');

var _fpsController2 = _interopRequireDefault(_fpsController);

var _xhrLoader = require('./utils/xhr-loader');

var _xhrLoader2 = _interopRequireDefault(_xhrLoader);

var _audioTrackController = require('./pc-html5-hls/controller/audio-track-controller');

var _audioTrackController2 = _interopRequireDefault(_audioTrackController);

var _audioStreamController = require('./pc-html5-hls/controller/audio-stream-controller');

var _audioStreamController2 = _interopRequireDefault(_audioStreamController);

var _cues = require('./utils/cues');

var _cues2 = _interopRequireDefault(_cues);

var _timelineController = require('./pc-html5-hls/controller/timeline-controller');

var _timelineController2 = _interopRequireDefault(_timelineController);

var _subtitleTrackController = require('./pc-html5-hls/controller/subtitle-track-controller');

var _subtitleTrackController2 = _interopRequireDefault(_subtitleTrackController);

var _subtitleStreamController = require('./pc-html5-hls/controller/subtitle-stream-controller');

var _subtitleStreamController2 = _interopRequireDefault(_subtitleStreamController);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//#endif

//#endif

//#if subtitle

//import FetchLoader from './utils/fetch-loader';
//#if altaudio
var AVPlayerDefaultConfig = exports.AVPlayerDefaultConfig = {
      autoStartLoad: true, // used by stream-controller
      startPosition: -1, // used by stream-controller
      defaultAudioCodec: undefined, // used by stream-controller
      debug: false, // used by logger
      capLevelOnFPSDrop: false, // used by fps-controller
      capLevelToPlayerSize: false, // used by cap-level-controller
      initialLiveManifestSize: 1, // used by stream-controller
      maxBufferLength: 30, // used by stream-controller
      maxBufferSize: 60 * 1000 * 1000, // used by stream-controller
      maxBufferHole: 0.5, // used by stream-controller
      maxSeekHole: 2, // used by stream-controller
      lowBufferWatchdogPeriod: 0.5, // used by stream-controller
      highBufferWatchdogPeriod: 3, // used by stream-controller
      nudgeOffset: 0.1, // used by stream-controller
      nudgeMaxRetry: 3, // used by stream-controller
      maxFragLookUpTolerance: 0.2, // used by stream-controller
      liveSyncDurationCount: 3, // used by stream-controller
      liveMaxLatencyDurationCount: Infinity, // used by stream-controller
      liveSyncDuration: undefined, // used by stream-controller
      liveMaxLatencyDuration: undefined, // used by stream-controller
      maxMaxBufferLength: 600, // used by stream-controller
      enableWorker: true, // used by demuxer
      enableSoftwareAES: true, // used by decrypter
      manifestLoadingTimeOut: 10000, // used by playlist-loader
      manifestLoadingMaxRetry: 1, // used by playlist-loader
      manifestLoadingRetryDelay: 1000, // used by playlist-loader
      manifestLoadingMaxRetryTimeout: 64000, // used by playlist-loader
      startLevel: undefined, // used by level-controller
      levelLoadingTimeOut: 10000, // used by playlist-loader
      levelLoadingMaxRetry: 4, // used by playlist-loader
      levelLoadingRetryDelay: 1000, // used by playlist-loader
      levelLoadingMaxRetryTimeout: 64000, // used by playlist-loader
      fragLoadingTimeOut: 20000, // used by fragment-loader
      fragLoadingMaxRetry: 6, // used by fragment-loader
      fragLoadingRetryDelay: 1000, // used by fragment-loader
      fragLoadingMaxRetryTimeout: 64000, // used by fragment-loader
      fragLoadingLoopThreshold: 3, // used by stream-controller
      startFragPrefetch: false, // used by stream-controller
      fpsDroppedMonitoringPeriod: 5000, // used by fps-controller
      fpsDroppedMonitoringThreshold: 0.2, // used by fps-controller
      appendErrorMaxRetry: 3, // used by buffer-controller
      loader: _xhrLoader2.default,
      //loader: FetchLoader,
      fLoader: undefined,
      pLoader: undefined,
      xhrSetup: undefined,
      fetchSetup: undefined,
      abrController: _abrController2.default,
      bufferController: _bufferController2.default,
      capLevelController: _capLevelController2.default,
      fpsController: _fpsController2.default,
      //#if altaudio
      audioStreamController: _audioStreamController2.default,
      audioTrackController: _audioTrackController2.default,
      //#endif
      //#if subtitle
      subtitleStreamController: _subtitleStreamController2.default,
      subtitleTrackController: _subtitleTrackController2.default,
      timelineController: _timelineController2.default,
      cueHandler: _cues2.default,
      enableCEA708Captions: true, // used by timeline-controller
      enableWebVTT: true, // used by timeline-controller
      //#endif
      stretchShortVideoTrack: false, // used by mp4-remuxer
      forceKeyFrameOnDiscontinuity: true, // used by ts-demuxer
      abrEwmaFastLive: 3, // used by abr-controller
      abrEwmaSlowLive: 9, // used by abr-controller
      abrEwmaFastVoD: 3, // used by abr-controller
      abrEwmaSlowVoD: 9, // used by abr-controller
      abrEwmaDefaultEstimate: 5e5, // 500 kbps  // used by abr-controller
      abrBandWidthFactor: 0.95, // used by abr-controller
      abrBandWidthUpFactor: 0.7, // used by abr-controller
      abrMaxWithRealBitrate: false, // used by abr-controller
      maxStarvationDelay: 4, // used by abr-controller
      maxLoadingDelay: 4, // used by abr-controller
      minAutoBitrate: 0 // used by hls
};