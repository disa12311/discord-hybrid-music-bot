class Queue {
  constructor() {
    this.songs = [];
    this.playing = false;
    this.loop = false;
    this.autoplay = false;
  }

  add(song) { this.songs.push(song); }
  next() {
    if (this.loop && this.songs.length > 0) {
      this.songs.push(this.songs[0]);
    }
    return this.songs.shift();
  }
  hasNext() { return this.songs.length > 0; }
}

const queues = new Map();

module.exports = {
  get(guildId) {
    if (!queues.has(guildId)) queues.set(guildId, new Queue());
    return queues.get(guildId);
  }
};
