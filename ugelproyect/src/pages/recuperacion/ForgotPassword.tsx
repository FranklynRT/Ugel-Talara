import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle, Shield, AlertTriangle } from 'lucide-react';
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

// Componente para el efecto de escritura
// (Sin cambios, ya que hereda el color)
const TextType = ({ text, typingSpeed = 75, pauseDuration = 1500, showCursor = true, cursorCharacter = "|" }: any) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isTyping) {
                if (currentText.length < text[currentTextIndex].length) {
                    setCurrentText(text[currentTextIndex].slice(0, currentText.length + 1));
                } else {
                    setTimeout(() => setIsTyping(false), pauseDuration);
                }
            } else {
                if (currentText.length > 0) {
                    setCurrentText(currentText.slice(0, -1));
                } else {
                    setCurrentTextIndex((prevIndex) => (prevIndex + 1) % text.length);
                    setIsTyping(true);
                }
            }
        }, isTyping ? typingSpeed : typingSpeed / 2);

        return () => clearTimeout(timer);
    }, [currentText, currentTextIndex, isTyping, text, typingSpeed, pauseDuration]);

    return (
        <span className="inline-block min-h-[1.2em]">
            {currentText}
            {showCursor && <span className="animate-pulse ml-1">{cursorCharacter}</span>}
        </span>
    );
};

const API_URL = "http://localhost:9000/ugel-talara";

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // 1: Form, 2: Success
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Primero verificar el rol del usuario
            const checkUserRes = await fetch(`${API_URL}/users/check-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const userData = await checkUserRes.json();

            if (!checkUserRes.ok) {
                if (checkUserRes.status === 404) {
                    throw new Error('No se encontró un usuario con este correo electrónico.');
                } else {
                    throw new Error(userData.message || 'Error al verificar el usuario.');
                }
            }

            // Verificar que el usuario sea postulante
            if (userData.rol !== 'postulante') {
                throw new Error('Solo los usuarios postulantes pueden recuperar su contraseña. Tu rol actual es: ' + userData.rol);
            }

            // Si es postulante, proceder con el envío del correo
            const res = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email,
                    role: 'postulante'
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error al enviar el correo de recuperación.');
            }
            setStep(2);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Fondo principal: De gradiente oscuro a un gris muy claro
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* Tarjeta principal: De fondo oscuro/blur a blanco sólido */}
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/75">
                <div className="flex flex-col lg:flex-row min-h-[600px]">

                    {/* --- FORMULARIO - LADO IZQUIERDO --- */}
                    <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full max-w-md"
                            >
                                {step === 1 ? (
                                    <div>
                                        <div className="text-center mb-10">
                                            <div className="flex justify-center mb-4">
                                                {/* Icono: De gradiente gris a gradiente azul */}
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border border-blue-300/50">
                                                    {/* Icono: De texto blanco a texto blanco (sigue viéndose bien) */}
                                                    <Shield className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            {/* Título: De texto blanco a texto oscuro */}
                                            <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h2>
                                            {/* Subtítulo: De gris claro (400) a gris más oscuro (600) */}
                                            <p className="text-gray-600">Solo usuarios postulantes pueden recuperar su contraseña. Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
                                        </div>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                                // Error: De rojo claro sobre fondo oscuro a rojo oscuro sobre fondo claro
                                                className="bg-red-100 text-red-700 p-3 rounded-xl mb-6 text-center text-sm flex items-center gap-2 border border-red-200"
                                            >
                                                <AlertTriangle size={18} /> {error}
                                            </motion.div>
                                        )}
                                        
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="relative group">
                                                {/* Icono Input: De gris claro a gris (y azul en focus) */}
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600" size={20} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="tu.correo@ejemplo.com"
                                                    // Input: De fondo oscuro a fondo blanco con borde claro
                                                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            {/* Botón: De gradiente azul/morado a azul sólido */}
                                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-wait">
                                                {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                                            </button>
                                            {/* Link: De gris claro (hover blanco) a gris (hover azul) */}
                                            <Link to="/" className="w-full py-3 text-gray-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 group">
                                                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Volver al inicio de sesión
                                            </Link>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                            <CheckCircle className="w-10 h-10 text-white" />
                                        </div>
                                        {/* Título: De blanco a texto oscuro */}
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Correo enviado!</h2>
                                        {/* Subtítulo: De gris claro (400) a gris más oscuro (600) */}
                                        <p className="text-gray-600 text-base leading-relaxed mb-6">Hemos enviado un enlace de recuperación al postulante registrado en:</p>
                                        {/* Caja Email: De fondo oscuro a fondo gris claro */}
                                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-8">
                                            {/* Email: De texto blanco a texto oscuro */}
                                            <p className="text-gray-900 font-medium break-all">{email}</p>
                                        </div>
                                        {/* Helper Text: De gris 500 a gris 600 */}
                                        <p className="text-gray-600 text-sm leading-relaxed">Revisa tu bandeja de entrada (y spam). El enlace es válido por 15 minutos.</p>
                                        {/* Link: De gris claro (hover blanco) a gris (hover azul) */}
                                        <Link to="/" className="mt-8 w-full py-3 text-gray-500 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2 group">
                                            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                                            <span>Volver al Login</span>
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* --- ILUSTRACIÓN - LADO DERECHO --- */}
                    {/* Fondo: De gradiente oscuro a gradiente azul */}
                    <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 hidden lg:flex items-center justify-center p-8">
                        {/* Overlay: De oscuro/colorido a blanco sutil */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 40%), radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.2), transparent 40%)` }}></div>
                        <div className="relative z-10 text-center">
                            {/* Texto: Sigue siendo blanco (sobre fondo azul) */}
                            <h1 className="text-3xl font-bold text-white mb-6 tracking-wider">
                                <TextType 
                                    text={["CONTRATACIÓN CAS", "UGEL TALARA"]}
                                    typingSpeed={100}
                                    pauseDuration={2500}
                                />
                            </h1>
                            {/* Divisor: De gradiente azul/morado a blanco translúcido */}
                            <div className="w-24 h-1 bg-white/50 mx-auto rounded-full mb-12"></div>
                            <div className="relative mb-8 flex justify-center">
                                {/* Círculos: Siguen siendo blancos (sobre fondo azul) */}
                                <div className="absolute w-64 h-64 border-2 border-white/10 rounded-full animate-pulse"></div>
                                <div className="absolute w-80 h-80 border border-white/5 rounded-full animate-pulse delay-300"></div>
                                {/* Fondo Icono: De gradiente gris a blanco translúcido (efecto "glass") */}
                                <div className="w-48 h-48 bg-white/10 rounded-full shadow-2xl flex items-center justify-center border border-white/20">
                                    {/* Icono: Sigue siendo blanco */}
                                    <Shield className="w-24 h-24 text-white/80" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="text-white space-y-4 max-w-sm mx-auto">
                                <h3 className="text-2xl font-bold">Seguridad Garantizada</h3>
                                {/* Texto: De gris 300 a azul 100 (para mejor contraste con el título blanco) */}
                                <p className="text-blue-100 text-sm leading-relaxed">Tu información está protegida con los más altos estándares de seguridad.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}