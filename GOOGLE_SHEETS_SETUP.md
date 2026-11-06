# Google Sheets RSVP and Blessings Setup

The website is static (GitHub Pages), so it uses a Google Apps Script web app to write to and read from a private Google Sheet. The Apps Script URL is public website configuration, not a password; do not put a service-account key or other secret in the website.

## 1. Create the Sheet endpoint

1. Create or open the Google Sheet that should receive responses.
2. In that Sheet, choose **Extensions → Apps Script**.
3. Replace the editor contents with [`google-apps-script/Code.gs`](./google-apps-script/Code.gs), then save.
4. Choose **Deploy → New deployment → Web app**.
5. Set **Execute as** to your account and **Who has access** to **Anyone**, then deploy and authorize it.
6. Copy the deployed web app URL ending in `/exec`. The script creates an `RSVPs` tab and its headers the first time it receives a request.

The endpoint must be publicly reachable because guests' browsers submit RSVPs directly. The Sheet itself can remain private; the public endpoint exposes the fields already shown on the Blessings Wall.

## 2. Configure the React website

- For local development, set `VITE_GOOGLE_APPS_SCRIPT_URL` in your local `.env` to the `/exec` URL.
- For GitHub Pages, add a repository Actions variable named `VITE_GOOGLE_APPS_SCRIPT_URL` with that same URL under **Settings → Secrets and variables → Actions → Variables**, then redeploy.

## 3. Configure the standalone website

Set `window.WEDDING_SHEETS_URL` in [`standalone/config.js`](./standalone/config.js) to the `/exec` URL before publishing the standalone files.

After configuration, RSVP submissions (including blessings) are appended to the Sheet. The Blessings Wall loads shared entries from the Sheet and displays new submissions. If the endpoint is not configured or a save cannot be confirmed, the current browser still keeps the entry locally and the form reports that it was not synced.
