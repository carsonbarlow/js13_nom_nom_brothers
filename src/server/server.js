var http = require('http');
var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs');

function handler(request, response)
{
  S.log({}, "http request: " + request.url);

  var url = request.url, files = {
    "/": "../client/index.html",
    "/game.js": "../client/game.js",
    "/style.css": "../client/style.css",
    '/cb_testing.js': "../client/cb_testing.js",
    '/test.js': "../client/test.js"
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
  // games: [],
  // unique_number: 1,
  // time_stamp: 0,
  waiting_socket: null
};

// DEBUG BEGIN
S.log = function(socket, s)
{
  console.log("[" + (new Date()).getTime() + "] [" + socket.id + "] " + s);
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
});


app.listen(8000);
console.log('Ready!');