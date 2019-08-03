var express = require('express');
var http = require('http');
var WebSocket = require('ws');
var shared = require('./www/js/shared.js');

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

var levelSize = 750;
var startNumber = 3000;
var rng = new shared.Random(123);

var clients = {};
var fighters = [];
var level = new Array(levelSize);
var metaballs = [];
for(var i = 0; i < 200; ++i){
    metaballs.push({
        x: Math.random()*levelSize,
        y: Math.random()*levelSize
    });
}
for(var i = 0; i < levelSize; ++i){
    level[i] = new Array(levelSize);
    for(var j = 0; j < levelSize; ++j){
        level[i][j] = false;
        var sum = 0;
        for(var k = 0; k < metaballs.length; ++k){
            var dx = metaballs[k].x-i;
            var dy = metaballs[k].y-j;
            sum += 1/(1+dx*dx+dy*dy);
        }
        if(sum > 0.02) level[i][j] = true;
    }
}

setInterval(function(){
    wss.clients.forEach(function(client) {
        client.data.pos.x += client.data.vel.x;
        client.data.pos.y += client.data.vel.y;
        if(client.data.pos.x < 0) client.data.pos.x = 0;
        if(client.data.pos.x > levelSize) client.data.pos.x = levelSize;
        if(client.data.pos.y < 0) client.data.pos.y = 0;
        if(client.data.pos.y > levelSize) client.data.pos.y = levelSize;
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
}, 1000/30);

wss.on('connection', function(ws) {
    ws.id = wss.getUniqueID();
    clients[ws.id] = ws;
    ws.data = {
        id: ws.id,
        pos: {
            x: Math.random()*levelSize,
            y: Math.random()*levelSize
        },
        vel: {
            x: 0,
            y: 0
        }
    };
    function addFighter(){
        var x = Math.floor(Math.random()*levelSize);
        var y = Math.floor(Math.random()*levelSize);
        if(level[x][y]) return false;
        var fighter = {
            x: x,
            y: y,
            id: ws.id
        };
        fighters.push(fighter);
        level[x][y] = fighter;
        return true;
    }
    for(var i = 0; i < startNumber; ++i){
        while(!addFighter());
    }
    ws.send(JSON.stringify({
        fighters: fighters,
        level: level,
        levelSize: levelSize,
        seed: rng.seed
    }));
    ws.on('message', function(msg) {
        var maxSpeed = 2;
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
