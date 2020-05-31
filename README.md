# Cards of Personality (frontend)
A mobile-first multiplayer web game inspired by the popular Cards Against Humanity card game.

## How to Deploy Your Own Instance of the Game

1. Deploy frontend to Netlify via the button below.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/sdennett55/cards-of-personality-frontend)

2. Clone the [backend](https://github.com/sdennett55/cards-of-personality-backend) (this repo).

3. Duplicate this [Airtable template](https://airtable.com/shr9xPObtiWFRa3gU) which holds the cards and decks data by clicking "Copy Base" in the top right of the page.

4. Add your [Airtable API key](https://airtable.com/account) to the `backend/app.json` file and then click the button below to deploy to Heroku.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/sdennett55/cards-of-personality-backend/tree/master)

5. Play the game by hitting your netlify site! Share the link with friends.

6. (Optional) Specify a deck to load via the `deck` url param, e.g. [https://yourSiteName.netlify.app?deck=safe-for-work] will only load cards from the _safe-for-work_ deck.

# Cards of Personality (backend)
A mobile web game inspired by the popular Cards Against Humanity card game.

### `yarn start:dev`

Runs the server in development mode.<br />
