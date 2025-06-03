const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const pool = require('../../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('element')
    .setDescription("Parcourir les éléments disponibles dans la base de données"),

  async execute(interaction) {
    
    // Récupération des éléments et des niveaux
    const [elementRows] = await pool.query("SELECT name, level, description FROM elements");
    const [levelRows] = await pool.query("SELECT level, roll_pattern FROM levels");
    

    const levels = {};
    for (const row of levelRows) {
      levels[row.level] = row.roll_pattern;
    }

    const elements = elementRows.map(row => ({
      name: row.name,
      level: row.level,
      description: row.description
    })).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    const pageSize = 25;
    let currentPage = 0;
    const totalPages = Math.ceil(elements.length / pageSize);

    const createSelectMenu = (page) => {
      const start = page * pageSize;
      const end = Math.min(start + pageSize, elements.length);
      const options = elements.slice(start, end).map(el => ({
        label: el.name,
        value: el.name
      }));

      return new StringSelectMenuBuilder()
        .setCustomId('element_select')
        .setPlaceholder('Choisissez un élément')
        .addOptions(options);
    };

    const createButtons = (page) => {
      const buttons = [];
      if (page > 0) {
        buttons.push(new ButtonBuilder().setCustomId('prev_page').setLabel('Précédent').setStyle(ButtonStyle.Primary));
      }
      if (page < totalPages - 1) {
        buttons.push(new ButtonBuilder().setCustomId('next_page').setLabel('Suivant').setStyle(ButtonStyle.Primary));
      }
      return buttons;
    };

    const updateMessage = async (i, page) => {
      const select = createSelectMenu(page);
      const row = new ActionRowBuilder().addComponents(select);
      const buttonRow = new ActionRowBuilder().addComponents(...createButtons(page));
      const start = page * pageSize;
      const end = Math.min(start + pageSize, elements.length);
      await i.update({
        content: `Éléments de ${elements[start].name} à ${elements[end - 1].name}`,
        components: [row, buttonRow]
      });
    };

    const select = createSelectMenu(currentPage);
    const row = new ActionRowBuilder().addComponents(select);
    const buttonRow = new ActionRowBuilder().addComponents(...createButtons(currentPage));

    const reply = await interaction.reply({
      content: `Éléments de ${elements[0].name} à ${elements[Math.min(pageSize, elements.length) - 1].name}`,
      components: [row, buttonRow],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({ time: 120_000 });

    collector.on('collect', async i => {
      if (i.customId === 'prev_page') {
        currentPage--;
        await updateMessage(i, currentPage);
      } else if (i.customId === 'next_page') {
        currentPage++;
        await updateMessage(i, currentPage);
      } else if (i.customId === 'element_select') {
        const selected = i.values[0];
        const el = elements.find(e => e.name === selected);
        const roll = levels[el.level] || '???';
        const maxWidth = 36;

        let message = `\u0060\u0060\u0060╔${'═'.repeat(maxWidth)}╗\n`;
        message += `║ ${el.name.padStart((maxWidth - 2 + el.name.length) / 2).padEnd(maxWidth - 2)} ║\n`;
        message += `╟${'─'.repeat(maxWidth)}╢\n`;
        message += `║ Niveau : ${el.level.toString().padEnd(maxWidth - 10)}║\n`;
        message += `║ Jet de dés : ${roll.padEnd(maxWidth - 14)}║\n`;

        if (el.description) {
          message += `╟${'─'.repeat(maxWidth)}╢\n`;
          const lines = el.description.match(new RegExp(`.{1,${maxWidth - 2}}`, 'g')) || [];
          for (const line of lines) {
            message += `║ ${line.padEnd(maxWidth - 2)} ║\n`;
          }
        }

        message += `╚${'═'.repeat(maxWidth)}╝\u0060\u0060\u0060`;
        await i.reply({ content: message, ephemeral: true });
      }
    });
  }
};
