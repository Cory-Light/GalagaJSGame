/*
------------------------------
------- INPUT SECTION --------
------------------------------
*/

/**
 * This class binds key listeners to the window and updates the controller in attached player body.
 *
 * @author Professor Tony
 * @typedef InputHandler
 */
class InputHandler {
	key_code_mappings = {
		button: {
			32: {key: 'space', state: 'action_1'}
		},
		axis: {
			68: {key: 'right', state: 'move_x', mod: 1},
			65: {key: 'left', state: 'move_x', mod: -1},
			87: {key: 'up', state: 'move_y', mod: -1},
			83: {key: 'down', state: 'move_y', mod: 1}
		}
	};
	player = null;

	constructor(player) {
		this.player = player;

		// bind event listeners
		window.addEventListener("keydown", (event) => this.keydown(event), false);
		window.addEventListener("keyup", (event) => this.keyup(event), false);
	}

	/**
	 * This is called every time a keydown event is thrown on the window.
	 *
	 * @param {Object} event The keydown event
	 */
	keydown(event) {
		// ignore event handling if they are holding down the button
		if (event.repeat || event.isComposing || event.keyCode === 229)
			return;

		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] += mapping.mod;
			//console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}

		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = true;
			//console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}

	/**
	 * This is called every time a keyup event is thrown on the window.
	 *
	 * @param {Object} event The keyup event
	 */
	keyup(event) {
		if (event.isComposing || event.keyCode === 229)
    	return;

		// check if axis mapping exists
		if (this.key_code_mappings.axis.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.axis[event.keyCode];
			this.player.controller[mapping.state] -= mapping.mod;
			//console.log(`input_handler[axis:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}

		// check if button mapping exists
		if (this.key_code_mappings.button.hasOwnProperty(event.keyCode)) {
			const mapping = this.key_code_mappings.button[event.keyCode];
			this.player.controller[mapping.state] = false;
			//console.log(`input_handler[button:${mapping.state} state:${this.player.controller[mapping.state]}]`);
		}
	}
}

/*
------------------------------
------- BODY SECTION  --------
------------------------------
*/

/**
 * Represents a basic physics body in the world. It has all of the necessary information to be
 * rendered, checked for collision, updated, and removed.
 *
 * @author Professor Tony
 * @typedef Body
 */
class Body {
	position = {x: 0, y: 0};
	velocity = {x: 0, y: 0};
	size = {width: 10, height: 10};
	health = 100;

	/**
	 * Creates a new body with all of the default attributes
	 */
	constructor() {
		// generate and assign the next body id
		this.id = running_id++;
		// add to the entity map
		entities[this.id] = this;
	}

	/**
	 * @type {Object} An object with two properties, width and height. The passed width and height
	 * are equal to half ot the width and height of this body.
	 */
	get half_size() {
		return {
			width: this.size.width / 2,
			height: this.size.height / 2
		};
	}

	/**
	 * @returns {Boolean} true if health is less than or equal to zero, false otherwise.
	 */
	isDead() {
		return this.health <= 0;
	}

	/**
	 * Updates the position of this body using the set velocity.
	 *
	 * @param {Number} delta_time Seconds since last update
	 */
	update(delta_time) {
		// move body
		this.position.x += delta_time * this.velocity.x;
		this.position.y += delta_time * this.velocity.y;
	}

	/**
	 * This function draws a green line in the direction of the body's velocity. The length of this
	 * line is equal to a tenth of the length of the real velocity
	 *
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		graphics.strokeStyle = '#00FF00';
		graphics.beginPath();
		graphics.moveTo(this.position.x, this.position.y);
		graphics.lineTo(this.position.x + this.velocity.x / 10, this.position.y + this.velocity.y / 10);
		graphics.stroke();
	}

	/**
	 * Marks this body to be removed at the end of the update loop
	 */
	remove() {
		queued_entities_for_removal.push(this.id);
	}
}


/**
 * Represents an projectile body to be fired from player position.
 *
 * @author Cameron
 * @typedef Projectile
 */
class Projectile extends Body {
	speed = 10;

	/**
	 * constructor - creates a new projectile with the same position of the player.
	 *
	 * @param  {Number} x x position of player when fired
	 * @param  {Number} y y position of player when fired
	 */
	constructor(x, y) {
		super();

		this.position = {
			x: x,
			y: y
		};

		this.size = {
			width: 10,
			height: 20
		};
	}

	/**
	 * draw - draws the projectile as a rectangle centered on projectile's location.
	 *
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		let img = new Image();
		img.src = 'sprites/projectile.png';
		graphics.drawImage(img, this.position.x-this.half_size.width, this.position.y-this.half_size.height, this.size.width, this.size.height);

		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the position based on the projectiles diag_speed.
	 * Removes projectile if it goes above the canvas.
	 *
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		//move
		this.position.y-=this.speed;
		if(this.position.y <= 0){
			this.remove();
		}

		// update position
		super.update(delta_time);

		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}

/**
 * Represents a player body. Extends a Body by handling input binding and controller management.
 *
 * @author Professor Tony, Cory and Cameron
 * @typedef Player
 */
class Player extends Body {
	// this controller object is updated by the bound input_handler
	controller = {
		move_x: 0,
		move_y: 0,
		action_1: false
	};
	speed = 5;
	diag_speed = this.speed*Math.cos(Math.PI/4);
	input_handler = null;

	/**
	 * Creates a new player with the default attributes.
	 */
	constructor() {
		super();

		// bind the input handler to this object
		this.input_handler = new InputHandler(this);
		this.time_since_fired = 0;

		// we always want our new players to be at this location
		this.position = {
			x: config.canvas_size.width / 2,
			y: config.canvas_size.height - 100
		};

		this.size = {
			width: 20,
			height: 20
		};
	}

	/**
	 * Draws the player as a triangle centered on the player's location.
	 *
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		let img = new Image();
		img.src = 'sprites/player.png';
		graphics.drawImage(img, this.position.x-this.half_size.width, this.position.y-this.half_size.height, this.size.width, this.size.height);

		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the player given the state of the player's controller.
	 *
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
			//Player Movement
			//update position by diagnal speed if headed in a diagnal
			if(this.controller.move_x != 0 && this.controller.move_y != 0){
				this.position.x += this.controller.move_x*this.diag_speed;
				this.position.y += this.controller.move_y*this.diag_speed;
			}
			//otherwise use regular speed to update
			else{
				this.position.x += this.controller.move_x*this.speed;
				this.position.y += this.controller.move_y*this.speed;
			}

			//Collision stuff
			//die after health is 0 collisions
			if(this.isDead()){
				this.remove();
				if(firstGame){
					firstGame = false;
				}
				if(score > HighScore){
					HighScore = score;
				}
				start();
			}

			//Combat
			this.time_since_fired += delta_time;
			if(this.controller.action_1){
				if(this.time_since_fired >= .1){
					//reset the timer
					this.time_since_fired = 0;
					//fire
					new Projectile(this.position.x, this.position.y);
				}
			}

		// update position
		super.update(delta_time);

		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}


/**
 * Represents an enemy body. Extends body by handling speed and position
 *
 * @author Cory and Cameron 
 * @typedef Enemy
 */
class Enemy extends Body {
	/**
	 * Creates a new enemy with the default attributes.
	 */
	constructor(speed) {
		super();

		this.speed = speed;
		// enemies spawn above canvos at a random x
		this.position = {
			x: Math.random()*config.canvas_size.width,
			y: -50
		};

		this.size = {
			width: 20,
			height: 20
		};
	}

	/**
	 * Draws the enemy as a red triangle around the enemies position.
	 *
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		let img = new Image();
		img.src = 'sprites/enemy.png';
		graphics.drawImage(img, this.position.x-this.half_size.width, this.position.y-this.half_size.height, this.size.width, this.size.height);

		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the enemy based on its speed.
	 *
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		this.position.y += this.speed;
		if(this.position.y >= config.canvas_size.height){
			super.remove()
		}
		// update position
		super.update(delta_time);
		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}


/**
 * Represents a boss enemy body. Extends the enemy by adding health utilization
 *
 * @author Cory
 * @typedef BossEnemy
 */
class BossEnemy extends Body {
	/**
	 * Creates a new boss enemy with the default attributes.
	 */
	constructor(speed) {
		super();

		this.speed = speed;
		// enemies spawn above canvos at a random x
		this.position = {
			x: Math.random()*config.canvas_size.width,
			y: -50
		};
		this.size = {
			width: 25,
			height: 40
		};
		this.health = 1000;
	}

	/**
	 * Draws the boss enemy as a purple triangle around the enemies position.
	 *
	 * @param {CanvasRenderingContext2D} graphics The current graphics context.
	 */
	draw(graphics) {
		let img = new Image();
		img.src = 'sprites/bossenemy.png';
		graphics.drawImage(img, this.position.x-this.half_size.width, this.position.y-this.half_size.height, this.size.width, this.size.height);

		graphics.strokeStyle = '#9400D3';
		graphics.beginPath();
		graphics.moveTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.lineTo(
			this.position.x + this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x - this.half_size.width,
			this.position.y - this.half_size.height
		);
		graphics.lineTo(
			this.position.x,
			this.position.y + this.half_size.height
		);
		graphics.stroke();
		// draw velocity lines
		super.draw(graphics);
	}

	/**
	 * Updates the boss enemy based on its speed.
	 *
	 * @param {Number} delta_time Time in seconds since last update call.
	 */
	update(delta_time) {
		this.position.y += this.speed;
		if(this.position.y >= config.canvas_size.height){
			super.remove()
		}
		// update position
		super.update(delta_time);
		// clip to screen
		this.position.x = Math.min(Math.max(0, this.position.x), config.canvas_size.width);
		this.position.y = Math.min(Math.max(0, this.position.y), config.canvas_size.height);
	}
}


/**
 * An object that spawns new enemy waves
 *
 * @author Cody and Cameron
 * @typedef Enemy_Spawner
 */
class Enemy_Spawner {

	/**
	 * constructor - creates a new enemy_spawner
	 *
	 * @param  {Number} enemies     Number of enemies spawned per wave
	 * @param  {Number} timeBetween Time between waves
	 */
	constructor(enemies, timeBetween){
		this.enemies = enemies;
		this.time_between = timeBetween;
		this.time_since_spawn = 0;
		this.bossSpawn = false;
		this.bossTimer = 0;
	}

	/**
	 * update - updates the enemy_spawner, spawning more enemies or waiting for next wave timer
	 *
	 * @param  {Number} delta_time tine in seconds since last update call
	 */
	update(delta_time) {
		this.time_since_spawn+=delta_time;
		if(this.time_since_spawn >= this.time_between){
			this.time_since_spawn = 0;
			let i;
			for(i=0; i<this.enemies; i++){
				if(this.bossSpawn){
					new BossEnemy(1);
					new BossEnemy(2);
					bossesSpawned++;
					this.bossSpawn = false;
					//console.log(this.bossSpawn);
				}
				else{
					new Enemy(2);
					this.bossTimer++;
					enemiesSpawned++;
					//console.log(this.bossTimer);
					if(this.bossTimer == 10)
					{
						this.bossSpawn = true;
						this.bossTimer = 0;
						//console.log(this.bossSpawn);
					}
				}
			}
		}
	}
}


/**
 * Handles collisions between 2 bodies
 *
 * @author Cody and Cameron
 * @typedef Collision_Handler
 */
class Collision_Handler {

	/**
	 * constructor - creates a new collision_handler
	 *
	 */
	constructor(){
		this.ent = entities;
	}

	/**
	 * update - performs a check to see if 2 bodys have collided, updating the bodies if necessary
	 *
	 */
	update(){
		this.ent.forEach(e1 => {
			this.ent.forEach(e2 => {
				if(e1 != e2){
					if(e1.position.x - e1.half_size.width < e2.position.x + e2.half_size.width &&
						e1.position.x + e1.half_size.width > e2.position.x - e2.half_size.width &&
						e1.position.y - e1.half_size.height < e2.position.y + e2.half_size.height &&
						e1.position.y + e1.half_size.height > e2.position.y - e2.half_size.height){
							if(e1 instanceof Player){
								if(e2 instanceof Enemy){
									e1.health -= 25;
								}
								if(e2 instanceof BossEnemy){
									e1.health -= 100;
								}
							}
							if(e1 instanceof Enemy){
								if(e2 instanceof Player || e2 instanceof Projectile){
									e1.health -= 100;
									if(e1.health <= 0){
										e1.remove();
										enemiesKilled++;
									}
								}
							}
							if(e1 instanceof BossEnemy){
								if(e2 instanceof Projectile){
									e1.health -= 7;
									//console.log("Boss hit once.");
									if(e1.health <= 0){
										e1.remove();
										enemiesKilled++;
										bossesKilled++;
									}
									else{
										e2.remove()
									}
								}
							}
							if(e1 instanceof BossEnemy){
								if(e2 instanceof Projectile){
									e1.health -= 100;
									//console.log("Boss hit once.");
									if(e1.health <= 0){
										e1.remove();
										enemiesKilled++;
										bossesKilled++;
									}
								}
							}
					}
				}
			});
		});
	}
}

/*
------------------------------
------ CONFIG SECTION --------
------------------------------
*/

const config = {
	graphics: {
		// set to false if you are not using a high resolution monitor
		is_hi_dpi: true
	},
	canvas_size: {
		width: 300,
		height: 500
	},
	update_rate: {
		fps: 60,
		seconds: null
	}
};

config.update_rate.seconds = 1 / config.update_rate.fps;

// grab the html span
const game_state = document.getElementById('game_state');

// grab the html canvas
const game_canvas = document.getElementById('game_canvas');
game_canvas.style.width = `${config.canvas_size.width}px`;
game_canvas.style.height = `${config.canvas_size.height}px`;

const graphics = game_canvas.getContext('2d');

// for monitors with a higher dpi
if (config.graphics.is_hi_dpi) {
	game_canvas.width = 2 * config.canvas_size.width;
	game_canvas.height = 2 * config.canvas_size.height;
	graphics.scale(2, 2);
} else {
	game_canvas.width = config.canvas_size.width;
	game_canvas.height = config.canvas_size.height;
	graphics.scale(1, 1);
}

/*
------------------------------
------- MAIN SECTION  --------
------------------------------
*/

/** @type {Number} last frame time in seconds */
var last_time = null;

/** @type {Number} A counter representing the number of update calls */
var loop_count = 0;

/** @type {Number} A counter that is used to assign bodies a unique identifier */
var running_id = 0;

/** @type {Object<Number, Body>} This is a map of body ids to body instances */
var entities = null;

/** @type {Array<Number>} This is an array of body ids to remove at the end of the update */
var queued_entities_for_removal = null;

/** @type {Player} The active player */
var player = null;

/* You must implement this, assign it a value in the start() function */
var enemy_spawner = null;

/* You must implement this, assign it a value in the start() function */
var collision_handler = null;

/**
 * This function updates the state of the world given a delta time.
 *
 * @param {Number} delta_time Time since last update in seconds.
 */
function update(delta_time) {
	// move entities
	Object.values(entities).forEach(entity => {
		entity.update(delta_time);
	});

	// detect and handle collision events
	if (collision_handler != null) {
		collision_handler.update(delta_time);
	}

	// remove enemies
	queued_entities_for_removal.forEach(id => {
		delete entities[id];
	})
	queued_entities_for_removal = [];

	// spawn enemies
	if (enemy_spawner != null) {
		enemy_spawner.update(delta_time);
	}

	// allow the player to restart when dead
	//if (player.isDead() && player.controller.action_1) {
	// 	start();
	//}
	// if (player.isDead() && player.controller.action_1) {
	// 	start();
	// }
}

/**
 * This function draws the state of the world to the canvas.
 *
 * @param {CanvasRenderingContext2D} graphics The current graphics context.
 */
function draw(graphics) {
	// default font config
	graphics.font = "10px Arial";
	graphics.textAlign = "left";

	// draw background (this clears the screen for the next frame)
	graphics.fillStyle = '#FFFFFF';
	graphics.fillRect(0, 0, config.canvas_size.width, config.canvas_size.height);

	// for loop over every eneity and draw them
	Object.values(entities).forEach(entity => {
		entity.draw(graphics);
	});

	// game over screen
	// if (player.isDead()) {
	// 	graphics.font = "30px Arial";
	// 	graphics.textAlign = "center";
	// 	graphics.fillText('Game Over', config.canvas_size.width / 2, config.canvas_size.height / 2);

	// 	graphics.font = "12px Arial";
	// 	graphics.textAlign = "center";
	// 	graphics.fillText('press space to restart', config.canvas_size.width / 2, 18 + config.canvas_size.height / 2);
	// }
}

/**
 * This is the main driver of the game. This is called by the window requestAnimationFrame event.
 * This function calls the update and draw methods at static intervals. That means regardless of
 * how much time passed since the last time this function was called by the window the delta time
 * passed to the draw and update functions will be stable.
 *
 * @param {Number} curr_time Current time in milliseconds
 */
function loop(curr_time) {
	// convert time to seconds
	curr_time /= 1000;

	// edge case on first loop
	if (last_time == null) {
		last_time = curr_time;
	}

	var delta_time = curr_time - last_time;
	timeAlive+=delta_time;

	// this allows us to make stable steps in our update functions
	while (delta_time > config.update_rate.seconds) {
		update(config.update_rate.seconds);
		draw(graphics);

		delta_time -= config.update_rate.seconds;
		last_time = curr_time;
		loop_count++;

		score = Math.floor(30*enemiesKilled+timeAlive);

		if(firstGame){
			HighScore = 0;
		}
		loopCount.innerHTML = `Loop Count ${loop_count}`;
		scoreSpan.innerHTML = `Score ${score}`;
		highScoreSpan.innerHTML = `The score to beat is ${HighScore}`;
		seconds_alive.innerHTML = `You've survived for ${timeAlive.toFixed(2)} seconds`;
		totalEnemiesSpawned.innerHTML = `There have been ${enemiesSpawned} scum walking this earth`;
		totalEnemiesKilled.innerHTML = `You've ended ${enemiesKilled} of their lives`;
		totalBossesSpawned.innerHTML = `There have been ${bossesSpawned} Big Bois walking this earth`;
		totalBossesKilled.innerHTML = `You've splattered ${bossesKilled} of them`;


	}

	window.requestAnimationFrame(loop);
}


/**
 * start - Starts the game, enters the loop after
 *
 */
function start() {
	entities = [];
	queued_entities_for_removal = [];
	enemiesKilled = 0;
	timeAlive = 0;
	bossesSpawned = 0;
	bossesKilled = 0;
	enemiesSpawned = 0;
	player = new Player();
	enemy_spawner = new Enemy_Spawner(1, .55);
	collision_handler = new Collision_Handler();
}
firstGame = true;
// start the game
start();

// start the loop
window.requestAnimationFrame(loop);
