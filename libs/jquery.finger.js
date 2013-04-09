/*
 * jquery.finger
 * https://github.com/ngryman/jquery.finger
 *
 * Copyright (c) 2013 ngryman
 * Licensed under the MIT license.
 */

(function($) {

	var hasTouch = 'ontouchstart' in window,
	startEvent = hasTouch ? 'touchstart' : 'mousedown',
	stopEvent = hasTouch ? 'touchend touchcancel' : 'mouseup mouseleave',
	moveEvent = hasTouch ? 'touchmove' : 'mousemove';

	$.Finger = {
		pressDuration: 300,
		doubleTapInterval: 300,
		flickDuration: 150,
		motionThreshold: 5
	};

	function startHandler(event) {
		var data = {};
		data.move = { x: event.originalEvent.pageX, y: event.originalEvent.pageY };
		data.start = $.extend({ time: event.timeStamp, target: event.target }, data.move);

		$.event.add(this, moveEvent + '.finger', moveHandler, data);
		$.event.add(this, stopEvent + '.finger', stopHandler, data);
	}

	function moveHandler(event) {
		var data = event.data;

		// motion data
		data.move.x = event.originalEvent.pageX;
		data.move.y = event.originalEvent.pageY;
		data.move.dx = data.move.x - data.start.x;
		data.move.dy = data.move.y - data.start.y;
		data.move.adx = Math.abs(data.move.dx);
		data.move.ady = Math.abs(data.move.dy);

		// security
		data.motion = data.move.adx > $.Finger.motionThreshold || data.move.ady > $.Finger.motionThreshold;
		if (!data.motion) return;

		// orientation
		if (!data.move.orientation) {
			if (data.move.adx > data.move.ady) {
				data.move.orientation = 'horizontal';
				data.move.direction = data.move.dx > 0 ? +1 : -1;
			}
			else {
				data.move.orientation = 'vertical';
				data.move.direction = data.move.dy > 0 ? +1 : -1;
			}
		}

		// fire drag event
		$.event.trigger($.Event('drag' + $.expando, data.move), null, event.target);
	}

	function stopHandler(event) {
		var data = event.data,
		now = event.timeStamp,
		f = $.data(this, 'finger'),
		evtName;

		// tap-like events
		if (!data.motion) {
			evtName = now - data.start.time < $.Finger.pressDuration ?
			!f.prev || f.prev && now - f.prev > $.Finger.doubleTapInterval ? 'tap' : 'doubletap' :
			'press';
			f.prev = now;
			$.event.trigger($.Event(evtName + $.expando, data.move), null, event.target);
		}
		// motion events
		else {
			evtName = now - data.start.time < $.Finger.flickDuration ? 'flick' : 'drag';
			data.move.end = true;
			$.event.trigger($.Event(evtName + $.expando, data.move), null, event.target);
		}

		$.event.remove(this, moveEvent + '.finger', moveHandler);
		$.event.remove(this, stopEvent + '.finger', stopHandler);
	}

	var fingerCustom = {
		setup: function() {
			if (!$.data(this, 'finger')) {
				$.event.add(this, startEvent + '.finger', startHandler);
				$.data(this, 'finger', {});
			}
		},

		add: function(handleObj) {
			$.event.add(this, handleObj.type + $.expando, handleObj.handler, null, handleObj.selector);
		},

		remove: function(handleObj) {
			$.event.add(this, handleObj.type + $.expando, handleObj.handler, null, handleObj.selector);
		},

		teardown: function() {
			if ($.data(this, 'finger')) {
				$.event.remove(this, startEvent + '.finger', startHandler);
				$.data(this, 'finger', null);
			}
		}
	};

	// registers custom events
	$.event.special.tap = fingerCustom;
	$.event.special.press = fingerCustom;
	$.event.special.doubletap = fingerCustom;
	$.event.special.drag = fingerCustom;
	$.event.special.flick = fingerCustom;

})(jQuery);