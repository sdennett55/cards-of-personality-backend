// NOTE: This file was only here to quickly shove the default cards from CAH to the "cards" table
// They're split into safe-for-work and not-safe-for-work decks
const axios = require("axios");

const data = [{ blackCards: [] }, { whiteCards: [] }];
const { blackCards, whiteCards } = data;

blackCards.forEach(async (blackCard) => {
  await addCard(blackCard);
});

function addCard(blackCard) {
  return axios.post("http://localhost:3001/api/addCard", {
    text: blackCard,
    type: "black",
    deckName: "not-safe-for-work",
  });
}
