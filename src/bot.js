import Telegraf from "telegraf"
import config from "../config"

export default new Telegraf(config.botToken, { username: config.botUsername })
