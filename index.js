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

setInterval(function(){
    var res = [];
    wss.clients.forEach(function(client) {
        res.push(client.data);
    });
    res = JSON.stringify(res);
    wss.clients.forEach(function(client) {
        client.send(res);
    });
}, 0);

wss.on('connection', function(ws) {
    ws.id = wss.getUniqueID();
    clients[ws.id] = ws;
    ws.data = {};
    ws.on('message', function(msg) {
        var data = JSON.parse(msg);
        for(var i = 0; i < Object.keys(data).length; ++i){
            ws.data[Object.keys(data)[i]] = data[Object.keys(data)[i]];
        }
    });
});

server.listen(process.env.PORT || 5000);