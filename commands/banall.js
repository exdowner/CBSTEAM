
const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banall')
    .setDescription('🔨 Bane TODOS os membros do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const modal = new ModalBuilder()
      .setCustomId('banAllModal')
      .setTitle('🔨 BANIR TODOS');

    const motivoInput = new TextInputBuilder()
      .setCustomId('motivoInput')
      .setLabel('📝 Motivo do ban')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite o motivo (opcional)')
      .setRequired(false);

    const row = new ActionRowBuilder().addComponents(motivoInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};