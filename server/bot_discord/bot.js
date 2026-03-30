const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes, Events} = require('discord.js');
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
const commandsArray = [];

// --- CHARGEMENT DYNAMIQUE DES COMMANDES ---
const commandsPath = path.join(__dirname, 'commands');

console.log(`� Recherche des commandes dans : ${commandsPath}`);

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`found ${commandFiles.length} fichiers .js :`, commandFiles);

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        console.log(`--- Analyse de : ${file} ---`);
        console.log(`   > Exportation détectée :`, Object.keys(command));

        // Vérification que la commande possède les propriétés requises
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
            console.log(`✅ Commande chargée : ${command.data.name}`);
        } else {
            console.log(`[AVERTISSEMENT] La commande à ${filePath} manque de "data" ou "execute".`);
        }
    }
} else {
    console.error("❌ Dossier 'commands' introuvable !");
}

// --- FONCTION DE DÉPLOIEMENT AUTOMATIQUE ---
async function deployCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN_DISCORD);
    
    try {
        console.log(`� Début du déploiement de ${commandsArray.length} commandes...`);
        
        const guildIds = process.env.GUILD_IDS.split(',');
        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.BOT_ID, guildId.trim()),
                { body: commandsArray }
            );
            console.log(`✅ Commandes enregistrées pour la guilde : ${guildId.trim()}`);
        }
    } catch (error) {
        console.error("❌ Erreur lors du déploiement des commandes :");
        console.error(error);
    }
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
client.once(Events.ClientReady, async () => {
  console.log(`Connecté en tant que ${client.user.tag}`);

  // Déploiement automatique au démarrage
  await deployCommands();

  createStartupButton(client); 
});
setupButtonInteraction(client);


console.log("Token détecté ?", process.env.TOKEN_DISCORD ? "Oui" : "Non");
console.log("Token brut : [" + process.env.TOKEN_DISCORD + "]");
client.login(process.env.TOKEN_DISCORD);