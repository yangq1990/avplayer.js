export function createUUID() {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    let uuid = s.join("");
    return uuid;
}

/**
 * 生成节点id
 * @return string
 */
export function createNodeId() {
    return ("" + Math.random()).split(".")[1];
}

/**
 * 检测输入是否为字符串
 * @return boolean
 */
export function isString(input) {
    return input !== null && (typeof input === 'string' || (typeof input === 'object' && input.constructor === String));
}

/** 
 * 检测输入是否为undefined
 */
export function isUndefined(input) {
    return input !== null && typeof input === 'undefined';
}

/**
 * 返回指定精度的数字，默认保留小数点后1位
 */
export function toFixed(num, precision=1) {
    return num.toFixed(precision);
}

/**
 * 加载样式
 */
export function loadCSS(url) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;

    if(document.getElementsByTagName("head")[0]) {
        document.getElementsByTagName("head")[0].appendChild(link);      
    } else {
        document.appendChild(link);
    }
}