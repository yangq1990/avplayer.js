'use strict';

import './utils/avplayer-console-polyfill.js';
import './utils/avplayer-performance-polyfill.js';
import EventEmitter from 'events';
import {createUUID, createNodeId} from './utils/common-functions.js';
import {getMobileSystemInfo} from './utils/systeminfo.js';
import BrowserSniff from './utils/browser-sniff';
import Event from './core/events.js';

import PlaylistLoader from './pc-html5-hls/loader/playlist-loader.js';
import FragmentLoader from './pc-html5-hls/loader/fragment-loader';
import KeyLoader from './pc-html5-hls/loader/key-loader';
import StreamController from  './pc-html5-hls/controller/stream-controller';
import LevelController from  './pc-html5-hls/controller/level-controller';

import AVLog from './utils/avlog.js';
import AVPlayerFlash from './pc-flash/pc-flash.js';
import AVPlayerMobileH5 from './mobile-html5/mobile-html5.js';
import AVPlayerPCH5Default from './pc-html5-default/pc-html5-default.js';
import AVPlayerPCH5Hls from './pc-html5-hls/pc-html5-hls.js';
import AVPlayerStates from './core/avplayer-states.js';
import {AVPlayerDefaultConfig} from './config.js';


/**
 * AVPlayer.js入口类
 * @author yangq
 */
class AVPlayer {

    static get version() {
        // replaced with browserify-versionify transform
        return '__VERSION__';
    }

    static get Events() {
        return Event;
    }

    static get States() {
        return AVPlayerStates;
    }

    /**
     * 构造函数
     */
    constructor(config = {}) {
        for (var prop in AVPlayerDefaultConfig) {
            if (prop in config) { continue; }
            config[prop] = AVPlayerDefaultConfig[prop];
        }

        AVLog.debug = config.debug; //config.debug为true则进入debug模式
        this.config = config;
        this._autoLevelCapping = -1;

        // observer setup
        var observer = this.observer = new EventEmitter();
        observer.trigger = function trigger (event, ...data) {
          observer.emit(event, event, ...data);
        };

        observer.off = function off (event, ...data) {
          observer.removeListener(event, ...data);
        };

        this.on = observer.on.bind(observer);
        this.off = observer.off.bind(observer);
        this.trigger = observer.trigger.bind(observer);

        this.avPlayerFlash = new AVPlayerFlash(this);
        this.avPlayerMobileH5 = new AVPlayerMobileH5(this);
        this.avPlayerPCH5Default = new AVPlayerPCH5Default(this);
        this.avPlayerPCH5Hls = new AVPlayerPCH5Hls(this);

        // core controllers and network loaders
        const abrController = this.abrController = new config.abrController(this);
        const bufferController  = new config.bufferController(this);
        const capLevelController = new config.capLevelController(this);
        const fpsController = new config.fpsController(this);
        const playListLoader = new PlaylistLoader(this);
        const fragmentLoader = new FragmentLoader(this);
        const keyLoader = new KeyLoader(this);

        // network controllers
        const levelController = this.levelController = new LevelController(this);
        const streamController = this.streamController = new StreamController(this);
        let networkControllers = [levelController, streamController];

        // optional audio stream controller
        let Controller = config.audioStreamController;
        if (Controller) {
          networkControllers.push(new Controller(this));
        }
        this.networkControllers = networkControllers;

        let coreComponents = [ playListLoader, fragmentLoader, keyLoader, abrController, bufferController, capLevelController, fpsController ];

        // optional audio track and subtitle controller
        Controller = config.audioTrackController;
        if (Controller) {
          let audioTrackController = new Controller(this);
          this.audioTrackController = audioTrackController;
          coreComponents.push(audioTrackController);
        }

        Controller = config.subtitleTrackController;
        if (Controller) {
          let subtitleTrackController = new Controller(this);
          this.subtitleTrackController = subtitleTrackController;
          coreComponents.push(subtitleTrackController);
        }

        // optional subtitle controller
        [config.subtitleStreamController, config.timelineController].forEach(Controller => {
          if (Controller) {
            coreComponents.push(new Controller(this));
          }
        });
        this.coreComponents = coreComponents;
    }

    /**
     * 生成HTML5 | Flash播放器
     * @param  {[type]} url  [description]
     * @param  {[type]} conf [description]
     * @return {[type]}      [description]
     */
    setup(url, conf) {
        this._bootTimestamp = performance.now();
        AVLog.print("播放器启动！！！");
        
        if(!url) {
            throw new Error("请传入视频文件地址");
        }

        let param = {};
        //https
      
        //播放器宽
        if(!!conf && !!conf["width"]) {
            param.width = conf["width"];
        } else {
            param.width = 640;
        }

        //播放器高
        if(!!conf && !!conf["height"]) {
            param.height = conf["height"];
        } else {
            param.height = 480;
        }

        if(!!conf && conf["parentId"]) {
            let parent = document.getElementById(conf["parentId"]); //获取父节点的引用
            if(parent === null) {
                throw new Error("父节点不存在，请检查!!!");
            } else {
                param.parentId = conf["parentId"]; //记录业务传入的parent node id
            }
        } else {
            param.parentId = "playerbox" + createNodeId(); //sdk生成一个parent node id并记录
            document.write('<div id="' + param.parentId + '" style="margin-right:auto;margin-left:auto;"></div>');
        }

        param.urlFlag = true;
        param.url = url;
        if(param.url.indexOf(".m3u8") != -1) {
            param.protocol = "hls";
        }

        //自动播放
        param.autoPlay = (!!conf && (conf["autoPlay"] !== undefined)) ? conf["autoPlay"] : 0;
        //封面图片地址
        param.posterURL = (!!conf && (conf["poster"] !== undefined)) ? conf["poster"] : ""; //默认封面图片地址为""
        //播放器节点id
        param.nodeId = createNodeId(); 
        //flash wmode
        param.wmode = (!!conf && conf["wmode"] !== undefined) ? conf["wmode"] : "opaque";
        //title
        param.title = (!!conf && conf["title"] !== undefined) ? conf["title"] : "";
        //autoReplay
        param.autoRewind = (!!conf && conf["autoRewind"] !== undefined) ? conf["autoRewind"] : 0;
        //disableFullScreenButton(for webview)
        param.disableFSButton = (!!conf && conf["disableFSButton"] !== undefined) ? conf["disableFSButton"] : 0;
        //prefer flash. we prefer html5 by default
        param.preferFlash =  (!!conf && (conf["preferFlash"] == 1 || conf["preferFlash"] == "1")) ? true : false;
        //cutomUI
        param.customUI = (!!conf && (conf["customUI"] == 1 || conf["customUI"] == "1")) ? true : false;
        //log div id
        if(!!conf && !!conf.logDivId) {
            AVLog.logDivId = conf.logDivId;
        }

        if(param.disableFSButton && (getMobileSystemInfo().sys==0)) { //禁用全屏按钮，只在android webview下生效

        }

        this._triggerSetupEvent(param);

    }

    _triggerSetupEvent(param) {
        let parseParamsCost = Math.round((performance.now() - this._bootTimestamp));
        AVLog.print(`参数解析完毕,耗时 ${parseParamsCost} ms`);

        let event_type;
        if(!param.preferFlash && BrowserSniff.isMSESupported && getMobileSystemInfo().browser !== 8) { //prefer html5 并且浏览器支持mse; 微博客户端居然支持mse，但是有很多问题
            if(param.protocol == "hls") {
                event_type = Event.SETUP_PCH5_HLS;
            } else { //not hls, default format
                event_type = Event.SETUP_PCH5_DEFAULT;
            }
        } else { //prefer flash or 浏览器支持不mse
            if(BrowserSniff.isMobileDevice) {
                event_type = Event.SETUP_MOBILEH5;
            } else {
                event_type = Event.SETUP_FLASH;
            }
        }

        this.trigger(event_type, {param: param});
    }

    startLoad(startPosition=-1) {
        AVLog.print(`startLoad(${startPosition})`);
        this.networkControllers.forEach(controller => {controller.startLoad(startPosition);});
    }

    pause() {
        this.trigger(Event.PAUSE);
    }

    play() {
        this.trigger(Event.PLAY);
    }

    mute() {
        this.trigger(Event.MUTE);
    }

    unmute() {
        this.trigger(Event.UNMUTE);
    }

    remove() {
        this.trigger(Event.REMOVE);
    }

    seek(value) {
        this.trigger(Event.SEEK, {time:value});
    }

    rewind() {
        this.trigger(Event.REWIND);
    }

    /**
     * 恢复播放器播放状态，隐藏video并重新显示video后调用
     * @param divId  video的父div id
     */
    resume(divId) {
        this.trigger(Event.RESUME, {divId: divId});
    }

    /** Return all quality levels **/
    get levels() {
        return this.levelController.levels;
    }

    /** Return current playback quality level **/
    get currentLevel() {
        return this.streamController.currentLevel;
    }

    /* set quality level immediately (-1 for automatic level selection) */
    set currentLevel(newLevel) {
        AVLog.print(`set currentLevel:${newLevel}`);
        this.loadLevel = newLevel;
        this.streamController.immediateLevelSwitch();
    }

    /** Return next playback quality level (quality level of next fragment) **/
    get nextLevel() {
        return this.streamController.nextLevel;
    }

    /* set quality level for next fragment (-1 for automatic level selection) */
    set nextLevel(newLevel) {
        AVLog.print(`set nextLevel:${newLevel}`);
        this.levelController.manualLevel = newLevel;
        this.streamController.nextLevelSwitch();
    }

    /** Return the quality level of current/last loaded fragment **/
    get loadLevel() {
        return this.levelController.level;
    }

    /* set quality level for current/next loaded fragment (-1 for automatic level selection) */
    set loadLevel(newLevel) {
        AVLog.print(`set loadLevel:${newLevel}`);
        this.levelController.manualLevel = newLevel;
    }

    /** Return the quality level of next loaded fragment **/
    get nextLoadLevel() {
        return this.levelController.nextLoadLevel;
    }

    /** set quality level of next loaded fragment **/
    set nextLoadLevel(level) {
        this.levelController.nextLoadLevel = level;
    }

    /** Return first level (index of first level referenced in manifest)
    **/
    get firstLevel() {
        return Math.max(this.levelController.firstLevel, this.minAutoLevel);
    }

    /** set first level (index of first level referenced in manifest)
    **/
    set firstLevel(newLevel) {
        AVLog.print(`set firstLevel:${newLevel}`);
        this.levelController.firstLevel = newLevel;
    }

    /** Return start level (level of first fragment that will be played back)
      if not overrided by user, first level appearing in manifest will be used as start level
      if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
    **/
    get startLevel() {
        return this.levelController.startLevel;
    }

    /** set  start level (level of first fragment that will be played back)
      if not overrided by user, first level appearing in manifest will be used as start level
      if -1 : automatic start level selection, playback will start from level matching download bandwidth (determined from download of first segment)
    **/
    set startLevel(newLevel) {
        AVLog.print(`set startLevel:${newLevel}`);
        const hls = this;
        // if not in automatic start level detection, ensure startLevel is greater than minAutoLevel
        if (newLevel !== -1) {
          newLevel = Math.max(newLevel,hls.minAutoLevel);
        }
        hls.levelController.startLevel = newLevel;
    }

    /** Return the capping/max level value that could be used by automatic level selection algorithm **/
    get autoLevelCapping() {
        return this._autoLevelCapping;
    }

    /** set the capping/max level value that could be used by automatic level selection algorithm **/
    set autoLevelCapping(newLevel) {
        AVLog.print(`set autoLevelCapping:${newLevel}`);
        this._autoLevelCapping = newLevel;
    }

    /* check if we are in automatic level selection mode */
    get autoLevelEnabled() {
        return (this.levelController.manualLevel === -1);
    }

    /* return manual level */
    get manualLevel() {
        return this.levelController.manualLevel;
    }

    /* return min level selectable in auto mode according to config.minAutoBitrate */
    get minAutoLevel() {
        let hls = this, levels = hls.levels, minAutoBitrate = hls.config.minAutoBitrate, len = levels ? levels.length : 0;
        for (let i = 0; i < len; i++) {
          const levelNextBitrate = levels[i].realBitrate ? Math.max(levels[i].realBitrate,levels[i].bitrate) : levels[i].bitrate;
          if (levelNextBitrate > minAutoBitrate) {
            return i;
          }
        }
        return 0;
    }

    /* return max level selectable in auto mode according to autoLevelCapping */
    get maxAutoLevel() {
        const hls = this;
        const levels = hls.levels;
        const autoLevelCapping = hls.autoLevelCapping;
        let maxAutoLevel;
        if (autoLevelCapping=== -1 && levels && levels.length) {
          maxAutoLevel = levels.length - 1;
        } else {
          maxAutoLevel = autoLevelCapping;
        }
        return maxAutoLevel;
    }

    // return next auto level
    get nextAutoLevel() {
        const hls = this;
        // ensure next auto level is between  min and max auto level
        return Math.min(Math.max(hls.abrController.nextAutoLevel,hls.minAutoLevel),hls.maxAutoLevel);
    }

    // this setter is used to force next auto level
    // this is useful to force a switch down in auto mode : in case of load error on level N, hls.js can set nextAutoLevel to N-1 for example)
    // forced value is valid for one fragment. upon succesful frag loading at forced level, this value will be resetted to -1 by ABR controller
    set nextAutoLevel(nextLevel) {
        const hls = this;
        hls.abrController.nextAutoLevel = Math.max(hls.minAutoLevel,nextLevel);
    }

    /** get alternate audio tracks list from playlist **/
    get audioTracks() {
        const audioTrackController = this.audioTrackController;
        return audioTrackController ? audioTrackController.audioTracks : [];
    }

    /** get index of the selected audio track (index in audio track lists) **/
    get audioTrack() {
        const audioTrackController = this.audioTrackController;
        return audioTrackController ? audioTrackController.audioTrack : -1;
    }

    /** select an audio track, based on its index in audio track lists**/
    set audioTrack(audioTrackId) {
        const audioTrackController = this.audioTrackController;
        if (audioTrackController) {
          audioTrackController.audioTrack = audioTrackId;
        }
    }

    get liveSyncPosition() {
        return this.streamController.liveSyncPosition;
    }

    /** get alternate subtitle tracks list from playlist **/
    get subtitleTracks() {
        const subtitleTrackController = this.subtitleTrackController;
        return subtitleTrackController ? subtitleTrackController.subtitleTracks : [];
    }

    /** get index of the selected subtitle track (index in subtitle track lists) **/
    get subtitleTrack() {
        const subtitleTrackController = this.subtitleTrackController;
        return subtitleTrackController ? subtitleTrackController.subtitleTrack : -1;
    }

    /** select an subtitle track, based on its index in subtitle track lists**/
    set subtitleTrack(subtitleTrackId) {
        const subtitleTrackController = this.subtitleTrackController;
        if (subtitleTrackController) {
          subtitleTrackController.subtitleTrack = subtitleTrackId;
        }
    }
}

export default AVPlayer;