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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Subtitle Stream Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var SubtitleStreamController = function (_EventHandler) {
  _inherits(SubtitleStreamController, _EventHandler);

  function SubtitleStreamController(AVPLAYER) {
    _classCallCheck(this, SubtitleStreamController);

    var _this = _possibleConstructorReturn(this, (SubtitleStreamController.__proto__ || Object.getPrototypeOf(SubtitleStreamController)).call(this, AVPLAYER, _events2.default.ERROR, _events2.default.SUBTITLE_TRACKS_UPDATED, _events2.default.SUBTITLE_TRACK_SWITCH, _events2.default.SUBTITLE_TRACK_LOADED, _events2.default.SUBTITLE_FRAG_PROCESSED));

    _this.config = AVPLAYER.config;
    _this.vttFragSNsProcessed = {};
    _this.vttFragQueues = undefined;
    _this.currentlyProcessing = null;
    _this.currentTrackId = -1;
    return _this;
  }

  _createClass(SubtitleStreamController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }

    // Remove all queued items and create a new, empty queue for each track.

  }, {
    key: 'clearVttFragQueues',
    value: function clearVttFragQueues() {
      var _this2 = this;

      this.vttFragQueues = {};
      this.tracks.forEach(function (track) {
        _this2.vttFragQueues[track.id] = [];
      });
    }

    // If no frag is being processed and queue isn't empty, initiate processing of next frag in line.

  }, {
    key: 'nextFrag',
    value: function nextFrag() {
      if (this.currentlyProcessing === null && this.currentTrackId > -1 && this.vttFragQueues[this.currentTrackId].length) {
        var frag = this.currentlyProcessing = this.vttFragQueues[this.currentTrackId].shift();
        this.AVPLAYER.trigger(_events2.default.FRAG_LOADING, { frag: frag });
      }
    }

    // When fragment has finished processing, add sn to list of completed if successful.

  }, {
    key: 'onSubtitleFragProcessed',
    value: function onSubtitleFragProcessed(data) {
      if (data.success) {
        this.vttFragSNsProcessed[data.frag.trackId].push(data.frag.sn);
      }
      this.currentlyProcessing = null;
      this.nextFrag();
    }

    // If something goes wrong, procede to next frag, if we were processing one.

  }, {
    key: 'onError',
    value: function onError(data) {
      var frag = data.frag;
      // don't handle frag error not related to subtitle fragment
      if (frag && frag.type !== 'subtitle') {
        return;
      }
      if (this.currentlyProcessing) {
        this.currentlyProcessing = null;
        this.nextFrag();
      }
    }

    // Got all new subtitle tracks.

  }, {
    key: 'onSubtitleTracksUpdated',
    value: function onSubtitleTracksUpdated(data) {
      var _this3 = this;

      _logger.logger.log('subtitle tracks updated');
      this.tracks = data.subtitleTracks;
      this.clearVttFragQueues();
      this.vttFragSNsProcessed = {};
      this.tracks.forEach(function (track) {
        _this3.vttFragSNsProcessed[track.id] = [];
      });
    }
  }, {
    key: 'onSubtitleTrackSwitch',
    value: function onSubtitleTrackSwitch(data) {
      this.currentTrackId = data.id;
      this.clearVttFragQueues();
    }

    // Got a new set of subtitle fragments.

  }, {
    key: 'onSubtitleTrackLoaded',
    value: function onSubtitleTrackLoaded(data) {
      var processedFragSNs = this.vttFragSNsProcessed[data.id],
          fragQueue = this.vttFragQueues[data.id],
          currentFragSN = !!this.currentlyProcessing ? this.currentlyProcessing.sn : -1;

      var alreadyProcessed = function alreadyProcessed(frag) {
        return processedFragSNs.indexOf(frag.sn) > -1;
      };

      var alreadyInQueue = function alreadyInQueue(frag) {
        return fragQueue.some(function (fragInQueue) {
          return fragInQueue.sn === frag.sn;
        });
      };

      // Add all fragments that haven't been, aren't currently being and aren't waiting to be processed, to queue.
      data.details.fragments.forEach(function (frag) {
        if (!(alreadyProcessed(frag) || frag.sn === currentFragSN || alreadyInQueue(frag))) {
          // Frags don't know their subtitle track ID, so let's just add that...
          frag.trackId = data.id;
          fragQueue.push(frag);
        }
      });

      this.nextFrag();
    }
  }]);

  return SubtitleStreamController;
}(_eventHandler2.default);

exports.default = SubtitleStreamController;