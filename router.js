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
  console.log('anything!!!');

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
  console.log('wtf', req.params.name);

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

    // console.log(records.map(rec => rec.fields.decks))
    // // return res.send(records);
  });
});

router.post('/api/addCard', async function (req, res) {
  const { deckName, text, type } = req.body;

  // get ID of deckName
  try {
    const tableId = await getRecordId('decks', deckName);

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
        return records.filter(record => record.fields.name === 'safe-for-work').map(x => x.getId());
      }
      if (hasNSFWCards === 'true') {
        return records.filter(record => record.fields.name === 'not-safe-for-work').map(x => x.getId());
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

    const blackCards = shuffle(cards.filter(card => card.type === 'black').map(({text}) => text));
    const whiteCards = shuffle(cards.filter(card => card.type === 'white').map(({text}) => text));

    return res.send({blackCards, whiteCards});
  });
});

module.exports = router;