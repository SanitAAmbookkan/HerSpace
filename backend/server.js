const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Maria@2004",
  database: "herspace"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
  } else {
    console.log("MySQL Connected");
  }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

/* =========================
   REGISTER
========================= */
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

  db.query(sql, [name, email, password], (err) => {
    if (err) {
      return res.json({ error: "Error registering user" });
    }
    res.json({ message: "User registered successfully" });
  });
});

/* =========================
   LOGIN
========================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.json({ error: "Database error" });
    }

    if (!result || result.length === 0) {
      return res.json({ error: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user_id: result[0].id
    });
  });
});

/* =========================
   ADD PERIOD
========================= */
app.post("/add-period", (req, res) => {
  const { user_id, period_start_date, period_end_date } = req.body;

  if (!user_id) {
    return res.json({ error: "Please login first" });
  }

  const sql = `
    INSERT INTO daily_logs
    (user_id, date, period_start_date, period_end_date, cycle_day, phase)
    VALUES (?, ?, ?, ?, 1, 'Menstrual')
  `;

  db.query(sql, [user_id, period_start_date, period_start_date, period_end_date], (err) => {
    if (err) {
      return res.json({ error: "Error saving period" });
    }
    res.json({ message: "Period saved successfully" });
  });
});


/* =========================
   LOG MOOD
========================= */
app.post("/log-mood", (req, res) => {
  const { user_id, mood_rating, energy_level } = req.body;

  if (!user_id) {
    return res.json({ error: "Please login first" });
  }

  const getPeriodQuery = `
    SELECT period_start_date 
    FROM daily_logs 
    WHERE user_id = ? AND period_start_date IS NOT NULL
    ORDER BY id DESC LIMIT 1
    `;

  db.query(getPeriodQuery, [user_id], (err, result) => {
    if (err) {
      return res.json({ error: "Database error" });
    }

    if (!result || result.length === 0) {
      return res.json({ error: "Please add period start date first" });
    }

    const period_start_date = result[0].period_start_date;

    const today = new Date();
    const start = new Date(period_start_date);

    let cycle_day =
      Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

    cycle_day = ((cycle_day - 1) % 28) + 1;

    let phase = "";
    if (cycle_day <= 5) phase = "Menstrual";
    else if (cycle_day <= 13) phase = "Follicular";
    else if (cycle_day <= 16) phase = "Ovulation";
    else phase = "Luteal";

    const insertQuery = `
      INSERT INTO daily_logs
    (user_id, date, cycle_day, phase, mood_rating, energy_level)
  VALUES(?, CURDATE(), ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [user_id, cycle_day, phase, mood_rating, energy_level],
      (err) => {
        if (err) {
          return res.json({ error: "Error logging mood" });
        }

        res.json({
          message: "Mood logged successfully",
          cycle_day,
          phase
        });
      }
    );
  });
});

/* =========================
   INSIGHT
========================= */
app.get("/insight/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const latestQuery = `
    SELECT phase 
    FROM daily_logs 
    WHERE user_id = ?
    ORDER BY id DESC LIMIT 1
      `;

  db.query(latestQuery, [user_id], (err, result) => {
    if (err) {
      return res.json({ error: "Database error" });
    }

    if (!result || result.length === 0) {
      return res.json({ error: "No mood data found. Please log mood first." });
    }

    const currentPhase = result[0].phase;

    const avgQuery = `
      SELECT AVG(mood_rating) as avg_mood
      FROM daily_logs
      WHERE user_id = ? AND phase = ?
    `;

    db.query(avgQuery, [user_id, currentPhase], (err, avgResult) => {
      if (err) {
        return res.json({ error: "Database error" });
      }

      const avgMood = avgResult[0].avg_mood || 0;

      const message =
        avgMood < 3
          ? `You are in ${currentPhase} phase.This phase shows recurring lower emotional energy.`
          : `You are in ${currentPhase} phase.Your emotional pattern is generally stable.`;

      res.json({
        current_phase: currentPhase,
        average_mood: avgMood,
        insight: message
      });
    });
  });
});

/* =========================
   CHAT
========================= */
app.post("/chat", (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id) {
    return res.json({ error: "Please login first" });
  }

  const lowerMsg = message.toLowerCase();
  let emotion = "neutral";

  if (lowerMsg.includes("anxious")) emotion = "anxious";
  else if (lowerMsg.includes("sad")) emotion = "sad";
  else if (lowerMsg.includes("angry")) emotion = "angry";
  else if (lowerMsg.includes("tired")) emotion = "tired";

  const latestQuery = `
    SELECT phase FROM daily_logs
    WHERE user_id = ?
    ORDER BY id DESC LIMIT 1
  `;

  db.query(latestQuery, [user_id], (err, result) => {
    if (err) {
      return res.json({ error: "Database error" });
    }

    if (!result || result.length === 0) {
      return res.json({ error: "Please log mood first" });
    }

    const phase = result[0].phase;

    const motivationalQuotes = [
      "You are stronger than you think.",
      "Take it one step at a time.",
      "This feeling is temporary.",
      "Be gentle with yourself today.",
      "You've got this!"
    ];
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    const reply =
      phase === "Luteal"
        ? `You are in ${phase} phase. Hormonal shifts may increase sensitivity. Feeling ${emotion} is common now. ${randomQuote}`
        : `You are in ${phase} phase. Feeling ${emotion} may relate to external factors. ${randomQuote}`;

    res.json({
      detected_emotion: emotion,
      phase,
      response: reply
    });
  });
});

/* =========================
   CALENDAR
========================= */
app.get("/calendar/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql = `
    SELECT date, phase, mood_rating, energy_level, period_start_date, period_end_date, cycle_day
    FROM daily_logs
    WHERE user_id = ?
    `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      return res.json({ error: "Database error" });
    }

    res.json(results);
  });
});

/* =========================
   START SERVER
========================= */
app.listen(5000, () => {
  console.log("Server running on port 5000");

  // Check and add period_end_date column if missing
  const checkColumnSql = `
    SELECT count(*) as count 
    FROM information_schema.columns 
    WHERE table_name = 'daily_logs' 
    AND column_name = 'period_end_date'
  `;

  db.query(checkColumnSql, (err, result) => {
    if (!err && result[0].count === 0) {
      db.query("ALTER TABLE daily_logs ADD COLUMN period_end_date DATE", (alterErr) => {
        if (alterErr) console.error("Error adding period_end_date column:", alterErr);
        else console.log("Added period_end_date column to daily_logs");
      });
    }
  });
});
