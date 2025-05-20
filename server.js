import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data.json'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));


// Daten laden
let data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Speichern
function saveData() {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Täglicher Reset
function resetDailyIfNeeded() {
  const today = new Date().toISOString().split('T')[0];
  if (data.date !== today) {
    for (const user in data.users) {
      data.users[user].daily = 0;
      data.users[user].lastUpdated = today;
    }
    data.dailyTotal = 0;
    data.date = today;
    saveData();
  }
}

// GET Status
app.get('/status', (req, res) => {
  resetDailyIfNeeded();
  res.json(data);
});

// POST Klick für User
app.post('/click/:user', (req, res) => {
  resetDailyIfNeeded();
  const user = req.params.user;
  if (!data.users[user]) {
    return res.status(400).json({ error: 'User nicht gefunden' });
  }
  data.users[user].daily += 1;
  data.users[user].total += 1;
  data.dailyTotal += 1;
  data.total += 1;
  saveData();
  res.json(data);
});

// POST: Hard-Reset (Alles auf 0)
app.post('/reset', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  data = {
    users: {
      Frieder: { total: 0, daily: 0, lastUpdated: today },
      Gesine: { total: 0, daily: 0, lastUpdated: today },
      Fredi: { total: 0, daily: 0, lastUpdated: today },
      Lea: { total: 0, daily: 0, lastUpdated: today },
      Emma: { total: 0, daily: 0, lastUpdated: today }
    },
    dailyTotal: 0,
    total: 0,
    date: today
  };
  saveData();
  res.send('Alle Daten wurden zurückgesetzt.');
});

// POST: Nur Daily-Reset
app.post('/reset-daily', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  for (const user in data.users) {
    data.users[user].daily = 0;
    data.users[user].lastUpdated = today;
  }
  data.dailyTotal = 0;
  data.date = today;
  saveData();
  res.send('Täglicher Zähler wurde zurückgesetzt.');
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
