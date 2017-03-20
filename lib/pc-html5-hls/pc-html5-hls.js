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

var _errors = require('../core/errors');

var _commonFunctions = require('../utils/common-functions.js');

var _avlog = require('../utils/avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 生成PC端HTML5播放器，使用video标签和mse播放hls
 * @author yangq
 */
var AVPlayerPCH5Hls = function (_AVPlayerBase) {
    _inherits(AVPlayerPCH5Hls, _AVPlayerBase);

    function AVPlayerPCH5Hls(AVPLAYER) {
        _classCallCheck(this, AVPlayerPCH5Hls);

        var _this = _possibleConstructorReturn(this, (AVPlayerPCH5Hls.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls)).call(this, AVPLAYER, _events2.default.SETUP_PCH5_HLS, _events2.default.MEDIA_ATTACHED, _events2.default.MANIFEST_LOADED, _events2.default.FRAG_LOADED, _events2.default.FRAG_BUFFERED, _events2.default.ERROR, _events2.default.PAUSE, _events2.default.PLAY, _events2.default.REWIND, _events2.default.MUTE, _events2.default.UNMUTE, _events2.default.SEEK, _events2.default.SET_VOLUME, _events2.default.REMOVE));

        _this._activated = false; //播放器是否被激活

        _this._mediaState = _avplayerStates.AVPlayerStates.IDLE; //初始时idle状态

        _this._firstBufferFullFlag = false;
        _this._totalDuration = 0; //视频总时长
        return _this;
    }

    _createClass(AVPlayerPCH5Hls, [{
        key: 'onSetupPCH5Hls',
        value: function onSetupPCH5Hls(data) {
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
                //自动播放
                video.autoplay = "autoplay";
            }

            video.addEventListener("play", this._onPlayState.bind(this));
            video.addEventListener("pause", this._onPauseState.bind(this));
            video.addEventListener("error", this._onErrorState.bind(this));
            video.addEventListener("ended", this._onEndedState.bind(this));
            video.addEventListener("seeking", this._onSeekingState.bind(this));
            video.addEventListener("seeked", this._onSeekedState.bind(this));
            video.addEventListener("waiting", this._onWaitingState.bind(this));
            video.addEventListener("timeupdate", _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'timeUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("volumechange", this._onVolumechangeState.bind(this));
            video.addEventListener("durationUpdate", _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'durationUpdate', this).bind(this)); //调用父类方法
            video.addEventListener("canplay", this._onCanPlayState.bind(this));
            video.addEventListener("click", this._onClickOperation.bind(this));

            if (param.customUI) {
                //派发构建自定义UI事件
                this.AVPLAYER.trigger(_events2.default.BUILD_CUSTOM_UI, { media: video });
            } else {
                video.setAttribute("controls", ""); //使用浏览器默认的UI
            }

            var div = document.getElementById(param.parentId); //如果业务方没有传入pDivId，h5 player会生成一个pDivId，此时这个div有可能在dom上不存在
            if (!!div) {
                div.appendChild(video);
                if (div.className === "") {
                    //设置avplayer container默认样式
                    div.className = "defaultContainerStyle";
                }
            } else {
                var p_div = document.createElement("div");
                p_div.className = "defaultContainerStyle";
                p_div.id = pid;
                p_div.appendChild(video);
            }

            if (param.urlFlag) {
                //直接播放视频url
                if ((0, _commonFunctions.isString)(param.poster)) {
                    video.poster = param.posterURL; //加载封面图片
                }
                this._video_url = param.url; //记录地址
                this._attachMedia(this._video);
                this._loadSource(param.url);
            }
        }
    }, {
        key: 'onMediaAttached',
        value: function onMediaAttached(data) {
            _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.READY);
        }
    }, {
        key: 'onManifestLoaded',
        value: function onManifestLoaded(data) {
            if (this._totalDuration != data.levels[0].details.totalduration) {
                this._totalDuration = data.levels[0].details.totalduration;
                _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'durationUpdate', this).call(this);
            }
        }
    }, {
        key: 'onFragLoaded',
        value: function onFragLoaded(data) {
            if (!this._firstBufferFullFlag) {
                //this._statData.videoGetTime += data.stats.dlCost;
                // this._statData.videoDlSize += data.stats.total;

                //首片ts下载耗时和大小

                //super.log("pchtml5 首屏首片ts耗时->", this._statData.videoGetTime, "首屏ts大小->", this._statData.videoDlSize, "ts_ip->", this._statData.videoIP, "ts_hitCache->", this._statData.tsHitCache);
            }
        }
    }, {
        key: 'onFragBuffered',
        value: function onFragBuffered(data) {
            //super.log("第" + data.frag.sn + "片ts buffered，耗时->" + data.stats.fragmentBufferedCost, "video buffered->", this._video.buffered.end(0));
            if (!this._firstBufferFullFlag) {
                //this._statData.demuxCost += data.stats.fragmentBufferedCost;
                if (!this._param.autoPlay) {
                    //非自动播放，如果video.buffered.end(0) > 1， 则认为缓冲区已满，可以播放； 自动播放时在onPlayState函数中处理
                    if (this._video.buffered.end(0) > 1) {
                        this._firstBufferFullFlag = true;
                        this._onFirstBufferFull();
                    }
                }
            }
        }
    }, {
        key: 'onError',
        value: function onError(data) {
            if (!this._playerRemovedFlag) {
                var http_err = void 0;
                var err_reason = void 0;
                switch (data.details) {//匹配错误原因
                    case _errors.ErrorDetails.MANIFEST_LOAD_ERROR:
                        http_err = 40001;
                        err_reason = "m3u8_404";
                        break;
                    case _errors.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
                        http_err = 40002;
                        break;
                    case _errors.ErrorDetails.MANIFEST_PARSING_ERROR:
                        http_err = 40003;
                        break;
                    case _errors.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR:
                        http_err = 40004;
                        break;
                    case _errors.ErrorDetails.LEVEL_LOAD_ERROR:
                        http_err = 40005;
                        break;
                    case _errors.ErrorDetails.LEVEL_LOAD_TIMEOUT:
                        http_err = 40006;
                        break;
                    case _errors.ErrorDetails.LEVEL_SWITCH_ERROR:
                        http_err = 40007;
                        break;
                    case _errors.ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
                        http_err = 40008;
                        break;
                    case _errors.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
                        http_err = 40009;
                        break;
                    case _errors.ErrorDetails.FRAG_LOAD_ERROR:
                        http_err = 40010;
                        break;
                    case _errors.ErrorDetails.FRAG_LOOP_LOADING_ERROR:
                        http_err = 40011;
                        break;
                    case _errors.ErrorDetails.FRAG_LOAD_TIMEOUT:
                        http_err = 40012;
                        break;
                    case _errors.ErrorDetails.FRAG_DECRYPT_ERROR:
                        http_err = 40013;
                        break;
                    case _errors.ErrorDetails.FRAG_PARSING_ERROR:
                        http_err = 40014;
                        break;
                    case _errors.ErrorDetails.KEY_LOAD_ERROR:
                        http_err = 40015;
                        break;
                    case _errors.ErrorDetails.KEY_LOAD_TIMEOUT:
                        http_err = 40016;
                        break;
                    case _errors.ErrorDetails.BUFFER_ADD_CODEC_ERROR:
                        http_err = 40017;
                        break;
                    case _errors.ErrorDetails.BUFFER_APPEND_ERROR:
                        http_err = 40018;
                        break;
                    case _errors.ErrorDetails.BUFFER_APPENDING_ERROR:
                        http_err = 40019;
                        break;
                    case _errors.ErrorDetails.BUFFER_STALLED_ERROR:
                        http_err = 40020;
                        break;
                    case _errors.ErrorDetails.BUFFER_FULL_ERROR:
                        http_err = 40021;
                        break;
                    case _errors.ErrorDetails.BUFFER_SEEK_OVER_HOLE:
                        http_err = 40022;
                        break;
                    case _errors.ErrorDetails.INTERNAL_EXCEPTION:
                        http_err = 40023;
                        break;
                    case _errors.ErrorDetails.JSONP_FAILED:
                        http_err = 40024;
                        break;
                    case _errors.ErrorDetails.JSONP_DATA_NULL:
                        http_err = 40025;
                        break;
                    default:
                        http_err = 40030; //unknown error
                        break;
                }

                _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.ERROR_OCCURRED);
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
                //0->No information is available about the media resource
                //1->Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
                //2->Data is available for the current playback position, but not enough to actually play more than one frame.
                //3->Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
                //4->Enough data is available—and the download rate is high enough—that the media can be played through to the end without interruption.
                if (this._video.readyState >= 2) {
                    this._video.play();
                } else {
                    //readyState位0或1
                    _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.BUFFERING);
                }
            }
        }

        //手动重播

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
                        _avlog2.default.print('onRemove err:, ' + err);
                    }
                    this._activated = false; //置于非激活状态            
                }
            }
        }

        /**
         * 绑定媒体
         * @param  {[type]} media [description]
         * @return {[type]}       [description]
         */

    }, {
        key: '_attachMedia',
        value: function _attachMedia(media) {
            this.AVPLAYER.trigger(_events2.default.MEDIA_ATTACHING, { media: media });
        }

        /**
         * 派发下载manifest事件
         * @param  {[type]} url [description]
         * @return {[type]}     [description]
         */

    }, {
        key: '_loadSource',
        value: function _loadSource(url) {
            this.AVPLAYER.trigger(_events2.default.MANIFEST_LOADING, { url: url });
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
            } else {
                _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAYING); //播放器进入playing状态
            }
        }
    }, {
        key: '_onFirstBufferFull',
        value: function _onFirstBufferFull() {
            this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), 300);

            //计算码率，首片ts bitrate = 首片ts filesize /  首片ts duration
            var first_ts_duration = this._video.buffered.end(0) - this._video.buffered.start(0); //首片ts最后一帧的pts - 首帧pts
            //let bitrate = Math.round(this._statData.videoDlSize * 8 / first_ts_duration); //此时计算出来的结果和ffprobe输出的误差很小

            //AVLog.print(`首片ts码率 {bitrate} bps`);

            if (this._totalDuration != this._video.duration) {
                //和onEndedState时的duration不一致
                this._totalDuration = this._video.duration;
                this.AVPLAYER.trigger(_events2.default.DURATION_UPDATE, { duration: this._totalDuration });
            }

            _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAY_START);
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
    }, {
        key: '_onPauseState',
        value: function _onPauseState(event) {
            _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PAUSED);
        }

        /**
         * 播放结束
         * @param  {[type]}
         * @return {[type]}
         */

    }, {
        key: '_onEndedState',
        value: function _onEndedState(event) {
            _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.PLAYBACK_COMPLETE);

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
            if (!this._playerRemovedFlag) {
                //remove player时也会收到error事件
                _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.ERROR_OCCURRED);
            }
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
                _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'playerStateChange', this).call(this, _avplayerStates.AVPlayerStates.BUFFERING);
            }
        }
    }, {
        key: '_onVolumechangeState',
        value: function _onVolumechangeState(event) {
            //super.log("volumechange->", this._video.volume); //声量最大为1，最小为0
        }
    }, {
        key: '_onLoadeddataState',
        value: function _onLoadeddataState(event) {
            //super.log("loadeddata readystate->", this._video.readyState); //why always 4
        }
    }, {
        key: '_onCanPlayState',
        value: function _onCanPlayState(event) {
            //super.log("canplay->", this._video.buffered.end(0), "videoWidth->", this._video.videoWidth, "videoHeight->", this._video.videoHeight, this._video.width, this._video.height);
        }
    }, {
        key: '_onClickOperation',
        value: function _onClickOperation(event) {
            _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'log', this).call(this, "_onClickOperation->", this._mediaState);
            switch (this._mediaState) {
                case _avplayerStates.AVPlayerStates.IDLE:
                    _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'log', this).call(this, "please wait");
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
                    this.onRewind();
                    break;
                case _avplayerStates.AVPlayerStates.ERROR_OCCURRED:
                    _get(AVPlayerPCH5Hls.prototype.__proto__ || Object.getPrototypeOf(AVPlayerPCH5Hls.prototype), 'log', this).call(this, "播放遇到错误");
                    break;
                default:
                    break;
            }
        }
    }]);

    return AVPlayerPCH5Hls;
}(_avplayerBase2.default);

exports.default = AVPlayerPCH5Hls;