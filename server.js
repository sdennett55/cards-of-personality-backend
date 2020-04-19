var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var players = [];
var whiteCards = [];
var blackCards = [];

io.on('connection', function(socket){
  if (players.length < 6) {
    players.push({id: socket.id, name: 'NEW USER'});
  }

  console.log({players});

  console.log('a user connected! ', socket.id);

  // send state only to the newly connected user.
  io.to(socket.id).emit('new connection', {whiteCards, players});

  // let everyone know that a new player has connected
  socket.broadcast.emit('user connected', players);

  // update the whiteCards on the server
  socket.on('update whiteCards', function(newWhiteCards) {
    whiteCards = newWhiteCards;
  })

  // when someone drops a white card into their deck
  socket.on('dropped in my cards', function (whiteCard) {
    this.broadcast.emit('dropped in my cards', whiteCard);
  });

  // get the mouse coordinates from the client
  socket.on('dragged card', function ({type, text, x, y}) {
    // send the coordinates to everyone but client that sent it
    this.broadcast.emit('dragged card', {type, text, x, y});
  });

  // get the mouse coordinates from the client
  socket.on('let go card', function ({type, text}) {
    // send the coordinates to everyone but client that sent it
    this.broadcast.emit('let go card', {type, text});
  });

  console.log('players length: ', players.length);
  // when someone changes their player name, 
  // update players name property and emit back
  socket.on('name change', function({id, name}) {
    if (players.length <= 6 && players.find(player => player.id === id)) {
      players.find(player => player.id === id).name = name;
      this.broadcast.emit('name change', players);
    }
  });

  // when a specific player disconnects
  socket.on('disconnect', function(){
    players.splice(players.findIndex(user => user.id === socket.id), 1);
    // send the coordinates to everyone but client that sent it
    this.broadcast.emit('user disconnected', players);
    console.log('user disconnected: ', socket.id);
    console.log({players});
  });

});

http.listen(3001, function() {
  console.log('listening on port 3001');
})