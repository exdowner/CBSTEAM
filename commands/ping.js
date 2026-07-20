const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Verifica se o bot está online'),
  
  async execute(interaction) {
    const sent = await interaction.reply({ 
      content: '🏓 Pong!', 
      fetchReply: true 
    });
    
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply({
      content: `🏓 **Pong!**\n📡 Latência: ${ping}ms\n💻 WebSocket: ${interaction.client.ws.ping}ms`
    });
  }
};