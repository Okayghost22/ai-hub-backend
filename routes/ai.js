const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq with the key from your .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', async (req, res) => {
  try {
    const { userQuery, context } = req.body;

    // DEBUG: Look at your terminal! If this logs "undefined", the frontend isn't sending data.
    console.log("--- AI CONTEXT RECEIVED ---");
    console.log(JSON.stringify(context, null, 2));

    // Point 1: Extracting values from the specific keys defined in your AISidebar.jsx
    const repoName = context?.repoName || "No specific repository selected";
    const avgCycle = context?.stats?.averageCycleTime || "unknown";
    const prCount = context?.stats?.totalPullRequests || 0;
    const language = context?.currentLanguage || "various technologies";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Technical Lead AI specialized in GitHub productivity.
          
          CRITICAL SOURCE OF TRUTH:
          - Current Repository: ${repoName}
          - Tech Stack: ${language}
          - Performance Metric (Cycle Time): ${avgCycle} days
          - Data Volume: ${prCount} total Pull Requests analyzed.
          - Recent PR Activity: ${JSON.stringify(context?.recentPRList || [])}

          STRICT INSTRUCTIONS:
          1. If the user asks which repo they are looking at, you MUST mention "${repoName}". Never say you don't have information.
          2. Use the average cycle time of ${avgCycle} days to give specific advice. 
          3. If the cycle time is > 5 days, explain that merges are slow and suggest breaking PRs into smaller chunks.
          4. If no specific repo is selected (i.e., repoName is default), ask the user to click a repository card on the dashboard first.`
        },
        { role: "user", content: userQuery }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// Route for Phase 3: The "Smart Summary" Digest
router.post('/summarize', async (req, res) => {
  try {
    const { context } = req.body; // Using the same context structure for consistency

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert Productivity Analyst. Create a high-level executive summary."
        },
        {
          role: "user",
          content: `Perform a deep dive analysis for "${context?.repoName}":
          - Metrics: ${context?.stats?.averageCycleTime} days avg cycle.
          - PR count: ${context?.stats?.totalPullRequests}.
          
          Provide a 'Developer Digest' with:
          - 🚀 Velocity: Evaluate the ${context?.stats?.averageCycleTime} day speed.
          - 🔍 Risk Areas: Analyze these PRs for bottlenecks: ${JSON.stringify(context?.recentPRList)}.
          - 💡 Strategy: Give one actionable technical tip.`
        }
      ],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ error: "Summary generation failed" });
  }
});

module.exports = router;