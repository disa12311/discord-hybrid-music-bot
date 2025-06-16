class Queue {
  constructor() { this.songs = []; this.playing = false; }
  add(url) { this.songs.push(url); }
  next() { return this.songs.shift(); }
  hasNext() { return this.songs.length > 0; }
}

const guildQueues = new Map();
module.exports = {
  get(guildId) {
    if (!guildQueues.has(guildId)) guildQueues.set(guildId, new Queue());
    return guildQueues.get(guildId);
  }
};
