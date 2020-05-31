# Cards of Personality (frontend)
A mobile-first multiplayer web game inspired by the popular Cards Against Humanity card game.

## How to Deploy Your Own Instance of the Game

1. Create Airtable account and copy this [https://airtable.com/shr9xPObtiWFRa3gU/tbl0ejyvUH79Pnpw8/viw5Kx09PFQ2RDtev](Airtable template), which holds the cards and decks data:

2. Clone the [https://github.com/sdennett55/cards-of-personality-frontend](frontend) (this repo) and [https://github.com/sdennett55/cards-of-personality-backend](backend) repos, which we will deploy to Netlify and Heroku respectively.

3. Deploy frontend to Netlify via the button below.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/sdennett55/cards-of-personality-frontend)

4. Add your [https://airtable.com/account](Airtable API key) to the `backend/app.json` file and then click the button below.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sdennett55/cards-of-personality-backend/tree/master)

5. Play the game by hitting your netlify URL! Share the link with friends.

6. (Optional) Specify a deck to load via the `deck` url param, e.g. [https://yourSiteName.netlify.app?deck=safe-for-work] will only load cards from the safe-for-work deck.

# Cards of Personality (backend)
A mobile web game inspired by the popular Cards Against Humanity card game.

### `yarn start:dev`

Runs the server in development mode.<br />
