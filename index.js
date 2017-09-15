const _ = require("lodash")
const axios = require("axios")
const quiche = require("quiche")
const moment = require("moment")
const TelegramBot = require("node-telegram-bot-api")
const config = require("./config")

const bot = new TelegramBot(config.botToken, { polling: true })

bot.onText(/\/price/, (message) => {
	axios.get("https://www.bitoex.com/api/v1/get_rate")
		.then((res) => {
			bot.sendMessage(
				message.chat.id,
				`*BitoEx* (NTD)\n買: \`${res.data.buy}\`\n賣: \`${res.data.sell}\``,
				{ parse_mode: "Markdown" }
			)
		})
})

bot.onText(/\/history/, (message) => {
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
			bot.sendPhoto(message.chat.id, imageUrl)
		})
})
