const axios = require('axios');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');

module.exports = {
    config: {
        name: 'flux',
        version: '1.0',
        author: 'NZ R',
        countDown: 10,
        role: 0,
        shortDescription: {
            en: 'Generate an image using the Flux'
        },
        longDescription: {
            en: 'Create an image based on the provided prompt'
        },
        category: 'Image',
        guide: {
            en: '-flux <prompt>'
        }
    },
    heyMetaStart: async function({ message, args }) {
        if (args.length === 0) {
            return message.reply('Please provide a prompt to generate an image.');
        }

        const prompt = encodeURIComponent(args.join(' '));
        const apiUrl = `https://fluxpro-v3-by-nzr.onrender.com/fluxpro?prompt=${prompt}`;
        const watermarkText = 'MeTa-DC-V2';
        const watermarkSvg = `
            <svg width="200" height="55" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="50%" 
                      font-size="24" 
                      font-family="Arial, sans-serif" 
                      fill="white" 
                      opacity="0.4" 
                      text-anchor="middle" 
                      dominant-baseline="middle"
                      style="filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));">
                      ${watermarkText}
                </text>
            </svg>`;

        const waitingMessage = await message.reply('⏳ Generating image, please wait...');

        try {
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');
            const watermarkBuffer = Buffer.from(watermarkSvg);

            const finalImage = await sharp(imageBuffer)
                .composite([{ input: watermarkBuffer, gravity: 'southeast' }])
                .toBuffer();

            const attachment = new AttachmentBuilder(finalImage, { name: 'image_with_watermark.jpeg' });
            const imageEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setImage('attachment://image_with_watermark.jpeg');

            await waitingMessage.delete();
            await message.reply({ embeds: [imageEmbed], files: [attachment] });
        } catch (error) {
            console.error('Image Generation Error:', error);
            await waitingMessage.delete();
            message.reply('❌ An error occurred while generating the image.');
        }
    }
};