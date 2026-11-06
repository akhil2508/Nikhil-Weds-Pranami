const SHEET_NAME = 'RSVPs';
const HEADERS = ['ID', 'Timestamp', 'Name', 'Attending', 'Dancing', 'Song', 'Message'];

function doGet(e) {
  const callback = e.parameter.callback || '';
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback');
  }

  const entries = readEntries();
  const json = JSON.stringify(entries)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return ContentService.createTextOutput(`${callback}(${json});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const entry = JSON.parse(e.postData.contents);
  if (!entry || typeof entry !== 'object') {
    throw new Error('The RSVP payload is invalid.');
  }
  const id = cleanText(entry.id, 100);
  const name = cleanText(entry.name, 120);
  const message = cleanText(entry.message, 1000);
  if (!id || !name || !message) {
    throw new Error('ID, name, and blessing message are required.');
  }

  const sheet = getSheet();
  const idColumn = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
    .getValues()
    .flat();
  if (idColumn.includes(id)) {
    return ContentService.createTextOutput('Already saved');
  }

  sheet.appendRow([
    safeCell(id),
    new Date(),
    safeCell(name),
    entry.attending === 'Yes' ? 'Yes' : 'No',
    entry.dancing === 'Yes' ? 'Yes' : 'No',
    safeCell(cleanText(entry.song, 120)),
    safeCell(message),
  ]);
  SpreadsheetApp.flush();
  return ContentService.createTextOutput('Saved');
}

function readEntries() {
  const sheet = getSheet();
  if (sheet.getLastRow() < 2) {
    return [];
  }

  return sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length)
    .getValues()
    .reverse()
    .map((row) => ({
      id: String(row[0]),
      timestamp: row[1] instanceof Date ? row[1].toISOString() : String(row[1]),
      name: String(row[2]),
      attending: String(row[3]),
      dancing: String(row[4]),
      song: String(row[5]),
      message: String(row[6]),
      likes: 1,
    }));
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function safeCell(value) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
