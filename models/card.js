const mongoose = require('mongoose');
const { Deck } = require('./deck');

// Schema
const cardSchema = new mongoose.Schema({
  type: {type: String, required: true},
  text: {type: String, required: true},
  deck: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true,
  },
});
// Card Class
const Card = mongoose.model('Card', cardSchema);

// Create a new white or black card
async function addCard({ type, text, deck }) {
  try {
    const getDeck = await Deck.findOne({ name: deck });

    // Instance of Card class
    const card = new Card({
      type,
      text,
      deck: getDeck,
    });

    const result = await card.save();
    return result;
    
  } catch (err) {
    console.error('There was an issue saving to the database...', err);
  }
}

async function getCardsFromDeck(deck) {
  try {
    const deckName = await Deck.find({ name: deck });
    const result = await Card.find({ deck: deckName }).select({ type: 1, text: 1, });
    return result;
  } catch (err) {
    console.error('There was an issue trying to access cards from the deck: ', err.message);
  }
}

module.exports.Card = Card;
module.exports.addCard = addCard;
module.exports.getCardsFromDeck = getCardsFromDeck;