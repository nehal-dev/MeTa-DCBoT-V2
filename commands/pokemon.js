const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "pokemon",
        aliases: ["pokedex"],
        version: "1.1.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "game",
        guide: {
            en: "-pokemon (guess the Pokemon)"
        }
    },
    heyMetaStart: async function({ ctx }) {
        try {
            const loadingMsg = await ctx.reply("🔍 Finding a Pokémon...");

            const pokemonId = Math.floor(Math.random() * 898) + 1;
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonData = response.data;
            const pokemonImage = pokemonData.sprites.other['official-artwork'].front_default;

            const imagePath = path.join(__dirname, `../temp/pokemon_${pokemonId}.png`);
            await downloadFile(pokemonImage, imagePath);

            await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);

            let timeLeft = 15;
            const questionMsg = await ctx.replyWithPhoto(
                { source: fs.createReadStream(imagePath) },
                {
                    caption: `❓ Who's that Pokémon?\n⏱️ You have ${timeLeft} seconds!`
                }
            );

            const timer = setInterval(async () => {
                timeLeft--;
                if (timeLeft > 0 && timeLeft % 5 === 0) {
                    try {
                        await ctx.telegram.editMessageCaption(
                            ctx.chat.id,
                            questionMsg.message_id,
                            undefined,
                            `❓ Who's that Pokémon?\n⏱️ ${timeLeft} seconds remaining!`
                        );
                    } catch (err) {
                        clearInterval(timer);
                    }
                }
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    await ctx.telegram.deleteMessage(ctx.chat.id, questionMsg.message_id);
                    await ctx.reply(`⏰ Time's up! The Pokémon was ${capitalize(pokemonData.name)}.`);
                    Meta.onReply.delete(questionMsg.message_id);
                    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                }
            }, 1000);

            Meta.onReply.set(questionMsg.message_id, async (replyCtx) => {
                const userAnswer = replyCtx.message.text.toLowerCase().trim();
                const correctAnswer = pokemonData.name.toLowerCase();

                clearInterval(timer);

                try {
                    await ctx.telegram.deleteMessage(ctx.chat.id, replyCtx.message.message_id);
                    await ctx.telegram.deleteMessage(ctx.chat.id, questionMsg.message_id);
                } catch (err) {}

                if (userAnswer === correctAnswer) {
                    const stats = pokemonData.stats.map(stat =>
                        `${capitalize(stat.stat.name)}: ${stat.base_stat}`
                    ).join('\n');

                    await replyCtx.reply(
                        `🎉 Correct! It's ${capitalize(correctAnswer)}!\n\n` +
                        `📊 Types: ${pokemonData.types.map(t => capitalize(t.type.name)).join(', ')}\n` +
                        `📏 Height: ${pokemonData.height / 10}m\n⚖️ Weight: ${pokemonData.weight / 10}kg\n` +
                        `✨ Base Experience: ${pokemonData.base_experience}\n\n` +
                        `📈 Stats:\n${stats}`
                    );
                } else {
                    await replyCtx.reply(
                        `❌ Wrong! It was ${capitalize(correctAnswer)}.\n\n` +
                        `📊 Types: ${pokemonData.types.map(t => capitalize(t.type.name)).join(', ')}\n` +
                        `✨ Base Experience: ${pokemonData.base_experience}`
                    );
                }

                Meta.onReply.delete(questionMsg.message_id);
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error('Error:', error);
            await ctx.reply('🚫 An error occurred. Please try again later.');
        }
    }
};

async function downloadFile(url, outputPath) {
    try {
        const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
        fs.ensureDirSync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, Buffer.from(response.data));
    } catch (error) {
        console.error('File Download Error:', error);
        throw error;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
                             }
