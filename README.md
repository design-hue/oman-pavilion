# Oman Pavilion · COP31 touch screens

Static website for GitHub Pages. No server, no sign-in.

| Page | Address after publishing |
|---|---|
| Start page | `https://<your-user>.github.io/oman-pavilion/` |
| Registration Screen | `https://<your-user>.github.io/oman-pavilion/registration/` |
| Get to Know Oman | `https://<your-user>.github.io/oman-pavilion/get-to-know-oman/` |

## Publish on GitHub Pages
1. Sign in at github.com > **New repository** > name it `oman-pavilion` > **Public** > Create.
2. On the new repository page click **uploading an existing file**, drag **everything inside this folder**
   (index.html, registration, get-to-know-oman, google-sheet, README.md) into the page > **Commit changes**.
3. **Settings > Pages** > Source: **Deploy from a branch** > Branch: **main**, folder **/ (root)** > Save.
4. After 1–2 minutes the address appears at the top of the Pages settings. Open it on the kiosk and press **F11**.

## Registration data
- Each visitor (name, country, time, language) is saved in the kiosk browser.
- Staff dashboard: on the welcome screen hold **COP31 · OMAN PAVILION** for 2 seconds.
  Shows totals, countries, charts and the latest visitors, and **Download visitor list (CSV)**.
- Use the same browser on the same kiosk for all 12 days and download the CSV every evening.
- Do not clear the browser's history/site data on the kiosk – that would delete the stored list.
- Optional: also save every visitor to a **Google Sheet** – see `google-sheet/README.txt`.

## Get to Know Oman
- English-only 1920×1080 touch screen: General Facts, National Indicators, Visual Identity,
  Visitor Journey (floor plan with zones) and live Weather (Open-Meteo, inside the screen).
- Swipe or use the arrows to move between topics; **Home** returns to the start.
- After 80 seconds without a touch it asks "Still exploring?" and then goes back to the start.
- All texts are in `get-to-know-oman/index.html`; images are in `get-to-know-oman/assets/`.
