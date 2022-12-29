const mongoose = require('mongoose');
const { Deck } = require('./deck');

// Schema
const cardSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    text: { type: String, required: true },
    deck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
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

// Delete a white or black card from a deck
async function deleteCard({ type, text, deck }) {
  try {
    const getDeck = await Deck.findOne({ name: deck });
    const getCard = await Card.findOne({ type, text });
    const doesDeckHaveThisCard = await Card.findOne({ deck: getDeck, text });

    if (!doesDeckHaveThisCard) {
      const blackList = getDeck && getDeck.blackList ? getDeck.blackList : null;
      const newBlackList = blackList ? [...blackList, String(getCard._id)] : [String(getCard._id)];
      await Deck.updateOne({ name: deck }, { blackList: newBlackList });

      console.log(`Added the ${type} card of text "${text}" to the ${deck} deck's blackList`);

      return;
    }

    const result = await Card.deleteOne({ type, text, deck: getDeck });
    return result;
  } catch (err) {
    console.error('There was an issue saving to the database...', err);
  }
}

// Edit a white or black card from a deck
async function editCard({ type, oldText, text, deck }) {
  try {
    const getDeck = await Deck.findOne({ name: deck });
    const getCard = await Card.findOne({ type, text: oldText });
    const doesDeckHaveThisCard = await Card.findOne({ deck: getDeck, text: oldText });

    // if it's a default card from the "SFW" or "NSFW" decks...
    if (!doesDeckHaveThisCard) {
      const blackList = getDeck && getDeck.blackList ? getDeck.blackList : null;
      const newBlackList = blackList ? [...blackList, String(getCard._id)] : [String(getCard._id)];
      await Deck.updateOne({ name: deck }, { blackList: newBlackList });

      console.log(`Edited the ${type} card of text "${text}" to the ${deck} deck's blackList`);

      // add new card
      // Instance of Card class
      const card = new Card({
        type,
        text,
        deck: getDeck,
      });

      const result = await card.save();
      return result;
    }

    const result = await Card.updateOne({ _id: getCard._id }, { text });
    return result;
  } catch (err) {
    console.error('There was an issue saving to the database...', err);
  }
}

async function getCardsFromDeck(deck) {
  try {
    const deckName = await Deck.findOne({ name: deck });
    const result = await Card.find({ deck: deckName }).sort({ updatedAt: -1 });

    return result;
  } catch (err) {
    console.error('There was an issue trying to access cards from the deck: ', err);
  }
}

module.exports.Card = Card;
module.exports.addCard = addCard;
module.exports.deleteCard = deleteCard;
module.exports.editCard = editCard;
module.exports.getCardsFromDeck = getCardsFromDeck;
