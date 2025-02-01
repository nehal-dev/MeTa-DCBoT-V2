const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    config: {
        name: "sdxl",
        version: "1.0",
        author: "NZ R",
        countDown: 10,
        role: 0,
        shortDescription: {
            en: "Generate AI images"
        },
        longDescription: {
            en: "Generate multiple AI images and select your favorite one"
        },
        category: "Image",
        guide: {
            en: "-sdxl <prompt>"
        },
    },

    heyMetaStart: async function({ message, args }) {
        try {
            if (!args?.length) return message.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setDescription('Please provide what image you want to generate!')
                        .setFooter({ text: 'Example: !sdxl sunset on a beach' })
                ]
            });

            const prompt = args.join(" ");

            const loadingEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setDescription('🎨 Generating your images...\nThis might take a moment.')
                .setFooter({ text: 'MeTa SDXL Image Generator' });

            const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

            try {
                const imagePromises = Array(4).fill().map(async () => {
                    const response = await axios({
                        url: `https://sdxl-v3-by-nzr.onrender.com/sdxl?prompt=${encodeURIComponent(prompt)}`,
                        method: 'GET',
                        responseType: 'arraybuffer',
                        headers: {
                            'Accept': 'image/jpeg'
                        }
                    });
                    return response.data;
                });

                const imageBuffers = await Promise.all(imagePromises);
                const individualAttachments = imageBuffers.map((buffer, index) => 
                    new AttachmentBuilder(buffer, { name: `image${index + 1}.jpeg` })
                );

                const resizedImages = await Promise.all(imageBuffers.map(buffer =>
                    sharp(buffer)
                        .resize(512, 512)
                        .toBuffer()
                ));

                const combinedImage = await sharp({
                    create: {
                        width: 1024,
                        height: 1024,
                        channels: 3,
                        background: { r: 255, g: 255, b: 255 }
                    }
                })
                .composite([
                    { input: resizedImages[0], top: 0, left: 0 },
                    { input: resizedImages[1], top: 0, left: 512 },
                    { input: resizedImages[2], top: 512, left: 0 },
                    { input: resizedImages[3], top: 512, left: 512 }
                ])
                .jpeg()
                .toBuffer();

                const combinedAttachment = new AttachmentBuilder(combinedImage, { name: 'combined.jpeg' });

                const resultEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('AI Image Generation Complete')
                    .setDescription(`🎨 Select your favorite image using the buttons below..!`)
                    .setFooter({ text: 'MeTa SDXL Image Generator' });

                const selectionButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('select_1')
                        .setLabel('Image 1')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('1️⃣'),
                    new ButtonBuilder()
                        .setCustomId('select_2')
                        .setLabel('Image 2')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('2️⃣'),
                    new ButtonBuilder()
                        .setCustomId('select_3')
                        .setLabel('Image 3')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('3️⃣'),
                    new ButtonBuilder()
                        .setCustomId('select_4')
                        .setLabel('Image 4')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('4️⃣')
                );

                const response = await loadingMessage.edit({
                    embeds: [resultEmbed],
                    files: [combinedAttachment],
                    components: [selectionButtons]
                });

                const collector = response.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id,
                    time: 300000
                });

                collector.on('collect', async interaction => {
                    if (interaction.customId.startsWith('select_')) {
                        const selectedNumber = parseInt(interaction.customId.split('_')[1]) - 1;
                        const selectedEmbed = new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('Selected Image')
                            
                            .setFooter({ text: 'MeTa SDXL Image Generator' });

                        await interaction.update({
                            embeds: [selectedEmbed],
                            files: [individualAttachments[selectedNumber]],
                            components: [
                                new ActionRowBuilder().addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('back')
                                        .setLabel('Back to All Images')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji('↩️')
                                )
                            ]
                        });
                    } else if (interaction.customId === 'back') {
                        await interaction.update({
                            embeds: [resultEmbed],
                            files: [combinedAttachment],
                            components: [selectionButtons]
                        });
                    }
                });

                collector.on('end', async collected => {
                    if (collected.size === 0) {
                        await loadingMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff6b6b')
                                    .setDescription('Image selection timed out.')
                            ],
                            components: []
                        });
                    }
                });

            } catch (error) {
                console.error('Generation Error:', error);
                await loadingMessage.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setDescription('Failed to generate images. Please try again.')
                    ],
                    components: []
                });
            }

        } catch (error) {
            console.error('Command Error:', error);
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setDescription('An error occurred while processing your request.')
                ]
            });
        }
    }
};