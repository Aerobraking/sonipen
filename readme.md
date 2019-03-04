# Sonification of a digital pen on a screen.

Hey there,

this project is a base for creating sonifications of pen input in the browser.

It currently only supports the Edge Browser with a surface pen.

 To use the project you have to do the following:

1. Start a nodejs server with the nodejs/index.js. This listens to an websocket port on your local machine and relays the messages (that are send from the website in the "web" folder) forwad to an udp adress (where the supercollider project listens to). 

2. 


To start everything:

- start the "sin" Synth in supercollider
- start the nodejs server in the "nodejs" folder
- open the sonipen.html file and enjoy the sounds