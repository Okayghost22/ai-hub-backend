# 🚀 AI-Hub Engine (Backend)

The intelligence layer for AI-Hub, providing deep GitHub analytics and AI-driven pull request summaries.

## 🛠️ Tech Stack
- **Runtime**: Node.js / Express
- **AI Model**: Llama-3.3-70b (via Groq SDK)
- **Database**: MongoDB (Workspace tracking) & Supabase (Auth/Persistence)
- **API**: GitHub Octokit REST

## ⚡ Core Features
- **AI PR Summarizer**: Analyzes diffs to provide Core Changes, Risks, and Refactor suggestions.
- **Metrics Engine**: Calculates cycle days and risk scores for active repositories.
- **Workspace Management**: Persists user-specific hub configurations.

## ⚙️ Environment Variables Required
- `GITHUB_TOKEN`: Classic PAT for repo access.
- `GROQ_API_KEY`: For Llama-3 model access.
- `FRONTEND_URL`: CORS configuration for the live Vercel app.
- `MONGO_URI`: For workspace persistence.
