
var utils,
  sc,
  graphics,
  input,
  player,
  opponent;

window.onload = function(){
  utils = new Utils();
  graphics = new Graphics();
  input = new Input();
  sc = new ServerConnect();
  sc.lets_play();
  input.init();
};


var Player = function(){
  this.score = 0;
  this.upgrade_points = 0;
  this.reverse_meter = 0;
  this.avatar = new Avatar;
};


var Avatar = function(){
  this.position = {x:0,y:0};
  this.radius = 25;
  this.color = 'red';
  this.speed = 10;
  this.level = 1;
  this.level_up = [0,20,30,40,50,60,70,80,90,100];
}

Avatar.prototype.move = function(){
  var move_array = utils.normalize(player.avatar.position.x, player.avatar.position.y, input.mouse.x, input.mouse.y);
  player.avatar.position.x += move_array[0];
  player.avatar.position.y += move_array[1];
}

var Utils = function(){};
Utils.prototype.normalize = function(from_x, from_y, to_x, to_y){
  x_dif = to_x - from_x;
  y_dif = to_y - from_y;
  hyp = (x_dif*x_dif)+(y_dif*y_dif);
  hyp = Math.sqrt(hyp);
  return [(x_dif/hyp),(y_dif/hyp)];
};


var Graphics = function(){
  this.canvas = document.getElementById('game_canvas');
  this.context = this.canvas.getContext('2d');
  // this.draw_lists = [[],[],[]]; //[background, forground, particle layer]
  this.camera = {x: 0, y:0};

  // Game.graphics.image = document.createElement('img');
  // Game.graphics.image.src = 'sprites.png';
};

Graphics.prototype.draw = function(){
  var ctx = this.context;
  //clear slate
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  //draw playerA
  ctx.beginPath();
  ctx.arc(player.avatar.position.x, player.avatar.position.y, 25, 0, 2 * Math.PI, false);
  ctx.fillStyle = player.avatar.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#003300';
  ctx.stroke();
  //draw PlayerB
  ctx.beginPath();
  ctx.arc(opponent.avatar.position.x, opponent.avatar.position.y, 25, 0, 2 * Math.PI, false);
  ctx.fillStyle = opponent.avatar.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#003300';
  ctx.stroke();
};

var Input = function(){
  this.mouse = {x:0,y:0};
  this.button_u = false;
  this.button_r = false;
  var id_to_key = {'U+0055':'u', 'U+0052':'r'};
};

Input.prototype.init = function(){
  var canvas = document.getElementById('game_canvas');
  var mouse = this.mouse;
  canvas.addEventListener('mousemove',function(event){
    mouse.x = event.x - canvas.offsetLeft;
    mouse.y = event.y - canvas.offsetTop;
  });
  canvas.addEventListener('mouseleave',function(event){
    player.stop_moving = true;
  });
  canvas.addEventListener('mouseenter',function(event){
    player.stop_moving = false;
  });
};



var ServerConnect = function(){
  this.socket = io.connect(document.location.href);
  var opponent_socket;

  this.lets_play = function(){
    this.socket.emit('lets_play',{})
  }


  this.socket.on('game_start', function(data){
    player = new Player();
    opponent = new Player();
    if (data.game_host){
      player.avatar.color = 'red';
      player.avatar.position.x = 50;
      player.avatar.position.y = 50;
      opponent.avatar.color = 'blue';
      opponent.avatar.position.x = 500;
      opponent.avatar.position.y = 500;
    }else{
      opponent.avatar.color = 'red';
      opponent.avatar.position.x = 50;
      opponent.avatar.position.y = 50;
      player.avatar.color = 'blue';
      player.avatar.position.x = 500;
      player.avatar.position.y = 500;
      
    }
    setInterval(function(){
      player.stop_moving || player.avatar.move();
      sc.socket.emit('game_update', {opponent_pos: player.avatar.position});
      graphics.draw();
    },34);
    // document.body.addEventListener('click',function(){
    //   player.avatar.position.x +=10;
    // });
  });

  this.socket.on('game_update', function(data){
    if (data.opponent_pos){
      opponent.avatar.position = data.opponent_pos;
    }
  });
};















