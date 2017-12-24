// https://www.bitoex.com/api/v1/get_rate
// 需用 cloudscraper
// {"buy":493180,"sell":418248,"timestamp":1514106458}

import axios from "axios"

export default function (currncy) {
  return axios.get(`https://www.bitoex.com/api/v1/get_rate`)
    .then((res) => {
      const { data } = res
      return `*BitoEx* TWD\n買: \`${data.buy.toFixed(0)}\`\n賣: \`${data.sell.toFixed(0)}\`\n`
    })
    .catch((error) => {
      console.log("Error in bitoex", error)
      return ""
    })
}
