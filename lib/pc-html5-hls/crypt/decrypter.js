'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _aesCrypto = require('./aes-crypto');

var _aesCrypto2 = _interopRequireDefault(_aesCrypto);

var _fastAesKey = require('./fast-aes-key');

var _fastAesKey2 = _interopRequireDefault(_fastAesKey);

var _aesDecryptor = require('./aes-decryptor');

var _aesDecryptor2 = _interopRequireDefault(_aesDecryptor);

var _errors = require('../../core/errors');

var _logger = require('../../utils/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*globals self: false */

var Decrypter = function () {
  function Decrypter(observer, config) {
    _classCallCheck(this, Decrypter);

    this.observer = observer;
    this.config = config;
    this.logEnabled = true;
    try {
      var browserCrypto = crypto ? crypto : self.crypto;
      this.subtle = browserCrypto.subtle || browserCrypto.webkitSubtle;
    } catch (e) {}
    this.disableWebCrypto = !this.subtle;
  }

  _createClass(Decrypter, [{
    key: 'isSync',
    value: function isSync() {
      return this.disableWebCrypto && this.config.enableSoftwareAES;
    }
  }, {
    key: 'decrypt',
    value: function decrypt(data, key, iv, callback) {
      var _this = this;

      if (this.disableWebCrypto && this.config.enableSoftwareAES) {
        if (this.logEnabled) {
          _logger.logger.log('JS AES decrypt');
          this.logEnabled = false;
        }
        var decryptor = this.decryptor;
        if (!decryptor) {
          this.decryptor = decryptor = new _aesDecryptor2.default();
        }
        decryptor.expandKey(key);
        callback(decryptor.decrypt(data, 0, iv));
      } else {
        if (this.logEnabled) {
          _logger.logger.log('WebCrypto AES decrypt');
          this.logEnabled = false;
        }
        var subtle = this.subtle;
        if (this.key !== key) {
          this.key = key;
          this.fastAesKey = new _fastAesKey2.default(subtle, key);
        }

        this.fastAesKey.expandKey().then(function (aesKey) {
          // decrypt using web crypto
          var crypto = new _aesCrypto2.default(subtle, iv);
          crypto.decrypt(data, aesKey).catch(function (err) {
            _this.onWebCryptoError(err, data, key, iv, callback);
          }).then(function (result) {
            callback(result);
          });
        }).catch(function (err) {
          _this.onWebCryptoError(err, data, key, iv, callback);
        });
      }
    }
  }, {
    key: 'onWebCryptoError',
    value: function onWebCryptoError(err, data, key, iv, callback) {
      if (this.config.enableSoftwareAES) {
        _logger.logger.log('WebCrypto Error, disable WebCrypto API');
        this.disableWebCrypto = true;
        this.logEnabled = true;
        this.decrypt(data, key, iv, callback);
      } else {
        _logger.logger.error('decrypting error : ' + err.message);
        this.observer.trigger(Event.ERROR, { type: _errors.ErrorTypes.MEDIA_ERROR, details: _errors.ErrorDetails.FRAG_DECRYPT_ERROR, fatal: true, reason: err.message });
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var decryptor = this.decryptor;
      if (decryptor) {
        decryptor.destroy();
        this.decryptor = undefined;
      }
    }
  }]);

  return Decrypter;
}();

exports.default = Decrypter;