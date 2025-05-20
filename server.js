// --- server.js ---
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
    // history initialisieren, falls nicht vorhanden
    if (!data.history) data.history = {};

    for (const user in data.users) {
      if (!data.history[user]) data.history[user] = {};
      data.history[user][data.date] = data.users[user].daily;

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
    date: today,
    history: {}
  };
  saveData();
  res.send('Alle Daten wurden zurückgesetzt.');
});

// POST: Nur Daily-Reset
app.post('/reset-daily', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  if (!data.history) data.history = {};
  for (const user in data.users) {
    if (!data.history[user]) data.history[user] = {};
    data.history[user][data.date] = data.users[user].daily;
    data.users[user].daily = 0;
    data.users[user].lastUpdated = today;
  }
  data.dailyTotal = 0;
  data.date = today;
  saveData();
  res.send('Täglicher Zähler wurde zurückgesetzt.');
});


app.post('/simulate-next-day', (req, res) => {
  // Setze Datum auf nächsten Tag (bzw. übernächsten, je nachdem wie du testen willst)
  const newDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Aktualisiere das Datum
  data.date = newDate;

  // Lege für jeden User neue Tagesdaten mit zufälliger Anzahl an Kippen an (z.B. 0-5)
  for (const user in data.users) {
    if (!data.users[user].dailyData) {
      data.users[user].dailyData = {};
    }
    // Zufällige Zahl 0 bis 5
    const randomCount = Math.floor(Math.random() * 6);
    data.users[user].dailyData[newDate] = randomCount;
    
    // Für die Darstellung im aktuellen Tag (daily) übernehmen wir den Wert
    data.users[user].daily = randomCount;

    // Update total (optional, je nachdem wie du total rechnest)
    data.users[user].total += randomCount;
  }

  // Gesamtzahl für den neuen Tag berechnen
  let dailyTotal = 0;
  for (const user in data.users) {
    dailyTotal += data.users[user].daily;
  }
  data.dailyTotal = dailyTotal;

  // Gesamtzähler neu berechnen (optional)
  let totalSum = 0;
  for (const user in data.users) {
    totalSum += data.users[user].total;
  }
  data.total = totalSum;

  // Daten speichern
  saveData();

  res.send(`Neuer Tag ${newDate} simuliert mit Testdaten. Daten wurden aktualisiert.`);
});


// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
