const express = require('express');
const { checkDatabase, checkDatabasePromise, addRowToTable, getRecordId } = require('./database');

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

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

const router = express.Router();

router.get('/api/getPublicDecks', function (req, res) {
  // Check Airtable
  checkDatabase('decks', (records, fetchNextPage) => {
    // return res.send('') early for some reason
    fetchNextPage();
  }, (err, records) => {
    if (err) {
      res.send(`Error: There was an error when checking the database: ${err}`)
    }

    return res.send(records.map(({ fields }) => ({ ...fields })));
  });
});

router.get('/api/getTable/:name', function (req, res) {
  const tableName = req.params.name;

  // Check Airtable
  checkDatabase('cards', (records, fetchNextPage) => {
    // return res.send('') early for some reason
    fetchNextPage();
  }, async (err, records) => {
    if (err) {
      console.error(`There was an error when checking the database: ${err}`);
      return res.send('no result');
    }

    // get ID of deckName
    try {
      const tableId = await getRecordId('decks', tableName);

      const matches = records.filter(rec => {
        if (rec.fields.decks) {
          return rec.fields.decks[0] === tableId;
        }
      }).map(({ fields }) => ({ ...fields }));

      return res.send(matches);

    } catch (err) {
      console.log(`Promise failed due to error: ${err}`);
      return res.send('no result');
    }

  });
});

router.post('/api/addCard', async function (req, res) {
  const { deckName, text, type } = req.body;

  if (!text.replace(/\s/g, '')) {
    return res.send(`Error: Please submit more than 0 characters for the ${type} card.`)
  }

  var tableId;

  try {
    tableId = await getRecordId('decks', deckName);
  } catch (err) {
    return res.send(`Error: There was an error checking this deck for this ${type} card.`);
  }

  // Check to see if the card already exists in the deck, in case some bums spoof around frontend checks
  if (process.env.NODE_ENV  !== 'development') {
    await checkDatabasePromise('cards', (records, fetchNextPage) => {
      if (records.find(record => record.fields.decks.includes(tableId) && record.fields.type === type && record.fields.text.toLowerCase() === text.toLowerCase())) {
        return res.send(`Error: This ${type} card already exists in the deck.`);
      }
      fetchNextPage();
    }, (err, records) => {
      if (err) {
        return res.send(`Error: There was an error checking the database for this ${type} card.`);
      }
    });
  }

  // get ID of deckName
  try {
    addRowToTable({
      table: 'cards', fields: { type, text: text, decks: [tableId] }, res, onSuccess: records => {
        // console.log('added!!!!!', records);
        return res.send('Success!');
      }
    })

    console.log(text);
  } catch (err) {
    console.log(`Promise failed due to error: ${err}`);
  }

});

router.post('/api/createDeck', function (req, res) {
  const { deckName } = req.body;

  checkDatabase('decks', (records, fetchNextPage) => {
    // return res.send('') early for some reason
    fetchNextPage();
  }, (err, records) => {
    if (err) {
      console.error(`There was an error when checking the database: ${err}`)
    }

    if (records.find(record => record.fields.name === deckName)) {
      return res.send('Error: This deck already exists.');
    }

    // add new row to decks table, @todo check if "name" value exists first
    addRowToTable({
      table: 'decks', fields: { name: deckName, isPublic: 'true' }, onSuccess: records => {
        console.log(records);
        return res.send('Success!');
      }
    })
    console.log(deckName);
  });

});

router.post('/api/getInitialCards', async function (req, res) {
  // the first client that connects and hits this route, sets the cards for the game
  // if cards are already set, send back an empty response
  if (req.app.get('initialCardsAreSet')) {
    return res.end();
  }

  req.app.set('initialCardsAreSet', true);
  
  const { deckName } = req.body;

  const decksToFilterBy = await checkDatabasePromise('decks', (records, fetchNextPage) => {
    fetchNextPage();
  }, (err, records) => {
    if (err) {
      console.error(`There was an error when checking the database: ${err}`)
    }

    const matchedDeck = records.find(record => record.fields.name === deckName);
    // if the deck exists
    if (matchedDeck) {
      const { name: deckName, hasSFWCards, hasNSFWCards } = matchedDeck.fields;

      if (hasSFWCards === 'true' && hasNSFWCards === 'true') {
        return records.filter(record => record.fields.name === deckName || record.fields.name === 'safe-for-work' || record.fields.name === 'not-safe-for-work').map(x => x.getId());
      }
      if (hasSFWCards === 'true') {
        return records.filter(record => record.fields.name === deckName || record.fields.name === 'safe-for-work').map(x => x.getId());
      }
      if (hasNSFWCards === 'true') {
        return records.filter(record => record.fields.name === deckName || record.fields.name === 'not-safe-for-work').map(x => x.getId());
      }

      return records.filter(record => record.fields.name === deckName).map(x => x.getId());
    } else {
      // if deck doesn't exist
      return records.filter(record => record.fields.name === 'safe-for-work' || record.fields.name === 'not-safe-for-work').map(x => x.getId());
    }
  });

  checkDatabase('cards', (records, fetchNextPage) => {
    fetchNextPage();
  }, (err, records) => {
    if (err) {
      console.error(`There was an error when checking the database: ${err}`)
    }

    // get cards based on if their decks field exists in decksToFilterBy
    const cards = records.filter(record => {
      for (const deckId of record.fields.decks) {
        return decksToFilterBy.includes(deckId);
      }
    }).map(({ fields }) => ({ ...fields }));

    const blackCards = shuffle(cards.filter(card => card.type === 'black').map(({ text }) => text));
    const whiteCards = shuffle(cards.filter(card => card.type === 'white').map(({ text }) => text));

    return res.send({ blackCards, whiteCards });
  });
});

module.exports = router;