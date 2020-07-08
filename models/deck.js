const mongoose = require('mongoose');

// Schema
const deckSchema = new mongoose.Schema({
  name: {type: String, required: true},
  isPublic: {type: Boolean, default: false},
  hasSFWCards: {
    type: Boolean,
    default: false
  },
  hasNSFWCards: {
    type: Boolean,
    default: false
  },
});
// Deck Class
const Deck = mongoose.model('Deck', deckSchema);

// Create a new Deck
async function createDeck({ name, isPublic, hasSFWCards, hasNSFWCards }) {
  // Instance of Deck class
  const deck = new Deck({
    name,
    isPublic,
    hasSFWCards,
    hasNSFWCards,
  });

  try {
    const result = await deck.save();
    return result;
  } catch (err) {
    console.error('There was an issue saving to the database...', err);
  }
}

// const saveDeck = createDeck({
//   name: 'not-safe-for-work',
//   isPublic: true,
// })

async function getPublicDecks() {
  try {
    const publicDecks = await Deck.find({ isPublic: true, });
    return publicDecks;
  } catch (err) {
    console.error('There was an issue trying to access public decks: ', err.message);
  }
}

async function getDeck(deckName) {
  try {
    const deck = await Deck.findOne({name: deckName});
    return deck;
  } catch (err) {
    console.error('There was an issue trying to access this deck: ', err.message);
  }
}

module.exports.Deck = Deck;
module.exports.createDeck = createDeck;
module.exports.getPublicDecks = getPublicDecks;
module.exports.getDeck = getDeck;
