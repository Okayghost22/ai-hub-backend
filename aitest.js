const { GoogleGenerativeAI } = require("@google/generative-ai");

// PASTE YOUR KEY DIRECTLY HERE FOR 1 MINUTE TEST
const genAI = new GoogleGenerativeAI("PASTE_YOUR_ACTUAL_AIZA_KEY_HERE");

async function run() {
  try {
    // Using the most stable 2026 model string
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Is the connection live?");
    console.log("AI RESPONSE:", result.response.text());
  } catch (e) {
    console.error("STILL FAILING. ERROR:", e.message);
  }
}

run();