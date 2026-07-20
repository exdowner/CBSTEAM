const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('📨 Link de convite para adicionar o bot'),

  async execute(interaction, client) {
    const inviteLink = 'https://discord.com/oauth2/authorize?client_id=1528645815864918067&permissions=8&integration_type=0&scope=bot+applications.commands';

    const embed = new EmbedBuilder()
      .setTitle('📨 CONVITE DO BOT')
      .setDescription(`**Clique no link abaixo para adicionar o bot ao seu servidor:**\n\n[🔗 Adicionar Bot](${inviteLink})`)
      .setColor(0x00FF00)
      .setFooter({ text: 'CBS TEAM - O PODER É NOSSO!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
};