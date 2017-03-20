"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * AVPlayer的日志工具类
 * debug模式下，avplayer.js会把日志输出到用户指定的logDiv或者浏览器的控制台
 * @author yangq
 */
var AVLog = function () {
    function AVLog() {
        _classCallCheck(this, AVLog);
    }

    _createClass(AVLog, null, [{
        key: "print",
        value: function print() {
            if (this._debug) {
                for (var _len = arguments.length, msg = Array(_len), _key = 0; _key < _len; _key++) {
                    msg[_key] = arguments[_key];
                }

                if (!!this._logDivId) {
                    var logDiv = document.getElementById(this._logDivId);
                    if (!!logDiv) {
                        var tempdiv = document.createElement("div");
                        tempdiv.innerHTML = "[" + new Date().toLocaleTimeString() + "] " + msg.join(" ");
                        logDiv.appendChild(tempdiv);
                    }
                } else {
                    var _console;

                    (_console = console).log.apply(_console, msg);
                }
            }
        }
    }, {
        key: "debug",
        get: function get() {
            return this._debug;
        },
        set: function set(value) {
            this._debug = value;
        }
    }, {
        key: "logDivId",
        get: function get() {
            return this._logDivId;
        },
        set: function set(id) {
            this._logDivId = id;
        }
    }]);

    return AVLog;
}();

exports.default = AVLog;