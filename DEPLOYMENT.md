# 🚀 Despliegue de Firebase - Sistema de Trading

## ✅ Verificación Completada

El proyecto está correctamente configurado para usar la base de datos **acciones-7fa3a**.

---

## 📋 Pasos para Desplegar

### 1. Instalar Firebase CLI (si no lo tienes)

```bash
npm install -g firebase-tools
```

### 2. Iniciar Sesión en Firebase

```bash
firebase login
```

### 3. Inicializar Firebase en el Proyecto

```bash
firebase init
```

**Selecciona:**
- ✓ Firestore
- ✓ Storage
- Proyecto existente: **acciones-7fa3a**
- Firestore rules: `firestore.rules` (ya existe)
- Storage rules: `storage.rules` (ya existe)

### 4. Desplegar las Reglas de Seguridad

```bash
firebase deploy --only firestore:rules,storage:rules
```

**Esto desplegará:**
- ✓ Reglas de Firestore (control de acceso a colecciones)
- ✓ Reglas de Storage (control de acceso a archivos)

---

## 👤 Crear Usuario Administrador

### Opción 1: Script Automático (Recomendado)

#### Paso 1: Descargar Clave de Servicio

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto **acciones-7fa3a**
3. Ve a **Project Settings** (⚙️) > **Service Accounts**
4. Click en **Generate new private key**
5. Guarda el archivo como `serviceAccountKey.json` en la raíz del proyecto

#### Paso 2: Instalar Dependencias

```bash
npm install firebase-admin
```

#### Paso 3: Ejecutar Script

```bash
node scripts/createAdminUser.js
```

El script te pedirá:
- 📧 Email del administrador
- 🔐 Contraseña (mínimo 6 caracteres)
- 👤 Nombre completo

**El script creará automáticamente:**
- ✓ Usuario en Firebase Auth
- ✓ Documento en Firestore con rol ADMIN
- ✓ Permisos completos (canViewStrategies, canManageNotifications, canManageUsers, canViewReports)

---

### Opción 2: Manual desde Firebase Console

#### Paso 1: Crear Usuario en Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona **acciones-7fa3a**
3. Ve a **Authentication** > **Users**
4. Click en **Add user**
5. Ingresa email y contraseña
6. Copia el **UID** del usuario creado

#### Paso 2: Crear Documento en Firestore

1. Ve a **Firestore Database**
2. Crea una colección llamada `users` (si no existe)
3. Crea un documento con el **UID** del usuario
4. Agrega los siguientes campos:

```javascript
{
  uid: "UID_DEL_USUARIO",
  email: "admin@ejemplo.com",
  displayName: "Nombre del Admin",
  role: "admin",
  permissions: {
    canViewStrategies: true,
    canManageNotifications: true,
    canManageUsers: true,
    canViewReports: true
  },
  createdAt: [Timestamp actual],
  updatedAt: [Timestamp actual],
  isActive: true
}
```

---

## 🔐 Reglas de Seguridad Implementadas

### Firestore Rules

**Colecciones protegidas:**
- `users` - Solo admin puede crear/eliminar, usuarios pueden leer su propio perfil
- `strategies` - Todos pueden leer, solo admin puede escribir
- `trades` - Todos pueden leer, solo admin puede escribir
- `positions` - Todos pueden leer, solo admin puede escribir
- `notifications` - Todos pueden leer, solo admin puede escribir

### Storage Rules

**Carpetas protegidas:**
- `/users/{userId}/` - Cada usuario puede escribir en su carpeta
- `/strategies/` - Solo admin puede escribir
- `/public/` - Todos pueden leer, solo admin puede escribir

---

## 🎯 Verificar Despliegue

### 1. Verificar Reglas en Firebase Console

1. Ve a **Firestore Database** > **Rules**
2. Deberías ver las reglas desplegadas
3. Ve a **Storage** > **Rules**
4. Deberías ver las reglas desplegadas

### 2. Probar Login

1. Ejecuta `npm run dev`
2. Ve a `http://localhost:5173`
3. Inicia sesión con las credenciales del admin
4. Deberías ver el dashboard completo con acceso a todas las estrategias

---

## ⚠️ Importante

### Seguridad del serviceAccountKey.json

**NUNCA** subas el archivo `serviceAccountKey.json` a Git. Ya está incluido en `.gitignore`.

Este archivo contiene credenciales sensibles que permiten acceso completo a tu proyecto Firebase.

### Backup de Credenciales

Guarda las credenciales del usuario administrador en un lugar seguro:
- Email
- Contraseña
- UID (opcional, pero útil)

---

## 🚀 Siguiente Paso

Una vez desplegadas las reglas y creado el usuario admin:

1. ✅ Inicia sesión en la aplicación
2. ✅ Verifica que puedes acceder a todas las estrategias
3. ✅ Prueba crear una operación de prueba
4. ✅ Verifica las notificaciones de Telegram (si están activadas)

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que estás usando el proyecto correcto: **acciones-7fa3a**
2. Verifica que las reglas se desplegaron correctamente
3. Verifica que el usuario tiene rol `admin` en Firestore
4. Revisa la consola del navegador para errores

---

## ✨ ¡Listo!

Tu sistema de trading está configurado y listo para usar con:
- ✓ Base de datos: acciones-7fa3a
- ✓ Reglas de seguridad desplegadas
- ✓ Usuario administrador creado
- ✓ 5 estrategias de inversión funcionales
- ✓ Integración con APIs (Alpha Vantage, Finnhub, Telegram)
