/**
 * Use this file to implement your Handlers.
 * To actually be able to use the handler, you have to create an instance and add it to the handler list. Example:
    addHandlerInstance(new HandlerPenSonification());
 */

class HandlerPenSonification extends HandlerBaseClass {

    constructor() {
        super("sonification");
        this.sinnode_id = 1234;
        this.speedSmoothed = 0;
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
            args: ["pen", this.sinnode_id, 1, 0, "amp", 0]
        });
    }

    update(listPoints, newPoint, lastPoint) {
        if (newPoint.speed > 0) {


            var amp = newPoint.pressure;

            this.speedSmoothed = this.speedSmoothed*0.4 + newPoint.speed * 0.6;
        
            amp *= (Math.min(Math.pow(this.speedSmoothed, 2), 1));

            var speed = linlin(this.speedSmoothed, 0, 50, 0.1, 1);
            var rate = linlin(this.speedSmoothed, 0, 50, 0.8, 1.3);

            console.log(amp);
            
            if (newPoint.speed != lastPoint.speed) {
                port.send({
                    address: "/n_set",
                    args: [this.sinnode_id, "amp", amp, "freq", 600+ 0.3 * 2300 ,
                        "speed", speed, "rate", 1]
                });
            }
        } else {

            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", 0]
            });
        }
    }

}

class HandlerGuiding extends HandlerBaseClass {

    constructor() {
        super("guiding");
        this.sinnode_id = 1762;
        this.angleS = 0;
        this.addImage("images/guiding_drawing.png", 0, 0, 3000, 2000, "drawing");
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
            args: ["guiding", this.sinnode_id, 0, 0, "amp", 0]
        });
    }

    update(listPoints, newPoint, lastPoint) {

        var angleDegree = (Math.floor(newPoint.curvature * 360 / Math.PI));

        if (isNaN(angleDegree)) {
            angleDegree = 0;
        }

        var amp = linlin(newPoint.pressure * newPoint.speed, 0, 20, 0, 1);

        if (newPoint.imageCollisionPoints.length > 0) {
            amp += linlin(newPoint.imageCollisionPoints[0], 0, 255, 0, 1);
        }

        if (lastPoint.speed != newPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", angleDegree + 200]
            });
        }
    }
}

class HandlerAwareness extends HandlerBaseClass {

    constructor() {
        super("awareness");
        this.sinnode_id = 1235;
        this.angleS = 0;
        this.addImage("images/awareness_drawing.png", 0, 0, 3000, 2000, "drawing");
        this.addImage("images/awareness_probing.png", 0, 0, 3000, 2000, "probing");
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
            args: ["pen", this.sinnode_id, 1, 0, "amp", 0]
        });
    }

    update(listPoints, newPoint, lastPoint) {
        if (newPoint.speed > 0) {


            var amp = newPoint.pressure;

            amp *= (Math.min(Math.pow(newPoint.speed, 1), 1));

            var speed = linlin(newPoint.speed, 0, 50, 0.1, 1);

            /**
            * Je dunkler, desto höher die frequenz. Wenn es rot ist, dann wird es silent.
            */
           
            // speed += 1.3 * linlin(newPoint.imageCollisionPoints[0].r, 255, 0, 0, 1);
            var found = false;
            for(var i = 0; i<newPoint.imageCollisionPoints.length; i++){
                if (newPoint.imageCollisionPoints[i].r > 100 && newPoint.imageCollisionPoints[i].g < 100) {
                    speed *= 3;
                    amp = 0;
                    // console.log(newPoint.imageCollisionPoints);
                    found = true;
                    break;
                }
            }

            if(!found){
                // for(var i = 0; i<newPoint.imageCollisionPoints.length; i++){
                //    console.log("roter farbwert: "+newPoint.imageCollisionPoints[i].r);
                // } 
            }
               
            // console.log(amp + "found: "+ found + " collisionpoints: "+newPoint.imageCollisionPoints.length);
                
            if (newPoint.speed != lastPoint.speed) {
                port.send({
                    address: "/n_set",
                    args: [this.sinnode_id, "amp", amp, "freq", true ? speed * 13000 : 2600,
                        "speed", speed, "rate", 1]
                });
            }
        } else {

            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", 0]
            });
        }
    }

}

class HandlerTemplate extends HandlerBaseClass {

    constructor() {
        super("template");
        this.sinnode_id = 4123;
        this.addImage("images/template_probing.png", 0, 0, 3000, 2000, "probing");
        this.addImage("images/template_drawing.png", 0, 0, 3000, 2000, "drawing");
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

    update(listPoints, newPoint, lastPoint) {

        var amp = linlin(newPoint.pressure, 0, 20, 0, 1);

        if (newPoint.imageCollisionPoints.length > 0) {
            amp += linlin(newPoint.imageCollisionPoints[0].r, 0, 255, 1, 0);
        }

        if (lastPoint.speed != newPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", 800]
            });
        }
    }

}

addHandlerInstance(new HandlerPenSonification());
addHandlerInstance(new HandlerGuiding());
addHandlerInstance(new HandlerAwareness());
addHandlerInstance(new HandlerTemplate());