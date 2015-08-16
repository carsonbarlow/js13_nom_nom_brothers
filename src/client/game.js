
window.onload = function(){
  var sc = new ServerConnect();
  sc.lets_play();
};


var debounce = false;

var ServerConnect = function(){
  this.socket = io.connect(document.location.href);
  var opponent_socket;

  this.lets_play = function(){
    this.socket.emit('lets_play',{})
  }

  this.socket.on('session_created', function(msg){
    room_number = msg;
  });


  var player, opponent;


  this.socket.on('game_start', function(data){
    console.log(data);
    if (data.game_host){
      player = {
        color: 'red',
        position: [50, 50]
      };
      opponent = {
        color: 'blue',
        position: [500,500]
      };
    }else{
      player = {
        color: 'blue',
        position: [500,500]
      };
      opponent = {
        color: 'red',
        position: [50,50]
      };
    }
    if (!debounce){
      player.element = make_player(player);
      opponent.element = make_player(opponent);
      setInterval(function(){
        sc.socket.emit('game_update', {opponent_pos: player.position});
        player.element.style.left = player.position[0] + 'px';
        player.element.style.top = player.position[1] + 'px';
        opponent.element.style.left = opponent.position[0] + 'px';
        opponent.element.style.top = opponent.position[1] + 'px';
      },34);
      document.body.addEventListener('click',function(){
        // alert('clicked!');
        player.position[0]+=10;
      });
      debounce = true;
    }
  });

  this.socket.on('game_update', function(data){
    if (data.opponent_pos){
      opponent.position = data.opponent_pos;
    }
  });

  function make_player(p){
    player_element = document.createElement('DIV');
    player_element.style.backgroundColor = p.color;
    player_element.style.width = '50px';
    player_element.style.height = '50px';
    player_element.style.position = 'absolute';
    player_element.style.left = p.position[0] + 'px';
    player_element.style.top = p.position[1] + 'px';
    document.body.appendChild(player_element);
    // player_element.addEventListener('click', function(){
    //   // alert('clicked!');
    //   // player.position[0]+=10;
    // });
    return player_element;
  }
};

sc = new ServerConnect()
