
import gasHandler from 'handlers/gas'
import helpHandler from 'handlers/help'
import pinHandlers from 'handlers/pin'
import priceHandler from 'handlers/price'
import topHandler from 'handlers/top'
import bot from 'libs/telegram'
import updater from 'updater'

updater.start()

bot.on('error', error => console.log(error.message))

bot.onText(/^\/help$/, helpHandler)
bot.onText(/^\/top/, topHandler)
bot.onText(/^\/price/, priceHandler)
bot.onText(/^\/gas/, gasHandler)

bot.onText(/^\/pin$/, pinHandlers.pinHandler)
bot.onText(/^\/stop$/, pinHandlers.stopPinHandler)
