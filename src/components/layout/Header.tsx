import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { ConfirmModal } from '../ui/ConfirmModal';
// import { NotificationBell } from '../notifications/NotificationBell'; // Removed - legacy CRM component
import { azureSpeechService } from '../../services/azureSpeechService';

export const Header: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);


    const handleLogoutClick = () => {
        // El audio ya se detuvo en el onClick del botón
        handleLogout();
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            setIsLoggingOut(false);
            setShowLogoutModal(false);
        }
    };

    if (!currentUser) return null;

    return (
        <header className="bg-white border-b border-border px-4 sm:px-6 py-4 lg:px-6 lg:py-4">
            <div className="flex items-center justify-between gap-2 pt-12 lg:pt-0">
                {/* Title */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-2xl lg:text-2xl font-bold text-text-primary truncate">
                        Sistema de Trading
                    </h1>
                    <p className="text-xs sm:text-sm lg:text-sm text-text-secondary truncate">
                        Bienvenido, {currentUser.displayName}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-4 lg:gap-4 flex-shrink-0">
                    {/* Notifications - Removed legacy CRM component */}
                    {/* <NotificationBell /> */}

                    {/* User Menu - Hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-background">
                        <FaUserCircle size={32} className="text-primary" />
                        <div className="text-left">
                            <p className="text-sm font-medium text-text-primary">
                                {currentUser.displayName}
                            </p>
                            <p className="text-xs text-text-secondary capitalize">
                                {currentUser.role === 'admin' ? 'Administrador' : 'Inversionista'}
                            </p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => {
                            // DETENER AUDIO INMEDIATAMENTE
                            azureSpeechService.stop();
                            sessionStorage.removeItem('welcomeShown');
                            // Luego mostrar modal
                            setShowLogoutModal(true);
                        }}
                        className="p-2 text-text-secondary hover:text-danger transition-colors cursor-pointer flex-shrink-0"
                        title="Cerrar sesión"
                    >
                        <FaSignOutAlt size={20} />
                    </button>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutClick}
                title="Cerrar sesión"
                message="¿Estás seguro de que deseas cerrar sesión?"
                confirmText="Cerrar sesión"
                cancelText="Cancelar"
                isLoading={isLoggingOut}
            />
        </header>
    );
};
