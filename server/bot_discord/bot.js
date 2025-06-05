const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const { createStartupButton, setupButtonInteraction } = require('./start-button.js');
const moment = require('moment-timezone');

const envPath = __dirname + '/../../.env';
require('dotenv').config({ path: envPath });

//log
if (fs.existsSync(envPath)) {
  console.log("✅ Le fichier .env existe");
  console.log("📄 Contenu du .env :\n" + fs.readFileSync(envPath, 'utf8'));
} else {
  console.log("❌ Le fichier .env est introuvable !");
}

//creer le bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.commands = new Collection();

// Charger toutes les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Réagir à une interaction
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  const user = interaction.user;
  const displayName = user.globalName ?? user.username;
  const now = moment().tz('America/Toronto').format('YYYY-MM-DD HH:mm:ss z');

  console.log(`📥 Commande utilisée : /${interaction.commandName}`);
  console.log(`👤 Utilisateur       : ${displayName} (${user.id})`);
  console.log(`🕒 Date/Heure        : ${now}`);
  console.log('----------------------------');


  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Erreur lors de l’exécution de la commande.', ephemeral: true });
  }
});

//start du bot
client.once(Events.ClientReady, () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
  createStartupButton(client); 
});
setupButtonInteraction(client);


console.log("Token détecté ?", process.env.TOKEN_DISCORD ? "Oui" : "Non");
console.log("Token brut : [" + process.env.TOKEN_DISCORD + "]");
client.login(process.env.TOKEN_DISCORD);