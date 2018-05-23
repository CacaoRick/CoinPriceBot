// https://www.bitoex.com/api/v1/get_rate
// 需用 cloudscraper
// {"buy":493180,"sell":418248,"timestamp":1514106458}

import cloudscraper from "cloudscraper"

export default function (plain) {
	return new Promise((resolve) => {
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
					const buy = data.buy.toFixed(0)
					const sell = data.sell.toFixed(0)
					const avg = ((data.buy + data.sell) / 2).toFixed(0)
					if (plain) {
						resolve({
							buy,
							sell,
							avg,
						})
					} else {
						resolve(`*BitoEx* TWD\n買: \`${buy}\`\n賣: \`${sell}\`\n均: \`${avg}\`\n`)
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
