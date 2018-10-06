var express = require("express");

var app = express();
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
}
var server = app.listen(port);

app.use(express.static("public"));

var socket = require("socket.io");
var io = socket(server);

console.log("Server running");

io.sockets.on("connection", newConnection);

var clientList = [""];
var snakeList = [];
var host = "";
var connectedClients = 0;

function newConnection(socket){
	connectedClients++;
	//Find space in clientList
	var spotFound = false;
	for(var i = 0; i < clientList.length; i++){
		if(clientList[i] == ""){
			clientList[i] = socket.id;
			i = clientList.length;
			spotFound = true;
		}
	}
	if(!spotFound){
		clientList.push(socket.id);
	}
	if(host == ""){
		host = socket.id;
	}
	logClientList();

	if(socket.id == host){
		socket.emit('youreHost',true);
	}

	socket.on('disconnect',disconnect);
	socket.on('snakeInit',snakeInit);
	socket.on('updateSnake', updateSnake);
	socket.on('newFoodPos',newFoodPos);

	function newFoodPos(data){
		socket.broadcast.emit('updateFood',data);
	}

	function updateSnake(data){
		for(var i = 0; i < snakeList.length; i++){
			if(snakeList[i] == socket.id){
				snakeList[i] = data;
			}
		}
		socket.broadcast.emit('snakeUpdate',data);
	}

	function snakeInit(data){
		data.idName = socket.id;
		var snakePosFound = false;
		for(var i = 0; i < snakeList.length; i++){
			if(snakeList[i] == ""){
				snakeList[i] = data;
				i = snakeList.length;
				snakePosFound = true;
			}
		}
		if(!snakePosFound){
			snakeList.push(data);
		}

		console.log(snakeList);

		io.sockets.emit('updateSnakeList',snakeList);
	}

	function disconnect(){
		connectedClients--;
		console.log(socket.id + " left");
		removeFromList();
		if(socket.id == host){
			newHost();
		}
		logClientList();
	}

	function removeFromList(){
		for(var i = 0; i < clientList.length; i++){
			if(clientList[i] == socket.id){
				clientList[i] = "";
				i = clientList.length;
			}
		}
		for(var i = 0; i < snakeList.length; i++){
			if(snakeList[i].idName == socket.id){
				snakeList[i] = "";
			}
		}
	}

	function newHost(){
		var foundNew = false;
		for(var i = 0; i < clientList.length; i++){
			if(clientList[i] != ""){
				host = clientList[i];
				foundNew = true;
				io.to(`${host}`).emit('youreHost', true);
			}
		}
		if(!foundNew){
			host = "";
		}
	}

	function logClientList(){
		console.log("--------------------------------------")
		for(var i = 0; i < clientList.length; i++){
			if(clientList[i] == host){
				console.log(clientList[i] + " HOST");
			}else if(clientList[i] != host){
				console.log(clientList[i]);
			}else{

			}
		}
		console.log("Connected clients = " + connectedClients);
	}
}