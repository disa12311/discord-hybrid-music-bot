// events/client/ready.js
export default {
    name: 'ready',
    once: true, // Chỉ chạy một lần khi bot khởi động
    execute(client) {
        console.log(`[EVENT] ${client.user.tag} đã sẵn sàng!`);
    },
};
