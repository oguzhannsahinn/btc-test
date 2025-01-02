const Binance = require('node-binance-api');
require('dotenv').config();

// Binance yapılandırması
const binance = new Binance().options({
    APIKEY: process.env.BINANCE_API_KEY,
    APISECRET: process.env.BINANCE_API_SECRET,
    useServerTime: true,
    recvWindow: 60000,
    family: 4  // IPv4'ü zorla
});

// SMA hesaplama fonksiyonu
const calculateSMA = (data, period) => {
    return data.slice(-period).reduce((sum, price) => sum + price, 0) / period;
};

// Log formatı için timestamp oluşturma
const getTimestamp = () => {
    return new Date().toISOString();
};

// Ana trading fonksiyonu
async function startTrading() {
    const symbol = 'BTCUSDT';
    const interval = '15m';
    let lastAction = 'WAIT';

    while (true) {
        try {
            // Mum verilerini al
            const candles = await binance.candlesticks(symbol, interval);
            const prices = candles.map(candle => parseFloat(candle[4])); // Kapanış fiyatları

            // SMA değerlerini hesapla
            const sma3 = calculateSMA(prices, 3);
            const sma9 = calculateSMA(prices, 9);
            const currentPrice = prices[prices.length - 1];

            // Alım-satım mantığı
            if (sma3 > sma9 && lastAction !== 'BUY') {
                // Alış sinyali
                console.log(JSON.stringify({
                    timestamp: getTimestamp(),
                    action: 'BUY',
                    price: currentPrice,
                    sma3: sma3,
                    sma9: sma9
                }));
                lastAction = 'BUY';
            }
            else if (sma3 < sma9 && lastAction !== 'SELL') {
                // Satış sinyali
                console.log(JSON.stringify({
                    timestamp: getTimestamp(),
                    action: 'SELL',
                    price: currentPrice,
                    sma3: sma3,
                    sma9: sma9
                }));
                lastAction = 'SELL';
            }

            // 1 dakika bekle
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
        } catch (error) {
            console.error('Hata:', error);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

startTrading();
