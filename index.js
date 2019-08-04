var express = require('express');
var http = require('http');
var WebSocket = require('ws');
var shared = require('./www/js/shared.js');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new WebSocket.Server({server});

var clients = {};

var maxSpeed = 1;

function validLevel(level){
    var checked = new Array(level.length);
    var start = null;
    for(var i = 0; i < checked.length; ++i){
        checked[i] = new Array(level[i].length);
        for(var j = 0; j < checked[i].length; ++j){
            checked[i][j] = false;
            if(level[i][j] <= 1) start = {x: i, y: j};
        }
    }
    if(start === null) return false;
    var space;
    space = 0;
    for(var i = 0; i < level.length; ++i){
        if(level[i][0] <= 1) space = true;
    }
    if(!space) return false;
    space = 0;
    for(var i = 0; i < level.length; ++i){
        if(level[i][level[0].length-1] <= 1) space = true;
    }
    if(!space) return false;
    space = 0;
    for(var i = 0; i < level[0].length; ++i){
        if(level[0][i] <= 1) space = true;
    }
    if(!space) return false;
    space = 0;
    for(var i = 0; i < level[0].length; ++i){
        if(level[level.length-1][i] <= 1) space = true;
    }
    if(!space) return false;
    var check = [start];
    while(check.length > 0){
        var p = check.shift();
        if(p.x < 0 || p.x >= level.length || p.y < 0 || p.y >= level[0].length) continue;
        if(level[p.x][p.y] > 1) continue;
        if(checked[p.x][p.y]) continue;
        checked[p.x][p.y] = true;
        check.push({x: p.x-1, y: p.y});
        check.push({x: p.x+1, y: p.y});
        check.push({x: p.x, y: p.y-1});
        check.push({x: p.x, y: p.y+1});
    }
    for(var i = 0; i < checked.length; ++i){
        for(var j = 0; j < checked[i].length; ++j){
            if(level[i][j] <= 1 && !checked[i][j]) return false;
        }
    }
    return true;
}

var levelSize = 500;

var level = new Array(levelSize);
for(var i = 0; i < levelSize; ++i){
    level[i] = new Array(levelSize);
    for(var j = 0; j < levelSize; ++j){
        level[i][j] = 0;
    }
}

var metaballs = [];
var size = 100000;
var minSize = 1000;
var count = 0;

function addMetaball(x, y, w){
    var r = 100;
    for(var i = Math.max(x-r, 0); i < Math.min(x+r, levelSize); ++i){
        for(var j = Math.max(y-r, 0); j < Math.min(y+r, levelSize); ++j){
            var dx = x-i;
            var dy = y-j;
            level[i][j] += w/(10+Math.pow(dx*dx+dy*dy, 2));
        }
    }
}

while(size >= minSize){
    var metaballs = [];
    var num = 30;
    for(var i = 0; i < num; ++i){
        metaballs.push({
            x: Math.floor(Math.random()*levelSize),
            y: Math.floor(Math.random()*levelSize),
        });
    }
    for(var i = 0; i < num; ++i){
        addMetaball(metaballs[i].x, metaballs[i].y, size);
    }
    if(!validLevel(level)){
        for(var i = 0; i < num; ++i){
            addMetaball(metaballs[i].x, metaballs[i].y, -size);
        }
        size *= 0.9;
    } else ++count;
    console.log(size + '\t' + count);
}

for(var i = 0; i < levelSize; ++i){
    for(var j = 0; j < levelSize; ++j){
        level[i][j] = (level[i][j] > 1);
    }
}

var game = new shared.Game(level, []);

var newFighters = [];
var oldFighters = [];

function addFighter(client, dist){
    var d = Math.sqrt(dist);
    var x = Math.floor(client.data.pos.x+Math.random()*d*2-d);
    var y = Math.floor(client.data.pos.y+Math.random()*d*2-d);
    if(x < 0) x = 0;
    if(x >= game.level.length) x = game.level.length-1;
    if(y < 0) y = 0;
    if(y >= game.level[0].length) y = game.level[0].length-1;
    if(game.level[x][y]) return false;
    var fighter = {
        x: x,
        y: y,
        id: client.id,
        health: 255
    };
    game.level[fighter.x][fighter.y] = fighter;
    game.fighters.push(fighter);
    newFighters.push(fighter);
    return true;
}

function addPlayer(client){
    client.send(JSON.stringify({
        level: game.level,
        fighters: game.fighters
    }));
    var pos;
    while(true){
        pos = {
            x: Math.random()*game.level.length,
            y: Math.random()*game.level[0].length
        };
        if(level[Math.floor(pos.x)][Math.floor(pos.y)] === false) break;
    }
    client.data = {
        id: client.id,
        pos: pos,
        vel: {
            x: 0,
            y: 0
        }
    };
    client.on('message', function(msg) {
        var d = JSON.parse(msg);
        var len = Math.sqrt(d.x*d.x+d.y*d.y);
        len /= maxSpeed;
        if(len > 1){
            d.x /= len;
            d.y /= len;
        }
        client.data.vel = d;
    });
    client.on('close', function(){
        game.removeFighters(client.id);
        oldFighters.push(client.id);
        delete clients[client.id];
    });
    var oldGame = game;
    game = new shared.Game(JSON.parse(JSON.stringify(game.level)), JSON.parse(JSON.stringify(game.fighters)));
    var startNumber = 100;
    var dist = 0;
    for(var i = 0; i < startNumber; ++i){
        while(!addFighter(client, dist)) ++dist;
    }
    game = oldGame;
}

function collision(pos){
    var x = Math.floor(pos.x);
    var y = Math.floor(pos.y);
    if(level[x][y] !== true) return;
    var dx = pos.x-x;
    var dy = pos.y-y;
    if(Math.abs(dx-0.5) > Math.abs(dy-0.5)){
        if(dx > 0.5){
            if(x >= level.length-1 || level[x+1][y] === true){
                pos.y = y;
                if(dy > 0.5) ++pos.y;
            }
            else pos.x = x+1;
        }
        else{
            if(x <= 0 || level[x-1][y] === true){
                pos.y = y;
                if(dy > 0.5) ++pos.y;
            }
            else pos.x = x;
        }
        return;
    }
    if(dy > 0.5){
        if(y >= level[0].length-1 || level[x][y+1] === true){
            pos.x = x;
            if(dx > 0.5) ++pos.x;
        }
        else pos.y = y+1;
    }
    else{
        if(y <= 0 || level[x][y-1] === true){
            pos.x = x;
            if(dx > 0.5) ++pos.x;
        }
        else pos.y = y;
    }
}

setInterval(function(){
    wss.clients.forEach(function(client) {
        var num = 3*maxSpeed;
        for(var i = 0; i < num; ++i){
            client.data.pos.x += client.data.vel.x/num;
            client.data.pos.y += client.data.vel.y/num;
            if(client.data.pos.x < 0) client.data.pos.x = 0;
            if(client.data.pos.x > game.level.length-0.01) client.data.pos.x = game.level.length-0.01;
            if(client.data.pos.y < 0) client.data.pos.y = 0;
            if(client.data.pos.y > game.level[0].length-0.01) client.data.pos.y = game.level[0].length-0.01;
            collision(client.data.pos);
            collision(client.data.pos);
            collision(client.data.pos);
        }
    });

    var res = {};
    wss.clients.forEach(function(client) {
        res[client.id] = Object.assign({}, client.data);
        res[client.id].posSmooth = Object.assign({}, client.data.pos);
        res[client.id].pos = Object.assign({}, client.data.pos);
        res[client.id].pos.x = Math.floor(res[client.id].pos.x);
        res[client.id].pos.y = Math.floor(res[client.id].pos.y);
    });
    var seed = Math.floor(Math.random()*2147483647);
    wss.clients.forEach(function(client) {
        client.send(JSON.stringify({
            player: client.data.id,
            players: res,
            newFighters: newFighters,
            oldFighters: oldFighters,
            seed: seed
        }));
    });
    game.updateFighters(newFighters, oldFighters);
    game.update(res, null, seed);
    newFighters = [];
    oldFighters = [];
}, 1000/30);

wss.on('connection', function(ws) {
    ws.id = Math.floor(Math.random()*16777215).toString(16);
    while(ws.id.length < 6) ws.id = "0" + ws.id;
    clients[ws.id] = ws;
    addPlayer(ws);
});

var port = process.env.PORT || 5000;

server.listen(port, function(){
    console.log("Server listening on port " + port);
});
