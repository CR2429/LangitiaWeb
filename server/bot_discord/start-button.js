const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Events, InteractionType } = require('discord.js');

function createStartupButton(bot) {
  const button = new ButtonBuilder()
    .setCustomId('startup_button')
    .setLabel('Cliquez ici')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  // Envoie le message de démarrage dans le canal principal
  const startupChannel = bot.channels.cache.get('1292275976973062254');
  if (startupChannel) {
    startupChannel.send({
      content: "Si c'est pas un test, appuie sur le bouton pour dire que le bot est en vie.",
      components: [row]
    });
  }
}

function setupButtonInteraction(bot) {
  bot.on(Events.InteractionCreate, async interaction => {
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.customId === 'startup_button'
    ) {
      const targetChannel = bot.channels.cache.get('1183006208869797901');
      try {
        if (targetChannel) {
          await targetChannel.send("Le bot est en vie, vous pouvez utiliser ses commandes.");
          await interaction.reply({ content: "Message envoyé sur un autre serveur.", ephemeral: true });
        } else {
          await interaction.reply({ content: "Erreur : Canal non trouvé.", ephemeral: true });
        }
      } catch (error) {
        await interaction.reply({ content: `Erreur : ${error}`, ephemeral: true });
      }
    }
  });
}

module.exports = {
  createStartupButton,
  setupButtonInteraction
};
