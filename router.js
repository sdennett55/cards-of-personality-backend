const express = require('express');
const server = require('./server');
const { shuffle, blackListFilter } = require('./helpers.js');
const { getPublicDecks, getDeck, createDeck } = require('./models/deck');
const { getCardsFromDeck, addCard, deleteCard, editCard } = require('./models/card');
const { DeckCache } = require('./cache');

// Initialize cache
const cache = new DeckCache();

const router = express.Router();

router.post('/api/checkAvailableRooms', function (req, res) {
  if (Object.keys(server.rooms).includes(req.body.roomName)) {
    return res.send('game exists');
  }

  return res.end();
});

router.get('/api/getPublicDecks', async function (req, res) {
  try {
    const allPublicDecks = await getPublicDecks();
    return res.send(allPublicDecks);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving public decks...', err.message);
  }
});

router.get('/api/getApprovedPublicDecks', async function (req, res) {
  try {
    const allApprovedPublicDecks = await getPublicDecks({ approved: true });
    return res.send(allApprovedPublicDecks);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving public decks...', err.message);
  }
});

router.post('/api/getDeck', async function (req, res) {
  const deckName = req.body.deck;
  try {
    const deckExists = await getDeck(deckName);
    console.log({ deckExists });
    if (deckExists) {
      return res.send('Deck exists!');
    } else {
      return res.status(500).send("Error: This deck doesn't exist...");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving this deck...', err.message);
  }
});

router.get('/api/getCardsFromDeck/:name', async function (req, res) {
  const deckName = req.params.name;

  let totalCards = [];

  try {
    const deckExists = await getDeck(deckName);
    const { hasSFWCards, hasNSFWCards } = deckExists;
    if (!deckExists) {
      return res.send('no result');
    }

    if (hasSFWCards || hasNSFWCards) {
      let SFWCards = await getCardsFromDeck('safe-for-work');
      totalCards.push(...blackListFilter({ cards: SFWCards, deck: deckExists }));
    }
    if (hasNSFWCards) {
      let NSFWCards = await getCardsFromDeck('not-safe-for-work');
      totalCards.push(...blackListFilter({ cards: NSFWCards, deck: deckExists }));
    }

    const cardsFromDeck = await getCardsFromDeck(deckName);
    totalCards.unshift(...cardsFromDeck);
    return res.send(totalCards);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }
});

router.post('/api/addCard', async function (req, res) {
  const { deckName: deck, text, type, secret } = req.body;

  if (!text.replace(/\s/g, '')) {
    return res.send(`Error: Please submit more than 0 characters for the ${type} card.`);
  }

  // check if card already exists in the deck
  try {
    let totalCards = [];

    const cardsFromDeck = await getCardsFromDeck(deck);

    const theDeck = await getDeck(deck);

    // Don't allow folks to try to hit this endpoint and update these two decks
    // Requires a secret key
    if (secret !== theDeck._id + '') {
      return res.send(`Error: You do not have permissions to add a ${type} card to this deck.`);
    }

    const { hasSFWCards, hasNSFWCards } = theDeck;
    totalCards.push(...cardsFromDeck);

    if (hasSFWCards || hasNSFWCards) {
      const SFWCards = await getCardsFromDeck('safe-for-work');
      totalCards.push(...SFWCards);
    }
    if (hasNSFWCards) {
      const NSFWCards = await getCardsFromDeck('not-safe-for-work');
      totalCards.push(...NSFWCards);
    }

    const cardExists = totalCards.find(({ text: newText, type: newType }) => {
      return type === newType && text === newText;
    });

    if (cardExists) {
      return res.send(`Error: This ${type} card already exists in the deck.`);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving cards from the deck when adding a new card...', err.message);
  }

  try {
    await addCard({ type, text, deck });
    return res.send('Success!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }
});

router.post('/api/deleteCard', async function (req, res) {
  const { deckName: deck, text, type, secret } = req.body;

  const theDeck = await getDeck(deck);

  // Don't allow folks to try to hit this endpoint and update these two decks
  // Requires a secret key
  if (secret !== theDeck._id + '') {
    return res.send(`Error: You do not have permissions to remove a ${type} card from this deck.`);
  }

  try {
    await deleteCard({ type, text, deck });
    return res.send(`Success! Deleted the ${type} card of text "${text}" from ${deck}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }
});

router.post('/api/editCard', async function (req, res) {
  const { deckName: deck, oldText, text, type, secret } = req.body;

  const theDeck = await getDeck(deck);

  // Don't allow folks to try to hit this endpoint and update these two decks
  // Requires a secret key
  if (secret !== theDeck._id + '') {
    return res.send(`Error: You do not have permissions to remove a ${type} card from this deck.`);
  }

  try {
    await editCard({ type, oldText, text, deck });
    return res.send(`Success! Edited the ${type} card of text "${oldText}" to "${text}" from ${deck}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving cards from the deck...', err.message);
  }
});

router.post('/api/createDeck', async function (req, res) {
  const { deckName, isPrivate, hasSFWCards, hasNSFWCards } = req.body;

  const deckExists = await getDeck(deckName);
  if (deckExists) {
    return res.send('Error: This deck already exists.');
  }

  try {
    const newDeck = await createDeck({
      name: deckName,
      isPublic: !isPrivate,
      hasSFWCards,
      hasNSFWCards,
    });
    return res.send(newDeck._id);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue saving this deck to the database...', err.message);
  }
});

router.post('/api/getDeckSecret', async function (req, res) {
  const { secret, deckName } = req.body;

  if (!secret) {
    return res.status(500).send("Error: You don't have permissions to edit this deck.");
  }

  try {
    const deckExists = await getDeck(deckName);
    if (!deckExists) {
      return res.status(500).send("Error: This deck doesn't exist.");
    }
    if (deckExists._id + '' === secret) {
      return res.send('Success!');
    } else {
      return res.status(500).send("Error: You don't have permissions to edit this deck.");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue saving this deck to the database...', err.message);
  }
});

router.post('/api/getInitialCards', async function (req, res) {
  const { deckName, roomId } = req.body;

  // the first client that connects and hits this route, sets the cards for the game
  // if cards are already set, send back an empty response
  console.log('hitting getInitialCards route', server.rooms[roomId] ? server.rooms[roomId].blackCards.length : 'blah');
  if (server.rooms[roomId]) {
    if (server.rooms[roomId].initialCardsAreSet) {
      return res.end();
    }

    server.rooms[roomId].initialCardsAreSet = true;
    console.log('initial cards are set!');
  }

  try {
    let totalCards = [];

    // If the SFW or NSFW default decks exist in the in-memory cache, get them from there!
    if ((deckName === 'safe-for-work' || deckName === 'not-safe-for-work') && cache.get(deckName)) {
      const cardsFromCache = JSON.parse(cache.get(deckName));
      totalCards.push(...cardsFromCache);
      console.log(`Loaded the ${deckName} deck from cache!`);
    } else {
      // Otherwise, grab custom decks from MongoDB
      if (deckName) {
        const deckExists = await getDeck(deckName);
        const { hasSFWCards, hasNSFWCards } = deckExists;
        const cardsFromDeck = await getCardsFromDeck(deckName);
        totalCards.push(...cardsFromDeck);

        if (hasSFWCards || hasNSFWCards) {
          let SFWCards = cache.get('safe-for-work') || (await getCardsFromDeck('safe-for-work'));
          totalCards.push(...blackListFilter({ cards: SFWCards, deck: deckExists }));
        }
        if (hasNSFWCards) {
          let NSFWCards = cache.get('not-safe-for-work') || (await getCardsFromDeck('not-safe-for-work'));
          totalCards.push(...blackListFilter({ cards: NSFWCards, deck: deckExists }));
        }
      } else {
        // if there's no deck query param, load SFW deck by default
        const SFWCards = cache.get('safe-for-work') || (await getCardsFromDeck('safe-for-work'));
        totalCards.push(...SFWCards);
      }

      // Only add SFW or NSFW deck to cache for now
      if (deckName === 'safe-for-work' || deckName === 'not-safe-for-work') {
        cache.set({
          key: deckName,
          data: JSON.stringify(totalCards),
          ttl: 86400,
        });
        console.log(`Added ${deckName} deck to cache!`);
      }
    }

    const blackCards = shuffle(totalCards.filter(({ type }) => type === 'black').map(({ text }) => text));
    const whiteCards = shuffle(totalCards.filter(({ type }) => type === 'white').map(({ text }) => text));

    // just send back array of text for each
    // shuffle them first
    return res.send({ blackCards, whiteCards });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error: There was an issue retrieving initial cards from this deck...', err.message);
  }
});

router.get('/api/getActiveRooms', function (req, res) {
  // send back list of active rooms on the server
  const roomsWithoutCircularRefs = Object.entries(server.rooms).reduce((newObj, [roomName, room]) => {
    const { timer, ...rest } = room;
    newObj[roomName] = rest;
    return newObj;
  }, {});
  return res.send(roomsWithoutCircularRefs);
});

router.get('/api/getPublicRooms', function (req, res) {
  // send back list of active rooms on the server
  const roomsWithoutCircularRefs = Object.entries(server.rooms).reduce((newObj, [roomName, room]) => {
    if (!room.isPrivate && room.players.length < 8) {
      const { timer, ...rest } = room;
      newObj[roomName] = rest;
    }
    return newObj;
  }, {});
  return res.send(roomsWithoutCircularRefs);
});

router.get('/api/getPlayerInfo', function (req, res) {
  const { id, roomName } = req.query;
  try {
    const playerInfo = server.rooms[roomName].players.find((player) => player.id === id);
    return res.send(playerInfo);
  } catch {
    res.end();
  }
});

module.exports = router;
