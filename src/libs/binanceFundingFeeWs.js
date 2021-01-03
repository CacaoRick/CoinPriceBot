import db from 'libs/db'
import WebSocket from 'ws'

const ws = new WebSocket('wss://fstream.binance.com/stream')

ws.on('message', (message) => {
  try {
    const result = JSON.parse(message)
    if (result.data) {
      const fundingFeeData = result.data.map(data => {
        return {
          symbol: data.s,
          fundingFeeRate: Number(data.r),
          updatedAt: new Date(data.E),
          timeToNextFunding: new Date(data.T),
        }
      })
      db.fundingFee.set('fundingFees', fundingFeeData).write()
    }
  } catch (error) {
    console.log('ws message parse error', error)
  }
})

function start () {
  ws.on('open', () => {
    console.log('Binance ws open')
    ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: ['!markPrice@arr'],
      id: 1,
    }))
  })
}

export default {
  start,
}
