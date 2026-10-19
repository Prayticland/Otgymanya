// Imports scripts/exercise-catalogue.json into the Exercises sheet tab.
// The current tab is first copied to a dated backup tab (once). The write
// is verified by reading the tab back and comparing every row.
import {readFile} from 'node:fs/promises';
import {google} from 'googleapis';
import {spreadsheetId} from '../server/app.mjs';

const BACKUP_TAB = 'Exercises backup 2026-10-19';
const catalogue = JSON.parse(await readFile(new URL('./exercise-catalogue.json', import.meta.url), 'utf8'));
const rows = [['Exercise ID', 'Exercise Name', 'Program Guidance'], ...catalogue.map(row => [row.id, row.name, row.guidance ?? ''])];

const SPREADSHEET_ID = spreadsheetId();
let auth;
if (process.env.GOOGLE_ACCESS_TOKEN) { auth = new google.auth.OAuth2(); auth.setCredentials({access_token: process.env.GOOGLE_ACCESS_TOKEN}); }
else auth = new google.auth.GoogleAuth({scopes: ['https://www.googleapis.com/auth/spreadsheets']});
const sheets = google.sheets({version: 'v4', auth});

const workbook = await sheets.spreadsheets.get({spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties'});
const titles = (workbook.data.sheets ?? []).map(sheet => sheet.properties?.title);
if (!titles.includes(BACKUP_TAB)) {
  const current = await sheets.spreadsheets.values.get({spreadsheetId: SPREADSHEET_ID, range: 'Exercises!A1:C'});
  await sheets.spreadsheets.batchUpdate({spreadsheetId: SPREADSHEET_ID, requestBody: {requests: [{addSheet: {properties: {title: BACKUP_TAB}}}]}});
  await sheets.spreadsheets.values.update({spreadsheetId: SPREADSHEET_ID, range: `${BACKUP_TAB}!A1:C${current.data.values?.length ?? 1}`, valueInputOption: 'RAW', requestBody: {values: current.data.values ?? []}});
  console.log(`Backed up ${current.data.values?.length ?? 0} rows to "${BACKUP_TAB}".`);
}
const before = await sheets.spreadsheets.values.get({spreadsheetId: SPREADSHEET_ID, range: 'Exercises!A1:C'});
const last = Math.max(before.data.values?.length ?? 1, rows.length);
await sheets.spreadsheets.values.update({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A1:C${rows.length}`, valueInputOption: 'RAW', requestBody: {values: rows}});
if (last > rows.length) await sheets.spreadsheets.values.clear({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A${rows.length + 1}:C${last}`});
const verified = await sheets.spreadsheets.values.get({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A1:C${rows.length}`});
const stored = (verified.data.values ?? []).map(row => [row[0] ?? '', row[1] ?? '', row[2] ?? '']);
if (JSON.stringify(stored) !== JSON.stringify(rows)) throw new Error('Exercises verification failed');
console.log(`Imported and verified ${rows.length - 1} catalogue exercises.`);
