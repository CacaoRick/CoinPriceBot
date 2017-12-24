// https://www.okex.com/api/v1/ticker.do?symbol=${symbol}
// symbol
// ltc_btc eth_btc etc_btc bch_btc btc_usdt eth_usdt
// ltc_usdt etc_usdt bch_usdt etc_eth bt1_btc
// bt2_btc btg_btc qtum_btc hsr_btc neo_btc
// gas_btc qtum_usdt hsr_usdt neo_usdt gas_usdt
// 大小寫不拘，但 USD 記得用 USDT
// 成功
// {
//   "date": "1514122446",
//   "ticker": {
//     "high": "14754.3799",
//     "vol": "21790.5759",
//     "last": "12542.2500",
//     "low": "11600.0100",
//     "buy": "12542.2028",
//     "sell": "12542.2029",
//   }
// }
// 失敗
// {"error_code":1007}

import axios from "axios"

export default function (currency, base) {
	return new Promise((resolve, reject) => {
		base = base == null || base == "USD" ? "USDT" : base
		return axios.get(`https://www.okex.com/api/v1/ticker.do?symbol=${currency}_${base}`)
			.then((res) => {
				if (res.data && res.data.ticker) {
					const { ticker } = res.data
					let price = base == "USDT" ? Number(ticker.last).toFixed(2) : ticker.last
					resolve(`*OkEx* \`${price}\` ${base}\n`)
				} else {
					resolve("")
				}
			})
			.catch((error) => {
				console.log("Error in OkEx", error)
				resolve(`*OkEx* ❌`)
			})
	})
}
