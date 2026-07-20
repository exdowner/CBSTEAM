const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editraid')
    .setDescription('📝 Edita as configurações da RAID')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    // Criar Modal
    const modal = new ModalBuilder()
      .setCustomId('editRaidModal')
      .setTitle('📝 EDITAR RAID');

    const categoriaInput = new TextInputBuilder()
      .setCustomId('categoriaInput')
      .setLabel('📂 Nome das categorias')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: RAIDED-BY-CBS')
      .setValue(config.raid.baseName || 'RAIDED-BY-CBS')
      .setRequired(false);

    const mensagemInput = new TextInputBuilder()
      .setCustomId('mensagemInput')
      .setLabel('💬 Mensagem de spam')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite a mensagem que será spamada')
      .setValue(config.raid.spamMessage || '**RAIDED BY CBS TEAM** 🔥')
      .setRequired(false);

    const row1 = new ActionRowBuilder().addComponents(categoriaInput);
    const row2 = new ActionRowBuilder().addComponents(mensagemInput);
    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
};