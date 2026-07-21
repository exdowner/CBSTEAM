const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
        ephemeral: true
      });
    }

    // ===== VERIFICA SE O BOT TEM ADM =====
    const botMember = interaction.guild.members.cache.get(client.user.id);
    if (!botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Eu preciso ser **ADMINISTRADOR** para executar este comando.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const prefix = 'RAIDED-BY-CS';

    try {
      // ===== 1. APAGAR CANAIS E CATEGORIAS =====
      await interaction.editReply('🧹 APAGANDO CANAIS E CATEGORIAS...');
      const channels = guild.channels.cache.filter(c => 
        c.name.startsWith(prefix) || c.name.startsWith('RAIDED-BY-CBS')
      );
      let canaisApagados = 0;
      const totalCanais = channels.size;
      for (const [id, ch] of channels) {
        try {
          await ch.delete();
          canaisApagados++;
        } catch (e) {}
        if (canaisApagados % 10 === 0 || canaisApagados === totalCanais) {
          await interaction.editReply(`🧹 ${canaisApagados}/${totalCanais} canais apagados`);
        }
      }

      // ===== 2. APAGAR CARGOS =====
      await interaction.editReply('🧹 APAGANDO CARGOS...');
      const roles = guild.roles.cache.filter(r => 
        r.name.startsWith(prefix) || r.name.startsWith('RAIDED-BY-CBS')
      );
      let cargosApagados = 0;
      const totalCargos = roles.size;
      for (const [id, r] of roles) {
        try {
          await r.delete();
          cargosApagados++;
        } catch (e) {}
        if (cargosApagados % 10 === 0 || cargosApagados === totalCargos) {
          await interaction.editReply(`🧹 ${cargosApagados}/${totalCargos} cargos apagados`);
        }
      }

      // ===== 3. MUDAR NOME DO SERVIDOR (VOLTAR) =====
      try {
        await guild.setName('Servidor Recuperado');
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