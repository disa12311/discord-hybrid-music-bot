from discord.ext import commands

class Controls(commands.Cog):
    def __init__(self, bot): self.bot = bot

    @commands.slash_command(name='skip', description='Skip bài')
    async def skip(self, ctx):
        vc = ctx.voice_client
        if not vc or not vc.is_playing():
            return await ctx.respond('Không có bài nào đang phát')
        await vc.stop()
        await ctx.respond('Đã skip bài!')

def setup(bot): bot.add_cog(Controls(bot))
