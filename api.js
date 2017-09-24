const axios = require("axios")
const moment = require("moment")

module.exports = {
  bitoex: () => {
    return new Promise((resolve, reject) => {
      axios.get("https://www.bitoex.com/api/v1/get_rate")
        .then((res) => {
          resolve(`*BitoEx* (NTD)\n買: \`${res.data.buy}\`\n賣: \`${res.data.sell}\`\n`)
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
          resolve(`*Bitfinex* (USD)\n買: \`${data[8]}\`\n賣: \`${data[9]}\`\nLast: \`${data[6]}\`\n`)
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
            resolve(`*Bittrex* (BTC)\n買: \`${data.result.Bid}\`\n賣: \`${data.result.Ask}\`\nLast: \`${data.result.Last}\`\n`)
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
