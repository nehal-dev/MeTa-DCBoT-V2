const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    config: {
        name: "sing",
        aliases: ["m", "music", "p"],
        version: "3.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        shortDescription: {
            en: "Stream music in Discord"
        },
        longDescription: {
            en: "Play Any Song with HQ Audio"
        },
        category: "MUSIC",
        guide: {
            en: "-sing <track name>"
        },
    },
    heyMetaStart: async function({ message, args }) {
        try {
            if (!args.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setDescription('📝 Please enter a track name!')
                    ]
                });
            }

            const searchQuery = args.join(" ");
            const initialEmbed = await message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#4ecdc4')
                        .setDescription('🔍 Searching for tracks...')
                ]
            });

            const musicData = await axios.get(`https://ytdl-v3-by-nzr.onrender.com/search?name=${encodeURIComponent(searchQuery)}`, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const tracks = musicData.data.results.slice(0, 6);

            if (!tracks.length) {
                return initialEmbed.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setDescription('❌ No tracks found! Try another search.')
                    ]
                });
            }

            const trackEmbeds = tracks.map((track, idx) => 
                new EmbedBuilder()
                    .setColor('#4ecdc4')
                    .setTitle(`${idx + 1}. ${track.title}`)
                    .setDescription(`⌛ Duration: ${track.timestamp}`)
                    .setThumbnail(track.thumbnail)
            );

            const selectionEmbed = new EmbedBuilder()
                .setColor('#4ecdc4')
                .setTitle('🎵 Track Selection')
                .setDescription('📝 Reply with the number of your choice (1-6)')
                .setFooter({ text: 'Reply within 30 seconds' });

            await initialEmbed.edit({ embeds: [selectionEmbed, ...trackEmbeds] });

            Meta.onReply.set(message.author.id, {
                messageId: initialEmbed.id,
                callback: async reply => {
                    const choice = parseInt(reply.content);
                    if (isNaN(choice) || choice < 1 || choice > tracks.length) {
                        reply.reply('❌ Invalid selection! Please choose a number between 1-6');
                        return;
                    }

                    const selectedTrack = tracks[choice - 1];
                    Meta.onReply.delete(message.author.id);

                    await initialEmbed.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#4ecdc4')
                                .setDescription(`🎼 Preparing: ${selectedTrack.title}`)
                                .setThumbnail(selectedTrack.thumbnail)
                        ]
                    });

                    try {
                        const streamUrl = `https://ytdl-v3-by-nzr.onrender.com/mp3?url=${selectedTrack.url}`;
                        const streamData = await axios.get(streamUrl, {
                            timeout: 15000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        });

                        if (!streamData.data.data || !streamData.data.data.link) {
                            throw new Error('Failed to get stream link');
                        }

                        const finalEmbed = new EmbedBuilder()
                            .setColor('#2ecc71')
                            .setTitle('🎵 Now Playing')
                            .setDescription(`${selectedTrack.title}\n\n⌛ Duration: ${selectedTrack.timestamp}`)
                            .setThumbnail(selectedTrack.thumbnail)
                            .addFields(
                                { name: 'Requested By', value: message.author.tag, inline: true }
                                
                            )
                            .setFooter({ text: 'MeTa Music Player' });

                        await initialEmbed.edit({
                            embeds: [finalEmbed],
                            files: [{
                                attachment: streamData.data.data.link,
                                name: `${selectedTrack.title.slice(0, 96)}.mp3`,
                                description: 'Studio Quality Audio'
                            }]
                        });

                    } catch (error) {
                        console.error('Stream Error:', error);
                        await initialEmbed.edit({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#ff6b6b')
                                    .setDescription('❌ Failed to stream track. Please try again.')
                            ]
                        });
                    }
                }
            });

            setTimeout(() => {
                if (Meta.onReply.has(message.author.id)) {
                    Meta.onReply.delete(message.author.id);
                    initialEmbed.edit({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ff6b6b')
                                .setDescription('⏰ Selection timed out. Please try again.')
                        ]
                    });
                }
            }, 30000);

        } catch (error) {
            console.error('Music Error:', error);
            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setDescription('❌ An error occurred. Please try again.')
                ]
            });
        }
    }
};