const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('📋 Abre o menu principal com todos os comandos'),

  async execute(interaction, client) {
    try {
      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu_nuke')
            .setLabel('💀 NUKE')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('menu_timer')
            .setLabel('⏱️ TIMER')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('menu_img')
            .setLabel('📸 IMG')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('menu_say')
            .setLabel('🗣️ SAY')
            .setStyle(ButtonStyle.Secondary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu_reverse')
            .setLabel('🔁 REVERSE')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('menu_invite')
            .setLabel('📨 INVITE')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('menu_channelspam')
            .setLabel('💬 SPAM')
            .setStyle(ButtonStyle.Warning),
          new ButtonBuilder()
            .setCustomId('menu_banall')
            .setLabel('🔨 BANALL')
            .setStyle(ButtonStyle.Danger)
        );

      const row3 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('menu_end')
            .setLabel('⏰ END')
            .setStyle(ButtonStyle.Warning),
          new ButtonBuilder()
            .setCustomId('menu_deleterole')
            .setLabel('🗑️ DEL')
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({
        content: '🔥 **CBS TEAM - MENU DE COMANDOS**\nClique nos botões abaixo para executar os comandos:',
        components: [row1, row2, row3],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Erro no menu:', error);
      await interaction.reply({
        content: `❌ Erro: ${error.message}`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};