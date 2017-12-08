const _ = require("lodash")
const quiche = require("quiche")
const moment = require("moment")
const Telegraf = require("telegraf")
const cloudscraper = require("cloudscraper")

const api = require("./api")
const config = require("./config")
const supportCurrencies = require("./supportCurrencies")

const bot = new Telegraf(config.botToken, { username: config.botUsername })

bot.catch((error) => {
	console.log("error", error.error, error.message)
})

bot.on("sticker", (ctx) => {
	console.log(ctx.message.sticker.file_id)
})

bot.command("/help", (ctx) => {
	switch (ctx.message.text.split(" ")[1]) {
		default: {
			ctx.replyWithMarkdown(
				`*價格相關功能*
/price \`[btc|xmr|eth|...]\`
察看目前的價錢 (BitoEX, Bitfinex, Bittrex)
/history \`[year|month]\`
查看歷史價格 (目前只有 BitoEX)
/exchange \`<0.1>\` \`[btc|xmr|eth|...]\`
計算可以換成多少台幣
`
			)
			break
		}
	}
})


bot.command("/price", (ctx) => {
	// 沒給幣別的話預設 btc
	const command = ctx.message.text.split(" ")
	const currency = command[1] ? command[1].toUpperCase() : "BTC"

	let promises = []

	if (_.includes(supportCurrencies.bitoex, currency)) {
		promises.push(api.bitoex())
	}

	if (_.includes(supportCurrencies.maicoin, currency)) {
		promises.push(api.maicoin())
	}

	if (_.includes(supportCurrencies.bitfinex, currency)) {
		promises.push(api.bitfinex(currency))
	}

	if (_.includes(supportCurrencies.bittrex, currency)) {
		promises.push(api.bittrex(currency))
	}

	Promise.all(promises)
		.then((results) => {
			if (results) {
				let detail = ""
				_.each(results, (result) => {
					if (result != null) {
						detail += `${result.title}\n買: \`${result.ask}\`\n賣: \`${result.bid}\`\n${result.last ? `Last: \`${result.last}\`\n` : ""}`
					}
				})
				ctx.replyWithMarkdown(detail)
			} else {
				ctx.replyWithMarkdown("不支援該幣種")
			}
		})
		.catch((error) => {
			console.log(error)
		})
})

bot.command("/history", (ctx) => {
	const params = ctx.message.text.split(" ")[1] ? ctx.message.text.split(" ")[1].toLowerCase() : null
	cloudscraper.get("https://www.bitoex.com/charts/price_history", (error, response, body) => {
		if (error) {
			console.log("/history error", error)
			ctx.replyWithSticker(`CAADBQADpAUAAhvjNwj5JCqrY5MD6gI`)
		} else if (body) {
			let data = JSON.parse(body)
			const chart = quiche("line")
			chart.setTitle("BitoEX history (NTD)")
			chart.setSparklines()
			chart.setAutoScaling()
			chart.setLegendHidden()
			let prices, timeline
			switch (params) {
				case "year":
				case "years":
				case "y":
				case "年": {
					// 價格
					prices = _.map(data, "price")
					// 月份
					let skipFirstMonth = true
					let lastMonth = 0
					timeline = _.map(data, (obj) => {
						const month = moment(obj.date, "x").format("M")
						if (month !== lastMonth) {
							lastMonth = month
							if (skipFirstMonth) {
								skipFirstMonth = false
								return ""
							} else {
								return lastMonth
							}
						} else {
							return ""
						}
					})
					break
				}
				case "month":
				case "months":
				case "m":
				case "月":
				default: {
					// 取 30 天
					data = _.takeRight(data, 30)
					// 價格
					prices = _.map(data, "price")
					// 範圍
					const range = getRange(prices)
					chart.setAxisRange("y", range.start, range.end, range.step)
					// 日期
					timeline = _.map(data, (obj) => {
						const date = moment(obj.date, "x").format("D")
						if (Number(date) % 5 === 0) {
							return date
						} else {
							return ""
						}
					})
					break
				}
			}
			chart.addData(prices, null)
			chart.addAxisLabels("x", timeline)

			// 轉成圖片連結
			const imageUrl = chart.getUrl(true)
			ctx.replyWithPhoto(imageUrl)
		} else {
			ctx.replyWithSticker(`CAADBQADpAUAAhvjNwj5JCqrY5MD6gI`)
		}
	})
})

bot.command("/exchange", (ctx) => {
	const command = ctx.message.text.split(" ")
	if (command.length != 3) {
		ctx.replyWithMarkdown("參數錯誤，範例: `/exchange 0.5 xmr`")
		return
	}
	const price = Number(command[1])
	if (!isFinite(price)) {
		ctx.replyWithSticker("CAADBQADKwMAAonzDAUWfMQlaopeRwI")
		return
	}
	const currency = command[2] ? command[2].toUpperCase() : "BTC"

	const promises = []
	if (_.includes(supportCurrencies.bittrex, currency)) {
		// 先轉 BTC
		promises.push(api.bittrex(currency))
	} else if (currency !== "BTC") {
		ctx.replyWithMarkdown("不支援該幣種")
		return
	}
	promises.push(api.bitoex())
	promises.push(api.maicoin())

	Promise.all(promises)
		.then((results) => {
			if (currency === "BTC") {
				if (results[0] != null && results[1] != null) {
					const bitoexPrice = results[0].bid
					const maicoinPrice = results[1].bid
					let message = `\`${price}\` BTC => \``
					if (bitoexPrice > maicoinPrice) {
						message += `${(price * bitoexPrice).toFixed(0)}\` NTD (by BitoEx)`
					} else {
						message += `${(price * maicoinPrice).toFixed(0)}\` NTD (by MaiCoin)`
					}
					ctx.replyWithMarkdown(message)
				} else {
					ctx.replyWithSticker("CAADBQADpAUAAhvjNwj5JCqrY5MD6gI")
					ctx.replyWithMarkdown(`API 怪怪的，不是我的錯`)
				}
			} else {
				if (results[0] != null && results[1] != null && results[2] != null) {

					const btc = price * results[0].last
					const bitoexPrice = results[1].bid
					const maicoinPrice = results[2].bid
					let message = `\`${price}\` ${currency} => \`${btc.toFixed(8)}\` BTC => \``
					if (bitoexPrice > maicoinPrice) {
						message += `${(btc * bitoexPrice).toFixed(0)}\` NTD (by BitoEx)`
					} else {
						message += `${(btc * maicoinPrice).toFixed(0)}\` NTD (by MaiCoin)`
					}
					ctx.replyWithMarkdown(message)
				} else {
					ctx.replyWithSticker("CAADBQADpAUAAhvjNwj5JCqrY5MD6gI")
					ctx.replyWithMarkdown(`API 怪怪的，不是我的錯`)
				}
			}
		})
		.catch((error) => {
			console.log(`exchange promise all error ${error.message}`)
		})
})

bot.startPolling()
console.log("bot start polling.")

function getRange(array) {
	const sorted = _.sortBy(array)
	const min = sorted[0]
	const max = _.last(sorted)
	const step = Math.pow(10, String(max - min).length - 1)
	return {
		start: Math.floor(min / step) * step,
		end: Math.ceil(max / step) * step,
		step,
	}
}
