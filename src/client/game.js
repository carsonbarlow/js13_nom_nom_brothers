
var utils,
  sc,
  graphics,
  input,
  player,
  opponent,
  screen_width = 720,
  screen_height = 640;

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
  this.speed = 150;
  this.level = 1;
  this.level_up = [0,20,30,40,50,60,70,80,90,100];
}

Avatar.prototype.move = function(delta){
  var move_array = utils.normalize((player.avatar.position.x - graphics.camera.x), player.avatar.position.y - graphics.camera.y, input.mouse.x, input.mouse.y);
  player.avatar.position.x += move_array[0]*player.avatar.speed*delta;
  player.avatar.position.y += move_array[1]*player.avatar.speed*delta;
}

var Arena = function(){
  this.width = 1200;
  this.height = 1200;
};

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
  this.camera.x = player.avatar.position.x - (screen_width/2);
  this.camera.y = player.avatar.position.y - (screen_height/2);
  if (this.camera.x < 0){this.camera.x = 0;}
  if (this.camera.x > 1200 - screen_width) {this.camera.x = 1200 - screen_width;}
  if (this.camera.y < 0){this.camera.y = 0}
  if (this.camera.y > 1200 - screen_height){this.camera.y = 1200 - screen_height;}
  //clear slate
  ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


  ctx.save();

  ctx.fillStyle = "rgba(255, 255, 255, 0.0)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  for (var i = 0; i < 64; i++){
    ctx.beginPath();
    ctx.arc(((i%8)*150)+75-this.camera.x,(parseInt(i/8)*150)+75-this.camera.y, 10, 0, 2 * Math.PI, false);
    ctx.stroke();
  }

  //draw border
  ctx.lineWidth = 15;
  ctx.strokeStyle = '#996600';
  ctx.beginPath();
  ctx.rect(0-this.camera.x,0-this.camera.y,1200,1200);
  ctx.stroke();

  //draw PlayerB
  ctx.beginPath();
  ctx.arc(opponent.avatar.position.x - this.camera.x, opponent.avatar.position.y - this.camera.y, 25, 0, 2 * Math.PI, false);
  ctx.fillStyle = opponent.avatar.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#003300';
  ctx.stroke();

  //draw playerA
  ctx.beginPath();
  ctx.arc(player.avatar.position.x - this.camera.x, player.avatar.position.y - this.camera.y, 25, 0, 2 * Math.PI, false);
  ctx.fillStyle = player.avatar.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#003300';
  ctx.stroke();

  ctx.restore();
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
    Game.paused = false;
  });

  this.socket.on('game_update', function(data){
    if (data.opponent_pos){
      opponent.avatar.position = data.opponent_pos;
    }
  });
};


Game.paused = true;
  Game.update = function(delta){
    if (!Game.paused){
      player.stop_moving || player.avatar.move(delta);
      
      // graphics.draw();
      // Game.update_player(Game.player, delta);
      // if (!Game.player.isDead){
      //   Game.update_projectiles(delta);
      //   Game.update_enemies(delta);
      //   Game.update_battle_master(Game.bm,delta);
      // }
    }
  };

  Game.run = (function() {
    var update_interval = 1000 / Game.config.fps;
    start_tick = next_tick = last_tick = (new Date).getTime();
    num_frames = 0;

    return function() {
      current_tick = (new Date).getTime();
      while ( current_tick > next_tick ) {
        delta = (current_tick - last_tick) / 1000;
        Game.update(delta);
        next_tick += update_interval;
        last_tick = (new Date).getTime();
      }

      (graphics && player) && graphics.draw();
      (sc && player) && sc.socket.emit('game_update', {opponent_pos: player.avatar.position});


      fps = (num_frames / (current_tick - start_tick)) * 1000;
      // Game.graphics.fps_counter.textContent = Math.round(fps);
      num_frames++;
    }
  })();

  if( window.requestAnimationFrame) {
    window.each_frame = function(cb) {
      var _cb = function() { cb(); requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    window.each_frame = function(cb) {
      var _cb = function() { cb(); mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    window.each_frame = function(cb) {
      setInterval(cb, 1000 / Game.config.fps);
    }
  }
  window.each_frame(Game.run);












