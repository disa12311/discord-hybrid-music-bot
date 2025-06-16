import wavelink
from discord.ext import commands

class Music(commands.Cog):
    def __init__(self, bot): self.bot = bot

    @commands.slash_command(name='play', description='Phát nhạc')
    async def play(self, ctx, url: str):
        if not ctx.author.voice:
            return await ctx.respond('Bạn cần vào voice channel!')
        vc: wavelink.Player = ctx.voice_client or await ctx.author.voice.channel.connect(cls=wavelink.Player)
        track = await wavelink.YouTubeTrack.search(query=url, return_first=True)
        await vc.play(track)
        await ctx.respond(f'Đang phát: {track.title}')

def setup(bot): bot.add_cog(Music(bot))
