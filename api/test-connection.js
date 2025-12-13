require('dotenv').config();
const fetch = require('node-fetch');

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

console.log('\n🧪 TEST DE CONEXIÓN ALPACA API\n');
console.log('='.repeat(50));

async function testAPI() {
    // Test 1: Verificar credenciales
    console.log('\n📋 Paso 1: Verificando credenciales...');
    console.log(`   API Key: ${ALPACA_API_KEY ? ALPACA_API_KEY.substring(0, 8) + '...' : '❌ NO ENCONTRADA'}`);
    console.log(`   Secret: ${ALPACA_SECRET_KEY ? '✅ Configurada' : '❌ NO ENCONTRADA'}`);

    if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
        console.log('\n❌ ERROR: Credenciales no configuradas en .env');
        return;
    }

    // Test 2: Probar con 1 año
    console.log('\n📊 Paso 2: Probando con 1 año de datos (AAPL)...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate1Y = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url1Y = `https://data.alpaca.markets/v2/stocks/AAPL/bars?timeframe=1Day&start=${startDate1Y}&end=${endDate}&limit=1000`;

    try {
        const response = await fetch(url1Y, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
            }
        });

        console.log(`   Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ Error: ${errorText}`);
            return;
        }

        const data = await response.json();

        if (data.bars && data.bars.length > 0) {
            const firstPrice = data.bars[0].c;
            const lastPrice = data.bars[data.bars.length - 1].c;
            const returnPct = ((lastPrice - firstPrice) / firstPrice) * 100;

            console.log(`   ✅ Datos recibidos: ${data.bars.length} barras`);
            console.log(`   📅 Desde: ${data.bars[0].t.split('T')[0]}`);
            console.log(`   📅 Hasta: ${data.bars[data.bars.length - 1].t.split('T')[0]}`);
            console.log(`   💰 Precio inicial: $${firstPrice.toFixed(2)}`);
            console.log(`   💰 Precio final: $${lastPrice.toFixed(2)}`);
            console.log(`   📈 Rendimiento: ${returnPct.toFixed(2)}%`);
        } else {
            console.log(`   ⚠️  Sin datos`);
            console.log(`   Respuesta:`, JSON.stringify(data).substring(0, 200));
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return;
    }

    // Test 3: Probar con 5 años
    console.log('\n📊 Paso 3: Probando con 5 años de datos (AAPL)...');
    const startDate5Y = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url5Y = `https://data.alpaca.markets/v2/stocks/AAPL/bars?timeframe=1Day&start=${startDate5Y}&end=${endDate}&limit=10000`;

    try {
        const response = await fetch(url5Y, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_API_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
            }
        });

        console.log(`   Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ Error: ${errorText}`);
            console.log(`   💡 NOTA: Alpaca Paper API puede tener límite de datos históricos`);
            return;
        }

        const data = await response.json();

        if (data.bars && data.bars.length > 0) {
            const firstPrice = data.bars[0].c;
            const lastPrice = data.bars[data.bars.length - 1].c;
            const returnPct = ((lastPrice - firstPrice) / firstPrice) * 100;

            console.log(`   ✅ Datos recibidos: ${data.bars.length} barras`);
            console.log(`   📅 Desde: ${data.bars[0].t.split('T')[0]}`);
            console.log(`   📅 Hasta: ${data.bars[data.bars.length - 1].t.split('T')[0]}`);
            console.log(`   💰 Precio inicial: $${firstPrice.toFixed(2)}`);
            console.log(`   💰 Precio final: $${lastPrice.toFixed(2)}`);
            console.log(`   📈 Rendimiento: ${returnPct.toFixed(2)}%`);

            if (data.bars.length < 1000) {
                console.log(`   ⚠️  ADVERTENCIA: Solo ${data.bars.length} días (esperado ~1260 para 5 años)`);
                console.log(`   💡 La API Paper de Alpaca tiene datos limitados`);
            }
        } else {
            console.log(`   ⚠️  Sin datos`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completado\n');
}

testAPI();
