# Instrucciones para Deploy Manual en Render

## PASO 1: Comprimir la carpeta API

1. Ve a: `c:\Users\Rodrigo\Desktop\Bolsa\crm-general\api`
2. Selecciona TODOS los archivos dentro de `api/`
3. Click derecho → "Comprimir" o "Send to" → "Compressed folder"
4. Nómbralo: `trading-bot-api.zip`

**IMPORTANTE:** Comprime los ARCHIVOS dentro de `api/`, NO la carpeta `api/` completa.

---

## PASO 2: Crear Web Service en Render

1. Ve a: https://dashboard.render.com
2. Click en **"New +"** (arriba derecha)
3. Selecciona **"Web Service"**

---

## PASO 3: Configuración del Servicio

En la página de configuración:

### **Sección: Source Code**
- Selecciona: **"Public Git repository"** o **"Deploy without Git"**
- Si aparece opción de subir ZIP, úsala
- Si no, necesitarás crear un repo público en GitHub (te ayudo después)

### **Sección: Settings**

**Name:**
```
trading-bot-api
```

**Region:**
```
Oregon (US West)
```

**Branch:** (si usa Git)
```
main
```

**Root Directory:** (dejar vacío si subiste solo la carpeta api)

**Environment:**
```
Node
```

**Build Command:**
```
npm install
```

**Start Command:**
```
node server.js
```

---

## PASO 4: Variables de Entorno

En la sección **"Environment Variables"**, agrega estas:

**ALPACA_API_KEY**
```
[Pega tu Alpaca API Key aquí]
```

**ALPACA_SECRET_KEY**
```
[Pega tu Alpaca Secret Key aquí]
```

**ALPACA_BASE_URL**
```
https://paper-api.alpaca.markets
```

**AUTO_TRADING_ENABLED**
```
true
```

**NODE_ENV**
```
production
```

**PORT**
```
3001
```

---

## PASO 5: Plan

Selecciona:
```
Free (0 USD/month)
```

---

## PASO 6: Deploy

1. Click **"Create Web Service"**
2. Espera 5-10 minutos mientras Render:
   - Instala dependencias
   - Inicia el servidor
   - Genera tu URL

---

## PASO 7: Verificar

Una vez que diga "Live", abre:
```
https://tu-app-name.onrender.com/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "...",
  "service": "CRM Trading API"
}
```

---

## ⚠️ PROBLEMA: Render requiere Git

Si Render te pide Git obligatoriamente, tenemos 2 opciones:

### **Opción A: Crear repo público rápido**
1. Ve a https://github.com
2. Click "New repository"
3. Nombre: `trading-bot`
4. Público
5. Te ayudo a subir el código

### **Opción B: Usar Railway en su lugar**
- No requiere Git
- Deploy directo con ZIP
- Igual de bueno

---

## 📞 ¿En qué paso estás?

Dime si:
1. ✅ Lograste comprimir la carpeta
2. ✅ Estás en la página de "New Web Service"
3. ❌ Te pide Git obligatoriamente

¡Te ayudo desde donde estés!
