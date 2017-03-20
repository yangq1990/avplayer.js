"use strict";

/**
 * 立即执行函数表达式
 * @ref https://gist.github.com/paulirish/5438650
 */
(function () {
  if ("performance" in window == false) {
    window.performance = {};
  }

  Date.now = Date.now || function () {
    return new Date().getTime();
  };

  if ("now" in window.performance == false) {
    var nowOffset = Date.now();

    if (performance.timing && performance.timing.navigationStart) {
      nowOffset = performance.timing.navigationStart;
    }

    window.performance.now = function now() {
      return Date.now() - nowOffset;
    };
  }
})();