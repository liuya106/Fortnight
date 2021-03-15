function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {
	constructor(canvas){
		this.canvas = canvas;
	
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.player=null; // a special actor, the player
	
		// the logical width and height of the stage
		this.width=canvas.width * 3;
		this.height=canvas.height * 3;

		// Add the player to the center of the stage
		var velocity = new Pair(0,0);
		var radius = 10;
		var colour= 'rgba(0,0,0,1)';
		var position = new Pair(Math.floor(this.width/2), Math.floor(this.height/2));
		this.addPlayer(new Player(this, position, velocity, colour, radius));
	
		// Add in some Balls
		var total=25;
		while(total>0){
			var x=Math.floor((Math.random()*this.width)); 
			var y=Math.floor((Math.random()*this.height)); 
			if(this.getActor(x,y)===null){
				var velocity = new Pair(rand(6), rand(6));
				var red=randint(255), green=randint(255), blue=randint(255);
				var radius = randint(10) + 10;
				var alpha = Math.random();
				var colour= 'rgba('+red+','+green+','+blue+','+alpha+')';
				var position = new Pair(x,y);
				var b = new Enemy(this, position, velocity, colour, radius);
				this.addActor(b);

				// add amunition on map
				if(total % 1 == 0){
					position = new Pair(x + 20,y + 20);
					velocity = new Pair(0, 0);
					var a = new Amunition(this, position, velocity, colour, radius*3+40);
					this.addActor(a);
				}

				total--;
			}
		}

		
	}

	addPlayer(player){
		this.addActor(player);
		this.player=player;
	}

	removePlayer(){
		this.removeActor(this.player);
		this.player=null;
	}

	addActor(actor){
		this.actors.push(actor);
	}

	removeActor(actor){
		var index=this.actors.indexOf(actor);
		if(index!=-1){
			this.actors.splice(index,1);
		}
	}

	// Take one step in the animation of the game.  Do this by asking each of the actors to take a single step. 
	// NOTE: Careful if an actor died, this may break!
	step(){
		for(var i=0;i<this.actors.length;i++){
			this.actors[i].step();
		}
	}

	draw(){
		// show player coordinates
		var s = document.getElementById('player_coords');
		s.innerHTML = 'player coords: ' + this.player.x + ", " + this.player.y;

		var context = this.canvas.getContext('2d');
		context.clearRect(0, 0, this.width, this.height);
	

		// translate canvas so that player is always centered
		context.save();
		context.translate(this.canvas.width/2 - this.player.x, 
			this.canvas.height/2 - this.player.y);
		
		context.fillStyle = 'rgba(0,250,0,0.25)';
		context.fillRect(0, 0, this.width, this.height);
		for(var i=0;i<this.actors.length;i++){
			if(this.inRenderRange(this.actors[i]))
				this.actors[i].draw(context);
		}

		context.restore();
	}

	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}
		return null;
	}

	inRenderRange(actor){
		var minX = this.player.x - this.canvas.width / 2;
		var maxX = this.player.x + this.canvas.width / 2;
		var minY = this.player.y - this.canvas.height / 2;
		var maxY = this.player.y + this.canvas.height / 2;
		return actor.x >= minX && actor.x <= maxX && actor.y >= minY && actor.y <= maxY;
	}
} // End Class Stage

class Pair {
	constructor(x,y){
		this.x=x; this.y=y;
	}

	toString(){
		return "("+this.x+","+this.y+")";
	}

	normalize(){
		var magnitude=Math.sqrt(this.x*this.x+this.y*this.y);
		this.x=this.x/magnitude;
		this.y=this.y/magnitude;
	}
}

class Ball {
	constructor(stage, position, velocity, colour, radius){
		this.stage = stage;
		this.position=position;
		this.intPosition(); // this.x, this.y are int version of this.position

		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;

		this.health = 100;
		this.quadrant = new Pair(-1, -1);
		this.facing = Math.PI / 2;

	}
	
	headTo(position){
		this.velocity.x=(position.x-this.position.x);
		this.velocity.y=(position.y-this.position.y);
		this.velocity.normalize();
	}

	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}

	step(){
		var newX=this.position.x+this.velocity.x, newY=this.position.y+this.velocity.y;

		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && this.collide(newX, newY, actor)){
				this.velocity.x = 0;
				this.velocity.y = 0;
				return;
			}
		}

		this.position.x=this.position.x+this.velocity.x;
		this.position.y=this.position.y+this.velocity.y;

		this.intPosition();
			
		// bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
		}
		if(this.position.y<0){
			this.position.y=0;
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
		}
	}
	intPosition(){
		this.x = Math.round(this.position.x);
		this.y = Math.round(this.position.y);
	}
	draw(context){
		context.fillStyle = this.colour;
   		// context.fillRect(this.x, this.y, this.radius,this.radius);
		context.beginPath(); 
		context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false); 
		context.fill();   
	}

	drawFacing(context, color){
		var hand = this.getOffset(this.radius, this.facing);
		context.fillStyle = color;
		context.beginPath(); 
		context.arc(hand.x + this.x, hand.y + this.y, this.radius / 3, 0, 2 * Math.PI, false); 
		context.fill();  
	}

	// 'Face' the specified location.
	// helper function that computes the quadrant of coordinates
	// at (px, py) relative to this
	face(px, py){
		// compute the x, y distance from player
		var dx = Math.abs(px - this.x);
		var dy = Math.abs(py - this.y);
		// calculate angle based on the x, y component
		var theta = Math.atan(dy / dx);
		this.facing = theta;

		if(px > this.x && py < this.y){
			this.quadrant.x = 1;
			this.quadrant.y = -1;
		}
		else if(px < this.x && py <= this.y){
			this.quadrant.x = -1;
			this.quadrant.y = -1;
		}
		else if(px < this.x && py > this.y){
			this.quadrant.x = -1;
			this.quadrant.y = 1;
		}
		else if(px >= this.x && py > this.y){
			this.quadrant.x = 1;
			this.quadrant.y = 1;
		}
	}

	/* return the x, y component of the distance from this actor
	  at an specified angle in radians in currently facing quadrant */
	getOffset(hypotenuse, theta){
		var x = this.quadrant.x * Math.round(hypotenuse * Math.cos(theta));
		var y = this.quadrant.y * Math.round(hypotenuse * Math.sin(theta));
		return new Pair(x, y);
	}

	// return the x, y coordinates of the four edges of this actor
	getEdges(x, y){
		var leftEdge = Math.round(x - this.radius);
		var rightEdge = Math.round(x + this.radius);
		var topEdge = Math.round(y - this.radius);
		var botEdge = Math.round(y + this.radius);
		return new Pair(new Pair(leftEdge, rightEdge), new Pair(topEdge, botEdge));
	}

	// return true iff this actor and other overlaps/collide
	collide(x, y, other){
		var edges = this.getEdges(x, y);
		var otherEdges = other.getEdges(other.x, other.y);
		if(edges.x.x > otherEdges.x.y || edges.x.y < otherEdges.x.x ||
			edges.y.x > otherEdges.y.y || edges.y.y < otherEdges.y.x)
			return false;
		return true;
	}

	checkObstacle(other){
		var edges = this.getEdges(this.x, this.y);
		var otherEdges = other.getEdges(other.x, other.y);
		if(edges.x.x < otherEdges.x.y){
			// this.x = otherEdges.x.y + this.radius;	
			document.getElementById('temp').innerHTML=1;}
		else if(edges.x.y > otherEdges.x.x){
			this.x = otherEdges.x.x - this.radius;	
			document.getElementById('temp').innerHTML=2;}
		else if(edges.y.x < otherEdges.y.y)
			this.y = otherEdges.y.y + this.radius;	
		else if(edges.y.y > otherEdges.y.x)
			this.y = otherEdges.y.x - this.radius;
		else
			return false;		
	}

	// whenever hit by a bullet
	onBulletHit(){
		this.stage.removeActor(this);
	}
}

class Player extends Ball {
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);

		this.amunition = 24;
	}

	draw(context){
		var info = document.getElementById('player_info')
		info.innerHTML = 'Health: ' + this.health +  
			'&nbsp;&nbsp;&nbsp;&nbsp;Amunition: ' + this.amunition;

		// draw the player
		super.draw(context);

		// draw the player's weapon
		this.drawFacing(context, 'rgba(220,100,0,1)');
	}

	// fire a shotgun of three small bullets
	fire(){
		if(this.amunition <= 0)
			return;
		
		for(var i=-1; i<2;i++){
			// each bullet has 45 degrees of spacing
			var spacing = 45 * Math.PI / 180;
			var hand = this.getOffset(25, this.facing + i * spacing);
			var posision = new Pair(hand.x + this.x, hand.y + this.y);
			var velocity = this.getOffset(20, this.facing);
			var color = 'rgba(255, 0, 0, 1)';
			stage.addActor(new Bullet(stage, posision, velocity, color, 4));
		}
		this.amunition--;
	}

	refill(){
		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && actor instanceof Amunition && this.collide(this.x,this.y,actor)){
				this.amunition += 6;
				this.stage.removeActor(actor);
				return;
			}
		}
	}

	// whenever hit by a bullet
	onBulletHit(){
		this.health -= 10;
		if(this.health <= 0){
			this.stage.removeActor(this);
			$("#ui_play").hide();
			$("#lose_msg").show();
		}
	}

}

class Enemy extends Ball{
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);

		// fire time interval
		this.cooldown = randint(100);
	}
	fire(){
		var hand = this.getOffset(25, this.facing);
		var posision = new Pair(hand.x + this.x, hand.y + this.y);
		var velocity = this.getOffset(15, this.facing);
		var color = 'rgba(255, 0, 0, 1)';
		stage.addActor(new Bullet(stage, posision, velocity, color, 4));
	}

	// face the player and take a step; fires if no cooldown
	step(){
		this.face(stage.player.x, stage.player.y);
		this.cooldown--;
		if(this.cooldown==0){
			this.fire();
			this.cooldown=100;
		}
		var velocity = this.getOffset(4, this.facing);
		this.velocity.x=velocity.x;
		this.velocity.y=velocity.y;
		super.step();
	}

	// draw this enemy and its gun
	draw(context){
		super.draw(context);
		this.drawFacing(context, 'rgba(160,100,0,1)');
	}
}


class Bullet extends Ball{
	step(){
		this.position.x=this.position.x+this.velocity.x;
		this.position.y=this.position.y+this.velocity.y;
		this.intPosition();
		this.health-=3;
		if(this.health < 0){
			this.stage.removeActor(this);
			return;
		}
		// check if this bullet hits anything
		for(var i=0;i<this.stage.actors.length;i++){
			var actor = this.stage.actors[i];
			if(this != actor && this.collide(this.x,this.y,actor)){
				actor.onBulletHit();
				stage.removeActor(this);
				return;
			}
		}
		// vanish on wall hit
		// if(this.position.x<0 || this.position.x>this.stage.width || 
		// 	this.position.y<0 || this.position.y>this.stage.height){
		// 	stage.removeActor(this);
		// }

		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
			this.velocity.y=-Math.abs(this.velocity.y);
		}
		
	}
}

class Amunition extends Ball{
	step(){
		return;
	}

	onBulletHit(){
		return;
	}

	getEdges(){
		var leftEdge = Math.round(this.x);
		var rightEdge = Math.round(this.x + this.radius);
		var topEdge = Math.round(this.y);
		var botEdge = Math.round(this.y + this.radius);
		return new Pair(new Pair(leftEdge, rightEdge), new Pair(topEdge, botEdge));
	}

	draw(context){
		// draw the amunition
		context.fillStyle = this.colour;
   		context.fillRect(this.x, this.y, this.radius,this.radius);
	}
	
}