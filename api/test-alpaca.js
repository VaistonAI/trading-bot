const fetch = require('node-fetch');

/**
 * Test simple para verificar que la API de Alpaca funciona
 */
async function testAlpacaAPI(getAlpacaHeaders) {
    console.log('\n🧪 Probando conexión con Alpaca API...\n');

    const testSymbol = 'AAPL';
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const url = `https://data.alpaca.markets/v2/stocks/${testSymbol}/bars?timeframe=1Day&start=${startDate}&end=${endDate}&limit=100`;

        console.log(`📡 URL: ${url}`);
        console.log(`📅 Rango: ${startDate} a ${endDate}`);

        const response = await fetch(url, {
            headers: getAlpacaHeaders()
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ Error: ${errorText}`);
            return false;
        }

        const data = await response.json();

        if (data.bars && data.bars.length > 0) {
            console.log(`✅ Datos recibidos: ${data.bars.length} barras`);
            console.log(`   Primer precio: $${data.bars[0].c}`);
            console.log(`   Último precio: $${data.bars[data.bars.length - 1].c}`);
            console.log(`   Rendimiento: ${(((data.bars[data.bars.length - 1].c - data.bars[0].c) / data.bars[0].c) * 100).toFixed(2)}%`);
            return true;
        } else {
            console.log(`⚠️  Sin datos en la respuesta`);
            console.log(`   Respuesta:`, JSON.stringify(data, null, 2));
            return false;
        }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

module.exports = { testAlpacaAPI };
