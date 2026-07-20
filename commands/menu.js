const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('📋 Menu completo com todos os comandos do bot'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle('🔥 CBS TEAM - MENU PRINCIPAL')
      .setDescription('**Clique nos botões abaixo para executar os comandos:**')
      .setColor(0xFF0000)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: '💀 NUKE', value: 'Cria 500 canais + spam', inline: true },
        { name: '⏱️ TIMER', value: 'Agenda um /nuke', inline: true },
        { name: '🔁 REVERSE', value: 'Desfaz o /nuke', inline: true },
        { name: '📸 IMG', value: 'Gera Image Grabber', inline: true },
        { name: '🗣️ SAY', value: 'Faz o bot falar', inline: true },
        { name: '📨 DM', value: 'Envia DM para todos', inline: true },
        { name: '💬 SPAM', value: 'Envia spam no canal', inline: true },
        { name: '🔨 BANALL', value: 'Bane todos os membros', inline: true },
        { name: '⏰ END', value: 'Timeout em todos', inline: true },
        { name: '🗑️ DELETEROLE', value: 'Deleta todos os cargos', inline: true },
        { name: '📝 EDIT RAID', value: 'Edita configurações', inline: true },
        { name: '🔄 RENAME', value: 'Renomeia canais/categorias', inline: true }
      )
      .setFooter({ text: 'CBS TEAM - O PODER É NOSSO!' })
      .setTimestamp();

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('menu_nuke').setLabel('💀 NUKE').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_timer').setLabel('⏱️ TIMER').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_reverse').setLabel('🔁 REVERSE').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_img').setLabel('📸 IMG').setStyle(ButtonStyle.Secondary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('menu_say').setLabel('🗣️ SAY').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_dm').setLabel('📨 DM').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_spam').setLabel('💬 SPAM').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_banall').setLabel('🔨 BANALL').setStyle(ButtonStyle.Danger)
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('menu_end').setLabel('⏰ END').setStyle(ButtonStyle.Warning),
        new ButtonBuilder().setCustomId('menu_deleterole').setLabel('🗑️ DELETEROLE').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_editraid').setLabel('📝 EDIT RAID').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_rename').setLabel('🔄 RENAME').setStyle(ButtonStyle.Success)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3],
      flags: 64 // só o usuário vê
    });
  }
};