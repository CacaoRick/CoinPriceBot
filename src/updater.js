import _ from 'lodash'
import binance from 'binance'
import moment from 'moment-timezone'
import db from 'db'
import bot from 'telegram'
import bitfinex from 'bitfinex'
import getTop from 'marketcap'

const lastMessage = {}
let symbols = ['tBTCUSD', 'tETHUSD', 'fUSD']
let mco

export async function start () {
  // await updateSymbols()
  update()
  setInterval(update, 5 * 1000)
  setInterval(updateSymbols, 60 * 60 * 1000)
}

async function update () {
  if (!db.main.value() || db.main.isEmpty().value()) {
    return
  }

  try {
    const priceMessages = []
    let rateMessage = ''

    const results = await bitfinex.lastPrices(symbols.join(','))

    // MCO
    const binanceResponse = await binance.dailyStats({ symbol: 'MCOUSDT' })
    const price = Number(binanceResponse.lastPrice)
    const factoryDigital = 5 - price.toFixed(0).length
    const mcoPrice = price.toFixed(factoryDigital)
    const mcoMessage = `MCO \`${mcoPrice}\``

    // 準備訊息
    results.forEach((result) => {
      if (result.length === 11) {
        const price = result[7]
        // 計算小數後位數
        const factoryDigital = 5 - price.toFixed(0).length
        priceMessages.push(`${result[0].replace('t', '').replace('USD', '')} \`${price.toFixed(factoryDigital)}\``)
      } else {
        // fUSD 最後利率
        const rate = result[10]
        rateMessage = `% \`${(100 * rate).toFixed(4)}\``
      }
    })

    // 更新訊息
    _.forEach(db.main.value(), async (group, groupId) => {
      const newMessage = [rateMessage, ...priceMessages, mcoMessage].join(' |\n')
      if (lastMessage[groupId] !== newMessage) {
        lastMessage[groupId] = newMessage
        await bot.editMessageText(newMessage, {
          parse_mode: 'Markdown',
          ...group.priceMessage,
        })
      }

      await bot.editMessageText(
        `最後更新 \`${moment().tz('Asia/Taipei').format('M/D HH:mm:ss')}\``, {
          parse_mode: 'Markdown',
          ...group.statusMessage,
        })
    })
  } catch (error) {
    console.log('update', error.message)
  }
}

export default {
  start,
}

async function updateSymbols () {
  try {
    const top3 = await getTop(3)
    symbols = top3.map(currency => `t${currency.symbol}USD`)
    symbols.push('fUSD')
  } catch (error) {
    console.log('updateSymbols', error.message)
  }
}
