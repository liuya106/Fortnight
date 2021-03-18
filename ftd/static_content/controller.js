var stage=null;
var view = null;
var interval=null;
var credentials={ "username": "", "password":"" };
var start = null;
var remaining = null;
function setupGame(){
	stage=new Stage(document.getElementById('stage'), 'hard');
	// https://javascript.info/keyboard-events
	document.addEventListener('keydown', moveByKey);
        stage.canvas.addEventListener('mousemove', mouseMove);
        stage.canvas.addEventListener('mousedown', mouseFire);
        // var ctx = stage.canvas.getContext("2d");
        // ctx.font = "30px Arial";
        // ctx.fillText("Hello World", 10, 50);
}
function startGame(){
	interval=setInterval(function(){ 
                if(stage.gameLost) clearGame();
                else{
                        stage.step(); stage.draw(); }
                start = new Date();},50);
}
function pauseGame(){
        if (start!=null) remaining = 50 - (new Date() - start)%50;
	clearInterval(interval);
	interval=null;
}

function resumeGame(){
        setTimeout(function(){ 
                if(stage.gameLost) clearGame();
                else{stage.step(); stage.draw();}
                start = new Date();}, remaining);
        interval=setInterval(function(){ 
                if(stage.gameLost) clearGame();
                else{
                        stage.step(); stage.draw(); }
                start = new Date();},50);
        remaining = null;
}

function clearGame(){
        stage.removePlayer(stage.player);
	document.removeEventListener('keydown', moveByKey);
        stage.canvas.removeEventListener('mousemove', mouseMove);
        stage.canvas.removeEventListener('mousedown', mouseFire);
        pauseGame();
        start = null;
        remaining = null;
}
function moveByKey(event){
	var key = event.key;
	var moveMap = { 
		'a': new Pair(-8,0),
		's': new Pair(0,8),
		'd': new Pair(8,0),
		'w': new Pair(0,-8),
                'h': new Pair(0, 0)
	};
	if(key in moveMap){
		stage.player.velocity=moveMap[key];
	} else if(key == 'e'){
                stage.player.interact();
        } else if(key == 'r')
                stage.player.reload();
        else if(key == 'q')
                stage.player.switchWeapon();
}

function mouseFire(){
        stage.player.fire();
}

function mouseMove(event){
	var m = document.getElementById('mouse_coords');
        // get the position of mouse
        var px = stage.player.x - stage.canvas.width/2 + event.offsetX;
        var py = stage.player.y - stage.canvas.height/2 + event.offsetY;
        m.innerHTML = 'mouse coords: ' + px + ', ' + py;

        // // compute the x, y distance from player
        var dx = Math.abs(px - stage.player.x);
        var dy = Math.abs(py - stage.player.y);
        var theta = Math.atan(dy / dx);
        // stage.player.facing = theta;

        // 4 if/elseif clause for quadrant 1-4
        stage.player.face(px, py);

        if(px > stage.player.x && py < stage.player.y){
                // stage.player.quadrant.x = 1;
                // stage.player.quadrant.y = -1;
        }
        else if(px < stage.player.x && py <= stage.player.y){
                theta = Math.PI - theta;
                // stage.player.quadrant.x = -1;
                // stage.player.quadrant.y = -1;
        }
        else if(px < stage.player.x && py > stage.player.y){
                theta += Math.PI;
                // stage.player.quadrant.x = -1;
                // stage.player.quadrant.y = 1;
        }
        else if(px >= stage.player.x && py > stage.player.y){
                theta = Math.PI * 2 - theta;
                // stage.player.quadrant.x = 1;
                // stage.player.quadrant.y = 1;
        }
        
        var deg = theta * (180 / Math.PI);
        m.innerHTML += '; dx: '+ dx + ', dy: ' + dy + ', theta: ' + 
                Math.round(theta * 100) / 100 + ', degree: ' + Math.round(deg);
}



function instruction(){
        $('div[class="ui"]').not('#nav,#instr').each(function(){
                $(this).hide();
        })
        $('#nav,#instr').show();
}

function registered(){
        if ($("#user").val() == ''){
                $("#prompt").html('Username cannot be empty!');
        }else if($("#regis_password").val() == ''){
                $("#prompt").html('Password cannot be empty!');
        }else if ($("#regis_password").val() != $("#again").val()){
                $("#prompt").html('Please make sure passwords match!');
        }else{
                $("#prompt").html('');

                credentials =  { 
                        "username": $("#user").val(), 
                        "password": $("#regis_password").val() 
                };

                $.ajax({
                        method: "POST",
                        url: "/api/auth/register",
                        data: JSON.stringify({}),
                        headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                        processData:false,
                        contentType: "application/json; charset=utf-8",
                        dataType:"json"
                }).done(function(data, text_status, jqXHR){
                        console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
                        login();
                }).fail(function(err){
                        console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
                });
        }
}

function registration(){
        $("#login").on('click', function(){login();});

        $('div[class="ui"]').not('#registration').each(function(){
                $(this).hide();
        })
        $("#registration").show();

        $("#registerSubmit").on('click', function(){registered();});
}


function play(){
        $("#logout").on('click', function(){ clearGame(); login();} );
        $("#instruction").on('click', function(){ pauseGame(); instruction();});
        $("#play").on('click', function(){
                if (stage.gameLost) {$("#lose_msg").hide();loggedin();}
                else play();
        });


        $('div[class="ui"]').not('#nav,#ui_play,#lose_msg').each(function(){
                $(this).hide();
        })
        if (remaining != null) resumeGame();
        if(stage.gameLost) {
                $("#lose_msg, #nav").show();
                $("#ui_play").hide();
                clearGame();
        }else {
                $("#ui_play,#nav").show();
                $("#lose_msg").hide();
        }       

}

function loggedin(){
        if ($("#username").val() == ''){
                $("#prom").html('Username cant be empty!');
        }else if($("#password").val() == ''){
                $("#prom").html('Password cant be empty!');
        }else{
                $("#prom").html('');
                credentials =  { 
                        "username": $("#username").val(), 
                        "password": $("#password").val() 
                };

                $.ajax({
                        method: "POST",
                        url: "/api/auth/login",
                        data: JSON.stringify({}),
                        headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                        processData:false,
                        contentType: "application/json; charset=utf-8",
                        dataType:"json"
                }).done(function(data, text_status, jqXHR){
                        console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
                        clearInterval(interval);
                        setupGame();
                        startGame();
                        play();
                }).fail(function(err){
                        console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
                        $('#prom').html('username and password don"t match!');
                });
        }
}


function login(){
        $("#loginSubmit").on('click',function(){ loggedin(); });
        $("#register").on('click', function(){ registration(); });

        $('div[class="ui"]').not('#ui_login').each(function(){
                $(this).hide();
        });
        $('#ui_login').show();
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
        login();
});

