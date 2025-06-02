// src/events/interactions/autocompleteHandler.js
const { Events } = require('discord.js');
const fetch = require('node-fetch'); // Đảm bảo đã import

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction.isAutocomplete()) return;

        const focusedOption = interaction.options.getFocused(true);
        const guildId = interaction.guild?.id || 'DM'; // Hoặc 'DM' nếu interaction không trong guild
        const logPrefix = `[Autocomplete][${guildId}]`;

        if (focusedOption.name === 'query') {
            const userInput = focusedOption.value;
            // Tối ưu hóa: Tránh gọi API quá sớm, chờ người dùng nhập đủ ký tự
            if (!userInput || userInput.length < 3) {
                return interaction.respond([]);
            }

            try {
                const pythonApiSuggestUrl = `<span class="math-inline">\{process\.env\.PYTHON\_API\_URL\.replace\('/api/get\_music\_info', '/api/suggest'\)\}?query\=</span>{encodeURIComponent(userInput)}`;
                client.logger.debug(`${logPrefix} Đang lấy gợi ý từ API: ${pythonApiSuggestUrl}`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout 3 giây

                const response = await fetch(pythonApiSuggestUrl, {
                    signal: controller.signal // Gắn AbortController vào request
                });
                clearTimeout(timeoutId); // Xóa timeout nếu request hoàn tất trước

                if (!response.ok) {
                    const errorBody = await response.text().catch(() => 'No response body');
                    client.logger.warn(`${logPrefix} Backend trả về lỗi ${response.status}: ${errorBody.substring(0, 200)}`);
                    return interaction.respond([]);
                }

                const data = await response.json();
                if (!data || !Array.isArray(data.suggestions)) {
                    client.logger.warn(`${logPrefix} Dữ liệu gợi ý không hợp lệ từ backend: ${JSON.stringify(data).substring(0, 200)}`);
                    return interaction.respond([]);
                }

                // Giới hạn số lượng gợi ý để tránh lỗi Discord (tối đa 25)
                const choices = data.suggestions.slice(0, 25).map(s => ({
                    name: s.title ? s.title.substring(0, 100) : 'Unknown Title', // Discord limit 100 chars for name
                    value: s.url || s.title // Ưu tiên URL làm giá trị. Sẽ cần xử lý ở /play nếu value là title.
                }));

                await interaction.respond(choices);
                client.logger.debug(`${logPrefix} Đã phản hồi <span class="math-inline">\{choices\.length\} gợi ý cho "</span>{userInput}".`);

            } catch (error) {
                if (error.name === 'AbortError') {
                    client.logger.warn(`${logPrefix} Yêu cầu autocomplete bị hết thời gian chờ: ${error.message}`);
                } else {
                    client.logger.error(`<span class="math-inline">\{logPrefix\} Lỗi xử lý autocomplete cho query "</span>{userInput}": ${error.message}`, error);
                }
                await interaction.respond([]); // Luôn phản hồi để Discord không bị lỗi
            }
        }
    }
};
