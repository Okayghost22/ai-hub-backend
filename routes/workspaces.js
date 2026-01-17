// Mock Database for now (We will replace this with MongoDB/Postgres later)
let userWorkspaces = [
  { id: 1, username: 'Elite-Dev-Demo', label: 'Demo Workspace', repoCount: 3 }
];

// GET all workspaces for a user
app.get('/api/workspaces', (req, res) => {
  res.json(userWorkspaces);
});

// POST save a new workspace
app.post('/api/workspaces', (req, res) => {
  const { username, label } = req.body;
  const newWorkspace = {
    id: Date.now(),
    username,
    label: label || `${username}'s Workspace`,
    repoCount: 0 // This would update after sync
  };
  userWorkspaces.push(newWorkspace);
  res.status(201).json(newWorkspace);
});