const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('end')
    .setDescription('⏰ Dá timeout em TODOS os membros')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const modal = new ModalBuilder()
      .setCustomId('endModal')
      .setTitle('⏰ TIMEOUT EM TODOS');

    const minutosInput = new TextInputBuilder()
      .setCustomId('minutosInput')
      .setLabel('⏰ Minutos de timeout')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 60 (padrão)')
      .setRequired(false);

    const row = new ActionRowBuilder().addComponents(minutosInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};