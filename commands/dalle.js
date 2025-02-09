const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const sharp = require('sharp');

module.exports = {
    config: {
        name: "dalle",
        version: "1.0",
        author: "NZ R",
        countDown: 10,
        role: 0,
        shortDescription: {
            en: "Generate AI images"
        },
        longDescription: {
            en: "Generate AI images using DALL-E"
        },
        category: "Image",
        guide: {
            en: "-dalle <prompt>"
        },
    },

    heyMetaStart: async function({ message, args }) {
        try {
            if (!args?.length) return message.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setDescription('Please provide what image you want to generate!')
                        .setFooter({ text: 'Example: !dalle a futuristic cityscape' })
                ]
            });

            const prompt = args.join(" ");

            const loadingEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setDescription('🎨 Generating your image...\nThis might take a moment.')
                .setFooter({ text: 'MeTa DALL-E Image Generator' });

            const loadingMessage = await message.reply({ embeds: [loadingEmbed] });

            try {
                const response = await axios({
                    url: `https://dalle-v1-by-nzr.onrender.com/dalle?prompt=${encodeURIComponent(prompt)}`,
                    method: 'GET',
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': 'image/jpeg'
                    }
                });

                const imageBuffer = response.data;
                const resizedImage = await sharp(imageBuffer)
                    .resize(1024, 1024)
                    .toBuffer();

                const imageAttachment = new AttachmentBuilder(resizedImage, { name: 'image.jpeg' });

                const resultEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('AI Image Generation Complete')
                    .setDescription(`🎨 Here is your generated image!`)
                    .setFooter({ text: 'MeTa DALL-E Image Generator' });

                const enhanceButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('enhance')
                        .setLabel('Enhance Image')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✨')
                );

                const responseMessage = await loadingMessage.edit({
                    embeds: [resultEmbed],
                    files: [imageAttachment],
                    components: [enhanceButton]
                });

                const collector = responseMessage.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id,
                    time: 300000
                });

                collector.on('collect', async interaction => {
                    if (interaction.customId === 'enhance') {
                        const enhancedEmbed = new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('Enhancing Image...')
                            .setDescription('🎨 Enhancing your image...\nThis might take a moment.')
                            .setFooter({ text: 'MeTa DALL-E Image Generator' });

                        await interaction.update({
                            embeds: [enhancedEmbed],
                            components: []
                        });

                        const imageUrl = responseMessage.attachments.first().url;
                        const enhanceResponse = await axios({
                            url: `https://api-architectdevs.onrender.com/api/upscale?url=${encodeURIComponent(imageUrl)}`,
                            method: 'GET',
                            responseType: 'arraybuffer',
                            headers: {
                                'Accept': 'image/jpeg'
                            }
                        });

                        const enhancedImageBuffer = enhanceResponse.data;
                        const enhancedAttachment = new AttachmentBuilder(enhancedImageBuffer, { name: 'enhanced.jpeg' });

                        const enhancedResultEmbed = new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('Enhanced Image')
                            .setDescription(`🎨 Here is your enhanced image!`)
                            .setFooter({ text: 'MeTa DALL-E Image Generator' });

                        await interaction.editReply({
                            embeds: [enhancedResultEmbed],
                            files: [enhancedAttachment],
                            components: []
                        });
                    }
                });

                collector.on('end', async collected => {
                    if (collected.size === 0) {
                        await loadingMessage.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff6b6b')
                                    .setDescription('Image enhancement timed out.')
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
                            .setDescription('Failed to generate image. Please try again.')
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
