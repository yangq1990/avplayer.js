'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _events = require('../core/events');

var _events2 = _interopRequireDefault(_events);

var _avplayerBase = require('../core/avplayer-base.js');

var _avplayerBase2 = _interopRequireDefault(_avplayerBase);

var _avplayerStates = require('../core/avplayer-states.js');

var _avplayerTips = require('../core/avplayer-tips.js');

var _avplayerNumberConst = require('../core/avplayer-number-const');

var _commonFunctions = require('../utils/common-functions.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 生成PC端HTML5播放器，默认支持以下格式的视频
 * Ogg = 带有 Theora 视频编码和 Vorbis 音频编码的 Ogg 文件
 * MPEG4 = 带有 H.264 视频编码和 AAC 音频编码的 MPEG 4 文件
 * WebM = 带有 VP8 视频编码和 Vorbis 音频编码的 WebM 文件
 * @author yangq
 */
var AVPlayerPCH5Default = function (_AVPlayerBase) {
    _inherits(AVPlayerPCH5Default, _AVPlayerBase);

    function AVPlayerPCH5Default(AVPLAYER) {
        _classCallCheck(this, AVPlayerPCH5Default);

        var _this = _possibleConstructorReturn(this, (AVPlayerPCH5Default.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default)).call(this, AVPLAYER, _events2.default.SETUP_PCH5_DEFAULT, _events2.default.PAUSE, _events2.default.PLAY, _events2.default.REWIND, _events2.default.MUTE, _events2.default.UNMUTE, _events2.default.SEEK, _events2.default.SET_VOLUME, _events2.default.REMOVE));

        _this._activated = false; //播放器是否被激活

        _this._mediaState = _avplayerStates.AVPlayerStates.IDLE; //初始时idle状态
        _this._firstBufferFullFlag = false;
        return _this;
    }

    _createClass(AVPlayerPCH5Default, [{
        key: 'onSetupPCH5Default',
        value: function onSetupPCH5Default(data) {
            this._activated = true; //被激活
            var param = this._param = data.param,
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

            //preload默认值 auto
            //auto - 当页面加载后载入整个视频
            //meta - 当页面加载后只载入元数据
            //none - 当页面加载后不载入视频

            video.addEventListener("play", this._onPlayState.bind(this));
            video.addEventListener("pause", this._onPauseState.bind(this));
            video.addEventListener("error", this._onErrorState.bind(this));
            video.addEventListener("ended", this._onEndedState.bind(this));
            video.addEventListener("seeking", this._onSeekingState.bind(this));
            video.addEventListener("seeked", this._onSeekedState.bind(this));
            video.addEventListener("waiting", this._onWaitingState.bind(this));
            video.addEventListener("timeupdate", _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'timeUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("volumechange", this._onVolumechangeState.bind(this));
            video.addEventListener("durationUpdate", _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'durationUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("canplay", this._onCanPlayState.bind(this));
            video.addEventListener("click", this._onClickOperation.bind(this));

            if (param.customUI) {
                //派发构建自定义UI事件
                this.AVPLAYER.trigger(_events2.default.BUILD_CUSTOM_UI, { media: video });
            } else {
                video.setAttribute("controls", ""); //使用浏览器默认的UI
            }

            var div = document.getElementById(param.parentId); //如果没有传入parentId，avplayer.js会生成一个parentId，此时parent node有可能在dom上不存在
            if (!!div) {
                div.appendChild(video);
            } else {
                var p_div = document.createElement("div");
                p_div.id = param.parentId;
                p_div.appendChild(video);
            }

            if (param.urlFlag) {
                //直接播放视频url
                if ((0, _commonFunctions.isString)(param.poster)) {
                    video.poster = param.poster; //加载封面图片
                }
                this._video_url = video.src = param.url;
                _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.READY);
            }
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
                if (this._mediaState == _avplayerStates.AVPlayerStates.IDLE) {
                    //播放器尚未ready
                    return;
                }

                //0->No information is available about the media resource
                //1->Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
                //2->Data is available for the current playback position, but not enough to actually play more than one frame.
                //3->Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
                //4->Enough data is available—and the download rate is high enough—that the media can be played through to the end without interruption.
                if (this._video.readyState >= 2) {
                    this._video.play();
                } else {
                    //readyState位0或1
                    _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.BUFFERING); //播放器进入缓冲状态
                }
            }
        }
    }, {
        key: 'onRewind',
        value: function onRewind() {
            if (!this._param.autoRewind) {
                this.onSeek({ time: 0 });
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
        key: 'onSeek',
        value: function onSeek(data) {
            if (this._activated) {
                if (!!this._video) {
                    if (this._video.readyState >= 2) {
                        this._seekOperationFlag = true; //seek操作标识
                        this._video.currentTime = data.time;
                    }
                }
            }
        }

        /**
         * 设置播放器的音量
         * @param  {volume: 音量值0-100}
         * @return {[void]}
         */

    }, {
        key: 'onSetVolume',
        value: function onSetVolume(data) {
            if (this._activated) {
                if (!!this._video) {
                    var vol = data.volume;
                    if (vol > 100) {
                        vol = 100;
                    }
                    if (vol < 0) {
                        vol = 0;
                    }
                    this._video.volume = vol / 100; //0->最小音量  1->最大音量
                }
            }
        }
    }, {
        key: 'onRemove',
        value: function onRemove() {
            if (this._activated) {
                if (!!this._video) {
                    try {
                        if (!!this._cbInterval) {
                            //移除timer
                            clearInterval(this._cbInterval);
                        }
                        this._video.pause();
                        this._playerRemovedFlag = true; //播放器被destroy标识
                        this._video.src = "about:blank"; //改变src后会自动load
                        this._video.parentNode && this._video.parentNode.removeChild(this._video);
                    } catch (err) {
                        _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'log', this).call(this, "onRemove err->", err);
                    }
                    this._activated = false; //置于非激活状态             
                }
            }
        }

        /**
         * 处理video侦听到的play事件, 标识媒介已就绪可以开始播放
         * @param  {event}
         * @return {[type]}
         */

    }, {
        key: '_onPlayState',
        value: function _onPlayState(event) {
            if (!this._firstBufferFullFlag) {
                this._firstBufferFullFlag = true;
                this._onFirstBufferFull();
            } else {
                _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAYING); //播放器进入playing状态
            }
        }
    }, {
        key: '_onPauseState',
        value: function _onPauseState(event) {
            _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PAUSED);
        }

        /**
         * 播放结束
         * @param  {[type]}
         * @return {[type]}
         */

    }, {
        key: '_onEndedState',
        value: function _onEndedState(event) {
            _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAYBACK_COMPLETE);

            if (this._param.autoRewind) {
                //配置了自动重播
                this.onSeek({ time: 0 });
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
            if (this._playerRemovedFlag || this._retryCount > 0 || event.target === null || event.target.error === null) {
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
            _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'applyStyle', this).call(this, this._errInfo);
            _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.ERROR_OCCURRED);
        }
    }, {
        key: '_onSeekingState',
        value: function _onSeekingState(event) {}
    }, {
        key: '_onSeekedState',
        value: function _onSeekedState(event) {
            if (this._seekOperationFlag && this._video.paused) {
                //seek操作后控制video播放
                this._video.play();
                this._seekOperationFlag = false;
            }
        }
    }, {
        key: '_onWaitingState',
        value: function _onWaitingState(event) {
            //0->NETWORK_EMPTY - 音频/视频尚未初始化
            //1->NETWORK_IDLE - 音频/视频是活动的且已选取资源，但并未使用网络
            //2->NETWORK_LOADING - 浏览器正在下载数据
            //3->NETWORK_NO_SOURCE - 未找到音频/视频来源
            if (this._video.networkState == 2) {
                //buffering状态，这个不一定可靠，需要验证
                _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.BUFFERING);
            }
        }
    }, {
        key: '_onVolumechangeState',
        value: function _onVolumechangeState(event) {}
    }, {
        key: '_onCanPlayState',
        value: function _onCanPlayState(event) {
            //此时已经出现首屏画面
            if (!this._firstBufferFullFlag) {
                this._firstBufferFullFlag = true;
                this._onFirstBufferFull();
            }
        }
    }, {
        key: '_onClickOperation',
        value: function _onClickOperation(event) {
            switch (this._mediaState) {
                case _avplayerStates.AVPlayerStates.IDLE:
                    _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'log', this).call(this, "please wait");
                    break;
                case _avplayerStates.AVPlayerStates.READY:
                    if (this._video.paused && this._video.readyState >= 2) {
                        this._video.play();
                    }
                    break;
                case _avplayerStates.AVPlayerStates.PAUSED:
                    this.onPlay();
                    break;
                case _avplayerStates.AVPlayerStates.PLAYING:
                    this.onPause();
                    break;
                case _avplayerStates.AVPlayerStates.PLAYBACK_COMPLETE:
                    this.onReplay();
                    break;
                case _avplayerStates.AVPlayerStates.ERROR_OCCURRED:
                    _get(AVPlayerPCH5Default.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Default.prototype), 'log', this).call(this, "播放遇到错误");
                    break;
                default:
                    break;
            }
        }
    }, {
        key: '_onFirstBufferFull',
        value: function _onFirstBufferFull() {
            this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), _avplayerNumberConst.NumberConst.CheckBufferMillisec);
        }

        //每300ms检查并通知当前缓冲进度

    }, {
        key: '_checkBufferedInterval',
        value: function _checkBufferedInterval() {
            //check length first in case of "Failed to execute 'end' on 'TimeRanges': The index provided (0) is greater than or equal to the maximum bound (0)"
            if (this._video.buffered.length > 0 && this._buffered != this._video.buffered.end(0)) {
                this._buffered = this._video.buffered.end(0);
                this.AVPLAYER.trigger(_events2.default.BUFFERED_UPDATE, { buffered: this._video.buffered.end(0) });
            }
        }
    }]);

    return AVPlayerPCH5Default;
}(_avplayerBase2.default);

exports.default = AVPlayerPCH5Default;