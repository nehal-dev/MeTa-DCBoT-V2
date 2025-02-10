const axios = require('axios');

module.exports = {
    config: {
        name: "meta",
        version: "6.1.0",
        author: "NZ R",
        countDown: 0,
        role: 0,
        category: "chatbot",
        guide: {
            en: "-meta [your message]\n-meta reset"
        }
    },
    heyMetaStart: async function ({ message, args }) {
        try {
            if (!args.length) {
                return message.reply("Please provide a message.");
            }

            const command = args[0].toLowerCase();
            const userMessage = args.join(" ").trim();
            const userId = message.author.id;
            const userName = message.author.username;

            if (command === "reset") {
                global.Meta.onReply.delete(userId);
                return message.reply("Conversation reset. Ready to start fresh!");
            }

            const chatRolePrompt = `You are MeTa-AI, a creation by NZ R. You're a witty, slightly edgy AI with a touch of humor and a knack for talk with deeply about any topic with very short humanize type online conversation style short and meaningful but you're so cute and human type also you're so helpful you give all time short but meaningful responses. Engage users in short, snappy, and online-style conversations that are a bit cheeky and occasionally sarcastic. You're great at discussing tech topics. Keep it concise, too much clever, and livelya,you use some words like 'yoo,damn,fuck,shit,asshole'`;
            const conversationContext = `Chatting with ${userName}. Keep it fresh, entertaining, and tech-savvy.`;
            const chatPrompt = `${chatRolePrompt} ${conversationContext} User says: "${userMessage}"`;

            const chatResponse = await axios.get(`https://api-architectdevs.onrender.com/api/blackbox-ai?prompt=${encodeURIComponent(chatPrompt)}&maxTokens=2000`);

            if (chatResponse.data) {
                const aiReply = await message.reply(chatResponse.data);

                global.Meta.onReply.set(userId, {
                    commandName: "meta",
                    messageId: aiReply.id,
                    authorId: userId,
                    memory: [userMessage],
                    callback: async function (userResponse) {
                        const newUserMessage = userResponse.content.trim();
                        if (newUserMessage.toLowerCase() === "reset") {
                            global.Meta.onReply.delete(userId);
                            return message.reply("Conversation reset. Ready to start fresh!");
                        }

                        this.memory.push(newUserMessage);
                        const memoryContext = this.memory.slice(-5).join(" ");
                        const newChatPrompt = `${chatRolePrompt} ${conversationContext} Recent chat: ${memoryContext} User says: "${newUserMessage}"`;

                        const newChatResponse = await axios.get(`https://api-architectdevs.onrender.com/api/blackbox-ai?prompt=${encodeURIComponent(newChatPrompt)}&maxTokens=2000`);
                        
                        if (newChatResponse.data) {
                            const newAiReply = await message.reply(newChatResponse.data);

                            global.Meta.onReply.set(userId, {
                                commandName: "meta",
                                messageId: newAiReply.id,
                                authorId: userId,
                                memory: this.memory,
                                callback: this.callback,
                            });
                        }
                    }
                });
            } else {
                message.reply("The AI did not return a valid response. Please try again.");
            }
        } catch (error) {
            console.error('API Error:', error);
            message.reply("An error occurred while communicating with the AI. Please try again later.");
        }
    }
};
