/*
*
* All objects in the event handling chain should inherit from this class
*
*/
import {ErrorTypes, ErrorDetails} from './errors';
import Event from './events';

class EventHandler {
  constructor(AVPLAYER, ...events) {
    this.AVPLAYER = AVPLAYER;
    this.onEvent = this.onEvent.bind(this);
    this.handledEvents = events;
    this.useGenericHandler = true;

    this.registerListeners();
  }

  destroy() {
    this.unregisterListeners();
  }

  isEventHandler() {
    return typeof this.handledEvents === 'object' && this.handledEvents.length && typeof this.onEvent === 'function';
  }

  registerListeners() {
    if (this.isEventHandler()) {
      this.handledEvents.forEach(function(event) {
        if (event === 'avplayerEventGeneric') {
          throw new Error('Forbidden event name: ' + event);
        }
        this.AVPLAYER.on(event, this.onEvent);
      }.bind(this));
    }
  }

  unregisterListeners() {
    if (this.isEventHandler()) {
      this.handledEvents.forEach(function(event) {
        this.AVPLAYER.off(event, this.onEvent);
      }.bind(this));
    }
  }

  /**
   * arguments: event (string), data (any)
   */
  onEvent(event, data) {
    this.onEventGeneric(event, data);
  }

  onEventGeneric(event, data) {
    var eventToFunction = function(event, data) {
      var funcName = 'on' + event.replace('avplayer', '');
      if (typeof this[funcName] !== 'function') {
        throw new Error(`Event ${event} has no generic handler in this ${this.constructor.name} class (tried ${funcName})`);
      }
      return this[funcName].bind(this, data);
    };
    try {
      eventToFunction.call(this, event, data).call();
    } catch (err) {
      console.log('Fatal-->', event, err.message, err.stack);
      this.AVPLAYER.trigger(Event.ERROR, {type: ErrorTypes.OTHER_ERROR, details: ErrorDetails.INTERNAL_EXCEPTION, fatal: false, event : event, err : err});
    }
  }
}

export default EventHandler;
