class QueueManager:
    def __init__(self): self.queues = {}
    def get(self, guild_id):
        if guild_id not in self.queues:
            self.queues[guild_id] = []
        return self.queues[guild_id]
