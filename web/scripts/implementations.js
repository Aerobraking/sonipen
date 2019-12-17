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

        var pan = linlin(lastPoint.x,0,3000,-1,1);

        this.speedSmoothed = this.speedSmoothed * 0.4 + newPoint.speed * 0.6;
        lineValueCompare.append(new Date().getTime(), this.speedSmoothed);

        /**
         * Mache den sound lauter je schneller der stift sich bewegt und je größer die pressure ist.
         */
        var amp = newPoint.pressure;
        amp *= 0.4 * (Math.max(Math.min(Math.pow(this.speedSmoothed / 5, 2), 1) - 0, 0));

        /**
         * Verändere die low pass filter frequenz anhand der geschwindigkeit
         */
        var freqLowPass = midicps(linlin(this.speedSmoothed, 0, 50, 69 + 20, 105 + 20));

        /**
         * Verändere die geschwindigkeit des abspielens des buffers anhand der geschwindigkeit
         */
        var rate = linlin(this.speedSmoothed, 0, 50, 0.5, 1.5);

        /**
         * verringere frequenz wenn man über bereits gemalten bereich malt.
         */
        if (newPoint.collision) {
            freqLowPass /= 2;
        }

        if (newPoint.speed != lastPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", freqLowPass, "rate", rate,"pan", pan]
            });
        }

    }

}

class HandlerGuiding extends HandlerBaseClass {

    constructor() {
        super("guiding");
        this.sinnode_id = 1762;
        this.angleS = 0;
        this.curvatureSmoothed = 0;
        this.speedSmoothed = 0;
        this.addImageFitToCenter("images/guiding_drawing.png",  3000, 2000, "drawing");
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

        /**
         * Smoothe die curvature etwas und mach die frequenz höher je größer die curvature ist (also je kleiner der kreis 
         * ist den sie beschreibt)
         */
        var angleDegree = (Math.floor(newPoint.curvature * 360 / Math.PI));

        if (isNaN(angleDegree)) {
            angleDegree = 0;
        }

        this.curvatureSmoothed = this.curvatureSmoothed*0.7 + angleDegree* 0.3  ;
        
     
     
        /**
        * Smoothe den speed. Mache den sound lauter je schneller der stift sich bewegt und je größer die pressure ist.
        */
        this.speedSmoothed = this.speedSmoothed*0.7 + newPoint.speed * 0.3;
        var amp = newPoint.pressure; 
        amp *= (Math.min(Math.pow(this.speedSmoothed, 2), 1));

         
        if (lastPoint.speed != newPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", this.curvatureSmoothed + 200]
            });
        }
    }
}

class HandlerAwareness extends HandlerBaseClass {

    constructor() {
        super("awareness");
        this.sinnode_id = 1235;
        this.angleS = 0;
        this.addImageFitToCenter("images/awareness_drawing.png", 3000,2000, "drawing");
        this.addImageFitToCenter("images/awareness_probing.png", 3000,2000, "probing");
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

            // amp *= (Math.min(Math.pow(newPoint.speed, 1), 1));

            var speed = linlin(newPoint.speed, 0, 50, 0.1, 1);

            /**
            * Mache den Ton aus wenn es rot ist
            */
            for(var i = 0; i<newPoint.imageCollisionPoints.length; i++){
                if (newPoint.imageCollisionPoints[i].r > 100 && newPoint.imageCollisionPoints[i].g < 100) {
                    amp = 0;
                    break;
                }
            }

                
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
            args: ["template", this.sinnode_id, 0, 0, "amp", 0]
        });
    }

    update(listPoints, newPoint, lastPoint) {

        var amp = dbamp(linlin(newPoint.imageCollisionPoints[0].r, 0, 255, -50,-20));
        if (amp<dbamp(-49)){
            amp = 0;
        }

        var freq = 200;

        if (newPoint.imageCollisionPoints.length > 0) {
           /**
            * Mache frequenz kleiner wenn das bild heller wird.
            */
            freq+= linlin(newPoint.imageCollisionPoints[0].r, 0, 255, 0, 1)**2*200; 
        }

        if (lastPoint.speed != newPoint.speed) {
            port.send({
                address: "/n_set",
                args: [this.sinnode_id, "amp", amp, "freq", freq]
            });
        }
    }

}

addHandlerInstance(new HandlerPenSonification());
addHandlerInstance(new HandlerGuiding());
addHandlerInstance(new HandlerAwareness());
addHandlerInstance(new HandlerTemplate());