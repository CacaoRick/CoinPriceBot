import axios from 'axios'

export async function getGas () {
  const [{ data: { data: gasnowData } }, { data: ethgasAPIData }] = await Promise.all([
    axios.get('https://www.gasnow.org/api/v3/gas/price'),
    axios.get('https://ethgasstation.info/api/ethgasAPI.json'),
  ])

  return { gasnowData, ethgasAPIData }
}

export default {
  getGas,
}
