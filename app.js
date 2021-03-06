var gameport = process.env.PORT || 3333;
var app      = require('express')();
var UUID     = require('node-uuid');
var http     = require('http').Server(app);
var io       = require('socket.io')(http);

http.listen(gameport, function() {
    console.log("Listening on port: " + gameport);   
});

app.get('/', function(req, res){
    res.sendFile(__dirname + "/pages/index.html"); 
});

app.get('/*', function(req, res, next){
    res.sendFile(__dirname + '/' + req.params[0]);
});

//var sio = io.listen(http);

/*
sio.configure(function() {
    sio.set('log level', 0);

    sio.set('authorization', function(handshakeData, callback) {
        callback(null, true);
    });
});
*/

var client_data = {};

io.sockets.on('connection', function(client) {
    
    client.userid = UUID();

    client.emit('onconnected', { id: client.userid });
    console.log('Player ' + client.userid + ' connected.');

    client.on('disconnect', function() {
        console.log('Client disconnected: ' + client.userid); 
    });

    client.on('initial_connect', function(msg) {
        client_data[msg.id] = {position: msg.pos, color: msg.color}
    }

    client.on('client_update', function(msg) {
        client_data[msg.id].position = client_data[msg.id].position.add(msg.pos);
    });

});

var tick_rate = 20; // milliseconds / update

setInterval(function() {
    io.emit('server_update', client_data);
}, tick_rate);
