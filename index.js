const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require('express');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Importar comandos
const nukeCommand = require('./commands/nuke');
const pingCommand = require('./commands/ping');

// Coletar comandos
const commands = [
  nukeCommand.data.toJSON(),
  pingCommand.data.toJSON()
];

// Evento ready
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} está online!`);
  console.log(`📊 Servidores: ${client.guilds.cache.size}`);
  
  // Registrar comandos GLOBALMENTE (funciona em TODOS os servidores)
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('🔄 Registrando comandos globais...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // SEM GUILD_ID
      { body: commands }
    );
    console.log('✅ Comandos registrados globalmente!');
    console.log('🔫 Comando /nuke disponível em TODOS os servidores (apenas ADMs)');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
  
  // Atualizar status
  client.user.setPresence({
    activities: [{ name: '/nuke | CBS TEAM', type: 3 }],
    status: 'online'
  });
  
  // Cron job para manter ativo
  cron.schedule('*/5 * * * *', () => {
    console.log('🔄 Keep-alive ping executado');
  });
  
  console.log('⏰ Cron job configurado para manter o bot ativo');
  console.log('🌍 Comandos disponíveis em TODOS os servidores!');
});

// Tratamento de interações
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  
  const { commandName } = interaction;
  
  if (commandName === 'nuke') {
    await nukeCommand.execute(interaction, client);
  } else if (commandName === 'ping') {
    await pingCommand.execute(interaction);
  }
});

// Servidor HTTP para Render
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 CBS TEAM RAID BOT</h1>
    <p>Bot está online em ${client.guilds.cache.size} servidores!</p>
    <p>Comando /nuke disponível para ADMs</p>
  `);
});

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    servers: client.guilds.cache.size,
    users: client.users.cache.size,
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  console.log(`🌐 Servidor HTTP rodando na porta ${port}`);
});

// Login do bot
client.login(process.env.DISCORD_TOKEN);

// Tratamento de erros
process.on('unhandledRejection', error => {
  console.error('❌ Erro não tratado:', error);
});