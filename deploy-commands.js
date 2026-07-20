const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos globais...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Comandos registrados globalmente com sucesso!');
    console.log('📝 Comandos disponíveis em TODOS os servidores!');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();