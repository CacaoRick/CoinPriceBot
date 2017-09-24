const _ = require("lodash")
const axios = require("axios")
const quiche = require("quiche")
const moment = require("moment")
const Telegraf = require("telegraf")
const JsonDB = require("node-json-db");
const config = require("./config")
const api = require("./api")
const db = new JsonDB("xmr-pool")

const bot = new Telegraf(config.botToken)

bot.command("/help", (ctx) => {
	switch (ctx.update.message.text.split(" ")[1]) {
		default: {
			ctx.replyWithMarkdown(`/price btc|xmr|...\n/history y|m`)
			break
		}
	}
})

bot.command("/price", (ctx) => {
	// 沒給幣別的話預設 btc
	const command = ctx.update.message.text.split(" ")
	const currency = command[1] ? command[1].toUpperCase() : "BTC"

	let promises = []

	if (_.includes(bitoexCurrencies, currency)) {
		promises.push(api.bitoex())
	}

	if (_.includes(bitfinexCurrencies, currency)) {
		promises.push(api.bitfinex(currency))
	}

	if (_.includes(bittrexCurrencies, currency)) {
		promises.push(api.bittrex(currency))
	}

	Promise.all(promises)
		.then((results) => {
			console.log(results)
			if (results) {
				let detail = ""
				_.each(results, (result) => {
					detail += result
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

const bitoexCurrencies = [
	"BTC",
]
const bitfinexCurrencies = [
	"BTC", "LTC", "ETH", "ETC", "RRT",
	"ZEC", "XMR", "DSH", "BCC", "BCU",
	"XRP", "IOT", "EOS", "SAN", "OMG",
	"BCH", "NEO", "ETP",
]
const bittrexCurrencies = [
	"LTC", "DOGE", "VTC", "PPC", "FTC",
	"RDD", "NXT", "DASH", "POT", "BLK",
	"EMC2", "XMY", "AUR", "EFL", "GLD",
	"SLR", "PTC", "GRS", "NLG", "RBY",
	"XWC", "MONA", "THC", "ENRG", "ERC",
	"VRC", "CURE", "XMR", "CLOAK", "START",
	"KORE", "XDN", "TRUST", "NAV", "XST",
	"BTCD", "VIA", "UNO", "PINK", "IOC",
	"CANN", "SYS", "NEOS", "DGB", "BURST",
	"EXCL", "SWIFT", "DOPE", "BLOCK", "ABY",
	"BYC", "XMG", "BLITZ", "BAY", "BTS",
	"FAIR", "SPR", "VTR", "XRP", "GAME",
	"COVAL", "NXS", "XCP", "BITB", "GEO",
	"FLDC", "GRC", "FLO", "NBT", "MUE",
	"XEM", "CLAM", "DMD", "GAM", "SPHR",
	"OK", "SNRG", "PKB", "CPC", "AEON",
	"ETH", "GCR", "TX", "BCY", "EXP",
	"INFX", "OMNI", "AMP", "AGRS", "XLM",
	"BTA", /*"BTC"*/, "CLUB", "VOX", "EMC",
	"FCT", "MAID", "EGC", "SLS", "RADS",
	"DCR", "SAFEX", "BSD", "XVG", "PIVX",
	"XVC", "MEME", "STEEM", "2GIVE", "LSK",
	"PDC", "BRK", "DGD", "DGD", "WAVES",
	"RISE", "LBC", "SBD", "BRX", "DRACO",
	"ETC", "ETC", "STRAT", "UNB", "SYNX",
	"TRIG", "EBST", "VRM", "SEQ", "XAUR",
	"SNGLS", "REP", "SHIFT", "ARDR", "XZC",
	"NEO", "ZEC", "ZCL", "IOP", "DAR",
	"GOLOS", "UBQ", "KMD", "GBG", "SIB",
	"ION", "LMC", "QWARK", "CRW", "SWT",
	"TIME", "MLN", "ARK", "DYN", "TKS",
	"MUSIC", "DTB", "INCNT", "GBYTE", "GNT",
	"NXC", "EDG", "LGD", "TRST", "GNT",
	"REP", "ETH", "WINGS", "WINGS", "RLC",
	"GNO", "GUP", "LUN", "GUP", "RLC",
	"LUN", "SNGLS", "GNO", "APX", "TKN",
	"TKN", "HMQ", "HMQ", "ANT", "TRST",
	"ANT", "SC", "BAT", "BAT", "ZEN",
	"1ST", "QRL", "1ST", "QRL", "CRB",
	"CRB", "LGD", "PTOY", "PTOY", "MYST",
	"MYST", "CFI", "CFI", "BNT", "BNT",
	"NMR", "NMR", "TIME", "LTC", "XRP",
	"SNT", "SNT", "DCT", "XEL", "MCO",
	"MCO", "ADT", "ADT", "FUN", "FUN",
	"PAY", "PAY", "MTL", "MTL", "STORJ",
	"STORJ", "ADX", "ADX", "DASH", "SC",
	"ZEC", "ZEC", "LTC", "ETC", "XRP",
	"OMG", "OMG", "CVC", "CVC", "PART",
	"QTUM", "QTUM", "XMR", "XEM", "XLM",
	"NEO", "XMR", "DASH", "BCC", "BCC",
	"BCC", "NEO", "WAVES", "STRAT", "DGB",
	"FCT", "BTS", "OMG",
]
