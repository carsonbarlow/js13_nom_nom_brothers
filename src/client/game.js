
var utils,
  sc,
  nm,
  graphics,
  input,
  player,
  opponent,
  reverse_meter = 0,
  rolling_niblit_id = 1,
  niblits_eaten = [],
  host_interval,
  spawn_interval,
  SCREEN_WIDTH = 720,
  SCREEN_HEIGHT = 640
  ARENA_WIDTH = 1200,
  ARENA_HEIGHT = 1200,
  MAX_NIBLITS = 200,
  REVERSE_MAX = 100,
  DOMURL = window.URL || window.webkitURL || window,
  ART_COMMON = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 150 150" enable-background="new 0 0 150 150" xml:space="preserve">',
  ART = {
    nomHead: ART_COMMON + '<g><circle fill="#32D95C" cx="74" cy="75" r="71"/></g><circle fill="#ECF230" cx="74" cy="50" r="22"/><circle cx="74" cy="49" r="10"/><ellipse cx="74" cy="108" rx="22" ry="22"/><path fill="#FFFFFF" d="M68.4 129.7l5.8-14.8l9.2 13.8C83.5 128 74 132 68 129.7z"/></svg>',
    monHead: ART_COMMON + '<g><circle fill="#FF5A35" cx="72" cy="75" r="67"/></g><circle fill="#ECF230" cx="38" cy="50" r="12"/><circle fill="#ECF230" cx="73" cy="47" r="13"/><circle fill="#ECF230" cx="108" cy="50" r="13"/><circle cx="38" cy="50" r="5"/><circle cx="73" cy="47" r="5"/><circle cx="108" cy="50" r="5"/></svg>',
    nomMouth: ART_COMMON + '<ellipse cx="74" cy="108" rx="22" ry="22"/><path fill="#FFFFFF" d="M68.4 129.7l5.8-14.8l9.2 13.8C83.5 128 74 132 68 129.7z"/></svg>',
    monMouth: ART_COMMON + '<ellipse cx="73" cy="106" rx="21" ry="21"/><path fill="#FFFFFF" d="M63.3 87.6l9.4 13.1l7.2-14.8C79.9 85 72 82 63 87.6z"/></svg>',
    eat: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 50 15" enable-background="new 0 0 50 15" xml:space="preserve"><path d="M49.3 8c0 13.4-10.5 2-23.8 2S0.9 21 0 8s10.8-2 24.2-2S49.3-5.4 49 8z"/></svg>'
  };

window.onload = function(){
  utils = new Utils();
  graphics = new Graphics();
  input = new Input();
  sc = new ServerConnect();
  nm = new NiblitManager();
  sc.lets_play();
  input.init();
};

//============================================== Game Admin ==========================================\\

var GameAdmin = function(){
  this.state = 'menu'; //menu, waiting_for_player, games_to_join, in_play, paused, end_game
  this.canvas = document.getElementById('game_canvas');
  this.host_game = document.getElementById('host_game');
  this.join_game = document.getElementById('join_game');
  this.enter_game_name_overlay = document.getElementById('enter_game_name_overlay');
  this.waiting_for_opponent = document.getElementById('waiting_for_opponent');
  this.games_to_join = document.getElementById('games_to_join');
  this.rematch = document.getElementById('rematch');
};
GameAdmin.prototype.hide_all = function(){
  this.canvas.style.display = 'none';
  this.host_game.style.display = 'none';
  this.join_game.style.display = 'none';
  this.enter_game_name_overlay.style.display = 'none';
  this.waiting_for_opponent.style.display = 'none';
  this.games_to_join.style.display = 'none';
  this.rematch.style.display = 'none';
};
GameAdmin.prototype.enter_menu = function(){
  this.hide_all();
  this.host_game.style.display = 'block';
  this.join_game.style.display = 'block';
};
GameAdmin.prototype.create_game_mode = function(){
  this.hide_all();
  this.enter_game_name_overlay.style.display = 'block';
};
GameAdmin.prototype.register_host = function(){
  this.hide_all();
  this.waiting_for_opponent.style.display = 'block';
};
GameAdmin.prototype.show_hosted_games = function(){
  this.hide_all();
  this.games_to_join.style.display = 'block';
};
GameAdmin.prototype.join_game = function(){};
GameAdmin.prototype.start_match = function(){
  this.hide_all();
  this.canvas.style.display = 'block';
};
GameAdmin.prototype.end_match = function(){
  this.hide_all();
  this.rematch.style.display = 'block';
};
GameAdmin.prototype.clean_up_match = function(){};

//============================================== Player ==========================================\\

var Player = function(who){
  this.score = 0;
  this.old_score = 0;
  this.upgrade_points = 0;
  this.avatar = new Avatar(who);
};

Player.prototype.chomp = function(niblit){
  this.score += niblit.points;
  this.upgrade_points += niblit.points;
};

Player.prototype.try_upgrade = function(){
  if (this.avatar.max_level || this.upgrade_points < this.avatar.level_up[this.avatar.level]){return;}
  this.upgrade_points -= this.avatar.level_up[this.avatar.level];
  this.avatar.do_upgrade();
  sc.socket.emit('game_update',{upgrade:true});
};

Player.prototype.try_reverse = function(){
  if (reverse_meter < REVERSE_MAX){return;}
  reverse_meter = 0;
  sc.socket.emit('game_update_both',{reverse: true});
};

function reverse_avatars(){
  Game.paused = true;
  setTimeout(function(){
    var a = player.avatar;
    player.avatar = opponent.avatar;
    opponent.avatar = a;
  },500);
  setTimeout(function(){
    Game.paused = false;
  },1000);
}

function add_to_reverse_meter(){
  if (Game.paused){return;}
  reverse_meter++;
  if ((player.score - player.old_score) < (opponent.score - opponent.old_score)){reverse_meter++}
  player.old_score = player.score;
  opponent.old_score = opponent.score;
  if (reverse_meter > REVERSE_MAX){reverse_meter = REVERSE_MAX}
}

//============================================== Avatar ==========================================\\

var Avatar = function(who){

  this.img_body = document.createElement('IMG');
  this.img_mouth = document.createElement('IMG');
  this.img_eat = document.createElement('IMG');
  if (who === 'nom'){
    this.position = {x: 50, y: 50};
    this.color = 'red';
    this.img_body.src = DOMURL.createObjectURL(new Blob([ART.nomHead], {type: 'image/svg+xml;charset=utf-8'}));
    this.img_mouth.src = DOMURL.createObjectURL(new Blob([ART.nomMouth], {type: 'image/svg+xml;charset=utf-8'}));
  }else{
    this.position = {x:150, y: 50};
    this.color = 'blue';
    this.img_body.src = DOMURL.createObjectURL(new Blob([ART.monHead], {type: 'image/svg+xml;charset=utf-8'}));
    this.img_mouth.src = DOMURL.createObjectURL(new Blob([ART.monMouth], {type: 'image/svg+xml;charset=utf-8'}));
  }
  this.img_eat.src = DOMURL.createObjectURL(new Blob([ART.eat], {type: 'image/svg+xml;charset=utf-8'}));
  this.radius = 25;
  this.speed = 150;
  this.level = 1;
  this.rank = 1;
  this.max_level = false;
  this.level_up = [0,20,30,40,50,60,70,80,90,100];
}

Avatar.prototype.move = function(delta){
  var move_array = utils.normalize((player.avatar.position.x - graphics.camera.x), player.avatar.position.y - graphics.camera.y, input.mouse.x, input.mouse.y);
  player.avatar.position.x += move_array[0]*player.avatar.speed*delta;
  player.avatar.position.y += move_array[1]*player.avatar.speed*delta;
  //collision detection
  for (var i = 0; i < nm.niblits.length; i++){
    if (nm.niblits[i].points <= player.avatar.rank && utils.proximity(player.avatar.position, nm.niblits[i]) < player.avatar.radius + nm.niblits[i].size){
      var n = nm.niblits.splice(i,1)[0];
      i--;
      niblits_eaten.push(n.n_id);
      player.chomp(n);
    }
  }
}
Avatar.prototype.do_upgrade = function(){
  this.level++;
  if (this.level%2 == 0){
    this.speed += 50;
  }else{
    this.rank++;
    this.radius += 5;
  }
}

//============================================== Niblit & Manager ==========================================\\

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
  min = this.avatars[0].rank;
  max = min;
  if (this.avatars[1].level > max){
    max = this.avatars[1].rank;
  }else{
    min = this.avatars[1].rank;
  }
  niblit_batch = [];
  for (var i = 0; i < 20; i++){
    if (this.niblits.length + i >= MAX_NIBLITS){break;}
    rank = Math.ceil(Math.random()*max);
    x = parseInt(Math.random()*ARENA_WIDTH);
    y = parseInt(Math.random()*ARENA_HEIGHT);
    niblit_batch.push({rank: rank, x: x, y: y});
  }
  sc.socket.emit('game_update_both', {niblit_batch: niblit_batch});
};

var NiblitFactory = function(niblit_manager){
  var niblit_rank_to_size = [0,4,7,10,14,18];
  this.make_niblit = function(){
    if (!niblit_manager.pending_niblits.length){return;}
    var config = niblit_manager.pending_niblits.shift();
    var n = new Niblit({x: config.x, y: config.y, size: niblit_rank_to_size[config.rank], points: config.rank}); //may refactor this to make more sense.
    niblit_manager.niblits.push(n);
  };
};

//============================================== Utils ==========================================\\

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

//============================================== Graphics ==========================================\\

var Graphics = function(){
  this.canvas = document.getElementById('game_canvas');
  this.context = this.canvas.getContext('2d');
  this.camera = {x: 0, y:0};
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






  // ctx.beginPath();
  ctx.drawImage(opponent.avatar.img_body, opponent.avatar.position.x - this.camera.x - opponent.avatar.radius, opponent.avatar.position.y - this.camera.y - opponent.avatar.radius, opponent.avatar.radius*2, opponent.avatar.radius*2);
  ctx.drawImage(opponent.avatar.img_mouth, opponent.avatar.position.x - this.camera.x - opponent.avatar.radius, opponent.avatar.position.y - this.camera.y - opponent.avatar.radius, opponent.avatar.radius*2, opponent.avatar.radius*2);
  // ctx.arc(opponent.avatar.position.x - this.camera.x, opponent.avatar.position.y - this.camera.y, opponent.avatar.radius, 0, 2 * Math.PI, false);
  // ctx.fillStyle = opponent.avatar.color;
  // ctx.fill();
  // ctx.lineWidth = 3;
  // ctx.strokeStyle = '#003300';
  // ctx.stroke();

  //draw playerA
  ctx.drawImage(player.avatar.img_body, player.avatar.position.x - this.camera.x - player.avatar.radius, player.avatar.position.y - this.camera.y - player.avatar.radius, player.avatar.radius*2, player.avatar.radius*2);
  ctx.drawImage(player.avatar.img_mouth, player.avatar.position.x - this.camera.x - player.avatar.radius, player.avatar.position.y - this.camera.y - player.avatar.radius, player.avatar.radius*2, player.avatar.radius*2);
  // ctx.beginPath();
  // ctx.arc(player.avatar.position.x - this.camera.x, player.avatar.position.y - this.camera.y, player.avatar.radius, 0, 2 * Math.PI, false);
  // ctx.fillStyle = player.avatar.color;
  // ctx.fill();
  // ctx.lineWidth = 3;
  // ctx.strokeStyle = '#003300';
  // ctx.stroke();


  //HUD
  //scores
  ctx.font = "20px sans-serif";
  ctx.fillStyle = '#333';

  ctx.fillText('Score: '+player.score+'(lv'+player.avatar.level+')',50,25);
  ctx.fillText('Opponent: '+opponent.score+'(lv'+opponent.avatar.level+')',500,25);

  ctx.fillText('Upgrade: '+player.upgrade_points+'/'+player.avatar.level_up[player.avatar.level], 50, 50);
  ctx.fillText('Reverse: '+reverse_meter+'/'+REVERSE_MAX, 50, 75);
  ctx.restore();
};

//============================================== Input ==========================================\\

var Input = function(){
  this.mouse = {x:0,y:0};
};

Input.prototype.init = function(){
  var canvas = document.getElementById('game_canvas');
  var mouse = this.mouse;
  var id_to_key = {'U+0055':'u', 'U+0052':'r'};
  var _this = this;
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
  window.addEventListener('keydown', function(event){
    if (event.keyIdentifier == 'U+0055'){ // "u" (attempt upgrade)
      player.try_upgrade();
    }else if (event.keyIdentifier == 'U+0052'){ // "r" (attempt reverse)
      player.try_reverse();
    }
  });
};

//============================================== ServerConnect ==========================================\\

var ServerConnect = function(){
  this.socket = io.connect(document.location.href);
  var opponent_socket;

  this.lets_play = function(){
    this.socket.emit('lets_play',{})
  }

  this.socket.on('game_start', function(data){
    if (data.game_host){
      player = new Player('nom');
      opponent = new Player('mon');
      host_interval = setInterval(function(){
        nm.ready_niblit_batch();
      }, 5000);
    }else{
      player = new Player('mon');
      opponent = new Player('nom');
    }
    nm.avatars.push(player.avatar);
    nm.avatars.push(opponent.avatar);
    if (data.game_host){
      nm.ready_niblit_batch();
    }
    spawn_interval = setInterval(function(){
      nm.niblit_factory.make_niblit();
    },100);
    opponent_update_interval = setInterval(function(){
      sc.socket.emit('game_update', {opponent_pos: player.avatar.position, niblits_eaten: niblits_eaten});
      niblits_eaten = [];
    },34);
    setInterval(add_to_reverse_meter,600);
    Game.paused = false;
  });

  this.socket.on('game_update', function(data){
    if (data.opponent_pos){
      opponent.avatar.position = data.opponent_pos;
      for (var i = 0; i < data.niblits_eaten.length; i++){
        for (var j = 0; j < nm.niblits.length; j++){
          if (data.niblits_eaten[i] == nm.niblits[j].n_id){
            opponent.chomp(nm.niblits.splice(j, 1)[0]);
            j--;
          }
        }
      }
    }else if (data.niblit_batch){
      nm.pending_niblits = nm.pending_niblits.concat(data.niblit_batch);
    }else if (data.reverse){
      reverse_avatars();
    }else if (data.upgrade){
      opponent.avatar.do_upgrade();
    }
    
  });
};

//============================================== Game Update ==========================================\\

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
      // (sc && player) && sc.socket.emit('game_update', {opponent_pos: player.avatar.position, niblits_eaten: niblits_eaten});
      // niblits_eaten = [];

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












