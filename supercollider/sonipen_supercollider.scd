
/*
.ar ist für Sachen die man hört
.kr macht das gleiche, ist aber weniger rechenaufwändig und sollte für zwischenberechnungen genutzt werden die dann letztendlich das höhrende erzeugen

STRG + D um Dokumentation zu öffnen für Selektion

// Frequens Fenster starten
FreqScope.new(400);

*/



(

/**
When the autmatic relative path creation doesn't work, you have to
set the absolute paths manually here.
*/
var soundfile = PathName(thisProcess.nowExecutingPath).pathOnly ++ "sounds/bleistift.wav";

// allocate a buffer with a sound file
b = Buffer.read(s,soundfile);


SynthDef( \pen, { | out=0, amp=1, freq=100, rate=1, lg=0.05, pan=0 |
	var output,framesInBuffer;

	/*
	der letzte frame des Samples wird als end Wert genutzt im Phasor,
	der damit also bis zum ende des Samples abspielt
	*/
	framesInBuffer = BufFrames.kr(b.bufnum);


	/*
	trig: wenn 0, dann wird wieder von vorne angefangen abzuspielen
	rate: wie schnell es abgespielt wird, 1 ist normal schnell.
	start: Wo soll gestartet werden im sample
	end: wo soll aufgehört werden im sample
	resetPos: Custom startpunkt für den trigger, also wenn man nicht bei 0 starten will sondern an punkt X
	*/
    x = Phasor.ar(0,rate, 0, framesInBuffer,0);

	output = BufRd.ar(1, b.bufnum, x);

	//output = WhiteNoise.ar(1);

/*
	output=
	BPF.ar(BufRd.ar(1, b.bufnum, x), 158, 0.11,0.3)
	+BPF.ar(BufRd.ar(1, b.bufnum, x), 600, 0.08,3.8)
	+BPF.ar(BufRd.ar(1, b.bufnum, x), 8000, 0.01,0.00001)
	+BPF.ar(BufRd.ar(1, b.bufnum, x), 12000, 0.04,0.000002)
	+BPF.ar(BufRd.ar(1, b.bufnum, x), 16000, 0.04,0.000002);
*/

	output = LPF.ar(output, freq.lag(lg), amp);


	Out.ar( out, Pan2.ar(output, pan));
}).add;

SynthDef( \guiding,	{ | amp = 0, freq = 1000|
	var sig;
	sig = LFTri.ar( [ freq, freq * 0.999 ], 0.0,  amp );
	Out.ar( [ 0 ], sig * 0.6 );
}).add;

SynthDef( \template,	{ | amp = 0, freq = 1000, trig = 1 |
	var sig;
	sig = LFTri.ar( [ freq, freq * 0.999 ], 0.0,  amp );
	Out.ar( [ 0 ], sig * 0.6 );
}).add;
)



s.freeAll()

