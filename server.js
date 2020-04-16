var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var players = [];
var whiteCards = [];
var blackCards = [];

io.on('connection', function(socket){

  players.push({id: socket.id});

  console.log({players});

  console.log('a user connected!');

  // send state only to the newly connected user.
  // io.to(socket.id).emit('chat history', chatHistory);

  // get the mouse coordinates from the client
  socket.on('dragged card', function ({type, text, x, y}) {
    // send the coordinates to everyone but me
    this.broadcast.emit('dragged card', {type, text, x, y});
  });

  socket.on('disconnect', function(){
    players.splice(players.find(user => user.id === socket.id), 1);
    console.log('user disconnected');
  });

});

http.listen(3001, function() {
  console.log('listening on port 3001');
})