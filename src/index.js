import Telegraf from "telegraf"
import command from "./command"
import config from "../config"

const bot = new Telegraf(config.botToken, { username: config.botUsername })

bot.catch((error) => {
  console.log("error", error.error, error.message)
})

bot.command("/help", command.help)
bot.command("/price", command.price)
bot.command("/buy", command.buy)
bot.command("/sell", command.sell)

bot.startPolling()
