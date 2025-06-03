require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    for (const guildId of process.env.GUILD_IDS.split(',')) {
      await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, guildId), {
        body: commands
      });
      console.log(`✅ Commandes enregistrées pour la guilde ${guildId}`);
    }
  } catch (error) {
    console.error(error);
  }
})();
