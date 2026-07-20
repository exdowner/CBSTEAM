const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('📨 Envia mensagem na DM de todos os usuários do servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('Mensagem personalizada (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Apenas ADMs podem usar /dm.', flags: 64 });
    }

    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Me dê ADM.', flags: 64 });
    }

    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild;
    const user = interaction.user;
    const mensagemPersonalizada = interaction.options.getString('mensagem');

    const mensagemPadrao = 
      `**CBS NO COMANDO** https://discord.gg/6feSsqCx`;

    const mensagemFinal = mensagemPersonalizada || mensagemPadrao;

    // Pegar todos os membros (exceto bots e o próprio autor)
    const members = guild.members.cache.filter(m => 
      !m.user.bot && 
      m.id !== interaction.client.user.id
    );

    if (members.size === 0) {
      return interaction.editReply('⚠️ Nenhum membro para enviar DM.');
    }

    await interaction.editReply(`📨 ENVIANDO DM PARA ${members.size} MEMBROS...`);

    let enviados = 0;
    let falhas = 0;
    const list = [...members.values()];

    for (let i = 0; i < list.length; i++) {
      const member = list[i];
      try {
        await member.send({ content: mensagemFinal });
        enviados++;
      } catch (e) {
        falhas++;
      }

      // Atualiza progresso a cada 10 mensagens
      if ((i + 1) % 10 === 0 || i === list.length - 1) {
        await interaction.editReply(
          `📨 ${enviados + falhas}/${members.size} processados\n` +
          `✅ ${enviados} enviados\n` +
          `❌ ${falhas} falhas`
        );
      }

      // Pequena pausa para evitar rate limit
      if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    await interaction.editReply(
      `✅ **DM ENVIADAS COM SUCESSO!**\n\n` +
      `📨 ${enviados} membros receberam a mensagem\n` +
      `❌ ${falhas} membros não receberam (DM fechada ou bloqueio)\n\n` +
      `📝 Mensagem: ${mensagemFinal.substring(0, 50)}...`
    );
  }
};