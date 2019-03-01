

class Image {
    constructor(img,canvas, path, list, index,x,y,width,height) {
        this.img = img;
        this.canvas=canvas;
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

class PenPoint {
    constructor(x, y, pressure, tiltX, tiltY, timestamp, timestep, isStartPoint) {

        penpoints.push(this);
        this.index = penpoints.length - 1;
        this.lastPoint = this.index > 0 ? penpoints[this.index - 1] : null;
        this.isStartPoint = isStartPoint;
        this.x = x;
        this.y = y;
        this.collisionPoints=[];
        this.imageCollisionPoints=[];
        this.closestImageDistance=10000;

        sectorMap.pushObject(this);

        this.pressure = pressure;
        this.tiltX = tiltX;
        this.tiltY = tiltY;
        this.timestamp = timestamp;
        this.timestep = timestep;
        this.curvature = 0;
        this.curvatureDegrees = 0;
        this.collision = false;


        this.collisionX = 0;
        this.collisionY = 0;
        this.calcDistance();
        this.calcCurvature();
        this.calcCollision();

        this.speed = isStartPoint ? 0 : this.distance / 0.03;
    }
 
    calcCollision() {

          /**
             * Calculate collision via the already drawn areas.
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

            var points = calcStraightLine(lastPoint,currentPoint );

            var imageData = cUsage.getImageData(xMin, yMin, width, height);

            for (var i = 0; i < points.length; i++) {

                var pixelCoord = points[i];
                var pixel = getPixelFromImageData(imageData, pixelCoord.x, pixelCoord.y, 1, 1);

                pixelCoord.x += xMin;
                pixelCoord.y += yMin;

                points[i] = pixelCoord;
                
                if (pixel.r != 0
                    || pixel.g != 0
                    || pixel.b != 0
                    || pixel.a != 0) {

                    this.collisionPoints.push(pixelCoord);
                    this.collision = true;
                    this.collisionX = this.x;
                    this.collisionY = this.y;
                }
            }

            for (var j = 0; j < activeHandler.listImages.length; j++) {

                var image = activeHandler.listImages[j];

                for (var i = points.length-1; i < points.length; i++) {
                    var pixelCoord = points[i];
                    var localPosition = new Vector(pixelCoord.x + xMin, pixelCoord.y + yMin);
                    imageData = image.c.getImageData(localPosition.x, localPosition.y, 1, 1);
                    var pixel = getPixelFromImageData(imageData, 0, 0, 1, 1);

                    if (pixel.r != 0
                        || pixel.g != 0
                        || pixel.b != 0
                        || pixel.a != 0) {
                            this.imageCollisionPoints.push((pixel.r+pixel.g+pixel.b) / 3);
                      }
                } 
            
            }
        }

        /**
         * collision via distance to the other penpoints.
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
         * Collision with line intersection
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

                            point.collisionX = collisionPoint.x;
                            point.collisionY = collisionPoint.y;


                            return;
                        }
                    }
                }
            });


        }

    }

    calcDistance() {
        this.distance = 0;
        if (penpoints.length > 2) {
            this.distance = Math.sqrt(Math.pow(this.x - penpoints[penpoints.length - 2].x, 2)
                + Math.pow(this.y - penpoints[penpoints.length - 2].y, 2));
            this.distance = this.distance * (28.5 / 3000);
        }
    }

    calcCurvature() {

        var distanceToReach = settings.curvatureDistance;

        var distanceReached = 0;
        var index = penpoints.length - 1;
        var index1 = -1, index2 = -1;

        for (var index = penpoints.length - 1; index >= 0; index--) {
            var point = penpoints[index];
            distanceReached += point.distance;
            if (distanceReached > distanceToReach && index1 == -1) {
                index1 = index;
                distanceReached = 0;
            } else if (distanceReached > distanceToReach && index2 == -1 && index1 != -1) {
                index2 = index;
                index = 0;
            }
        }

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


var anglePoint1, anglePoint2, anglePoint3;
var vector1, vector2,
    vector1N, vector2N,
    vector1MiddlePoint, vector2MiddlePoint,
    vector1Ortho, vector2Ortho,
    circleCenter,
    circleRadius;


class HandlerBaseClass {

    constructor() {
        this.listImages= [];
    }

    addImage (path, x, y,width,height) {

        
        var  img = document.createElement("img"); 
        img.src=path;
        img.setAttribute("src", path);
        img.setAttribute("width", width/2);
        img.setAttribute("height", height/2); 
        img.style.position = "absolute";
        img.style.left = x + "px";
        img.style.top = y + "px";
        img.style.zIndex=499;
        // img.style.display = 'none';
        
        document.body.appendChild(img);

        var thisHandler = this;
       
        setTimeout(function(){
            var canvasImg = document.createElement('canvas');
            canvasImg.getContext('2d').scale(1, 1);
            canvasImg.width = 3000;
            canvasImg.height = 2000;
            canvasImg.getContext('2d').drawImage(img, x, y, img.width*2,img.height*2);
            var imageContainer = new Image(img,canvasImg,path,thisHandler.listImages,0,x, y,width,height );
            thisHandler.listImages.push(imageContainer);
            imageContainer.index = thisHandler.listImages.length -1;
    
            
            img.style.zIndex=-400;
        }, 1100);

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

            // if(indexDrawing % 12 == 0){
            //  cStatic.fillStyle = "rgba(25,0,25,0.3)";
            // c.fillRect(point.x-3,point.y-3,6,6);
            // }
        }

    }

    drawRefresh(width, height, c) {

        if (settings.showGrid) {
            c.strokeStyle = "rgba(100,0,0,0.3)";
            c.lineWidth = 1;

            for (var i = 0; i < 3000; i += sectorMap.resolution) {
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

        if (settings.showCollisionDebug) {

            c.fillStyle = "rgba(0,0,255,0.3)";

            var key = sectorMap.getKey(penpoints[penpoints.length - 1]);

            var neighbourSize = settings.sectorNeighbours;

            c.fillRect(
                key[0] * sectorMap.resolution - (neighbourSize * sectorMap.resolution),
                key[1] * sectorMap.resolution - (neighbourSize * sectorMap.resolution),
                sectorMap.resolution * (1 + 2 * neighbourSize),
                sectorMap.resolution * (1 + 2 * neighbourSize));


            var sectors = sectorMap.getSectorWithNeighbours(penpoints[penpoints.length - 1], neighbourSize);

            var pointCount = 0;

            sectors.forEach(function (sector) {

                pointCount += sector.length;

                for (var i = 0; i < sector.length - 1; i++) {

                    var pointCompare1 = sector[i];

                    c.fillRect(pointCompare1.x - 3, pointCompare1.y - 3, 6, 6);

                }
            });

            var str = "Points: " + (pointCount).toString();
            c.font = "30px Arial";
            c.fillText(str, key[0] * sectorMap.resolution - (neighbourSize * sectorMap.resolution),
                key[1] * sectorMap.resolution - (neighbourSize * sectorMap.resolution));


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


class HandlerPenSonification extends HandlerBaseClass {

    constructor() {
        super();
        this.sinnode_id = 1234;
        this.collisionCounter = 0;
        // this.addImage("images/test1.png",0,0,3000,2000); 
    }

    stopSounds() {
        port.send({
            address: "/n_set",
            args: [this.sinnode_id, "amp", 0]
        });
    }

    quitSynths() {
        port.send({
            address: "/n_free",
            args: [this.sinnode_id]
        });
    }

    startSynth() {
        port.send({
            address: "/s_new",
            args: ["noise", this.sinnode_id, 1, 0, "amp", 0]
        });
    }

    update(penpoints, newPoint, lastPoint) {
        if (lastPoint.speed != newPoint.speed) {

            var amp = linlin(newPoint.speed, 0, 50, 0, 1);

            if (newPoint.collision) {
                this.collisionCounter = 2;
            } else {
                this.collisionCounter--;
            }

            if (this.collisionCounter > 0) {
                amp = 2;
            }

            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", false ? newPoint.speed * 40 : 130]
            });
        }
    }



}

class HandlerCurvatureSonifcation extends HandlerBaseClass {

    constructor() {
        super();
        this.sinnode_id = 1235;
        this.angleS = 0;    
        this.addImage("images/test1.png",0,0,3000,2000); 
    }

    drawRefresh(width, height, c) {
        HandlerBaseClass.prototype.drawRefresh(width, height, c);

        c.strokeStyle = "rgba(0,0,0,1.0)";
        c.beginPath();
        c.arc(canvas.width / 4, canvas.height / 4, 150, 0, 2 * Math.PI);
        c.stroke();

    }

    stopSounds() {
        port.send({
            address: "/n_set",
            args: [this.sinnode_id, "amp", 0]
        });
    }

    quitSynths() {
        port.send({
            address: "/n_free",
            args: [this.sinnode_id]
        });
    }

    startSynth() {
        port.send({
            address: "/s_new",
            args: ["sin", this.sinnode_id, 0, 0, "amp", 0]
        });
    }

    update(penpoints, newPoint, lastPoint) {

        var angleDegree = (Math.floor(newPoint.curvature * 360 / Math.PI));

        if (isNaN(angleDegree)) {
            angleDegree = 0;
        }

        var amp = linlin(newPoint.pressure * newPoint.speed, 0, 20, 0, 1);

        if(newPoint.imageCollisionPoints.length>0){
            amp += linlin(newPoint.imageCollisionPoints[0],0,255,0,1);
        }

        if (lastPoint.speed != newPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", angleDegree + 200]
            });
        }
    }

}