var cols = 10;
var rows = 10;
var rectSize = 15;
var grid;

var socket;

var isHost = false;
var allowMovement = true;

var snakeArray = [];

function pos(){
  this.x = -1;
  this.y = -1;
}

function Food(){
  this.x = 3;
  this.y = 6;
}

var food = new Food();

function Snake() {
  /*this.variables = {
    x: 0,
    y: 0,
  }*/
  this.x = 0;
  this.y = 0;

  this.idName = "";
  
  this.dead = false;
  
  this.tailSize = 5;
  this.lastPos = [];
  
  this.dir = {
    x: 0,
    y: 0
  }
  
  this.move = function(){
    if(!this.dead){
      var coor = {
        x: this.x,
        y: this.y
      }

      //this.lastPosController();
    
      this.x+=this.dir.x;
      this.y+=this.dir.y;
      if(this.x == -1 || this.x == cols || this.y == -1 || this.y == rows){
        this.death();
      }

      for(var i = 0; i < snakeArray.length; i++){
        if(snakeArray[i].idName == socket.id){
          socket.emit('updateSnake',snakeArray[i]);
          i = snakeArray.length;
        }
      }

    }

    foodController();
  }
  
  this.lastPosController = function(){
    for(var i = this.lastPos.length-1; i >= 0; i--){
      if(i === 0){
        this.lastPos[i] = new pos();
        this.lastPos[i].x = this.x;
        this.lastPos[i].y = this.y;
      }else{
        this.lastPos[i] = this.lastPos[i-1];
      }
    }
  }
  
  this.drawTail = function(){
    for(var i = 0; i < this.lastPos.length; i++){
      if(this.idName == socket.id){
        fill(0,255,0);
      }else{
        fill(0,0,255);
      }
      rect(this.lastPos[i].x*rectSize,this.lastPos[i].y*rectSize,rectSize,rectSize);
      //rect(0,0,rectSize,rectSize);
    }
  }
  
  this.tailLengthener = function(){
    this.lastPos.push(new pos());
  }
  
  this.death = function(){
    this.dead = true;
  }
  
  this.show = function(){
    if(this.idName == socket.id){
      fill(0,255,0);
    }else{
      fill(0,0,255);
    }
    rect(this.x*rectSize,this.y*rectSize,rectSize,rectSize);
    this.drawTail();
  }
}

function setup() {
  createCanvas(cols*rectSize+1,rows*rectSize+1);

  socket = io.connect('http://localhost:3001/');
  socket.on('updateSnakeList',updateSnakeList);
  socket.on('snakeUpdate', snakeUpdate);
  socket.on('youreHost',youreHost);
  socket.on('updateFood',updateFood);
  
  snake = new Snake();
  socket.emit('snakeInit',snake);
  //snakeArray.push(snake);
  
  frameRate(3);
  strokeWeight(0);
  
  grid = make2DArray();
  //relocateFood();
  drawGrid();
}

function updateFood(data){
  food = data;
}

function updateSnakeList(data){
  for(var i = 0; i < data.length; i++){
    snakeArray[i] = new Snake();
    snakeArray[i].x = data[i].x;
    snakeArray[i].y = data[i].y;
    snakeArray[i].dead = data[i].dead;
    snakeArray[i].tailSize = data[i].tailSize;
    snakeArray[i].lastPos = data[i].lastPos;
    snakeArray[i].idName = data[i].idName;
  }
}

function snakeUpdate(data){
  for(var i = 0; i < snakeArray.length; i++){
    if(snakeArray[i].idName == data.idName){
      snakeArray[i].x = data.x;
      snakeArray[i].y = data.y;
      snakeArray[i].dead = data.dead;
      snakeArray[i].tailSize = data.tailSize;
      snakeArray[i].lastPos = data.lastPos;
      snakeArray[i].idName = data.idName;
    }
  }
}

function youreHost(data){
  isHost = data;
}

function handleSnakes(){
  for(var i = 0; i < snakeArray.length; i++){
    if(snakeArray[i] !== ""){
      if(snakeArray[i].idName == socket.id && !snakeArray[i].dead){
        snakeArray[i].lastPosController();
      }
      snakeArray[i].move();
      snakeArray[i].show();
    }
  }
}

function moveSnakes(){
  drawGrid();
  drawFood();
  handleSnakes();
  checkForCollision();
}

function foodController(){
  for(var i = 0; i < snakeArray.length; i++){
    if(food.x == snakeArray[i].x && food.y == snakeArray[i].y){
      snakeArray[i].tailLengthener();
      if(isHost){
        relocateFood();
      }
    }
  }
}

function drawFood(){
  fill(200,0,0);
  rect(food.x*rectSize,food.y*rectSize,rectSize,rectSize);
}

function relocateFood(){
    food.x = floor(random(cols));
    food.y = floor(random(rows));
    for(var i = 0; i < snakeArray.length; i++){
      if(snakeArray[i].x == food.x && snakeArray[i].y == food.y){
        relocateFood();
      }
    
      for(var j = 0; j < snakeArray[i].lastPos.length; j++){
        if(snakeArray[i].lastPos[j].x == food.x && snakeArray[i].lastPos[j].y == food.y){
          relocateFood();
        }
     }   
    }
    socket.emit('newFoodPos',food);
}

function checkForCollision(){
  for(var i = 0; i < snakeArray.length; i++){
    for(var j = 0; j < snakeArray.length; j++){
      if(i != j){
        if(snakeArray[i].x == snakeArray[j].x && snakeArray[i].y == snakeArray[j].y){
          print("HEAD COLLISION");
        }
      }
      for(var l = 0; l < snakeArray[j].lastPos.length; l++){
        if(snakeArray[i].x == snakeArray[j].lastPos[l].x && snakeArray[i].y == snakeArray[j].lastPos[l].y){
          snakeArray[i].death();
        }
      }
    }
  }
}

function keyTyped() {
  var posI = 0;
  for(var i = 0; i < snakeArray.length; i++){
    if(snakeArray[i].idName == socket.id){
      posI = i;
      i = snakeArray.length;
    }
  }
  switch(key){
    case 'w':
      snakeArray[posI].dir.x = 0;
      snakeArray[posI].dir.y = -1;
      break;
    case 's':
      snakeArray[posI].dir.x = 0;
      snakeArray[posI].dir.y = 1;
      break;
    case 'a':
        snakeArray[posI].dir.x = -1;
        snakeArray[posI].dir.y = 0;
      break;
    case 'd':
        snakeArray[posI].dir.x = 1;
        snakeArray[posI].dir.y = 0;
      break;
    case 'p':
        allowMovement = false;
      break;
    case 'o':
        allowMovement = true;
      break;
  }
  //drawGrid();
}

function make2DArray(){
  var array = new Array(cols);
  for(var i = 0; i < array.length; i++){
    array[i] = new Array(rows);
  }
  return array;
}

function drawGrid(){
  var x = 0; 
  var y = 0;
  for(var i = 0; i < cols; i++){
    for(var j = 0; j < rows; j++){
      fill(200);
      rect(x,y,rectSize,rectSize)
      x += rectSize;
    }
    x = 0; 
    y += rectSize;
  }
  
  drawFood();
}

function draw() {
  if(allowMovement){
    moveSnakes();
  }
}