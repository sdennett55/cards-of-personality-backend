require('dotenv').config({ path: __dirname + '/.env' });
const cors = require('cors');
var app = require('express')();
app.use(cors());
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var players = [];
var playersThatLeft = [];
var whiteCards = [];
var blackCards = [];
var submittedCards = [];
var timer;

io.on('connection', function(socket){
  if (players.length < 6) {
    players.push({id: socket.id, name: 'NEW USER'});
  }

  console.log({players});

  console.log('a user connected! ', socket.id);

  // send state only to the newly connected user.
  io.to(socket.id).emit('new connection', {whiteCards, blackCards, players, submittedCards});

  // let everyone know that a new player has connected
  socket.broadcast.emit('user connected', players);

  // update the whiteCards on the server
  socket.on('update whiteCards', function({whiteCards: newWhiteCards, players: newPlayers}) {
    whiteCards = newWhiteCards;
    players = newPlayers;
    this.broadcast.emit('update players', players);
  });

  // update the whiteCards on the server
  socket.on('update submittedCards', function(newSubmittedCards) {
    submittedCards = newSubmittedCards;

    // let everyone else know
    this.broadcast.emit('update submittedCards', submittedCards);
  })

  // update the blackCards on the server
   socket.on('update blackCards', function(newBlackCards) {
    blackCards = newBlackCards;
  })

  // update the blackCards on the server
  socket.on('update players', function({players: newPlayers}) {
    console.log({newPlayers});
    players = newPlayers;
    this.broadcast.emit('update players', players);
  })

  // when someone drops a white card into their deck
  socket.on('dropped in my cards', function ({passedInCard: whiteCard, players: newPlayers, whiteCards: newWhiteCards}) {
    players = newPlayers;
    whiteCards = newWhiteCards;
    this.broadcast.emit('dropped in my cards', {whiteCard, players});
  });

  // when someone drops a black card into a player drop
  socket.on('dropped in player drop', function ({players: newPlayers, blackCards: newBlackCards}) {
    players = newPlayers;
    blackCards = newBlackCards;
    console.log({players});
    this.broadcast.emit('dropped in player drop', ({players, blackCards}));
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

  // when someone changes their player name, 
  // update players name property and emit back
  socket.on('name change', function({id, name}) {
    if (players.length <= 6 && players.find(player => player.id === id)) {
      players.find(player => player.id === id).name = name;
      this.broadcast.emit('name change', players);
    }
  });

  socket.on('name submit', function({players: newPlayers, myName, id}) {
    const matchedPlayerThatLeft = playersThatLeft.find(({name}) => name === myName);
    if (myName !== 'NEW USER' && matchedPlayerThatLeft) {
      const playerIndex = players.findIndex(player => player.id === id);
      players[playerIndex] = matchedPlayerThatLeft;
      players[playerIndex].id = id;
    } else {
      players = newPlayers;
    }
    
    io.emit('update players', players);
  });

  // when a specific player disconnects
  socket.on('disconnect', function(){

    console.log('SOCKET ID OF USER THAT DISCONNECTED', socket.id);

    if (timer) {
      clearInterval(timer);
    }

    timer = setTimeout(() => {
      playersThatLeft.length = 0;
      console.log('cleared playersThatLeft ', playersThatLeft);
    }, 60000);

    const playerThatLeft = players.find(user => user.id === socket.id);

    const playerThatLeftIndex = playersThatLeft.findIndex(player => {
      return player.name === playerThatLeft.name
    });

    // if the player that left already left before, remove them from playersThatLeft
    if (playersThatLeft.find(player => player.name === playerThatLeft.name)) {
      playersThatLeft.splice(playerThatLeftIndex, 1);
    }
    // track the new player that left
    playersThatLeft.push(playerThatLeft);

    // update global players variable 
    players.splice(players.findIndex(user => user.id === socket.id), 1);

    // send the coordinates to everyone but client that sent it
    this.broadcast.emit('user disconnected', players);
    console.log('user disconnected: ', socket.id);
    console.log({players, playersThatLeft});
  });

});

http.listen(process.env.PORT, function() {
  console.log(`listening on port ${process.env.PORT}`);
})