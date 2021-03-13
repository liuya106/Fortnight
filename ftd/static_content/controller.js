var stage=null;
var view = null;
var interval=null;
var credentials={ "username": "", "password":"" };
function setupGame(){
	stage=new Stage(document.getElementById('stage'));

	// https://javascript.info/keyboard-events
	document.addEventListener('keydown', moveByKey);
        stage.canvas.addEventListener('mousemove', mouseMove);
        stage.canvas.addEventListener('mousedown', mouseFire);
}
function startGame(){
	interval=setInterval(function(){ stage.step(); stage.draw(); },100);
}
function pauseGame(){
	clearInterval(interval);
	interval=null;
}
function moveByKey(event){
	var key = event.key;
	var moveMap = { 
		'a': new Pair(-15,0),
		's': new Pair(0,15),
		'd': new Pair(15,0),
		'w': new Pair(0,-15),
                'h': new Pair(0, 0)
	};
	if(key in moveMap){
		stage.player.velocity=moveMap[key];
	}
}

function mouseFire(){
        stage.player.fire();
}

function mouseMove(event){
	var m = document.getElementById('mouse_coords');
        var px = stage.player.x - stage.canvas.width/2 + event.offsetX;
        var py = stage.player.y - stage.canvas.height/2 + event.offsetY;
        m.innerHTML = 'mouse coords: ' + px + ', ' + py;

        var dx = Math.abs(px - stage.player.x);
        var dy = Math.abs(py - stage.player.y);
        var theta = Math.atan(dy / dx);
        stage.player.facing = theta;

        if(px > stage.player.x && py < stage.player.y){
                stage.player.quadrant.x = 1;
                stage.player.quadrant.y = -1;
        }
        else if(px < stage.player.x && py <= stage.player.y){
                theta = Math.PI - theta;
                stage.player.quadrant.x = -1;
                stage.player.quadrant.y = -1;
        }
        else if(px < stage.player.x && py > stage.player.y){
                theta += Math.PI;
                stage.player.quadrant.x = -1;
                stage.player.quadrant.y = 1;
        }
        else if(px >= stage.player.x && py > stage.player.y){
                theta = Math.PI * 2 - theta;
                stage.player.quadrant.x = 1;
                stage.player.quadrant.y = 1;
        }
        
        var deg = theta * (180 / Math.PI);
        m.innerHTML += '; dx: '+ dx + ', dy: ' + dy + ', theta: ' + 
                Math.round(theta * 100) / 100 + ', degree: ' + Math.round(deg);
}

function login(){
        $("#ui_login").hide();
        $("#ui_play").show();

        setupGame();
        startGame();

	// credentials =  { 
	// 	"username": $("#username").val(), 
	// 	"password": $("#password").val() 
	// };

        // $.ajax({
        //         method: "POST",
        //         url: "/api/auth/login",
        //         data: JSON.stringify({}),
	// 	headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
        //         processData:false,
        //         contentType: "application/json; charset=utf-8",
        //         dataType:"json"
        // }).done(function(data, text_status, jqXHR){
        //         console.log(jqXHR.status+" "+text_status+JSON.stringify(data));

        // 	$("#ui_login").hide();
        // 	$("#ui_play").show();

	// 	setupGame();
	// 	startGame();

        // }).fail(function(err){
        //         console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        // });
}

// Using the /api/auth/test route, must send authorization header
function test(){
        $.ajax({
                method: "GET",
                url: "/api/auth/test",
                data: {},
		headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

$(function(){
        // Setup all events here and display the appropriate UI
        $("#loginSubmit").on('click',function(){ login(); });
        $("#ui_login").show();
        $("#ui_play").hide();
});

