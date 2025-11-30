const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
app.use(express.json());
app.use(cors());

// Optional DB logging – chatbot works even if MySQL is missing
let db;
try {
    
    db = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "_SkshiPnwr@22may",
        database: "chatbot_db",
        port: 3306,
        ssl: {
            rejectUnauthorized: false
        }
    });

    db.connect((err) => {
        if (err) {
            console.warn("⚠️  Could not connect to MySQL. Chatbot will still respond but queries won't be saved.", err.code || err);
        } else {
            console.log("✅ Connected to MySQL");
        }
    });
} catch (error) {
    console.warn("ℹ️  mysql package not installed. Skipping DB logging.");
}

const generalReplies = [
    { keywords: ["hi", "hello", "hey", "good morning", "good evening"], reply: "Hey there! I'm your wellness + productivity buddy. What do you need today?" },
    { keywords: ["thank", "thanks"], reply: "Happy to help! Let me know if you want more tips or to log your progress." },
    { keywords: ["who", "what can you do", "help"], reply: "I share quick health tips, track your daily goals, and keep light conversation going." },
    { keywords: ["bye", "good night", "see you"], reply: "Bye! Remember to hydrate and wind down properly." }
];

const healthTopics = [
    { keywords: ["health tip", "health tips", "healthy", "wellness"], reply: "Mini health tip: follow the 20-20-20 rule when studying—every 20 mins, look 20 feet away for 20 seconds." },
    { keywords: ["diet", "food", "eat", "nutrition"], reply: "Aim for colorful plates! Include lean protein, whole grains, and at least 2 servings of veggies daily." },
    { keywords: ["water", "hydrate", "hydration"], reply: "Try setting a timer to sip 200 ml of water every hour. Dehydration limits both focus and stamina." },
    { keywords: ["exercise", "workout", "fitness", "yoga"], reply: "Even 10 minutes of stretching or brisk walking boosts energy and mood. Want a sample routine?" },
    { keywords: ["mental", "stress", "anxiety", "mindfulness"], reply: "Square breathing can help: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat five times." },
    { keywords: ["sleep", "rest", "insomnia"], reply: "Keep gadgets away 30 minutes before bed and try to sleep/wake at fixed times to restore your rhythm." }
];

const productivityHints = [
    { keywords: ["plan", "goal", "focus", "study schedule"], reply: "Break large goals into 25-minute focus blocks with 5-minute breaks—classic Pomodoro always works." },
    { keywords: ["motivate", "motivation", "energize"], reply: "Visualize why the task matters and do a 2-minute starter action to overcome inertia." }
];

const productivityLog = [];

function handleProductivity(message) {
    const normalized = message.toLowerCase();
    const logKeywords = ["log", "add", "track", "note"];
    const summaryKeywords = ["summary", "progress", "status", "show"];

    if (logKeywords.some((word) => normalized.includes(word))) {
        const task = message.replace(/log|add|track|note/gi, "").trim() || "an unnamed task";
        const entry = { task, time: new Date().toLocaleString() };
        productivityLog.push(entry);
        return `Got it! I logged "${entry.task}" at ${entry.time}. Keep it up!`;
    }

    if (summaryKeywords.some((word) => normalized.includes(word))) {
        if (!productivityLog.length) {
            return "Nothing logged yet. Tell me what you worked on and I'll keep track!";
        }
        const summary = productivityLog.slice(-5).map((entry, idx) => `${idx + 1}. ${entry.task} (${entry.time})`).join("\n");
        return `Here's your latest progress:\n${summary}`;
    }

    if (productivityHints.some((hint) => hint.keywords.some((word) => normalized.includes(word)))) {
        const hint = productivityHints.find((hint) => hint.keywords.some((word) => normalized.includes(word)));
        return hint.reply;
    }

    return null;
}

function matchIntent(message, dataset) {
    const normalized = message.toLowerCase();
    for (const intent of dataset) {
        if (intent.keywords.some((keyword) => normalized.includes(keyword))) {
            return intent.reply;
        }
    }
    return null;
}

const fallbackReply = "I might not have that info yet, but I can still offer a health tip or log your daily progress!";

app.post("/chat", (req, res) => {
    const userMsg = req.body.message || "";

    const productivityReply = handleProductivity(userMsg);
    const healthReply = productivityReply ? null : matchIntent(userMsg, healthTopics);
    const generalReply = productivityReply || healthReply ? null : matchIntent(userMsg, generalReplies);
    const reply = productivityReply || healthReply || generalReply || fallbackReply;

    if (db && db.state === "authenticated") {
        const query = "INSERT INTO queries(user_message, bot_reply) VALUES (?, ?)";
        db.query(query, [userMsg, reply], (err) => {
            if (err) console.error("Failed to log query", err.code || err);
        });
    }

    res.json({ reply });
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
