const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { d100 } = require('../dice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription("Fais tourner la roue de l'infortune")
    .addIntegerOption(option =>
      option.setName('taille')
        .setDescription('Nombre de crystites à générer')
        .setRequired(true)
        .addChoices(
          { name: '100', value: 100 },
          { name: '1000', value: 1000 },
          { name: '10000', value: 10000 }
        )
    ),

  async execute(interaction) {
    const taille = interaction.options.getInteger('taille');
    const pieces = 10000 * taille;
    const width = taille === 100 ? 36 : taille === 1000 ? 65 : 100;
    const width2 = width - 2;

    await interaction.reply(`🎰 Utilisation de ${pieces.toLocaleString('fr-FR')} pièces dans la roue de l'infortune pour <@${interaction.user.id}>...`);

    const result_int = [];
    const result_str = [];

    for (let i = 0; i < taille; i++) {
      const val = await d100();
      result_int.push(val);
      result_str.push(val);
    }

    // Préparer l'affichage formaté
    const top = `╔${'═'.repeat(width)}╗\n`;
    const title = `║ ${'Roue de l\'infortune'.padStart((width2 / 2) + 10).padEnd(width2)} ║\n`;
    const sep = `╟${'─'.repeat(width)}╢\n`;
    const body = result_str.join(' ').match(new RegExp(`.{1,${width2}}`, 'g')).map(line => `║ ${line.padEnd(width2)} ║\n`).join('');
    const bottom = `╚${'═'.repeat(width)}╝\n`;
    const message = top + title + sep + body + bottom;

    // Enregistrer dans un fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(__dirname, `./casino_${timestamp}.txt`);
    fs.writeFileSync(filePath, message);

    await interaction.followUp({ files: [filePath] });

    // Comptage des crystites
    let orange = 0, bleu = 0, vert = 0, blanche = 0, violette = 0, rouge = 0;
    for (const i of result_int) {
      if (i === 1) orange += 4;
      else if (i <= 5) orange += 2;
      else if (i <= 15) orange += 1;
      else if (i <= 50) bleu += 1;
      else if (i <= 75) vert += 1;
      else if (i <= 95) blanche += 1;
      else if (i <= 99) violette += 1;
      else rouge += 1;
    }

    await interaction.followUp(
      `🎁 **Résultat des crystites** :\n` +
      ` - 🟠 ${orange} orange\n` +
      ` - 🔵 ${bleu} bleue\n` +
      ` - 🟢 ${vert} verte\n` +
      ` - ⚪ ${blanche} blanche\n` +
      ` - 🟣 ${violette} violette\n` +
      ` - 🔴 ${rouge} rouge`
    );

    setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 15000);
  }
};