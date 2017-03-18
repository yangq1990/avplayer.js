import EventHandler from './event-handler.js';
import Event from './events.js';
import {AVPlayerTips} from './avplayer-tips.js';

/**
 * AVPlayer基类
 * @author yangq
 */
class AVPlayerBase extends EventHandler {
    constructor(AVPLAYER, ...events) {
        super(AVPLAYER, ...events);
    }

    /**
     * 派发播放器状态改变事件
     */
    playerStateChange(newState) {
        this._mediaState = newState;
        this.AVPLAYER.trigger(Event.PLAYER_STATE_CHANGE, {state: newState});
    }

    /**
     * 时间进度更新
     */
    timeUpdate() {
        this.AVPLAYER.trigger(Event.TIME_UPDATE, {time: this._video.currentTime});
    }

    /**
     * 视频时长更新
     */
    durationUpdate() {
        if(this._video.duration > 1) { //在初始化播放器后，html5 video会派发durationUpdate事件，微信下此时的video.duration为0，uc下此时的video.duration为1，移动端浏览器的坑
            this.AVPLAYER.trigger(Event.DURATION_UPDATE, {duration: this._video.duration});
        }        
    }

    /** 出错时显示提示 */
    applyStyle(txt) {
        if(!txt) {
            txt = AVPlayerTips.T5;
        }

        let parentDiv = document.getElementById(this._param.parentId);
        if(!!parentDiv) { //这里用css代替js操作style，因为后一种方式会有坑爹的兼容性问题
            parentDiv.className = "yywebplayer_tips";
            parentDiv.innerHTML = txt;
        }
    }
}

export default AVPlayerBase;