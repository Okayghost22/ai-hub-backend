const express = require('express');
const router = express.Router();

// 1. REPOS (your pagination code - perfect, unchanged)
router.get('/repos', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Fetch ALL repos (paginated)
    let allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_PAT}`,
            'User-Agent': 'dev-productivity-hub'
          }
        }
      );

      const repos = await response.json();
      
      // If empty array or error, stop
      if (!repos || repos.length === 0) {
        hasMore = false;
        break;
      }

      allRepos = allRepos.concat(repos);
      page++;
      
      // Stop if less than 100 returned (last page)
      if (repos.length < 100) hasMore = false;
    }

    res.json(allRepos);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});

// 2. COMMITS (clean single version)
router.get('/commits', async (req, res) => {
  try {
    const { owner, repo, per_page = 30 } = req.query;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo required' });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${per_page}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_PAT}`,
          'User-Agent': 'dev-productivity-hub'
        }
      }
    );

    const commits = await response.json();
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. NEW: PRs API (Phase 2 – computes cycle time)
router.get('/prs', async (req, res) => {
  try {
    const { owner, repo } = req.query;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo required' });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50`,
      { 
        headers: { 
          Authorization: `token ${process.env.GITHUB_PAT}`,
          'User-Agent': 'dev-productivity-hub'
        } 
      }
    );
    
    const prs = await response.json();
    
    // Compute cycle time (days from create→close)
    const metrics = prs
      .filter(pr => pr.closed_at)  // Only closed PRs
      .map(pr => ({
        number: pr.number,
        title: pr.title.substring(0, 30) + '...',
        cycle_days: (new Date(pr.closed_at) - new Date(pr.created_at)) / (1000 * 60 * 60 * 24)
      }));
    
    const avgCycle = metrics.length ? 
      (metrics.reduce((sum, pr) => sum + pr.cycle_days, 0) / metrics.length).toFixed(1) : '0.0';
    
    res.json({ 
      prs: metrics, 
      avg_cycle_days: avgCycle,
      total_closed_prs: metrics.length,
      total_prs: prs.length 
    });
  } catch (error) {
    console.error('PRs API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 PHASE 3 AI Chat
router.post('/ai-chat', async (req, res) => {
  try {
    const { question, username } = req.body;
    const prompt = `GitHub Developer: ${username}\nQuestion: ${question}\n\nAI Coach - 3 insights:`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    res.json({ 
      answer: data.choices[0].message.content.trim(),
      model: data.model 
    });
  } catch (error) {
    console.error('AI error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
