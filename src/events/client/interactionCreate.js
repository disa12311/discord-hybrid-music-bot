// events/client/interactionCreate.js
import { PermissionsBitField } from 'discord.js'; // Đảm bảo import PermissionsBitField

export default {
    name: 'interactionCreate',
    async execute(client, interaction) {
        // --- Xử lý Slash Commands ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Không tìm thấy lệnh ${interaction.commandName}.`);
                return;
            }

            try {
                // Thực thi lệnh. Truyền client vào để các lệnh có thể truy cập thuộc tính của client (ví dụ: client.distube)
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Lỗi khi thực thi lệnh ${interaction.commandName}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'Đã xảy ra lỗi khi thực thi lệnh này!', ephemeral: true });
                }
            }
        }

        // --- Xử lý Button Interactions ---
        if (interaction.isButton()) {
            const { customId, guild, member, channel } = interaction;
            const queue = client.distube.getQueue(guild);

            // Kiểm tra xem có phải là nút điều khiển nhạc không
            if (customId.startsWith('distube-')) {
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
                            // Hiển thị hàng chờ (tối đa 1900 ký tự cho tin nhắn Discord)
                            const q = queue.songs.map((song, i) =>
                                `${i === 0 ? 'Đang phát:' : `${i}.`} ${song.name} - \`${song.formattedDuration}\``
                            ).join('\n');
                            await interaction.reply({ content: `**Hàng chờ hiện tại:**\n${q.slice(0, 1900)}`, ephemeral: true });
                            break;
                        default:
                            break;
                    }
                } catch (error) {
                    console.error(`Lỗi khi xử lý nút nhạc: ${error}`);
                    await interaction.reply({ content: 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn.', ephemeral: true });
                }
            }
            // Thêm các loại nút khác ở đây nếu có
        }

        // --- Xử lý Modal Submits ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('banModal-')) {
                await interaction.deferReply({ ephemeral: true });

                const targetId = interaction.customId.split('-')[1];
                const target = await interaction.guild.members.fetch(targetId).catch(() => null);

                if (!target) {
                    return interaction.editReply('Không tìm thấy thành viên này hoặc họ đã rời máy chủ.');
                }

                const reason = interaction.fields.getTextInputValue('banReasonInput');

                try {
                    await target.ban({ reason: reason });
                    await interaction.editReply(`Đã cấm **${target.user.tag}** với lý do: \`${reason}\`.`);
                    // Bạn có thể thêm phần gửi tin nhắn log ra kênh cụ thể tại đây
                    // const logChannel = interaction.guild.channels.cache.get('ID_KENH_LOG');
                    // if (logChannel) {
                    //     logChannel.send(`Người dùng ${target.user.tag} đã bị cấm bởi ${interaction.user.tag}. Lý do: ${reason}`);
                    // }
                } catch (error) {
                    console.error(`Lỗi khi cấm người dùng ${target.user.tag}:`, error);
                    await interaction.editReply(`Đã xảy ra lỗi khi cấm ${target.user.tag}.`);
                }
            }
            // Thêm các loại modal khác ở đây nếu có
        }

        // --- Xử lý Select Menu Interactions ---
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'role-select-menu') {
                await interaction.deferReply({ ephemeral: true });

                const selectedRoleIds = interaction.values; // Mảng các ID vai trò đã chọn
                const member = interaction.member;

                // Lấy tất cả các vai trò mà Select Menu này có thể cung cấp
                const allPossibleRoleIds = interaction.component.options.map(option => option.value);

                const rolesToAdd = [];
                const rolesToRemove = [];

                // Quyết định vai trò nào cần thêm, vai trò nào cần gỡ
                for (const roleId of allPossibleRoleIds) {
                    if (selectedRoleIds.includes(roleId)) {
                        // Nếu vai trò được chọn và thành viên chưa có -> thêm
                        if (!member.roles.cache.has(roleId)) {
                            rolesToAdd.push(roleId);
                        }
                    } else {
                        // Nếu vai trò không được chọn và thành viên đang có -> gỡ
                        if (member.roles.cache.has(roleId)) {
                            rolesToRemove.push(roleId);
                        }
                    }
                }

                try {
                    if (rolesToAdd.length > 0) {
                        await member.roles.add(rolesToAdd);
                    }
                    if (rolesToRemove.length > 0) {
                        await member.roles.remove(rolesToRemove);
                    }

                    const addedNames = rolesToAdd.map(id => interaction.guild.roles.cache.get(id)?.name).filter(Boolean);
                    const removedNames = rolesToRemove.map(id => interaction.guild.roles.cache.get(id)?.name).filter(Boolean);

                    let replyMessage = '';
                    if (addedNames.length > 0) {
                        replyMessage += `✅ Đã thêm các vai trò: ${addedNames.join(', ')}.\n`;
                    }
                    if (removedNames.length > 0) {
                        replyMessage += `❌ Đã gỡ các vai trò: ${removedNames.join(', ')}.\n`;
                    }
                    if (!replyMessage) {
                        replyMessage = 'Bạn chưa thay đổi vai trò nào.';
                    }

                    await interaction.editReply(replyMessage);

                } catch (error) {
                    console.error(`Lỗi khi xử lý menu chọn vai trò cho ${member.user.tag}:`, error);
                    await interaction.editReply('Đã xảy ra lỗi khi cập nhật vai trò của bạn.');
                }
            }
            // Thêm các loại select menu khác ở đây nếu có
        }
    },
};
