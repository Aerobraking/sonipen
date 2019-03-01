
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
    //u =     (as.y * bd.x + bd.y * bs.x - bs.y * bd.x - bd.y * as.x) / (ad.x * bd.y - ad.y * bd.x);
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
        this.showCollisionDebug = false;
        this.showCollision = false;
        this.showCurvatureCircle = false;
        this.showCurvatureLines = false;
        this.curvatureDistance = 1.2;
        this.showGrid = false;
        this.sectorMapRes = 80;
        this.sectorNeighbours = 1;
        this.handlerType = 'curvature';
        this.reset = function (){
            
        };
        this.showImages=false;
    }
}

settingsSaved = read_cookie("settings");
var settings = settingsSaved == null ? new Settings() : settingsSaved;
