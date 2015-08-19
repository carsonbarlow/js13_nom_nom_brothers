
var utils,
  sc,
  nm,
  graphics,
  input,
  player,
  opponent,
  rolling_niblit_id = 1,
  niblits_eaten = [],
  host_interval,
  spawn_interval,
  SCREEN_WIDTH = 720,
  SCREEN_HEIGHT = 640
  ARENA_WIDTH = 1200,
  ARENA_HEIGHT = 1200,
  MAX_NIBLITS = 200;

window.onload = function(){
  utils = new Utils();
  graphics = new Graphics();
  input = new Input();
  sc = new ServerConnect();
  nm = new NiblitManager();
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
  //collision detection
  for (var i = 0; i < nm.niblits.length; i++){
    if (utils.proximity(player.avatar.position, nm.niblits[i]) < player.avatar.radius + nm.niblits[i].size){
      var n = nm.niblits.splice(i,1);
      i--;
      niblits_eaten.push(n[0].n_id);
    }
  }
}

var Niblit = function(config){
  this.x = config.x;
  this.y = config.y;
  this.size = config.size;
  this.points = config.points;
  this.n_id = rolling_niblit_id;
  rolling_niblit_id++;
};

var NiblitManager = function(){
  this.niblits = [];
  this.niblit_factory = new NiblitFactory(this);
  this.avatars = [];
  this.pending_niblits = [];
}

NiblitManager.prototype.ready_niblit_batch = function(){
  var min, max, rank, x, y;
  min = this.avatars[0].level;
  max = min;
  if (this.avatars[1].level > max){
    max = this.avatars[1].level;
  }else{
    min = this.avatars[1].level;
  }
  niblit_batch = [];
  for (var i = 0; i < 20; i++){
    if (this.niblits.length + i >= MAX_NIBLITS){break;}
    rank = Math.round(Math.random()*(max-min))+min;
    x = parseInt(Math.random()*ARENA_WIDTH);
    y = parseInt(Math.random()*ARENA_HEIGHT);
    niblit_batch.push({rank: rank, x: x, y: y});
  }
  sc.socket.emit('game_update_both', {niblit_batch: niblit_batch});
};

var NiblitFactory = function(niblit_manager){
  var niblit_rank_to_size = [0,4,10,16,24,32];
  this.make_niblit = function(){
    if (!niblit_manager.pending_niblits.length){return;}
    var config = niblit_manager.pending_niblits.shift();
    var n = new Niblit({x: config.x, y: config.y, size: niblit_rank_to_size[config.rank], points: config.rank}); //may refactor this to make more sense.
    niblit_manager.niblits.push(n);
  };
};

var Utils = function(){};
Utils.prototype.normalize = function(from_x, from_y, to_x, to_y){
 var  x_dif = to_x - from_x;
  var y_dif = to_y - from_y;
  var hyp = (x_dif*x_dif)+(y_dif*y_dif);
  hyp = Math.sqrt(hyp);
  return [(x_dif/hyp),(y_dif/hyp)];
};
Utils.prototype.proximity = function(obj_1,obj_2){
  var x_dif = obj_2.x - obj_1.x;
  var y_dif = obj_2.y - obj_1.y;
  return Math.sqrt((x_dif*x_dif)+(y_dif*y_dif));
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
  this.camera.x = player.avatar.position.x - (SCREEN_WIDTH/2);
  this.camera.y = player.avatar.position.y - (SCREEN_HEIGHT/2);
  if (this.camera.x < 0){this.camera.x = 0;}
  if (this.camera.x > ARENA_WIDTH - SCREEN_WIDTH) {this.camera.x = ARENA_WIDTH - SCREEN_WIDTH;}
  if (this.camera.y < 0){this.camera.y = 0}
  if (this.camera.y > ARENA_HEIGHT - SCREEN_HEIGHT){this.camera.y = ARENA_HEIGHT - SCREEN_HEIGHT;}
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
  ctx.rect(0-this.camera.x,0-this.camera.y,ARENA_WIDTH,ARENA_HEIGHT);
  ctx.stroke();


  for (i = 0; i < nm.niblits.length; i++){
    ctx.lineWidth = 2;
    ctx.strokeStyle = "blue";
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(nm.niblits[i].x - this.camera.x, nm.niblits[i].y - this.camera.y, nm.niblits[i].size, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  }




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
      host_interval = setInterval(function(){
        nm.ready_niblit_batch();
      }, 5000);
    }else{
      opponent.avatar.color = 'red';
      opponent.avatar.position.x = 50;
      opponent.avatar.position.y = 50;
      player.avatar.color = 'blue';
      player.avatar.position.x = 500;
      player.avatar.position.y = 500;
    }
    nm.avatars.push(player.avatar);
    nm.avatars.push(opponent.avatar);
    if (data.game_host){
      nm.ready_niblit_batch();
    }
    spawn_interval = setInterval(function(){
      nm.niblit_factory.make_niblit();
    },100);
    Game.paused = false;
  });

  this.socket.on('game_update', function(data){
    if (data.opponent_pos){
      opponent.avatar.position = data.opponent_pos;
      for (var i = 0; i < data.niblits_eaten.length; i++){
        for (var j = 0; j < nm.niblits.length; j++){
          if (data.niblits_eaten[i] == nm.niblits[j].n_id){
            nm.niblits.splice(j, 1);
            j--;
          }
        }
      }
    }
    if (data.niblit_batch){
      nm.pending_niblits = nm.pending_niblits.concat(data.niblit_batch);
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
      (sc && player) && sc.socket.emit('game_update', {opponent_pos: player.avatar.position, niblits_eaten: niblits_eaten});
      niblits_eaten = [];

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












