const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); const axios = require('axios'); const fs = require('fs-extra'); const path = require('path');

module.exports = { config: { name: "pokemon", aliases: ["pokedex"], version: "2.0.0", author: "NZ R", countDown: 5, role: 0, category: "game", guide: { en: "-pokemon (guess the Pokémon)" } }, heyMetaStart: async function({ message }) { try { const loadingMsg = await message.reply("🔍 Finding a Pokémon..."); const response = await axios.get(https://pokemon-by-nzr.onrender.com/api/pokemon); const allPokemon = response.data; const randomPokemon = allPokemon[Math.floor(Math.random() * allPokemon.length)]; const imagePath = path.join(__dirname, ../temp/pokemon_${randomPokemon.id}.png); await downloadFile(randomPokemon.image, imagePath); await loadingMsg.delete();

let hasAnswered = false;
        let timeLeft = 40;

        const questionEmbed = new EmbedBuilder()
            .setColor('#4ecdc4')
            .setTitle("Who's that Pokémon?")
            .setDescription(`Reply with the Pokémon's name!\n⏱️ Time remaining: ${timeLeft} seconds`)
            .setImage(`attachment://pokemon_${randomPokemon.id}.png`);

        const hintButton = new ButtonBuilder()
            .setCustomId('hint')
            .setLabel('Get a Hint')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(hintButton);

        const questionMsg = await message.channel.send({
            embeds: [questionEmbed],
            components: [row],
            files: [{ attachment: imagePath, name: `pokemon_${randomPokemon.id}.png` }]
        });

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
                    clearInterval(timerInterval);
                }
            } else {
                clearInterval(timerInterval);
            }
        }, 5000);

        const buttonCollector = questionMsg.createMessageComponentCollector({ time: 40000 });

        buttonCollector.on('collect', async interaction => {
            if (interaction.customId === 'hint') {
                const hint = `This Pokémon's name starts with: **${randomPokemon.name.charAt(0).toUpperCase()}**`;
                await interaction.reply({ content: hint, ephemeral: true });
            }
        });

        const filter = m => m.author.id === message.author.id;
        const messageCollector = message.channel.createMessageCollector({ filter, max: 1, time: 40000 });

        messageCollector.on('collect', async reply => {
            const userAnswer = reply.content.toLowerCase().trim();
            const correctAnswer = randomPokemon.name.toLowerCase();

            if (hasAnswered) return;
            hasAnswered = true;
            await reply.delete().catch(() => {});

            if (userAnswer === correctAnswer) {
                const successMsg = [
                    `🎉 Correct!`,
                    `📍 Pokémon: ${randomPokemon.name}`,
                    `📊 Types: ${randomPokemon.types.join(', ')}`,
                    `📏 Height: ${randomPokemon.height}m`,
                    `⚖️ Weight: ${randomPokemon.weight}kg`,
                    `✨ Base Experience: ${randomPokemon.base_experience}`,
                    `📈 Base Stats:`,
                    randomPokemon.stats.map(stat => `${stat.name}: ${stat.value}`).join('\n'),
                    `🎯 Abilities: ${randomPokemon.abilities.join(', ')}`
                ].join('\n');
                await message.channel.send(successMsg);
            } else {
                await message.channel.send(`❌ Wrong! The correct Pokémon was **${randomPokemon.name}**.`);
            }
            cleanup();
        });

        messageCollector.on('end', collected => {
            if (!collected.size && !hasAnswered) {
                message.channel.send(`⏰ Time's up! The Pokémon was **${randomPokemon.name}**.`)
                    .then(msg => setTimeout(() => msg.delete(), 1000))
                    .catch(() => {});
                cleanup();
            }
        });

        function cleanup() {
            clearInterval(timerInterval);
            buttonCollector.stop();
            messageCollector.stop();
            questionMsg.delete().catch(() => {});
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
    } catch (error) {
        await message.channel.send('🚫 An error occurred. Please try again.').then(msg => msg.delete()).catch(() => {});
    }
}

};

async function downloadFile(url, outputPath) { try { const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' }); await fs.ensureDir(path.dirname(outputPath)); await fs.writeFile(outputPath, Buffer.from(response.data)); } catch (error) { throw error; } }

