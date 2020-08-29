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

function blackListFilter({ deck, cards }) {
  // If the deck doesn't have a black list, exit early.
  if (!deck.blackList || (deck.blackList && deck.blackList.length < 1)) {
    return cards;
  }

  const blackListIDs = deck.blackList;

  // loop through every card and return true if it's not in the black list
  return [...cards].filter(({ _id }) => !blackListIDs.includes(_id))
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

module.exports = { shuffle, blackListFilter, Game };
