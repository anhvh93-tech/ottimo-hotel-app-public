/**
 * OTTIMO – backup mover and keeper for the company Google Drive (INV 07/11/2026).
 *
 * Runs INSIDE Google (Apps Script) as the company Workspace account INV chose, never on the server. INV pastes this
 * file and appsscript.json into a new Apps Script project (product/docs/huong-dan-inv-sao-luu-google-drive.md, part E).
 *
 *   Nhận  (INBOX_FOLDER_ID)  folder the SERVER created and uploads into (OAuth scope drive.file: it sees only its own
 *                            files). INV keeps it in "OTTIMO App/Sao lưu".
 *   Kho   (VAULT_FOLDER_ID)  folder INV created in "OTTIMO App/Sao lưu". Holds COPIES made by this script: the server's
 *                            drive.file token cannot see, change or delete them.
 *
 * moveInbox()        every hour: for each backup file in Nhận with its .sha256 – name and stamp checked, the SHA-256
 *                    Google computed for the file equals the one in the .sha256 – COPY both into Kho, check the copy has
 *                    the same SHA-256, then delete the server's originals. Anything else stays in Nhận (the server's
 *                    ops-check alerts after 6 h; this script alerts too). Probe files of the install check are removed.
 * dailyMaintenance() every day 09:00: retention in Kho = the rule of backup.sh (every file < 7 days; the sets stamped on
 *                    a Sunday, UTC, < 33 days; purge-journal < 40 days), run daily so no file outlives 35 days (40 for
 *                    purge-journal, ids only) – except that the NEWEST complete set is never removed (with an alert when
 *                    it is that old: backups stopped). Then the watchdog: newest db dump in Kho older than 36 h = alert.
 *                    Files in Kho with another name are never touched, only reported.
 * weeklySummary()    Monday 09:00: one e-mail "all fine / not fine" with counts and ages – so INV knows it is alive.
 * setup()            run once by INV: checks both folders, creates the three triggers. checkNow() = test e-mail.
 *
 * Alerts: e-mail to ALERT_EMAILS (Script property, comma separated) or, when empty, to this account itself; and, when
 * the Script property ALERT_WEBHOOK_URL is set (the Google Chat webhook of the room "OTTIMO – Báo động", pasted by INV
 * in the browser only), a one-line Chat message. No guest data exists here: names, counts and ages only.
 * Deletions are permanent (Drive.Files.remove), never to the trash: the trash would keep a copy 30 more days.
 * The pure functions (parseName, planMoves, planRetention, vaultHealth) are tested in Node:
 * product/infra/drive/test/backup-mover.test.mjs (CI job infra-scripts).
 */

var NAME_RE = /^(db|blobs|counts|purge-journal|privacy-notice)-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z\.(dump|tar|txt|csv|log)\.age(\.sha256)?$/;
var KIND_EXT = { db: 'dump', blobs: 'tar', counts: 'txt', 'purge-journal': 'csv', 'privacy-notice': 'log' };
var PROBE_RE = /^probe-\d{8}T\d{6}Z\.txt$/;
var HOUR = 3600 * 1000;
var DAY = 24 * HOUR;
var RULES = {
  dailyKeepDays: 7,
  weeklyKeepDays: 33,
  journalKeepDays: 40,
  inboxMaxPastDays: 7,     // a stamp older than this in Nhận is refused (not ours / replayed)
  inboxMaxFutureHours: 24, // a stamp in the future is refused (the retention reads the stamp)
  inboxAlertHours: 6,      // a file waiting longer is reported
  staleHours: 36,          // newest db dump in Kho older than this = alert (INV 07/11)
  probeMinutes: 10,
  maxSumBytes: 512
};

/** name → {kind, ext, stamp (ms UTC), isSum, base, setStamp} or null */
function parseName(name) {
  var m = NAME_RE.exec(name);
  if (!m) return null;
  if (KIND_EXT[m[1]] !== m[8]) return null;
  var t = Date.UTC(+m[2], +m[3] - 1, +m[4], +m[5], +m[6], +m[7]);
  if (isNaN(t)) return null;
  return { kind: m[1], ext: m[8], stamp: t, isSum: !!m[9], base: m[9] ? name.slice(0, -7) : name,
           setStamp: m[2] + m[3] + m[4] + 'T' + m[5] + m[6] + m[7] + 'Z' };
}

/** "<64 hex>  <name>\n" of sha256sum → {hash, name} or null */
function parseSum(text) {
  var m = /^([0-9a-f]{64}) [ *](\S+)\s*$/.exec(String(text || '').trim());
  return m ? { hash: m[1], name: m[2] } : null;
}

/**
 * inbox, vault: [{id, name, sha256, size, createdMs}]  sums: {fileId: text of that .sha256}
 * → {copy: [{fileId, sumId, name}], removeInbox: [ids] (duplicates already in Kho with the same bytes, old probes),
 *    alerts: [{key, text}]}
 */
function planMoves(inbox, vault, sums, nowMs) {
  var out = { copy: [], removeInbox: [], alerts: [] };
  var byName = {}, vaultByName = {};
  inbox.forEach(function (f) { (byName[f.name] = byName[f.name] || []).push(f); });
  vault.forEach(function (f) { (vaultByName[f.name] = vaultByName[f.name] || []).push(f); });
  var waitingTooLong = 0, refused = 0;
  Object.keys(byName).forEach(function (name) {
    var files = byName[name];
    if (PROBE_RE.test(name)) {
      files.forEach(function (f) { if (nowMs - f.createdMs > RULES.probeMinutes * 60000) out.removeInbox.push(f.id); });
      return;
    }
    var p = parseName(name);
    var oldest = Math.min.apply(null, files.map(function (f) { return f.createdMs; }));
    var late = nowMs - oldest > RULES.inboxAlertHours * HOUR;
    if (!p) { if (late) refused++; return; }
    if (p.isSum) return; // handled with its data file
    var sumFiles = byName[name + '.sha256'] || [];
    if (files.length !== 1 || sumFiles.length > 1) { refused++; return; }
    if (sumFiles.length === 0) { if (late) waitingTooLong++; return; }
    var f = files[0], s = sumFiles[0];
    if (p.stamp < nowMs - RULES.inboxMaxPastDays * DAY || p.stamp > nowMs + RULES.inboxMaxFutureHours * HOUR) { refused++; return; }
    if (!f.sha256) { if (late) waitingTooLong++; return; } // Google has not computed it yet
    if (s.size > RULES.maxSumBytes) { refused++; return; }
    var sum = parseSum(sums[s.id]);
    if (!sum || sum.name !== name || sum.hash !== String(f.sha256).toLowerCase()) { refused++; return; }
    var inVault = vaultByName[name] || [];
    if (inVault.length) {
      var same = inVault.some(function (v) { return String(v.sha256 || '').toLowerCase() === sum.hash; });
      if (same && (vaultByName[name + '.sha256'] || []).length) { out.removeInbox.push(f.id, s.id); }
      else refused++;
      return;
    }
    out.copy.push({ fileId: f.id, sumId: s.id, name: name, hash: sum.hash });
  });
  if (refused) out.alerts.push({ key: 'inbox-refused', text: refused + ' file(s) in Nhận refused (name, stamp, duplicate or checksum) – left in Nhận, nothing copied. Tell OPS.' });
  if (waitingTooLong) out.alerts.push({ key: 'inbox-waiting', text: waitingTooLong + ' backup file(s) waiting in Nhận for more than ' + RULES.inboxAlertHours + ' h without a matching .sha256.' });
  return out;
}

/** completeSets(vault) → sorted set stamps that have db, blobs, counts, purge-journal and their .sha256 */
function completeSets(vault) {
  var have = {};
  vault.forEach(function (f) { have[f.name] = true; });
  var stamps = {};
  vault.forEach(function (f) { var p = parseName(f.name); if (p && p.kind === 'db' && !p.isSum) stamps[p.setStamp] = true; });
  return Object.keys(stamps).filter(function (s) {
    return ['db-' + s + '.dump.age', 'blobs-' + s + '.tar.age', 'counts-' + s + '.txt.age', 'purge-journal-' + s + '.csv.age']
      .every(function (n) { return have[n] && have[n + '.sha256']; });
  }).sort();
}

/** vault → {remove: [ids], alerts: [{key, text}]} – the rule of backup.sh, newest complete set always kept */
function planRetention(vault, nowMs) {
  var out = { remove: [], alerts: [] };
  var sets = completeSets(vault);
  var keepStamp = sets.length ? sets[sets.length - 1] : null;
  var unknown = 0, keptOld = false;
  vault.forEach(function (f) {
    var p = parseName(f.name);
    if (!p) { unknown++; return; }
    var age = nowMs - p.stamp, keep;
    if (p.kind === 'purge-journal') keep = age < RULES.journalKeepDays * DAY;
    else if (age < RULES.dailyKeepDays * DAY) keep = true;
    else keep = age < RULES.weeklyKeepDays * DAY && new Date(p.stamp).getUTCDay() === 0;
    if (!keep && p.setStamp === keepStamp) { keep = true; keptOld = true; }
    if (!keep) out.remove.push(f.id);
  });
  if (unknown) out.alerts.push({ key: 'vault-unknown', text: unknown + ' file(s) in Kho with a name that is not a backup – not touched. Check who put them there.' });
  if (keptOld) out.alerts.push({ key: 'vault-kept-old', text: 'The newest complete backup set in Kho is older than the retention rule – kept anyway because it is the newest. Backups have stopped: tell OPS.' });
  return out;
}

/** vault → {newestDbMs, newestAgeHours, files, sets, alerts} */
function vaultHealth(vault, nowMs) {
  var newest = 0;
  vault.forEach(function (f) { var p = parseName(f.name); if (p && p.kind === 'db' && !p.isSum && p.stamp > newest) newest = p.stamp; });
  var h = newest ? Math.floor((nowMs - newest) / HOUR) : null;
  var alerts = [];
  if (!newest) alerts.push({ key: 'vault-stale', text: 'No database backup in Kho at all.' });
  else if (h >= RULES.staleHours) alerts.push({ key: 'vault-stale', text: 'Newest database backup in Kho is ' + h + ' h old (limit ' + RULES.staleHours + ' h). The server is not sending backups.' });
  return { newestDbMs: newest, newestAgeHours: h, files: vault.length, sets: completeSets(vault).length, alerts: alerts };
}

// ───────────────────────────── Google side (not run in the Node test) ─────────────────────────────

function props_() { return PropertiesService.getScriptProperties(); }
function folderIds_() {
  var p = props_(), inbox = p.getProperty('INBOX_FOLDER_ID'), vault = p.getProperty('VAULT_FOLDER_ID');
  if (!inbox || !vault) throw new Error('Script properties INBOX_FOLDER_ID and VAULT_FOLDER_ID must be set');
  if (inbox === vault) throw new Error('INBOX_FOLDER_ID and VAULT_FOLDER_ID must be two different folders');
  return { inbox: inbox, vault: vault };
}

function listFolder_(folderId) {
  var files = [], token = null;
  do {
    var r = Drive.Files.list({
      q: "'" + folderId + "' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'",
      fields: 'nextPageToken, files(id, name, size, sha256Checksum, createdTime)',
      pageSize: 1000, pageToken: token, supportsAllDrives: true, includeItemsFromAllDrives: true
    });
    (r.files || []).forEach(function (f) {
      files.push({ id: f.id, name: f.name, size: Number(f.size || 0), sha256: f.sha256Checksum || '',
                   createdMs: Date.parse(f.createdTime) || Date.now() });
    });
    token = r.nextPageToken;
  } while (token);
  return files;
}

function readSmall_(fileId) {
  return DriveApp.getFileById(fileId).getBlob().getDataAsString();
}

function alert_(key, text, force, mailOnly) {
  var p = props_(), last = Number(p.getProperty('alert:' + key) || 0), now = Date.now();
  if (!force && now - last < 6 * HOUR) return; // same alert at most every 6 h
  p.setProperty('alert:' + key, String(now));
  var to = (p.getProperty('ALERT_EMAILS') || Session.getEffectiveUser().getEmail()).trim();
  MailApp.sendEmail(to, 'OTTIMO backup on Google Drive – ' + key, text + '\n\n(Apps Script "OTTIMO backup mover" – runbook: product/docs/huong-dan-inv-sao-luu-google-drive.md)');
  var hook = p.getProperty('ALERT_WEBHOOK_URL');
  if (hook && !mailOnly) {
    try {
      UrlFetchApp.fetch(hook, { method: 'post', contentType: 'application/json', muteHttpExceptions: true,
                                payload: JSON.stringify({ text: 'OTTIMO Drive backup: ' + key + ' FAIL – ' + text }) });
    } catch (e) { /* the e-mail above is enough */ }
  }
}

function moveInbox() {
  var ids = folderIds_(), now = Date.now();
  var inbox = listFolder_(ids.inbox), vault = listFolder_(ids.vault);
  var sums = {};
  inbox.forEach(function (f) {
    if (/\.sha256$/.test(f.name) && f.size <= RULES.maxSumBytes) sums[f.id] = readSmall_(f.id);
  });
  var plan = planMoves(inbox, vault, sums, now);
  plan.copy.forEach(function (c) {
    var copy = Drive.Files.copy({ name: c.name, parents: [ids.vault] }, c.fileId,
                                { supportsAllDrives: true, fields: 'id, sha256Checksum' });
    var copySum = Drive.Files.copy({ name: c.name + '.sha256', parents: [ids.vault] }, c.sumId,
                                   { supportsAllDrives: true, fields: 'id' });
    var check = Drive.Files.get(copy.id, { supportsAllDrives: true, fields: 'sha256Checksum' });
    if (String(check.sha256Checksum || '').toLowerCase() === c.hash) {
      Drive.Files.remove(c.fileId, { supportsAllDrives: true });
      Drive.Files.remove(c.sumId, { supportsAllDrives: true });
    } else if (check.sha256Checksum) {
      Drive.Files.remove(copy.id, { supportsAllDrives: true });
      Drive.Files.remove(copySum.id, { supportsAllDrives: true });
      alert_('copy-mismatch', 'A copy in Kho did not match its original – removed the copy, kept the original in Nhận.');
    } // checksum not computed yet: the next run sees the name in Kho and finishes (same bytes → originals removed)
  });
  plan.removeInbox.forEach(function (id) { Drive.Files.remove(id, { supportsAllDrives: true }); });
  plan.alerts.forEach(function (a) { alert_(a.key, a.text); });
}

function dailyMaintenance() {
  var ids = folderIds_(), now = Date.now();
  var vault = listFolder_(ids.vault);
  var plan = planRetention(vault, now);
  plan.remove.forEach(function (id) { Drive.Files.remove(id, { supportsAllDrives: true }); });
  plan.alerts.forEach(function (a) { alert_(a.key, a.text); });
  var health = vaultHealth(listFolder_(ids.vault), now);
  health.alerts.forEach(function (a) { alert_(a.key, a.text); });
  props_().setProperty('last:maintenance', new Date(now).toISOString() + ' removed=' + plan.remove.length);
}

function weeklySummary() {
  var ids = folderIds_(), now = Date.now();
  var h = vaultHealth(listFolder_(ids.vault), now), waiting = listFolder_(ids.inbox).length;
  var ok = h.alerts.length === 0;
  alert_('weekly-' + (ok ? 'ok' : 'not-ok'),
         (ok ? 'All fine. ' : 'NOT fine. ') + 'Kho: ' + h.files + ' files, ' + h.sets + ' complete sets, newest database backup ' +
         (h.newestAgeHours === null ? 'none' : h.newestAgeHours + ' h old') + '. Nhận: ' + waiting + ' file(s) waiting. ' +
         'Last clean-up: ' + (props_().getProperty('last:maintenance') || 'never') + '.', true, ok);
}

function setup() {
  var ids = folderIds_(), me = Session.getEffectiveUser().getEmail();
  [ids.inbox, ids.vault].forEach(function (id) {
    var f = Drive.Files.get(id, { supportsAllDrives: true, fields: 'id, mimeType, trashed, capabilities(canDelete, canAddChildren)' });
    if (f.mimeType !== 'application/vnd.google-apps.folder' || f.trashed) throw new Error('Folder ' + id + ' is not a usable folder');
    if (!f.capabilities.canAddChildren) throw new Error('This account cannot add files to folder ' + id + ' – wrong account?');
  });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['moveInbox', 'dailyMaintenance', 'weeklySummary'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('moveInbox').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('dailyMaintenance').timeBased().everyDays(1).atHour(9).inTimezone('Asia/Ho_Chi_Minh').create();
  ScriptApp.newTrigger('weeklySummary').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).inTimezone('Asia/Ho_Chi_Minh').create();
  Logger.log('OK: both folders usable, 3 triggers created, running as ' + me.slice(0, 2) + '…@' + me.split('@')[1]);
}

function checkNow() {
  var ids = folderIds_(), now = Date.now();
  var h = vaultHealth(listFolder_(ids.vault), now);
  alert_('test', 'Test message: alerts reach you. Kho has ' + h.files + ' file(s), Nhận ' + listFolder_(ids.inbox).length + ' file(s).', true);
  Logger.log('OK: test e-mail sent');
}

if (typeof module !== 'undefined') {
  module.exports = { parseName: parseName, parseSum: parseSum, planMoves: planMoves, planRetention: planRetention,
                     completeSets: completeSets, vaultHealth: vaultHealth, RULES: RULES };
}
