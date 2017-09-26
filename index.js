const _ = require("lodash")
const axios = require("axios")
const quiche = require("quiche")
const moment = require("moment")
const Telegraf = require("telegraf")
const JsonDB = require("node-json-db")

const api = require("./api")
const config = require("./config")
const supportCurrencies = require("./supportCurrencies")

const db = new JsonDB("pools", true, true)
const bot = new Telegraf(config.botToken, { username: config.botUsername })

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

*礦池相關功能*
用於 CryptoNote 架設的礦池
/poolStats
查看礦池明細，需先使用 /setPool 設定礦池與錢包地址
/setPool \`<poolApi>\` \`<walletAddress>\`
設定礦池API和錢包地址 (再次使用會覆蓋之前的設定)，範例：
\`\`\`
/setPool https://monerohash.com/api/stats_address?address=445nbhVeHeKdGtpoztN6MVhczCARRa57EAY4PwRiqkJe1ATgBxvzMDES5eQ5m1XKXFZYoekc1n9EW1r7GiMrSHLbEeMuyDt&longpoll=false
\`\`\`
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
					detail += `${result.title}\n買: \`${result.ask}\`\n賣: \`${result.bid}\`\n${result.last ? `Last: \`${result.last}\`\n` : ""}`
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
	axios.get("https://www.bitoex.com/charts/price_history")
		.then((res) => {
			let { data } = res
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

	Promise.all(promises)
		.then((results) => {
			if (currency === "BTC") {
				const ntd = price * results[0].ask
				ctx.replyWithMarkdown(`\`${price}\` BTC => \`${ntd.toFixed(0)}\` NTD`)
			} else {
				const btc = price * results[0].last
				const ntd = btc * results[1].ask
				ctx.replyWithMarkdown(`\`${price}\` ${currency} => \`${btc}\` BTC => \`${ntd.toFixed(0)}\` NTD`)
			}
		})
		.catch((error) => {
			console.log(`exchange promise all error ${error.message}`)
		})
})

bot.command("/poolStats", (ctx) => {
	console.log(ctx.message.from.id, "call poolStats")
	try {
		const poolapi = db.getData(`/${ctx.message.from.id}`)
		api.poolStats(poolapi)
			.then((res) => {
				ctx.replyWithMarkdown(res)
			})
			.catch((err) => {
				ctx.reply("API 請求失敗")
				console.log(`poolapi request error ${err}`)
			})
	} catch (error) {
		ctx.replyWithMarkdown(`請先設定礦池，詳見 /help`)
	}
})

bot.command("/setPool", (ctx) => {
	const command = ctx.message.text.split(" ")
	let poolapi = command[1]
	if (poolapi && poolapi.includes("://") && poolapi.includes("stats_address?address=4")) {
		api.poolStats(poolapi)
			.then((res) => {
				const { username, id } = ctx.message.from
				const user = username ? username : id
				console.log(`${user} setpool ${poolapi}`)
				try {
					db.push(`/${ctx.message.from.id}`, poolapi)
					ctx.replyWithMarkdown(res)
					ctx.reply("礦池設定已儲存，可使用 /poolStats 察看礦池統計")
				} catch (error) {
					ctx.reply("礦池設定儲存失敗QQ")
				}
			})
			.catch((err) => {
				ctx.reply("請求失敗，礦池設定未儲存")
				console.log(`setpool poolapi request error ${err}`)
			})
	} else {
		ctx.reply("礦池API位址錯誤")
	}
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
