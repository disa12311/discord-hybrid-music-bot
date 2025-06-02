const { error } = require("../utils/logger");

module.exports = {
  name: "error",
  execute(err) {
    error("Unhandled error:", err);
  }
};
