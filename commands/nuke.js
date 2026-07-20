const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('🔥 Inicia um RAID completo no servidor (CBS TEAM)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de canais a serem criados (padrão: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(config.raid.maxChannels)
    ),
  
  async execute(interaction, client) {
    // Verificar se o usuário tem permissão de ADM
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **ACESSO NEGADO!**\nVocê precisa ser **ADMINISTRADOR** para usar este comando!',
        ephemeral: true
      });
    }

    // Verificar se o bot tem permissão de ADM
    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **ERRO DE PERMISSÃO!**\nEu preciso ser **ADMINISTRADOR** para executar este comando!\nPor favor, me dê permissões de administrador.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const quantidade = interaction.options.getInteger('quantidade') || 10;
    const guild = interaction.guild;
    const user = interaction.user;

    try {
      // 1. CRIAR CARGO
      const role = await guild.roles.create({
        name: config.raid.roleName,
        color: '#FF0000',
        reason: `RAID BY CBS TEAM - ${user.tag}`,
        permissions: [PermissionFlagsBits.Administrator]
      });

      // 2. CRIAR CATEGORIA
      const category = await guild.channels.create({
        name: config.raid.categoryName,
        type: ChannelType.GuildCategory,
        reason: `RAID BY CBS TEAM - ${user.tag}`
      });

      // 3. CRIAR CANAIS
      const channels = [];
      const topics = config.raid.topics;
      const messages = config.raid.messages;

      // Enviar progresso
      await interaction.editReply({
        content: `🚀 **INICIANDO RAID...**\nCriando ${quantidade} canais...`
      });

      for (let i = 1; i <= quantidade; i++) {
        const channelName = `${config.raid.channelName}-${i}`;
        const topic = topics[i % topics.length];
        
        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          topic: `🔥 ${topic} | CBS TEAM`,
          reason: `RAID BY CBS TEAM - ${user.tag}`,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: role.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            }
          ]
        });

        channels.push(channel);

        // Enviar mensagem com GIF
        const embed = {
          title: '🔥 CBS TEAM ESTEVE AQUI!',
          description: `**${messages[i % messages.length]}**\n\n💀 RAID INICIADO POR ${user.tag}`,
          color: 0xFF0000,
          image: {
            url: config.raid.gifUrl
          },
          footer: {
            text: 'CBS TEAM - DOMINAÇÃO TOTAL'
          },
          timestamp: new Date()
        };

        await channel.send({ 
          content: `@everyone ${config.raid.messageContent}`,
          embeds: [embed] 
        });

        // Atualizar progresso a cada 10 canais
        if (i % 10 === 0 || i === quantidade) {
          await interaction.editReply({
            content: `🚀 **RAID EM ANDAMENTO...**\n✅ ${i}/${quantidade} canais criados`
          });
        }

        // Pequeno delay para evitar rate limit
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 4. MENSAGEM FINAL
      const embedFinal = {
        title: '💀 RAID COMPLETO!',
        description: `**CBS TEAM DOMINOU O SERVIDOR!**\n\n` +
                    `✅ ${quantidade} canais criados\n` +
                    `✅ Cargo "${config.raid.roleName}" criado\n` +
                    `✅ Categoria criada\n` +
                    `✅ ${channels.length} mensagens enviadas\n\n` +
                    `🔥 **CBS TEAM ESTEVE AQUI!**\n\n` +
                    `👤 Executado por: ${user.tag}`,
        color: 0xFF0000,
        image: {
          url: config.raid.gifUrl
        },
        footer: {
          text: 'CBS TEAM - O PODER É NOSSO!'
        },
        timestamp: new Date()
      };

      // Enviar mensagem de conclusão no canal onde foi executado
      await interaction.editReply({
        content: `✅ **RAID INICIADO COM SUCESSO!**`,
        embeds: [embedFinal]
      });

      // Log no console
      console.log(`🔥 RAID executado por ${user.tag} em ${guild.name} (${guild.id})`);
      console.log(`📊 ${quantidade} canais criados`);
      console.log(`👥 Servidor: ${guild.memberCount} membros`);

    } catch (error) {
      console.error('❌ Erro no RAID:', error);
      await interaction.editReply({
        content: `❌ **ERRO AO EXECUTAR RAID:**\n\`${error.message}\`\n\nVerifique se o bot tem permissões de administrador.`
      });
    }
  }
};