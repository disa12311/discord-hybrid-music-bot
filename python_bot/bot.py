import discord
from discord.ext import commands
import wavelink
import asyncio
import config

bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())

@bot.event
async def on_ready():
    print(f'✅ Bot ready as {bot.user}')
    await wavelink.NodePool.create_node(bot=bot, host='localhost', port=2333, password='youshallnotpass')

@bot.slash_command(name="play")
async def play(ctx, url: str):
    if not ctx.author.voice:
        return await ctx.respond("❌ Bạn phải ở trong voice channel.")

    vc = ctx.voice_client or await ctx.author.voice.channel.connect(cls=wavelink.Player)

    track = await wavelink.YouTubeTrack.search(query=url, return_first=True)
    await vc.play(track)
    await ctx.respond(f"🎶 Đang phát: {track.title}")

bot.run(config.TOKEN)
