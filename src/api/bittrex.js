// 更新支援 market
// https://bittrex.com/api/v1.1/public/getmarkets
// map(results, (result) => {return result.MarketName})
// [BTC-LTC, BTC-DOGE,...]
// 或是抓 MarketName.BaseCurrency
// [BTC, ETH, USDT...]

// 抓價格
// https://bittrex.com/api/v1.1/public/getticker?market=${market}
// base要在前面 例如 BTC-LTC, USDT-BTC 不分大小寫
// 成功
// {"success":true,"message":"","result":{"Bid":0.01924700,"Ask":0.01924704,"Last":0.01924704}}
// 失敗
// {"success":false,"message":"INVALID_MARKET","result":null}
