const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 CBS TEAM RAID BOT</h1>
    <p>Bot está online e pronto para usar!</p>
    <p>💀 Comando /nuke disponível para ADMs</p>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`✅ Keep-alive server rodando na porta ${port}`);
});

module.exports = app;