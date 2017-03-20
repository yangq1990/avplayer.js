'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getPCSystemInfo = getPCSystemInfo;
exports.getMobileSystemInfo = getMobileSystemInfo;
/**
 * 操作系统 0->Android 1->iP(hone|ad|od) 2->WindowsPhone 3->Windows 4->Mac 5->linux -1->others|unknown
 * 浏览器 0->Chrome 1->IE 2->FireFox 3->Safari 4->Wechat 5->手Q|QQZone 6->QQBrowser 7->UC 8->Weibo 9->ios Safari 10->Edge 11->Opera 12->IE11+
 */

/**
 * 获取PC端操作系统及浏览器信息
 * @return {}
 */
function getPCSystemInfo() {
    var ua = navigator.userAgent;
    var info = {};

    var clientStrings = [{ s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ }, { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ }, { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ }, { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ }, { s: 'Windows Vista', r: /Windows NT 6.0/ }, { s: 'Windows Server 2003', r: /Windows NT 5.2/ }, { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ }, { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ }, { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ }, { s: 'Windows 98', r: /(Windows 98|Win98)/ }, { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ }, { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ }, { s: 'Windows CE', r: /Windows CE/ }, { s: 'Windows 3.11', r: /Win16/ }, { s: 'Mac OS X', r: /Mac OS X/ }, { s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ }];

    var os = void 0;
    var len = clientStrings.length;
    for (var i = 0; i < len; i++) {
        if (clientStrings[i].r.test(ua)) {
            os = clientStrings[i].s;
            break;
        }
    }

    if (/Windows/.test(os)) {
        info.sys = 3;
        info.sys_ver = /Windows (.*)/.exec(os)[1];
    } else if (os === "Mac OS X") {
        info.sys = 4;
        info.sys_ver = /Mac OS X (10[\.\_\d]+)/.exec(ua)[1];
    } else {
        info.sys = -1;
        info.sys_ver = -1;
    }

    // browser
    var browser = navigator.appName;
    var version = '' + parseFloat(navigator.appVersion);
    var verOffset = void 0,
        ix = void 0;

    //Chrome
    if ((verOffset = ua.indexOf('Chrome')) != -1) {
        browser = 'Chrome';
        version = ua.substring(verOffset + 7);
        info.browser = 0;
    } else if ((verOffset = ua.indexOf('MSIE')) != -1) {
        //MSIE
        browser = 'Microsoft Internet Explorer';
        version = ua.substring(verOffset + 5);
        info.browser = 1;
    } else if ((verOffset = ua.indexOf('Firefox')) != -1) {
        //FireFox
        browser = 'Firefox';
        version = ua.substring(verOffset + 8);
        info.browser = 2;
    } else if ((verOffset = ua.indexOf('Safari')) != -1) {
        //Safari
        browser = 'Safari';
        version = ua.substring(verOffset + 7);
        if ((verOffset = ua.indexOf('Version')) != -1) {
            version = ua.substring(verOffset + 8);
        }
        info.browser = 3;
    } else if ((verOffset = ua.indexOf('Edge')) != -1) {
        //Edge
        browser = 'Microsoft Edge';
        version = ua.substring(verOffset + 5);
        info.browser = 10;
    } else if ((verOffset = ua.indexOf('Opera')) != -1) {
        //Opera
        browser = 'Opera';
        version = ua.substring(verOffset + 6);
        if ((verOffset = ua.indexOf('Version')) != -1) {
            version = ua.substring(verOffset + 8);
        }
        info.browser = 11;
    } else if (ua.indexOf('Trident/') != -1) {
        // MSIE 11+
        browser = 'Microsoft Internet Explorer';
        version = ua.substring(ua.indexOf('rv:') + 3);
        info.browser = 12;
    } else {
        info.browser = -1;
    }

    // trim the version string
    if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
    if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
    if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

    info.browser_ver = parseInt(version);

    return info;
}

/**
 * 获取移动端操作系统及浏览器信息
 * @return {}
 */
function getMobileSystemInfo() {
    var ua = navigator.userAgent;
    var info = {};

    //匹配网络，由于网络在播放过程中可能会切换，所以要每次判断
    var nettype_pattern = /\bNetType\/\b(\w*)/i;
    if (nettype_pattern.exec(ua) != null) {
        if (nettype_pattern.exec(ua)[1] == "WIFI") {
            info.network = 1; //wifi
        } else {
            info.network = 2; //2g 3g 4g
        }
    } else {
        info.network = 0; //unknown
    }

    if (!info.examined) {
        //没有检查过
        //os信息
        if (ua.indexOf("Android") > -1) {
            //Andorid
            info.sys = 0;
            info.sys_ver = parseFloat(ua.slice(ua.indexOf("Android") + 8));
        } else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPod") > -1 || ua.indexOf("iPad") > -1) {
            //ios
            info.sys = 1;
            var ios_pattern = /\bOS\s\b(\w+)/i;
            var ios_ver = ios_pattern.exec(ua)[1];
            info.sys_ver = ios_ver.split("_").join(".");
        } else if (ua.match(/Windows Phone/i)) {
            //wp
            info.sys = 2;
            info.sys_ver = parseFloat(ua.slice(ua.indexOf("Windows Phone") + 14));
        }

        //匹配浏览器及版本
        var wechat_browser_pattern = /\bMicroMessenger\/\b(\S+)/; //匹配微信
        var uc_browser_pattern = /\bUCBrowser\/\b(\S+)/; //匹配UC
        var qq_browser_pattern = /\bMQQBrowser\/\b(\S+)/; //匹配QQ浏览器
        if (wechat_browser_pattern.exec(ua)) {
            //微信
            info.browser = 4;
            info.browser_ver = wechat_browser_pattern.exec(ua)[1];
        } else if (qq_browser_pattern.exec(ua)) {
            //匹配到MQQBrowser
            if (ua.indexOf("SQ") > -1) {
                //手Q or QQzone
                info.browser = 5;
                info.browser_ver = qq_browser_pattern.exec(ua)[1];
            } else {
                //QQ浏览器
                info.browser = 6;
                info.browser_ver = qq_browser_pattern.exec(ua)[1];
            }
        } else if (uc_browser_pattern.exec(ua)) {
            //uc
            info.browser = 7;
            info.browser_ver = uc_browser_pattern.exec(ua)[1];
        } else if (ua.indexOf("weibo") > -1) {
            //weibo
            info.browser = 8;
            info.browser_ver = ua.split("__")[2];
        } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Mobile") > -1) {
            //ios safari
            info.browser = 9;
            info.browser_ver = ua.slice(ua.indexOf("Safari") + 7);
        } else {
            info.browser = -1;
            info.browser_ver = "0.0";
        }

        //匹配设备
        var device_pattern = void 0;
        if (info.sys === 0) {
            device_pattern = /\b[0-9]\;\s{1,}\b(.+)\s{1,}Build/i;
            var device_result = device_pattern.exec(ua); //匹配的结果
            if (device_result !== null && device_result.length >= 2) {
                info.device = device_result[1];
            } else {
                console.log("WARN-->" + "没有匹配到device!");
                info.device = "Android Device"; //android device 默认值
            }

            if (info.device.indexOf(";") > -1) {
                //某些ua会返回系统语言信息
                info.device = info.device.split("; ")[1];
            }
        } else if (info.sys === 1) {
            device_pattern = /\({1}(.+)\;{1}/i;
            info.device = device_pattern.exec(ua)[1];
        } else if (info.sys === 2) {
            info.device = "Windows Phone";
        }

        info.examined = true;
    }

    return info;
}