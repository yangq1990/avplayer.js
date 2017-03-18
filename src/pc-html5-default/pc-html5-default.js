import Event from '../core/events';
import AVPlayerBase from '../core/avplayer-base.js';
import {AVPlayerStates} from '../core/avplayer-states.js';
import {AVPlayerTips} from '../core/avplayer-tips.js';
import {NumberConst} from '../core/avplayer-number-const';
import {isString} from '../utils/common-functions.js';

/**
 * 生成PC端HTML5播放器，默认支持以下格式的视频
 * Ogg = 带有 Theora 视频编码和 Vorbis 音频编码的 Ogg 文件
 * MPEG4 = 带有 H.264 视频编码和 AAC 音频编码的 MPEG 4 文件
 * WebM = 带有 VP8 视频编码和 Vorbis 音频编码的 WebM 文件
 * @author yangq
 */
class AVPlayerPCH5Default extends AVPlayerBase {
    constructor(AVPLAYER) {
        super(AVPLAYER, 
            Event.SETUP_PCH5_DEFAULT,
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
    }

    onSetupPCH5Default(data) {
        this._activated = true; //被激活
        let param = this._param = data.param, w = param.width, h = param.height;

        let video = document.createElement("video");
        this._video = video; //获取video对象的引用
        video.id = "video"  + param.nodeId; //记录video标签id属性的值
        video.width = w;
        video.height = h;      
        
        if(param.autoPlay === 1){
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

        let div = document.getElementById(param.parentId); //如果没有传入parentId，avplayer.js会生成一个parentId，此时parent node有可能在dom上不存在
        if(!!div) {
            div.appendChild(video);
        } else {
            let p_div = document.createElement("div");
            p_div.id = param.parentId;
            p_div.appendChild(video);
        }

        if(param.urlFlag) { //直接播放视频url
            if(isString(param.poster)) {
                video.poster = param.poster; //加载封面图片
            }
            this._video_url = video.src = param.url;
            super.playerStateChange(AVPlayerStates.READY);
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
            if(this._mediaState == AVPlayerStates.IDLE) { //播放器尚未ready
                return;
            }

            //0->No information is available about the media resource
            //1->Enough of the media resource has been retrieved that the metadata attributes are initialized. Seeking will no longer raise an exception.
            //2->Data is available for the current playback position, but not enough to actually play more than one frame.
            //3->Data for the current playback position as well as for at least a little bit of time into the future is available (in other words, at least two frames of video, for example).
            //4->Enough data is available—and the download rate is high enough—that the media can be played through to the end without interruption.
            if(this._video.readyState >= 2) {
                this._video.play();
            } else { //readyState位0或1
                super.playerStateChange(AVPlayerStates.BUFFERING); //播放器进入缓冲状态
            }
        }        
    }

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
                    super.log("onRemove err->", err);
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
    _onPlayState(event) {
        if(!this._firstBufferFullFlag) {
            this._firstBufferFullFlag = true;
            this._onFirstBufferFull();
        } else {
            super.playerStateChange(AVPlayerStates.PLAYING); //播放器进入playing状态
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
        if(this._playerRemovedFlag || this._retryCount > 0 || event.target === null || event.target.error === null) { 
            return;
        }

        switch(event.target.error.code) {
            case 1:
                this._errInfo = AVPlayerTips.T1;
                break;
            case 2:
                this._errInfo = AVPlayerTips.T2;
                break;
            case 3:
                this._errInfo = AVPlayerTips.T3;
               break;
            case 4:
                this._errInfo = AVPlayerTips.T4;
                break;
        }
        this._errCode = event.target.error.code;

        //显示文字提示
        super.applyStyle(this._errInfo);
        super.playerStateChange(AVPlayerStates.ERROR_OCCURRED);
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
        
    }

    _onCanPlayState(event) {
        //此时已经出现首屏画面
        if(!this._firstBufferFullFlag) {
            this._firstBufferFullFlag = true;
            this._onFirstBufferFull();
        }
    }

    _onClickOperation(event) {
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
                this.onReplay();
                break;
            case AVPlayerStates.ERROR_OCCURRED:
                super.log("播放遇到错误");
                break;
            default:
                break;
        }
    }

    _onFirstBufferFull() {
        this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), NumberConst.CheckBufferMillisec);
    }

    //每300ms检查并通知当前缓冲进度
    _checkBufferedInterval() {
        //check length first in case of "Failed to execute 'end' on 'TimeRanges': The index provided (0) is greater than or equal to the maximum bound (0)"
        if((this._video.buffered.length > 0) && (this._buffered != this._video.buffered.end(0))) {
            this._buffered = this._video.buffered.end(0);
            this.AVPLAYER.trigger(Event.BUFFERED_UPDATE, {buffered: this._video.buffered.end(0)});
        }
    }
}

export default AVPlayerPCH5Default;