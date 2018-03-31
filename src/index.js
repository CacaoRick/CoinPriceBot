import command from "./command"

import bot from "./bot"

bot.catch((error) => {
	console.log("error", error.error, error.message)
})

bot.command("/help", command.help)
bot.command("/price", command.price)
bot.command("/buy", command.exchange)
bot.command("/sell", command.exchange)
bot.command("/avg", command.exchange)
bot.command("/exchange", command.exchange)
bot.command("/blockHeight", command.blockHeight)
bot.command("/wsprice", command.wsprice.start)
bot.command("/wspriceStop", command.wsprice.stop)

bot.startPolling()
