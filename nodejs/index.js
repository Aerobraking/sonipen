//--------------------------------------------------
//  Bi-Directional OSC messaging Websocket <-> UDP
//--------------------------------------------------

/**
 * This nodejs server relays messages that are received by an websocket foward
 * to an udp port.
 * 
 * This used to send the osc messaged that are generated on our website to our supercollider 
 * server that listens to udp. A website can not send udp messaged directly, so we use this here to convert
 * them.
 * 
 * The only thing you have to change here are the adresses/ports, which are defined right at the top of the code.
 */

var localAdress = "127.0.0.1";
var localPort = 57121;
var remoteAdress = localAdress;
var remotePort = 57110;
var webSocketPort = 8080;

var osc = require("osc"),
    WebSocket = require("ws");

var getIPAddresses = function () {
    var os = require("os"),
        interfaces = os.networkInterfaces(),
        ipAddresses = [];

    for (var deviceName in interfaces) {
        var addresses = interfaces[deviceName];

        for (var i = 0; i < addresses.length; i++) {
            var addressInfo = addresses[i];

            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};

var udp = new osc.UDPPort({
    // This is the port we're listening on.
    localAddress: localAdress,
    localPort: localPort,
    // This is where sclang is listening for OSC messages.
    remoteAddress: remoteAdress,
    remotePort: remotePort,
    metadata: true
});

udp.on("ready", function () {
    var ipAddresses = getIPAddresses();
    console.log("Listening for OSC over UDP.");
    ipAddresses.forEach(function (address) {
        console.log(" Host:", address + ", Port:", udp.options.localPort);
    });
    console.log("Broadcasting OSC over UDP to", udp.options.remoteAddress + ", Port:", udp.options.remotePort);
});

udp.open();

var wss = new WebSocket.Server({
    port: webSocketPort
});

wss.on("connection", function (socket) {
    console.log("A Web Socket connection has been established!!!");

    var socketPort = new osc.WebSocketPort({
        socket: socket,
        metadata: true
    });

    /**
     This is an existing method for forwarding the message to the udp port.
     This is an alternative way sending it manually 
 
     var relay = new osc.Relay(udp, socketPort, {
     raw: true
     });   
    */

    socketPort.on("message", function (oscMsg) {
        udp.send(oscMsg);
    });
});