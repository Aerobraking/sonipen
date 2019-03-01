

window.onkeydown = function (e) {
	let key = event.key.toUpperCase();

	activeHandler.quitSynths();

	switch (key) {
		case "1":
			settings.showCollisionDebug = !settings.showCollisionDebug;
			break;
		case "2":
			settings.showCollision = !settings.showCollision;
			break;
		case "3":
			settings.showCurvatureCircle = !settings.showCurvatureCircle;
			break;
		case "4":
			settings.showCurvatureLines = !settings.showCurvatureLines;
			break;
		case "Q":
			activeHandler = handlerPenSoni;
			break;
		case "W":
			activeHandler = handlerCurvature;
			break;
		case "G":
			settings.showGrid = !settings.showGrid;
			break;
		case "N":
			settings.curvatureDistance -= 0.1;
			break;
		case "M":
			settings.curvatureDistance += 0.1;
			break;
		case "R":
			penpoints = [];
			cStatic.clearRect(0, 0, canvas.width, canvas.height);
			cUsage.clearRect(0, 0, canvas.width, canvas.height);
			indexDrawing = 0;
			indexUsage = 0;
			break;
	}

	activeHandler.startSynth();

	window.requestAnimationFrame(draw);

	// var canvasImg1 = document.createElement('canvas');
	// canvasImg1.width = img.width;
	// canvasImg1.height = img.height;
	// canvasImg1.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
	
	// var pixelData = canvasImg1.getContext('2d').getImageData(234, 123, 1, 1).data;
	
	// console.log(pixelData);

}

var sectorMap = new TwoDSectorMap(settings.sectorMapRes);
var penpoints = [];

var port = new osc.WebSocketPort({
	url: "ws://localhost:8080"
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


var handlerPenSoni ;
var handlerCurvature ;
var activeHandler ;

function draw() {

	c.clearRect(0, 0, canvas.width, canvas.height);

	activeHandler.drawRefresh(canvas.width, canvas.height, c);

	activeHandler.drawStatic(canvas.width, canvas.height, cStatic);

	c.drawImage(canvasStatic, 0, 0, canvasStatic.width, canvasStatic.height);

	if(settings.showImages){
		for (var i = 0; i < activeHandler.listImages.length; i++) {
			var image = activeHandler.listImages[i];
			c.drawImage(image.canvas, 0, 0, image.canvas.width/2, image.canvas.height/2);
		}	
	}

	for (; indexUsage < penpoints.length - 10 && penpoints.length > 1; indexUsage++) {

		var point = penpoints[indexUsage];

		if (point.isStartPoint) {
			continue;
		}

		var pointLast = penpoints[indexUsage - 1];

		cUsage.lineWidth = 3;
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
		case 'pointermove':

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

function init() {
	canvas = document.createElement('canvas');
	c = canvas.getContext('2d');
	canvasStatic = document.createElement('canvas');
	cStatic = canvasStatic.getContext('2d');
	canvasUsage = document.createElement('canvas');
	cUsage = canvasUsage.getContext('2d');
	container = document.createElement('div');
	container.className = "container";
	resetCanvas();
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


	var gui = new dat.GUI();

	/**
	 * Saving (uses localstorage) does not work with edge.
	 */
	gui.remember(settings);

	var folder1 = gui.addFolder('Debug');

	folder1.add(settings, 'showCollisionDebug').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
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
	folder1.add(settings, 'showImages').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});

	gui.add(settings, 'reset').onChange(function (value) {
		window.requestAnimationFrame(draw);
	});
	gui.add(settings, 'handlerType', ['curvature', 'basis']).onChange(function (value) {
		
		activeHandler.quitSynths();
		console.log(value);
		switch (value) {
			case "basis":
				activeHandler = handlerPenSoni;
				break;
			case "curvature":
				activeHandler = handlerCurvature;
				break;
		}
		activeHandler.startSynth();
		window.requestAnimationFrame(draw);
	});


	
	  handlerPenSoni = new HandlerPenSonification();
	 handlerCurvature = new HandlerCurvatureSonifcation();
	 activeHandler = handlerCurvature;

	 activeHandler.startSynth();

 
}




function resetCanvas() {
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
}

window.addEventListener('load', function () {
	/* hack to prevent firing the init script before the window object's values are populated */
	setTimeout(init, 100);
}, false);

window.addEventListener("beforeunload", function (e) {

	bake_cookie("settings", settings);

	activeHandler.quitSynths();

});
