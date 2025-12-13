import { Timestamp } from 'firebase/firestore';

// Roles de usuario
export const UserRole = {
    ADMIN: 'admin',
    INVESTOR: 'investor',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Permisos
export interface UserPermissions {
    canViewStrategies: boolean; // Ver estrategias de inversión
    canManageNotifications: boolean; // Activar/desactivar notificaciones de Telegram
    canManageUsers: boolean; // Gestionar usuarios
    canViewReports: boolean; // Ver reportes detallados
}

// Usuario del sistema
export interface User {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    permissions: UserPermissions;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isActive: boolean;
}

// Función para obtener permisos por rol
export const getPermissionsByRole = (role: UserRole | string): UserPermissions => {
    switch (role) {
        case UserRole.ADMIN:
        case 'admin':
            // Administrador: Acceso total
            return {
                canViewStrategies: true,
                canManageNotifications: true,
                canManageUsers: true,
                canViewReports: true,
            };
        case UserRole.INVESTOR:
        case 'investor':
        case 'psychologist': // Mapeo legacy - psychologist = investor
            // Inversor: Solo lectura de estrategias y reportes
            return {
                canViewStrategies: true,
                canManageNotifications: false,
                canManageUsers: false,
                canViewReports: true,
            };
        default:
            return {
                canViewStrategies: false,
                canManageNotifications: false,
                canManageUsers: false,
                canViewReports: false,
            };
    }
};

