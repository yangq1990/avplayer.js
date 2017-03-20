'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('./utils/avplayer-console-polyfill.js');

require('./utils/avplayer-performance-polyfill.js');

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _commonFunctions = require('./utils/common-functions.js');

var _systeminfo = require('./utils/systeminfo.js');

var _browserSniff = require('./utils/browser-sniff');

var _browserSniff2 = _interopRequireDefault(_browserSniff);

var _events3 = require('./core/events.js');

var _events4 = _interopRequireDefault(_events3);

var _playlistLoader = require('./pc-html5-hls/loader/playlist-loader.js');

var _playlistLoader2 = _interopRequireDefault(_playlistLoader);

var _fragmentLoader = require('./pc-html5-hls/loader/fragment-loader');

var _fragmentLoader2 = _interopRequireDefault(_fragmentLoader);

var _keyLoader = require('./pc-html5-hls/loader/key-loader');

var _keyLoader2 = _interopRequireDefault(_keyLoader);

var _streamController = require('./pc-html5-hls/controller/stream-controller');

var _streamController2 = _interopRequireDefault(_streamController);

var _levelController = require('./pc-html5-hls/controller/level-controller');

var _levelController2 = _interopRequireDefault(_levelController);

var _avlog = require('./utils/avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

var _pcFlash = require('./pc-flash/pc-flash.js');

var _pcFlash2 = _interopRequireDefault(_pcFlash);

var _mobileHtml = require('./mobile-html5/mobile-html5.js');

var _mobileHtml2 = _interopRequireDefault(_mobileHtml);

var _pcHtml5Default = require('./pc-html5-default/pc-html5-default.js');

var _pcHtml5Default2 = _interopRequireDefault(_pcHtml5Default);

var _pcHtml5Hls = require('./pc-html5-hls/pc-html5-hls.js');

var _pcHtml5Hls2 = _interopRequireDefault(_pcHtml5Hls);

var _avplayerStates = require('./core/avplayer-states.js');

var _avplayerStates2 = _interopRequireDefault(_avplayerStates);

var _config = require('./config.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * AVPlayer.js入口类
 * @author yangq
 */
var AVPlayer = function () {
    _createClass(AVPlayer, null, [{
        key: 'version',
        get: function get() {
            // replaced with browserify-versionify transform
            return '__VERSION__';
        }
    }, {
        key: 'Events',
        get: function get() {
            return _events4.default;
        }
    }, {
        key: 'States',
        get: function get() {
            return _avplayerStates2.default;
        }

        /**
         * 构造函数
         */

    }]);

    function AVPlayer() {
        var _this = this;

        var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, AVPlayer);

        for (var prop in _config.AVPlayerDefaultConfig) {
            if (prop in config) {
                continue;
            }
            config[prop] = _config.AVPlayerDefaultConfig[prop];
        }

        _avlog2.default.debug = config.debug; //config.debug为true则进入debug模式
        this.config = config;
        this._autoLevelCapping = -1;

        // observer setup
        var observer = this.observer = new _events2.default();
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

        this.on = observer.on.bind(observer);
        this.off = observer.off.bind(observer);
        this.trigger = observer.trigger.bind(observer);

        this.avPlayerFlash = new _pcFlash2.default(this);
        this.avPlayerMobileH5 = new _mobileHtml2.default(this);
        this.avPlayerPCH5Default = new _pcHtml5Default2.default(this);
        this.avPlayerPCH5Hls = new _pcHtml5Hls2.default(this);

        // core controllers and network loaders
        var abrController = this.abrController = new config.abrController(this);
        var bufferController = new config.bufferController(this);
        var capLevelController = new config.capLevelController(this);
        var fpsController = new config.fpsController(this);
        var playListLoader = new _playlistLoader2.default(this);
        var fragmentLoader = new _fragmentLoader2.default(this);
        var keyLoader = new _keyLoader2.default(this);

        // network controllers
        var levelController = this.levelController = new _levelController2.default(this);
        var streamController = this.streamController = new _streamController2.default(this);
        var networkControllers = [levelController, streamController];

        // optional audio stream controller
        var Controller = config.audioStreamController;
        if (Controller) {
            networkControllers.push(new Controller(this));
        }
        this.networkControllers = networkControllers;

        var coreComponents = [playListLoader, fragmentLoader, keyLoader, abrController, bufferController, capLevelController, fpsController];

        // optional audio track and subtitle controller
        Controller = config.audioTrackController;
        if (Controller) {
            var audioTrackController = new Controller(this);
            this.audioTrackController = audioTrackController;
            coreComponents.push(audioTrackController);
        }

        Controller = config.subtitleTrackController;
        if (Controller) {
            var subtitleTrackController = new Controller(this);
            this.subtitleTrackController = subtitleTrackController;
            coreComponents.push(subtitleTrackController);
        }

        // optional subtitle controller
        [config.subtitleStreamController, config.timelineController].forEach(function (Controller) {
            if (Controller) {
                coreComponents.push(new Controller(_this));
            }
        });
        this.coreComponents = coreComponents;
    }

    /**
     * 生成HTML5 | Flash播放器
     * @param  {[type]} url  [description]
     * @param  {[type]} conf [description]
     * @return {[type]}      [description]
     */


    _createClass(AVPlayer, [{
        key: 'setup',
        value: function setup(url, conf) {
            this._bootTimestamp = performance.now();
            _avlog2.default.print("播放器启动！！！");

            if (!url) {
                throw new Error("请传入视频文件地址");
            }

            var param = {};
            //https

            //播放器宽
            if (!!conf && !!conf["width"]) {
                param.width = conf["width"];
            } else {
                param.width = 640;
            }

            //播放器高
            if (!!conf && !!conf["height"]) {
                param.height = conf["height"];
            } else {
                param.height = 480;
            }

            if (!!conf && conf["parentId"]) {
                var parent = document.getElementById(conf["parentId"]); //获取父节点的引用
                if (parent === null) {
                    throw new Error("父节点不存在，请检查!!!");
                } else {
                    param.parentId = conf["parentId"]; //记录业务传入的parent node id
                }
            } else {
                param.parentId = "playerbox" + (0, _commonFunctions.createNodeId)(); //sdk生成一个parent node id并记录
                document.write('<div id="' + param.parentId + '" style="margin-right:auto;margin-left:auto;"></div>');
            }

            param.urlFlag = true;
            param.url = url;
            if (param.url.indexOf(".m3u8") != -1) {
                param.protocol = "hls";
            }

            //自动播放
            param.autoPlay = !!conf && conf["autoPlay"] !== undefined ? conf["autoPlay"] : 0;
            //封面图片地址
            param.posterURL = !!conf && conf["poster"] !== undefined ? conf["poster"] : ""; //默认封面图片地址为""
            //播放器节点id
            param.nodeId = (0, _commonFunctions.createNodeId)();
            //flash wmode
            param.wmode = !!conf && conf["wmode"] !== undefined ? conf["wmode"] : "opaque";
            //title
            param.title = !!conf && conf["title"] !== undefined ? conf["title"] : "";
            //autoReplay
            param.autoRewind = !!conf && conf["autoRewind"] !== undefined ? conf["autoRewind"] : 0;
            //disableFullScreenButton(for webview)
            param.disableFSButton = !!conf && conf["disableFSButton"] !== undefined ? conf["disableFSButton"] : 0;
            //prefer flash. we prefer html5 by default
            param.preferFlash = !!conf && (conf["preferFlash"] == 1 || conf["preferFlash"] == "1") ? true : false;
            //cutomUI
            param.customUI = !!conf && (conf["customUI"] == 1 || conf["customUI"] == "1") ? true : false;
            //log div id
            if (!!conf && !!conf.logDivId) {
                _avlog2.default.logDivId = conf.logDivId;
            }

            if (param.disableFSButton && (0, _systeminfo.getMobileSystemInfo)().sys == 0) {//禁用全屏按钮，只在android webview下生效

            }

            this._triggerSetupEvent(param);
        }
    }, {
        key: '_triggerSetupEvent',
        value: function _triggerSetupEvent(param) {
            var parseParamsCost = Math.round(performance.now() - this._bootTimestamp);
            _avlog2.default.print('\u53C2\u6570\u89E3\u6790\u5B8C\u6BD5,\u8017\u65F6 ' + parseParamsCost + ' ms');

            var event_type = void 0;
            if (!param.preferFlash && _browserSniff2.default.isMSESupported && (0, _systeminfo.getMobileSystemInfo)().browser !== 8) {
                //prefer html5 并且浏览器支持mse; 微博客户端居然支持mse，但是有很多问题
                if (param.protocol == "hls") {
                    event_type = _events4.default.SETUP_PCH5_HLS;
                } else {
                    //not hls, default format
                    event_type = _events4.default.SETUP_PCH5_DEFAULT;
                }
            } else {
                //prefer flash or 浏览器支持不mse
                if (_browserSniff2.default.isMobileDevice) {
                    event_type = _events4.default.SETUP_MOBILEH5;
                } else {
                    event_type = _events4.default.SETUP_FLASH;
                }
            }

            this.trigger(event_type, { param: param });
        }
    }, {
        key: 'startLoad',
        value: function startLoad() {
            var startPosition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;

            _avlog2.default.print('startLoad(' + startPosition + ')');
            this.networkControllers.forEach(function (controller) {
                controller.startLoad(startPosition);
            });
        }
    }, {
        key: 'pause',
        value: function pause() {
            this.trigger(_events4.default.PAUSE);
        }
    }, {
        key: 'play',
        value: function play() {
            this.trigger(_events4.default.PLAY);
        }
    }, {
        key: 'mute',
        value: function mute() {
            this.trigger(_events4.default.MUTE);
        }
    }, {
        key: 'unmute',
        value: function unmute() {
            this.trigger(_events4.default.UNMUTE);
        }
    }, {
        key: 'remove',
        value: function remove() {
            this.trigger(_events4.default.REMOVE);
        }
    }, {
        key: 'seek',
        value: function seek(value) {
            this.trigger(_events4.default.SEEK, { time: value });
        }
    }, {
        key: 'rewind',
        value: function rewind() {
            this.trigger(_events4.default.REWIND);
        }

        /**
         * 恢复播放器播放状态，隐藏video并重新显示video后调用
         * @param divId  video的父div id
         */

    }, {
        key: 'resume',
        value: function resume(divId) {
            this.trigger(_events4.default.RESUME, { divId: divId });
        }

        /** Return all quality levels **/

    }, {
        key: 'levels',
        get: function get() {
            return this.levelController.levels;
        }

        /** Return current playback quality level **/

    }, {
        key: 'currentLevel',
        get: function get() {
            return this.streamController.currentLevel;
        }

        /* set quality level immediately (-1 for automatic level selection) */
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set currentLevel:' + newLevel);
            this.loadLevel = newLevel;
            this.streamController.immediateLevelSwitch();
        }

        /** Return next playback quality level (quality level of next fragment) **/

    }, {
        key: 'nextLevel',
        get: function get() {
            return this.streamController.nextLevel;
        }

        /* set quality level for next fragment (-1 for automatic level selection) */
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set nextLevel:' + newLevel);
            this.levelController.manualLevel = newLevel;
            this.streamController.nextLevelSwitch();
        }

        /** Return the quality level of current/last loaded fragment **/

    }, {
        key: 'loadLevel',
        get: function get() {
            return this.levelController.level;
        }

        /* set quality level for current/next loaded fragment (-1 for automatic level selection) */
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set loadLevel:' + newLevel);
            this.levelController.manualLevel = newLevel;
        }

        /** Return the quality level of next loaded fragment **/

    }, {
        key: 'nextLoadLevel',
        get: function get() {
            return this.levelController.nextLoadLevel;
        }

        /** set quality level of next loaded fragment **/
        ,
        set: function set(level) {
            this.levelController.nextLoadLevel = level;
        }

        /** Return first level (index of first level referenced in manifest)
        **/

    }, {
        key: 'firstLevel',
        get: function get() {
            return Math.max(this.levelController.firstLevel, this.minAutoLevel);
        }

        /** set first level (index of first level referenced in manifest)
        **/
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set firstLevel:' + newLevel);
            this.levelController.firstLevel = newLevel;
        }

        /** Return start level (level of first fragment that will be played back)
          if not overrided by user, first level appearing in manifest will be used as start level
          if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
        **/

    }, {
        key: 'startLevel',
        get: function get() {
            return this.levelController.startLevel;
        }

        /** set  start level (level of first fragment that will be played back)
          if not overrided by user, first level appearing in manifest will be used as start level
          if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
        **/
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set startLevel:' + newLevel);
            var hls = this;
            // if not in automatic start level detection, ensure startLevel is greater than minAutoLevel
            if (newLevel !== -1) {
                newLevel = Math.max(newLevel, hls.minAutoLevel);
            }
            hls.levelController.startLevel = newLevel;
        }

        /** Return the capping/max level value that could be used by automatic level selection algorithm **/

    }, {
        key: 'autoLevelCapping',
        get: function get() {
            return this._autoLevelCapping;
        }

        /** set the capping/max level value that could be used by automatic level selection algorithm **/
        ,
        set: function set(newLevel) {
            _avlog2.default.print('set autoLevelCapping:' + newLevel);
            this._autoLevelCapping = newLevel;
        }

        /* check if we are in automatic level selection mode */

    }, {
        key: 'autoLevelEnabled',
        get: function get() {
            return this.levelController.manualLevel === -1;
        }

        /* return manual level */

    }, {
        key: 'manualLevel',
        get: function get() {
            return this.levelController.manualLevel;
        }

        /* return min level selectable in auto mode according to config.minAutoBitrate */

    }, {
        key: 'minAutoLevel',
        get: function get() {
            var hls = this,
                levels = hls.levels,
                minAutoBitrate = hls.config.minAutoBitrate,
                len = levels ? levels.length : 0;
            for (var i = 0; i < len; i++) {
                var levelNextBitrate = levels[i].realBitrate ? Math.max(levels[i].realBitrate, levels[i].bitrate) : levels[i].bitrate;
                if (levelNextBitrate > minAutoBitrate) {
                    return i;
                }
            }
            return 0;
        }

        /* return max level selectable in auto mode according to autoLevelCapping */

    }, {
        key: 'maxAutoLevel',
        get: function get() {
            var hls = this;
            var levels = hls.levels;
            var autoLevelCapping = hls.autoLevelCapping;
            var maxAutoLevel = void 0;
            if (autoLevelCapping === -1 && levels && levels.length) {
                maxAutoLevel = levels.length - 1;
            } else {
                maxAutoLevel = autoLevelCapping;
            }
            return maxAutoLevel;
        }

        // return next auto level

    }, {
        key: 'nextAutoLevel',
        get: function get() {
            var hls = this;
            // ensure next auto level is between  min and max auto level
            return Math.min(Math.max(hls.abrController.nextAutoLevel, hls.minAutoLevel), hls.maxAutoLevel);
        }

        // this setter is used to force next auto level
        // this is useful to force a switch down in auto mode : in case of load error on level N, hls.js can set nextAutoLevel to N-1 for example)
        // forced value is valid for one fragment. upon succesful frag loading at forced level, this value will be resetted to -1 by ABR controller
        ,
        set: function set(nextLevel) {
            var hls = this;
            hls.abrController.nextAutoLevel = Math.max(hls.minAutoLevel, nextLevel);
        }

        /** get alternate audio tracks list from playlist **/

    }, {
        key: 'audioTracks',
        get: function get() {
            var audioTrackController = this.audioTrackController;
            return audioTrackController ? audioTrackController.audioTracks : [];
        }

        /** get index of the selected audio track (index in audio track lists) **/

    }, {
        key: 'audioTrack',
        get: function get() {
            var audioTrackController = this.audioTrackController;
            return audioTrackController ? audioTrackController.audioTrack : -1;
        }

        /** select an audio track, based on its index in audio track lists**/
        ,
        set: function set(audioTrackId) {
            var audioTrackController = this.audioTrackController;
            if (audioTrackController) {
                audioTrackController.audioTrack = audioTrackId;
            }
        }
    }, {
        key: 'liveSyncPosition',
        get: function get() {
            return this.streamController.liveSyncPosition;
        }

        /** get alternate subtitle tracks list from playlist **/

    }, {
        key: 'subtitleTracks',
        get: function get() {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController ? subtitleTrackController.subtitleTracks : [];
        }

        /** get index of the selected subtitle track (index in subtitle track lists) **/

    }, {
        key: 'subtitleTrack',
        get: function get() {
            var subtitleTrackController = this.subtitleTrackController;
            return subtitleTrackController ? subtitleTrackController.subtitleTrack : -1;
        }

        /** select an subtitle track, based on its index in subtitle track lists**/
        ,
        set: function set(subtitleTrackId) {
            var subtitleTrackController = this.subtitleTrackController;
            if (subtitleTrackController) {
                subtitleTrackController.subtitleTrack = subtitleTrackId;
            }
        }
    }]);

    return AVPlayer;
}();

exports.default = AVPlayer;