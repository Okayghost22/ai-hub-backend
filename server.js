const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // Added mongoose
const { Octokit } = require("@octokit/rest");
const aiRoutes = require('./routes/ai'); 
const githubRoutes = require('./routes/github'); 
require("dotenv").config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true
}));

// --- MONGODB SCHEMA & MODEL (Step 2) ---
const WorkspaceSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  label: String,
  createdAt: { type: Date, default: Date.now }
});
const Workspace = mongoose.model('Workspace', WorkspaceSchema);

// --- GITHUB CONFIG ---
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// --- WORKSPACE ROUTES (Step 3) ---
// Save a new workspace
app.post('/api/workspaces', async (req, res) => {
  try {
    const { username } = req.body;
    const workspace = await Workspace.findOneAndUpdate(
      { username: username.toLowerCase() },
      { username: username.toLowerCase(), label: `${username}'s Hub` },
      { upsert: true, new: true }
    );
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ error: "Failed to save workspace" });
  }
});

// Get all saved workspaces
app.get('/api/workspaces', async (req, res) => {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: -1 });
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

// --- ROUTE MOUNTING ---
app.use('/api/github', githubRoutes);
app.use('/api/ai', aiRoutes); 

// --- HEALTH CHECK ---
app.get("/", (req, res) => {
  res.json({ status: "online", message: "AI Backend is running" });
});

// --- PR DIFF ANALYZER ---
app.post("/api/ai/summarize-pr", async (req, res) => {
  try {
    const { owner, repo, pullNumber } = req.body;
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const { data: diffData } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: { format: "diff" },
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a Senior Technical Lead. Summarize this PR diff into Core Changes, Risks, and Refactors."
        },
        {
          role: "user",
          content: `Analyze this PR diff:\n${diffData.substring(0, 4000)}`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ success: true, summary: chatCompletion.choices[0]?.message?.content });
  } catch (error) {
    res.status(500).json({ error: "Code analysis failed", details: error.message });
  }
});

// Use the port provided by the hosting service OR 5000 for local development
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`--- Server Started ---`);
  console.log(`Base URL: http://localhost:${PORT}`);
  // If you are using Supabase now, update this log as well
  console.log(`Status: System Operational on Port ${PORT}`);
});