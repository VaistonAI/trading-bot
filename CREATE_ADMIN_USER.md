# 🚀 Crear Usuario Administrador - Método Rápido (Sin Script)

## Opción 1: Desde Firebase Console (MÁS RÁPIDO)

### Paso 1: Crear Usuario en Authentication

1. Ve a: https://console.firebase.google.com/project/acciones-7fa3a/authentication/users

2. Click en **"Add user"** (botón azul arriba a la derecha)

3. Ingresa:
   - **Email**: tu-email@ejemplo.com
   - **Password**: tu-contraseña-segura (mínimo 6 caracteres)

4. Click en **"Add user"**

5. **IMPORTANTE**: Copia el **UID** del usuario que aparece en la lista (algo como: `xY9kL2mN3oP4qR5s`)

---

### Paso 2: Crear Documento en Firestore

1. Ve a: https://console.firebase.google.com/project/acciones-7fa3a/firestore/databases/-default-/data

2. Si no existe la colección `users`, créala:
   - Click en **"Start collection"**
   - Collection ID: `users`
   - Click **"Next"**

3. Crea un documento con el **UID** del usuario:
   - Document ID: **pega aquí el UID que copiaste** (ej: `xY9kL2mN3oP4qR5s`)
   - Click **"Add field"** para cada campo:

```
Campo 1:
Field: uid
Type: string
Value: [el mismo UID]

Campo 2:
Field: email
Type: string
Value: tu-email@ejemplo.com

Campo 3:
Field: displayName
Type: string
Value: Tu Nombre Completo

Campo 4:
Field: role
Type: string
Value: admin

Campo 5:
Field: permissions
Type: map
  - canViewStrategies: boolean = true
  - canManageNotifications: boolean = true
  - canManageUsers: boolean = true
  - canViewReports: boolean = true

Campo 6:
Field: createdAt
Type: timestamp
Value: [click en el reloj para usar timestamp actual]

Campo 7:
Field: updatedAt
Type: timestamp
Value: [click en el reloj para usar timestamp actual]

Campo 8:
Field: isActive
Type: boolean
Value: true
```

4. Click en **"Save"**

---

## ✅ Verificar que Funciona

1. Ve a tu aplicación: http://localhost:5173

2. Inicia sesión con:
   - Email: el que creaste
   - Password: la que creaste

3. Deberías ver:
   - ✓ Dashboard completo
   - ✓ Acceso a todas las 5 estrategias
   - ✓ Botón "Registrar Operación"
   - ✓ Toggle de notificaciones Telegram (solo ADMIN)

---

## 📸 Capturas de Referencia

### Cómo se ve el documento en Firestore:

```
users/
  └── xY9kL2mN3oP4qR5s/
      ├── uid: "xY9kL2mN3oP4qR5s"
      ├── email: "admin@ejemplo.com"
      ├── displayName: "Administrador"
      ├── role: "admin"
      ├── permissions:
      │   ├── canViewStrategies: true
      │   ├── canManageNotifications: true
      │   ├── canManageUsers: true
      │   └── canViewReports: true
      ├── createdAt: December 11, 2024 at 5:30:00 PM UTC-6
      ├── updatedAt: December 11, 2024 at 5:30:00 PM UTC-6
      └── isActive: true
```

---

## ⚠️ Importante

- El **Document ID** DEBE ser exactamente el mismo que el **UID** del usuario en Authentication
- El campo `role` DEBE ser exactamente `"admin"` (minúsculas)
- Todos los campos en `permissions` deben ser `true` para el admin

---

## 🆘 Si Algo Sale Mal

**Problema**: No puedo iniciar sesión
- Verifica que el email y password sean correctos
- Verifica que el usuario esté en Authentication

**Problema**: Puedo iniciar sesión pero no veo las estrategias
- Verifica que el Document ID en Firestore sea igual al UID
- Verifica que `role` sea `"admin"`
- Verifica que `isActive` sea `true`

**Problema**: No veo el toggle de notificaciones
- Verifica que `canManageNotifications` sea `true`

---

## 🎯 Listo!

Una vez creado el usuario, ya puedes:
- ✓ Iniciar sesión
- ✓ Ver todas las estrategias
- ✓ Registrar operaciones
- ✓ Activar notificaciones Telegram
- ✓ Gestionar usuarios (crear más usuarios desde la app)
