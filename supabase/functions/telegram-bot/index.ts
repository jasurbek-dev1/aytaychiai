import { Bot, InlineKeyboard, Context } from "grammy";
const bot = new Bot(Deno.env.get("TELEGRAM_BOT_TOKEN")!);
await bot.init();

async function checkSubscription(userId: number) {
  try {
    const status = await bot.api.getChatMember("@lutfiddinov_dev", userId);
    return ["member", "administrator", "creator"].includes(status.status);
  } catch (err) {
    console.error("Kanalni tekshirishda xato:", err);
    return false;
  }
}

bot.command("start", async (ctx: Context) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isSubscribed = await checkSubscription(userId);
  if (!isSubscribed) {
    const keyboard = new InlineKeyboard()
      .url("🚀 Join Lutfiddinov Dev", "https://t.me/lutfiddinov_dev")
      .row()
      .url("📢 Join Aytaychi AI", "https://t.me/aytaychiai_org")
      .row();

    return ctx.reply(
      "⚠️ Please subscribe to both channels above, then send /start again to unlock the bot.", 
      { reply_markup: keyboard }
    );
  }

  const menu = new InlineKeyboard()
    .webApp("🗣️ Speakingni boshlash", "https://aytaychiai.vercel.app/")
    .row()
    .url("👤 Admin bilan bog'lanish", "https://t.me/dasturchi_27");

  return ctx.reply("Hello! Ready to start your practice?", { reply_markup: menu });
}); // Qavs shu yerda muvaffaqiyatli yopildi!

Deno.serve(async (req) => {
  try {
    const update = await req.json();
    await bot.handleUpdate(update);
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
});