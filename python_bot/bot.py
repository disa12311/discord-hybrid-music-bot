import os
import discord
from discord.ext import commands
import wavelink
from config import TOKEN

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='/', intents=intents)

@bot.event
async def on_ready():
    print(f'Bot Python sẵn sàng: {bot.user}')
    await wavelink.NodePool.create_node(
        bot=bot,
        host='lavalink',
        port=2333,
        password='youshallnotpass'
    )

for cog in ['music', 'controls', 'playlist', 'stats', 'logging', 'karaoke']:
    bot.load_extension(f'cogs.{cog}')

bot.run(os.getenv('TOKEN') or TOKEN)
