const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "meta",
        version: "6.1.0",
        author: "NZ R",
        countDown: 0,
        role: 0,
        category: "chatbot",
        guide: {
            en: "-meta [your message]\n-meta reset\n-meta code [your prompt]"
        }
    },
    heyMetaStart: async function ({ message, args }) {
        try {
            if (!args.length && message.attachments.size === 0 && !message.messageReference) {
                return message.reply("Please provide a command and message or an image.");
            }

            const command = args.length > 0 ? args.shift().toLowerCase() : "chat";
            const userMessage = args.join(" ").trim();
            const userId = message.author.id;
            const userName = message.author.username;

            if (command === "reset") {
                global.Meta.onReply.delete(userId);
                return message.reply("Conversation reset. Ready to start fresh!");
            }

            if (command === "code" || message.attachments.size > 0) {
                let codePrompt = userMessage;

                if (message.attachments.size > 0) {
                    const attachment = message.attachments.first();
                    const fileContent = await axios.get(attachment.url).then(res => res.data);
                    codePrompt = `Based on user feedback: "${fileContent}"`;
                }

                const waitingMessage = await message.reply("Generating your code project, please wait...");

                const codeRolePrompt = `You are MeTa-Code, an advanced coding AI by MeTa-LTD NZ R. Generate complex, efficient, and scalable code solutions based on user prompts. Provide detailed and accurate code snippets for various programming needs.`;
                const completePrompt = `${codeRolePrompt} User asks: "${codePrompt}"`;

                const codeResponse = await axios.get(`https://sandipbaruwal.onrender.com/qwen?prompt=${encodeURIComponent(completePrompt)}`);

                if (codeResponse.data && codeResponse.data.answer) {
                    const codeWithOwner = `// Owner: NZ R\n${codeResponse.data.answer}`;
                    const filePath = path.join(__dirname, `code_${userId}.txt`);
                    fs.writeFileSync(filePath, codeWithOwner);

                    await message.reply({
                        content: "Here's your code:",
                        files: [filePath]
                    });

                    fs.unlinkSync(filePath);
                } else {
                    message.reply("The AI could not generate the code. Please try again.");
                }

                await waitingMessage.delete();
                return;
            }

            let imageContext = "";
            let photoUrl = "";

            if (message.attachments.size > 0) {
                const attachment = message.attachments.first();
                photoUrl = attachment.url;
                const analyzePrompt = userMessage || "Analyze this image in detail";
                const imageResponse = await axios.get(`https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(analyzePrompt)}&url=${photoUrl}`);
                imageContext = imageResponse.data.answer || "";
            }

            const repliedMessage = message.messageReference
                ? await message.channel.messages.fetch(message.messageReference.messageId)
                : null;
            if (repliedMessage && repliedMessage.attachments.size > 0) {
                photoUrl = repliedMessage.attachments.first().url;
                const analyzePrompt = userMessage || "Analyze this image in detail";
                const imageResponse = await axios.get(`https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(analyzePrompt)}&url=${photoUrl}`);
                imageContext = imageResponse.data.answer || "";
            }

            const chatRolePrompt = `You are MeTa-AI, a creation by NZ R. You're a witty, slightly edgy AI with a touch of humor and a knack for coding. Engage users in short, snappy, and online-style conversations that are a bit cheeky and occasionally sarcastic. You're great at discussing tech topics. Keep it concise, clever, and lively.`;
            const conversationContext = `Chatting with ${userName}. Keep it fresh, entertaining, and tech-savvy.`;

            const chatPrompt = `${chatRolePrompt} ${conversationContext} ${imageContext ? `Image context: ${imageContext}` : ""} User says: "${userMessage}"`;

            const chatResponse = await axios.get(`https://sandipbaruwal.onrender.com/qwen?prompt=${encodeURIComponent(chatPrompt)}`);

            if (chatResponse.data && chatResponse.data.answer) {
                const aiReply = await message.reply(chatResponse.data.answer);

                global.Meta.onReply.set(userId, {
                    commandName: "meta",
                    messageId: aiReply.id,
                    authorId: userId,
                    memory: [userMessage],
                    imageUrl: photoUrl,
                    imageContext: imageContext,
                    callback: async function (userResponse) {
                        const newUserMessage = userResponse.content.trim();
                        if (newUserMessage.toLowerCase() === "reset") {
                            global.Meta.onReply.delete(userId);
                            return message.reply("Conversation reset. Ready to start fresh!");
                        }

                        this.memory.push(newUserMessage);
                        const memoryContext = this.memory.slice(-5).join(" ");
                        const newChatPrompt = `${chatRolePrompt} ${conversationContext} ${this.imageContext ? `Image context: ${this.imageContext}` : ""} Recent chat: ${memoryContext} User says: "${newUserMessage}"`;

                        let responseText = "";
                        if (userResponse.attachments.size > 0 || (userResponse.messageReference && (await message.channel.messages.fetch(userResponse.messageReference.messageId)).attachments.size > 0)) {
                            const newPhotoUrl = userResponse.attachments.size > 0
                                ? userResponse.attachments.first().url
                                : (await message.channel.messages.fetch(userResponse.messageReference.messageId)).attachments.first().url;
                            const newImageResponse = await axios.get(`https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(newUserMessage)}&url=${newPhotoUrl}`);
                            responseText = newImageResponse.data.answer;
                            this.imageUrl = newPhotoUrl;
                            this.imageContext = responseText;
                        } else {
                            const newChatResponse = await axios.get(`https://sandipbaruwal.onrender.com/qwen?prompt=${encodeURIComponent(newChatPrompt)}`);
                            responseText = newChatResponse.data.answer;
                        }

                        if (responseText) {
                            const newAiReply = await message.reply(responseText);

                            global.Meta.onReply.set(userId, {
                                commandName: "meta",
                                messageId: newAiReply.id,
                                authorId: userId,
                                memory: this.memory,
                                imageUrl: this.imageUrl,
                                imageContext: this.imageContext,
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