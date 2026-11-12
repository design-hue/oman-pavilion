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
const TZ = 'Europe/Istanbul';     // event time zone: every day/hour is counted in this zone, whatever a device's clock zone is
const EVENT_START = '2026-11-09';  // registrations from before the event (tests) are not kept
const HEAD = ['Timestamp', 'Date', 'Time', 'Name', 'Country', 'Country code', 'Language', 'ID', 'Day', 'Hour', 'Device'];   // column L holds the shared Visitor no. formula

/** Dashboard: GET ?key=STAFF_KEY  ->  JSON list of all visitors. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.ping) return json_({ ok: true });
  if (p.ids) {   // kiosks: which visitor IDs the sheet already has (IDs only, no names) so they can re-send anything missing
    const sh = sheet_(), n = sh.getLastRow() - 1;
    const ids = n > 0 ? sh.getRange(2, 8, n, 1).getValues().map(r => String(r[0])).filter(String) : [];
    return json_({ ok: true, ids: ids });
  }
  if (String(p.key || '') !== STAFF_KEY) return json_({ ok: false, error: 'key' });
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, HEAD.length).getValues() : [];
  const out = rows.filter(r => r[3]).map(r => {
    const ts = r[0] instanceof Date ? r[0] : new Date(r[0]);
    return { ts: ts.toISOString(), name: String(r[3]).replace(/^'/, ''), countryName: String(r[4]), country: String(r[5]),
             lang: r[6] === 'Arabic' ? 'ar' : 'en', id: String(r[7] || ''),
             day: Utilities.formatDate(ts, TZ, 'yyyy-MM-dd'), hour: Number(Utilities.formatDate(ts, TZ, 'H')), device: String(r[10] || '') };
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
  let when = rec && rec.ts ? new Date(rec.ts) : new Date();
  if (isNaN(when.getTime())) when = new Date();
  const id = clean(rec.id || (when.toISOString() + '|' + String(rec.name || '') + '|' + code));
  const day = Utilities.formatDate(when, TZ, 'yyyy-MM-dd');
  if (day < EVENT_START) return { ok: true, skipped: 'before event' };
  const hour = Number(Utilities.formatDate(when, TZ, 'H'));
  // the leading ' keeps Sheets from turning the date/time text into date values
  const row = [when, "'" + day, "'" + Utilities.formatDate(when, TZ, 'HH:mm'), name, code === 'PS' ? 'Palestine' : clean(rec.countryName || code), code,
               rec && rec.lang === 'ar' ? 'Arabic' : 'English', id, "'" + day, hour, clean(rec.device || '')];
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('busy');   // the kiosk keeps the visitor and sends it again
  try {
    const sh = sheet_();
    const n = sh.getLastRow() - 1;
    if (n > 0) {
      if (sh.getRange(2, 8, n, 1).createTextFinder(id).matchEntireCell(true).findNext()) return { ok: true, dup: true };
      // same person, same second, same country = the same registration sent again
      const vals = sh.getRange(2, 1, n, 8).getValues(), sec = Math.floor(when.getTime() / 1000);
      for (let i = 0; i < vals.length; i++) {
        const t = vals[i][0] instanceof Date ? vals[i][0].getTime() : NaN;
        if (Math.floor(t / 1000) === sec && String(vals[i][3]) === name.replace(/^'/, '') && vals[i][5] === code) {
          if (!vals[i][7]) sh.getRange(i + 2, 8).setValue(id);
          return { ok: true, dup: true };
        }
      }
    }
    sh.appendRow(row);
    // keep the list in time order (a device that was offline can send earlier visitors later)
    if (n > 0 && sh.getRange(n + 1, 1).getValue() > when) sh.getRange(2, 1, n + 1, HEAD.length).sort({ column: 1, ascending: true });
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

/** Removes repeated rows (same second + name + country) and rows from before the event, keeps the first,
 *  fills empty IDs, recounts Date / Time / Day / Hour in the event time zone and sorts by time. Safe to run any time. */
function cleanup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_();
    const n = sh.getLastRow() - 1;
    if (n < 1) return 'nothing to do';
    const vals = sh.getRange(2, 1, n, HEAD.length).getValues();
    const seen = new Set(), keep = [];
    vals.forEach(r => {
      if (!r[3]) return;
      const t = r[0] instanceof Date ? r[0] : new Date(r[0]);
      const key = Math.floor(t.getTime() / 1000) + '|' + String(r[3]).trim() + '|' + r[5];
      if (seen.has(key)) return;
      seen.add(key);
      const day = Utilities.formatDate(t, TZ, 'yyyy-MM-dd');
      if (day < EVENT_START) return;
      keep.push([t, "'" + day, "'" + Utilities.formatDate(t, TZ, 'HH:mm'), r[3], r[4], r[5], r[6],
                 r[7] || (t.toISOString() + '|' + String(r[3]) + '|' + r[5]).slice(0, 80), "'" + day, Number(Utilities.formatDate(t, TZ, 'H')), r[10] || '']);
    });
    keep.sort((a, b) => a[0] - b[0]);
    sh.getRange(2, 1, n, HEAD.length).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, HEAD.length).setValues(keep);
    if (keep.length && n > keep.length) sh.deleteRows(keep.length + 2, n - keep.length);
    return 'kept ' + keep.length + ' of ' + n;
  } finally {
    lock.releaseLock();
  }
}

/** One-off: show every Palestine row as "Palestine" in the Country column. */
function fixPalestine() {
  const sh = sheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const r = sh.getRange(2, 5, n, 2), v = r.getValues(); let c = 0;
  v.forEach(x => { if (x[1] === 'PS' && x[0] !== 'Palestine') { x[0] = 'Palestine'; c++; } });
  if (c) sh.getRange(2, 5, n, 1).setValues(v.map(x => [x[0]]));
  return c;
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
