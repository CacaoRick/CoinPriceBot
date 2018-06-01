import _ from "lodash"
import moment from "moment-timezone"
import Binance from "binance-api-node"
import config from "../../config"
import bot from "../bot"
import db from "../db"

let binance = Binance()

// 已經初始化完成
let init = false
// 更新訊息的 timer
let timer = null
// 更新訊息的間隔
const updateTime = config.wsPriceUpdateTime * 1000
// 價格多久沒更新視為 Socket Error
let timeoutDuration = moment.duration(config.wsPriceErrorTime, "seconds")
// 重試時間 (moment)
let retryTime = null
// 下次重試要經過多久的時間，預設 2 分鐘
let defaultRetryWaitMinutesDuration = moment.duration(2, "minutes")
let nextRetryWaitMinutesDuration = defaultRetryWaitMinutesDuration

/**
 * @typedef {Object} Group
 * @property {string} priceMessageId
 * @property {string} statusMessageId
 * @property {string[]} symbols
 */

/**
 * @typedef {Object.<string, Group>} Groups - 以 group id 為 key
 */

/** @type {Groups} */
let groups = {}

/**
 * 停止 web socket
 * @name StopSocket
 * @function
 */

/**
 * @typedef {Object} Socket
 * @property {StopSocket} stop - 停止 web socket 的 function
 * @property {string} update - 更新時間
 * @property {number} price - 價格
 */

/**
 * @typedef {Object.<string, Socket>} Sockets - 以 symbol 為 key
 */

/** @type {Sockets} */
let sockets = {}

// Parse command, Permission check
export default function (ctx) {
	ctx.getChatMember(ctx.from.id)
		.then((info) => {
			// 檢查權限，如果是我、群主或管理員才可以用
			if (
				info === config.admin ||
				info.status === "creator" ||
				info.status === "administrator"
			) {
				// parse commands
				const commands = ctx.message.text.split(" ")
				commands.shift()	// 移除第一個，剩下的才是 Symbol 或 stop 命令

				if (commands.length > 0) {
					// 分別處理 stop 命令或開始更新價格
					if (commands[0].toUpperCase() === "STOP") {
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
			console.error(error)
		})
}

// Start
const start = (ctx, commands) => {
	return Promise.all([
		ctx.replyWithMarkdown(`* Price message *\nWaiting update...`),
		ctx.replyWithMarkdown(`* Status message *\nWaiting update...`),
		binance.prices(),
	])
		.then((results) => {
			// 整理出 symbols
			let symbols = []
			_.each(commands, (command) => {
				if (command === "") {
					return
				}
				// 轉為大寫
				let symbol = command.toUpperCase()
				// 修正 USD -> USDT
				symbol = symbol.endsWith("USD") ? symbol + "T" : symbol
				// 修正沒加 USDT
				symbol = !symbol.endsWith("USDT") ? symbol + "USDT" : symbol
				// 修正 IOT -> IOTA
				symbol = symbol.startsWith("IOT") && !symbol.startsWith("IOTA") ? symbol.replace("IOT", "IOTA") : symbol

				// 檢查 Symbol 支援
				if (results[2][symbol]) {
					symbols.push(symbol)
				} else {
					ctx.replyWithMarkdown(`${symbol} not support.`)
				}
			})

			// 如果沒有設定交易對，使用 BTCUSDT
			if (symbols.length === 0) {
				symbols = ["BTCUSDT"]
			}

			// 設定 group
			groups[ctx.chat.id] = _.merge(groups[ctx.chat.id], {
				priceMessageId: results[0].message_id,
				statusMessageId: results[1].message_id,
				symbols,
			})
			console.log("start wsprice: ", symbols)

			// 更新到 db.json
			db.set(`wsGroups.${ctx.chat.id}`, groups[ctx.chat.id])
				.write()

			// 設定 Socket
			manageSocket()

			// Pin 訊息
			bot.telegram.pinChatMessage(ctx.chat.id, results[0].message_id, { disable_notification: true })
				.catch((error) => {
					console.log(error.message)
				})
		})
}

// Stop
const stop = (ctx) => {
	// 原本有在 groups 裡面才要處裡
	if (groups[ctx.chat.id]) {
		// 更新 Pin 訊息
		bot.telegram.editMessageText(ctx.chat.id, groups[ctx.chat.id].priceMessageId, null, "價格停止更新", {
			parse_mode: "Markdown",
		})

		// 從 groups 移除
		delete groups[ctx.chat.id]

		// 從 db.json 移除
		db.unset(`wsGroups.${ctx.chat.id}`, groups[ctx.chat.id])
			.write()

		// 設定 Socket
		manageSocket()
	}
}

// 整理 socket
const manageSocket = () => {
	console.log("manageSocket")
	// 抓出每個 group 使用的 symbols
	let allGroupSymbols = []
	_.each(groups, (group) => {
		allGroupSymbols = allGroupSymbols.concat(group.symbols)
	})

	// 抓出不重複的 symbol array
	const symbols = _.sortedUniq(allGroupSymbols)

	// 抓出執行中的 symbols
	let runningSymbols = _.keys(sockets)

	// 找出新的 symbols
	const symbolsToStart = _.difference(symbols, runningSymbols)
	// 開始這些 symbols
	_.each(symbolsToStart, (symbol) => {
		startWebSocket(symbol)
		console.log(`start ${symbol}`)
	})

	// 找出要停止的 symbols
	const symbolsToStop = _.difference(runningSymbols, symbols)
	// 停止這些 symbols
	_.each(symbolsToStop, (symbol) => {
		stopWebSocket(symbol)
	})

	// 如果沒有 updateMessage timer 在跑，且 socket 有在動， 設定一個
	if (timer == null && _.keys(sockets).length !== 0) {
		timer = setInterval(updateMessage, updateTime)
	}
}

const startWebSocket = (symbol) => {
	// 開始抓資料，並將停止 socket 用的 stop function 存起來
	sockets[symbol] = {
		stop: binance.ws.candles(
			symbol,
			"1m",
			(candle) => {
				if (sockets[symbol]) {
					// 更新到 symbols
					sockets[symbol].update = moment().format("X")
					sockets[symbol].price = candle.close
				}
			}
		),
	}
}

const stopWebSocket = (symbol) => {
	// 停止 socket
	if (sockets[symbol].stop) {
		sockets[symbol].stop()
	}

	// 從 sockets 移除 symbol
	delete sockets[symbol]
}

const updateMessage = () => {
	// 判斷是否在等 retry
	if (retryTime && moment().isBefore(retryTime)) {
		// 跳過，不做更新
		return
	} else {
		// 移除 retryTime
		retryTime = null

		if (_.keys(sockets).length === 0) {
			// 如果沒有東西在跑，重新啟動 socket
			manageSocket()
		}
	}

	// 現在時間
	const timout = moment().subtract(timeoutDuration)
	// 判斷 Socket 正常更新
	_.each(sockets, (socket) => {
		if (moment(socket.update, "X").isBefore(timout) && init) {
			// 停止所有 Socket，等待重試
			errorStopSocket()
			console.log("Web socket update timeout")

			// 終止更新
			return false
		}
	})

	// socket 全部有抓到，timeoutDuration 回復預設值
	if (_.keys(sockets).length > 0) {
		init = true
		nextRetryWaitMinutesDuration = defaultRetryWaitMinutesDuration
	}

	// 更新每個 group
	_.each(groups, (group, groupId) => {

		// 設定訊息
		let priceMessage = ``
		let statusMessage = `Message update at: \`${moment().tz("Asia/Taipei").format("M/D HH:mm:ss")}\`\n`

		// 加上每個 symbol 的訊息
		_.each(group.symbols, (symbol) => {
			// 處理分隔線和換行
			if (priceMessage !== "") {
				priceMessage += ` |\n`
				statusMessage += `\n`
			}
			// 取出資料
			const data = sockets[symbol]
			if (!data || !data.price) {
				// 還沒抓到資料就先跳過
				return false
			}

			// 去掉 USDT
			const displaySymbol = symbol.replace("USDT", "")
			// 轉為 number
			const price = parseFloat(data.price)
			// 計算小數後位數
			const factoryDigital = 5 - price.toFixed(0).length
			// 加到 priceMessage
			priceMessage += `${displaySymbol} \`${price.toFixed(factoryDigital)}\``
			// 加到 statusMessage
			statusMessage += `${displaySymbol} \`${moment(data.update, "X").tz("Asia/Taipei").format("M/D HH:mm:ss")}\``
		})
		// 更新價格
		editMessageWithRetry(groupId, group.priceMessageId, priceMessage, 0)
		// 更新狀態
		editMessageWithRetry(groupId, group.statusMessageId, statusMessage, 0)
	})
}

const errorStopSocket = () => {
	console.log("errorStopSocket")
	// 設定重試時間
	retryTime = moment().add(nextRetryWaitMinutesDuration)

	// 通知管理者
	bot.telegram.sendMessage(
		config.admin,
		`Web Socket 異常，將於 \`${retryTime.tz("Asia/Taipei").format("M/D HH:mm:ss")}\` 重試（ \`${retryTime.fromNow()}\` ）`,
		{ parse_mode: "Markdown" }
	)

	// 計算如果下一次還是失敗要等幾分鐘重試，時間變兩倍，但最久等 60 分鐘
	const nextRetryWaitMinutes = nextRetryWaitMinutesDuration.minutes() * 2
	nextRetryWaitMinutesDuration = moment.duration(nextRetryWaitMinutes > 60 ? 60 : nextRetryWaitMinutes, "minutes")
	// 停止所有 socket
	console.log(sockets)
	_.each(sockets, (socket, symbol) => {
		stopWebSocket(symbol)
	})
	// 通知各群組價格暫停更新等待重試
	_.each(groups, (group, groupId) => {
		bot.telegram.editMessageText(
			groupId,
			group.priceMessageId,
			null,
			`[API 異常] 暫停更新中，將於 \`${retryTime.tz("Asia/Taipei").format("M/D HH:mm:ss")}\` 重試`,
			{ parse_mode: "Markdown" }
		)
			.catch((error) => {
				console.error("Edit priceMessage error", error.description)
			})
	})
	// 重建 binance api
	binance = Binance()
}

// editMessage 會重試 2 次
function editMessageWithRetry(chatId, messageId, message, retryCount) {
	if (retryCount < 2) {
		bot.telegram.editMessageText(chatId, messageId, null, message, { parse_mode: "Markdown" })
			.catch((error) => {
				console.error(`Edit message error, retry: ${retryCount + 1}`, error.description)
				editMessageWithRetry(chatId, messageId, message, retryCount + 1)
			})
	}
}

// 從 db 讀出之前的設定
groups = db.get("wsGroups")
	.value()

manageSocket()
