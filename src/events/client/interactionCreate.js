// events/client/interactionCreate.js
export default {
    name: 'interactionCreate',
    async execute(client, interaction) {
        // Xử lý Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction, client); // Truyền client vào để các lệnh có thể truy cập distube
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true });
                }
            }
        }

        // Xử lý Button Interactions
        if (interaction.isButton()) {
            const { customId, guild, member, channel } = interaction;
            const queue = client.distube.getQueue(guild);

            if (!queue) {
                return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });
            }

            if (!member.voice.channel || member.voice.channel.id !== queue.voiceChannel.id) {
                return interaction.reply({ content: 'Bạn phải ở trong kênh thoại của bot để điều khiển nhạc!', ephemeral: true });
            }

            try {
                switch (customId) {
                    case 'distube-pause-resume':
                        if (queue.paused) {
                            queue.resume();
                            await interaction.reply({ content: '▶️ Đã tiếp tục phát nhạc.', ephemeral: true });
                        } else {
                            queue.pause();
                            await interaction.reply({ content: '⏸️ Đã tạm dừng nhạc.', ephemeral: true });
                        }
                        break;
                    case 'distube-skip':
                        if (queue.songs.length > 1) {
                            await queue.skip();
                            await interaction.reply({ content: '⏭️ Đã bỏ qua bài hát.', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'Không còn bài hát nào trong hàng chờ để bỏ qua.', ephemeral: true });
                        }
                        break;
                    case 'distube-stop':
                        queue.stop();
                        await interaction.reply({ content: '⏹️ Đã dừng phát nhạc và rời kênh.', ephemeral: true });
                        break;
                    case 'distube-loop':
                        const mode = queue.toggleRepeat(); // 0 = off, 1 = repeat song, 2 = repeat queue
                        let loopModeText;
                        if (mode === 0) loopModeText = 'Tắt lặp';
                        else if (mode === 1) loopModeText = 'Lặp bài hát hiện tại';
                        else loopModeText = 'Lặp hàng chờ';
                        await interaction.reply({ content: `🔁 Đã cài đặt chế độ lặp: \`${loopModeText}\`.`, ephemeral: true });
                        break;
                    case 'distube-queue':
                        // Hiển thị hàng chờ
                        const q = queue.songs.map((song, i) =>
                            `${i === 0 ? 'Đang phát:' : `${i}.`} ${song.name} - \`${song.formattedDuration}\``
                        ).join('\n');
                        await interaction.reply({ content: `**Hàng chờ hiện tại:**\n${q.slice(0, 1900)}`, ephemeral: true });
                        break;
                    default:
                        // Handle other custom IDs if any
                        break;
                }
            } catch (error) {
                console.error(`Error handling music button: ${error}`);
                await interaction.reply({ content: 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn.', ephemeral: true });
            }
        }

        // Xử lý các loại tương tác khác (Select Menus, Modals) sẽ được thêm vào đây sau
    },
};
