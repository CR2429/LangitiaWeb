const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const pool = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques de lancer de dés d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur dont afficher les statistiques')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const userId = user.id;

    try {
      const [rows] = await pool.query('SELECT result FROM dice_logs WHERE user_id = ?', [userId]);
      const results = rows.map(row => row.result);

      if (results.length === 0) {
        await interaction.reply(`Aucun lancer enregistré pour ${user.username}.`);
        return;
      }

      const total_rolls = results.length;
      const average = results.reduce((a, b) => a + b, 0) / total_rolls;
      const stddev = Math.sqrt(results.map(r => (r - average) ** 2).reduce((a, b) => a + b) / total_rolls);

      const success_absolute = results.filter(r => r === 1).length;
      const critical_success = results.filter(r => r >= 2 && r <= 5).length;
      const critical_failure = results.filter(r => r >= 96 && r <= 99).length;
      const absolute_failure = results.filter(r => r === 100).length;

      const embed = new EmbedBuilder()
        .setTitle(`Statistiques des lancers de d100 de <@${userId}>`)
        .setColor(Colors.Blue)
        .addFields(
          { name: "🧮 Total des lancers", value: `${total_rolls}`, inline: false },
          { name: "📊 Moyenne des résultats", value: `${average.toFixed(2)} (théorique : 50,5)`, inline: false },
          { name: "📉 Écart-type", value: `${stddev.toFixed(2)}`, inline: false },
          { name: "🎯 Succès absolu (1)", value: `${success_absolute} (${((success_absolute / total_rolls) * 100).toFixed(2)}%)`, inline: false },
          { name: "✨ Succès critique (2-5)", value: `${critical_success} (${((critical_success / total_rolls) * 100).toFixed(2)}%)`, inline: false },
          { name: "💀 Échec critique (96-99)", value: `${critical_failure} (${((critical_failure / total_rolls) * 100).toFixed(2)}%)`, inline: false },
          { name: "⚰️ Échec absolu (100)", value: `${absolute_failure} (${((absolute_failure / total_rolls) * 100).toFixed(2)}%)`, inline: false }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "Erreur lors de la récupération des statistiques.", ephemeral: true });
    }
  }
};