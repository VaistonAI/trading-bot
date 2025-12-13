# Backend API

Backend server para el CRM de Trading. Actúa como proxy para las llamadas a Alpaca API, evitando problemas de CORS.

## Instalación

```bash
cd api
npm install
```

## Desarrollo Local

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

## Producción

```bash
npm start
```

## Variables de Entorno

Crear archivo `.env` con:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
ALPACA_API_KEY=tu_api_key
ALPACA_SECRET_KEY=tu_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

## Endpoints Disponibles

### Health Check
```
GET /health
```

### Alpaca API Proxy

#### Obtener Cotización
```
GET /api/alpaca/quote/:symbol
```

#### Obtener Datos Históricos
```
GET /api/alpaca/bars/:symbol?timeframe=1Day&start=2024-01-01&end=2024-12-31
```

#### Obtener Cuenta
```
GET /api/alpaca/account
```

#### Obtener Posiciones
```
GET /api/alpaca/positions
```

#### Crear Orden
```
POST /api/alpaca/orders
Body: { symbol, qty, side, type, time_in_force }
```

#### Obtener Órdenes
```
GET /api/alpaca/orders?status=all
```

## Despliegue en Hostinger

1. Subir carpeta `api/` al servidor
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`
4. Iniciar con PM2: `pm2 start server.js --name crm-api`
5. Guardar configuración: `pm2 save`

## Seguridad

- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Compresión gzip
- ✅ Variables de entorno para credenciales
- ✅ Manejo de errores

## Estructura

```
api/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── .env              # Variables de entorno
└── README.md         # Documentación
```
