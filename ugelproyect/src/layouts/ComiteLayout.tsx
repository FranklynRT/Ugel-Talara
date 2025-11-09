import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import { Users, FileText, CheckCircle, Search, LogOut, UserCircle, Sun, Moon } from 'lucide-react'; // Removed Settings, TrendingUp, Star
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';

interface ComiteSidebarProps {
    children: React.ReactNode; // Explicitly define children type
}

const ComiteSidebar = ({ children }: ComiteSidebarProps) => {
    const { logout, user } = useAuth(); // Added user to useAuth
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark');
    const [userProfileData, setUserProfileData] = useState<any>(null);
    const [localProfilePictureUrl, setLocalProfilePictureUrl] = useState<string | null>(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Authentication token is missing.");
            return null;
        }
        return { 'Authorization': `Bearer ${token}` };
    };

    const fetchUserProfile = async () => {
        const headers = getAuthHeaders();
        if (!headers) {
            return;
        }
        
        try {
            console.log("Frontend: Obteniendo datos del usuario en ComiteLayout...");
            const userId = (user as any)?.id;
            const url = userId ? `${API_BASE_URL}/users/${userId}` : `${API_BASE_URL}/users`;
            const response = await fetch(url, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                    ...headers 
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const ct = response.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                throw new SyntaxError('Respuesta no JSON del servidor');
            }
            const data = await response.json();
            console.log("Frontend: Datos del usuario obtenidos en ComiteLayout:", data);
            const userData = Array.isArray(data) ? data[0] : data;
            setUserProfileData(userData);
            
            // Obtener la URL de la foto de perfil desde diferentes posibles ubicaciones
            const profilePictureUrl = userData?.profilePictureUrl || 
                                     userData?.profilePicture || 
                                     userData?.user?.profilePicture || 
                                     userData?.user?.fotoperfil ||
                                     (userData?.profilePicture ? `${API_BASE_URL.replace('/ugel-talara', '')}/ugel-talara/uploads/profiles/${userData.profilePicture}` : null);
            
            if (profilePictureUrl) {
                setLocalProfilePictureUrl(profilePictureUrl);
                localStorage.setItem('userProfilePicture', profilePictureUrl);
            }
        } catch (err) {
            console.error("Error fetching user profile in ComiteLayout:", err);
            setUserProfileData(null);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        
        // Cargar foto de perfil guardada localmente
        const savedProfilePicture = localStorage.getItem('userProfilePicture');
        if (savedProfilePicture) {
            setLocalProfilePictureUrl(savedProfilePicture);
        }
        // Aplicar tema persistido
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('comite-theme', theme);
    }, [user, theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    const handleLogout = async () => {
        setIsLoggingOut(true); // Show loading state
        try {
            // Clear authentication data
            localStorage.removeItem('token'); // Remove token if used
            // Redirect to login page
            logout(); // Usar la función de logout del AuthContext
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Error al cerrar sesión. Inténtalo de nuevo.');
        } finally {
            setIsLoggingOut(false); // Reset loading state
        }
    };

    return (
        <div className={`${theme === 'dark' ? 'bg-black' : 'bg-white'} min-h-screen w-full relative transition-colors`}>
            {/* Deep Ocean Glow */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: theme === 'dark'
                        ? "radial-gradient(70% 55% at 50% 50%, #2a5d77 0%, #184058 18%, #0f2a43 34%, #0a1b30 50%, #071226 66%, #040d1c 80%, #020814 92%, #01040d 97%, #000309 100%), radial-gradient(160% 130% at 10% 10%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%), radial-gradient(160% 130% at 90% 90%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%)"
                        : "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)" // gray-50 -> gray-200
                }}
            />

            <div className="relative z-10 flex">
                {/* Sidebar */}
                <div className={`fixed left-0 top-0 w-64 h-full ${theme === 'dark' ? 'bg-gray-900/80 border-cyan-500/20' : 'bg-white/80 border-blue-200'} backdrop-blur-xl border-r z-10`}>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-white" />
                            </div>
                            <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Comite de Contratación Cas</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`mb-6 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                theme === 'dark' 
                                    ? 'border-cyan-500/30 text-cyan-300 hover:bg-gray-800/50' 
                                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                            }`}
                            title="Cambiar tema"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
                        </button>

                        {/* Búsqueda rápida eliminada por solicitud */}

                        <nav className="space-y-2">
                            <NavLink
                                to="/comite"
                                className={({ isActive }) =>
                                    theme === 'dark'
                                        ? `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-gray-800/50 text-gray-300'}`
                                        : `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-blue-50 text-slate-700'}`
                                }
                            >
                                <Users className="w-4 h-4" />
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/comite/evaluaciones"
                                className={({ isActive }) =>
                                    theme === 'dark'
                                        ? `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-gray-800/50 text-gray-300'}`
                                        : `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-blue-50 text-slate-700'}`
                                }
                            >
                                <FileText className="w-4 h-4" />
                                Evaluaciones
                            </NavLink>
                            <NavLink
                                to="/comite/reportes" // Assuming a reports route
                                className={({ isActive }) =>
                                    theme === 'dark'
                                        ? `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-gray-800/50 text-gray-300'}`
                                        : `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-blue-50 text-slate-700'}`
                                }
                            >
                                <CheckCircle className="w-4 h-4" />
                                Reportes
                            </NavLink>
                            <NavLink
                                to="/comite/perfil"
                                className={({ isActive }) =>
                                    theme === 'dark'
                                        ? `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' : 'hover:bg-gray-800/50 text-gray-300'}`
                                        : `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-blue-50 text-slate-700'}`
                                }
                            >
                                <UserCircle className="w-4 h-4" />
                                Perfil
                            </NavLink>
                        </nav>
                    </div>

                    <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-800/90' : 'border-gray-300 bg-white'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            {localProfilePictureUrl ? (
                                <img
                                    src={localProfilePictureUrl}
                                    alt="Foto de perfil"
                                    className={`w-12 h-12 rounded-full object-cover border-2 ${theme === 'dark' ? 'border-cyan-400' : 'border-cyan-500'} shadow-lg`}
                                    onError={(e) => {
                                        // Si la imagen falla al cargar, usar el ícono por defecto
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className={`w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-2 ${theme === 'dark' ? 'border-cyan-400' : 'border-cyan-500'} shadow-lg`}>
                                    <UserCircle className="w-6 h-6 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'} truncate`}>
                                    {userProfileData?.nombreCompleto || userProfileData?.nombre_completo || userProfileData?.nombre || user?.nombreCompleto || user?.nombre_completo || user?.nombre || 'Usuario'}
                                </div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-cyan-300' : 'text-blue-600'} truncate font-medium`}>
                                    {userProfileData?.email || userProfileData?.correo || user?.email || user?.correo || 'email@example.com'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`flex items-center justify-center gap-2 px-4 py-3 w-full rounded-lg border-2 transition-all font-semibold shadow-lg ${theme === 'dark' 
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 hover:from-red-700 hover:to-red-800 hover:shadow-red-500/50' 
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 hover:from-red-600 hover:to-red-700 hover:shadow-red-400/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={isLoggingOut}
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 ml-64 p-6 relative z-10 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} min-h-screen overflow-y-auto`}> {/* Ensure full-page and scroll */}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ComiteSidebar;
