// https://www.maicoin.com/api/prices/btc-twd
// https://www.maicoin.com/api/prices/eth-twd
// https://www.maicoin.com/api/prices/ltc-twd

// const result = {
//   formatted_buy_price: "NT$10,172.659410",
//   formatted_buy_price_in_twd: "NT$10,172.659410",
//   formatted_price: "NT$8,920.639790",
//   formatted_price_in_twd: "NT$8,920.639790",
//   formatted_sell_price: "NT$7,668.620170",
//   formatted_sell_price_in_twd: "NT$7,668.620170",
//   raw_buy_price: 1017265941,
//   raw_buy_price_in_twd: 1017265941,
//   raw_price: 892063979,
//   raw_price_in_twd: 892063979,
//   raw_sell_price: 766862017,
//   raw_sell_price_in_twd: 766862017,
// }

import axios from "axios"
const symbols = { BTC: "btc-twd", ETH: "eth-twd", LTC: "ltc-twd" }

export default function (currency, plain) {
	return new Promise((resolve, reject) => {
		return axios.get(`https://www.maicoin.com/api/prices/${symbols[currency]}`)
			.then((res) => {
				const { data } = res
				if (plain) {
					resolve({
						buy: (Number(data.raw_buy_price) / 100000).toFixed(0),
						sell: (Number(data.raw_sell_price) / 100000).toFixed(0),
					})
				} else {
					resolve(`*MaiCoin* TWD\n買: \`${(Number(data.raw_buy_price) / 100000).toFixed(0)}\`\n賣: \`${(Number(data.raw_sell_price) / 100000).toFixed(0)}\`\n`)
				}
			})
			.catch((error) => {
				console.log("Error in MaiCoin", error)
				if (plain) {
					resolve(null)
				} else {
					resolve(`*MaiCoin* ❌`)
				}
			})
	})
}
