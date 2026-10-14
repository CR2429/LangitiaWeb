const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kill')
    .setDescription('Arrêter le bot.'),

  async execute(interaction) {
    const ownerId = '537398938102398998'; // Ton ID

    if (interaction.user.id === ownerId) {
      await interaction.reply('Le bot est kill');
      console.log("🔴 Kill command exécutée par le propriétaire.");
      await interaction.client.destroy(); // équivalent de bot.close()

      // Attendre un peu pour s'assurer que le reply est bien envoyé
      setTimeout(() => {
        exec('pm2 stop bot-discord', (error, stdout, stderr) => {
          console.log("Tentative d'exécution de pm2 stop");
          if (error) {
            console.error(`Erreur PM2 : ${error.message}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        });
      }, 1000);

    } else {
      await interaction.reply({
        content: ':middle_finger: :middle_finger: :middle_finger:',
        ephemeral: true
      });

      try {
        const owner = await interaction.client.users.fetch(ownerId);
        await owner.send(
          `🚨 Tentative non autorisée de tuer le bot !\n` +
          `Utilisateur : ${interaction.user.tag} (ID: ${interaction.user.id})\n` +
          `Serveur : ${interaction.guild?.name ?? "DM"} (ID: ${interaction.guildId})`
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi du message privé au propriétaire :", error);
      }
    }
  }
};
