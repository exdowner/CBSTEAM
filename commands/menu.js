const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: 'menu',
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Apenas ADMs podem usar este comando!');
      }

      const embed = new EmbedBuilder()
        .setTitle('🔥 CBS TEAM - MENU DE COMANDOS')
        .setDescription('**Clique nos botões abaixo para executar os comandos:**')
        .setColor(0xFF0000)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '💀 NUKE', value: 'Cria 500 canais + spam em massa', inline: false },
          { name: '📝 EDIT RAID', value: 'Edita nome das categorias e mensagem', inline: false },
          { name: '🔄 RENAME', value: 'Renomeia todos os canais ou categorias', inline: false },
          { name: '🔨 BANALL', value: 'Bane TODOS os membros', inline: false },
          { name: '⏰ END', value: 'Dá timeout em todos os membros', inline: false },
          { name: '🗑️ DELETEROLE', value: 'Deleta TODOS os cargos', inline: false }
        )
        .setFooter({ text: 'CBS TEAM - O PODER É NOSSO!' })
        .setTimestamp();

      const row1 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('nuke')
            .setLabel('💀 NUKE')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('editraid')
            .setLabel('📝 EDIT RAID')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('rename')
            .setLabel('🔄 RENAME')
            .setStyle(ButtonStyle.Success)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('banall')
            .setLabel('🔨 BANALL')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('end')
            .setLabel('⏰ END')
            .setStyle(ButtonStyle.Warning),
          new ButtonBuilder()
            .setCustomId('deleterole')
            .setLabel('🗑️ DELETEROLE')
            .setStyle(ButtonStyle.Danger)
        );

      await message.channel.send({ embeds: [embed], components: [row1, row2] });

    } catch (error) {
      console.error('❌ Erro menu:', error);
      await message.reply(`❌ Erro: ${error.message}`);
    }
  }
};