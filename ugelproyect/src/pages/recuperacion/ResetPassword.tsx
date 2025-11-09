// Ruta: src/pages/recuperacion/ResetPassword.tsx

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft, XCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

// Importa tu imagen de seguridad aquí
// Asegúrate de que la ruta sea correcta según donde guardes tu imagen.
// Ejemplo: import securityIllustration from '@/assets/security-reset.svg'; 
// O si es un .png: import securityIllustration from '@/assets/security-reset.png';
import securityIllustration from '../../imagenes/icons.png';

import { API_BASE_URL } from '@/lib/api';

// --- Componente de Requisitos de Contraseña ---
const PasswordRequirements = ({ password }: { password: string }) => {
    const requirements = [
        { text: "Mínimo 8 caracteres", regex: /.{8,}/ },
        { text: "Una letra mayúscula (A-Z)", regex: /[A-Z]/ },
        { text: "Una letra minúscula (a-z)", regex: /[a-z]/ },
        { text: "Un número (0-9)", regex: /[0-9]/ },
    ];

    return (
        <div className="space-y-2 mt-4 text-sm">
            {/* Texto: De gris claro (300) a gris más oscuro (700) */}
            <p className="font-semibold text-gray-700">Tu contraseña debe incluir:</p>
            <ul className="space-y-1">
                {requirements.map((req, index) => {
                    const isValid = req.regex.test(password);
                    return (
                        <motion.li 
                            key={index} 
                            // Texto: De verde/gris claro (400) a verde/gris oscuro (600/500)
                            className={`flex items-center gap-2 transition-colors duration-300 ${isValid ? 'text-green-600' : 'text-gray-500'}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {/* Icono: De verde (500) a verde (500) | De rojo (400/50) a gris (400) */}
                            {isValid ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-gray-400" />}
                            <span>{req.text}</span>
                        </motion.li>
                    );
                })}
            </ul>
        </div>
    );
};

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword1, setShowPassword1] = useState(false); // Para la primera casilla
    const [showPassword2, setShowPassword2] = useState(false); // Para la segunda casilla
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const { token } = useParams();
    const navigate = useNavigate();

    // Función para validar la contraseña según los requisitos
    const isPasswordValid = () => {
        const requirements = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/];
        return requirements.every(regex => regex.test(password));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('El enlace para restablecer la contraseña es inválido o ha expirado.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (!isPasswordValid()) {
            setError('La contraseña no cumple con todos los requisitos de seguridad.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ password })
            });

            const contentType = res.headers.get('content-type') || '';
            let data: any = null;

            if (contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const text = await res.text();
                if (!res.ok) {
                    throw new Error(text || 'Respuesta no válida del servidor.');
                }
            }

            if (!res.ok) {
                const message = (data && (data.message || data.error)) || 'El token es inválido o ha expirado.';
                throw new Error(message);
            }

            setSuccess(true);
            setTimeout(() => navigate('/'), 4000);

        } catch (err: any) {
            setError(err?.message || 'Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Fondo: De gradiente oscuro a gris claro
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* Tarjeta: De oscuro/blur a blanco sólido */}
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/75 p-8 lg:p-12">
                <AnimatePresence mode="wait">
                    {!success ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* --- IMAGEN DECORATIVA --- */}
                            <div className="flex justify-center mb-6">
                                <img
                                    src={securityIllustration}
                                    alt="Ilustración de seguridad"
                                    // Opacidad: De 90 a 100
                                    className="w-40 h-40 object-contain opacity-100" 
                                />
                            </div>
                            <div className="text-center mb-8">
                                {/* Título: De blanco a texto oscuro */}
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Restablece tu Contraseña</h2>
                                {/* Subtítulo: De gris claro (400) a gris oscuro (600) */}
                                <p className="text-gray-600">La seguridad de tu cuenta es nuestra prioridad.</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    // Error: De rojo sobre oscuro a rojo sobre claro
                                    className="bg-red-100 text-red-700 p-3 rounded-xl mb-6 text-center text-sm flex items-center gap-2 border border-red-200"
                                >
                                    <AlertTriangle size={18} /> {error}
                                </motion.div>
                            )}
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        {/* Icono: De gris (hover blanco) a gris (hover azul) */}
                                        <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-600" size={20} />
                                        <input
                                            type={showPassword1 ? 'text' : 'password'} 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Nueva contraseña"
                                            // Input: De oscuro a claro
                                            className="w-full pl-12 pr-12 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        {/* Botón Ojo: De gris (hover blanco) a gris (hover azul) */}
                                        <button type="button" onClick={() => setShowPassword1(!showPassword1)} className="absolute right-4 top-4 text-gray-400 hover:text-blue-600">
                                            {showPassword1 ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    
                                    {/* --- LISTA DE REQUISITOS (se muestra al empezar a escribir) --- */}
                                    {password.length > 0 && <PasswordRequirements password={password} />}
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-600" size={20} />
                                    <input
                                        type={showPassword2 ? 'text' : 'password'} 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmar nueva contraseña"
                                        className="w-full pl-12 pr-12 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                     <button type="button" onClick={() => setShowPassword2(!showPassword2)} className="absolute right-4 top-4 text-gray-400 hover:text-blue-600">
                                        {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {/* Botón: De gradiente azul/morado a azul sólido */}
                                <button type="submit" disabled={isLoading || (password.length > 0 && !isPasswordValid()) || (password.length > 0 && password !== confirmPassword)} className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                             {/* Icono Éxito: (Se mantiene igual, se ve bien) */}
                             <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            {/* Título: De blanco a texto oscuro */}
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Contraseña Actualizada!</h2>
                            {/* Subtítulo: De gris claro (400) a gris oscuro (600) */}
                            <p className="text-gray-600 text-base leading-relaxed mb-6">Tu contraseña se cambió con éxito. Serás redirigido en unos segundos.</p>
                            {/* Link: De gris (hover blanco) a gris (hover azul) */}
                            <Link to="/" className="mt-8 w-full py-3 text-gray-500 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2 group">
                                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                <span>Volver al Login</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}