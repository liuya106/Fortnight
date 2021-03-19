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
        clearInterval(interval);
        interval=null;
        start = null;
        remaining = null;
}
function moveByKey(event){
	var key = event.key.toLowerCase();
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

// LMB to fire
function mouseFire(){
        stage.player.fire();
}

// player turret follows mouse
function mouseMove(event){
        // get the position of mouse
        var offset = stage.getTranslation();
        var px = event.offsetX - offset.x;
        var py = event.offsetY - offset.y;

        stage.player.face(px, py);
}

function instruction(){
        $('div[class="ui"]').not('#nav,#instr').each(function(){
                $(this).hide();
        })
        $('nav button').not('#instruction').each(function(){
                $(this).css({'background-color':'#0190F5', 'color':'white'});
        })
        $('#nav,#instr').show();
        $('#instruction').css({'background-color':'grey', 'color':'black'});
}

function registered(e){
        if(!$("#form")[0].checkValidity()) return;
        e.preventDefault();

        if ($("#regis_password").val() != $("#again").val()){
                $("#prompt").html('Please make sure passwords match!');
        }else{
                $("#prompt").html('');

                credentials =  { 
                        "username": $("#user").val(), 
                        "password": $("#regis_password").val() 
                };

                $.ajax({
                        method: "POST",
                        url: "/api/register",
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
                        $("#prompt").html('register failed: user already exist!');
                });
        }
}

function registration(){
        $('div[class="ui"]').not('#registration').each(function(){
                $(this).hide();
        })
        $("#registration").show();

}


function play(){
        $('div[class="ui"]').not('#nav,#ui_play,#lose_msg').each(function(){
                $(this).hide();
        })
        $('nav button').not('#play').each(function(){
                $(this).css({'background-color':'#0190F5', 'color':'white'});
        })
        $('#play').css({'background-color':'grey', 'color':'black'});
        if (remaining != null && !stage.gameLost) {console.log(stage.gameLost);
                resumeGame();}
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
                        $('#prom').html("username and password don't match!");
                });
        }
}

// show the login screen
function login(){
        $('div[class="ui"]').not('#ui_login').each(function(){
                $(this).hide();
        });
        $('#ui_login').show();
}

function profile(){
        $('div[class="ui"]').not('#prof,#nav').each(function(){
                $(this).hide();
        });
        $('nav button').not('#profile').each(function(){
                $(this).css({'background-color':'#0190F5', 'color':'white'});
        })
        $('#profile').css({'background-color':'grey', 'color':'black'});
        $('#prof,#nav').show();
        $('#info').html('Username: '+credentials['username']+
                '<br/>Password: '+credentials['password']);
}

function stats(){
        $('div[class="ui"]').not('#statistics,#nav').each(function(){
                $(this).hide();
        });
        $('nav button').not('#stats').each(function(){
                $(this).css({'background-color':'#0190F5', 'color':'white'});
        })
        $('#stats').css({'background-color':'grey', 'color':'black'});
        $('#statistics,#nav').show();
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


// function retrievePlayers(){
//         $.ajax({
//                 method: "GET",
//                 url: "/api/auth/statistics",
//                 processData:false,
//                 headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
//                 contentType: "application/json; charset=utf-8",
//                 dataType:"json"
//         }).done(function(data, text_status, jqXHR){
//                 console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
//                 var stats="";
//                 for (var player in data){
//                         stats += "<br/>"+ player +" "+data[player]; 
//                 }
//                 $("#statistics").html(stats);
//         }).fail(function(err){
//                 console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
//         });
// }


function updateScore(score){
        $.ajax({
                method: "PUT",
                url: "/api/auth/update",
                processData:false,
                headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + score) },
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function getScore(score){
        $.ajax({
                method: "GET",
                url: "/api/auth/update",
                processData:false,
                headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + score) },
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
                

        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

function deletePlayer(){
        $.ajax({
                method: "DELETE",
                url: "/api/auth/delete",
                processData:false,
                headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
                contentType: "application/json; charset=utf-8",
                dataType:"json"
        }).done(function(data, text_status, jqXHR){
                console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
        }).fail(function(err){
                console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
        });
}

$(function(){
        // Setup all events here and display the appropriate UI
        $('#delete').on('click', function(){clearGame(); deletePlayer(); login();});
        $('#profile').on('click', function(){pauseGame(); profile();});
        $('#stats').on('click', function(){pauseGame();stats();});
        $("#loginSubmit").on('click',function(){ loggedin(); });
        $("#register").on('click', function(){ registration(); });
        $("#login").on('click', function(){login();});
        $("#registerSubmit").on('click', function(e){registered(e);});
        $("#logout").on('click', function(){ clearGame(); login();} );
        $("#instruction").on('click', function(){ pauseGame(); instruction();});
        $("#play").on('click', function(){ play();});
        // $('#stats').on('click', function(){pauseGame();retrievePlayers();});
        login();
});

