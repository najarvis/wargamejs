$(document).ready(function() {

    var socket = io.connect('/');

    socket.on('onconnected', function(data) {
        console.log('Connected successfully to the server. Client ID: ' + data.id);

        gameSpace.start();
        gameSpace.gameHandler.main_clientID = data.id;

    });

    socket.on('server_update', function(data) {
        gameSpace.gameHandler.client_data = data;
        console.log(data);
    });

});

KEYS = [];

var gameSpace = {

	// Basic setup stuffs.
	start : function() {
        this.canvas = document.getElementById('canvas'),
		this.canvas.width = $(window).width();
		this.canvas.height = $(window).height();

		this.context = this.canvas.getContext("2d");

		this.gameHandler = new handler(this.canvas.width, this.canvas.height);
		for (var i = 0; i < 1; i++) {
			this.gameHandler.add_random_entity();
		}
		this.gameHandler.draw();

		// Every 20 milliseconds (a little slower than 60fps), run the updateAndRender method with this.gameHandler as the parameter.
		setInterval(this.updateAndRender, this.gameHandler.update_rate * 1000, this.gameHandler);

		document.body.insertBefore(this.canvas, document.body.childNodes[0]);

        window.addEventListener('keydown', function(e) {
            KEYS[e.keyCode] = true;
        });

        window.addEventListener('keyup', function(e) {
            KEYS[e.keyCode] = false;
        });

	},


	// This is in one functions so there is just one interval.
	updateAndRender : function(handler, keys) {
		handler.update(KEYS);

		gameSpace.clear();
		handler.draw();
	},

	// Clears the context of the screen, makes it ready to draw.
	clear : function() {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}

function handler(width, height){
    this.width = width;
    this.height = height;
    this.entities = [];
    this.colors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00"];
    this.update_rate = 1 / 60; // This is in seconds.

    this.last_time = new Date();
    this.main_clientID = undefined;
    this.client_data = {};

    this.add_random_entity = function(){
        var col = this.colors[randInt(0, this.colors.length-1)];
        var position = new vector(randInt(0, this.width-64), randInt(0, this.height-64));
        this.add_entity(position, col);
    }

    this.add_entity = function(position, color){
        this.entities.push(new player(position, color));
    }

    this.draw = function(){
        this.entities = [];
        for (var client in this.client_data) {
            this.add_entity(this.client_data[client].position, this.client_data[client].color);
        }
        
		for (var i = 0; i < this.entities.length; i++) {
			this.entities[i].draw();
		}
    }

    this.set_client_data = function(data) {
        this.client_data = data;
    }

    this.update = function(input) {
        // Handle user input and update all entities.

        // Gets the time since the last frame in seconds
        new_time = new Date();
        delta = (new_time - this.last_time) / 1000;
        this.last_time = new_time;
        
        // Handle user input
        var pos = new vector(0, 0);
        if (input[87]){ // W
            pos = pos.add(new vector(0, -1));
        }
        if (input[83]){ // S
            pos = pos.add(new vector(0, 1));
        }
        if (input[65]){ // A
            pos = pos.add(new vector(-1, 0));
        }
        if (input[68]){ // D
            pos = pos.add(new vector(1, 0));
        }
        
        socket.emit('client_data', {id: this.main_clientID, pos: pos});
        //this.client_data[this.main_clientID].update(pos, delta);
    }
}

function player(position, color){
    this.position = position;
    this.size = 64;
    this.color = color;
    this.speed = 100; // In pixels / second
    this.name = "TEST";

    this.draw = function(){
        context = gameSpace.context;
        context.fillStyle = this.color;
        context.fillRect(this.position.elements[0], this.position.elements[1], this.size, this.size);
        context.strokeStyle = "#000000";
        context.strokeRect(this.position.elements[0], this.position.elements[1], this.size, this.size);
        // TODO: Draw name over character.
    }

    this.update = function(input, delta){
        this.position = this.position.add(input.normalize().mul(delta * this.speed));
    }
    
    this.checkCollision = function(other_player){
        return collide_players(this, other_player);
    }

}

function collide_players(p1, p2){
    // Returns true if p1 is colliding with p2.
    return Math.abs(p1.position.elements[0] - p2.position.elements[0]) < p1.size &&
           Math.abs(p1.position.elements[1] - p2.position.elements[1]) < p1.size;
}

function randInt(min, max) {
    // Generate a random number between min and max (inclusive)
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
