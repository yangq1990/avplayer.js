import Event from '../core/events.js';
import AVPlayerBase from '../core/avplayer-base.js';
import {AVPlayerStates} from '../core/avplayer-states.js';
import {AVPlayerTips} from '../core/avplayer-tips.js';
import {isString} from '../utils/common-functions.js';

/**
 * 生成移动端HTML5播放器
 * @author yangq
 */
class AVPlayerMobileH5 extends AVPlayerBase {
    constructor(AVPLAYER) {
        super(AVPLAYER, 
            Event.SETUP_MOBILEH5,
            Event.PAUSE,
            Event.PLAY,
            Event.MUTE,
            Event.UNMUTE,
            Event.REMOVE,
            Event.RESUME);

        this._activated = false; //播放器是否被激活
        this._mediaState = AVPlayerStates.IDLE; //初始时idle状态
    }

    onSetupMobileH5(data) {
        this._activated = true; //被激活
        this._param = data.param;
        this._setVideo();
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
            if(!!this._video) {
                this._video.play();
            }
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

    onRemove() {
        if(this._activated) {
            if(!!this._video) {
                try {
                    this._video.pause();
                    this._video.src = "about:blank"; //改变src后会自动load
                    this._video.parentNode && this._video.parentNode.removeChild(this._video);
                    this._playerRemovedFlag = true; //播放器被destroy标识
                } catch(err) {
                    super.log("onRemove err->", err);
                }                
                this._activated = false;
            }
        }        
    }

    onResume(data) {
        if(this._activated) {
            let video;
            if(!!data.divId) { //传入了parent div id
                let parentDiv = document.getElementById(divId);
                if(parentDiv === null) {
                    throw new Error("所传id代表的div不存在，请检查!!!");
                } else { //获取父div下的第一个video的引用
                    video = parentDiv.getElementsByTagName("video")[0];
                }
            } else { //没有传入parent div id，则默认resume页面第一个video
                video = document.getElementsByTagName("video")[0];
            }

            if(video !== null) { //resume
                video.pause();
                video.play();
            }
        }        
    }

    _setVideo() {
        let param = this._param, w = param.width, h = param.height;

        let video = document.createElement("video");
        this._video = video; //获取video对象的引用
        video.id = "video"  + param.nodeId; //记录video标签id属性的值
        video.width = w;
        video.height = h;      
        
        if(param.autoPlay === 1){
            video.autoplay = "autoplay";
        }
        
        video.setAttribute("webkit-playsinline",""); //ios app内，如果webview设置 allowsInlineMediaPlayback 后可内联播放
        video.setAttribute("playsinline", ""); //ios10 safari 允许视频内联播放
        video.addEventListener("play", this._onPlayState.bind(this));
        video.addEventListener("pause", this._onPauseState.bind(this));
        video.addEventListener("seeking", this._onSeekingState.bind(this));
        video.addEventListener("error", this._onErrorState.bind(this));
        video.addEventListener("timeupdate", super.timeUpdate.bind(this)); //调用父类方法
        video.addEventListener("ended", this._onEndedState.bind(this));
        video.addEventListener("durationUpdate", super.durationUpdate.bind(this)); //调用父类方法
        video.addEventListener("canplay", this._onCanPlayState.bind(this));
        // video.addEventListener("click", this._onClickOperation.bind(this));        
        //loadstart loadeddata loadedmetadata等事件在移动端浏览器不可靠
        
        let div = document.getElementById(param.parentId); //如果没有传入parentId，avplayer.js会生成一个parentId，此时parent node有可能在dom上不存在
        if(!!div) {
            div.appendChild(video);
        } else {
            let p_div = document.createElement("div");
            p_div.id = pid;
            p_div.appendChild(video);
        }

        if(param.urlFlag) { //直接播放视频url
            if(isString(param.poster)) {
                video.poster = param.poster; //加载封面图片
            }
            this._video_url = param.url; //记录视频地址
            video.src = param.url;
            super.playerStateChange(AVPlayerStates.READY);
        }

        //自动播放，仅在微信下可能有效，处理与http://res.wx.qq.com/open/js/jweixin-1.0.0.js相关的状态
        if(param.autoPlay === 1 && getMobileSystemInfo().browser === 4) {
            document.addEventListener("WeixinJSBridgeReady", this._onWeixinJSBridgeReady.bind(this));
        }
    }    

    _onWeixinJSBridgeReady() {
        if(!!this._video) {
            this._video.play();
        }
    }

    /**
     * 处理video侦听到的play事件
     * @param  {event}
     * @return {[type]}
     */
    _onPlayState(event) {

    }

    _onPauseState(event) {
        //创建好播放器，微信 手Q QQ浏览器在派发video play事件后之后立即pause video  此时播放器处于play_start状态，& 播放头位置为0(小于0.1)
        if(this._mediaState === AVPlayerStates.PLAY_START && this._video.currentTime < 0.1) { 
            return;
        }

        if(Math.abs(this._video.currentTime - this._video.duration) <= 0.1) { //如微信等浏览器在播放结束前，会先派发pause事件
            return;
        }

        if(!!this._errInfo) { //uc等浏览器在播放出错时会触发pause事件
            return;
        }

        super.playerStateChange(AVPlayerStates.PAUSED);
    }

    _onSeekingState(event) {
        
    }

    /**
     * 播放结束
     * @param  {[type]}
     * @return {[type]}
     */
    _onEndedState(event) {
        super.playerStateChange(AVPlayerStates.PLAYBACK_COMPLETE);
    }

    /**
     * 移动端浏览器canplay事件和pc浏览器canplay事件不同。移动端为了节省用户流量，使用移动数据时不会预加载视频（wifi下部分浏览器会预加载），派发canplay事件时，buffered.length为0
     * pc端浏览器派发canplay事件，表明视频首屏已经缓冲好，可以播放了
     */
    _onCanPlayState(event) {
        this._cbInterval = window.setInterval(this._checkBufferedInterval.bind(this), NumberConst.CheckBufferMillisec);
    }

    //每300ms检查并通知当前缓冲进度
    _checkBufferedInterval() {
        //check length first in case of "Failed to execute 'end' on 'TimeRanges': The index provided (0) is greater than or equal to the maximum bound (0)"
        //在移动端浏览器，如uc，this._video.bufferer.length 始终为0 ，不清楚是什么情况
        if((this._video.buffered.length > 0) && (this._buffered != this._video.buffered.end(0))) {
            this._buffered = this._video.buffered.end(0);
            this.AVPLAYER.trigger(Event.BUFFERED_UPDATE, {buffered: this._video.buffered.end(0)});
        }
    }

    /**
     * 处理video侦听到的error事件
     * @param  {event}
     * @return {void}
     */
    _onErrorState(event) {
        //移除播放器时导致的错误 || 空對象
        if(this._playerRemovedFlag || event.target === null || event.target.error === null) { 
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
}

export default AVPlayerMobileH5;