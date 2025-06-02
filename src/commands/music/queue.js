// src/commands/music/queue.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { formatDuration } = require('../../utils/embeds');

const ITEMS_PER_PAGE = 10; // Số bài hát mỗi trang

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Hiển thị danh sách các bài hát trong hàng đợi.'),

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const queue = client.musicQueues.get(guildId);
        const logPrefix = `[QueueCommand][${guildId}]`;

        await interaction.deferReply();

        if (!queue || queue.length === 0) {
            client.logger.info(`${logPrefix} Hàng đợi trống.`);
            return interaction.followUp('Hàng đợi nhạc hiện đang trống!');
        }

        let currentPage = 0; // Bắt đầu từ trang đầu tiên

        const generateEmbed = (page) => {
            const totalPages = Math.ceil(queue.length / ITEMS_PER_PAGE);
            const startIndex = page * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, queue.length);

            const currentSongs = queue.slice(startIndex, endIndex);

            const description = currentSongs.map((song, index) =>
                `\`${startIndex + index + 1}.\` [${song.title}](${song.url}) - \`(${formatDuration(song.duration)}) \`yêu cầu bởi: ${song.requester.tag}`
            ).join('\n');

            const embed = new EmbedBuilder()
                .setColor('Purple')
                .setTitle('🎵 Hàng đợi nhạc')
                .setDescription(description || 'Không có bài hát nào trong trang này.')
                .setFooter({ text: `Trang ${page + 1} / ${totalPages} | Tổng số bài: ${queue.length}` })
                .setTimestamp();

            // Hiển thị bài hát đang phát ở đầu nếu có
            const player = client.voicePlayers.get(guildId);
            if (player && queue[0] && page === 0) {
                 embed.setAuthor({ name: `Đang phát: ${queue[0].title}`})
            }


            return embed;
        };

        const updateMessage = async (msg, page) => {
            const totalPages = Math.ceil(queue.length / ITEMS_PER_PAGE);
            const embed = generateEmbed(page);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_queue')
                        .setLabel('⬅️ Trước')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next_queue')
                        .setLabel('Tiếp ➡️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page >= totalPages - 1),
                );

            await msg.edit({ embeds: [embed], components: [row] });
        };

        const msg = await interaction.followUp({ embeds: [generateEmbed(currentPage)], components: [] }); // Gửi tin nhắn ban đầu

        // Tạo collector để xử lý tương tác nút
        const collector = msg.createMessageComponentCollector({
    filter: i => i.customId === 'prev_queue' || i.customId === 'next_queue',
    time: 120000 // Tăng lên 2 phút (120 giây) hoặc lâu hơn tùy ý
        });

        collector.on('collect', async i => {
            if (i.customId === 'prev_queue') {
                currentPage--;
            } else if (i.customId === 'next_queue') {
                currentPage++;
            }
            await i.deferUpdate();
            await updateMessage(msg, currentPage);
        });

        collector.on('end', async () => {
            client.logger.info(`${logPrefix} Collector cho hàng đợi đã kết thúc.`);
            // Sau khi collector kết thúc, xóa các nút để tránh tương tác không mong muốn
            await msg.edit({ components: [] }).catch(e => client.logger.error(`${logPrefix} Lỗi xóa nút queue: ${e.message}`));
        });
    },
};
