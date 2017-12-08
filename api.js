const axios = require("axios")
const cloudscraper = require("cloudscraper")

module.exports = {
	bitoex: () => {
		return new Promise((resolve) => {
			cloudscraper.get("https://www.bitoex.com/api/v1/get_rate", (error, response, body) => {
				if (error) {
					console.log(`BitoEx error ${error}`)
					resolve(null)
				} else if (body) {
					const data = JSON.parse(body)
					resolve({
						title: "*BitoEX* (NTD)",
						bid: data.sell,
						ask: data.buy,
					})
				} else {
					resolve(null)
				}
			})
		})
	},
	maicoin: () => {
		return new Promise((resolve) => {
			axios.get("https://api.maicoin.com/v1/prices/twd")
				.then((res) => {
					resolve({
						title: "*MaiCoin* (NTD)",
						bid: Number(res.data.sell_price).toFixed(0),
						ask: Number(res.data.buy_price).toFixed(0),
					})
				})
				.catch((err) => {
					console.log(`MaiCoin error ${err.message}`)
					resolve(null)
				})
		})
	},
	bitfinex: (currency) => {
		return new Promise((resolve) => {
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
					console.log(`Bitfinex ${currency}USD error ${err.message}`)
					resolve(null)
				})
		})
	},
	bittrex: (currency) => {
		return new Promise((resolve) => {
			axios.get("https://bittrex.com/api/v1.1/public/getticker", {
				params: {
					market: `BTC-${currency}`,
				},
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
					console.log(`Bittrex BTC-${currency} error ${err.message}`)
					resolve(null)
				})
		})
	},
}

