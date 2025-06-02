const { info } = require("../utils/logger");

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    info(`Bot đã sẵn sàng! Logged in as ${client.user.tag}`);
  }
};
