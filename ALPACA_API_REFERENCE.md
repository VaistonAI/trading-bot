# Alpaca API - Referencia Completa de Endpoints

Esta es la documentación completa de todos los endpoints disponibles en la API de Alpaca.

## OAUTH2

### ISSUE TOKENS
```bash
curl --request POST \
     --url https://authx.alpaca.markets/v1/oauth2/token \
     --header 'accept: application/json' \
     --header 'content-type: application/x-www-form-urlencoded' \
     --data grant_type=client_credentials
```

## ACCOUNTS

### Get Account
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/account \
     --header 'accept: application/json'
```

## GET ASSETS

### GET ASSETS
```bash
curl --request GET \
     --url 'https://paper-api.alpaca.markets/v2/assets?attributes=' \
     --header 'accept: application/json'
```

### GET AN ASSET BY ID OR SYMBOL
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/assets/symbol_or_asset_id \
     --header 'accept: application/json'
```

### GET OPTION CONTRACTS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/options/contracts \
     --header 'accept: application/json'
```

### GET AN OPTION CONTRACT BY ID OR SYMBOL
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/options/contracts/symbol_or_id \
     --header 'accept: application/json'
```

## CORPORATE ACTIONS

### RETRIEVE A SPECIFIC ANNOUNCEMENT
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/corporate_actions/announcements/id \
     --header 'accept: application/json'
```

### RETRIEVE ANNOUNCEMENTS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/corporate_actions/announcements \
     --header 'accept: application/json'
```

## ORDERS

### CREATE AN ORDER
```bash
curl --request POST \
     --url https://paper-api.alpaca.markets/v2/orders \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '{
  "type": "market",
  "time_in_force": "day"
}'
```

### GET ALL ORDERS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/orders \
     --header 'accept: application/json'
```

### DELETE ALL ORDERS
```bash
curl --request DELETE \
     --url https://paper-api.alpaca.markets/v2/orders \
     --header 'accept: application/json'
```

### GET ORDER BY CLIENT ORDER ID
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/orders:by_client_order_id \
     --header 'accept: application/json'
```

### GET ORDER BY ID
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/orders/order_id \
     --header 'accept: application/json'
```

### REPLACE ORDER BY ID
```bash
curl --request PATCH \
     --url https://paper-api.alpaca.markets/v2/orders/order_id \
     --header 'accept: application/json' \
     --header 'content-type: application/json'
```

### DELETE ORDER BY ID
```bash
curl --request DELETE \
     --url https://paper-api.alpaca.markets/v2/orders/order_id
```

## POSITIONS

### ALL OPEN POSITIONS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/positions \
     --header 'accept: application/json'
```

### CLOSE ALL POSITIONS
```bash
curl --request DELETE \
     --url https://paper-api.alpaca.markets/v2/positions \
     --header 'accept: application/json'
```

### GET AN OPEN POSITION
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/positions/symbol_or_asset_id \
     --header 'accept: application/json'
```

### CLOSE A POSITION
```bash
curl --request DELETE \
     --url https://paper-api.alpaca.markets/v2/positions/symbol_or_asset_id \
     --header 'accept: application/json'
```

### EXERCISE AN OPTIONS POSITION
```bash
curl --request POST \
     --url https://paper-api.alpaca.markets/v2/positions/symbol_or_contract_id/exercise \
     --header 'accept: application/json'
```

## PORTFOLIO HISTORY

### GET ACCOUNT PORTFOLIO HISTORY
```bash
curl --request GET \
     --url 'https://paper-api.alpaca.markets/v2/account/portfolio/history?intraday_reporting=market_hours&pnl_reset=per_day' \
     --header 'accept: application/json'
```

## WATCHLISTS

### GET ALL WATCHLISTS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/watchlists \
     --header 'accept: application/json'
```

### CREATE WATCHLIST
```bash
curl --request POST \
     --url https://paper-api.alpaca.markets/v2/watchlists \
     --header 'accept: application/json' \
     --header 'content-type: application/json'
```

### GET WATCHLIST BY ID
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/watchlists/watchlist_id \
     --header 'accept: application/json'
```

### UPDATE WATCHLIST BY ID
```bash
curl --request PUT \
     --url https://paper-api.alpaca.markets/v2/watchlists/watchlist_id \
     --header 'accept: application/json' \
     --header 'content-type: application/json'
```

### ADD ASSET TO WATCHLIST
```bash
curl --request POST \
     --url https://paper-api.alpaca.markets/v2/watchlists/watchlist_id \
     --header 'accept: application/json' \
     --header 'content-type: application/json'
```

### DELETE WATCHLIST BY ID
```bash
curl --request DELETE \
     --url https://paper-api.alpaca.markets/v2/watchlists/watchlist_id
```

## ACCOUNT CONFIGURATIONS

### GET ACCOUNT CONFIGURATIONS
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/account/configurations \
     --header 'accept: application/json'
```

### UPDATE ACCOUNT CONFIGURATIONS
```bash
curl --request PATCH \
     --url https://paper-api.alpaca.markets/v2/account/configurations \
     --header 'accept: application/json' \
     --header 'content-type: application/json'
```

## ACCOUNT ACTIVITIES

### RETRIEVE ACCOUNT ACTIVITIES
```bash
curl --request GET \
     --url 'https://paper-api.alpaca.markets/v2/account/activities?direction=desc&page_size=100' \
     --header 'accept: application/json'
```

### RETRIEVE ACCOUNT ACTIVITIES OF SPECIFIC TYPE
```bash
curl --request GET \
     --url 'https://paper-api.alpaca.markets/v2/account/activities/activity_type?direction=desc&page_size=100' \
     --header 'accept: application/json'
```

## CALENDAR

### GET MARKET CALENDAR INFO
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/calendar \
     --header 'accept: application/json'
```

## CLOCK

### GET MARKET CLOCK INFO
```bash
curl --request GET \
     --url https://paper-api.alpaca.markets/v2/clock \
     --header 'accept: application/json'
```

---

# MARKET DATA API

## STOCK

### HISTORICAL BARS
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v2/stocks/bars?limit=1000&adjustment=raw&feed=sip&sort=asc' \
     --header 'accept: application/json'
```

### LATEST BARS
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/bars/latest \
     --header 'accept: application/json'
```

### HISTORICAL BARS (SINGLE SYMBOL)
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v2/stocks/symbol/bars?limit=1000&adjustment=raw&feed=sip&sort=asc' \
     --header 'accept: application/json'
```

### LATEST BAR (SINGLE SYMBOL)
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/symbol/bars/latest \
     --header 'accept: application/json'
```

### SNAPSHOTS
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/snapshots \
     --header 'accept: application/json'
```

### SNAPSHOT (SINGLE SYMBOL)
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/symbol/snapshot \
     --header 'accept: application/json'
```

### HISTORICAL QUOTES
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v2/stocks/quotes?limit=1000&feed=sip&sort=asc' \
     --header 'accept: application/json'
```

### LATEST QUOTES
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/quotes/latest \
     --header 'accept: application/json'
```

### HISTORICAL TRADES
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v2/stocks/trades?limit=1000&feed=sip&sort=asc' \
     --header 'accept: application/json'
```

### LATEST TRADES
```bash
curl --request GET \
     --url https://data.alpaca.markets/v2/stocks/trades/latest \
     --header 'accept: application/json'
```

## SCREENER

### MOST ACTIVE STOCKS
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v1beta1/screener/stocks/most-actives?by=volume&top=10' \
     --header 'accept: application/json'
```

### TOP MARKET MOVERS
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v1beta1/screener/stocks/movers?top=10' \
     --header 'accept: application/json'
```

## NEWS

### NEWS ARTICLES
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v1beta1/news?sort=desc' \
     --header 'accept: application/json'
```

## LOGOS

### GET LOGO
```bash
curl --request GET \
     --url 'https://data.alpaca.markets/v1beta1/logos/symbol?placeholder=true' \
     --header 'accept: image/png'
```

---

# NOTAS IMPORTANTES

## Limitaciones de Paper Trading API

- ❌ **NO tiene acceso a datos históricos completos (5 años)**
- ❌ **Error 403** al intentar consultar datos SIP extensos
- ✅ Solo permite datos recientes (días/semanas)

## Endpoints Útiles para Investigación

### 1. SCREENER - Most Actives
- **Endpoint:** `/v1beta1/screener/stocks/most-actives`
- **Uso:** Obtener las acciones más activas del día
- **Gratis:** ✅ Disponible en Paper API

### 2. SCREENER - Market Movers
- **Endpoint:** `/v1beta1/screener/stocks/movers`
- **Uso:** Obtener las acciones con mayor movimiento
- **Gratis:** ✅ Disponible en Paper API

### 3. SNAPSHOTS
- **Endpoint:** `/v2/stocks/snapshots`
- **Uso:** Datos en tiempo real de múltiples símbolos
- **Gratis:** ✅ Disponible en Paper API

### 4. NEWS
- **Endpoint:** `/v1beta1/news`
- **Uso:** Noticias del mercado
- **Gratis:** ✅ Disponible en Paper API

## Alternativas para Datos Históricos

1. **Upgrade a Alpaca Live Data** - $9/mes
2. **Alpha Vantage API** - Gratis con límites
3. **Yahoo Finance API** - Gratis
4. **Polygon.io** - Desde $29/mes
