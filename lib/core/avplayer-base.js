'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventHandler = require('./event-handler.js');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _events = require('./events.js');

var _events2 = _interopRequireDefault(_events);

var _avplayerTips = require('./avplayer-tips.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * AVPlayer基类
 * @author yangq
 */
var AVPlayerBase = function (_EventHandler) {
    _inherits(AVPlayerBase, _EventHandler);

    function AVPlayerBase(AVPLAYER) {
        var _ref;

        _classCallCheck(this, AVPlayerBase);

        for (var _len = arguments.length, events = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            events[_key - 1] = arguments[_key];
        }

        return _possibleConstructorReturn(this, (_ref = AVPlayerBase.__proto__ || Object.getPrototypeOf(AVPlayerBase)).call.apply(_ref, [this, AVPLAYER].concat(events)));
    }

    /**
     * 派发播放器状态改变事件
     */


    _createClass(AVPlayerBase, [{
        key: 'playerStateChange',
        value: function playerStateChange(newState) {
            this._mediaState = newState;
            this.AVPLAYER.trigger(_events2.default.PLAYER_STATE_CHANGE, { state: newState });
        }

        /**
         * 时间进度更新
         */

    }, {
        key: 'timeUpdate',
        value: function timeUpdate() {
            this.AVPLAYER.trigger(_events2.default.TIME_UPDATE, { time: this._video.currentTime });
        }

        /**
         * 视频时长更新
         */

    }, {
        key: 'durationUpdate',
        value: function durationUpdate() {
            if (this._video.duration > 1) {
                //在初始化播放器后，html5 video会派发durationUpdate事件，微信下此时的video.duration为0，uc下此时的video.duration为1，移动端浏览器的坑
                this.AVPLAYER.trigger(_events2.default.DURATION_UPDATE, { duration: this._video.duration });
            }
        }

        /** 出错时显示提示 */

    }, {
        key: 'applyStyle',
        value: function applyStyle(txt) {
            if (!txt) {
                txt = _avplayerTips.AVPlayerTips.T5;
            }

            var parentDiv = document.getElementById(this._param.parentId);
            if (!!parentDiv) {
                //这里用css代替js操作style，因为后一种方式会有坑爹的兼容性问题
                parentDiv.className = "yywebplayer_tips";
                parentDiv.innerHTML = txt;
            }
        }
    }]);

    return AVPlayerBase;
}(_eventHandler2.default);

exports.default = AVPlayerBase;