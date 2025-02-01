const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: "tictactoe",
        aliases: ["ttt"],
        version: "2.0.0",
        author: "NZ R",
        countDown: 5,
        role: 0,
        category: "game",
        guide: {
            en: "-tictactoe (play against MeTa)"
        }
    },
    heyMetaStart: async function({ message }) {
        const board = [
            ['⬜', '⬜', '⬜'],
            ['⬜', '⬜', '⬜'],
            ['⬜', '⬜', '⬜']
        ];
        const userSymbol = '❌';
        const botSymbol = '⭕';
        let gameActive = true;
        let currentTurn = 'user';

        function isWinning(board, symbol) {
            for (let i = 0; i < 3; i++) {
                if (board[i].every(cell => cell === symbol)) return true;
                if (board.map(row => row[i]).every(cell => cell === symbol)) return true;
            }
            if ([0, 1, 2].map(i => board[i][i]).every(cell => cell === symbol)) return true;
            if ([0, 1, 2].map(i => board[i][2 - i]).every(cell => cell === symbol)) return true;
            return false;
        }

        function isDraw(board) {
            return board.flat().every(cell => cell !== '⬜');
        }

        function minimax(newBoard, depth, isMaximizing) {
            if (isWinning(newBoard, botSymbol)) return 10 - depth;
            if (isWinning(newBoard, userSymbol)) return depth - 10;
            if (isDraw(newBoard)) return 0;

            if (isMaximizing) {
                let bestScore = -Infinity;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (newBoard[i][j] === '⬜') {
                            newBoard[i][j] = botSymbol;
                            let score = minimax(newBoard, depth + 1, false);
                            newBoard[i][j] = '⬜';
                            bestScore = Math.max(score, bestScore);
                        }
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        if (newBoard[i][j] === '⬜') {
                            newBoard[i][j] = userSymbol;
                            let score = minimax(newBoard, depth + 1, true);
                            newBoard[i][j] = '⬜';
                            bestScore = Math.min(score, bestScore);
                        }
                    }
                }
                return bestScore;
            }
        }

        function botMove() {
            let bestScore = -Infinity;
            let move;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (board[i][j] === '⬜') {
                        board[i][j] = botSymbol;
                        let score = minimax(board, 0, false);
                        board[i][j] = '⬜';
                        if (score > bestScore) {
                            bestScore = score;
                            move = { i, j };
                        }
                    }
                }
            }
            board[move.i][move.j] = botSymbol;
        }

        function getBoardButtons() {
            const rows = [];
            for (let i = 0; i < 3; i++) {
                const row = new ActionRowBuilder();
                for (let j = 0; j < 3; j++) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`move_${i}_${j}`)
                            .setLabel(board[i][j])
                            .setStyle(
                                board[i][j] === '⬜'
                                    ? ButtonStyle.Secondary
                                    : board[i][j] === userSymbol
                                    ? ButtonStyle.Success
                                    : ButtonStyle.Danger
                            )
                            .setDisabled(board[i][j] !== '⬜' || currentTurn !== 'user')
                    );
                }
                rows.push(row);
            }
            return rows;
        }

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('Tic Tac Toe')
            .setDescription(`It's your turn! (${userSymbol})`);

        const gameMessage = await message.channel.send({
            embeds: [embed],
            components: getBoardButtons()
        });

        const collector = gameMessage.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async interaction => {
            if (!gameActive || interaction.user.id !== message.author.id || currentTurn !== 'user') {
                return await interaction.reply({
                    content: "It's not your turn to play!",
                    ephemeral: true
                });
            }

            const [_, row, col] = interaction.customId.split('_').map(Number);
            board[row][col] = userSymbol;
            currentTurn = 'bot';

            if (isWinning(board, userSymbol)) {
                gameActive = false;
                embed.setDescription('🎉 You win!').setColor('#00ff00');
                await gameMessage.edit({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('play_again')
                                .setLabel('Play Again')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
                return;
            }

            if (isDraw(board)) {
                gameActive = false;
                embed.setDescription("It's a draw! 🤝").setColor('#ffa500');
                await gameMessage.edit({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('play_again')
                                .setLabel('Play Again')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
                return;
            }

            await interaction.update({
                embeds: [embed],
                components: getBoardButtons()
            });

            setTimeout(async () => {
                botMove();
                currentTurn = 'user';

                if (isWinning(board, botSymbol)) {
                    gameActive = false;
                    embed.setDescription('🤖 MeTa wins! Better luck next time!').setColor('#ff0000');
                    await gameMessage.edit({
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('play_again')
                                    .setLabel('Play Again')
                                    .setStyle(ButtonStyle.Primary)
                            )
                        ]
                    });
                    return;
                }

                if (isDraw(board)) {
                    gameActive = false;
                    embed.setDescription("It's a draw! 🤝").setColor('#ffa500');
                    await gameMessage.edit({
                        embeds: [embed],
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('play_again')
                                    .setLabel('Play Again')
                                    .setStyle(ButtonStyle.Primary)
                            )
                        ]
                    });
                    return;
                }

                await gameMessage.edit({
                    embeds: [embed],
                    components: getBoardButtons()
                });
            }, 1000);
        });

        collector.on('end', async () => {
            if (gameActive) {
                embed.setDescription('⏰ Time is up! The game has ended.').setColor('#808080');
                await gameMessage.edit({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('play_again')
                                .setLabel('Play Again')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
            }
        });

        const playAgainCollector = gameMessage.createMessageComponentCollector({ time: 30000 });
        playAgainCollector.on('collect', async interaction => {
            if (interaction.customId === 'play_again') {
                playAgainCollector.stop();
                module.exports.heyMetaStart({ message });
            }
        });

        const activeGames = new Set();
        if (activeGames.has(message.channel.id)) {
            return message.reply("A game is already in progress in this channel. Please wait for it to finish.");
        }
        activeGames.add(message.channel.id);

        collector.on('end', () => {
            activeGames.delete(message.channel.id);
        });
    }
};