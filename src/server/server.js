var http = require('http');
var app = require('http').createServer(handler),
  io = require('socket.io').listen(app, {log: false}),
  fs = require('fs');

function handler(request, response)
{
  S.log({}, "http request: " + request.url);

  var url = request.url, files = {
    "/": "../client/index.html",
    "/game.js": "../client/game.js",
    "/style.css": "../client/style.css",
    "/monHead.svg": "../client/monHead.svg",
    "/monMouth.svg": "../client/monMouth.svg",
    "/nomHead.svg": "../client/nomHead.svg",
    "/nomMouth.svg": "../client/nomMouth.svg",
    "/eat.svg": "../eat.svg"
  };

  if (url.indexOf("/?") == 0)
  {
    url = "/";
  }

  if (!files[url])
  {
    S.log({}, " 302 redirecting");
    response.writeHead(302, { "Location": "/" } );
    response.end();
    return;
  }

  fs.readFile(files[url], function(error, data) {
    if (!error)
    {
      S.log({}, "  200 found");
      response.writeHead(200);
      return response.end(data);
    }
    S.log({}, " 404 not found");
    response.writeHead(404);
    response.end("not found");
  });
}

var S = {
  games: [],
  browsing_sockets: [],
  // unique_number: 1,
  // time_stamp: 0,
  waiting_socket: null,
  get_registered_games: function(){
    var games_list = [];
    for (var i = 0; i < this.games.length; i++){
      games_list.push(this.games[i].name);
    }
    return games_list;
  }
};

// DEBUG BEGIN
S.log = function(socket, s)
{
  // console.log("[" + (new Date()).getTime() + "] [" + socket.id + "] " + s);
}
// DEBUG END


io.sockets.on('connection', function(socket){
  S.log(socket, "connected");
  // "recieve" event handler
  socket.on('lets_play', function(data){
    if (S.waiting_socket){
      socket.opponent = S.waiting_socket;
      S.waiting_socket.opponent = socket;
      S.waiting_socket = null;
      socket.emit('game_start', {game_host: false});
      socket.opponent.emit('game_start', {game_host: true});
    }else{
      S.waiting_socket = socket;
    }
  });
  socket.on('game_update', function(data){
    socket.opponent.emit('game_update', data);
  });
  socket.on('game_update_both', function(data){
    socket.opponent.emit('game_update', data);
    socket.emit('game_update', data);
  });
  socket.on('register_game', function(data){
    console.log('registered game:' + data.name);
    S.games.push({name: data.name, socket: socket});
    for (var j = 0; j < S.browsing_sockets.length; j++){
      S.browsing_sockets[j].emit('registered_games', S.get_registered_games());
    }
  });
  socket.on('unregister_game', function(data){
    for (var i = 0; i < S.games.length; i++){
      if (data.name == S.games[i].name){
        S.games.splice(i, 1);
        for (var j = 0; j < S.browsing_sockets.length; j++){
          S.browsing_sockets[j].emit('registered_games', S.get_registered_games());
        }
        break;
      }
    }
  });
  socket.on('get_registered_games', function(data){
    S.browsing_sockets.push(socket);
    console.log('REGISTERED GAMES:'+S.get_registered_games());
    socket.emit('registered_games', S.get_registered_games());
  });
  socket.on('stop_browsing', function(data){
    for (var i = 0; i < S.browsing_sockets.length; i++){
      if (socket == S.browsing_sockets[i]){
        S.browsing_sockets.splice(i, 1);
        break;
      }
    }
  });
  socket.on('join_game', function(data){
    console.log(data.name);
    for (var i = 0; i < S.games.length; i++){
      if (S.games[i].name == data.name){
        var the_game = S.games.splice(i, 1)[0];
        the_game.socket.opponent = socket;
        socket.opponent = the_game.socket;
        for (var j = 0; j < S.browsing_sockets.length; j++){
          S.browsing_sockets[j].emit('registered_games', S.get_registered_games());
          if (S.browsing_sockets[j] == socket){
            S.browsing_sockets.splice(j,1);
            j--;
          }
        }
        the_game.socket.emit('game_start', {game_host: true});
        socket.emit('game_start', {game_host: false});
        break;
      }
    }
  });
  socket.on('left_game', function(data){
    socket.opponent.emit('left_game', data);
  });
  socket.on('lets_rematch', function(data){
    socket.ready_for_rematch = true;
    if (socket.opponent.ready_for_rematch){
      socket.ready_for_rematch = false;
      socket.opponent.ready_for_rematch = false;
      socket.emit('do_rematch',{});
      socket.opponent.emit('do_rematch',{});
    }
  });
});


app.listen(8000);
console.log('Ready!');