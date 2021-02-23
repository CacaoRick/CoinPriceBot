import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

const main = low(new FileSync('data/db.json'))
const fundingFee = low(new FileSync('data/funding-fee.json'))

export default {
  main,
  fundingFee,
}
