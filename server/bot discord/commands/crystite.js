const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { d2, d3, d4, d5, d9, d10, d20, d30, d80, d100 } = require('../dice');

function _1d9() {
  return {
    1: 'Arme 1 main tranchante', 2: 'Arme 2 main tranchante', 3: 'Arme 1 main contondante',
    4: 'Arme 2 main contondante', 5: 'Bouclier', 6: 'Casque', 7: 'Plastron', 8: 'Brassard', 9: 'Jambière'
  }[d9()];
}

function _1d3() {
  return { 1: 'Armure', 2: 'Barrière', 3: 'Hybride' }[d3()];
}

function _1d4() {
  return { 1: 'Feu', 2: 'Eau', 3: 'Vent', 4: 'Terre' }[d4()];
}

function _1d5() {
  return { 1: 'Force', 2: 'Agilité', 3: 'Discrétion', 4: 'Constitution', 5: 'Charisme' }[d5()];
}

function debut() {
  const typeEquip = _1d9();
  const armure = ['Bouclier', 'Casque', 'Plastron', 'Jambière', 'Brassard'].includes(typeEquip);
  return [typeEquip, armure ? _1d3() : ''];
}

function adjust_stat_for_hybride(stat, equip) {
  if (equip[1] === 'Hybride') {
    if (stat % 2 === 1) stat++;
    return Math.floor(stat / 2);
  }
  return stat;
}

function blanc() {
  const equip = debut();
  return [equip[0], 'Blanc', equip[1], adjust_stat_for_hybride(d20(), equip), '', '', '', '', '', ''];
}

function vert() {
  const equip = debut();
  return [equip[0], 'Vert', equip[1], adjust_stat_for_hybride(d30() + d30() + d30(), equip), d10(), _1d4(), '', '', '', ''];
}

function bleu() {
  const equip = debut();
  const stat1 = adjust_stat_for_hybride(d80() + d80() + d80() + d80() + d80(), equip);
  const stat2 = d20();
  const stat3 = d10();
  const stat4 = _1d4();
  const stat5 = _1d4();
  const stat6 = _1d5();
  const bonus = d100() === 1 ? 'Bonus Zopu' : '';
  const statCombo = Math.random() < 0.5 ? stat5 : stat6;
  return [equip[0], 'Bleu', equip[1], stat1, stat2, stat4, stat3, statCombo, '', bonus];
}

function orange() {
  const equip = debut();
  const stat1 = adjust_stat_for_hybride(Array.from({ length: 8 }).reduce((a) => a + d100(), 0), equip);
  const stat2 = d30();
  const stat3 = d20();
  const stat4 = _1d4();
  const stat5 = _1d4();
  const stat6 = _1d5();
  const stat7 = d10();
  const bonus = d100() <= 5 ? 'Bonus Zopu' : '';
  const statCombo = Math.random() < 0.5 ? stat5 : stat6;
  return [equip[0], 'Orange', equip[1], stat1, stat2, stat4, stat3, statCombo, stat7, bonus];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crystite')
    .setDescription("Ouvrir un ou plusieurs crystites par couleur")
    .addStringOption(option =>
      option.setName('couleur')
        .setDescription("La couleur de la crystite")
        .setRequired(true)
        .addChoices(
          { name: 'Blanc', value: 'Blanc' },
          { name: 'Vert', value: 'Vert' },
          { name: 'Bleu', value: 'Bleu' },
          { name: 'Orange', value: 'Orange' }
        )
    )
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription("Combien de crystites ouvrir")
        .setRequired(true)
    ),

  async execute(interaction) {
    const couleur = interaction.options.getString('couleur');
    const nombre = interaction.options.getInteger('nombre');

    if (nombre <= 0 || nombre > 1000) {
      await interaction.reply({ content: `❌ Nombre de crystites invalide: ${nombre}`, ephemeral: true });
      return;
    }

    await interaction.reply('Voici vos crystites :');

    const resultat = {
      Type: [], Couleur: [], Armure: [], 'Stats principale': [],
      'Valeur stat 2': [], 'Type stat 2': [], 'Valeur stat 3': [],
      'Type stat 3': [], Exaltation: [], Bonus: []
    };

    for (let i = 0; i < nombre; i++) {
      let data;
      if (couleur === 'Blanc') data = blanc();
      else if (couleur === 'Vert') data = vert();
      else if (couleur === 'Bleu') data = bleu();
      else if (couleur === 'Orange') data = orange();

      Object.keys(resultat).forEach((key, idx) => {
        resultat[key].push(data[idx] || '');
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(__dirname, `./crystite_result_${timestamp}.xlsx`);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Crystites');

    worksheet.columns = Object.keys(resultat).map(key => ({ header: key, key: key }));
    for (let i = 0; i < nombre; i++) {
      const row = {};
      for (const key of Object.keys(resultat)) row[key] = resultat[key][i];
      worksheet.addRow(row);
    }

    await workbook.xlsx.writeFile(filePath);
    await interaction.followUp({ files: [filePath] });
    setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 15000);
  }
};
