import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
    FaHome,
    FaChartBar,
    FaChartLine,
    FaChartArea,
    FaUsersCog,
    FaBars,
    FaTimes,
    FaQuestionCircle,
    FaRocket,
    FaWhatsapp,
    FaDollarSign,
    FaCode,
    FaDownload,
} from 'react-icons/fa';

import type { UserPermissions } from '../../types/user';

interface MenuItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    permission?: keyof UserPermissions;
    submenu?: Array<{ path: string; label: string }>;
}

// Componente de partículas flotantes
const FloatingParticles: React.FC = () => {
    const [particles, setParticles] = useState<Array<{ id: number; y: number; size: number; duration: number }>>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 15 + 10
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute rounded-full bg-white/10"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animation: `float ${particle.duration}s infinite ease-in-out`,
                        animationDelay: `${Math.random() * 3}s`
                    }}
                />
            ))}
        </div>
    );
};

// Modal de Descarga
const DownloadModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <FaTimes className="text-gray-500" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <FaDownload className="text-3xl text-primary mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-gray-800">Descarga en tu teléfono</h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('android')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${activeTab === 'android'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Android
                    </button>
                    <button
                        onClick={() => setActiveTab('ios')}
                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${activeTab === 'ios'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        iOS
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    {activeTab === 'android' && (
                        <div className="space-y-4">
                            <ol className="space-y-3 text-gray-700 text-sm">
                                <li className="flex gap-3">
                                    <span className="font-bold text-primary flex-shrink-0">1.</span>
                                    <div className="flex-1">
                                        <span>Haz clic en instalar</span>
                                        {menuItems.map((item) => {
                                            if (item.permission && !hasPermission(item.permission)) {
                                                return null;
                                            }

                                            const isActive = location.pathname === item.path ||
                                                (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
                                            const isSubmenuOpen = openSubmenu === item.path;

                                            return (
                                                <div key={item.path}>
                                                    {item.submenu ? (
                                                        // Menu item with submenu
                                                        <>
                                                            <button
                                                                onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.path)}
                                                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                                                        ? 'bg-primary text-white'
                                                                        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-lg">{item.icon}</span>
                                                                    <span>{item.label}</span>
                                                                </div>
                                                                <svg
                                                                    className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </button>
                                                            {isSubmenuOpen && (
                                                                <div className="ml-8 mt-1 space-y-1">
                                                                    {item.submenu.map((subItem) => (
                                                                        <Link
                                                                            key={subItem.path}
                                                                            to={subItem.path}
                                                                            onClick={() => setIsSidebarOpen(false)}
                                                                            className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${location.pathname === subItem.path
                                                                                    ? 'bg-primary/10 text-primary font-semibold'
                                                                                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                                                                                }`}
                                                                        >
                                                                            {subItem.label}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        // Regular menu item
                                                        <Link
                                                            to={item.path}
                                                            onClick={() => setIsSidebarOpen(false)}
                                                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                                                    ? 'bg-primary text-white'
                                                                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                                                                }`}
                                                        >
                                                            <span className="text-lg">{item.icon}</span>
                                                            <span>{item.label}</span>
                                                        </Link>
                                                    )}
                                                </div>
                                            );
                                        })}    <li className="flex gap-3">
                                            <span className="font-bold text-primary flex-shrink-0">2.</span>
                                            <span>Espera a que la instalación se complete en tu celular</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="font-bold text-primary flex-shrink-0">3.</span>
                                            <span>Busca la aplicación en tu inicio e ingresa a ella</span>
                                        </li>
                                    </ol>
                                </div>
                    )}
                                {activeTab === 'ios' && (
                                    <div className="space-y-3">
                                        <ol className="space-y-3 text-gray-700 text-sm">
                                            <li className="flex gap-3">
                                                <span className="font-bold text-primary flex-shrink-0">1.</span>
                                                <span>Haz click en el icono de compartir</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="font-bold text-primary flex-shrink-0">2.</span>
                                                <span>Encuentra y selecciona la opción Agregar al Inicio</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="font-bold text-primary flex-shrink-0">3.</span>
                                                <span>Haz click en Agregar y la app será agregada a tu celular</span>
                                            </li>
                                        </ol>
                                    </div>
                                )}
                        </div>

                {/* Close button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
            );
};

            // Modal de Contratación
            const HireModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({isOpen, onClose}) => {
    if (!isOpen) return null;

    const handleWhatsApp = () => {
                window.open('https://wa.me/5215579987650?text=Hola,%20me%20interesa%20contratar%20el%20CRM%20de%20Psicología.%20Me%20gustaría%20conocer%20más%20detalles.', '_blank');
    };

            return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <FaTimes className="text-gray-500" />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1b527c] to-[#2d9bf0] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaRocket className="text-3xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">¿Listo para contratar?</h2>
                        <p className="text-gray-600">Proceso simple y directo</p>
                    </div>

                    {/* Proceso */}
                    <div className="space-y-4 mb-8">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1b527c] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">Contacto Inicial</h3>
                                <p className="text-sm text-gray-600">Contáctame por WhatsApp para agendar una reunión</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#2d9bf0] text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">Análisis de Necesidades</h3>
                                <p className="text-sm text-gray-600">Evaluamos si el sistema cumple con tus requisitos o si necesitas modificaciones personalizadas</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#55bff3] text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">Selección de Modalidad</h3>
                                <p className="text-sm text-gray-600">Elige entre renta mensual ($399 MXN) o compra del código fuente</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0f6cbf] text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">Implementación</h3>
                                <p className="text-sm text-gray-600">Configuración, capacitación y puesta en marcha del sistema</p>
                            </div>
                        </div>
                    </div>

                    {/* Opciones de contratación */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <FaDollarSign className="text-3xl text-[#1b527c] mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Renta Mensual</h4>
                            <p className="text-2xl font-bold text-[#1b527c]">$399 <span className="text-sm font-normal">MXN</span></p>
                            <p className="text-xs text-gray-600 mt-2">Todo incluido</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <FaCode className="text-3xl text-[#1b527c] mb-2" />
                            <h4 className="font-bold text-gray-800 mb-1">Código Fuente</h4>
                            <p className="text-sm text-gray-600 mt-2">Pago único</p>
                            <p className="text-xs text-gray-600">Personalización total</p>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <FaWhatsapp className="text-2xl" />
                        <span>Contactar por WhatsApp</span>
                    </button>

                    <p className="text-center text-xs text-gray-500 mt-4">
                        También puedes escribir a: <a href="mailto:contacto@vaiston.com" className="text-[#1b527c] hover:underline">contacto@vaiston.com</a>
                    </p>
                </div>
            </div>
            );
};

export const Sidebar: React.FC = () => {
    const location = useLocation();
            const {currentUser} = useAuth();
            const [isSidebarOpen, setIsSidebarOpen] = useState(false);
            const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
            const [showHireModal, setShowHireModal] = useState(false);
            const [showDownloadModal, setShowDownloadModal] = useState(false);

            if (!currentUser) return null;

            const menuItems: MenuItem[] = [
            {path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
            {
                path: '/trading',
            label: 'Trading en Vivo',
            icon: <FaChartBar />,
            permission: 'canViewStrategies'
        },
            {
                path: '/reports',
            label: 'Reportes Diarios',
            icon: <FaChartLine />,
            permission: 'canViewStrategies'
        },
            {
                path: '/results',
            label: 'Resultados',
            icon: <FaChartArea />,
            permission: 'canViewStrategies',
            submenu: [
            {path: '/results/2024', label: '2024' },
            {path: '/results/2023', label: '2023' },
            {path: '/results/2022', label: '2022' }
            ]
        },
            {
                path: '/users',
            label: 'Usuarios',
            icon: <FaUsersCog />,
            permission: 'canManageUsers'
        },
            {
                path: '/help',
            label: 'Ayuda',
            icon: <FaQuestionCircle />,
        },
            ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!item.permission) return true;
            return currentUser.permissions[item.permission];
    });



    const isActive = (path: string) => location.pathname === path;

            return (
            <>
                <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-15px) translateX(5px); }
                    50% { transform: translateY(-8px) translateX(-5px); }
                    75% { transform: translateY(-20px) translateX(3px); }
                }
            `}</style>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-br from-[#1b527c] to-[#2d9bf0] text-white rounded-lg cursor-pointer shadow-lg"
                >
                    {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>

                {/* Sidebar */}
                <aside
                    className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#1b527c] via-[#2d9bf0] to-[#0f6cbf] transition-transform duration-300 z-40 overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64`}
                >
                    {/* Partículas flotantes */}
                    <FloatingParticles />

                    {/* Formas geométricas de fondo */}
                    <div className="absolute inset-0 overflow-hidden opacity-10">
                        <div className="absolute top-10 right-5 w-20 h-20">
                            <svg viewBox="0 0 100 100" className="w-full h-full animate-[float_20s_ease-in-out_infinite]">
                                <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="absolute bottom-20 left-5 w-16 h-16">
                            <svg viewBox="0 0 100 100" className="w-full h-full animate-[float_18s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="relative z-10 h-full flex flex-col">
                        {/* Logo */}
                        <div className="p-6 border-b border-white/20">
                            <img
                                src="/images/logotipo-vaiston-byn.png"
                                alt="Vaiston Logo"
                                className="h-12 w-auto drop-shadow-lg"
                            />
                            <p className="text-xs text-white/80 mt-2 font-medium">Trading Automatizado</p>
                        </div>

                        {/* Menu */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {filteredMenuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                ${isActive(item.path)
                                            ? 'bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30 hover:bg-white/30'
                                            : 'text-white/70 hover:bg-white/15 hover:text-white hover:shadow-md hover:border hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xl transition-transform duration-200 ${!isActive(item.path) && 'group-hover:scale-110'}`}>{item.icon}</span>
                                        <span className="font-medium">{item.label}</span>
                                    </div>

                                </Link>
                            ))}
                        </nav>

                        {/* Botón de Descarga - Solo en responsive */}
                        <div className="p-4 border-t border-white/20 lg:hidden">
                            <button
                                onClick={() => setShowDownloadModal(true)}
                                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/30 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <FaDownload className="text-lg" />
                                <span>Descarga en tu teléfono</span>
                            </button>
                        </div>

                        {/* Botón de Contratar */}
                        <div className="p-4 border-t border-white/20">
                            <button
                                onClick={() => setShowHireModal(true)}
                                className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-white/30 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <FaRocket className="text-lg" />
                                <span>Contratar Sistema</span>
                            </button>
                            <p className="text-center text-xs text-white/60 mt-2">Versión Demo</p>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}

                {/* Modal de Descarga */}
                <DownloadModal isOpen={showDownloadModal} onClose={() => setShowDownloadModal(false)} />

                {/* Modal de Contratación */}
                <HireModal isOpen={showHireModal} onClose={() => setShowHireModal(false)} />
            </>
            );
};
