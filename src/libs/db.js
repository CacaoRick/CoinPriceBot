import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

const config = low(new FileSync('config/config.json'))
const main = low(new FileSync('db.json'))

export default {
  config,
  main,
}
