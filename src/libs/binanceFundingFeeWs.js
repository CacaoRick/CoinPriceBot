import db from 'libs/db'
import WebSocket from 'ws'

const reconnectInterval = 60e3

function start () {
  const ws = new WebSocket('wss://fstream.binance.com/stream')
  
  ws.on('open', () => {
    console.log('Binance ws open')
    ws.send(JSON.stringify({
      method: 'SUBSCRIBE',
      params: ['!markPrice@arr'],
      id: 1,
    }))
  })
  ws.on('error', (error) => {
    console.log('socket error', error.message)
  })
  ws.on('close', () => {
    console.log('socket close')
    setTimeout(start, reconnectInterval)
  })
  ws.on('ping', () => ws.pong())
  ws.on('message', (message) => {
    try {
      const result = JSON.parse(message)
      if (result.data) {
        const fundingFeeData = result.data.map(data => {
          return {
            symbol: data.s,
            fundingFeeRate: 100 * Number(data.r),
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
}

export default {
  start,
}
