import _ from 'lodash'
import axios from 'axios'
import moment from 'moment-timezone'
import db from 'db'
import bot from 'telegram'
import bitfinex from 'bitfinex'
import getTop from 'marketcap'

const lastMessage = {}
let symbols = ['tBTCUSD', 'tETHUSD', 'fUSD']

export async function start () {
  update()
  setInterval(update, 15 * 1000)
}

async function update () {
  if (!db.main.value() || db.main.isEmpty().value()) {
    return
  }

  try {
    const priceMessages = []
    let rateMessage = ''
    const priceChangeMessages = []
    let rateChangeMessage = ''

    const results = await bitfinex.lastPrices(symbols.join(','))

    // CRO
    // https://exchange-docs.crypto.com/#public-get-ticker
    const response = await axios.get('https://api.crypto.com/v2/public/get-ticker?instrument_name=CRO_USDT')
    const price = _.get(response, 'data.result.data.a') // last price
    const changePrice = _.get(response, 'data.result.data.c', 0) // 24h change
    const croPrice = price.toFixed(4)
    const croChange = (changePrice > 0 ? '+' : '') + (100 * changePrice / (croPrice - changePrice)).toFixed(2)
    const croMessage = `CRO \`${croPrice}\``
    const croChangeMessage = `CRO \`${croChange}%\``

    // 準備訊息
    results.forEach((result) => {
      if (result.length === 11) {
        const currency = result[0].replace('t', '').replace('USD', '')
        const price = result[7]
        const dailyChange = result[6] > 0 ? '+' : '' + (100 * result[6]).toFixed(2)
        // 計算小數後位數
        const factoryDigital = 5 - price.toFixed(0).length
        priceMessages.push(`${currency} \`${price.toFixed(factoryDigital)}\``)
        priceChangeMessages.push(`${currency} \`${dailyChange}%\``)
      } else {
        // fUSD 最後利率
        const rate = (100 * rate).toFixed(4)
        const dailyChange = result[9] > 0 ? '+' : '' + (100 * result[9]).toFixed(2)
        rateMessage = `f$ \`${rate}%\``
        rateChangeMessage = `f$ \`${dailyChange}%\``
      }
    })

    // 更新訊息
    _.forEach(db.main.value(), async (group, groupId) => {
      const newMessage = [rateMessage, ...priceMessages, croMessage].join(' |\n')
      const newChangeMessage = [rateChangeMessage, ...priceChangeMessages, croChangeMessage].join(' |\n')
      if (lastMessage[groupId] !== newMessage) {
        lastMessage[groupId] = newMessage
        await bot.editMessageText(newMessage, {
          parse_mode: 'Markdown',
          ...group.priceMessage,
        })
        setTimeout(() => {
          await bot.editMessageText(newChangeMessage, {
            parse_mode: 'Markdown',
            ...group.priceMessage,
          })
        }, 10000)
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
