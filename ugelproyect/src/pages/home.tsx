import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogIn, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Shield,
  Users,
  Award,
  CheckCircle
} from "lucide-react";
import TextType from "@/components/TextType";
// Importar imágenes del carrusel
import carousel1 from "@/imagenes/carousel-1.jpg";
import carousel2 from "@/imagenes/carousel-2.jpg";
import carousel3 from "@/imagenes/carousel-3.jpg";
import carousel4 from "@/imagenes/carousel-4.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Imágenes del carrusel - Las imágenes están en src/imagenes/
  const carouselImages = [
    {
      url: carousel1,
      title: "Sistema de Gestión Educativa",
      subtitle: "Innovación que transforma realidades",
    },
    {
      url: carousel2,
      title: "UGEL Talara",
      subtitle: "Compromiso con la educación",
    },
    {
      url: carousel3,
      title: "Vela por el buen servicio de la calidad educativa.",
      subtitle: "Cambio y la Mejora de la Educación",
    },
    {
      url: carousel4,
      title: "Experiencia Laboral",
      subtitle: "Diseño que marca la diferencia",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);

  const features = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Gestión Integral",
      description: "Sistema completo que centraliza convocatorias, postulaciones, evaluaciones y certificados. Todo en un solo lugar, sin complicaciones ni trámites engorrosos. Simplifica tu experiencia laboral.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Seguro y Confiable",
      description: "Tus datos están protegidos con tecnología de última generación. Encriptación avanzada, respaldo automático y cumplimiento de normativas de seguridad. Confía en un sistema respaldado por UGEL Talara.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Acceso Multiperfil",
      description: "Diseñado para todos los usuarios: postulantes, administradores y comités evaluadores. Cada perfil tiene acceso personalizado a las herramientas que necesita para cumplir sus objetivos.",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Proceso Transparente",
      description: "Seguimiento en tiempo real de tu postulación, desde la convocatoria hasta el certificado final. Sin sorpresas, sin burocracia. Transparencia total en cada etapa del proceso CAS.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100"
    >
      {/* Hero Section con Carrusel */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Carrusel de Imágenes */}
        <div className="absolute inset-0 z-0">
          <div className="relative h-full w-full">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                  index === currentSlide
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-110 z-0"
                }`}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.image-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'image-placeholder w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center';
                      placeholder.innerHTML = `<div class="text-white text-center p-8"><h3 class="text-2xl font-bold mb-2">${image.title}</h3><p class="text-lg opacity-90">${image.subtitle}</p></div>`;
                      parent.appendChild(placeholder);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-800/50 to-transparent"></div>
                <div className="absolute bottom-20 left-8 right-8 text-white z-20">
                  <h2 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5)' }}>
                    {image.title}
                  </h2>
                  <p className="text-xl md:text-2xl opacity-90 drop-shadow-md" style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)' }}>
                    {image.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 border border-white/50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/50 border border-white/50 transition-all"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${
                  index === currentSlide
                    ? "bg-white border-white scale-125"
                    : "bg-transparent border-white/50 hover:border-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="relative z-20 w-full max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl"
              style={{ textShadow: '3px 3px 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)' }}
            >
              <TextType
                text={["CONTRATACIÓN CAS", "INNOVATE", "UGEL TALARA"]}
                typingSpeed={100}
                pauseDuration={2000}
                showCursor
                cursorCharacter="|"
              />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-4 drop-shadow-lg"
              style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)' }}
            >
              Sistema Virtual de Contratación CAS - UGEL TALARA
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-white/80 mb-8 drop-shadow-lg max-w-3xl mx-auto"
              style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8)' }}
            >
              Plataforma digital innovadora que simplifica y agiliza todo el proceso de contratación administrativa de servicios. 
              Ahorra tiempo, reduce trámites y garantiza transparencia en cada etapa.
            </motion.p>
          </div>

          {/* Botones de Acceso */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-2xl mx-auto"
          >
            <button
              onClick={() => navigate("/login")}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white font-semibold text-lg rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 focus:ring-4 focus:ring-blue-500/50 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl border border-blue-500/30 flex items-center justify-center gap-3"
            >
              <LogIn className="w-6 h-6" />
              <span>Acceder</span>
            </button>
            <button
              onClick={() => navigate("/registrar")}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white/95 backdrop-blur-sm text-blue-700 font-semibold text-lg rounded-xl hover:bg-white focus:ring-4 focus:ring-white/50 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl border-2 border-white/50 flex items-center justify-center gap-3"
            >
              <UserPlus className="w-6 h-6" />
              <span>Registrarse</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Sección de Características */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
              ¿Por qué elegir nuestro sistema?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
              La solución más completa y moderna para la gestión de contrataciones CAS. 
            </p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto">
              Miles de postulantes ya confían en nuestra plataforma para acelerar su carrera profesional en el sector educativo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105 h-full flex flex-col"
              >
                <div className="text-blue-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center text-sm leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de Información Adicional */}
      <div className="relative z-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Comienza tu camino profesional hoy
            </h2>
            <p className="text-xl mb-4 text-white/90 max-w-3xl mx-auto">
              Únete a cientos de profesionales que ya están transformando su futuro laboral con nuestro sistema de contratación CAS.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Registro rápido y sencillo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Proceso 100% digital</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Soporte técnico incluido</span>
              </div>
            </div>
            <p className="text-lg mb-8 text-white/80 max-w-2xl mx-auto">
              No pierdas más tiempo en trámites complicados. Accede ahora y completa tu postulación en minutos, no en días.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 bg-white text-blue-700 font-semibold text-lg rounded-xl hover:bg-blue-50 focus:ring-4 focus:ring-white/50 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center gap-3"
              >
                <LogIn className="w-6 h-6" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                onClick={() => navigate("/registrar")}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold text-lg rounded-xl hover:bg-white/10 focus:ring-4 focus:ring-white/50 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center gap-3"
              >
                <UserPlus className="w-6 h-6" />
                <span>Crear Cuenta</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;

