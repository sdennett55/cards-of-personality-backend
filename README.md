# Cards of Personality (frontend)
A mobile-first multiplayer web game inspired by the popular Cards Against Humanity card game.

## How to Deploy Your Own Instance of the Game

1. Clone the [backend](https://github.com/sdennett55/cards-of-personality-backend).

2. Push the repo to github, and then deploy to Heroku with this link using your github repo URL: https://heroku.com/deploy?template=URL_TO_YOUR_BACKEND_GITHUB_REPO/tree/master

3. Duplicate this [Airtable template](https://airtable.com/shr9xPObtiWFRa3gU) which holds the cards and decks data by clicking "Copy Base" in the top right of the page.

4. Add your [Airtable API key](https://airtable.com/account) as a config var via [Heroku Dashboard](https://dashboard.heroku.com/apps) (Go to settings tab of your app. The key name being `API_KEY` and the value is the Airtable API key).

5. Clone the [frontend](https://github.com/sdennett55/cards-of-personality-frontend).

6. Add the URL to your new heroku backend to `netlify.toml` and `src/config.js` and then deploy to Netlify with this link using your github repo URL: https://app.netlify.com/start/deploy?repository=URL_TO_YOUR_FRONTEND_GITHUB_REPO

7. Play the game by hitting your netlify site! Share the link with friends.

8. (Optional) Specify a deck to load via the `deck` url param, e.g. [https://yourSiteName.netlify.app?deck=safe-for-work] will only load cards from the _safe-for-work_ deck.

### `yarn start:dev`

Runs the server in development mode.<br />
