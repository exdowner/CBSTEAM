const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('🗣️ Faz o bot falar algo (texto, embed, imagem)')
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('Mensagem que o bot vai enviar')
        .setRequired(true)
        .setMaxLength(4000)
    )
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde enviar (opcional, padrão: canal atual)')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addBooleanOption(option =>
      option.setName('embed')
        .setDescription('Enviar como embed bonito? (padrão: false)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('imagem')
        .setDescription('Imagem para enviar (anexo)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('link_imagem')
        .setDescription('Link de uma imagem para enviar')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título do embed (só funciona com embed:true)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('cor')
        .setDescription('Cor do embed')
        .setRequired(false)
        .addChoices(
          { name: '🔴 Vermelho', value: '#FF0000' },
          { name: '🟢 Verde', value: '#00FF00' },
          { name: '🔵 Azul', value: '#0000FF' },
          { name: '🟡 Amarelo', value: '#FFFF00' },
          { name: '🟣 Roxo', value: '#800080' },
          { name: '⚪ Branco', value: '#FFFFFF' }
        )
    ),

  async execute(interaction) {
    // ===== PEGA AS OPÇÕES =====
    const mensagem = interaction.options.getString('mensagem');
    const canal = interaction.options.getChannel('canal') || interaction.channel;
    const embedMode = interaction.options.getBoolean('embed') || false;
    const imagemAnexo = interaction.options.getAttachment('imagem');
    const linkImagem = interaction.options.getString('link_imagem');
    const titulo = interaction.options.getString('titulo') || 'Mensagem do Bot';
    const cor = interaction.options.getString('cor') || '#FF0000';

    // ===== VERIFICA SE O CANAL EXISTE =====
    if (!canal) {
      return interaction.reply({ 
        content: '❌ Canal não encontrado ou inválido.', 
        flags: 64 
      });
    }

    // ===== VERIFICA PERMISSÃO DO BOT NO CANAL =====
    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!botMember.permissionsIn(canal).has('SendMessages')) {
      return interaction.reply({ 
        content: `❌ Não tenho permissão para enviar mensagens em ${canal}.`, 
        flags: 64 
      });
    }

    // ===== RESPOSTA PRO USUÁRIO =====
    await interaction.reply({ 
      content: `✅ Mensagem enviada para ${canal}`,
      flags: 64 
    });

    // ===== ENVIA A MENSAGEM =====
    try {
      if (embedMode) {
        // Embed
        const embed = new EmbedBuilder()
          .setTitle(titulo)
          .setDescription(mensagem)
          .setColor(cor)
          .setTimestamp()
          .setFooter({ 
            text: `Enviado por ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          });

        if (imagemAnexo) {
          embed.setImage(imagemAnexo.url);
        } else if (linkImagem) {
          embed.setImage(linkImagem);
        }

        await canal.send({ embeds: [embed] });
      } else {
        // Texto normal
        let conteudo = mensagem;

        if (imagemAnexo) {
          await canal.send({ content: conteudo, files: [imagemAnexo] });
        } else if (linkImagem) {
          await canal.send({ content: `${conteudo}\n${linkImagem}` });
        } else {
          await canal.send({ content: conteudo });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      await interaction.editReply({ 
        content: `❌ Erro ao enviar mensagem: ${error.message}`,
        flags: 64
      });
    }
  }
};