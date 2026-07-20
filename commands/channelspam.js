const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelspam')
    .setDescription('💬 Spama uma mensagem em um canal específico')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal onde enviar o spam')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('Mensagem a ser spamada (opcional, usa a padrão)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens (padrão: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs.', flags: 64 });
    }

    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Me dê ADM.', flags: 64 });
    }

    const canal = interaction.options.getChannel('canal');
    const mensagem = interaction.options.getString('mensagem') || config.raid.spamMessage || '**RAIDED BY CBS TEAM** 🔥';
    const quantidade = interaction.options.getInteger('quantidade') || 10;

    if (!canal) {
      return interaction.reply({ content: '❌ Canal inválido.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });
    await interaction.editReply(`💬 SPAMMANDO ${quantidade} mensagens em ${canal}...`);

    let enviadas = 0;
    for (let i = 0; i < quantidade; i++) {
      try {
        await canal.send({ content: mensagem });
        enviadas++;
      } catch (e) {
        console.error('Erro ao enviar spam:', e);
      }
      if (i % 10 === 0 && i > 0) {
        await interaction.editReply(`💬 ${enviadas}/${quantidade} mensagens enviadas`);
      }
    }

    await interaction.editReply(`✅ **${enviadas} mensagens enviadas com sucesso em ${canal}!** 💬`);
  }
};