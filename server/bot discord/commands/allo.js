const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allo')
    .setDescription('Un simple Hello World!'),

  async execute(interaction) {
    await interaction.reply('Hello World!');
  }
};
