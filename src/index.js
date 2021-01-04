import fundingFeeHandler from 'handlers/fundingFee'
import gasHandler from 'handlers/gas'
import helpHandler from 'handlers/help'
import lendingRateHandler from 'handlers/lendingRate'
import pinHandlers from 'handlers/pin'
import priceHandler from 'handlers/price'
import topHandler from 'handlers/top'
import binanceFundingFeeWs from 'libs/binanceFundingFeeWs'
import bot from 'libs/telegram'
import updater from 'updater'

console.log(process.env.BOT_TOKEN)

binanceFundingFeeWs.start()
updater.start()

bot.on('error', error => console.log(error.message))

bot.onText(/^\/help$/, helpHandler)
bot.onText(/^\/top/, topHandler)
bot.onText(/^\/price/, priceHandler)
bot.onText(/^\/gas/, gasHandler)
bot.onText(/^\/fundingFee/, fundingFeeHandler)
bot.onText(/^\/lendingRate/, lendingRateHandler)

bot.onText(/^\/pin$/, pinHandlers.pinHandler)
bot.onText(/^\/stop$/, pinHandlers.stopPinHandler)
