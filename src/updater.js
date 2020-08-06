import _ from 'lodash'
import moment from 'moment-timezone'

import db from 'libs/db'
import bot from 'libs/telegram'
import getTop from 'libs/marketcap'
import delay from 'libs/delay'
import bitfinex from 'libs/bitfinex'
import cryptoCom from 'libs/crypto.com'

const updateDuration = 15 * 1000 // update price from api
const switchMessageDuration = 7.5 * 1000 // switch between price / 24h change

const lastMessage = {}
const currencies = ['BTC', 'ETH']

export async function start () {
  update()
  setInterval(update, updateDuration)
}

async function update () {
  if (!db.main.value() || db.main.isEmpty().value()) {
    return
  }

  try {
    const priceMessages = []
    const priceChangeMessages = []

    const fUSD = await bitfinex.fundingTicker('fUSD')
    const results = await bitfinex.tickers(currencies)
    const CRO = await cryptoCom.getTicker('CRO', 'USDT')

    const updateAt = moment()

    priceMessages.push(`f$ \`${fUSD.displayRate}\``)
    priceChangeMessages.push(`f$ \`${fUSD.dailyChange}%\``)

    results.forEach(result => {
      priceMessages.push(`${result.currency} \`${result.displayPrice}\``)
      priceChangeMessages.push(`${result.currency} \`${result.dailyChange}\``)
    })

    priceMessages.push(`CRO \`${CRO.displayPrice}\``)
    priceChangeMessages.push(`CRO \`${CRO.dailyChange}\``)

    // 更新訊息
    _.forEach(db.main.value(), async (group, groupId) => {
      const newMessage = priceMessages.join(' |\n')
      const newChangeMessage = priceChangeMessages.join(' |\n')
      if (lastMessage[groupId] !== newMessage) {
        lastMessage[groupId] = newMessage
        await bot.editMessageText(newMessage, {
          parse_mode: 'Markdown',
          ...group.priceMessage,
        })
        setTimeout(() => {
          bot.editMessageText(newChangeMessage, {
            parse_mode: 'Markdown',
            ...group.priceMessage,
          })
        }, switchMessageDuration)
      }

      await delay(1000)
      await bot.editMessageText(
        `最後更新 \`${updateAt.tz('Asia/Taipei').format('M/D HH:mm:ss')}\``, {
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
