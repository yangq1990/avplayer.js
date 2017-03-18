
/**
 * AVPlayer的日志工具类
 * debug模式下，avplayer.js会把日志输出到用户指定的logDiv或者浏览器的控制台
 * @author yangq
 */
class AVLog {
    static get debug() {
        return this._debug;
    }

    static set debug(value) {
        this._debug = value;
    }

    static get logDivId() {
        return this._logDivId;
    }

    static set logDivId(id) {
        this._logDivId = id;
    }

    static print(...msg) {
        if(this._debug) {
            if(!!this._logDivId) {
                let logDiv = document.getElementById(this._logDivId);
                if(!!logDiv) {
                    let tempdiv = document.createElement("div");
                    tempdiv.innerHTML = "[" + new Date().toLocaleTimeString() + "] " + msg.join(" ");
                    logDiv.appendChild(tempdiv);
                }
            } else {
                console.log(...msg);
            }
        }        
    }
}

export default AVLog;