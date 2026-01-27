const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'BMad Backend LIVE - Ready for parallel development!' });
});

app.post('/api/v1/research/generate-dossier', (req, res) => {
  const companyName = req.body.company_name || 'Unknown Company';
  console.log(' Dossier request for:', companyName);
  res.json({
    success: true,
    dossier_id: 'mock_' + Date.now(),
    websocket_url: 'ws://localhost:3001/ws/research/mock_' + Date.now(),
    message: 'Mock dossier generation started for ' + companyName
  });
});

console.log(' BMad Orchestrator: Starting backend...');
app.listen(3000, () => {
  console.log('🔥 Backend OPERATIONAL on port 3000');
  console.log(' Frontend-Backend parallel development ENABLED');
});
