const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "pokemon",
        aliases: ["pokedex"],
        version: "1.4.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "game",
        guide: {
            en: "-pokemon (guess the Pokémon)"
        }
    },
    heyMetaStart: async function({ message }) {
        try {
            const loadingMsg = await message.reply("🔍 Finding a Pokémon...");
            const pokemonId = Math.floor(Math.random() * 898) + 1;
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonData = response.data;
            const pokemonImage = pokemonData.sprites.other['official-artwork'].front_default;
            const imagePath = path.join(__dirname, `../temp/pokemon_${pokemonId}.png`);
            await downloadFile(pokemonImage, imagePath);
            await loadingMsg.delete();

            let hasAnswered = false;
            let timeLeft = 20;

            const questionEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle("Who's that Pokémon?")
                .setDescription(`Reply with the Pokémon's name!\n⏱️ Time remaining: ${timeLeft} seconds`)
                .setImage(`attachment://pokemon_${pokemonId}.png`);

            const hintButton = new ButtonBuilder()
                .setCustomId('hint')
                .setLabel('Get a Hint')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(hintButton);

            const questionMsg = await message.channel.send({
                embeds: [questionEmbed],
                components: [row],
                files: [{ attachment: imagePath, name: `pokemon_${pokemonId}.png` }]
            });

            // Countdown Timer
            const timerInterval = setInterval(async () => {
                if (timeLeft > 0) {
                    timeLeft -= 5;
                    try {
                        await questionMsg.edit({
                            embeds: [
                                questionEmbed.setDescription(`Reply with the Pokémon's name!\n⏱️ Time remaining: ${timeLeft} seconds`)
                            ]
                        });
                    } catch (err) {
                        console.error('Error updating countdown:', err);
                        clearInterval(timerInterval);
                    }
                } else {
                    clearInterval(timerInterval);
                }
            }, 5000);

            const buttonCollector = questionMsg.createMessageComponentCollector({ time: 20000 });

            buttonCollector.on('collect', async interaction => {
                if (interaction.customId === 'hint') {
                    await interaction.reply({
                        content: `This Pokémon's name starts with: **${pokemonData.name.charAt(0).toUpperCase()}**`,
                        ephemeral: true
                    });
                }
            });

            const filter = m => m.author.id === message.author.id;
            const messageCollector = message.channel.createMessageCollector({ filter, max: 1, time: 20000 });

            messageCollector.on('collect', async reply => {
                const userAnswer = reply.content.toLowerCase().trim();
                const correctAnswer = pokemonData.name.toLowerCase();

                if (hasAnswered) return;
                hasAnswered = true;

                await reply.delete().catch(() => {});

                if (userAnswer === correctAnswer) {
                    const stats = pokemonData.stats.map(stat =>
                        `${stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)}: ${stat.base_stat}`
                    ).join('\n');

                    const successMsg = [
                        `🎉 Correct!`,
                        `\n📍 Pokémon: ${correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1)}`,
                        `\n📊 Types: ${pokemonData.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(', ')}`,
                        `📏 Height: ${pokemonData.height / 10}m`,
                        `⚖️ Weight: ${pokemonData.weight / 10}kg`,
                        `✨ Base Experience: ${pokemonData.base_experience}`,
                        `\n📈 Base Stats:`,
                        stats,
                        `\n🎯 Abilities: ${pokemonData.abilities.map(a => a.ability.name.charAt(0).toUpperCase() + a.ability.name.slice(1)).join(', ')}`
                    ].join('\n');

                    await message.channel.send(successMsg);
                } else {
                    await message.channel.send(`❌ Wrong! The correct Pokémon was **${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)}**.`);
                }

                cleanup();
            });

            messageCollector.on('end', collected => {
                if (!collected.size && !hasAnswered) {
                    message.channel.send(`⏰ Time's up! The Pokémon was **${pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)}**.`)
                        .then(msg => setTimeout(() => msg.delete(), 1000))
                        .catch(console.error);

                    cleanup();
                }
            });

            function cleanup() {
                clearInterval(timerInterval);
                buttonCollector.stop();
                messageCollector.stop();
                questionMsg.delete().catch(console.error);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            }

        } catch (error) {
            console.error('Error:', error);
            await message.channel.send('🚫 An error occurred. Please try again.').then(msg => msg.delete()).catch(() => {});
        }
    }
};

async function downloadFile(url, outputPath) {
    try {
        const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, Buffer.from(response.data));
    } catch (error) {
        console.error('File Download Error:', error);
        throw error;
    }
}