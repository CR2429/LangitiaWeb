// commands/d100.js
const { SlashCommandBuilder } = require('discord.js');
const dice = require('../dice');

function formatBoxedMessage(label, value) {
  const boxWidth = 20;
  const totalPadding = boxWidth - label.length;
  const paddingStart = Math.floor(totalPadding / 2);
  const paddingEnd = totalPadding - paddingStart;
  const centeredLabel = ' '.repeat(paddingStart) + label + ' '.repeat(paddingEnd);
  
  return [
    '```',
    '╔══════════════════════╗',
    `║    Jet d'un d100     ║`,
    '╟──────────────────────╢',
    `║ ${centeredLabel} ║`,
    '╚══════════════════════╝',
    '```'
  ].join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('d100')
    .setDescription('Lance un dé 100 et affiche un message stylé'),

  async execute(interaction) {
    const result = await dice.d100(interaction);
    let message;

    if (result === 1) {
      message = formatBoxedMessage('SUCCÈS ABSOLU (1)', result);
    } else if (result >= 2 && result <= 5) {
      message = formatBoxedMessage(`SUCCÈS CRITIQUE (${result})`, result);
    } else if (result >= 96 && result <= 99) {
      message = formatBoxedMessage(`ÉCHEC CRITIQUE (${result})`, result);
    } else if (result === 100) {
      message = formatBoxedMessage('ÉCHEC ABSOLU (100)', result);
    } else if (result === 69) {
      message = formatBoxedMessage('Résultat : 69 (nice)', result);
    } else {
      message = formatBoxedMessage(`Résultat : ${result}`, result);
    }

    await interaction.reply({ content: message });
  }
};
