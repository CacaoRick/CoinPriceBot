// https://www.bitoex.com/api/v1/get_rate
// 需用 cloudscraper
// {"buy":493180,"sell":418248,"timestamp":1514106458}

import cloudscraper from "cloudscraper"

export default function (plain) {
	return new Promise((resolve, reject) => {
		cloudscraper.get("https://www.bitoex.com/api/v1/get_rate", (error, response, body) => {
			if (error) {
				console.log("Error in BitoEx", error)
				if (plain) {
					resolve(null)
				} else {
					resolve(`*BitoEx* ❌\n`)
				}
			} else if (body) {
				try {
					const data = JSON.parse(body)
					if (plain) {
						resolve({
							buy: data.buy.toFixed(0),
							sell: data.sell.toFixed(0),
						})
					} else {
						resolve(`*BitoEx* TWD\n買: \`${data.buy.toFixed(0)}\`\n賣: \`${data.sell.toFixed(0)}\`\n`)
					}
				} catch (error) {
					resolve(`*BitoEx* ❌\n`)
				}
			} else if (plain) {
				resolve(null)
			} else {
				resolve("")
			}
		})
	})
}
