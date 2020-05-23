const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.API_KEY }).base('app5oEZz7EoiHm2np');
const decksTable = base('decks');

function checkDatabase(table = 'decks', eachPageCallback, doneCallback) {
  var scopedRecords = [];
  base(table).select({
    view: "Grid view"
  }).eachPage(function page(records, fetchNextPage) {
    scopedRecords = [...scopedRecords, ...records];
    eachPageCallback(records, fetchNextPage);
  }, function done(err) {
    doneCallback(err, scopedRecords);
  });
}

function removeFromDatabase(id, removeCallback) {
  decksTable.destroy([id], function (err, deletedRecords) {
    if (err) {
      console.error(`There was an issue removing the user ID from the database: ${err}`);
      return;
    }

    removeCallback(deletedRecords);
  });
}

function addRowToTable({table = 'decks', fields, res, onSuccess}) {
  base(table).create([
    {
      "fields": {
        ...fields
      }
    }
  ], function (err, records) {
    if (err) {
      throw new Error(`There was an issue writing to the database: ${err}`);
    }

    return onSuccess(records);
  });
}

// get ID of deckName (e.g. strange-dudes within "decks" table)
function getRecordId(tableName = 'decks', deckName) {
  return new Promise((resolve, reject) => {
    var scopedRecords = [];
    base(tableName).select({
      view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
      scopedRecords = [...scopedRecords, ...records];
      fetchNextPage();
    }, function done(err) {
      if (err) reject(err);

      // console.table(scopedRecords);
      
      const id = scopedRecords.find(rec => rec.fields.name === deckName);

      if (id) {
        resolve(id.getId());
      } else {
        reject('ID doesn\'t exist');
      }
    });
  })
}

module.exports = {checkDatabase, removeFromDatabase, addRowToTable, getRecordId};