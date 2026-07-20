
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleterole')
    .setDescription('🗑️ Deleta TODOS os cargos (exceto @everyone)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const guild = interaction.guild;
    const roles = guild.roles.cache.filter(r => r.id !== guild.id);

    if (roles.size === 0) {
      return interaction.reply({ content: '⚠️ Nenhum cargo para deletar.', flags: 64 });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirmDeleteRoles')
          .setLabel('🗑️ CONFIRMAR')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancelDeleteRoles')
          .setLabel('❌ CANCELAR')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      content: `⚠️ **TEM CERTEZA?**\nVocê está prestes a deletar **${roles.size} cargos**!`,
      components: [row],
      flags: 64
    });
  }
};