'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../../core/events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../../core/event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _logger = require('../../utils/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * audio track controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var SubtitleTrackController = function (_EventHandler) {
  _inherits(SubtitleTrackController, _EventHandler);

  function SubtitleTrackController(AVPLAYER) {
    _classCallCheck(this, SubtitleTrackController);

    var _this = _possibleConstructorReturn(this, (SubtitleTrackController.__proto__ || Object.getPrototypeOf(SubtitleTrackController)).call(this, AVPLAYER, _events2.default.MEDIA_ATTACHED, _events2.default.MEDIA_DETACHING, _events2.default.MANIFEST_LOADING, _events2.default.MANIFEST_LOADED, _events2.default.SUBTITLE_TRACK_LOADED));

    _this.tracks = [];
    _this.trackId = -1;
    _this.media = undefined;
    return _this;
  }

  _createClass(SubtitleTrackController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }

    // Listen for subtitle track change, then extract the current track ID.

  }, {
    key: 'onMediaAttached',
    value: function onMediaAttached(data) {
      var _this2 = this;

      this.media = data.media;
      if (!this.media) {
        return;
      }

      this.media.textTracks.addEventListener('change', function () {
        // Media is undefined when switching streams via loadSource()
        if (!_this2.media) {
          return;
        }

        var trackId = -1;
        var tracks = _this2.media.textTracks;
        for (var id = 0; id < tracks.length; id++) {
          if (tracks[id].mode === 'showing') {
            trackId = id;
          }
        }
        // Setting current subtitleTrack will invoke code.
        _this2.subtitleTrack = trackId;
      });
    }
  }, {
    key: 'onMediaDetaching',
    value: function onMediaDetaching() {
      // TODO: Remove event listeners.
      this.media = undefined;
    }

    // Reset subtitle tracks on manifest loading

  }, {
    key: 'onManifestLoading',
    value: function onManifestLoading() {
      this.tracks = [];
      this.trackId = -1;
    }

    // Fired whenever a new manifest is loaded.

  }, {
    key: 'onManifestLoaded',
    value: function onManifestLoaded(data) {
      var _this3 = this;

      var tracks = data.subtitles || [];
      var defaultFound = false;
      this.tracks = tracks;
      this.trackId = -1;
      this.AVPLAYER.trigger(_events2.default.SUBTITLE_TRACKS_UPDATED, { subtitleTracks: tracks });

      // loop through available subtitle tracks and autoselect default if needed
      // TODO: improve selection logic to handle forced, etc
      tracks.forEach(function (track) {
        if (track.default) {
          _this3.subtitleTrack = track.id;
          defaultFound = true;
        }
      });
    }

    // Trigger subtitle track playlist reload.

  }, {
    key: 'onTick',
    value: function onTick() {
      var trackId = this.trackId;
      var subtitleTrack = this.tracks[trackId];
      if (!subtitleTrack) {
        return;
      }

      var details = subtitleTrack.details;
      // check if we need to load playlist for this subtitle Track
      if (details === undefined || details.live === true) {
        // track not retrieved yet, or live playlist we need to (re)load it
        _logger.logger.log('(re)loading playlist for subtitle track ' + trackId);
        this.AVPLAYER.trigger(_events2.default.SUBTITLE_TRACK_LOADING, { url: subtitleTrack.url, id: trackId });
      }
    }
  }, {
    key: 'onSubtitleTrackLoaded',
    value: function onSubtitleTrackLoaded(data) {
      var _this4 = this;

      if (data.id < this.tracks.length) {
        _logger.logger.log('subtitle track ' + data.id + ' loaded');
        this.tracks[data.id].details = data.details;
        // check if current playlist is a live playlist
        if (data.details.live && !this.timer) {
          // if live playlist we will have to reload it periodically
          // set reload period to playlist target duration
          this.timer = setInterval(function () {
            _this4.onTick();
          }, 1000 * data.details.targetduration, this);
        }
        if (!data.details.live && this.timer) {
          // playlist is not live and timer is armed : stopping it
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }

    /** get alternate subtitle tracks list from playlist **/

  }, {
    key: 'setSubtitleTrackInternal',
    value: function setSubtitleTrackInternal(newId) {
      // check if level idx is valid
      if (newId >= 0 && newId < this.tracks.length) {
        // stopping live reloading timer if any
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        this.trackId = newId;
        _logger.logger.log('switching to subtitle track ' + newId);
        var subtitleTrack = this.tracks[newId];
        this.AVPLAYER.trigger(_events2.default.SUBTITLE_TRACK_SWITCH, { id: newId });
        // check if we need to load playlist for this subtitle Track
        var details = subtitleTrack.details;
        if (details === undefined || details.live === true) {
          // track not retrieved yet, or live playlist we need to (re)load it
          _logger.logger.log('(re)loading playlist for subtitle track ' + newId);
          this.AVPLAYER.trigger(_events2.default.SUBTITLE_TRACK_LOADING, { url: subtitleTrack.url, id: newId });
        }
      }
    }
  }, {
    key: 'subtitleTracks',
    get: function get() {
      return this.tracks;
    }

    /** get index of the selected subtitle track (index in subtitle track lists) **/

  }, {
    key: 'subtitleTrack',
    get: function get() {
      return this.trackId;
    }

    /** select a subtitle track, based on its index in subtitle track lists**/
    ,
    set: function set(subtitleTrackId) {
      if (this.trackId !== subtitleTrackId) {
        // || this.tracks[subtitleTrackId].details === undefined) {
        this.setSubtitleTrackInternal(subtitleTrackId);
      }
    }
  }]);

  return SubtitleTrackController;
}(_eventHandler2.default);

exports.default = SubtitleTrackController;