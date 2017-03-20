'use strict';

var ua = navigator.userAgent,
    name = navigator.appName,
    fullVersion = '' + parseFloat(navigator.appVersion),
    majorVersion = parseInt(navigator.appVersion, 10),
    nameOffset = void 0,
    verOffset = void 0,
    ix = void 0,
    isIE = false,
    isFirefox = false,
    isChrome = false,
    isSafari = false;

if (navigator.appVersion.indexOf('Windows NT') !== -1 && navigator.appVersion.indexOf('rv:11') !== -1) {
    // MSIE 11
    isIE = true;
    name = 'IE';
    fullVersion = '11';
} else if ((verOffset = ua.indexOf('MSIE')) !== -1) {
    // MSIE
    isIE = true;
    name = 'IE';
    fullVersion = ua.substring(verOffset + 5);
} else if ((verOffset = ua.indexOf('Chrome')) !== -1) {
    // Chrome
    isChrome = true;
    name = 'Chrome';
    fullVersion = ua.substring(verOffset + 7);
} else if ((verOffset = ua.indexOf('Safari')) !== -1) {
    // Safari
    isSafari = true;
    name = 'Safari';
    fullVersion = ua.substring(verOffset + 7);
    if ((verOffset = ua.indexOf('Version')) !== -1) {
        fullVersion = ua.substring(verOffset + 8);
    }
} else if ((verOffset = ua.indexOf('Firefox')) !== -1) {
    // Firefox
    isFirefox = true;
    name = 'Firefox';
    fullVersion = ua.substring(verOffset + 8);
} else if ((nameOffset = ua.lastIndexOf(' ') + 1) < (verOffset = ua.lastIndexOf('/'))) {
    // In most other browsers, 'name/version' is at the end of userAgent
    name = ua.substring(nameOffset, verOffset);
    fullVersion = ua.substring(verOffset + 1);

    if (name.toLowerCase() === name.toUpperCase()) {
        name = navigator.appName;
    }
}

// Trim the fullVersion string at semicolon/space if present
if ((ix = fullVersion.indexOf(';')) !== -1) {
    fullVersion = fullVersion.substring(0, ix);
}
if ((ix = fullVersion.indexOf(' ')) !== -1) {
    fullVersion = fullVersion.substring(0, ix);
}

// Get major version
majorVersion = parseInt('' + fullVersion, 10);
if (isNaN(majorVersion)) {
    fullVersion = '' + parseFloat(navigator.appVersion);
    majorVersion = parseInt(navigator.appVersion, 10);
}

var isIOS = /(iPad|iPhone|iPod)/g.test(navigator.platform);
var isANDROID = /Android/g.test(navigator.userAgent);

module.exports = {
    name: name,
    version: majorVersion,
    isIE: isIE,
    isFirefox: isFirefox,
    isChrome: isChrome,
    isSafari: isSafari,
    isIos: isIOS,
    isIphone: /(iPhone|iPod)/g.test(navigator.userAgent),
    isAndroid: isANDROID,
    isMobileDevice: isIOS || isANDROID,
    isMSESupported: window.MediaSource && typeof window.MediaSource.isTypeSupported === 'function' && window.MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"'),
    isTouch: 'ontouchstart' in document.documentElement
};