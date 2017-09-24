const _ = require("lodash")
const axios = require("axios")
const quiche = require("quiche")
const moment = require("moment")
const Telegraf = require("telegraf")
const config = require("./config")

const bot = new Telegraf(config.botToken)

bot.command("/help", (ctx) => {
	switch (ctx.update.message.text.split(" ")[1]) {
		default: {
			ctx.replyWithMarkdown(`/price`)
			break
		}
	}
})

bot.command("/price", (ctx) => {
	axios.get("https://www.bitoex.com/api/v1/get_rate")
		.then((res) => {
			ctx.replyWithMarkdown(`*BitoEx* (NTD)\n買: \`${res.data.buy}\`\n賣: \`${res.data.sell}\``)
		})
})

bot.command("/history", (ctx) => {
	const params = ctx.update.message.text.split(" ")[1] ? ctx.update.message.text.split(" ")[1].toLowerCase() : null
	axios.get("https://www.bitoex.com/charts/price_history")
		.then((res) => {
			let { data } = res
			const chart = quiche("line")
			chart.setTitle("BitoEx history (NTD)")
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

bot.startPolling()

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
