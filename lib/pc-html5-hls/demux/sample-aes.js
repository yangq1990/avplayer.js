'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * SAMPLE-AES decrypter
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _decrypter = require('../crypt/decrypter');

var _decrypter2 = _interopRequireDefault(_decrypter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SampleAesDecrypter = function () {
  function SampleAesDecrypter(observer, config, decryptdata, discardEPB) {
    _classCallCheck(this, SampleAesDecrypter);

    this.decryptdata = decryptdata;
    this.discardEPB = discardEPB;
    this.decrypter = new _decrypter2.default(observer, config);
  }

  _createClass(SampleAesDecrypter, [{
    key: 'decryptBuffer',
    value: function decryptBuffer(encryptedData, callback) {
      this.decrypter.decrypt(encryptedData, this.decryptdata.key.buffer, this.decryptdata.iv.buffer, callback);
    }

    // AAC - encrypt all full 16 bytes blocks starting from offset 16

  }, {
    key: 'decryptAacSample',
    value: function decryptAacSample(samples, sampleIndex, callback, sync) {
      var curUnit = samples[sampleIndex].unit;
      var encryptedData = curUnit.subarray(16, curUnit.length - curUnit.length % 16);
      var encryptedBuffer = encryptedData.buffer.slice(encryptedData.byteOffset, encryptedData.byteOffset + encryptedData.length);

      var localthis = this;
      this.decryptBuffer(encryptedBuffer, function (decryptedData) {
        decryptedData = new Uint8Array(decryptedData);
        curUnit.set(decryptedData, 16);

        if (!sync) {
          localthis.decryptAacSamples(samples, sampleIndex + 1, callback);
        }
      });
    }
  }, {
    key: 'decryptAacSamples',
    value: function decryptAacSamples(samples, sampleIndex, callback) {
      for (;; sampleIndex++) {
        if (sampleIndex >= samples.length) {
          callback();
          return;
        }

        if (samples[sampleIndex].unit.length < 32) {
          continue;
        }

        var sync = this.decrypter.isSync();

        this.decryptAacSample(samples, sampleIndex, callback, sync);

        if (!sync) {
          return;
        }
      }
    }

    // AVC - encrypt one 16 bytes block out of ten, starting from offset 32

  }, {
    key: 'getAvcEncryptedData',
    value: function getAvcEncryptedData(decodedData) {
      var encryptedDataLen = Math.floor((decodedData.length - 48) / 160) * 16 + 16;
      var encryptedData = new Int8Array(encryptedDataLen);
      var outputPos = 0;
      for (var inputPos = 32; inputPos <= decodedData.length - 16; inputPos += 160, outputPos += 16) {
        encryptedData.set(decodedData.subarray(inputPos, inputPos + 16), outputPos);
      }
      return encryptedData;
    }
  }, {
    key: 'getAvcDecryptedUnit',
    value: function getAvcDecryptedUnit(decodedData, decryptedData) {
      decryptedData = new Uint8Array(decryptedData);
      var inputPos = 0;
      for (var outputPos = 32; outputPos <= decodedData.length - 16; outputPos += 160, inputPos += 16) {
        decodedData.set(decryptedData.subarray(inputPos, inputPos + 16), outputPos);
      }
      return decodedData;
    }
  }, {
    key: 'decryptAvcSample',
    value: function decryptAvcSample(samples, sampleIndex, unitIndex, callback, curUnit, sync) {
      var decodedData = this.discardEPB(curUnit.data);
      var encryptedData = this.getAvcEncryptedData(decodedData);
      var localthis = this;

      this.decryptBuffer(encryptedData.buffer, function (decryptedData) {
        curUnit.data = localthis.getAvcDecryptedUnit(decodedData, decryptedData);

        if (!sync) {
          localthis.decryptAvcSamples(samples, sampleIndex, unitIndex + 1, callback);
        }
      });
    }
  }, {
    key: 'decryptAvcSamples',
    value: function decryptAvcSamples(samples, sampleIndex, unitIndex, callback) {
      for (;; sampleIndex++, unitIndex = 0) {
        if (sampleIndex >= samples.length) {
          callback();
          return;
        }

        var curUnits = samples[sampleIndex].units;
        for (;; unitIndex++) {
          if (unitIndex >= curUnits.length) {
            break;
          }

          var curUnit = curUnits[unitIndex];
          if (curUnit.length <= 48 || curUnit.type !== 1 && curUnit.type !== 5) {
            continue;
          }

          var sync = this.decrypter.isSync();

          this.decryptAvcSample(samples, sampleIndex, unitIndex, callback, curUnit, sync);

          if (!sync) {
            return;
          }
        }
      }
    }
  }]);

  return SampleAesDecrypter;
}();

exports.default = SampleAesDecrypter;