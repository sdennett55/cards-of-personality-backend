// Shuffle arrays to make things not so predictable
function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Game class for each room
function Game() {
  this.players = [];
  this.playersThatLeft = [];
  this.whiteCards = [];
  this.blackCards = [];
  this.submittedCards = [];
  this.timer;
  this.initialCardsAreSet = false;
  this.isPrivate = false;
}

module.exports = {shuffle, Game};
