




var port = new osc.WebSocketPort({
	url: settings.webSocketAdress
});

port.open();

var indexDrawing = 1;
var canvas,
	c, // the canvas' context 2D
	cUsage,
	devicePixelRatio,
	canvasStatic,
	canvasUsage,
	cStatic,
	container;

var indexUsage = 1;

var activeHandler;

function draw() {

	c.clearRect(0, 0, canvas.width, canvas.height);

	activeHandler.drawRefresh(canvas.width, canvas.height, c);

	activeHandler.drawStatic(canvas.width, canvas.height, cStatic);

	c.drawImage(canvasStatic, 0, 0, canvasStatic.width, canvasStatic.height);

	if (settings.showImagesProbing) {
		for (var i = 0; i < activeHandler.listImagesProbing.length; i++) {
			var image = activeHandler.listImagesProbing[i];
			c.drawImage(image.canvas, 0, 0, image.canvas.width / 2, image.canvas.height / 2);
		}
	}

	for (; indexUsage < penpoints.length - 3 && penpoints.length > 1; indexUsage++) {

		var point = penpoints[indexUsage];

		if (point.isStartPoint) {
			continue;
		}

		var pointLast = penpoints[indexUsage - 1];

		cUsage.lineWidth = 2;
		cUsage.strokeStyle = "rgb(100,100,100)";

		cUsage.beginPath();
		cUsage.moveTo(point.x, point.y);
		cUsage.lineTo(pointLast.x, pointLast.y);
		cUsage.stroke();
	}

}


var interpolate = 0;
var isDown = false;

function positionHandler(e) {
	/* fairly ugly, unoptimised approach of manually replicating the targetTouches array */
	switch (e.type) {
		case 'pointerdown':
		case 'pointermove':

			/**
			 * When you don't want to use every pen move event, but only every n-th event, this value 
			 * is the n value for that.
			 */
			if (interpolate++ % 1 != 0) {
				return;
			}

			if (e.pressure == 0) {
				return;
			}

			var lastPoint = penpoints[penpoints.length - 1];
			var newPoint = new PenPoint(e.clientX, e.clientY, e.pressure, e.tiltX, e.tiltY, 0, 0, !isDown);


			if (penpoints.length > 1 && newPoint.pressure > 0) {
				activeHandler.update(penpoints, newPoint, lastPoint);
			} else {
				activeHandler.stopSounds();
			}

			isDown = true;

			break;
		case 'pointerup':
		case 'pointerout':
		case 'pointercancel':
		case 'MSPointerUp':
		case 'MSPointerOut':
		case 'MSPointerCancel':
			activeHandler.stopSounds();
			isDown = false;
			break;
	}

	if (penpoints.length % 2 == 0 || true) {
		window.requestAnimationFrame(draw);
	}
}

var gui;



function init() {
	
	prepareCanvas();

	/**
	 * Switch between the available handlers.
	 */
	window.onkeydown = function (e) {
		let key = event.key.toUpperCase();
		activeHandler.quitSynths();

		var number= parseInt(key);

		setActiveHandler(handlerList[number-1].id);
	}

	/**
	 * From here on the gui will be created.
	 */
	gui = new dat.GUI();
	
	/**
	 * Saving (uses localstorage) does not work with edge.
	 */
	gui.remember(settings);

	var folder1 = gui.addFolder('Debug');

	folder1.add(settings, 'showCollision').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	folder1.add(settings, 'showCurvatureCircle').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	folder1.add(settings, 'showCurvatureLines').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	folder1.add(settings, 'curvatureDistance', 0.1, 3.0).onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	folder1.add(settings, 'showGrid').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	folder1.add(settings, 'showImagesProbing').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	gui.add(settings, 'reset').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});

	/**
	 * Get the ids of the existing handlers to make them available as a list in the GUI.
	 */
	var handlerIds = [];
	for(var i = 0; i<handlerList.length;i++){
		handlerIds.push(handlerList[i].id);
	}
	gui.add(settings, 'handlerType', handlerIds).onChange(setActiveHandler);


	setActiveHandler(settings.handlerType);
	
	settings.reset();
}

function setActiveHandler(value){

	if(activeHandler!=null){
		activeHandler.quitSynths();
	}

	/**
	 * Search for handler with fitting id
	 */
	for(var i = 0; i<handlerList.length;i++){
		if(value == handlerList[i].id){
			activeHandler = handlerList[i];
		}
	}

	/**
	 * If no handler is found, take the first one that is available.
	 */
	if(activeHandler==null){
		activeHandler = handlerList[0];
		value = handlerList[0].id;
	}

	settings.handlerType = value;

	for (var i in gui.__controllers) {
		gui.__controllers[i].updateDisplay();
	}

	settings.reset();
	activeHandler.startSynth();
	window.requestAnimationFrame(draw);
}

/**
 * Creates all the canvases we need, sets their size and add the event listeners.
 */
function prepareCanvas() {

	canvas = document.createElement('canvas');
	c = canvas.getContext('2d');
	canvasStatic = document.createElement('canvas');
	cStatic = canvasStatic.getContext('2d');
	canvasUsage = document.createElement('canvas');
	cUsage = canvasUsage.getContext('2d');
	container = document.createElement('div');
	container.className = "container";

	// HiDPI canvas adapted from http://www.html5rocks.com/en/tutorials/canvas/hidpi/
	devicePixelRatio = window.devicePixelRatio || 1;
	canvas.width = window.innerWidth * devicePixelRatio;
	canvas.height = window.innerHeight * devicePixelRatio;
	canvas.style.width = window.innerWidth + 'px';
	canvas.style.height = window.innerHeight + 'px';
	c.scale(devicePixelRatio, devicePixelRatio);

	canvasStatic.width = window.innerWidth * devicePixelRatio;
	canvasStatic.height = window.innerHeight * devicePixelRatio;
	canvasStatic.style.width = window.innerWidth + 'px';
	canvasStatic.style.height = window.innerHeight + 'px';


	canvasUsage.width = window.innerWidth * devicePixelRatio;
	canvasUsage.height = window.innerHeight * devicePixelRatio;
	canvasUsage.style.width = window.innerWidth + 'px';
	canvasUsage.style.height = window.innerHeight + 'px';
	//cRepaint.scale(devicePixelRatio, devicePixelRatio);

	container.appendChild(canvas);
	document.body.appendChild(container);
	var events = [];
	/* feature detect - in this case not dangerous, as pointer is not exclusively touch */
	if ((window.PointerEvent) || (window.navigator.pointerEnabled) || (window.navigator.msPointerEnabled)) {
		events = ['pointerover', 'pointerdown', 'pointermove', 'pointerup', 'pointerout', 'pointercancel',
			'MSPointerOver', 'MSPointerDown', 'MSPointerMove', 'MSPointerUp', 'MSPointerOut', 'MSPointerCancel'];
	} else {
		events = ['mouseover', 'mousedown', 'mousemove', 'mouseup', 'mouseout',
			'touchstart', 'touchmove', 'touchend', 'touchcancel'];
	}

	for (var i = 0, l = events.length; i < l; i++) {
		canvas.addEventListener(events[i], positionHandler, false);
	}

	// suppress context menu
	canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); }, false)
}

/* 
hack to prevent firing the init script before the window object's values are populated 
*/	
window.addEventListener('load', function () {
	setTimeout(init, 100);
}, false);


