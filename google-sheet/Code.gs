/**
 * Registration Screen – Oman Pavilion, COP31
 * Central store for the kiosk: every registration from registration/index.html is saved to the
 * "Visitors" sheet, and the staff dashboard (registration/#dashboard) reads them back from any device.
 *
 * STAFF_KEY protects the visitor list: the dashboard must send it to read names.
 * Change it to your own code before deploying (do NOT commit the real code to GitHub).
 */
const STAFF_KEY = 'CHANGE-ME';
const SHEET = 'Visitors';
const HEAD = ['Timestamp', 'Date', 'Time', 'Name', 'Country', 'Country code', 'Language', 'ID', 'Day', 'Hour'];

/** Dashboard: GET ?key=STAFF_KEY  ->  JSON list of all visitors. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.ping) return json_({ ok: true });
  if (String(p.key || '') !== STAFF_KEY) return json_({ ok: false, error: 'key' });
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, HEAD.length).getValues() : [];
  const tz = tz_();
  const ymd = v => v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || '').replace(/^'/, '');
  const out = rows.filter(r => r[3]).map(r => {
    const ts = r[0] instanceof Date ? r[0] : new Date(r[0]);
    return { ts: ts.toISOString(), name: String(r[3]).replace(/^'/, ''), countryName: String(r[4]), country: String(r[5]),
             lang: r[6] === 'Arabic' ? 'ar' : 'en', id: String(r[7] || ''),
             day: ymd(r[8]) || ymd(r[1]) || Utilities.formatDate(ts, tz, 'yyyy-MM-dd'),
             hour: r[9] === '' || r[9] == null ? Number(Utilities.formatDate(ts, tz, 'H')) : Number(r[9]) };
  });
  return json_({ ok: true, visitors: out });
}

/** Kiosk: POST (JSON text) with one registration. */
function doPost(e) {
  try {
    register(JSON.parse(e.postData.contents));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function register(rec) {
  const clean = v => {
    let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80);
    if (/^[=+\-@]/.test(s)) s = "'" + s;          // never let a name run as a formula
    return s;
  };
  const name = clean(rec && rec.name);
  const code = String(rec && rec.country || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  if (!name || code.length !== 2) throw new Error('Missing name or country');
  const id = clean(rec.id || '');
  const tz = tz_();
  const when = rec && rec.ts ? new Date(rec.ts) : new Date();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(rec.day || '')) ? String(rec.day) : Utilities.formatDate(when, tz, 'yyyy-MM-dd');
  const hour = rec.hour === 0 || rec.hour ? Number(rec.hour) : Number(Utilities.formatDate(when, tz, 'H'));
  // the leading ' keeps Sheets from turning the date/time text into date values
  const row = [when, "'" + day, "'" + Utilities.formatDate(when, tz, 'HH:mm'), name, clean(rec.countryName || code), code,
               rec && rec.lang === 'ar' ? 'Arabic' : 'English', id, "'" + day, hour];
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = sheet_();
    if (id && sh.getLastRow() > 1 && sh.getRange(2, 8, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()) return { ok: true, dup: true };
    sh.appendRow(row);
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
  v.getRange('H:I').setNumberFormat('@');
  v.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm');
  let s = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  s.clear();
  s.getRange('A1').setValue('Oman Pavilion visitors').setFontWeight('bold').setFontSize(16);
  s.getRange('A3').setValue('Visitors, all days');
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
  ss.setActiveSheet(v);
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
  } else if (v.getRange(1, 8).getValue() !== 'ID') {
    v.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold');
  }
  return v;
}

function tz_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || Session.getScriptTimeZone();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
