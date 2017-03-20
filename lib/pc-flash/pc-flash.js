'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventHandler = require('../core/event-handler.js');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _events = require('../core/events.js');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 嵌入flash播放器
 * @author yangq
 */
var AVPlayerFlash = function (_EventHandler) {
    _inherits(AVPlayerFlash, _EventHandler);

    function AVPlayerFlash(AVPLAYER) {
        _classCallCheck(this, AVPlayerFlash);

        var _this = _possibleConstructorReturn(this, (AVPlayerFlash.__proto__ || Object.getPrototypeOf(AVPlayerFlash)).call(this, AVPLAYER, _events2.default.SETUP_FLASH, _events2.default.PAUSE, _events2.default.PLAY, _events2.default.MUTE, _events2.default.UNMUTE, _events2.default.SEEK, _events2.default.REMOVE));

        _this._activated = false; //播放器是否被激活
        return _this;
    }

    _createClass(AVPlayerFlash, [{
        key: 'onSetupFlash',
        value: function onSetupFlash(data) {
            this._activated = true; //被激活

            var div = document.getElementById(data.param.parentId);
            if (!div) {
                div = document.createElement("div");
                div.id = data.param.parentId;
            }

            if (this._hasFlash()) {
                this._initFlashPlayer(data.param);
            } else {
                div.innerHTML = "<a href=\"http://get.adobe.com/flashplayer/\">You need to install adobe flashplayer first.</a>";
            }
        }
    }, {
        key: 'onPause',
        value: function onPause() {
            if (this._activated) {
                this._thisMovie(this._swfName).avplayer_pause();
            }
        }
    }, {
        key: 'onPlay',
        value: function onPlay() {
            if (this._activated) {
                this._thisMovie(this._swfName).avplayer_play();
            }
        }
    }, {
        key: 'onMute',
        value: function onMute() {
            if (this._activated) {
                this._thisMovie(this._swfName).avplayer_mute();
            }
        }
    }, {
        key: 'onUnmute',
        value: function onUnmute() {
            if (this._activated) {
                this._thisMovie(this._swfName).avplayer_unmute();
            }
        }
    }, {
        key: 'onSeek',
        value: function onSeek(data) {
            if (this._activated) {
                this._thisMovie(this._swfName).avplayer_seek(data.time);
            }
        }
    }, {
        key: 'onRemove',
        value: function onRemove() {
            if (this._activated) {
                try {
                    var swf = this._thisMovie(this._swfName);
                    if (!!swf) {
                        swf.parentNode && swf.parentNode.removeChild(swf);
                    }
                } catch (err) {}

                this._activated = false; //置于非激活状态   
            }
        }
    }, {
        key: '_initFlashPlayer',
        value: function _initFlashPlayer(param) {
            this._swfName = 'flash' + param.nodeId;

            var parentDiv = document.getElementById(param.parentId);
            var swfAddress = "./flash/loader.swf";
            var html = "";

            if (!!param.url) {
                if (this._isIEOldVersion()) {
                    html = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" type="application/x-shockwave-flash" id="flash' + param.nodeId + '" name=flash"' + param.nodeId + '" width="' + param.width + '" height="' + param.height + '" data="' + swfAddress + '">' + '<param name="movie" value="' + swfAddress + '">' + '<param name="allowscriptaccess" value="always">' + '<param name="allowfullscreen" value="true">' + '<param name="allowFullScreenInteractive" value="true">' + '<param name="bgcolor" value="#000000">' + '<param name="wmode" value="' + param.wmode + '">' + '<param name="flashvars" value="url=' + param.url + '&debug=' + this.AVPLAYER.config.debug + '&autoPlay=' + param.autoPlay + '&title=' + param.title + '&autoRewind=' + param.autoRewind + '&disableHWAccel=' + param.disableHWAccel + '&poster=' + param.poster + '&simplifiedUI=' + param.simplifiedUI + '">';
                } else {
                    html = '<embed id ="flash' + param.nodeId + '" name ="flash' + param.nodeId + '" width="' + param.width + '" height="' + param.height + '" flashvars="url=' + param.url + '&debug=' + this.AVPLAYER.config.debug + '&title=' + param.title + '&autoRewind=' + param.autoRewind + '&poster=' + param.poster + '&autoPlay=' + param.autoPlay + '&disableHWAccel=' + param.disableHWAccel + '&simplifiedUI=' + param.simplifiedUI + '" src="' + swfAddress + '" type = "application/x-shockwave-flash" wmode="' + param.wmode + '" quality="high" bgcolor="#000000" allowfullscreen="true" allowscriptaccess="always">';
                }
            }

            parentDiv.innerHTML = html;
        }
    }, {
        key: '_hasFlash',
        value: function _hasFlash() {
            var version = '0,0,0,0';
            try {
                try {
                    var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
                    try {
                        axo.AllowScriptAccess = 'always';
                    } catch (e) {
                        version = '6,0,0';
                    }
                } catch (e) {}
                version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$' + 'version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
            } catch (e) {
                try {
                    if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
                    }
                } catch (e) {}
            }
            var major = parseInt(version.split(',')[0], 10);
            var minor = parseInt(version.split(',')[2], 10);
            if (major > 9 || major == 9 && minor > 97) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * 检测用户当前浏览器是否为IE7|IE8|IE9|IE10等旧版浏览器
         * 如果是，用Object标签嵌入swf，确保js和swf的相互通信ok
         */

    }, {
        key: '_isIEOldVersion',
        value: function _isIEOldVersion() {
            var ua = navigator.userAgent.toLowerCase();
            var isie = void 0;
            if (window.ActiveXObject) {
                isie = ua.match(/msie ([\d.]+)/)[1];
                if (isie == "7.0" || isie == "8.0" || isie == "9.0" || isie == "10.0") {
                    return true;
                }
            }

            return false;
        }
    }, {
        key: '_thisMovie',
        value: function _thisMovie(movieName) {
            if (navigator.appName.indexOf("Microsoft") != -1) {
                return window[movieName];
            } else {
                return document[movieName];
            }
        }
    }]);

    return AVPlayerFlash;
}(_eventHandler2.default);

exports.default = AVPlayerFlash;