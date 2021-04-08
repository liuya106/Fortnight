var view = null;
var credentials={ "username": "", "password":"" };
var canvas = null;

var ws = null;


class Page extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			state: 'Login',
			userErrorText: '',
			passErrorText: '',
			loginErrorText: '',
			updateErrorText: '',
			lost: false
		};
	}
	
	handleLogin = (username, password) => {
		this.setState({loginErrorText: ''});
		credentials =  { 
			"username": username, 
			"password": password
		};
		$.ajax({
			method: "POST",
			url: "/api/auth/login",
			data: JSON.stringify({}),
			headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
			processData:false,
			contentType: "application/json; charset=utf-8",
			dataType:"json"
		}).done((data, text_status, jqXHR) => {
			console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			credentials.token = data.token;
			this.connect();
		}).fail((err) =>{
			console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
			this.setState({loginErrorText: 'Incorrect password'})
		});
	}

	connect = () => {
		ws = new WebSocket(`ws://${window.location.hostname}:8001`);
		ws.onopen = function (event) {
			send("login", {"token": credentials.token});
		};
		ws.onclose = function (event) {
			console.log("Disconnected");
		};
		ws.onmessage = (event) => {
			this.handleMessage(event);
		};
	}

	handleMessage = (event) => {
		var data = JSON.parse(event.data);
		if(data.type == undefined || data.value == undefined) {
			console.log("bad message");
			console.log(data);
			return;
		}
		switch(data.type){
			case "user":
				if(data.value == "loginSuccess"){
					this.setState({state: 'Play', lost: false});
					document.addEventListener('keydown', this.moveByKey);
					this.setupView();
				} else{
					console.log("Unauthorized");
				}
				break;
			case "game":
				if(this.state.state == "Play") 
					this.view.draw(data.value);
				break;
			case "gameLost":
				this.setState({lost: true});
				break;
			case "gameParams":
				if(this.view == null) return;
				this.width = data.value.width;
				this.height = data.value.height;
				this.view.stageWidth = this.width;
				this.view.stageHeight = this.height;
		};
	}

	handleRegister = (username, password, passAgain) =>{
		if (password != passAgain){
			this.setState({passErrorText: "Passwords do not match"});
			$("#prompt").html('Please make sure your passwords match');
		} else{
			$("#prompt").html('');
			this.setState({userErrorText: '', passErrorText: ''})
			credentials =  { 
				"username": username, 
				"password": password
			};
	
			$.ajax({
				method: "POST",
				url: "/api/register",
				data: JSON.stringify({}),
				headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
				processData:false,
				contentType: "application/json; charset=utf-8",
				dataType:"json"
			}).done((data, text_status, jqXHR) => {
				this.showLogin();
				$('#registermsg').html("Registration successful.");
				console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			}).fail((err) => {
				console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
				this.setState({userErrorText: "User already exists!"});
			});
		}
	}

	handleLogout = () =>{
		if(ws != null) ws.close();
		this.showLogin();
	}

	deleteProfile = () =>{
		this.setState({updateErrorText: ''});

		$.ajax({
			method: "DELETE",
			url: "/api/auth/delete",
			processData:false,
			headers: { "Authorization": "Basic " + btoa(credentials.username + ":" + credentials.password) },
			contentType: "application/json; charset=utf-8",
			dataType:"json"
		}).done((data, text_status, jqXHR) => {
			console.log(jqXHR.status+" "+text_status+JSON.stringify(data));
			this.handleLogout();
		}).fail(function(err){
			console.log("fail "+err.status+" "+JSON.stringify(err.responseJSON));
		});
	}

	handleUpdate = (username, password, passAgain) =>{
		if(password != passAgain){
			this.setState({updateErrorText: "Passwords do not match"});
			$('#profileTip').html("");
		}
		else {
			this.setState({updateErrorText: ""});
			$('#profileTip').html("Update successful.");
		}
	}

	showRegister = () =>{
		this.setState({state: 'Register', userErrorText: '', passErrorText: ''});
	}
	showLogin = () =>{
		this.setState({state: 'Login', loginErrorText: ''});
	}
	showPlay = () =>{
		this.setState({state: 'Play'});
	}
	showInstr = () =>{
		this.setState({state: 'Instruction'});
	}
	showStats = () =>{
		this.setState({state: 'Stats'});
	}
	showProf = () =>{
		this.setState({state: 'Profile', updateErrorText: ''});
	}
	resumePlay = () =>{
		this.setState({state: 'Play'});
		this.setupView();
		if(this.width != undefined) this.view.stageWidth = this.width;
		if(this.height != undefined) this.view.stageHeight = this.height;
	}

	moveByKey = (event) => {
		if(this.state.state != 'Play') return;
		var key = event.key.toLowerCase();
		var moveMap = { 
			'a': new Pair(-8,0),
			's': new Pair(0,8),
			'd': new Pair(8,0),
			'w': new Pair(0,-8),
			'h': new Pair(0, 0)
		};
		if(key in moveMap){
			send("move", moveMap[key]);
		} else if(key == 'e'){
			send("interact", key);
		} else if(key == 'r')
			send("reload", key);
		else if(key == 'q')
			send("switch", key);
	}

	// LMB to fire
	mouseFire = (event) => {
		var data = {
			"qx": this.view.quadrantX,
			"qy": this.view.quadrantY,
			"theta": this.view.theta
		};
		send("shoot", data);
	}
	// player turret follows mouse
	mouseMove = (event) => {
		if(event.offsetX != null && event.offsetY != null)
			this.view.trackMouse(event.offsetX, event.offsetY);
	}
	setupView = () => {
		canvas = document.getElementById("stage");
		this.view = new View(canvas, credentials["username"]);
	}


	render(){
		return(
			<div>
				<Logo />
				<LoginForm state={this.state.state} handleSubmit={this.handleLogin} showRegister={this.showRegister} loginErrorText={this.state.loginErrorText} />
				<RegistrationForm state={this.state.state} handleSubmit={this.handleRegister} showLogin={this.showLogin} userErrorText={this.state.userErrorText} passErrorText={this.state.passErrorText} />
				<Navigation state={this.state.state} showPlay={this.resumePlay} showInstr={this.showInstr} showStats={this.showStats} showProf={this.showProf} showLogin={this.handleLogout} />
				<PlayArea state={this.state.state} mouseMove={this.mouseMove} mouseFire={this.mouseFire} keydown={this.moveByKey} lost={this.state.lost} />
				<Instruction state={this.state.state} />
				<Stats state={this.state.state} score={this.view==undefined? 0:this.view.score} shot={this.view==undefined? 0:this.view.shot} />
				<Profile state={this.state.state} username={credentials.username} updateErrorText={this.state.updateErrorText} handleSubmit={this.handleUpdate} handleDelete={this.deleteProfile} />
				{/* <Navigation /> */}
			</div>
		);
	}
}


function send(action, value){
	const msg = {"action": action, "value": value};
	ws.send(JSON.stringify(msg));
}

ReactDOM.render(<Page />, document.getElementById('root'));
