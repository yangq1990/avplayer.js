'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Playlist Loader
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     */

var _urlToolkit = require('url-toolkit');

var _urlToolkit2 = _interopRequireDefault(_urlToolkit);

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../../core/event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _errors = require('../../core/errors');

var _attrList = require('../../utils/attr-list');

var _attrList2 = _interopRequireDefault(_attrList);

var _logger = require('../../utils/logger');

var _avlog = require('../../utils/avlog.js');

var _avlog2 = _interopRequireDefault(_avlog);

var _commonFunctions = require('../../utils/common-functions.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// https://regex101.com is your friend
var MASTER_PLAYLIST_REGEX = /#EXT-X-STREAM-INF:([^\n\r]*)[\r\n]+([^\r\n]+)/g;
var MASTER_PLAYLIST_MEDIA_REGEX = /#EXT-X-MEDIA:(.*)/g;
var LEVEL_PLAYLIST_REGEX_FAST = /#EXTINF:(\d*(?:\.\d+)?)(?:,(.*))?|(?!#)(\S.+)|#EXT-X-BYTERANGE: *(.+)|#EXT-X-PROGRAM-DATE-TIME:(.+)|#.*/g;
var LEVEL_PLAYLIST_REGEX_SLOW = /(?:(?:#(EXTM3U))|(?:#EXT-X-(PLAYLIST-TYPE):(.+))|(?:#EXT-X-(MEDIA-SEQUENCE): *(\d+))|(?:#EXT-X-(TARGETDURATION): *(\d+))|(?:#EXT-X-(KEY):(.+))|(?:#EXT-X-(START):(.+))|(?:#EXT-X-(ENDLIST))|(?:#EXT-X-(DISCONTINUITY-SEQ)UENCE:(\d+))|(?:#EXT-X-(DIS)CONTINUITY))|(?:#EXT-X-(VERSION):(\d+))|(?:#EXT-X-(MAP):(.+))|(?:(#)(.*):(.*))|(?:(#)(.*))(?:.*)\r?\n?/;

var LevelKey = function () {
  function LevelKey() {
    _classCallCheck(this, LevelKey);

    this.method = null;
    this.key = null;
    this.iv = null;
    this._uri = null;
  }

  _createClass(LevelKey, [{
    key: 'uri',
    get: function get() {
      if (!this._uri && this.reluri) {
        this._uri = _urlToolkit2.default.buildAbsoluteURL(this.baseuri, this.reluri, { alwaysNormalize: true });
      }
      return this._uri;
    }
  }]);

  return LevelKey;
}();

var Fragment = function () {
  function Fragment() {
    _classCallCheck(this, Fragment);

    this._url = null;
    this._byteRange = null;
    this._decryptdata = null;
    this.tagList = [];
  }

  _createClass(Fragment, [{
    key: 'createInitializationVector',


    /**
     * Utility method for parseLevelPlaylist to create an initialization vector for a given segment
     * @returns {Uint8Array}
     */
    value: function createInitializationVector(segmentNumber) {
      var uint8View = new Uint8Array(16);

      for (var i = 12; i < 16; i++) {
        uint8View[i] = segmentNumber >> 8 * (15 - i) & 0xff;
      }

      return uint8View;
    }

    /**
     * Utility method for parseLevelPlaylist to get a fragment's decryption data from the currently parsed encryption key data
     * @param levelkey - a playlist's encryption info
     * @param segmentNumber - the fragment's segment number
     * @returns {*} - an object to be applied as a fragment's decryptdata
     */

  }, {
    key: 'fragmentDecryptdataFromLevelkey',
    value: function fragmentDecryptdataFromLevelkey(levelkey, segmentNumber) {
      var decryptdata = levelkey;

      if (levelkey && levelkey.method && levelkey.uri && !levelkey.iv) {
        decryptdata = new LevelKey();
        decryptdata.method = levelkey.method;
        decryptdata.baseuri = levelkey.baseuri;
        decryptdata.reluri = levelkey.reluri;
        decryptdata.iv = this.createInitializationVector(segmentNumber);
      }

      return decryptdata;
    }
  }, {
    key: 'cloneObj',
    value: function cloneObj(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  }, {
    key: 'url',
    get: function get() {
      if (!this._url && this.relurl) {
        this._url = _urlToolkit2.default.buildAbsoluteURL(this.baseurl, this.relurl, { alwaysNormalize: true });
      }
      return this._url;
    },
    set: function set(value) {
      this._url = value;
    }
  }, {
    key: 'programDateTime',
    get: function get() {
      if (!this._programDateTime && this.rawProgramDateTime) {
        this._programDateTime = new Date(Date.parse(this.rawProgramDateTime));
      }
      return this._programDateTime;
    }
  }, {
    key: 'byteRange',
    get: function get() {
      if (!this._byteRange) {
        var byteRange = this._byteRange = [];
        if (this.rawByteRange) {
          var params = this.rawByteRange.split('@', 2);
          if (params.length === 1) {
            var lastByteRangeEndOffset = this.lastByteRangeEndOffset;
            byteRange[0] = lastByteRangeEndOffset ? lastByteRangeEndOffset : 0;
          } else {
            byteRange[0] = parseInt(params[1]);
          }
          byteRange[1] = parseInt(params[0]) + byteRange[0];
        }
      }
      return this._byteRange;
    }
  }, {
    key: 'byteRangeStartOffset',
    get: function get() {
      return this.byteRange[0];
    }
  }, {
    key: 'byteRangeEndOffset',
    get: function get() {
      return this.byteRange[1];
    }
  }, {
    key: 'decryptdata',
    get: function get() {
      if (!this._decryptdata) {
        this._decryptdata = this.fragmentDecryptdataFromLevelkey(this.levelkey, this.sn);
      }
      return this._decryptdata;
    }
  }]);

  return Fragment;
}();

var PlaylistLoader = function (_EventHandler) {
  _inherits(PlaylistLoader, _EventHandler);

  function PlaylistLoader(AVPLAYER) {
    _classCallCheck(this, PlaylistLoader);

    var _this = _possibleConstructorReturn(this, (PlaylistLoader.__proto__ || Object.getPrototypeOf(PlaylistLoader)).call(this, AVPLAYER, _events2.default.MANIFEST_LOADING, _events2.default.LEVEL_LOADING, _events2.default.AUDIO_TRACK_LOADING, _events2.default.SUBTITLE_TRACK_LOADING));

    _this.loaders = {};
    return _this;
  }

  _createClass(PlaylistLoader, [{
    key: 'destroy',
    value: function destroy() {
      for (var loaderName in this.loaders) {
        var loader = this.loaders[loaderName];
        if (loader) {
          loader.destroy();
        }
      }
      this.loaders = {};
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onManifestLoading',
    value: function onManifestLoading(data) {
      this.load(data.url, { type: 'manifest' });
    }
  }, {
    key: 'onLevelLoading',
    value: function onLevelLoading(data) {
      this.load(data.url, { type: 'level', level: data.level, id: data.id });
    }
  }, {
    key: 'onAudioTrackLoading',
    value: function onAudioTrackLoading(data) {
      this.load(data.url, { type: 'audioTrack', id: data.id });
    }
  }, {
    key: 'onSubtitleTrackLoading',
    value: function onSubtitleTrackLoading(data) {
      this.load(data.url, { type: 'subtitleTrack', id: data.id });
    }
  }, {
    key: 'load',
    value: function load(url, context) {
      var loader = this.loaders[context.type];
      if (loader) {
        var loaderContext = loader.context;
        if (loaderContext && loaderContext.url === url) {
          _logger.logger.trace('playlist request ongoing');
          return;
        } else {
          _logger.logger.warn('abort previous loader for type:' + context.type);
          loader.abort();
        }
      }
      var config = this.AVPLAYER.config,
          retry = void 0,
          timeout = void 0,
          retryDelay = void 0,
          maxRetryDelay = void 0;
      if (context.type === 'manifest') {
        retry = config.manifestLoadingMaxRetry;
        timeout = config.manifestLoadingTimeOut;
        retryDelay = config.manifestLoadingRetryDelay;
        maxRetryDelay = config.manifestLoadingMaxRetryTimeout;
      } else {
        retry = config.levelLoadingMaxRetry;
        timeout = config.levelLoadingTimeOut;
        retryDelay = config.levelLoadingRetryDelay;
        maxRetryDelay = config.levelLoadingMaxRetryTimeout;
        _logger.logger.log('loading playlist for ' + context.type + ' ' + (context.level || context.id));
      }
      loader = this.loaders[context.type] = context.loader = typeof config.pLoader !== 'undefined' ? new config.pLoader(config) : new config.loader(config);
      context.url = url;
      context.responseType = '';

      var loaderConfig = void 0,
          loaderCallbacks = void 0;
      loaderConfig = { timeout: timeout, maxRetry: retry, retryDelay: retryDelay, maxRetryDelay: maxRetryDelay };
      loaderCallbacks = { onSuccess: this.loadsuccess.bind(this), onError: this.loaderror.bind(this), onTimeout: this.loadtimeout.bind(this) };
      loader.load(context, loaderConfig, loaderCallbacks);
    }
  }, {
    key: 'resolve',
    value: function resolve(url, baseUrl) {
      return _urlToolkit2.default.buildAbsoluteURL(baseUrl, url, { alwaysNormalize: true });
    }
  }, {
    key: 'parseMasterPlaylist',
    value: function parseMasterPlaylist(string, baseurl) {
      var levels = [],
          result = void 0;
      MASTER_PLAYLIST_REGEX.lastIndex = 0;
      while ((result = MASTER_PLAYLIST_REGEX.exec(string)) != null) {
        var level = {};

        var attrs = level.attrs = new _attrList2.default(result[1]);
        level.url = this.resolve(result[2], baseurl);

        var resolution = attrs.decimalResolution('RESOLUTION');
        if (resolution) {
          level.width = resolution.width;
          level.height = resolution.height;
        }
        level.bitrate = attrs.decimalInteger('AVERAGE-BANDWIDTH') || attrs.decimalInteger('BANDWIDTH');
        level.name = attrs.NAME;

        var codecs = attrs.CODECS;
        if (codecs) {
          codecs = codecs.split(/[ ,]+/);
          for (var i = 0; i < codecs.length; i++) {
            var codec = codecs[i];
            if (codec.indexOf('avc1') !== -1) {
              level.videoCodec = this.avc1toavcoti(codec);
            } else {
              level.audioCodec = codec;
            }
          }
        }

        levels.push(level);
      }
      return levels;
    }
  }, {
    key: 'parseMasterPlaylistMedia',
    value: function parseMasterPlaylistMedia(string, baseurl, type) {
      var result = void 0,
          medias = [],
          id = 0;
      MASTER_PLAYLIST_MEDIA_REGEX.lastIndex = 0;
      while ((result = MASTER_PLAYLIST_MEDIA_REGEX.exec(string)) != null) {
        var media = {};
        var attrs = new _attrList2.default(result[1]);
        if (attrs.TYPE === type) {
          media.groupId = attrs['GROUP-ID'];
          media.name = attrs.NAME;
          media.type = type;
          media.default = attrs.DEFAULT === 'YES';
          media.autoselect = attrs.AUTOSELECT === 'YES';
          media.forced = attrs.FORCED === 'YES';
          if (attrs.URI) {
            media.url = this.resolve(attrs.URI, baseurl);
          }
          media.lang = attrs.LANGUAGE;
          if (!media.name) {
            media.name = media.lang;
          }
          media.id = id++;
          medias.push(media);
        }
      }
      return medias;
    }
  }, {
    key: 'avc1toavcoti',
    value: function avc1toavcoti(codec) {
      var result,
          avcdata = codec.split('.');
      if (avcdata.length > 2) {
        result = avcdata.shift() + '.';
        result += parseInt(avcdata.shift()).toString(16);
        result += ('000' + parseInt(avcdata.shift()).toString(16)).substr(-4);
      } else {
        result = codec;
      }
      return result;
    }
  }, {
    key: 'parseLevelPlaylist',
    value: function parseLevelPlaylist(string, baseurl, id, type) {
      var currentSN = 0,
          totalduration = 0,
          level = { type: null, version: null, url: baseurl, fragments: [], live: true, startSN: 0 },
          levelkey = new LevelKey(),
          cc = 0,
          prevFrag = null,
          frag = new Fragment(),
          result,
          i;

      LEVEL_PLAYLIST_REGEX_FAST.lastIndex = 0;

      while ((result = LEVEL_PLAYLIST_REGEX_FAST.exec(string)) !== null) {
        var duration = result[1];
        if (duration) {
          // INF
          frag.duration = parseFloat(duration);
          // avoid sliced strings    https://github.com/dailymotion/hls.js/issues/939
          var title = (' ' + result[2]).slice(1);
          frag.title = title ? title : null;
          frag.tagList.push(title ? ['INF', duration, title] : ['INF', duration]);
        } else if (result[3]) {
          // url
          if (!isNaN(frag.duration)) {
            var sn = currentSN++;
            frag.type = type;
            frag.start = totalduration;
            frag.levelkey = levelkey;
            frag.sn = sn;
            frag.level = id;
            frag.cc = cc;
            frag.baseurl = baseurl;
            // avoid sliced strings    https://github.com/dailymotion/hls.js/issues/939
            frag.relurl = (' ' + result[3]).slice(1);

            level.fragments.push(frag);
            prevFrag = frag;
            totalduration += frag.duration;

            frag = new Fragment();
          }
        } else if (result[4]) {
          // X-BYTERANGE
          frag.rawByteRange = (' ' + result[4]).slice(1);
          if (prevFrag) {
            var lastByteRangeEndOffset = prevFrag.byteRangeEndOffset;
            if (lastByteRangeEndOffset) {
              frag.lastByteRangeEndOffset = lastByteRangeEndOffset;
            }
          }
        } else if (result[5]) {
          // PROGRAM-DATE-TIME
          // avoid sliced strings    https://github.com/dailymotion/hls.js/issues/939
          frag.rawProgramDateTime = (' ' + result[5]).slice(1);
          frag.tagList.push(['PROGRAM-DATE-TIME', frag.rawProgramDateTime]);
        } else {
          result = result[0].match(LEVEL_PLAYLIST_REGEX_SLOW);
          for (i = 1; i < result.length; i++) {
            if (result[i] !== undefined) {
              break;
            }
          }

          // avoid sliced strings    https://github.com/dailymotion/hls.js/issues/939
          var value1 = (' ' + result[i + 1]).slice(1);
          var value2 = (' ' + result[i + 2]).slice(1);

          switch (result[i]) {
            case '#':
              frag.tagList.push(value2 ? [value1, value2] : [value1]);
              break;
            case 'PLAYLIST-TYPE':
              level.type = value1.toUpperCase();
              break;
            case 'MEDIA-SEQUENCE':
              currentSN = level.startSN = parseInt(value1);
              break;
            case 'TARGETDURATION':
              level.targetduration = parseFloat(value1);
              break;
            case 'VERSION':
              level.version = parseInt(value1);
              break;
            case 'EXTM3U':
              break;
            case 'ENDLIST':
              level.live = false;
              break;
            case 'DIS':
              cc++;
              frag.tagList.push(['DIS']);
              break;
            case 'DISCONTINUITY-SEQ':
              cc = parseInt(value1);
              break;
            case 'KEY':
              // https://tools.ietf.org/html/draft-pantos-http-live-streaming-08#section-3.4.4
              var decryptparams = value1;
              var keyAttrs = new _attrList2.default(decryptparams);
              var decryptmethod = keyAttrs.enumeratedString('METHOD'),
                  decrypturi = keyAttrs.URI,
                  decryptiv = keyAttrs.hexadecimalInteger('IV');
              if (decryptmethod) {
                levelkey = new LevelKey();
                if (decrypturi && ['AES-128', 'SAMPLE-AES'].indexOf(decryptmethod) >= 0) {
                  levelkey.method = decryptmethod;
                  // URI to get the key
                  levelkey.baseuri = baseurl;
                  levelkey.reluri = decrypturi;
                  levelkey.key = null;
                  // Initialization Vector (IV)
                  levelkey.iv = decryptiv;
                }
              }
              break;
            case 'START':
              var startParams = value1;
              var startAttrs = new _attrList2.default(startParams);
              var startTimeOffset = startAttrs.decimalFloatingPoint('TIME-OFFSET');
              //TIME-OFFSET can be 0
              if (!isNaN(startTimeOffset)) {
                level.startTimeOffset = startTimeOffset;
              }
              break;
            case 'MAP':
              var mapAttrs = new _attrList2.default(value1);
              frag.relurl = mapAttrs.URI;
              frag.rawByteRange = mapAttrs.BYTERANGE;
              frag.baseurl = baseurl;
              frag.level = id;
              frag.type = type;
              frag.sn = 'initSegment';
              level.initSegment = frag;
              frag = new Fragment();
              break;
            default:
              _logger.logger.warn('line parsed but not handled: ' + result);
              break;
          }
        }
      }
      frag = prevFrag;
      //logger.log('found ' + level.fragments.length + ' fragments');
      if (frag && !frag.relurl) {
        level.fragments.pop();
        totalduration -= frag.duration;
      }
      level.totalduration = totalduration;
      level.averagetargetduration = totalduration / level.fragments.length;
      level.endSN = currentSN - 1;

      _avlog2.default.print('\u89C6\u9891\u603B\u65F6\u957F ' + totalduration + ' s | ts\u5E73\u5747\u65F6\u957F ' + level.averagetargetduration + ' s');

      return level;
    }
  }, {
    key: 'loadsuccess',
    value: function loadsuccess(response, stats, context) {
      var string = response.data,
          url = response.url,
          type = context.type,
          id = context.id,
          level = context.level,
          hls = this.AVPLAYER;

      this.loaders[type] = undefined;
      // responseURL not supported on some browsers (it is used to detect URL redirection)
      // data-uri mode also not supported (but no need to detect redirection)
      if (url === undefined || url.indexOf('data:') === 0) {
        // fallback to initial URL
        url = context.url;
      }
      stats.tload = performance.now();
      //stats.mtime = new Date(target.getResponseHeader('Last-Modified'));
      if (string.indexOf('#EXTM3U') === 0) {
        if (string.indexOf('#EXTINF:') > 0) {
          var isLevel = type !== 'audioTrack' && type !== 'subtitleTrack',
              levelId = !isNaN(level) ? level : !isNaN(id) ? id : 0,
              levelDetails = this.parseLevelPlaylist(string, url, levelId, type === 'audioTrack' ? 'audio' : type === 'subtitleTrack' ? 'subtitle' : 'main');
          levelDetails.tload = stats.tload;

          stats.tparsed = performance.now();

          _avlog2.default.print('\u89E3\u6790m3u8\u6587\u4EF6\u8017\u65F6 ' + (0, _commonFunctions.toFixed)(stats.tparsed - stats.tload) + ' ms');

          if (type === 'manifest') {
            // first request, stream manifest (no master playlist), fire manifest loaded event with level details
            this.AVPLAYER.trigger(_events2.default.MANIFEST_LOADED, { levels: [{ url: url, details: levelDetails }], audioTracks: [], url: url, stats: stats });
          }

          if (levelDetails.targetduration) {
            if (isLevel) {
              this.AVPLAYER.trigger(_events2.default.LEVEL_LOADED, { details: levelDetails, level: level || 0, id: id || 0, stats: stats });
            } else {
              if (type === 'audioTrack') {
                this.AVPLAYER.trigger(_events2.default.AUDIO_TRACK_LOADED, { details: levelDetails, id: id, stats: stats });
              } else if (type === 'subtitleTrack') {
                this.AVPLAYER.trigger(_events2.default.SUBTITLE_TRACK_LOADED, { details: levelDetails, id: id, stats: stats });
              }
            }
          } else {
            this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'invalid targetduration' });
          }
        } else {
          var levels = this.parseMasterPlaylist(string, url);
          // multi level playlist, parse level info
          if (levels.length) {
            var audioTracks = this.parseMasterPlaylistMedia(string, url, 'AUDIO');
            var subtitles = this.parseMasterPlaylistMedia(string, url, 'SUBTITLES');
            if (audioTracks.length) {
              // check if we have found an audio track embedded in main playlist (audio track without URI attribute)
              var embeddedAudioFound = false;
              audiotracks.forEach(function (audioTrack) {
                if (!audioTrack.url) {
                  embeddedAudioFound = true;
                }
              });
              // if no embedded audio track defined, but audio codec signaled in quality level, we need to signal this main audio track
              // this could happen with playlists with alt audio rendition in which quality levels (main) contains both audio+video. but with mixed audio track not signaled
              if (embeddedAudioFound === false && levels[0].audioCodec && !levels[0].attrs.AUDIO) {
                _logger.logger.log('audio codec signaled in quality level, but no embedded audio track signaled, create one');
                audiotracks.unshift({ type: 'main', name: 'main' });
              }
            }
            this.AVPLAYER.trigger(_events2.default.MANIFEST_LOADED, { levels: levels, audioTracks: audioTracks, subtitles: subtitles, url: url, stats: stats });
          } else {
            this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no level found in manifest' });
          }
        }
      } else {
        this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: _errors.ErrorDetails.MANIFEST_PARSING_ERROR, fatal: true, url: url, reason: 'no EXTM3U delimiter' });
      }
    }
  }, {
    key: 'loaderror',
    value: function loaderror(response, context) {
      var details,
          fatal,
          loader = context.loader;
      switch (context.type) {
        case 'manifest':
          details = _errors.ErrorDetails.MANIFEST_LOAD_ERROR;
          fatal = true;
          break;
        case 'level':
          details = _errors.ErrorDetails.LEVEL_LOAD_ERROR;
          fatal = false;
          break;
        case 'audioTrack':
          details = _errors.ErrorDetails.AUDIO_TRACK_LOAD_ERROR;
          fatal = false;
          break;
      }
      if (loader) {
        loader.abort();
        this.loaders[context.type] = undefined;
      }
      this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: loader.url, loader: loader, response: response, context: context });
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout(stats, context) {
      var details,
          fatal,
          loader = context.loader;
      switch (context.type) {
        case 'manifest':
          details = _errors.ErrorDetails.MANIFEST_LOAD_TIMEOUT;
          fatal = true;
          break;
        case 'level':
          details = _errors.ErrorDetails.LEVEL_LOAD_TIMEOUT;
          fatal = false;
          break;
        case 'audioTrack':
          details = _errors.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT;
          fatal = false;
          break;
      }
      if (loader) {
        loader.abort();
        this.loaders[context.type] = undefined;
      }
      this.AVPLAYER.trigger(_events2.default.ERROR, { type: _errors.ErrorTypes.NETWORK_ERROR, details: details, fatal: fatal, url: loader.url, loader: loader, context: context });
    }
  }]);

  return PlaylistLoader;
}(_eventHandler2.default);

exports.default = PlaylistLoader;