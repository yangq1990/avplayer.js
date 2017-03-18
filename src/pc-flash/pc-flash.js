import EventHandler from '../core/event-handler.js';
import Event from '../core/events.js';

/**
 * 嵌入flash播放器
 * @author yangq
 */
class AVPlayerFlash extends EventHandler {
    constructor(AVPLAYER) {
        super(AVPLAYER, 
            Event.SETUP_FLASH,
            Event.PAUSE,
            Event.PLAY,
            Event.MUTE,
            Event.UNMUTE,
            Event.SEEK,
            Event.REMOVE);
        this._activated = false; //播放器是否被激活
    }

    onSetupFlash(data) {
        this._activated = true; //被激活
        
        let div = document.getElementById(data.param.parentId);
        if(!div) {
            div = document.createElement("div");
            div.id = data.param.parentId;
        }

        if(this._hasFlash()) {
            this._initFlashPlayer(data.param);
        } else {
            div.innerHTML = "<a href=\"http://get.adobe.com/flashplayer/\">You need to install adobe flashplayer first.</a>";
        }
    }

    onPause() {
        if(this._activated) {
             this._thisMovie(this._swfName).avplayer_pause();
        }
    }

    onPlay() {
        if(this._activated) {
            this._thisMovie(this._swfName).avplayer_play();
        }
    }

    onMute() {
        if(this._activated) {
            this._thisMovie(this._swfName).avplayer_mute();
        }   
    }

    onUnmute() {
        if(this._activated) {
            this._thisMovie(this._swfName).avplayer_unmute();
        }
    }

    onSeek(data) {
        if(this._activated) {
            this._thisMovie(this._swfName).avplayer_seek(data.time);
        }
    }

    onRemove() {
        if(this._activated) {
            try {
                let swf = this._thisMovie(this._swfName);
                if(!!swf) {
                    swf.parentNode && swf.parentNode.removeChild(swf);
                }
            } catch(err) {
                
            }         

            this._activated = false; //置于非激活状态   
        }
    }

    _initFlashPlayer(param) {
        this._swfName = 'flash' + param.nodeId;

        let parentDiv = document.getElementById(param.parentId);
        let swfAddress = "./flash/loader.swf";
        let html = "";

        if(!!param.url) {
            if(this._isIEOldVersion()) {
                html = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" type="application/x-shockwave-flash" id="flash' + param.nodeId + '" name=flash"' + param.nodeId + '" width="' + param.width + '" height="' + param.height
                    + '" data="' + swfAddress + '">'
                    + '<param name="movie" value="' + swfAddress + '">'
                    + '<param name="allowscriptaccess" value="always">'
                    + '<param name="allowfullscreen" value="true">'
                    + '<param name="allowFullScreenInteractive" value="true">'
                    + '<param name="bgcolor" value="#000000">'
                    + '<param name="wmode" value="' + param.wmode + '">'
                    + '<param name="flashvars" value="url=' + param.url
                    + '&debug=' + this.AVPLAYER.config.debug 
                    + '&autoPlay=' + param.autoPlay
                    + '&title=' + param.title
                    + '&autoRewind=' + param.autoRewind
                    + '&disableHWAccel=' + param.disableHWAccel
                    + '&poster=' + param.poster
                    + '&simplifiedUI=' + param.simplifiedUI
                    + '">'
            } else {
                html = '<embed id ="flash' + param.nodeId + '" name ="flash' + param.nodeId +  '" width="' + param.width + '" height="' + param.height
                    + '" flashvars="url=' + param.url
                    + '&debug=' + this.AVPLAYER.config.debug
                    + '&title=' + param.title
                    + '&autoRewind=' + param.autoRewind
                    + '&poster=' + param.poster
                    + '&autoPlay=' + param.autoPlay 
                    + '&disableHWAccel=' + param.disableHWAccel
                    + '&simplifiedUI=' + param.simplifiedUI
                    + '" src="' + swfAddress + '" type = "application/x-shockwave-flash" wmode="' + param.wmode 
                    + '" quality="high" bgcolor="#000000" allowfullscreen="true" allowscriptaccess="always">' ;
            }
        }
                   
        parentDiv.innerHTML = html;                      
    }

    _hasFlash() {
        var version = '0,0,0,0';
        try {
            try {
                var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
                try {
                    axo.AllowScriptAccess = 'always';
                } catch(e) {
                    version = '6,0,0';
                }
            } catch(e) {}
            version = new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$' + 'version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
        } catch(e) {
            try {
                if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                    version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
                }
            } catch(e) {}
        }
        var major = parseInt(version.split(',')[0], 10);
        var minor = parseInt(version.split(',')[2], 10);
        if (major > 9 || (major == 9 && minor > 97)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 检测用户当前浏览器是否为IE7|IE8|IE9|IE10等旧版浏览器
     * 如果是，用Object标签嵌入swf，确保js和swf的相互通信ok
     */
    _isIEOldVersion() {
        let ua = navigator.userAgent.toLowerCase();
        let isie;
        if (window.ActiveXObject) {
            isie = ua.match(/msie ([\d.]+)/)[1];
            if(isie == "7.0" || isie == "8.0" || isie == "9.0" || isie == "10.0") {
                return true;
            }
        }

        return false;
    }

    _thisMovie(movieName) {
        if (navigator.appName.indexOf("Microsoft") != -1) {
            return window[movieName];
        } else {
            return document[movieName];
        }
    }
}

export default AVPlayerFlash;