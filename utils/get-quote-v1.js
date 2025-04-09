import axios from 'axios'

export async function getQuoteV1(data) {
  try {
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://superlink-server.coin98.tech/quote',
      headers: {
        'Host': 'superlink-server.coin98.tech',
        'Accept': 'application/json',
        'version': '15.10.0',
        'source': 'C98WLFININS',
        'os': 'ios',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        'User-Agent': 'Coin98Wallet/15.10.0 CFNetwork/897.15 Darwin/17.5.0 (iPhone; iOS 14.4.2; Scale/3.00)',
        'Connection': 'keep-alive',
        'isadapter': 'true',
        'Content-Type': 'application/json'
      },
      data
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
