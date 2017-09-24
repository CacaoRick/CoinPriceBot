const _ = require("lodash")
const axios = require("axios")
const quiche = require("quiche")
const moment = require("moment")
const Telegraf = require("telegraf")
const config = require("./config")

const bot = new Telegraf(config.botToken)

bot.command("/price", (ctx) => {
	axios.get("https://www.bitoex.com/api/v1/get_rate")
		.then((res) => {
			ctx.replyWithMarkdown(`*BitoEx* (NTD)\n買: \`${res.data.buy}\`\n賣: \`${res.data.sell}\``)
		})
})

bot.command("/history", (ctx) => {
	axios.get("https://www.bitoex.com/charts/price_history")
		.then((res) => {
			const { data } = res
			let month = 0
			const date = _.map(data, (obj) => {
				let newMonth = moment(obj.date, "x").format("M")
				if (newMonth != month) {
					month = newMonth
					return month
				} else {
					return ""
				}
			})
			const price = _.map(data, "price")

			const chart = quiche("line")
			chart.setTitle("BitoEx history (NTD)")
			chart.addData(price, null)
			chart.addAxisLabels("x", date)
			chart.setSparklines()
			chart.setAutoScaling()
			chart.setLegendHidden()

			const imageUrl = chart.getUrl(true)
			ctx.replyWithPhoto(imageUrl)
		})
})

bot.startPolling()
