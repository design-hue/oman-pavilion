/**
 * Registration Screen – Oman Pavilion, COP31
 * Receives registrations from the GitHub Pages kiosk (registration/index.html) and saves each
 * visitor (name + country) to the "Visitors" sheet of the Google Sheet this script belongs to.
 */
const SHEET = 'Visitors';
const HEAD = ['Timestamp', 'Date', 'Time', 'Name', 'Country', 'Country code', 'Language'];

function doGet() {
  return ContentService.createTextOutput('Registration Screen receiver is running.');
}

/** The kiosk page sends each registration here (POST, JSON text). */
function doPost(e) {
  try {
    register(JSON.parse(e.postData.contents));
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}

/** Called by the touch screen when a visitor taps Register. */
function register(rec) {
  const clean = v => {
    let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80);
    if (/^[=+\-@]/.test(s)) s = "'" + s;          // never let a name run as a formula
    return s;
  };
  const name = clean(rec && rec.name);
  const code = String(rec && rec.country || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  if (!name || code.length !== 2) throw new Error('Missing name or country');
  const tz = Session.getScriptTimeZone();
  const when = rec && rec.ts ? new Date(rec.ts) : new Date();
  const row = [when, Utilities.formatDate(when, tz, 'yyyy-MM-dd'), Utilities.formatDate(when, tz, 'HH:mm'),
               name, clean(rec.countryName || code), code, rec && rec.lang === 'ar' ? 'Arabic' : 'English'];
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sheet_().appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/** Run once from the editor (select "setup" and press Run) to create the sheets. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const v = sheet_();
  v.getRange('B:C').setNumberFormat('@');
  v.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  let s = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  s.clear();
  s.getRange('A1').setValue('Oman Pavilion visitors').setFontWeight('bold').setFontSize(16);
  s.getRange('A3:B3').setValues([['Visitors, all days', '']]);
  s.getRange('B3').setFormula('=COUNTA(Visitors!D2:D)');
  s.getRange('A4').setValue('Visitors today');
  s.getRange('B4').setFormula('=COUNTIF(Visitors!B2:B, TEXT(TODAY(), "yyyy-mm-dd"))');
  s.getRange('A5').setValue('Countries');
  s.getRange('B5').setFormula('=IFERROR(COUNTUNIQUE(Visitors!F2:F), 0)');
  s.getRange('A7').setValue('Visitors per day').setFontWeight('bold');
  s.getRange('A8').setFormula('=IFERROR(QUERY(Visitors!A1:G, "select B, count(D) where D is not null group by B order by B label B \'Date\', count(D) \'Visitors\'", 1), "No visitors yet")');
  s.getRange('D7').setValue('Visitors by country').setFontWeight('bold');
  s.getRange('D8').setFormula('=IFERROR(QUERY(Visitors!A1:G, "select E, count(D) where D is not null group by E order by count(D) desc label E \'Country\', count(D) \'Visitors\'", 1), "No visitors yet")');
  s.setColumnWidth(1, 180); s.setColumnWidth(4, 220);
  ss.setActiveSheet(s);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let v = ss.getSheetByName(SHEET);
  if (!v) {
    v = ss.insertSheet(SHEET, 0);
    v.appendRow(HEAD);
    v.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
    v.setFrozenRows(1);
    v.getRange('B:C').setNumberFormat('@');
  }
  return v;
}
