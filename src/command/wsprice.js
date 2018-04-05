import _ from "lodash"
import moment from "moment-timezone"
import binance from "node-binance-api"
import config from "../../config"
import bot from "../bot"

moment.tz("Asia/Taipei")
const updateTimeSeconds = config.wsPriceUpdateTime ? config.wsPriceUpdateTime : 10
const updateTime = config.wsPriceUpdateTime * 1000

let timer = null
let groups = {}	// { "group id": {chatId, symbols} }
let runningSymbols = []
let prices = {}


export default function (ctx) {
	ctx.getChatMember(ctx.from.id)
		.then((info) => {
			// 檢查權限
			if (info.status == "creator" | info.status == "administrator") {
				// parse commands
				const commands = ctx.message.text.split(" ")
				commands.shift()	// 移除第一個，剩下的才是 Symbol 或 stop 命令

				if (commands.length > 0) {
					// 分別處理 stop 命令或開始更新價格
					if (commands[0].toUpperCase() == "STOP") {
						stop(ctx)
						return
					} else {
						return start(ctx, commands)
					}
				} else {
					// 沒有命令或 Symbol
					ctx.replyWithMarkdown(`請提供交易對，例如：\n\`/wsprice BTCUSDT ETHUSDT BNBUSDT\`\n或是停止價格更新：\n\`/wsprice stop\``)
				}
			}
		})
		.catch((error) => {
			console.log(error)
		})
}

const start = (ctx, commands) => {
	return Promise.all([
		ctx.replyWithMarkdown(`* Price message *\nWaiting update...`),
		ctx.replyWithMarkdown(`* Status message *\nWaiting update...`),
		getAllPrice(),
	])
		.then((results) => {
			// 整理出 symbols
			let symbols = []
			_.each(commands, (command) => {
				if (command == "") {
					return
				}
				let symbol = command.toUpperCase()	// 轉為大寫
				symbol = symbol.endsWith("USD") ? symbol + "T" : symbol	// 修正 USD -> USDT
				symbol = symbol.startsWith("IOT") && !symbol.startsWith("IOTA") ? symbol.replace("IOT", "IOTA") : symbol	// IOT -> IOTA
				if (results[2][symbol]) {
					symbols.push(symbol)
					prices[symbol] = {
						update: moment().format("X"),
						price: results[2][symbol],
					}
				} else {
					ctx.replyWithMarkdown(`${symbol} not support.`)
				}
			})

			// 如果沒有設定交易對，使用 BTCUSDT
			if (symbols.length == 0) {
				symbols = ["BTCUSDT"]
				prices["BTCUSDT"] = {
					update: moment().format("X"),
					price: results[2]["BTCUSDT"],
				}
			}

			// 設定 group
			groups[ctx.chat.id] = _.merge(groups[ctx.chat.id], {
				priceMessageId: results[0].message_id,
				statusMessageId: results[1].message_id,
				start: true,
				symbols,
			})

			// 設定 Socket
			manageSocket()

			// Pin 訊息
			bot.telegram.pinChatMessage(ctx.chat.id, results[0].message_id, { disable_notification: true })
				.catch((error) => {
					console.log(error.message)
				})

			// 先更新一次訊息顯示現在價格
			updateMessage()

			// 如果沒有 timer 在跑 updateMessage 設定一個
			if (timer == null) {
				timer = setInterval(updateMessage, updateTime)
			}
		})
}

const stop = (ctx) => {
	// 如果原本有在跑的話才要處裡
	if (groups[ctx.chat.id] && groups[ctx.chat.id].start) {
		// 關閉 group 的 start 狀態
		groups[ctx.chat.id] = _.merge(groups[ctx.chat.id], {
			start: false,
		})

		// 更新 Pin 訊息
		bot.telegram.editMessageText(ctx.chat.id, groups[ctx.chat.id].priceMessageId, null, "價格停止更新", {
			parse_mode: "Markdown",
		})
		// 拿掉 Pin 的訊息
		bot.telegram.unpinChatMessage(ctx.chat.id)
			.catch((error) => {
				console.log(error.message)
			})
	}
}

// 回傳 symbol: price object
function getAllPrice() {
	return new Promise((resolve, reject) => {
		binance.prices((error, ticker) => {
			if (error != null) {
				reject(error)
			} else {
				resolve(ticker)
			}
		})
	})
}

// 整理 socket
const manageSocket = () => {
	// 抓出每個 group 使用的 symbols
	let allGroupSymbols = []
	_.each(groups, (group) => {
		if (group.start) {
			allGroupSymbols = allGroupSymbols.concat(group.symbols)
		}
	})

	// 抓出不重複的 symbol array
	const symbols = _.sortedUniq(allGroupSymbols)

	// 找出新的 symbols
	const symbolsToStart = _.difference(symbols, runningSymbols)
	_.each(symbolsToStart, (symbol) => {
		startSocket(symbol)
		console.log(`start ${symbol}`)
	})

	// 把現在的 symbols 設為 running
	runningSymbols = symbols
	if (runningSymbols.length == 0) {
		// 停止 timer
		clearInterval(timer)
		timer = null
	}
}

const startSocket = (symbol) => {
	binance.websockets.chart(symbol, "1m", (symbol, interval, chart) => {
		let tick = binance.last(chart)
		const last = chart[tick].close

		// 更新到 prices
		prices[symbol] = {
			update: moment().format("X"),
			price: last,
		}
	})
}

const updateMessage = () => {
	// 更新每個 group 的訊息
	_.each(groups, (group, key) => {
		if (!group.start) {
			// 沒有 start 的群組就不管了
			return
		}
		// 設定訊息
		let priceMessage = ``
		let statusMessage = `Message update at: \`${moment().format("M/D HH:mm:ss")}\`\n`

		// 加上每個 Symbol 的訊息
		_.each(group.symbols, (symbol) => {
			if (priceMessage != "") {
				// 處理分隔線和換行
				priceMessage += ` |\n`
				statusMessage += `\n`
			}
			const displaySymbol = symbol.replace("USDT", "")
			const price = parseFloat(prices[symbol].price)
			const factoryDigital = price > 1000 ? 1 : 2
			priceMessage += `${displaySymbol} \`${price.toFixed(factoryDigital)}\``
			statusMessage += `${displaySymbol}: \`${moment(prices[symbol].update, "X").format("M/D HH:mm:ss")}\``
		})

		// 更新價格
		bot.telegram.editMessageText(key, group.priceMessageId, null, priceMessage, {
			parse_mode: "Markdown",
		}).then(() => {
			// 更新狀態
			bot.telegram.editMessageText(key, group.statusMessageId, null, statusMessage, {
				parse_mode: "Markdown",
			})
		})
			.catch((error) => {
				console.log(error)
			})
	})
}
