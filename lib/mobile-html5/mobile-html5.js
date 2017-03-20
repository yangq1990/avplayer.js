'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _events = require('../core/events.js');

var _events2 = _interopRequireDefault(_events);

var _avplayerBase = require('../core/avplayer-base.js');

var _avplayerBase2 = _interopRequireDefault(_avplayerBase);

var _avplayerStates = require('../core/avplayer-states.js');

var _avplayerTips = require('../core/avplayer-tips.js');

var _commonFunctions = require('../utils/common-functions.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 生成移动端HTML5播放器
 * @author yangq
 */
var AVPlayerMobileH5 = function (_AVPlayerBase) {
    _inherits(AVPlayerMobileH5, _AVPlayerBase);

    function AVPlayerMobileH5(AVPLAYER) {
        _classCallCheck(this, AVPlayerMobileH5);

        var _this = _possibleConstructorReturn(this, (AVPlayerMobileH5.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5)).call(this, AVPLAYER, _events2.default.SETUP_MOBILEH5, _events2.default.PAUSE, _events2.default.PLAY, _events2.default.MUTE, _events2.default.UNMUTE, _events2.default.REMOVE, _events2.default.RESUME));

        _this._activated = false; //播放器是否被激活
        _this._mediaState = _avplayerStates.AVPlayerStates.IDLE; //初始时idle状态
        return _this;
    }

    _createClass(AVPlayerMobileH5, [{
        key: 'onSetupMobileH5',
        value: function onSetupMobileH5(data) {
            this._activated = true; //被激活
            this._param = data.param;
            this._setVideo();
        }
    }, {
        key: 'onPause',
        value: function onPause() {
            if (this._activated) {
                if (!!this._video) {
                    this._video.pause();
                }
            }
        }
    }, {
        key: 'onPlay',
        value: function onPlay() {
            if (this._activated) {
                if (!!this._video) {
                    this._video.play();
                }
            }
        }
    }, {
        key: 'onMute',
        value: function onMute() {
            if (this._activated) {
                if (!!this._video) {
                    if (!this._video.muted) {
                        this._video.muted = true;
                    }
                }
            }
        }
    }, {
        key: 'onUnmute',
        value: function onUnmute() {
            if (this._activated) {
                if (!!this._video) {
                    if (this._video.muted) {
                        this._video.muted = false;
                    }
                }
            }
        }
    }, {
        key: 'onRemove',
        value: function onRemove() {
            if (this._activated) {
                if (!!this._video) {
                    try {
                        this._video.pause();
                        this._video.src = "about:blank"; //改变src后会自动load
                        this._video.parentNode && this._video.parentNode.removeChild(this._video);
                        this._playerRemovedFlag = true; //播放器被destroy标识
                    } catch (err) {
                        _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'log', this).call(this, "onRemove err->", err);
                    }
                    this._activated = false;
                }
            }
        }
    }, {
        key: 'onResume',
        value: function onResume(data) {
            if (this._activated) {
                var video = void 0;
                if (!!data.divId) {
                    //传入了parent div id
                    var parentDiv = document.getElementById(divId);
                    if (parentDiv === null) {
                        throw new Error("所传id代表的div不存在，请检查!!!");
                    } else {
                        //获取父div下的第一个video的引用
                        video = parentDiv.getElementsByTagName("video")[0];
                    }
                } else {
                    //没有传入parent div id，则默认resume页面第一个video
                    video = document.getElementsByTagName("video")[0];
                }

                if (video !== null) {
                    //resume
                    video.pause();
                    video.play();
                }
            }
        }
    }, {
        key: '_setVideo',
        value: function _setVideo() {
            var param = this._param,
                w = param.width,
                h = param.height;

            var video = document.createElement("video");
            this._video = video; //获取video对象的引用
            video.id = "video" + param.nodeId; //记录video标签id属性的值
            video.width = w;
            video.height = h;

            if (param.autoPlay === 1) {
                video.autoplay = "autoplay";
            }

            video.setAttribute("webkit-playsinline", ""); //ios app内，如果webview设置 allowsInlineMediaPlayback 后可内联播放
            video.setAttribute("playsinline", ""); //ios10 safari 允许视频内联播放
            video.addEventListener("play", this._onPlayState.bind(this));
            video.addEventListener("pause", this._onPauseState.bind(this));
            video.addEventListener("seeking", this._onSeekingState.bind(this));
            video.addEventListener("error", this._onErrorState.bind(this));
            video.addEventListener("timeupdate", _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'timeUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("ended", this._onEndedState.bind(this));
            video.addEventListener("durationUpdate", _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'durationUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("canplay", this._onCanPlayState.bind(this));
            // video.addEventListener("click", this._onClickOperation.bind(this));        
            //loadstart loadeddata loadedmetadata等事件在移动端浏览器不可靠

            var div = document.getElementById(param.parentId); //如果没有传入parentId，avplayer.js会生成一个parentId，此时parent node有可能在dom上不存在
            if (!!div) {
                div.appendChild(video);
            } else {
                var p_div = document.createElement("div");
                p_div.id = pid;
                p_div.appendChild(video);
            }

            if (param.urlFlag) {
                //直接播放视频url
                if ((0, _commonFunctions.isString)(param.poster)) {
                    video.poster = param.poster; //加载封面图片
                }
                this._video_url = param.url; //记录视频地址
                video.src = param.url;
                _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.READY);
            }

            //自动播放，仅在微信下可能有效，处理与http://res.wx.qq.com/open/js/jweixin-1.0.0.js相关的状态
            if (param.autoPlay === 1 && getMobileSystemInfo().browser === 4) {
                document.addEventListener("WeixinJSBridgeReady", this._onWeixinJSBridgeReady.bind(this));
            }
        }
    }, {
        key: '_onWeixinJSBridgeReady',
        value: function _onWeixinJSBridgeReady() {
            if (!!this._video) {
                this._video.play();
            }
        }

        /**
         * 处理video侦听到的play事件
         * @param  {event}
         * @return {[type]}
         */

    }, {
        key: '_onPlayState',
        value: function _onPlayState(event) {}
    }, {
        key: '_onPauseState',
        value: function _onPauseState(event) {
            //创建好播放器，微信 手Q QQ浏览器在派发video play事件后之后立即pause video  此时播放器处于play_start状态，& 播放头位置为0(小于0.1)
            if (this._mediaState === _avplayerStates.AVPlayerStates.PLAY_START && this._video.currentTime < 0.1) {
                return;
            }

            if (Math.abs(this._video.currentTime - this._video.duration) <= 0.1) {
                //如微信等浏览器在播放结束前，会先派发pause事件
                return;
            }

            if (!!this._errInfo) {
                //uc等浏览器在播放出错时会触发pause事件
                return;
            }

            _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PAUSED);
        }
    }, {
        key: '_onSeekingState',
        value: function _onSeekingState(event) {}

        /**
         * 播放结束
         * @param  {[type]}
         * @return {[type]}
         */

    }, {
        key: '_onEndedState',
        value: function _onEndedState(event) {
            _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAYBACK_COMPLETE);
        }

        /**
         * 移动端浏览器canplay事件和pc浏览器canplay事件不同。移动端为了节省用户流量，使用移动数据时不会预加载视频（wifi下部分浏览器会预加载），派发canplay事件时，buffered.length为0
         * pc端浏览器派发canplay事件，表明视频首屏已经缓冲好，可以播放了
         */

    }, {
        key: '_onCanPlayState',
        value: function _onCanPlayState(event) {
            this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), NumberConst.CheckBufferMillisec);
        }

        //每300ms检查并通知当前缓冲进度

    }, {
        key: '_checkBufferedInterval',
        value: function _checkBufferedInterval() {
            //check length first in case of "Failed to execute 'end' on 'TimeRanges': The index provided (0) is greater than or equal to the maximum bound (0)"
            //在移动端浏览器，如uc，this._video.bufferer.length 始终为0 ，不清楚是什么情况
            if (this._video.buffered.length > 0 && this._buffered != this._video.buffered.end(0)) {
                this._buffered = this._video.buffered.end(0);
                this.AVPLAYER.trigger(_events2.default.BUFFERED_UPDATE, { buffered: this._video.buffered.end(0) });
            }
        }

        /**
         * 处理video侦听到的error事件
         * @param  {event}
         * @return {void}
         */

    }, {
        key: '_onErrorState',
        value: function _onErrorState(event) {
            //移除播放器时导致的错误 || 空對象
            if (this._playerRemovedFlag || event.target === null || event.target.error === null) {
                return;
            }

            switch (event.target.error.code) {
                case 1:
                    this._errInfo = _avplayerTips.AVPlayerTips.T1;
                    break;
                case 2:
                    this._errInfo = _avplayerTips.AVPlayerTips.T2;
                    break;
                case 3:
                    this._errInfo = _avplayerTips.AVPlayerTips.T3;
                    break;
                case 4:
                    this._errInfo = _avplayerTips.AVPlayerTips.T4;
                    break;
            }
            this._errCode = event.target.error.code;

            //显示文字提示
            _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'applyStyle', this).call(this, this._errInfo);

            _get(AVPlayerMobileH5.prototype.__proto__ || Object.getPrototypeOf(AVPlayerMobileH5.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.ERROR_OCCURRED);
        }
    }]);

    return AVPlayerMobileH5;
}(_avplayerBase2.default);

exports.default = AVPlayerMobileH5;