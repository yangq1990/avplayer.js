import Event from '../core/events';
import AVPlayerBase from '../core/avplayer-base.js';
import {AVPlayerStates} from '../core/avplayer-states.js';
import {ErrorTypes, ErrorDetails} from '../core/errors';
import {isString} from '../utils/common-functions.js';
import AVLog from '../utils/avlog.js';



/**
 * 生成PC端HTML5播放器，使用video标签和mse播放hls
 * @author yangq
 */
class AVPlayerPCH5Hls extends AVPlayerBase {
    constructor(AVPLAYER) {
        super(AVPLAYER,  
            Event.SETUP_PCH5_HLS,
            Event.MEDIA_ATTACHED,
            Event.MANIFEST_LOADED,
            Event.FRAG_LOADED,
            Event.FRAG_BUFFERED,
            Event.ERROR,
            Event.PAUSE,
            Event.PLAY,
            Event.REWIND,
            Event.MUTE,
            Event.UNMUTE,
            Event.SEEK,
            Event.SET_VOLUME,
            Event.REMOVE);

        this._activated = false; //播放器是否被激活

        this._mediaState = AVPlayerStates.IDLE; //初始时idle状态
        
        this._firstBufferFullFlag = false;
        this._totalDuration = 0; //视频总时长
    }

    onSetupPCH5Hls(data) {
        this._activated = true; //被激活

        let param = this._param = data.param, w = param.width, h = param.height;

        let video = document.createElement("video");
        this._video = video; //获取video对象的引用
        video.id = "video"  + param.nodeId; //记录video标签id属性的值
        video.width = w;
        video.height = h;      
        
        if(param.autoPlay === 1) { //自动播放
            video.autoplay = "autoplay";
        }
        
        video.addEventListener("play", this._onPlayState.bind(this));
        video.addEventListener("pause", this._onPauseState.bind(this));
        video.addEventListener("error", this._onErrorState.bind(this));
        video.addEventListener("ended", this._onEndedState.bind(this));
        video.addEventListener("seeking", this._onSeekingState.bind(this));
        video.addEventListener("seeked", this._onSeekedState.bind(this));
        video.addEventListener("waiting", this._onWaitingState.bind(this));
        video.addEventListener("timeupdate", super.timeUpdate.bind(this)); //调用父类方法
        video.addEventListener("volumechange", this._onVolumechangeState.bind(this));
        video.addEventListener("durationUpdate", super.durationUpdate.bind(this)); //调用父类方法
        video.addEventListener("canplay", this._onCanPlayState.bind(this));
        video.addEventListener("click", this._onClickOperation.bind(this));

        if(param.customUI) { //派发构建自定义UI事件
            this.AVPLAYER.trigger(Event.BUILD_CUSTOM_UI, {media: video});
        } else {
            video.setAttribute("controls",""); //使用浏览器默认的UI
        }

        let div = document.getElementById(param.parentId); //如果业务方没有传入pDivId，h5 player会生成一个pDivId，此时这个div有可能在dom上不存在
        if(!!div) {
            div.appendChild(video);
            if(div.className === "") { //设置avplayer container默认样式
                div.className = "defaultContainerStyle";
            }
        } else {
            let p_div = document.createElement("div");
            p_div.className = "defaultContainerStyle";
            p_div.id = pid;
            p_div.appendChild(video);
        }

        if(param.urlFlag) { //直接播放视频url
            if(isString(param.poster)) {
                video.poster = param.posterURL; //加载封面图片
            }
            this._video_url = param.url; //记录地址
            this._attachMedia(this._video);
            this._loadSource(param.url);
        }
    }

    onMediaAttached(data) {
        super.playerStateChange(AVPlayerStates.READY);
    }

    onManifestLoaded(data) {
        if(this._totalDuration != data.levels[0].details.totalduration) {
            this._totalDuration = data.levels[0].details.totalduration;
            super.durationUpdate();
        }
    }

    onFragLoaded(data) {
        if(!this._firstBufferFullFlag) {
            //this._statData.videoGetTime += data.stats.dlCost;
           // this._statData.videoDlSize += data.stats.total;

            //首片ts下载耗时和大小

            //super.log("pchtml5 首屏首片ts耗时->", this._statData.videoGetTime, "首屏ts大小->", this._statData.videoDlSize, "ts_ip->", this._statData.videoIP, "ts_hitCache->", this._statData.tsHitCache);
        }
    }

    onFragBuffered(data) {
        //super.log("第" + data.frag.sn + "片ts buffered，耗时->" + data.stats.fragmentBufferedCost, "video buffered->", this._video.buffered.end(0));
        if(!this._firstBufferFullFlag) {
            //this._statData.demuxCost += data.stats.fragmentBufferedCost;
            if(!this._param.autoPlay) { //非自动播放，如果video.buffered.end(0) > 1， 则认为缓冲区已满，可以播放； 自动播放时在onPlayState函数中处理
                if(this._video.buffered.end(0) > 1) {
                    this._firstBufferFullFlag = true;
                    this._onFirstBufferFull();
                }
            }
        }
    }

    onError(data) {
        if(!this._playerRemovedFlag) {
            let http_err;
            let err_reason;
            switch(data.details) { //匹配错误原因
                case ErrorDetails.MANIFEST_LOAD_ERROR:
                    http_err = 40001;
                    err_reason = "m3u8_404";
                    break;
                case ErrorDetails.MANIFEST_LOAD_TIMEOUT:
                    http_err = 40002;
                    break;
                case ErrorDetails.MANIFEST_PARSING_ERROR:
                    http_err = 40003;
                    break;
                case ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR:
                    http_err = 40004;
                    break;
                case ErrorDetails.LEVEL_LOAD_ERROR:
                    http_err = 40005;
                    break;
                case ErrorDetails.LEVEL_LOAD_TIMEOUT:
                    http_err = 40006;
                    break;
                case ErrorDetails.LEVEL_SWITCH_ERROR:
                    http_err = 40007;
                    break;
                case ErrorDetails.AUDIO_TRACK_LOAD_ERROR:
                    http_err = 40008;
                    break;
                case ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT:
                    http_err = 40009;
                    break;
                case ErrorDetails.FRAG_LOAD_ERROR:
                    http_err = 40010;
                    break;
                case ErrorDetails.FRAG_LOOP_LOADING_ERROR:
                    http_err = 40011;
                    break;
                case ErrorDetails.FRAG_LOAD_TIMEOUT:
                    http_err = 40012;
                    break;
                case ErrorDetails.FRAG_DECRYPT_ERROR:
                    http_err = 40013;
                    break;
                case ErrorDetails.FRAG_PARSING_ERROR:
                    http_err = 40014;
                    break;
                case ErrorDetails.KEY_LOAD_ERROR:
                    http_err = 40015;
                    break;
                case ErrorDetails.KEY_LOAD_TIMEOUT:
                    http_err = 40016;
                    break;
                case ErrorDetails.BUFFER_ADD_CODEC_ERROR:
                    http_err = 40017;
                    break;
                case ErrorDetails.BUFFER_APPEND_ERROR:
                    http_err = 40018;
                    break;
                case ErrorDetails.BUFFER_APPENDING_ERROR:
                    http_err = 40019;
                    break;
                case ErrorDetails.BUFFER_STALLED_ERROR:
                    http_err = 40020;
                    break;
                case ErrorDetails.BUFFER_FULL_ERROR:
                    http_err = 40021;
                    break;
                case ErrorDetails.BUFFER_SEEK_OVER_HOLE:
                    http_err = 40022;
                    break;
                case ErrorDetails.INTERNAL_EXCEPTION:
                    http_err = 40023;
                    break;
                case ErrorDetails.JSONP_FAILED:
                    http_err = 40024;
                    break;
                case ErrorDetails.JSONP_DATA_NULL:
                    http_err = 40025;
                    break;
                default:
                    http_err = 40030; //unknown error
                    break;
            }

            super.playerStateChange(AVPlayerStates.ERROR_OCCURRED);
        }
    }

    onPause() {
        if(this._activated) {
            if(!!this._video) {
                this._video.pause();
            }
        }        
    }

    onPlay() {
        if(this._activated) {
            //0->No information is available about the media resource
            //1->Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
            //2->Data is available for the current playback position, but not enough to actually play more than one frame.
            //3->Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
            //4->Enough data is available—and the download rate is high enough—that the media can be played through to the end without interruption.
            if(this._video.readyState >= 2) {
                this._video.play();
            } else { //readyState位0或1
                super.playerStateChange(AVPlayerStates.BUFFERING);
            }
        }        
    }

    //手动重播
    onRewind() {
        if(!this._param.autoRewind) {
            this.onSeek({time: 0});
        }        
    }

    onMute() {
        if(this._activated) {
            if(!!this._video) {
                if(!this._video.muted) {
                    this._video.muted = true;
                }
            }
        }        
    }

    onUnmute() {
        if(this._activated) {
            if(!!this._video) {
                if(this._video.muted) {
                    this._video.muted = false;
                }
            }
        }        
    }

    onSeek(data) {
        if(this._activated) {
            if(!!this._video) {
                if(this._video.readyState >= 2) {
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
    onSetVolume(data) {
        if(this._activated) {
            if(!!this._video) {
                let vol  = data.volume;
                if(vol > 100) {
                    vol = 100;
                } 
                if(vol < 0) {
                    vol = 0;
                }
                this._video.volume = vol/100; //0->最小音量  1->最大音量
            }
        }
    }

    onRemove() {
        if(this._activated) {
            if(!!this._video) {
                try {
                    if(!!this._cbInterval) { //移除timer
                        clearInterval(this._cbInterval);
                    }
                    this._video.pause();
                    this._playerRemovedFlag = true; //播放器被destroy标识
                    this._video.src = "about:blank"; //改变src后会自动load
                     this._video.parentNode && this._video.parentNode.removeChild(this._video);
                } catch(err) {
                    AVLog.print(`onRemove err:, ${err}`);
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
    _attachMedia(media) {
        this.AVPLAYER.trigger(Event.MEDIA_ATTACHING, {media: media});
    }


    /**
     * 派发下载manifest事件
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    _loadSource(url) {
        this.AVPLAYER.trigger(Event.MANIFEST_LOADING, {url: url});
    }

    /**
     * 处理video侦听到的play事件, 标识媒介已就绪可以开始播放
     * @param  {event}
     * @return {[type]}
     */
    _onPlayState(event) {
        if(!this._firstBufferFullFlag) {
            this._firstBufferFullFlag = true;
        } else {
            super.playerStateChange(AVPlayerStates.PLAYING); //播放器进入playing状态
        }
    }

    _onFirstBufferFull() {
        this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), 300);

        //计算码率，首片ts bitrate = 首片ts filesize /  首片ts duration
        let first_ts_duration = this._video.buffered.end(0) - this._video.buffered.start(0); //首片ts最后一帧的pts - 首帧pts
        //let bitrate = Math.round(this._statData.videoDlSize * 8 / first_ts_duration); //此时计算出来的结果和ffprobe输出的误差很小

        //AVLog.print(`首片ts码率 {bitrate} bps`);

        if(this._totalDuration != this._video.duration) { //和onEndedState时的duration不一致
            this._totalDuration = this._video.duration;
            this.AVPLAYER.trigger(Event.DURATION_UPDATE, {duration: this._totalDuration});
        }

        super.playerStateChange(AVPlayerStates.PLAY_START);
    }

    //每300ms检查并通知当前缓冲进度
    _checkBufferedInterval() {
        //check length first in case of "Failed to execute 'end' on 'TimeRanges': The index provided (0) is greater than or equal to the maximum bound (0)"
        if((this._video.buffered.length > 0) && (this._buffered != this._video.buffered.end(0))) {
            this._buffered = this._video.buffered.end(0);
            this.AVPLAYER.trigger(Event.BUFFERED_UPDATE, {buffered: this._video.buffered.end(0)});
        }
    }

    _onPauseState(event) {
        super.playerStateChange(AVPlayerStates.PAUSED);
    }

    /**
     * 播放结束
     * @param  {[type]}
     * @return {[type]}
     */
    _onEndedState(event) {
        super.playerStateChange(AVPlayerStates.PLAYBACK_COMPLETE);

        if(this._param.autoRewind) { //配置了自动重播
            this.onSeek({time: 0});
        }
    }

    /**
     * 处理video侦听到的error事件
     * @param  {event}
     * @return {void}
     */
    _onErrorState(event) {
        if(!this._playerRemovedFlag) { //remove player时也会收到error事件
            super.playerStateChange(AVPlayerStates.ERROR_OCCURRED);
        }        
    }

    _onSeekingState(event) {
    }


    _onSeekedState(event) {
        if(this._seekOperationFlag && this._video.paused) { //seek操作后控制video播放
            this._video.play();
            this._seekOperationFlag = false;
        }
    }

    _onWaitingState(event) {
        //0->NETWORK_EMPTY - 音频/视频尚未初始化
        //1->NETWORK_IDLE - 音频/视频是活动的且已选取资源，但并未使用网络
        //2->NETWORK_LOADING - 浏览器正在下载数据
        //3->NETWORK_NO_SOURCE - 未找到音频/视频来源
        if(this._video.networkState == 2) { //buffering状态，这个不一定可靠，需要验证
            super.playerStateChange(AVPlayerStates.BUFFERING);
        }
    }

    _onVolumechangeState(event) {
        //super.log("volumechange->", this._video.volume); //声量最大为1，最小为0
    }

    _onLoadeddataState(event) {
        //super.log("loadeddata readystate->", this._video.readyState); //why always 4
    }

    _onCanPlayState(event) {
        //super.log("canplay->", this._video.buffered.end(0), "videoWidth->", this._video.videoWidth, "videoHeight->", this._video.videoHeight, this._video.width, this._video.height);
    }

    _onClickOperation(event) {
        super.log("_onClickOperation->", this._mediaState);
        switch(this._mediaState) {
            case AVPlayerStates.IDLE:
                super.log("please wait");
                break;
            case AVPlayerStates.READY:
                if(this._video.paused && this._video.readyState >= 2) {
                    this._video.play();
                }
                break;
            case AVPlayerStates.PAUSED:
                this.onPlay();
                break;
            case AVPlayerStates.PLAYING:
                this.onPause();
                break;
            case AVPlayerStates.PLAYBACK_COMPLETE:
                this.onRewind();
                break;
            case AVPlayerStates.ERROR_OCCURRED:
                super.log("播放遇到错误");
                break;
            default:
                break;
        }
    }
}

export default AVPlayerPCH5Hls;