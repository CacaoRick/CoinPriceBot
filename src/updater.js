import binance from 'apis/binance'
import bitfinex from 'apis/bitfinex'
import db from 'libs/db'
import delay from 'libs/delay'
import bot from 'libs/telegram'
import _ from 'lodash'
import moment from 'moment-timezone'

const updateDuration = 15 * 1000 // update price from api
const switchMessageDuration = 7.5 * 1000 // switch between price / 24h change
// const updateCurrenciesDuration = 30 * 60 * 1000

const lastMessage = {}
const currencies = ['BTC', 'ETH']

export async function start () {
  // await updateCurrencies()
  update()
  setInterval(update, updateDuration)
  // setInterval(updateCurrencies, updateCurrenciesDuration)
}

async function update () {
  if (!db.main.value() || db.main.isEmpty().value()) {
    return
  }

  try {
    const priceMessages = []
    const priceChangeMessages = []

    const updateAt = moment()

    // try {
    //   const fUSD = await bitfinex.fundingTicker('fUSD')
    //   priceMessages.push(`f$ \`${fUSD.displayRate}\``)
    //   priceChangeMessages.push(`f$ \`${fUSD.dailyChange}\``)
    // } catch (error) {
    //   console.log('get bitfinex fUSD', error.message)
    // }

    try {
      const results = await bitfinex.tickers(currencies)
      results.forEach(result => {
        priceMessages.push(`${result.currency} \`${result.displayPrice}\``)
        priceChangeMessages.push(`${result.currency} \`${result.dailyChange}\``)
      })
    } catch (error) {
      console.log('get bitfinex currencies', error.message)
    }

    try {
      const BNB = await binance.dailyStats('BNB', 'USDT')
      priceMessages.push(`BNB \`${BNB.displayPrice}\``)
      priceChangeMessages.push(`BNB \`${BNB.dailyChange}\``)
    } catch (error) {
      console.log('get BNB', error.message)
    }
    
    try {
      const SOL = await binance.dailyStats('SOL', 'USDT')
      priceMessages.push(`SOL \`${SOL.displayPrice}\``)
      priceChangeMessages.push(`SOL \`${SOL.dailyChange}\``)
    } catch (error) {
      console.log('get SOL', error.message)
    }
   
    try {
      const CRO = await cryptoCom.getTicker('CRO', 'USDT')
      priceMessages.push(`CRO \`${CRO.displayPrice}\``)
      priceChangeMessages.push(`CRO \`${CRO.dailyChange}\``)
    } catch (error) {
      console.log('get CRO', error.message)
    }
//     try {
//       const CAKE = await binance.dailyStats('CAKE', 'USDT')
//       priceMessages.push(`CAKE \`${CAKE.displayPrice}\``)
//       priceChangeMessages.push(`CAKE \`${CAKE.dailyChange}\``)
//     } catch (error) {
//       console.log('get CAKE', error.message)
//     }

    // try {
    //   const SXP = await binance.dailyStats('SXP', 'USDT')
    //   priceMessages.push(`SXP \`${SXP.displayPrice}\``)
    //   priceChangeMessages.push(`SXP \`${SXP.dailyChange}\``)
    // } catch (error) {
    //   console.log('get SXP', error.message)
    // }

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

// async function updateCurrencies () {
//   try {
//     const top3 = await marketcap.getTop(3)
//     currencies = top3.map(currency => currency.symbol)
//     console.log('update top currencies', currencies)
//   } catch (error) {
//     console.log('updateCurrencies', error.message)
//   }
// }
