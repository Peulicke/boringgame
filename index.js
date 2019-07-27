var express = require('express');
var http = require('http');
var ws = require('ws');

var app = express();
app.use(express.static(__dirname + '/www'));

var server = http.createServer(app);
var wss = new ws.Server({server});

wss.on('connection', function(ws) {
    var id = setInterval(function() {
        ws.send(JSON.stringify(process.memoryUsage()));
    }, 100);
    ws.on('close', function() {
        clearInterval(id);
    });
});

server.listen(process.env.PORT || 5000);