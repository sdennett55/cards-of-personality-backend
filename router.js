const express = require('express');
const { checkDatabase, addRowToTable, getRecordId } = require('./database');

const router = express.Router();

router.get('/api/getPublicDecks', function (req, res) {
  console.log('anything!!!');

  // Check Airtable
  checkDatabase('decks', (records, fetchNextPage) => {
    // return res.send('') early for some reason
    fetchNextPage();
  }, (err, records) => {
    if (err) {
      console.error(`There was an error when checking the database: ${err}`)
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
        console.log('added!!!!!', records);
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

  // add new row to decks table, @todo check if "name" value exists first
  addRowToTable({
    table: 'decks', fields: { name: deckName, isPublic: 'true' }, onSuccess: records => {
      return res.send('Success!');
    }
  })
  console.log(deckName);
});

module.exports = router;