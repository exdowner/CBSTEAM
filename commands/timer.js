const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timer')
    .setDescription('⏱️ Agenda um /nuke automático após o tempo determinado (APENAS DONO)')
    .addStringOption(option =>
      option.setName('tempo')
        .setDescription('Tempo: 5m, 30s, 1h, 2m30s (máx 24h)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('publico')
        .setDescription('Exibir o timer publicamente? (padrão: falso)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const DONO_ID = '1409370594138525746';
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({
        content: '❌ **ACESSO NEGADO!** Apenas o dono do bot pode usar este comando.',
        flags: 64
      });
    }

    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ Eu preciso ser **ADMINISTRADOR** para executar o /nuke no final.',
        flags: 64
      });
    }

    const tempoStr = interaction.options.getString('tempo').toLowerCase().replace(/\s/g, '');
    const publico = interaction.options.getBoolean('publico') || false;

    let totalSegundos = 0;
    const regex = /(\d+)([smh])/g;
    let match;
    while ((match = regex.exec(tempoStr)) !== null) {
      const valor = parseInt(match[1]);
      const unidade = match[2];
      if (unidade === 's') totalSegundos += valor;
      else if (unidade === 'm') totalSegundos += valor * 60;
      else if (unidade === 'h') totalSegundos += valor * 3600;
    }

    if (totalSegundos <= 0 || totalSegundos > 86400) {
      return interaction.reply({
        content: '❌ Tempo inválido! Use: `5m`, `30s`, `1h`, `2m30s`. Máximo 24h.',
        flags: 64
      });
    }

    const finalTimestamp = Date.now() + totalSegundos * 1000;

    const embed = new EmbedBuilder()
      .setTitle('⏱️ TIMER AGENDADO')
      .setDescription(`**/nuke será executado em:**\n${formatarTempo(totalSegundos)}`)
      .setColor(0xFFA500)
      .addFields(
        { name: '🕒 Início', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '⏰ Fim', value: `<t:${Math.floor(finalTimestamp / 1000)}:F>`, inline: true },
        { name: '📋 Status', value: '⏳ Aguardando...', inline: false }
      )
      .setFooter({ text: 'Clique em "🛑 PARAR" para cancelar o timer' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stop_timer')
          .setLabel('🛑 PARAR TIMER')
          .setStyle(ButtonStyle.Danger)
      );

    const replyOptions = {
      embeds: [embed],
      components: [row],
      flags: publico ? 0 : 64
    };

    await interaction.reply(replyOptions);
    const replyMsg = await interaction.fetchReply();

    // Armazenar timer globalmente
    if (!client.timers) client.timers = new Map();
    const timerData = {
      channel: interaction.channel,
      messageId: replyMsg.id,
      finalTimestamp,
      totalSegundos,
      timeout: null,
      interval: null,
      ativo: true
    };
    client.timers.set(interaction.id, timerData);

    // Função de cancelamento
    const cancelar = async (motivo = 'Cancelado pelo usuário') => {
      if (!timerData.ativo) return;
      timerData.ativo = false;
      if (timerData.timeout) clearTimeout(timerData.timeout);
      if (timerData.interval) clearInterval(timerData.interval);
      client.timers.delete(interaction.id);

      const embedCancel = EmbedBuilder.from(embed)
        .setColor(0xFF0000)
        .setDescription(`❌ **Timer cancelado:** ${motivo}`)
        .setFooter({ text: 'Cancelado em' })
        .setTimestamp();

      try {
        const msg = await interaction.channel.messages.fetch(timerData.messageId);
        await msg.edit({ embeds: [embedCancel], components: [] });
      } catch {}
    };

    // Atualizar embed
    const atualizar = async () => {
      if (!timerData.ativo) return;
      const agora = Date.now();
      const restante = Math.max(0, Math.floor((timerData.finalTimestamp - agora) / 1000));
      const embedAtual = EmbedBuilder.from(embed)
        .setDescription(`**/nuke será executado em:**\n${formatarTempo(restante)}`)
        .setFields(
          { name: '🕒 Início', value: `<t:${Math.floor(interaction.createdTimestamp / 1000)}:F>`, inline: true },
          { name: '⏰ Fim', value: `<t:${Math.floor(timerData.finalTimestamp / 1000)}:F>`, inline: true },
          { name: '📋 Status', value: restante > 0 ? `⏳ ${formatarTempo(restante)} restantes` : '🚀 EXECUTANDO...', inline: false }
        )
        .setTimestamp();

      try {
        const msg = await interaction.channel.messages.fetch(timerData.messageId);
        await msg.edit({ embeds: [embedAtual] });
      } catch {}
    };

    // Executar nuke
    const executarNuke = async () => {
      if (!timerData.ativo) return;
      timerData.ativo = false;
      if (timerData.timeout) clearTimeout(timerData.timeout);
      if (timerData.interval) clearInterval(timerData.interval);
      client.timers.delete(interaction.id);

      const embedExec = EmbedBuilder.from(embed)
        .setColor(0x00FF00)
        .setDescription('🚀 **EXECUTANDO /NUKE...**')
        .setFields({ name: '📋 Status', value: '⚡ Em andamento...', inline: false })
        .setTimestamp();

      try {
        const msg = await interaction.channel.messages.fetch(timerData.messageId);
        await msg.edit({ embeds: [embedExec], components: [] });
      } catch {}

      await executarNukeDireto(interaction, client);
    };

    // Função que executa o nuke diretamente
    async function executarNukeDireto(interactionOriginal, client) {
      const nukeCmd = client.commands.get('nuke');
      if (!nukeCmd) return;

      const mockInteraction = {
        guild: interactionOriginal.guild,
        channel: interactionOriginal.channel,
        user: interactionOriginal.user,
        member: interactionOriginal.member,
        client: client,
        options: {
          getInteger: (name) => { if (name === 'quantidade') return 10; return null; },
          get: (name) => null
        },
        deferReply: async () => {},
        editReply: async (msg) => { await interactionOriginal.channel.send(msg); },
        reply: async (msg) => { await interactionOriginal.channel.send(msg); },
        isCommand: () => true,
        commandName: 'nuke',
        createdTimestamp: Date.now(),
      };

      await nukeCmd.execute(mockInteraction, client);
    }

    // Agendar
    timerData.timeout = setTimeout(() => {
      executarNuke();
    }, totalSegundos * 1000);

    timerData.interval = setInterval(() => {
      atualizar();
    }, 10000);

    client.timers.set(interaction.id, timerData);

    function formatarTempo(segundos) {
      const h = Math.floor(segundos / 3600);
      const m = Math.floor((segundos % 3600) / 60);
      const s = segundos % 60;
      let r = '';
      if (h > 0) r += `${h}h `;
      if (m > 0) r += `${m}m `;
      if (s > 0 || r === '') r += `${s}s`;
      return r.trim();
    }
  }
};