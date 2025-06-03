// commands/r.js
const { SlashCommandBuilder } = require('discord.js');
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
    let [nombreDes, nombreFaces] = [0, 0];

    try {
      [nombreDes, nombreFaces] = input.toLowerCase().split('d').map(Number);

      if (isNaN(nombreDes) || isNaN(nombreFaces) || nombreDes <= 0 || nombreFaces <= 0) {
        throw new Error();
      }

      if (nombreDes >= 100) {
        await interaction.reply('Ça va prendre 5 secondes à cause de la taille du message...');
        await new Promise(res => setTimeout(res, 5000));
      }

      const rolls = [];
      for (let i = 0; i < nombreDes; i++) {
        if (nombreFaces === 100) {
          rolls.push(dice.d100(interaction));
        } else {
          rolls.push(Math.floor(Math.random() * nombreFaces) + 1);
        }
      }

      const total = rolls.reduce((sum, val) => sum + val, 0);
      const message = `Jet de ${input} :\n=====
${rolls.join(', ')}\n=====
Total : ${total}`;

      if (message.length <= 2000) {
        await interaction.reply(message);
      } else {
        const parts = message.match(/.{1,2000}/gs);
        await interaction.reply(parts.shift());
        for (const part of parts) {
          await interaction.followUp(part);
        }
      }

    } catch {
      await interaction.reply(`Hey c'est quoi ce dé: \`${input}\`. Tu vas me réécrire ta commande ||connard||`);
    }
  }
};
