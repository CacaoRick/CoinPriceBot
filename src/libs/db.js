import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

const main = low(new FileSync('db.json'))
const fundingFee = low(new FileSync('funding-fee.json'))

export default {
  main,
  fundingFee,
}
