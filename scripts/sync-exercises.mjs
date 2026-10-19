import {google} from 'googleapis';
import {spreadsheetId} from '../server/app.mjs';
import {exerciseCatalog, mergeCatalogueRows} from './exercise-data.mjs';

const SPREADSHEET_ID = spreadsheetId();
let auth;
if (process.env.GOOGLE_ACCESS_TOKEN) { auth = new google.auth.OAuth2(); auth.setCredentials({access_token: process.env.GOOGLE_ACCESS_TOKEN}); }
else auth = new google.auth.GoogleAuth({scopes: ['https://www.googleapis.com/auth/spreadsheets']});
const sheets = google.sheets({version: 'v4', auth});

// Names remain in immutable routine and historical log snapshots; Exercise ID
// is their stable reference to this catalog.
const source = await sheets.spreadsheets.values.batchGet({spreadsheetId: SPREADSHEET_ID, ranges: ['Routine Exercises!G2:H', 'Workout Log!F2:G']});
const routine = source.data.valueRanges?.[0]?.values ?? [];
const workouts = source.data.valueRanges?.[1]?.values ?? [];
const derived = exerciseCatalog(routine, workouts);
const workbook = await sheets.spreadsheets.get({spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties'});
if (!workbook.data.sheets?.some(sheet => sheet.properties?.title === 'Exercises')) {
  await sheets.spreadsheets.batchUpdate({spreadsheetId: SPREADSHEET_ID, requestBody: {requests: [{addSheet: {properties: {title: 'Exercises', gridProperties: {frozenRowCount: 1}}}}]}});
}
const before = await sheets.spreadsheets.values.get({spreadsheetId: SPREADSHEET_ID, range: 'Exercises!A1:C'});
const existing = (before.data.values ?? []).slice(1);
// The Exercises tab is the full catalogue (routine, historical and imported
// exercises). Sync only ADDS routine/historical exercises that are missing;
// it never deletes catalogue rows or overwrites their names/guidance.
const rows = mergeCatalogueRows(existing, derived);
const values = [['Exercise ID', 'Exercise Name', 'Program Guidance'], ...rows];
const last = Math.max(before.data.values?.length ?? 1, values.length);
await sheets.spreadsheets.values.update({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A1:C${values.length}`, valueInputOption: 'RAW', requestBody: {values}});
if (last > values.length) await sheets.spreadsheets.values.clear({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A${values.length + 1}:C${last}`});
const verified = await sheets.spreadsheets.values.get({spreadsheetId: SPREADSHEET_ID, range: `Exercises!A1:C${values.length}`});
const stored = (verified.data.values ?? []).map(row => [row[0] ?? '', row[1] ?? '', row[2] ?? '']);
if (JSON.stringify(stored) !== JSON.stringify(values)) throw new Error('Exercises verification failed');
console.log(`Synchronized and verified ${rows.length} exercises.`);
