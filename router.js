const express = require("express");
const server = require("./server");
const { shuffle } = require("./helpers.js");
const { getPublicDecks, createDeck, getDeck } = require('./models/deck');
const { getCardsFromDeck, addCard } = require('./models/card');

const router = express.Router();

router.post("/api/checkAvailableRooms", function (req, res) {
  if (Object.keys(server.rooms).includes(req.body.roomName)) {
    return res.send("game exists");
  }

  return res.end();
});

router.get("/api/getPublicDecks", async function (req, res) {
  try {
    const allPublicDecks = await getPublicDecks();
    return res.send(allPublicDecks);
  } catch (err) {
    return res.status(500).send('Error: There was an issue retrieving public decks...', err.message);
  }
});

router.get("/api/getCardsFromDeck/:name", async function (req, res) {
  const deckName = req.params.name;

  try {
    const cardsFromDeck = await getCardsFromDeck(deckName);
    return res.send(cardsFromDeck);
  } catch (err) {
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }

});

router.post("/api/addCard", async function (req, res) {
  const { deckName: deck, text, type } = req.body;

  if (!text.replace(/\s/g, "")) {
    return res.send(
      `Error: Please submit more than 0 characters for the ${type} card.`
    );
  }

  // check if card already exists in the deck
  try {
    const cardsFromDeck = await getCardsFromDeck(deck);
    const cardExists = cardsFromDeck.find(({ text: newText, type }) => type === type && text === newText);

    if (cardExists) {
      return res.send(
        `Error: This ${type} card of text ${text} already exists in the deck.`
      );
    }
  } catch (err) {
    return res.status(500).send('Error: There was an issue retrieving cards from the deck when adding a new card...', err.message);
  }


  try {
    await addCard({ type, text, deck });
    return res.send('Success!');
  } catch (err) {
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }
});

router.post("/api/createDeck", async function (req, res) {
  const { deckName } = req.body;

  const deckExists = await getDeck(deckName);
  if (deckExists) {
    return res.send("Error: This deck already exists.");
  }

  try {
    await createDeck({ name: deckName, isPublic: true });
    return res.send("Success!");
  } catch (err) {
    return res.status(500).send("Error: There was an issue saving this deck to the database...", err.message);
  }
});

router.post("/api/getInitialCards", async function (req, res) {
  const { deckName, roomId } = req.body;

  // the first client that connects and hits this route, sets the cards for the game
  // if cards are already set, send back an empty response
  console.log(
    "hitting getInitialCards route",
    server.rooms[roomId] ? server.rooms[roomId].blackCards.length : "blah"
  );
  if (server.rooms[roomId]) {
    if (server.rooms[roomId].initialCardsAreSet) {
      return res.end();
    }

    server.rooms[roomId].initialCardsAreSet = true;
    console.log("initial cards are set!");
  }

  try {
    let totalCards = [];

    if (deckName) {
      const { hasSFWCards, hasNSFWCards } = await getDeck(deckName);
      const cardsFromDeck = await getCardsFromDeck(deckName);
      totalCards.push(...cardsFromDeck);

      if (hasSFWCards) {
        const SFWCards = await getCardsFromDeck('safe-for-work');
        totalCards.push(...SFWCards);
      }
      if (hasNSFWCards) {
        const NSFWCards = await getCardsFromDeck('not-safe-for-work');
        totalCards.push(...NSFWCards);
      }
    } else {
      // if there's no deck query param, load SFW deck by default
      const SFWCards = await getCardsFromDeck('safe-for-work');
      totalCards.push(...SFWCards);
    }




    const blackCards = shuffle(totalCards.filter(({ type }) => type === 'black').map(({ text }) => text));
    const whiteCards = shuffle(totalCards.filter(({ type }) => type === 'white').map(({ text }) => text));

    // just send back array of text for each
    // shuffle them first
    return res.send({ blackCards, whiteCards });
  } catch (err) {
    return res.status(500).send('Error: There was an issue retrieving initial cards from this deck...', err.message);
  }


});

router.get("/api/getActiveRooms", function (req, res) {
  // send back list of active rooms on the server
  const roomsWithoutCircularRefs = Object.entries(server.rooms).reduce(
    (newObj, [roomName, room]) => {
      const { timer, ...rest } = room;
      newObj[roomName] = rest;
      return newObj;
    },
    {}
  );
  return res.send(roomsWithoutCircularRefs);
});

router.get("/api/getPublicRooms", function (req, res) {
  // send back list of active rooms on the server
  const roomsWithoutCircularRefs = Object.entries(server.rooms).reduce(
    (newObj, [roomName, room]) => {
      if (!room.isPrivate && room.players.length < 8) {
        const { timer, ...rest } = room;
        newObj[roomName] = rest;
      }
      return newObj;
    },
    {}
  );
  return res.send(roomsWithoutCircularRefs);
});

router.get("/api/getPlayerInfo", function (req, res) {
  const { id, roomName } = req.query;
  try {
    const playerInfo = server.rooms[roomName].players.find(
      (player) => player.id === id
    );
    return res.send(playerInfo);
  } catch {
    res.end();
  }
});

module.exports = router;
