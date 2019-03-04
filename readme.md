# Sonification of a digital pen on a screen.

This project is a base for creating sonifications of pen input in the browser.

It currently supports Edge and Chrome with a surface pen.

For Chrome, the website needs to run on a http server (can be a local one), otherwise the getImageData() from a canvas throws a security exception.

## How to Start the project

1. Start a node.js server for the nodejs/index.js file. This listens to an websocket port (8080 by default) on your local machine and relays the messages (that are send from the website in the "web" folder) forwad to an udp adress (where the supercollider project listens to). You can change the adresses/ports in the index.js file.

2. Start a supercollider server and start the SynthDef in the supercollider/sonipen_supercollider.scd file

3. Open the web/sonipen.html and have fun! You can change between different sonifications by changing the handlerType in the GUI to the top right or by pressing the 1...n numpad keys.

## How To build your own Sonification

### Javascript

There is one class that handles the sonification, named HandlerBaseClass. Extend this class and implement your own sonification in the web/scripts/implementations.js file. You then have to create an instance of the class give it over to the addHandlerInstance() method. This is nessessary to have the sonification available on website.

There are multiply examples available in the implementations.js and the variables and methods of the HandlerBaseClass are well documented, so you can get an idea how it works, especially how to handle the synthesizers through sending osc messages. The HandlerPenSonification is documentated in detail for that.

All other classes and method that must/can be used are in the init.js, so taking a look there can help a lot.

The internal-controller.js takes care of all the initializing, event and drawing stuff, you don't have to do anything with this file.

### Supercollider

For your own Synthesizer you need to add them to your running supercollider server. For that you can have a look at the supercollider/sonipen_supercollider.scd for examples, modify these examples our create your own ones. :)

## Extend the functionality

Of course you can have a look at the init.js and internal-controller.js and extend the code if you need more functionality. :) Especially the PenPoint class in the init.js can be important, as it handles and generated all the informations related to the movement of the pen.

## Know Issues

- There have to be a better implementation for the scaling of alle the canvas/images. For now it works on a SurfaceBook, when you give all images the same resolution as the display. But that's only implemented as a workaround. I have to make an implementation that handles the scaling of the canvas and images correctly, without the need of the workarounds (because for example the pixel coordinates in the canvas are the resolution of the display divided by half, the images are the full resolution, so I have to convert it by multiply the coordinates by two) 
- Some documentation is still missing
