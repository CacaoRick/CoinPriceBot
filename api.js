const axios = require("axios")
const moment = require("moment")

module.exports = {
  bitoex: () => {
    return new Promise((resolve, reject) => {
      axios.get("https://www.bitoex.com/api/v1/get_rate")
        .then((res) => {
          resolve({
            title: "*BitoEX* (NTD)",
            bid: res.data.sell,
            ask: res.data.buy,
          })
        })
        .catch((err) => {
          reject(`BitoEx error ${err.message}`)
        })
    })
  },
  bitfinex: (currency) => {
    return new Promise((resolve, reject) => {
      axios.get(`https://api.bitfinex.com/v2/ticker/t${currency}USD`)
        .then((res) => {
          const data = res.data
          resolve({
            title: "*Bitfinex* (USD)",
            bid: data[0],
            ask: data[2],
            last: data[6],
          })
        })
        .catch((err) => {
          reject(`Bitfinex ${currency}USD error ${err.message}`)
        })
    })
  },
  bittrex: (currency) => {
    return new Promise((resolve, reject) => {
      axios.get("https://bittrex.com/api/v1.1/public/getticker", {
        params: {
          market: `BTC-${currency}`
        }
      })
        .then((res) => {
          const data = res.data
          if (data.success) {
            resolve({
              title: "*Bittrex* (BTC)",
              bid: data.result.Bid,
              ask: data.result.Ask,
              last: data.result.Last,
            })
          }
        })
        .catch((err) => {
          reject(`Bittrex BTC-${currency} error ${err.message}`)
        })
    })
  },
  poolStats: (poolapi) => {
    return new Promise((resolve, reject) => {
      axios.get(poolapi)
        .then((res) => {
          const { stats } = res.data
          resolve(parsePoolStatus(stats))
        })
        .catch((err) => {
          reject(`Pool api error ${err.message}`)
        })
    })
  }
}

const parsePoolStatus = (stats) => {
  const xmr = Number(stats.balance) / 1000000000000
  return `*Hash Rate:\n*\`${stats.hashrate}\`\n*Pending Balance:\n*\`${xmr} XMR\`
*Last Share Submitted:\n*\`${moment(stats.lastShare, "X").fromNow()}\``
}
