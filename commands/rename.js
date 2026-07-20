const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('🔄 Renomeia todos os canais ou categorias')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const modal = new ModalBuilder()
      .setCustomId('renameModal')
      .setTitle('🔄 RENOMEAR');

    const tipoInput = new TextInputBuilder()
      .setCustomId('tipoInput')
      .setLabel('📂 Tipo (canal ou categoria)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite: canal ou categoria')
      .setRequired(true);

    const nomeInput = new TextInputBuilder()
      .setCustomId('nomeInput')
      .setLabel('📝 Novo nome')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite o novo nome')
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(tipoInput);
    const row2 = new ActionRowBuilder().addComponents(nomeInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
};