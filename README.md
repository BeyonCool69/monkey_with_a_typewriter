# The Monkey and the Typewriter

One simulated monkey presses a random key (a–z or space) every 0.3 seconds, and everyone who opens the page sees the same keystrokes at the same moment. Words the monkey happens to type are highlighted and collected in a sidebar. You can search the text, click a word to jump to it, and hover over any letters to see how many hours after the start they were typed.

It is a static site: plain HTML and JavaScript, hosted on GitHub Pages, with no server of its own.

## How it works

- **Randomness:** letters come from [drand](https://drand.love) (the `quicknet` chain), a public randomness beacon run by the League of Entropy. It publishes 32 random bytes every 3 seconds. Each round becomes 10 letters, chosen without bias. The page types a round one round after it is published, so nothing exists before it is typed.
- **Everyone sees the same monkey:** the letter on screen depends only on the clock and the drand round number.
- **History:** `scripts/archive.mjs` runs every 30 minutes in GitHub Actions and saves finished rounds as text files in `archive/` (30-minute chunks, 48 per page, one page per 24 hours). Only letters that have already been typed are stored.
- **If the archive is behind:** the page fetches the newest missing rounds from drand itself. Anything older that is missing shows as `·` until the next archive run fills it in.
- **Words:** a word is a run of at least 3 letters between two spaces that is in `words.txt` (the ENABLE word list).

## Run it locally

You need Node.js 20 or newer.

1. `node scripts/archive.mjs` creates `archive/meta.json`, which records the drand round where the monkey starts.
2. `python3 -m http.server 8000`
3. Open <http://localhost:8000>.

Locally the archive only grows when you run step 1 again.

## Deploy to GitHub Pages

1. Push this folder to a new GitHub repository.
2. Settings → Pages: deploy from branch `main`, folder `/ (root)`.
3. Settings → Actions → General → Workflow permissions: **Read and write permissions**.
4. Actions tab → "Archive monkey typing" → **Run workflow**, once. This starts the monkey.
5. In `index.html`, replace `YOUR-USERNAME` and `YOUR-REPO` (link preview tags and the About dialog) with your own, and add a name to `LICENSE`.

## Settings

- `MIN_LEN` in `index.html`: the shortest word that counts (default 3).
- `PER_ROUND` in **both** `index.html` and `scripts/archive.mjs`: letters per drand round (default 10, one letter every 0.3 s). If you change it, delete `archive/` and start again.
- `words.txt`: one lowercase word per line. Add or remove words freely; it only affects highlighting.

## Notes and limits

- The monkey depends on drand's public servers. The page tries four mirrors and shows "napping" if none respond.
- drand signatures are not verified in the browser or by the archive script.
- GitHub may delay or skip scheduled workflow runs, and disables them after a long period of repository inactivity.

## Credits and license

Built with [Claude](https://claude.ai), an AI assistant made by Anthropic.

Randomness: [drand](https://drand.love) / League of Entropy. Word list: [ENABLE](https://github.com/dolph/dictionary) (public domain). Code: MIT, see `LICENSE`.