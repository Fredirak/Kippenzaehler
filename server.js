import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.resolve('./data.json');

let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Hilfsfunktion für Datum "YYYY-MM-DD"
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// Reset täglich
function resetDailyIfNeeded() {
  const today = getToday();
  if (data.date !== today) {
    data.date = today;
    data.dailyTotal = 0;
    for (const user of Object.values(data.users)) {
      user.daily = 0;
      user.lastUpdated = today;
    }
    saveData();
  }
}

// Daten speichern
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Beim Serverstart prüfen, ob Tagesdaten resetten
resetDailyIfNeeded();

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

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
