
var utils,
  sc,
  nm,
  ga,
  graphics,
  sm,
  input,
  player,
  opponent,
  nom_icon_show,
  mon_icon_show,
  game_name,
  game_minutes,
  game_seconds,
  game_centa_seconds,
  is_host,
  reverse_meter = 0,
  rolling_niblit_id = 1,
  niblits_eaten = [],
  host_interval,
  spawn_interval,
  reverse_meter_interval,
  SCREEN_WIDTH = 720,
  SCREEN_HEIGHT = 640
  ARENA_WIDTH = 1200,
  ARENA_HEIGHT = 1200,
  MAX_NIBLITS = 200,
  REVERSE_MAX = 100,
  DOMURL = window.URL || window.webkitURL || window,
  ART_COMMON = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 150 150" enable-background="new 0 0 150 150" xml:space="preserve">',
  ART = {
    nomHead: ART_COMMON + '<g><circle fill="#32D95C" cx="74" cy="75" r="71"/></g><circle fill="#ECF230" cx="74" cy="50" r="22"/><circle cx="74" cy="49" r="10"/></svg>',
    monHead: ART_COMMON + '<g><circle fill="#FF5A35" cx="72" cy="75" r="67"/></g><circle fill="#ECF230" cx="38" cy="50" r="12"/><circle fill="#ECF230" cx="73" cy="47" r="13"/><circle fill="#ECF230" cx="108" cy="50" r="13"/><circle cx="38" cy="50" r="5"/><circle cx="73" cy="47" r="5"/><circle cx="108" cy="50" r="5"/></svg>',
    nomMouth: ART_COMMON + '<ellipse cx="74" cy="108" rx="22" ry="22"/><path fill="#FFFFFF" d="M68.4 129.7l5.8-14.8l9.2 13.8C83.5 128 74 132 68 129.7z"/></svg>',
    monMouth: ART_COMMON + '<ellipse cx="73" cy="106" rx="21" ry="21"/><path fill="#FFFFFF" d="M63.3 87.6l9.4 13.1l7.2-14.8C79.9 85 72 82 63 87.6z"/></svg>',
    eat: ART_COMMON + '<path d="M97.2 103.4c0 12.5-9.7 1.9-22.1 1.9s-22.9 10.6-22.9-1.9s10.1-1.9 22.5-1.9S97.2 90.9 97.2 103.4z"/></svg>',
    title_art: '<svg xmlns="http://www.w3.org/2000/svg" version="1" x="0" y="0" viewBox="0 0 720 640" enable-background="new 0 0 720 640" xml:space="preserve"><text style="text-shadow: 10px 10px 0 rgba(1,255,223, 0.6), 20px 20px 0 rgba(255,0,0, 0.6), 30px 30px 0 rgba(1,255,223, 0.6), 40px 40px 0 rgba(255,0,0, 0.6),; font-weight: bold;" transform="matrix(1 0 0 1 98.3608 217.1597)"><tspan x="0" y="0" fill="#ECF230" font-family="\'Verdana\'" font-size="99">NOM</tspan><tspan x="262" y="0" fill="#F23869" font-family="\'Verdana\'" font-size="99">MON</tspan><tspan x="-40" y="119" fill="#F23869" font-family="\'Verdana\'" font-size="99">BROT</tspan><tspan x="265" y="119" fill="#ECF230" font-family="\'Verdana\'" font-size="99">HERS</tspan></text></svg>'
  },
  NIBLIT_COLOR_PALET = ['','#0033CC','#431359','#FFBA41','#FF0000','#FFFF01'];
  ART.nom = ART.nomHead.replace('</svg>', ART.nomMouth.replace(ART_COMMON, ''));
  ART.mon = ART.monHead.replace('</svg>', ART.monMouth.replace(ART_COMMON, ''));


window.onload = function(){
  utils = new Utils();
  graphics = new Graphics();
  sm = new SoundManager();
  input = new Input();
  sc = new ServerConnect();
  nm = new NiblitManager();
  // sc.lets_play();
  input.init();
  ga = new GameAdmin();
  ga.enter_menu();
};

//============================================== Game Admin ==========================================\\

var GameAdmin = function(){
  var state = 'menu', //menu, waiting_for_player, games_to_join, in_play, paused, end_game
    game_title = document.getElementById('title'),
    canvas = document.getElementById('game_canvas'),
    host_game = document.getElementById('host_game'),
    join_game = document.getElementById('join_game'),
    enter_game_name_overlay = document.getElementById('enter_game_name_overlay'),
    waiting_for_opponent = document.getElementById('waiting_for_opponent'),
    games_to_join = document.getElementById('games_to_join'),
    list_of_games = document.getElementById('list_of_games'),
    no_games = document.getElementById('no_games'),
    rematch = document.getElementById('rematch'),
    hud = document.getElementById('HUD'),
    timer_interval;
  
  function hide_all(){

    hud.style.display = 'none';
    canvas.style.display = 'none';
    host_game.style.display = 'none';
    join_game.style.display = 'none';
    enter_game_name_overlay.style.display = 'none';
    waiting_for_opponent.style.display = 'none';
    games_to_join.style.display = 'none';
    rematch.style.display = 'none';
  };
  function enter_menu(){
    hide_all();
    game_title.style.display = 'block';
    host_game.style.display = 'block';
    join_game.style.display = 'block';
  };
  function create_game_mode(){
    hide_all();
    enter_game_name_overlay.style.display = 'block';
  };
  function register_host(){
    game_name = document.getElementById('input_game_name').value;
    game_name = game_name.replace(/\W/g, '');
    if (game_name != ''){
      hide_all();
      waiting_for_opponent.style.display = 'block';
      sc.register_game();
    }
  };
  function get_hosted_games(){
    sc.get_hosted_games();
  }
  function show_hosted_games(games_list){
    hide_all();
    games_to_join.style.display = 'block';
    // list_of_games.innerHTML = '';
    var games = '';
    for (var i = 0; i < games_list.length; i++){
      games += '<li id="game_id_'+games_list[i]+'" class="avalible_game">'+games_list[i]+'</li>'
    }
    list_of_games.innerHTML = games;
    for (i = 0; i < games_list.length; i++){
      (function(_i){
        document.getElementById('game_id_'+games_list[_i]).addEventListener('click', function(){
          sc.join_game(games_list[_i]);
        });
      })(i);
      
    }
    if (games_list.length){
      no_games.style.display = 'none';
    }else{
      no_games.style.display = 'block';
    }

  };
  function join_game(){};
  function start_match(){
    game_title.style.display = 'none';
    if (is_host){
      nom_icon_show = !(mon_icon_show = false);
      player = new Player('nom');
      opponent = new Player('mon');
      host_interval = setInterval(function(){
        nm.ready_niblit_batch();
      }, 5000);
    }else{
      nom_icon_show = !(mon_icon_show = true);
      player = new Player('mon');
      opponent = new Player('nom');
    }
    document.getElementById('player_nom').style.display = (nom_icon_show)?"block":"none";
    document.getElementById('player_mon').style.display = (mon_icon_show)?"block":"none";
    document.getElementById('opponent_nom').style.display = (nom_icon_show)?"none":"block";
    document.getElementById('opponent_mon').style.display = (mon_icon_show)?"none":"block";
    nm.avatars.push(player.avatar);
    nm.avatars.push(opponent.avatar);
    if (is_host){
      nm.ready_niblit_batch();
    }
    spawn_interval = setInterval(function(){
      nm.niblit_factory.make_niblit();
    },100);
    opponent_update_interval = setInterval(function(){
      sc.socket.emit('game_update', {opponent_pos: player.avatar.position, niblits_eaten: niblits_eaten});
      niblits_eaten = [];
    },34);
    reverse_meter_interval = setInterval(add_to_reverse_meter,600);
    player.stop_moving = false;
    Game.paused = false;


    hide_all();
    hud.style.display = 'block'
    canvas.style.display = 'block';
    game_minutes = 3;
    game_seconds = 0;
    game_centa_seconds = 0;
    timer_interval = setInterval(function(){
      game_centa_seconds--;
      if (game_centa_seconds < 0){
        game_centa_seconds += 100;
        game_seconds--;
        if (game_seconds < 0){
          game_seconds += 60;
          game_minutes--;
          if (game_minutes < 0){
            clearInterval(timer_interval);
            end_match();
          }
        }
      }
    },10);

  };
  function end_match(){
    Game.paused = true;
    if (is_host){
      clearInterval(host_interval);
    }
    clearInterval(spawn_interval);
    clearInterval(reverse_meter_interval);
    niblits_eaten = [];
    if (player.score < opponent.score){

    }
    var results_output = document.getElementById('game_results');
    results_output.innerHTML = "You "+ ((player.score < opponent.score)? "Lose":"Win") + "!<br>Score: "+player.score+"<br>Opponent: "+opponent.score+"<br><br>Rematch?";
    hide_all();
    rematch.style.display = 'block';
  };
  function clean_up_match(){
    reverse_meter = 0;
    rolling_niblit_id = 1;
    nm.niblits = [];
    nm.pending_niblits = [];
    nm.avatars = [];
  };


  //setting up event listeners.
  host_game.addEventListener('click',create_game_mode);
  document.getElementById('enter_game_name_overlay_confirm').addEventListener('click',register_host);
  document.getElementById('enter_game_name_overlay_cancel').addEventListener('click',enter_menu);
  document.getElementById('waiting_overlay_cancel').addEventListener('click',function(event){
    //send cancel notice to server.
    sc.unregister_game();
    enter_menu();
  });
  join_game.addEventListener('click',get_hosted_games);
  document.getElementById('games_to_join_cancel').addEventListener('click', function(){
    sc.stop_browsing();
    enter_menu();
  });
  document.getElementById('rematch_cancel').addEventListener('click', function(){
    sc.socket.emit('left_game',{});
    clean_up_match();
    enter_menu();
  });
  document.getElementById('rematch_confirm').addEventListener('click', function(){
    clean_up_match();
    hide_all();
    waiting_for_opponent.style.display = 'block';
    sc.socket.emit('lets_rematch',{});
  });
  this.enter_menu = enter_menu;
  this.show_hosted_games = show_hosted_games;
  this.start_match = start_match;
  this.clean_up_match = clean_up_match;
};




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
  if (this.avatar.chomps < 3){this.avatar.chomps++;}
};

Player.prototype.try_upgrade = function(){
  if (this.avatar.max_level || this.upgrade_points < this.avatar.level_up[this.avatar.level]){return;}
  this.upgrade_points -= this.avatar.level_up[this.avatar.level];
  this.avatar.do_upgrade();
  sm.play('Upgrade1');
  sc.socket.emit('game_update',{upgrade:true});
};

Player.prototype.try_reverse = function(){
  if (reverse_meter < REVERSE_MAX){return;}
  reverse_meter = 0;
  sm.play('Reverse1');
  sc.socket.emit('game_update_both',{reverse: true});
};

function reverse_avatars(){
  Game.paused = true;
  setTimeout(function(){
    var a = player.avatar;
    player.avatar = opponent.avatar;
    opponent.avatar = a;
    nom_icon_show = !(mon_icon_show = nom_icon_show);
    document.getElementById('player_nom').style.display = (nom_icon_show)?"block":"none";
    document.getElementById('player_mon').style.display = (mon_icon_show)?"block":"none";
    document.getElementById('opponent_nom').style.display = (nom_icon_show)?"none":"block";
    document.getElementById('opponent_mon').style.display = (mon_icon_show)?"none":"block";
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
  this.who = who;
  this.BITE_TIME_MAX = 0.2;
  this.bite_time = 0;
  this.img_body = document.createElement('IMG');
  this.img_open = document.createElement('IMG');
  this.img_eat = document.createElement('IMG');
  this.eye_x = 0;
  this.eye_y = 0;
  if (who === 'nom'){
    this.position = {x: 50, y: 50};
    this.color = 'red';
    this.img_body.src = DOMURL.createObjectURL(new Blob([ART.nomHead], {type: 'image/svg+xml;charset=utf-8'}));
    this.img_open.src = DOMURL.createObjectURL(new Blob([ART.nomMouth], {type: 'image/svg+xml;charset=utf-8'}));
  }else{
    this.position = {x:150, y: 50};
    this.color = 'blue';
    this.img_body.src = DOMURL.createObjectURL(new Blob([ART.monHead], {type: 'image/svg+xml;charset=utf-8'}));
    this.img_open.src = DOMURL.createObjectURL(new Blob([ART.monMouth], {type: 'image/svg+xml;charset=utf-8'}));
  }
  this.img_eat.src = DOMURL.createObjectURL(new Blob([ART.eat], {type: 'image/svg+xml;charset=utf-8'}));
  this.img_mouth = this.img_open;
  this.radius = 25;
  this.speed = 150;
  this.level = 1;
  this.rank = 1;
  this.max_level = false;
  this.level_up = [0,20,30,40,50,60,70,80,90,100];
  this.mouth_open = true;
  this.chomps = 0;
}

Avatar.prototype.move = function(delta){
  if (utils.proximity(player.avatar.position.x - graphics.camera.x, player.avatar.position.y - graphics.camera.y, input.mouse.x, input.mouse.y) > player.avatar.radius){
    var move_array = utils.normalize((player.avatar.position.x - graphics.camera.x), player.avatar.position.y - graphics.camera.y, input.mouse.x, input.mouse.y);
    player.avatar.position.x += move_array[0]*player.avatar.speed*delta;
    player.avatar.position.y += move_array[1]*player.avatar.speed*delta;
    if (player.avatar.position.x < player.avatar.radius){player.avatar.position.x = player.avatar.radius;}
    else if(player.avatar.position.x > ARENA_WIDTH - player.avatar.radius){player.avatar.position.x = ARENA_WIDTH - player.avatar.radius;}
    if (player.avatar.position.y < player.avatar.radius){player.avatar.position.y = player.avatar.radius;}
    else if(player.avatar.position.y > ARENA_HEIGHT - player.avatar.radius){player.avatar.position.y = ARENA_HEIGHT - player.avatar.radius;}
    //collision detection
    for (var i = 0; i < nm.niblits.length; i++){
      if (nm.niblits[i].points <= player.avatar.rank && utils.proximity(player.avatar.position.x, player.avatar.position.y , nm.niblits[i].x, nm.niblits[i].y) < player.avatar.radius + nm.niblits[i].size){
        var n = nm.niblits.splice(i,1)[0];
        i--;
        niblits_eaten.push(n.n_id);
        player.chomp(n);
      }
    }
  }
  if (this.who == 'nom'){
    this.eye_x = this.position.x;
    this.eye_y = this.position.y - (this.radius*0.3);
  }else{

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
  if (this.level == 10){
    this.max_level = true;
  }
}
Avatar.prototype.animate = function(delta, is_player){
  if (this.chomps){
    this.bite_time -= delta;
    if (this.bite_time < 0){
      this.bite_time += this.BITE_TIME_MAX;
      this.mouth_open = !this.mouth_open;
      if (this.mouth_open){
        this.img_mouth = this.img_open;
        this.chomps--;
      }else{
        if (is_player){sm.play('Eat2');}
        this.img_mouth = this.img_eat;
      }
    }
  }
}

//============================================== Niblit & Manager ==========================================\\

var Niblit = function(config){
  this.x = config.x;
  this.y = config.y;
  this.size = config.size;
  this.points = config.points;
  this.n_id = rolling_niblit_id;
  this.color = NIBLIT_COLOR_PALET[config.points];
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
    x = parseInt((Math.random()*(ARENA_WIDTH-50))+25);
    y = parseInt((Math.random()*(ARENA_HEIGHT-50))+25);
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
Utils.prototype.proximity = function(obj_1_x, obj_1_y, obj_2_x, obj_2_y){
  var x_dif = obj_2_x - obj_1_x;
  var y_dif = obj_2_y - obj_1_y;
  return Math.sqrt((x_dif*x_dif)+(y_dif*y_dif));
};

//============================================== Graphics ==========================================\\

var Graphics = function(){
  this.canvas = document.getElementById('game_canvas');
  this.context = this.canvas.getContext('2d');
  this.camera = {x: 0, y:0};
  this.game_time = document.getElementById('game_time');
  this.hud = {
    score: document.getElementById('player_score'),
    opponent: document.getElementById('opponent_score'),
    player_lv: document.getElementById('player_lv'),
    opponent_lv: document.getElementById('opponent_lv'),
    upgrade_text: document.getElementById('upgrade_text'),
    upgrade_bar_fill: document.getElementById('upgrade_bar_fill'),
    reverse_bar_fill: document.getElementById('reverse_bar_fill')
  };
  // set up title screen.
  var title_ctx = document.getElementById('title_canvas').getContext('2d');;
  // title_ctx = title_ctx
  title_ctx.clearRect(0,0,720,640);
  var title_img = document.createElement('IMG');
  title_img.src = DOMURL.createObjectURL(new Blob([ART.title_art], {type: 'image/svg+xml;charset=utf-8'}));
  var nom_img = document.createElement('IMG');
    nom_img.src = DOMURL.createObjectURL(new Blob([ART.nom], {type: 'image/svg+xml;charset=utf-8'}));
  var mon_img = document.createElement('IMG');
    mon_img.src = DOMURL.createObjectURL(new Blob([ART.mon], {type: 'image/svg+xml;charset=utf-8'}));
  document.getElementById('player_nom').src = DOMURL.createObjectURL(new Blob([ART.nom], {type: 'image/svg+xml;charset=utf-8'}));
  document.getElementById('player_mon').src = DOMURL.createObjectURL(new Blob([ART.mon], {type: 'image/svg+xml;charset=utf-8'}));
  document.getElementById('opponent_nom').src = DOMURL.createObjectURL(new Blob([ART.nom], {type: 'image/svg+xml;charset=utf-8'}));
  document.getElementById('opponent_mon').src = DOMURL.createObjectURL(new Blob([ART.mon], {type: 'image/svg+xml;charset=utf-8'}));


  setTimeout(function(){
    title_ctx.drawImage(title_img, 0, 0, 720, 640);
    title_ctx.drawImage(nom_img, 184,138,85,85);
    title_ctx.drawImage(mon_img, 456,138,85,85);
  },100);

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

  // niblits!!
  for (i = 0; i < nm.niblits.length; i++){
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#BBBBBB";
    ctx.fillStyle = nm.niblits[i].color;
    ctx.beginPath();
    ctx.arc(nm.niblits[i].x - this.camera.x, nm.niblits[i].y - this.camera.y, nm.niblits[i].size, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  }

  //draw PlayerB

  ctx.drawImage(opponent.avatar.img_body, opponent.avatar.position.x - this.camera.x - opponent.avatar.radius, opponent.avatar.position.y - this.camera.y - opponent.avatar.radius, opponent.avatar.radius*2, opponent.avatar.radius*2);
  ctx.drawImage(opponent.avatar.img_mouth, opponent.avatar.position.x - this.camera.x - opponent.avatar.radius, opponent.avatar.position.y - this.camera.y - opponent.avatar.radius, opponent.avatar.radius*2, opponent.avatar.radius*2);

  //draw playerA
  ctx.drawImage(player.avatar.img_body, player.avatar.position.x - this.camera.x - player.avatar.radius, player.avatar.position.y - this.camera.y - player.avatar.radius, player.avatar.radius*2, player.avatar.radius*2);
  ctx.drawImage(player.avatar.img_mouth, player.avatar.position.x - this.camera.x - player.avatar.radius, player.avatar.position.y - this.camera.y - player.avatar.radius, player.avatar.radius*2, player.avatar.radius*2);

  //HUD
  this.game_time.innerHTML = "Time: "+game_minutes+":"+((game_seconds<10)?"0"+game_seconds:game_seconds)+":"+((game_centa_seconds<10)?"0"+game_centa_seconds:game_centa_seconds);


  // move this stuff out of the draw update.  It is inefficent
  this.hud.score.innerHTML = '' + player.score;
  this.hud.opponent.innerHTML = '' + opponent.score;
  this.hud.player_lv.innerHTML = 'lv ' + player.avatar.level;
  this.hud.opponent_lv.innerHTML = 'lv '+ opponent.avatar.level;

  if (!player.avatar.max_level){
    this.hud.upgrade_text.innerHTML = '' + player.upgrade_points+'/'+player.avatar.level_up[player.avatar.level];
  }else{
    this.hud.upgrade_text.innerHTML = 'MAX';
  }
  



  // ctx.fillText('Score: '+player.score+'(lv'+player.avatar.level+')',50,25);
  // ctx.fillText('Opponent: '+opponent.score+'(lv'+opponent.avatar.level+')',500,25);

  // ctx.fillText('Upgrade: '+player.upgrade_points+'/'+player.avatar.level_up[player.avatar.level], 50, 50);
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
  window.addEventListener('keydown', function(event){
    if (event.keyIdentifier == 'U+0055'){ // "u" (attempt upgrade)
      player.try_upgrade();
    }else if (event.keyIdentifier == 'U+0052'){ // "r" (attempt reverse)
      player.try_reverse();
    }else if (event.keyIdentifier == 'U+0051'){ // "q" (force quit [for debugging)]
      game_name = 0;
      game_minutes = 0;
      game_seconds = 0;
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

  this.register_game = function(){
    this.socket.emit('register_game', {name: game_name});
  };

  this.unregister_game = function(){
    this.socket.emit('unregister_game', {name: game_name});
  };

  this.get_hosted_games = function(){
    this.socket.emit('get_registered_games',{});
  };

  this.socket.on('registered_games', function(data){
    ga.show_hosted_games(data);
  });

  this.stop_browsing = function(){
    this.socket.emit('stop_browsing',{});
  };

  this.join_game = function(name){
    this.socket.emit('join_game', {name: name});
  }

  this.socket.on('left_game',function(data){
    ga.clean_up_match();
    ga.enter_menu();
  });

  this.socket.on('game_start', function(data){
    is_host = data.game_host;
    ga.start_match();
  });

  this.socket.on('do_rematch',function(data){
    ga.start_match();
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
      player.avatar.animate(delta, true);
      opponent.avatar.animate(delta, false);
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


  //=============================================== SOUND ================================================\\

  var SoundManager = function(){
    var library = {
      Eat1: [0,0.0064,0.01,0.2679,0.9037,0.4596,,0.0459,0.4896,-0.0228,-0.1295,-0.8374,0.9421,-0.3912,-0.9189,,-0.1156,-0.4966,0.0947,0.1871,-0.8993,0.116,-0.2408,0.5],
      Eat2: [2,0.0723,0.0107,0.4702,0.681,0.5816,,,-0.6311,,,0.7088,0.5694,-0.4493,0.0005,-0.47,-0.012,0.0808,0.803,-0.1816,-0.6362,0.007,0.0409,0.5],
      Eat3: [1,0.009,0.01,0.0139,0.2941,0.4653,,0.4675,0.0138,0.2581,0.5312,-0.1741,0.9533,0.9412,0.1339,0.1833,0.112,0.0909,0.5942,-0.9109,,0.0062,0.0849,0.5],
      Eat4: [0,0.0745,0.2308,0.0112,0.497,0.5208,,-0.0772,0.8505,0.002,-0.351,0.3726,,,0.126,,-0.0642,0.0739,0.6018,0.013,-0.0855,0.3304,-0.0002,0.5],
      Reverse1: [0,0.0162,0.7725,0.167,0.3204,0.5936,,-0.1965,,-0.2813,,-0.5995,0.6738,-0.6548,0.0817,0.4256,-0.2282,-0.9325,0.8479,-0.3208,,,-0.0147,0.5],
      Reverse2: [1,0.1685,0.0157,0.0202,0.3935,0.5402,,-0.236,0.0001,0.0847,,0.8875,,0.8982,-0.5277,0.2602,-0.0798,-0.5753,0.8311,0.016,0.9065,0.0048,,0.5],
      Reverse3: [1,0.0188,0.0413,0.1843,0.7326,0.6028,,-0.0032,-0.0352,0.1296,-0.0706,-0.9522,,0.4859,0.1722,,0.2087,-0.3006,0.9941,-0.0448,0.9224,0.0168,0.3951,0.5],
      Reverse4: [2,,0.8122,0.5683,0.8442,0.5,,-0.0329,-0.2216,,-0.8834,-0.1702,0.0213,0.9939,-0.1276,,0.7741,-0.0003,0.7398,,0.4527,0.0007,,0.5],
      Upgrade1: [2,0.2,0.19,0.4,0.71,0.0002,,0.2907,-0.006,0.0047,0.4222,-0.1013,0.1199,,-0.029,-0.7758,-0.3556,0.0208,0.684,0.7017,0.8898,0.054,0.1546,0.5],
      You_lose1: [1,0.0002,0.0567,0.6069,0.631,0.5373,,0.1016,-0.7039,0.0422,,0.1501,,0.6826,0.0686,0.4436,0.0054,-0.0157,0.8327,0.0966,-0.0835,,,0.5],
      You_Win1: [2,0.0009,0.0591,0.1952,0.9899,0.1754,,-0.0005,0.2325,0.1121,-0.9388,0.6123,-0.3225,-0.4815,0.2289,-0.0645,0.5787,-0.0038,0.8952,0.6302,-0.0726,0.0019,-0.0082,0.5]
    };
    // var sounds = {};
    // for (var l in library){
    //   sounds[l] = new Audio();
    //   sounds[l].src = jsfxr(library[l]);
    // }
    function play(sound){
      // console.log('sound');
      if (library[sound]){
        var a = new Audio();
        a.src = jsfxr(library[sound]);
        a.play();
        // console.log('and sound');
        // sounds[sound].play();
      }
    }
    this.play = play;
  };



  /**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// Export for the Closure Compiler
window['jsfxr'] = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}




//TODO:

  // SOUND, SOUND, SOUND!!!

  // fix tab out bug

  // disconnect cases:
    // while waiting for someone to join
    // while browsing
    // mid game
    // end game

  // foreseeable tweaks:
    // you win/lose

  // stretch goals:
    // get eyes to follow mouse


