const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const dice = require('../dice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('r')
    .setDescription('Lance des dés personnalisés (ex : 5d100)')
    .addStringOption(option =>
      option.setName('dice')
        .setDescription('Exemple : 10d100')
        .setRequired(true)
    ),

  async execute(interaction) {
    const input = interaction.options.getString('dice');
    let nombreDes, nombreFaces;

    // Validation manuelle du format
    const match = input.toLowerCase().match(/^(\d+)d(\d+)$/);
    if (!match) {
      await interaction.reply(`Hey c'est quoi ce dé: \`${input}\` ? Tu vas me réécrire ta commande ||connard||`);
      return;
    }

    try {
      nombreDes = parseInt(match[1], 10);
      nombreFaces = parseInt(match[2], 10);

      if (nombreDes <= 0 || nombreFaces <= 0) {
        await interaction.reply(`Nombre de dés ou de faces invalide dans \`${input}\``);
        return;
      }

      if (nombreDes >= 100) {
        await interaction.reply('Ça va prendre 5 secondes à cause de la taille du message...');
        await new Promise(res => setTimeout(res, 5000));
      }

      let rolls = [];
      if (nombreFaces === 100) {
        rolls = await dice.d100(interaction, nombreDes);
      } else {
        rolls = Array.from({ length: nombreDes }, () => Math.floor(Math.random() * nombreFaces) + 1);
      }

      const total = rolls.reduce((sum, val) => sum + val, 0);
      const message = `Jet de ${input} :\n=====\n${rolls.join(', ')}\n=====\nTotal : ${total}`;

      if (message.length <= 2000) {
        await interaction.channel.send(message);
      } else {
        // Génère la date pour le nom de fichier
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
        const filename = `resultats_${timestamp}.txt`;
        const filepath = path.join(__dirname, filename);

        // Écrit le fichier sur le disque
        fs.writeFileSync(filepath, message, 'utf-8');

        // Prépare l'attachement pour Discord
        const file = new AttachmentBuilder(filepath);

        await interaction.channel.send({
          content: `Résultat trop long pour être affiché dans Discord, voici le fichier :`,
          files: [file],
        });

        // Supprime le fichier après 15 secondes
        setTimeout(() => {
          fs.unlink(filepath, err => {
            if (err) console.error(`❌ Erreur lors de la suppression de ${filename} :`, err);
            else console.log(`🗑️ Fichier ${filename} supprimé après envoi.`);
          });
        }, 15000);
      }

    } catch (err) {
      console.error("❌ Erreur lors de l'exécution de la commande /r :", err);
      await interaction.channel.send(">~< j'ai crash...");
    }
  }
};
