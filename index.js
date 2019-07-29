var express = require('express');
var http = require('http');
var WebSocket = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4()+s4()+s4();
};

var clients = {};
var levelSize = 3000;
var radius = 50;

setInterval(function(){
    wss.clients.forEach(function(client) {
        client.data.pos.x += client.data.vel.x;
        client.data.pos.y += client.data.vel.y;
        if(client.data.pos.x < client.data.r || client.data.pos.x > levelSize-client.data.r || client.data.pos.y < client.data.r || client.data.pos.y > levelSize-client.data.r){
            delete clients[client.id];
            for(var i = 0; i < Object.keys(client.data.connections).length; ++i){
                var c = clients[Object.keys(client.data.connections)[i]];
                for(var j = 0; j < Object.keys(c.data.connections).length; ++j){
                    if(Object.keys(c.data.connections)[j] == client.id) delete c.data.connections[Object.keys(c.data.connections)[j]];
                }
            }
            client.close();
        }
    });
    wss.clients.forEach(function(client) {
        wss.clients.forEach(function(c) {
            if(client == c) return;
            if(client.data.connections[c.id]) return;
            var dx = c.data.pos.x-client.data.pos.x;
            var dy = c.data.pos.y-client.data.pos.y;
            var len = Math.sqrt(dx*dx+dy*dy);
            var r = client.data.r+c.data.r;
            if(len > r) return;
            client.data.connections[c.id] = true;
            c.data.connections[client.id] = true;
        });
    });
    wss.clients.forEach(function(client) {
        for(var i = 0; i < Object.keys(client.data.connections).length; ++i){
            var c = clients[Object.keys(client.data.connections)[i]];
            var dx = c.data.pos.x-client.data.pos.x;
            var dy = c.data.pos.y-client.data.pos.y;
            var len = Math.sqrt(dx*dx+dy*dy);
            var r = client.data.r+c.data.r;
            dx *= (r-len)/len;
            dy *= (r-len)/len;
            client.data.pos.x -= dx/2;
            client.data.pos.y -= dy/2;
            c.data.pos.x += dx/2;
            c.data.pos.y += dy/2;
        }
    });

    var res = {};
    wss.clients.forEach(function(client) {
        res[client.id] = client.data;
    });
    wss.clients.forEach(function(client) {
        client.send(JSON.stringify({
            player: client.data,
            players: res,
            levelSize: levelSize
        }));
    });
}, 0);

wss.on('connection', function(ws) {
    ws.id = wss.getUniqueID();
    clients[ws.id] = ws;
    ws.data = {
        id: ws.id,
        pos: {
            x: Math.random()*(levelSize-2*radius)+radius,
            y: Math.random()*(levelSize-2*radius)+radius
        },
        vel: {
            x: 0,
            y: 0
        },
        connections: {},
        r: radius
    };
    ws.on('message', function(msg) {
        var maxSpeed = 1;
        var d = JSON.parse(msg);
        var len = Math.sqrt(d.x*d.x+d.y*d.y);
        len /= maxSpeed;
        if(len > 1){
            d.x /= len;
            d.y /= len;
        }
        ws.data.vel = d;
    });
});

var port = process.env.PORT || 5000;

server.listen(port, function(){
    console.log("Server listening on port " + port);
});
