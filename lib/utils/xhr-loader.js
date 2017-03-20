'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * XHR based logger
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _logger = require('../utils/logger');

var _avlog = require('./avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

var _commonFunctions = require('./common-functions.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XhrLoader = function () {
  function XhrLoader(config) {
    _classCallCheck(this, XhrLoader);

    if (config && config.xhrSetup) {
      this.xhrSetup = config.xhrSetup;
    }
  }

  _createClass(XhrLoader, [{
    key: 'destroy',
    value: function destroy() {
      this.abort();
      this.loader = null;
    }
  }, {
    key: 'abort',
    value: function abort() {
      var loader = this.loader;
      if (loader && loader.readyState !== 4) {
        this.stats.aborted = true;
        loader.abort();
      }

      window.clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }, {
    key: 'load',
    value: function load(context, config, callbacks) {
      this.context = context;
      this.config = config;
      this.callbacks = callbacks;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.retryDelay = config.retryDelay;
      this.loadInternal();
    }
  }, {
    key: 'loadInternal',
    value: function loadInternal() {
      var xhr,
          context = this.context;

      if (typeof XDomainRequest !== 'undefined') {
        xhr = this.loader = new XDomainRequest();
      } else {
        xhr = this.loader = new XMLHttpRequest();
      }

      xhr.onreadystatechange = this.readystatechange.bind(this);
      xhr.onprogress = this.loadprogress.bind(this);

      xhr.open('GET', context.url, true);

      if (context.rangeEnd) {
        xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));
      }
      xhr.responseType = context.responseType;
      var stats = this.stats;
      stats.tfirst = 0;
      stats.loaded = 0;
      if (this.xhrSetup) {
        this.xhrSetup(xhr, context.url);
      }
      // setup timeout before we perform request
      this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), this.config.timeout);
      xhr.send();
    }
  }, {
    key: 'readystatechange',
    value: function readystatechange(event) {
      var xhr = event.currentTarget,
          readyState = xhr.readyState,
          stats = this.stats,
          context = this.context,
          config = this.config;

      // don't proceed if xhr has been aborted
      if (stats.aborted) {
        return;
      }

      // >= HEADERS_RECEIVED
      if (readyState >= 2) {
        // clear xhr timeout and rearm it if readyState less than 4
        window.clearTimeout(this.requestTimeout);
        if (stats.tfirst === 0) {
          stats.tfirst = Math.max(performance.now(), stats.trequest);
        }
        if (readyState === 4) {
          var status = xhr.status;
          // http status between 200 to 299 are all successful
          if (status >= 200 && status < 300) {
            stats.tload = Math.max(stats.tfirst, performance.now());
            var data = void 0,
                len = void 0;
            if (context.responseType === 'arraybuffer') {
              data = xhr.response;
              len = data.byteLength;

              if (context.frag.sn === 0) {
                //yangq
                _avlog2.default.print('\u4E0B\u8F7D\u9996\u7247ts\u8017\u65F6 ' + (0, _commonFunctions.toFixed)(stats.tload - stats.trequest) + ' ms | \u9996\u7247ts\u6587\u4EF6size ' + (0, _commonFunctions.toFixed)(len / 1024) + ' KB');
              }
            } else {
              data = xhr.responseText;
              len = data.length;

              _avlog2.default.print('\u4E0B\u8F7Dm3u8\u6587\u4EF6\u8017\u65F6 ' + (0, _commonFunctions.toFixed)(stats.tload - stats.trequest) + ' ms | m3u8\u6587\u4EF6size ' + (0, _commonFunctions.toFixed)(len / 1024) + ' KB');
            }
            stats.loaded = stats.total = len;
            var response = { url: xhr.responseURL, data: data };
            this.callbacks.onSuccess(response, stats, context);
          } else {
            // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
            if (stats.retry >= config.maxRetry || status >= 400 && status < 499) {
              _logger.logger.error(status + ' while loading ' + context.url);
              this.callbacks.onError({ code: status, text: xhr.statusText }, context);
            } else {
              // retry
              _logger.logger.warn(status + ' while loading ' + context.url + ', retrying in ' + this.retryDelay + '...');
              // aborts and resets internal state
              this.destroy();
              // schedule retry
              this.retryTimeout = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
              // set exponential backoff
              this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
              stats.retry++;
            }
          }
        } else {
          // readyState >= 2 AND readyState !==4 (readyState = HEADERS_RECEIVED || LOADING) rearm timeout as xhr not finished yet
          this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), config.timeout);
        }
      }
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout() {
      _logger.logger.warn('timeout while loading ' + this.context.url);
      this.callbacks.onTimeout(this.stats, this.context);
    }
  }, {
    key: 'loadprogress',
    value: function loadprogress(event) {
      var stats = this.stats;
      stats.loaded = event.loaded;
      if (event.lengthComputable) {
        stats.total = event.total;
      }
      var onProgress = this.callbacks.onProgress;
      if (onProgress) {
        // last args is to provide on progress data
        onProgress(stats, this.context, null);
      }
    }
  }]);

  return XhrLoader;
}();

exports.default = XhrLoader;