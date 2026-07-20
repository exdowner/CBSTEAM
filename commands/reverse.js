const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reverse')
    .setDescription('🔁 Desfaz o /nuke – apaga canais, categorias e cargos criados pelo bot (APENAS DONO)'),

  async execute(interaction, client) {
    const DONO_ID = '1409370594138525746';

    // ===== VERIFICA SE É O DONO =====
    if (interaction.user.id !== DONO_ID) {
      return interaction.reply({
        content: '❌ **ACESSO NEGADO!** Apenas o dono do bot pode usar este comando.',
        flags: 64
      });
    }

    // ===== VERIFICA SE O BOT TEM ADM =====
    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Eu preciso ser **ADMINISTRADOR** para executar este comando.',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    const guild = interaction.guild;
    const prefix = 'RAIDED-BY-CS'; // prefixo usado no /nuke

    try {
      // ===== 1. APAGAR CANAIS =====
      await interaction.editReply('🧹 APAGANDO CANAIS E CATEGORIAS...');
      const channels = guild.channels.cache.filter(c => 
        c.name.startsWith(prefix) || c.name.startsWith('RAIDED-BY-CBS')
      );
      let canaisApagados = 0;
      for (const [id, ch] of channels) {
        try {
          await ch.delete();
          canaisApagados++;
        } catch (e) {}
        if (canaisApagados % 10 === 0) {
          await interaction.editReply(`🧹 ${canaisApagados}/${channels.size} canais apagados`);
        }
      }

      // ===== 2. APAGAR CARGOS =====
      await interaction.editReply('🧹 APAGANDO CARGOS...');
      const roles = guild.roles.cache.filter(r => 
        r.name.startsWith(prefix) || r.name.startsWith('RAIDED-BY-CBS')
      );
      let cargosApagados = 0;
      for (const [id, r] of roles) {
        try {
          await r.delete();
          cargosApagados++;
        } catch (e) {}
        if (cargosApagados % 10 === 0) {
          await interaction.editReply(`🧹 ${cargosApagados}/${roles.size} cargos apagados`);
        }
      }

      // ===== 3. MUDAR NOME E FOTO DO SERVIDOR (VOLTAR) =====
      try {
        await guild.setName('Servidor Recuperado');
        // Opcional: resetar foto para a padrão (não dá para remover, mas podemos colocar uma padrão)
        // Se quiser, pode deixar sem alterar.
      } catch (e) {}

      // ===== 4. FINAL =====
      await interaction.editReply(
        `✅ **REVERSE CONCLUÍDO!**\n\n` +
        `📂 ${canaisApagados} canais/categorias apagados\n` +
        `🎭 ${cargosApagados} cargos apagados\n` +
        `📝 Nome do servidor alterado para "Servidor Recuperado"\n\n` +
        `🔥 **Tudo voltou ao normal!**`
      );

    } catch (error) {
      console.error('❌ ERRO NO REVERSE:', error);
      await interaction.editReply(`❌ ERRO: ${error.message}`);
    }
  }
};