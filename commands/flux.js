const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    config: {
        name: 'flux',
        version: '2.0',
        author: 'NZ R',
        countDown: 10,
        role: 0,
        shortDescription: {
            en: 'Generate an image using Flux with ratio selection'
        },
        longDescription: {
            en: 'Create an image based on the provided prompt with customizable aspect ratios'
        },
        category: 'Image',
        guide: {
            en: '-flux <prompt>'
        }
    },

    ratios: {
        1: '1:1',
        2: '16:9',
        3: '4:3',
        4: '3:2',
        5: '5:4',
        6: '9:16',
        7: '2:3',
        8: '3:4',
        9: '4:5'
    },

    heyMetaStart: async function({ message, args }) {
        if (args.length === 0) {
            return message.reply('Oops! It looks like you forgot to include a prompt. Please try again.');
        }

        const prompt = args.join(' ');

        const createRatioSelection = async () => {
            const rows = [];
            let currentRow = [];
            
            for (let i = 1; i <= 9; i++) {
                const button = new ButtonBuilder()
                    .setCustomId(`ratio_${i}`)
                    .setLabel(this.ratios[i])
                    .setStyle(ButtonStyle.Primary);
                
                currentRow.push(button);
                
                if (currentRow.length === 3 || i === 9) {
                    rows.push(new ActionRowBuilder().addComponents(currentRow));
                    currentRow = [];
                }
            }

            const selectionEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('Choose Your Image Ratio')
                .setDescription(`Prompt: ${prompt}\nPlease select an aspect ratio for your image.`);

            return {
                embeds: [selectionEmbed],
                components: rows
            };
        };

        let selectionMessage = await message.reply(await createRatioSelection());

        const handleInteraction = async (interaction) => {
            if (interaction.customId.startsWith('ratio_')) {
                const selectedRatio = interaction.customId.split('_')[1];
                await interaction.deferUpdate();

                const waitingEmbed = new EmbedBuilder()
                    .setColor('#4ecdc4')
                    .setDescription('⏳ Generating your image, please hold on...');

                await selectionMessage.edit({
                    embeds: [waitingEmbed],
                    components: []
                });

                const apiUrl = `https://fluxpro-v3-by-nzr.onrender.com/fluxpro?prompt=${encodeURIComponent(prompt)}&ratio=${selectedRatio}`;
                
                try {
                    const imageResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                    const attachment = new AttachmentBuilder(Buffer.from(imageResponse.data), { name: 'generated-image.png' });

                    const resultEmbed = new EmbedBuilder()
                        .setColor('#4ecdc4')
                        .setTitle('Here is Your Generated Image')
                        .setDescription(`Prompt: ${prompt}\nRatio: ${this.ratios[selectedRatio]}`)
                        .setImage('attachment://generated-image.png')
                        .setFooter({ text: `Requested by ${message.author.tag}` })
                        .setTimestamp();

                    const backButton = new ButtonBuilder()
                        .setCustomId('back')
                        .setLabel('Go Back 🔙')
                        .setStyle(ButtonStyle.Secondary);

                    await selectionMessage.edit({
                        embeds: [resultEmbed],
                        files: [attachment],
                        components: [new ActionRowBuilder().addComponents(backButton)]
                    });

                } catch (error) {
                    console.error('Image Generation Error:', error);
                    await selectionMessage.edit({
                        content: '🚨 An error occurred while generating your image. Please try again later.',
                        embeds: [],
                        components: []
                    });
                }
            } else if (interaction.customId === 'back') {
                await interaction.deferUpdate();
                const ratioSelection = await createRatioSelection();
                await selectionMessage.edit(ratioSelection);
            }
        };

        const collector = selectionMessage.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === message.author.id
        });

        collector.on('collect', handleInteraction);
    }
};
