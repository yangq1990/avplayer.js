"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.createUUID = createUUID;
exports.createNodeId = createNodeId;
exports.isString = isString;
exports.toFixed = toFixed;
function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr(s[19] & 0x3 | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

/**
 * 生成节点id
 * @return string
 */
function createNodeId() {
    return ("" + Math.random()).split(".")[1];
}

/**
 * 检测输入是否为字符串
 * @return boolean
 */
function isString(input) {
    return input !== null && (typeof input === 'string' || (typeof input === "undefined" ? "undefined" : _typeof(input)) === 'object' && input.constructor === String);
}

/**
 * 返回指定精度的数字，默认保留小数点后1位
 */
function toFixed(num) {
    var precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

    return num.toFixed(precision);
}