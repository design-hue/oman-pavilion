OPTIONAL: SAVE EVERY REGISTRATION TO A GOOGLE SHEET
Without this, registrations stay in the kiosk browser (see the dashboard and download the CSV there).
With it, every visitor is also written to a Google Sheet you can open from any phone or computer.

1. sheets.google.com > Blank spreadsheet > name it "Oman Pavilion Visitors".
2. Extensions > Apps Script. Delete what is there, paste everything from Code.gs, Save.
3. Choose the function "setup" at the top > Run > Review permissions > your account >
   Advanced > Go to (project) > Allow.  The sheet now has tabs "Visitors" and "Summary".
4. Deploy > New deployment > gear icon > Web app
      Execute as: Me      Who has access: Anyone      > Deploy
   Copy the Web app URL (https://script.google.com/macros/s/.../exec).
5. On GitHub open registration/index.html > pencil (Edit) > find the line
      const SHEET_URL = "";
   paste the URL between the quotes > Commit changes. Wait 1 minute for GitHub Pages to update.
6. Register a test visitor on the kiosk. It appears in the "Visitors" tab within a few seconds.
   Delete the test row before the event.
