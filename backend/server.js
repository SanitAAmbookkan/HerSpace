const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   SUPABASE CONFIGURATION
========================= */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("🚨 CRITICAL: Missing SUPABASE_URL or SUPABASE_KEY environment variables.");
}

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (supabase) {
  console.log("Supabase Client Initialized");
}

async function checkDb() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error("🚨 DATABASE ERROR: Table 'users' not found. Did you run the SQL script? Error:", error.message);
    } else {
      console.log("✅ Database connection verified. 'users' table found.");
    }
  } catch (e) {
    console.error("🚨 ERROR: Could not query Supabase.", e.message);
  }
}
checkDb();

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.json({ message: "Backend running with Supabase SDK 🚀" });
});

/* =========================
   AUTH
========================= */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized. Please add SUPABASE_URL and SUPABASE_KEY to Vercel environment variables." });
    }

    // Check if exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existingUser) return res.json({ error: "Email already exists" });

    // Insert
    const { error } = await supabase
      .from("users")
      .insert([{ name, email, password }]);

    if (error) {
      console.error("Signup Error (Supabase):", error);
      throw error;
    }
    res.json({ message: "User registered!" });
  } catch (err) {
    console.error("Signup Catch Block:", err.message || err);
    res.status(500).json({ error: err.message || "Signup failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized." });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .maybeSingle();

    if (error || !data) {
      console.warn("Login Failed: Invalid credentials for", email);
      return res.json({ error: "Invalid credentials" });
    }

    res.json(data);
  } catch (err) {
    console.error("Login Error:", err.message || err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

/* =========================
   MOOD LOGGING (Enhanced)
========================= */
app.post("/log-mood", async (req, res) => {
  try {
    let { user_id, mood_rating, energy_level, period_start_date } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized. Check environment variables." });
    }

    // Validate User ID
    const parsedId = parseInt(user_id);
    if (!user_id || user_id === "undefined" || isNaN(parsedId)) {
      return res.json({ error: "Please login first (Invalid Session)" });
    }
    user_id = parsedId;

    // If period_start_date is missing, fetch the latest one from DB
    if (!period_start_date) {
      const { data: latestPeriod, error: pError } = await supabase
        .from("daily_logs")
        .select("period_start_date")
        .eq("user_id", user_id)
        .not("period_start_date", "is", null)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (pError || !latestPeriod) {
        return res.json({ error: "Please set your period start date in 'Track Period' first!" });
      }
      period_start_date = latestPeriod.period_start_date;
    }

    // Determine Cycle Day & Phase
    const today = new Date();
    const start = new Date(period_start_date);
    if (isNaN(start.getTime())) {
      return res.json({ error: "Invalid start date" });
    }

    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const cycle_day = ((diffDays - 1) % 28) + 1;

    let phase = "";
    if (cycle_day <= 5) phase = "Menstrual";
    else if (cycle_day <= 13) phase = "Follicular";
    else if (cycle_day <= 16) phase = "Ovulation";
    else phase = "Luteal";

    const { error } = await supabase
      .from("daily_logs")
      .insert([{
        user_id,
        date: new Date().toISOString(),
        cycle_day,
        phase,
        mood_rating,
        energy_level,
        period_start_date
      }]);

    if (error) {
      console.error("Log Mood Supabase Error:", error);
      throw error;
    }

    res.json({
      message: "Got it 💗 I've saved how you're feeling today.",
      cycle_day,
      phase
    });
  } catch (err) {
    console.error("Log Mood Catch Block:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to log mood" });
  }
});

app.post("/add-period", async (req, res) => {
  try {
    let { user_id, period_start_date, period_end_date } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized. Check environment variables." });
    }

    const parsedId = parseInt(user_id);
    if (!user_id || user_id === "undefined" || isNaN(parsedId)) {
      return res.json({ error: "Please login first (Invalid Session)" });
    }
    user_id = parsedId;

    // Clean dates (PostgreSQL doesn't like empty strings for DATE)
    if (period_start_date === "") period_start_date = null;
    if (period_end_date === "") period_end_date = null;

    const { error } = await supabase
      .from("daily_logs")
      .insert([{
        user_id,
        date: period_start_date || new Date().toISOString(),
        period_start_date,
        period_end_date,
        cycle_day: 1,
        phase: "Menstrual"
      }]);

    if (error) {
      console.error("Add Period Supabase Error:", error);
      throw error;
    }
    res.json({ message: "Got it 💗 I've saved your period dates." });
  } catch (err) {
    console.error("Add Period Catch Block:", err.message || err);
    res.status(500).json({ error: err.message || "Failed to save period" });
  }
});

/* =========================
   CALENDAR DATA
========================= */
app.get("/calendar/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized." });
    }

    const parsedId = parseInt(user_id);
    if (!user_id || user_id === "undefined" || isNaN(parsedId)) {
      return res.json({ error: "Invalid User ID" });
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", parsedId)
      .order("date", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Calendar Error:", err);
    res.status(500).json({ error: "Failed to fetch calendar" });
  }
});

/* =========================
   INSIGHT & PATTERNS
========================= */
app.get("/insight/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized." });
    }

    const parsedId = parseInt(user_id);
    if (!user_id || user_id === "undefined" || isNaN(parsedId)) {
      return res.json({ error: "Invalid User ID" });
    }
    const userId = parsedId;

    // 1. Get Latest Period
    const { data: periodData, error: periodError } = await supabase
      .from("daily_logs")
      .select("period_start_date, period_end_date")
      .eq("user_id", userId)
      .not("period_start_date", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (periodError || !periodData) {
      return res.json({ error: "Please log your period first to see insights." });
    }

    const { period_start_date, period_end_date } = periodData;
    const today = new Date();
    const start = new Date(period_start_date);

    // Calc Cycle Day
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let cycle_day = ((diffDays - 1) % 28) + 1;

    // Calc Menstrual Length
    let menstrualLength = 5;
    if (period_end_date) {
      const end = new Date(period_end_date);
      const pDiff = Math.abs(end - start);
      menstrualLength = Math.ceil(pDiff / (1000 * 60 * 60 * 24)) + 1;
    }

    // Determine Phase
    let currentPhase = "";
    if (cycle_day <= menstrualLength) currentPhase = "Menstrual";
    else if (cycle_day <= menstrualLength + 8) currentPhase = "Follicular";
    else if (cycle_day <= menstrualLength + 11) currentPhase = "Ovulation";
    else currentPhase = "Luteal";

    // 2. Insights
    let suggestedFocus = "";
    let baseInsight = "";
    // ... (Switch case same as before)
    switch (currentPhase) {
      case "Menstrual": suggestedFocus = "Rest & Recharge 🍵"; baseInsight = `Day ${cycle_day}: Your energy might be low right now.`; break;
      case "Follicular": suggestedFocus = "Plan & Create ✨"; baseInsight = `Day ${cycle_day}: You're likely in a high-energy phase!`; break;
      case "Ovulation": suggestedFocus = "Socialize & Move 💃"; baseInsight = `Day ${cycle_day}: You might feel your most confident.`; break;
      case "Luteal": suggestedFocus = "Organize & Unwind 📚"; baseInsight = `Day ${cycle_day}: Hormones are shifting. Focus on wrapping up tasks.`; break;
      default: suggestedFocus = "Listen to your body 🌿"; baseInsight = "Trust your intuition today.";
    }

    // 3. Activity Suggestion
    const { data: moodData } = await supabase
      .from("daily_logs")
      .select("mood_rating, energy_level")
      .eq("user_id", user_id)
      .not("mood_rating", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    let activitySuggestion = "Log your mood to get a suggestion!";
    if (moodData) {
      const { mood_rating, energy_level } = moodData;
      let options = [];
      let category = "";
      if (mood_rating <= 4 && energy_level <= 4) {
        category = "Rest & Self-Care 🛁";
        options = ["Take a 20-min nap", "Do gentle yoga stretches", "Read a comforting book"];
      } else if (mood_rating <= 4 && energy_level > 4) {
        category = "Stress Relief 🏃‍♀️";
        options = ["Go for a brisk walk", "Write in your journal", "Do a 10-min HIIT workout"];
      } else if (mood_rating > 4 && energy_level <= 4) {
        category = "Relaxing Creativity 🎨";
        options = ["Draw or doodle", "Cook a new recipe", "Watch a favorite movie"];
      } else {
        category = "Productivity 🚀";
        options = ["Tackle a deep work task", "Plan your week", "Learn something new"];
      }
      activitySuggestion = `${category}: ${options[Math.floor(Math.random() * options.length)]}`;
    }

    // 4. Patterns
    const { data: history } = await supabase
      .from("daily_logs")
      .select("phase, mood_rating, energy_level")
      .eq("user_id", user_id)
      .order("date", { ascending: false })
      .limit(90);

    const patterns = [];
    if (history) {
      const phaseStats = {};
      history.forEach((log) => {
        if (!phaseStats[log.phase]) phaseStats[log.phase] = { moodSum: 0, energySum: 0, count: 0 };
        phaseStats[log.phase].moodSum += log.mood_rating;
        phaseStats[log.phase].energySum += log.energy_level;
        phaseStats[log.phase].count += 1;
      });

      for (const [phase, stats] of Object.entries(phaseStats)) {
        const avgMood = stats.moodSum / stats.count;
        const avgEnergy = stats.energySum / stats.count;
        if (avgMood < 4 && stats.count > 2) patterns.push(`You tend to feel emotionally sensitive during your ${phase} phase.`);
        if (avgEnergy > 6 && stats.count > 2) patterns.push(`Your energy tends to peak during your ${phase} phase!`);
      }
    }

    res.json({
      current_phase: currentPhase,
      insight: baseInsight,
      suggested_focus: suggestedFocus,
      activity_suggestion: activitySuggestion,
      patterns: patterns
    });
  } catch (err) {
    console.error("Insight Error:", err);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

/* =========================
   CHAT
========================= */
app.post("/chat", async (req, res) => {
  try {
    let { user_id, message } = req.body;

    if (!supabase) {
      return res.status(500).json({ error: "Supabase client not initialized." });
    }

    const parsedId = parseInt(user_id);
    if (!user_id || user_id === "undefined" || isNaN(parsedId)) {
      return res.json({ error: "Please login first (Invalid Session)" });
    }
    user_id = parsedId;

    const { data: periodData } = await supabase
      .from("daily_logs")
      .select("period_start_date, period_end_date")
      .eq("user_id", user_id)
      .not("period_start_date", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (!periodData) return res.json({ error: "Please log your period first!" });

    const { period_start_date, period_end_date } = periodData;
    const today = new Date();
    const start = new Date(period_start_date);

    // Calc Cycle Day & Phase (Simplified repetition)
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let cycle_day = ((diffDays - 1) % 28) + 1;

    let menstrualLength = 5;
    if (period_end_date) {
      const end = new Date(period_end_date);
      const pDiff = Math.abs(end - start);
      menstrualLength = Math.ceil(pDiff / (1000 * 60 * 60 * 24)) + 1;
    }

    let phase = "";
    if (cycle_day <= menstrualLength) phase = "Menstrual";
    else if (cycle_day <= menstrualLength + 8) phase = "Follicular";
    else if (cycle_day <= menstrualLength + 11) phase = "Ovulation";
    else phase = "Luteal";

    // Emotion
    const lowerMsg = message.toLowerCase();
    let emotion = "neutral";
    if (lowerMsg.includes("anxious") || lowerMsg.includes("worry")) emotion = "anxious";
    else if (lowerMsg.includes("sad") || lowerMsg.includes("cry")) emotion = "sad";
    else if (lowerMsg.includes("angry") || lowerMsg.includes("mad")) emotion = "angry";
    else if (lowerMsg.includes("tired") || lowerMsg.includes("exhausted")) emotion = "tired";
    else if (lowerMsg.includes("happy") || lowerMsg.includes("good")) emotion = "happy";

    // Responses
    const responses = {
      Menstrual: {
        anxious: "It's normal to feel on edge. Try a warm tea? 🍵",
        sad: "Be gentle with yourself today.",
        neutral: "Day " + cycle_day + ". Stay hydrated."
      },
      Follicular: {
        anxious: "Channel that energy into creativity!",
        sad: "Tomorrow is a new day.",
        neutral: "Estrogen is rising! 🚀"
      },
      Ovulation: {
        anxious: "Try a workout to burn off high energy!",
        sad: "Honor your feelings.",
        neutral: "You are likely at peak energy!"
      },
      Luteal: {
        anxious: "Grounding exercises help.",
        sad: "PMS blues are real. It will pass.",
        neutral: "Great time to organize and unwind."
      }
    };

    // Fallback if specific emotion text missing in shortened map above
    let phaseRes = responses[phase] || responses["Menstrual"]; // fallback
    let reply = phaseRes[emotion] || phaseRes["neutral"] || "How are you checking in today?";

    const quotes = ["You are strong.", "Breathe.", "One step at a time."];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    res.json({
      detected_emotion: emotion,
      phases: phase,
      cycle_day: cycle_day,
      response: `${reply} ${quote}`
    });
  } catch (err) {
    console.error("Chat Error:", err);
    res.status(500).json({ error: "Chat processing failed" });
  }
});

const PORT = process.env.PORT || 5000;

// Only listen locally, Vercel will handle this in production
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
