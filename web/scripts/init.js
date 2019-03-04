
// service functions (linlin etc.)
function linlin(x, smi, sma, dmi, dma) {
    return (x - smi) / (sma - smi) * (dma - dmi) + dmi;
}
function midicps(m) {
    return 440.0 * 2 ** ((m - 69) / 12.0);
}
function cpsmidi(c) {
    return 69 + 12 * Math.log2(c / 440.0);
}
function clip(v, min = -Infinity, max = Infinity) {
    if (v < min) { return min };
    if (v > max) { return max };
    return v;
}
function dbamp(db) {
    return 10 ** (db / 20.0);
}
function ampdb(amp) {
    return 20 * Math.log10(amp);
}

class TwoDSectorMap {

    constructor(resolution) {
        this.resolution = resolution;
        this.map = [];
    }

    pushObject(obj) {
        var sector = this.getSector(obj);
        sector.push(obj);
    }

    getKey(obj) {
        var x = obj.x, y = obj.y;
        var indexX = Math.floor(x / this.resolution);
        var indexY = Math.floor(y / this.resolution);

        var key = [indexX, indexY];
        return key;
    }

    getSector(obj) {
        var sector = this.map[this.getKey(obj)];

        if (typeof sector === "undefined") {
            sector = [];
            this.map[this.getKey(obj)] = sector;
        }

        return sector;
    }

    getSectorWithNeighbours(obj, level) {
        var sectorList = [];

        sectorList.push(this.getSector(obj));

        for (var i = obj.x - this.resolution * level; i <= obj.x + this.resolution * level; i += this.resolution) {
            for (var j = obj.y - this.resolution * level; j <= obj.y + this.resolution * level; j += this.resolution) {
                var sector = this.getSector(new Vector(i, j));
                if (!sectorList.includes(sector)) {
                    sectorList.push(sector);
                }
            }
        }



        return sectorList;
    }

    getSectorWithNeighboursAsList(obj, level) {
        var sectorList = this.getSectorWithNeighbours(obj, level);

        var list = [];

        sectorList.forEach(function (sector) {
            for (var i = 0; i < sector.length - 1; i++) {
                list.push(sector[i]);
            }
        });

        return list;
    }

}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Color {
    constructor(r, g, b, a) {
        this.r = isNaN(r) ? 0 : r;
        this.g = isNaN(g) ? 0 : g;
        this.b = isNaN(b) ? 0 : b;
        this.a = isNaN(a) ? 0 : a;
    }
}

class ImageProbe {
    constructor(img, canvas, path, list, index, x, y, width, height) {
        this.img = img;
        this.canvas = canvas;
        this.c = canvas.getContext('2d');
        this.path = path;
        this.list = list;
        this.index = index;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        // this.imageData =  c.getImageData(0,0, width,height);
    }
}

/**
 * 
 * @param {*} imageData 
 * @param {*} x 
 * @param {*} y 
 * @param {*} width the width that was used to get the imageData
 * @param {*} height 
 */
function getPixelFromImageData(imageData, x, y, width, height) {

    var data = imageData.data;
    var indexStart = (x * 4) + (y * width * 4);
    var pixelData = new Color(data[indexStart], data[indexStart + 1], data[indexStart + 2], data[indexStart + 3]);

    return pixelData;
}

/**
 * Bresenham Algorithm
 * https://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
 * @param {} startCoordinates 
 * @param {*} endCoordinates 
 */
function calcStraightLine(startCoordinates, endCoordinates) {

    var lastPointFirst = startCoordinates.x > endCoordinates.x;

    /**
     * Switch the points, when the start point is on a greater x coordinate.
     */
    if (lastPointFirst) {
        var tempPoint = endCoordinates;
        endCoordinates = startCoordinates;
        startCoordinates = tempPoint;
    }

    var coordinatesArray = new Array();
    // Translate coordinates
    var x1 = Math.floor(startCoordinates.x);
    var y1 = Math.floor(startCoordinates.y);
    var x2 = Math.ceil(endCoordinates.x);
    var y2 = Math.ceil(endCoordinates.y);

    if (!lastPointFirst) {
        coordinatesArray.push(new Vector(x1, y1));
    }
    // Set first coordinates

    // Define differences and error check
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var sx = (x1 < x2) ? 1 : -1;
    var sy = (y1 < y2) ? 1 : -1;
    var err = dx - dy;
    // Main loop
    while (!((x1 == x2) && (y1 == y2))) {
        var e2 = err << 1;
        if (e2 > -dy) {
            err -= dy;
            x1 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y1 += sy;
        }
        // Set coordinates
        if (lastPointFirst) {
            coordinatesArray.unshift(new Vector(x1, y1));
        } else {
            coordinatesArray.push(new Vector(x1, y1));
        }

    }


    if (lastPointFirst) {
        coordinatesArray.push(new Vector(x1, y1));
    }

    // Return the result
    return coordinatesArray;
}

function distanceVector(vector1, vector2) {
    return Math.sqrt(Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2));
}

function getNormalizedDirectionVector(lineStart, lineEnd) {
    return normalize(new Vector(lineStart.x - lineEnd.x, lineStart.y - lineEnd.y));
}

function getPixelDataArea(c, x, y, areaSize) {

    x = Math.floor(x);
    y = Math.floor(y);

    var r = 0, g = 0, b = 0, a = 0;
    var pixelCount = 0;

    for (var iX = x - areaSize; iX < x + areaSize; iX++) {
        for (var iY = y - areaSize; iY < y + areaSize; iY++) {
            pixelCount++;
            if (iX >= 0 && iX < canvas.width && iY >= 0 && iY < canvas.height) {
                var color = getPixelData(c, iX, iY);

                r += color.r;
                g += color.g;
                b += color.b;
                a += color.a;

            }
        }
    }

    pixelCount = pixelCount > 0 ? pixelCount : 1;

    return new Color(r / pixelCount, g / pixelCount, b / pixelCount, a / pixelCount);
}

function getPixelData(c, x, y) {
    // Get pixel data
    var imageData = c.getImageData(x, y, 1, 1);
    //color at (x,y) position
    var color = [];
    color[0] = imageData.data[0];
    color[1] = imageData.data[1];
    color[2] = imageData.data[2];
    color[3] = imageData.data[3];

    return new Color(
        color[0],
        color[1],
        color[2],
        color[3]
    );
}

function normalize(vector) {
    var x = vector.x;
    var y = vector.y;
    var length = Math.sqrt(x * x + y * y); //calculating length
    x = x / length; //assigning new value to x (dividing x by length of the vector)
    y = y / length; //assigning new value to y
    vector = new Vector(x, y);
    return vector;
}

/**
 * 
 * @param {*} as vector 1 source
 * @param {*} ad vector 1 direction
 * @param {*} bs vector 2 source
 * @param {*} bd vector 2 direction
 */
function lineIntersect(as, ad, bs, bd) {

    var u = (bd.x * bs.y + bd.y * as.x - bd.y * bs.x - bd.x * as.y) / (bd.x * ad.y - bd.y * ad.x);
    ix = as.x + ad.x * u;
    iy = as.y + ad.y * u;

    return new Vector(ix, iy);
}

/**
 * 
 * @param {*} line1Start vector 1 source
 * @param {*} ad vector 1 direction
 * @param {*} line2Start vector 2 source
 * @param {*} bd vector 2 direction
 */
function linePartIntersect(line1Start, line1End, line2Start, line2End) {

    var ad = getNormalizedDirectionVector(line1Start, line1End);
    var bd = getNormalizedDirectionVector(line2Start, line2End);

    var u = (bd.x * line2Start.y + bd.y * line1Start.x - bd.y * line2Start.x - bd.x * line1Start.y) / (bd.x * ad.y - bd.y * ad.x);
    var v = (ad.x * line1Start.y + ad.y * line2Start.x - ad.y * line1Start.x - ad.x * line2Start.y) / (ad.x * bd.y - ad.y * bd.x);

    var uCompare = ((line1End.x - line1Start.x) / ad.x);
    var vCompare = ((line2End.x - line2Start.x) / bd.x);

    var collision = (((uCompare > 0 && u > 0 && u < uCompare)
        || (uCompare < 0 && u < 0 && u > uCompare))
        &&
        ((vCompare > 0 && v > 0 && v < vCompare)
            || (vCompare < 0 && v < 0 && v > vCompare)))
        ;

    if (collision) {
        return true;
    }

    return false;
}

function bake_cookie(name, value) {
    var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
    document.cookie = cookie;
}

function read_cookie(name) {
    var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
    result && (result = JSON.parse(result[1]));
    return result;
}

class Settings {
    constructor() {
        this.webSocketAdress = "ws://localhost:8080";
        this.showCollision = false;
        this.showCurvatureCircle = false;
        this.showCurvatureLines = false;
        this.curvatureDistance = 0.5;
        this.showGrid = false;
        this.handlerType = 'sonification';
        this.reset = function () {
            c.clearRect(0, 0, canvas.width, canvas.height);
            cUsage.clearRect(0, 0, canvas.width, canvas.height);
            cStatic.clearRect(0, 0, canvas.width, canvas.height);
            penpoints = [];
            indexUsage = 1;
            indexDrawing = 1;
        };
        this.showImagesProbing = false;
    }
}

/**
 * This class represents one point that was drawn onto the canvas. 
 * Each time an move event of a pen is registered, one instance of a PenPoint is created and added to the list 'penpoints'. 
 * It contains various informations, beginning from the x,y coordinates up to the curvature at this point or the "collision" with other strokes.
 */
class PenPoint {
    constructor(x, y, pressure, tiltX, tiltY, timestamp, timestep, isStartPoint) {

        // add the point to the list
        penpoints.push(this);
        // the index of the point inside the penpoints list
        this.index = penpoints.length - 1;
        // the point that was drawn before this point, null if it is the first point
        this.lastPoint = this.index > 0 ? penpoints[this.index - 1] : null;
        /**
         * true: the pen was pressed onto the display and the first point was drawn, so it is the first point of a stroke
         * false: It's not the first point of a stroke. We have no information about weather it is the last point of stroke.
         */
        this.isStartPoint = isStartPoint;
        // x coordinate of the point on the canvas.
        this.x = x;
        // y coordinate of the point on the canvas.
        this.y = y;
        /**
         * Between this point and the last point a line is drawn and each pixel on this line is checked if there is already a drawn pixel. If so, this pixel is added to this list (as an Vector object). 
         */
        this.collisionPoints = [];
        // true: this point collide with already drawn stuff
        this.collision = false;
        /**
         * When the current handler has probing images added, for each image the pixel between the last point and this point are added to this list (as Color objects). When we have 10 pixel between them and the handler has 3 probing images, then you have 30 entries in this list, 0..9 for the first image, 10..19 for the second and 20..29 for the third. The order of the images is the order how they are added to the handler.
         */
        this.imageCollisionPoints = [];
        // the pressure of this point, a float value from 0...1
        this.pressure = pressure;
        // the tilt value for the horitontal plane
        this.tiltX = tiltX;
        // the tilt value for the vertical plane
        this.tiltY = tiltY;
        // the maximal tilt of the pen 
        this.tilt = Math.max(tiltX, tiltY);
        // the timestamp where the event is recieved for this point
        this.timestamp = timestamp;
        // the time between the creation of this point and the last one
        this.timestep = timestep;
        // the curvature of this point as the acos value (which is measured between this point and previous points)
        this.curvature = 0;
        // the curvature in degrees
        this.curvatureDegrees = 0;


        this.calcDistance();
        this.calcCurvature();
        this.calcCollision();

        /**
         * The speed of the pen between this and the last point. We don't use the timestep value for that, as 
         * it is not giving us the real time between the inputs but only between the recieving of the events for the inputs. So we use an average value of 0.03, that gives us a quite good and stable speed value. 
         */
        this.speed = isStartPoint ? 0 : this.distance / 0.03;
    }

    /**
     * Creates the input for the collisionPoints and imageCollisionPoints lists.
     * The collisionPoints are created by getting the image data between this point and the last point, then iterating through the pixels between the two points and check for a non black color.
     * The imageCollisionPoints is filled by using the same method, but getting the image data from the images of the handler. But here no check is made but all pixels are added.
     */
    calcCollision() {

        /**
         * Calculate collision via the already drawn areas. First we have to create the rectangle that frames
         * the sub image between our current point and the last one. then we get the image data for that. After that we calculate the points (pixel coordinates) that are between this point and the last one. 
         * We then iterate through the imagedata with these pixel coordinates and check if a pixel has a color. If so, it is added to the collision list. 
         * After that we do the same for the images that are saved in the handler, but without checking, so we add each pixel on the line to the list.
        */
        if (this.index > 0 && !this.isStartPoint) {

            var xMin = Math.floor(Math.min(this.x, this.lastPoint.x));
            var xMax = Math.ceil(Math.max(this.x, this.lastPoint.x));

            var yMin = Math.floor(Math.min(this.y, this.lastPoint.y));
            var yMax = Math.ceil(Math.max(this.y, this.lastPoint.y));

            var width = Math.max(xMax - xMin, 1);
            var height = Math.max(yMax - yMin, 1);

            var currentPoint = new Vector(this.x - xMin, this.y - yMin);
            var lastPoint = new Vector(this.lastPoint.x - xMin, this.lastPoint.y - yMin);

            var points = calcStraightLine(lastPoint, currentPoint);

            var imageData = cUsage.getImageData(xMin, yMin, width, height);

            for (var i = 0; i < points.length; i++) {

                var pixelCoord = points[i];
                var pixel = getPixelFromImageData(imageData, pixelCoord.x, pixelCoord.y, width, 1);

                pixelCoord.x += xMin;
                pixelCoord.y += yMin;

                points[i] = pixelCoord;

                if (pixel.r != 0
                    || pixel.g != 0
                    || pixel.b != 0
                    || pixel.a != 0) {

                    this.collisionPoints.push(pixelCoord);
                    this.collision = true;
                }
            }

            /**
             * Git pixels of the image probings from the current handler.
             * Hotfix: The coordinates are by half of the screen size, so we multiply everything by two
             */
            for (var j = 0; j < activeHandler.listImagesProbing.length; j++) {

                var image = activeHandler.listImagesProbing[j];

                imageData = image.c.getImageData(xMin*2, yMin*2, width*2, height*2);

                for (var i = 0; i < points.length; i++) {
                    var pixelCoord = points[i];
                    
                    var pixel = getPixelFromImageData(imageData, pixelCoord.x-xMin, pixelCoord.y-yMin, width*2, 1);
                    this.imageCollisionPoints.push(pixel);
                }

            }

        }

        /**
         * collision via distance to the other penpoints, not used in the moment
         */
        if (false) {
            var list = sectorMap.getSectorWithNeighboursAsList(this, 1);

            for (var i = 0; i < list.length - 5; i++) {

                if (penpoints.length - list[i].index < 10) {
                    continue;
                }

                if (distanceVector(this, list[i]) < 5) {
                    this.collision = true;
                    return;
                }
            }
        }

        /**
         * Collision with line intersection, not used in the moment
         */
        if (false) {

            var step = 6;

            if (penpoints.length < 6 + step) {
                return;
            }

            var point = this;
            var lastPoint = penpoints[penpoints.length - 2];

            var sectors = sectorMap.getSectorWithNeighbours(point, settings.sectorNeighbours);

            sectors.forEach(function (sector) {

                if (point.collision) { return; }

                for (var i = 0; i < sector.length - 1; i += step) {

                    var pointCompare1 = sector[i];

                    if (penpoints.length - pointCompare1.index > 6 + step) {

                        var pointCompare2 = penpoints[pointCompare1.index + step];

                        if (point.isStartPoint || pointCompare1.isStartPoint || pointCompare2.isStartPoint) {
                            continue;
                        }

                        var collision = linePartIntersect(lastPoint, point, pointCompare1, pointCompare2);

                        if (collision == true) {

                            point.collision = true;

                            var collisionPoint = lineIntersect(
                                lastPoint, getNormalizedDirectionVector(lastPoint, point),
                                pointCompare1, getNormalizedDirectionVector(pointCompare1, pointCompare2));



                            return;
                        }
                    }
                }
            });


        }

    }

    /**
     * Calculates the distance between this point and the last one. 
     */
    calcDistance() {
        this.distance = 0;
        if (penpoints.length > 2) {
            this.distance = Math.sqrt(Math.pow(this.x - penpoints[penpoints.length - 2].x, 2)
                + Math.pow(this.y - penpoints[penpoints.length - 2].y, 2));
            this.distance = this.distance * (28.5 / 3000);
        }
    }

    /**
     * Calculates the curvature for this point. For that two lines are created and the angle between them is calculated.
     */
    calcCurvature() {

        /**
         * How far we "walk" back along the stroke to get our two other points to create the two lines
         */
        var distanceToReach = settings.curvatureDistance;

        var distanceReached = 0;
        var index = penpoints.length - 1;
        /**
         * The index of the points.
         * index1 is the middle point that is used for both lines.
         * index2 is the other point for the second line.
         * the "first" index is our current point, which creates a line between it and the index1 point 
         */
        var index1 = -1, index2 = -1;

        /**
         * walk through the previous pen points until we have reached our desired distance. Once we hit a the beginning of a stroke, we stop the search.
         */
        for (var index = penpoints.length - 1; index >= 0; index--) {
            var point = penpoints[index];
            if(point.isStartPoint){
                break;
            }
            distanceReached += point.distance;
            if (distanceReached > distanceToReach && index1 == -1) {
                index1 = index;
                distanceReached = 0;
            } else if (distanceReached > distanceToReach && index2 == -1 && index1 != -1) {
                index2 = index;
                index = 0;
            }
        }

        /**
         * Did we found all points to create our two lines?
         * If so, we calculate the two lines. Then we normalize them and create the curvature value of it
         * by acos(xT * y / ||x|| * ||y||)  
         * We then create the midpoints of the two lines. Then we create the orthognal vetors on thie midpoints and their intersection point, which gives us the center of the circle which would be drawn with the current curvature.
         */
        if (index1 != -1 && index2 != -1) {

            anglePoint1 = penpoints[index2];
            anglePoint2 = penpoints[index1];
            anglePoint3 = this;

            vector1 = new Vector(anglePoint1.x - anglePoint2.x, anglePoint1.y - anglePoint2.y);
            vector2 = new Vector(anglePoint2.x - anglePoint3.x, anglePoint2.y - anglePoint3.y);

            vector1N = normalize(vector1);
            vector2N = normalize(vector2);

            vector1MiddlePoint = new Vector(anglePoint1.x - (vector1.x * 0.5), anglePoint1.y - (vector1.y * 0.5));
            vector2MiddlePoint = new Vector(anglePoint2.x - (vector2.x * 0.5), anglePoint2.y - (vector2.y * 0.5));


            vector1Ortho = new Vector(-vector1N.y, vector1N.x);
            vector2Ortho = new Vector(-vector2N.y, vector2N.x);

            var product = vector1N.x * vector2N.x + vector1N.y * vector2N.y;

            circleCenter = lineIntersect(
                vector1MiddlePoint,
                new Vector(0 + vector1Ortho.x * 10, 0 + vector1Ortho.y * 10),
                vector2MiddlePoint,
                new Vector(0 + vector2Ortho.x * 10, 0 + vector2Ortho.y * 10));

            this.curvature = Math.acos(product);
            this.curvatureDegrees = Math.floor(this.curvature * 360 / Math.PI);
            circleRadius = Math.sqrt(Math.pow(circleCenter.x - vector1MiddlePoint.x, 2)
                + Math.pow(circleCenter.y - vector1MiddlePoint.y, 2));

        }


    }
}

/**
 * Contains the settings for debugging output, the current handler and some other properties. 
 */
var settings = new Settings();

/**
 * This list contains all points that were drawn to the canvas. is emptied when settings.reset() is called.
 */
var penpoints = [];

/**
 * The are used in the curvature calculation in the PenPoint
 */
var anglePoint1, anglePoint2, anglePoint3,
    vector1, vector2, vector1N, vector2N,
    vector1MiddlePoint, vector2MiddlePoint,
    vector1Ortho, vector2Ortho,
    circleCenter, circleRadius;

/**
 * This list contains each instance of a handler. This list is made available in the GUI so the user can change
 * between the handlers. Use addHandlerInstance() to add a handler instance to this list.
 */
var handlerList = [];

/**
 * When you created a Handler implementation by extending the HandlerBaseClass, create an instance of it and add it to this function. Then it can be used by the user.
 * @param {} handler 
 */
function addHandlerInstance(handler) {
    handlerList.push(handler);
}

class HandlerBaseClass {

    /**
     * 
     * @param {*} id The id has to be unique. It is also be displayed in the gui for choosing the current handler.
     */
    constructor(id) {
        /**
         * unique string for identifing the handler.
         */
        this.id = id;
        this.listImagesProbing = [];
        this.listImagesDrawing = [];
    }

    addImage(path, x, y, width, height, type) {

        var img = document.createElement("img");
        img.src = path;
        img.setAttribute("src", path);
        img.setAttribute("width", width / 2);
        img.setAttribute("height", height / 2);
        img.style.position = "absolute";
        img.style.left = x + "px";
        img.style.top = y + "px";
        img.style.zIndex = 499;
        // img.style.display = 'none';

        document.body.appendChild(img);

        var thisHandler = this;

        setTimeout(function () {
            var canvasImg = document.createElement('canvas');
            canvasImg.getContext('2d').scale(1, 1);
            canvasImg.width = 3000;
            canvasImg.height = 2000;
            canvasImg.getContext('2d').drawImage(img, x, y, img.width * 2, img.height * 2);

            var imageContainer = new ImageProbe(img, canvasImg, path, thisHandler.listImagesProbing, 0, x, y, width, height);

            switch (type) {
                case "probing":
                    thisHandler.listImagesProbing.push(imageContainer);
                    imageContainer.index = thisHandler.listImagesProbing.length - 1;
                    break;
                case "drawing":
                    thisHandler.listImagesDrawing.push(imageContainer);
                    imageContainer.index = thisHandler.listImagesDrawing.length - 1;
                    break;
            }

            img.style.zIndex = -400;
        }, 100);

    }

    startSynth() { }

    quitSynths() { }

    update(penpoints, newPoint, lastPoint) { }

    stopSounds() { }

    drawStatic(width, height, c) {

        for (; indexDrawing < penpoints.length && penpoints.length > 1; indexDrawing++) {

            var point = penpoints[indexDrawing];

            if (point.isStartPoint) {
                continue;
            }

            var pointLast = penpoints[indexDrawing - 1];

            cStatic.lineWidth = 2;
            cStatic.strokeStyle = "rgba(40,40,40," + point.pressure + ")";

            cStatic.beginPath();
            cStatic.moveTo(point.x, point.y);
            cStatic.lineTo(pointLast.x, pointLast.y);
            cStatic.stroke();
        }

    }

    drawRefresh(width, height, c) {

        for (var i = 0; i < this.listImagesDrawing.length; i++) {
            var image = this.listImagesDrawing[i];
            c.drawImage(image.canvas, 0, 0, image.canvas.width / 2, image.canvas.height / 2);
        }


        if (settings.showGrid) {
            c.strokeStyle = "rgba(100,0,0,0.3)";
            c.lineWidth = 1;

            for (var i = 0; i < 3000; i += 80) {
                c.beginPath();
                c.moveTo(i, 0);
                c.lineTo(i, 3000);
                c.stroke();
                c.beginPath();
                c.moveTo(0, i);
                c.lineTo(3000, i);
                c.stroke();
            }
        }




        if (settings.showCollision) {


            c.fillStyle = "rgba(255,100,100,1)";
            for (var i = 0; i < penpoints.length && penpoints.length > 1; i++) {
                var point = penpoints[i];
                if (point.collision) {
                    for (var j = 0; j < point.collisionPoints.length; j++) {
                        var size = 8;
                        c.fillRect(point.collisionPoints[j].x - (size / 2), point.collisionPoints[j].y - (size / 2), (size), (size));
                    }
                }


                if (i == penpoints.length - 1) {

                    var xMin = Math.floor(Math.min(point.x, point.lastPoint.x));
                    var xMax = Math.ceil(Math.max(point.x, point.lastPoint.x));

                    var yMin = Math.floor(Math.min(point.y, point.lastPoint.y));
                    var yMax = Math.ceil(Math.max(point.y, point.lastPoint.y));

                    var width = Math.max(xMax - xMin, 1);
                    var height = Math.max(yMax - yMin, 1);

                    var currentPoint = new Vector(point.x - xMin, point.y - yMin);
                    var lastPoint = new Vector(point.lastPoint.x - xMin, point.lastPoint.y - yMin);

                    var points = calcStraightLine(lastPoint, currentPoint);

                    c.fillStyle = "rgba(255,0,255,1)";
                    c.fillRect(xMin, yMin, width, height);

                    // c.fillStyle = "rgba(0,0,255,1)";

                    var imageData = cUsage.getImageData(xMin, yMin, width, height);

                    for (var x = 0; x < width; x++) {
                        for (var y = 0; y < height; y++) {
                            var pixel = getPixelFromImageData(imageData, x, y, width, 1);
                            c.fillStyle = "rgba(" + pixel.r + "," + pixel.g + "," + pixel.b + ",1)";
                            c.fillRect(x, y, 1, 1);
                        }
                    }

                }


            }
        }

        if (settings.showCurvatureLines) {

            this.lineLength = circleRadius + 100;
            c.fillStyle = "rgba(25,25,25,0.8)";

            c.strokeStyle = "rgba(280,80,80,1)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(anglePoint1.x - (vector1N.x * this.lineLength), anglePoint1.y - (vector1N.y * this.lineLength));
            c.lineTo(anglePoint1.x + (vector1N.x * this.lineLength), anglePoint1.y + (vector1N.y * this.lineLength));
            c.stroke();
            c.strokeStyle = "rgba(80,240,80,1)";
            c.beginPath();
            c.moveTo(anglePoint2.x - (vector2N.x * this.lineLength), anglePoint2.y - (vector2N.y * this.lineLength));
            c.lineTo(anglePoint2.x + (vector2N.x * this.lineLength), anglePoint2.y + (vector2N.y * this.lineLength));
            c.stroke();

            c.strokeStyle = "rgba(80,80,240,0.5)";
            c.fillRect(anglePoint1.x, anglePoint1.y, 5, 5);
            c.fillRect(anglePoint2.x, anglePoint2.y, 5, 5);
            c.fillRect(anglePoint3.x, anglePoint3.y, 5, 5);

            // Midtpoints of the two vectors
            c.strokeStyle = "rgba(80,220,240,0.5)";
            c.fillRect(vector1MiddlePoint.x, vector1MiddlePoint.y, 7, 7);
            c.fillRect(vector2MiddlePoint.x, vector2MiddlePoint.y, 7, 7);

            // 90 degrees rotated vector starting from the middle points
            c.strokeStyle = "rgba(240,40,80,0.2)";
            c.beginPath();
            c.moveTo(vector1MiddlePoint.x - (vector1Ortho.x * this.lineLength), vector1MiddlePoint.y - (vector1Ortho.y * this.lineLength));
            c.lineTo(vector1MiddlePoint.x + (vector1Ortho.x * this.lineLength), vector1MiddlePoint.y + (vector1Ortho.y * this.lineLength));
            c.stroke();

            c.strokeStyle = "rgba(80,240,80,0.2)";
            c.beginPath();
            c.moveTo(vector2MiddlePoint.x - (vector2Ortho.x * this.lineLength), vector2MiddlePoint.y - (vector2Ortho.y * this.lineLength));
            c.lineTo(vector2MiddlePoint.x + (vector2Ortho.x * this.lineLength), vector2MiddlePoint.y + (vector2Ortho.y * this.lineLength));
            c.stroke();

            c.fillRect(circleCenter.x - 2, circleCenter.y - 2, 4, 4);

        }


        if (settings.showCurvatureCircle && !(typeof circleCenter === "undefined")) {
            c.strokeStyle = "rgba(0,0,0,1.05)";
            c.fillStyle = "rgba(0,0,0,1.05)";
            c.beginPath();
            c.arc(circleCenter.x, circleCenter.y, circleRadius, 0, 2 * Math.PI);
            c.stroke();

            var angle = penpoints[penpoints.length - 1].curvature;

            this.angleS = this.angleS * 0.95 + angle * 0.05;

            var str = "Angle: " + (Math.floor(angle * 360 / Math.PI)).toString();
            c.font = "30px Arial";
            c.fillText(str, penpoints[penpoints.length - 1].x + 30, penpoints[penpoints.length - 1].y + 30);


        }


    }

}