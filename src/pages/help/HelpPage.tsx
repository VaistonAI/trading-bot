import React, { useState } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { FaBook, FaQuestionCircle, FaCog, FaLightbulb, FaChevronRight } from 'react-icons/fa';

type Section = 'how-to-use' | 'how-it-works' | 'why' | 'faq';

export const HelpPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<Section>('how-to-use');

    const sections = [
        { id: 'how-to-use' as Section, title: 'Cómo Usar el Sistema', icon: FaBook },
        { id: 'how-it-works' as Section, title: 'Cómo Funciona', icon: FaCog },
        { id: 'why' as Section, title: 'Por Qué Funciona Así', icon: FaLightbulb },
        { id: 'faq' as Section, title: 'Preguntas Frecuentes', icon: FaQuestionCircle },
    ];

    return (
        <MainLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-text-primary mb-2">Centro de Ayuda</h2>
                    <p className="text-text-secondary">
                        Encuentra toda la información que necesitas para usar la plataforma de trading automatizado
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar de navegación */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-border p-4 sticky top-6">
                            <h3 className="font-semibold text-text-primary mb-4">Secciones</h3>
                            <nav className="space-y-2">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === section.id
                                                ? 'bg-primary text-white'
                                                : 'text-text-secondary hover:bg-background'
                                                }`}
                                        >
                                            <Icon className="text-lg" />
                                            <span className="flex-1 text-left text-sm">{section.title}</span>
                                            {activeSection === section.id && <FaChevronRight />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm border border-border p-8">
                            {activeSection === 'how-to-use' && <HowToUseSection />}
                            {activeSection === 'how-it-works' && <HowItWorksSection />}
                            {activeSection === 'why' && <WhySection />}
                            {activeSection === 'faq' && <FAQSection />}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

const HowToUseSection: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Cómo Usar el Sistema</h2>

        <div className="space-y-6">
            <Section title="1. Dashboard">
                <p className="text-text-secondary mb-4">
                    El Dashboard es tu centro de control principal donde visualizas el estado de tu cuenta y posiciones en tiempo real.
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li><strong>Valor de Cuenta:</strong> Visualiza el equity total de tu cuenta de trading en tiempo real.</li>
                    <li><strong>Efectivo Disponible:</strong> Consulta el cash disponible para nuevas operaciones.</li>
                    <li><strong>Posiciones Abiertas:</strong> Ve todas tus posiciones activas con P&L en tiempo real.</li>
                    <li><strong>Métricas de Performance:</strong> ROI, ganancias/pérdidas totales y distribución de capital.</li>
                    <li><strong>Actualización Automática:</strong> Los datos se actualizan automáticamente cada 10 segundos.</li>
                </ul>
            </Section>

            <Section title="2. Trading en Vivo">
                <p className="text-text-secondary mb-4">
                    Controla el bot de trading automatizado y monitorea las operaciones en tiempo real.
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li><strong>Iniciar Bot:</strong> Solo administradores pueden activar el bot de trading automático (requiere mercado abierto).</li>
                    <li><strong>Pausar Bot:</strong> Detiene nuevas operaciones pero mantiene las posiciones abiertas.</li>
                    <li><strong>Parada de Emergencia:</strong> Cierra TODAS las posiciones inmediatamente al precio de mercado.</li>
                    <li><strong>Cerrar Posición Individual:</strong> Cierra una posición específica manualmente.</li>
                    <li><strong>Horario de Mercado:</strong> El sistema solo permite operaciones durante NYSE/NASDAQ (9:30 AM - 4:00 PM EST).</li>
                    <li><strong>Estrategia Automática:</strong> El bot ejecuta Value Investing con límites de seguridad predefinidos.</li>
                </ul>
            </Section>

            <Section title="3. Gestión de Usuarios">
                <p className="text-text-secondary mb-4">
                    Solo disponible para administradores. Gestiona los usuarios del sistema y sus permisos.
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li><strong>Invitar Usuario:</strong> Envía invitaciones por email con enlace único que expira en 7 días.</li>
                    <li><strong>Compartir Invitación:</strong> Copia el enlace o compártelo directamente por WhatsApp.</li>
                    <li><strong>Asignar Roles:</strong> Define roles al invitar: Administrador o Inversionista.</li>
                    <li><strong>Editar Usuario:</strong> Actualiza nombre, email, rol o estado de usuarios existentes.</li>
                    <li><strong>Activar/Desactivar:</strong> Controla el acceso de usuarios sin eliminar sus datos.</li>
                    <li><strong>Eliminar Usuario:</strong> Elimina usuarios que ya no necesiten acceso.</li>
                    <li><strong>Revocar Invitación:</strong> Cancela invitaciones pendientes que ya no sean necesarias.</li>
                    <li><strong>Ver Permisos:</strong> Consulta los permisos específicos de cada rol en el modal "Permisos por Rol".</li>
                </ul>
            </Section>
        </div>
    </div>
);

const HowItWorksSection: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Cómo Funciona</h2>

        <Section title="Sistema de Trading Automatizado">
            <p className="text-text-secondary mb-4">
                El bot ejecuta operaciones automáticamente basándose en la estrategia Value Investing:
            </p>
            <div className="bg-background rounded-lg p-4 space-y-3">
                <div>
                    <strong className="text-primary">Horario de Ejecución (Hora de México):</strong>
                    <ul className="text-text-secondary text-sm mt-2 space-y-1">
                        <li>• 8:30 AM - Apertura de mercado</li>
                        <li>• 9:00 AM - 3:00 PM - Análisis cada hora (7 ejecuciones)</li>
                        <li>• 3:00 PM - Cierre de mercado</li>
                        <li>• 4:00 PM - Análisis post-mercado</li>
                        <li>• Total: ~10 análisis diarios automáticos</li>
                    </ul>
                </div>
                <div>
                    <strong className="text-primary">Límites de Seguridad:</strong>
                    <ul className="text-text-secondary text-sm mt-2 space-y-1">
                        <li>• Máximo 10% del capital por posición</li>
                        <li>• Stop-loss automático: -5%</li>
                        <li>• Take-profit automático: +15%</li>
                        <li>• Máximo 10 posiciones simultáneas</li>
                        <li>• Capital máximo: $10,000</li>
                    </ul>
                </div>
            </div>
        </Section>

        <Section title="Sistema de Permisos">
            <p className="text-text-secondary mb-4">
                Cada usuario tiene un rol que determina sus permisos:
            </p>
            <div className="bg-background rounded-lg p-4 space-y-3">
                <div>
                    <strong className="text-primary">Administrador:</strong>
                    <p className="text-text-secondary text-sm">Control total: iniciar/pausar bot, gestión de usuarios, visualización completa.</p>
                </div>
                <div>
                    <strong className="text-primary">Inversionista:</strong>
                    <p className="text-text-secondary text-sm">Solo visualización: Dashboard y posiciones en tiempo real (sin control del bot).</p>
                </div>
            </div>
        </Section>

        <Section title="Conexión con Alpaca API">
            <p className="text-text-secondary mb-4">
                El sistema se conecta directamente con Alpaca Markets para ejecutar operaciones reales:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Datos de mercado en tiempo real</li>
                <li>Ejecución de órdenes automáticas</li>
                <li>Gestión de posiciones y cuenta</li>
                <li>Paper trading (simulación) o trading real</li>
            </ul>
        </Section>
    </div>
);

const WhySection: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Por Qué Funciona Así</h2>

        <Section title="Beneficios del Trading Automatizado">
            <p className="text-text-secondary mb-4">
                Ventajas de usar este sistema:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong>Eliminación de Emociones:</strong> El bot ejecuta la estrategia sin miedo ni codicia.</li>
                <li><strong>Ejecución 24/7:</strong> Monitorea el mercado constantemente durante horas de trading.</li>
                <li><strong>Disciplina Absoluta:</strong> Respeta siempre los stop-loss y take-profit definidos.</li>
                <li><strong>Velocidad:</strong> Ejecuta operaciones en milisegundos, más rápido que cualquier humano.</li>
                <li><strong>Backtesting:</strong> La estrategia está probada con datos históricos.</li>
                <li><strong>Gestión de Riesgo:</strong> Límites automáticos para proteger el capital.</li>
            </ul>
        </Section>

        <Section title="Por Qué Value Investing">
            <p className="text-text-secondary mb-4">
                La estrategia Value Investing se enfoca en:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Comprar activos subvalorados por el mercado</li>
                <li>Mantener posiciones a mediano plazo</li>
                <li>Diversificación automática del portafolio</li>
                <li>Análisis fundamental automatizado</li>
            </ul>
        </Section>
    </div>
);

const FAQSection: React.FC = () => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Preguntas Frecuentes</h2>

        <div className="space-y-4">
            <FAQ
                question="¿Cómo inicio el bot de trading?"
                answer="Solo los administradores pueden iniciar el bot. Ve a 'Trading en Vivo', asegúrate de que el mercado esté abierto (9:30 AM - 4:00 PM EST), y haz clic en 'Iniciar Bot'. El bot comenzará a analizar el mercado y ejecutar operaciones automáticamente según la estrategia Value Investing."
            />

            <FAQ
                question="¿Qué pasa si el mercado está cerrado?"
                answer="Los botones de control (Iniciar, Pausar, Parada de Emergencia, Cerrar Posición) están deshabilitados cuando el mercado está cerrado. El sistema muestra una alerta indicando el horario de operación: Lunes a Viernes, 9:30 AM - 4:00 PM EST (8:30 AM - 3:00 PM hora de México)."
            />

            <FAQ
                question="¿Puedo cerrar una posición manualmente?"
                answer="Sí, los administradores pueden cerrar posiciones individuales en cualquier momento durante horas de mercado. Ve a 'Trading en Vivo', encuentra la posición en la tabla y haz clic en 'Cerrar'. La posición se venderá al precio de mercado actual."
            />

            <FAQ
                question="¿Qué hace la Parada de Emergencia?"
                answer="La Parada de Emergencia cierra TODAS las posiciones abiertas inmediatamente al precio de mercado y detiene el bot. Úsala solo en situaciones críticas. El sistema pedirá confirmación antes de ejecutarla."
            />

            <FAQ
                question="¿Cómo invito a un nuevo usuario?"
                answer="Solo los administradores pueden invitar usuarios. Ve a 'Usuarios', haz clic en 'Invitar Usuario', completa el formulario con nombre, email y rol (Administrador o Inversionista). Se generará un enlace único que expira en 7 días. Puedes copiarlo o compartirlo por WhatsApp."
            />

            <FAQ
                question="¿Qué diferencia hay entre Administrador e Inversionista?"
                answer="Administrador: puede iniciar/pausar el bot, cerrar posiciones, gestionar usuarios y ver todo el sistema. Inversionista: solo puede visualizar el Dashboard y las posiciones en tiempo real, sin control sobre el bot ni gestión de usuarios."
            />

            <FAQ
                question="¿Los datos se actualizan en tiempo real?"
                answer="Sí, tanto el Dashboard como Trading en Vivo se actualizan automáticamente cada 10 segundos con datos en tiempo real de Alpaca API. No necesitas recargar la página manualmente."
            />

            <FAQ
                question="¿Qué es Alpaca API?"
                answer="Alpaca es un broker regulado en EE.UU. que proporciona API para trading automatizado. El sistema se conecta a Alpaca para obtener datos de mercado en tiempo real y ejecutar operaciones. Puedes usar paper trading (simulación) o trading real."
            />

            <FAQ
                question="¿Cuánto capital necesito para empezar?"
                answer="Para paper trading (simulación): $0, Alpaca te da $100,000 virtuales. Para trading real: mínimo recomendado $1,000 USD. El sistema tiene límites de seguridad: máximo 20% del capital por posición y máximo 5 posiciones simultáneas."
            />

            <FAQ
                question="¿El bot opera en fines de semana?"
                answer="No, el mercado de valores NYSE/NASDAQ solo opera de Lunes a Viernes. El bot no ejecuta operaciones en fines de semana ni días festivos. Sin embargo, puedes ver tus posiciones y el Dashboard en cualquier momento."
            />

            <FAQ
                question="¿Puedo cambiar la estrategia del bot?"
                answer="Actualmente el bot usa una estrategia Value Investing predefinida con límites de seguridad fijos. Para modificar la estrategia o los parámetros, necesitas acceso al código fuente del sistema."
            />

            <FAQ
                question="¿Los datos están seguros?"
                answer="Sí, todos los datos están almacenados en Firebase con encriptación. Las credenciales de Alpaca se almacenan de forma segura en variables de entorno. El sistema usa HTTPS para todas las comunicaciones."
            />

            <FAQ
                question="¿Puedo acceder desde mi celular?"
                answer="Sí, el sistema es completamente responsive y funciona perfectamente en dispositivos móviles, tablets y computadoras de escritorio. Todas las funcionalidades están optimizadas para pantallas táctiles."
            />

            <FAQ
                question="¿Qué hago si olvidé mi contraseña?"
                answer="En la pantalla de login, haz clic en 'Olvidé mi contraseña' y sigue las instrucciones para restablecerla mediante tu correo electrónico. Recibirás un enlace de Firebase para crear una nueva contraseña."
            />
        </div>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-l-4 border-primary pl-4">
        <h3 className="text-lg font-semibold text-text-primary mb-3">{title}</h3>
        {children}
    </div>
);

const FAQ: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
    <div className="bg-background rounded-lg p-4">
        <h4 className="font-semibold text-text-primary mb-2 flex items-start gap-2">
            <FaQuestionCircle className="text-primary mt-1 flex-shrink-0" />
            {question}
        </h4>
        <p className="text-text-secondary text-sm pl-6">{answer}</p>
    </div>
);
