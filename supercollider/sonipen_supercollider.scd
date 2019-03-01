

(
SynthDef( \sin,	{ | amp = 0, freq = 1000, trig = 1 |
	var sig;
	sig = LFTri.ar( [ freq, freq * 0.999 ], 0.0, amp );
	Out.ar( [ 0 ], sig * 0.6 );
}).add;
)



// Simple noise sound
(
SynthDef(\noise, { | amp = 0, freq = 100 |
	var sinus = HPF.ar(PinkNoise.ar(1),300,amp);
	"Hello".postln;
	Out.ar( [ 0 ],sinus  );
}).add;
)


phasor


s.freeAll()




// allocate a buffer with a sound file
b = Buffer.read(s, Platform.resourceDir +/+ "sounds/a11wlk01.wav");

// simple playback (more examples: see BufRd)
// Start and end here are defined as 0 and the number of frames in the buffer.
// This means that the Phasor will output values from 0 to numFrames - 1 before looping,
// which is perfect for driving BufRd. (See note above)
{ BufRd.ar(1, b.bufnum, Phasor.ar(0, BufRateScale.kr(b.bufnum), 0, BufFrames.kr(b.bufnum))) }.play;


// two phasors control two sound file positions: mouse y controls resetPos of the second
(
{ var trig, rate, framesInBuffer;
    rate = MouseX.kr(0.1, 100, 1);
    trig = Impulse.ar(rate);
    framesInBuffer = BufFrames.kr(b.bufnum);
    x = Phasor.ar(trig, BufRateScale.kr(b.bufnum), 0, framesInBuffer,
        [0, MouseY.kr(0, framesInBuffer)]);
    BufRd.ar(1, b.bufnum, x);
}.play;
)