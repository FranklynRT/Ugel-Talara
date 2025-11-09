import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconInfoCircle, IconUpload, IconTrendingUp, IconShield, IconFileText, IconClock, IconBriefcase, IconCertificate } from '@tabler/icons-react'; // Add IconCertificate
import { UgelTalaraLogo } from '@/components/icons';
import React, { useState, useEffect } from 'react'; // Import useState and useEffect

// New Notification Component (reused from CurriculumSection)
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  if (!message || !type) return null;

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
  const textColor = 'text-white';

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-4 max-w-md w-full",
        bgColor,
        textColor
      )}
    >
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
        &times;
      </button>
    </div>
  );
};

interface IntroduccionSectionProps {
  setActiveSection: (section: string) => void;
  cardClasses: string; // <-- Asegúrate de que sean requeridos
  textClasses: string; // <-- Asegúrate de que sean requeridos
  textSecondaryClasses: string; // <-- Asegúrate de que sean requeridos
  darkMode: boolean; // <-- Asegúrate de que sea requerido
  // Removed authToken and userName as certificate download is moved
}

const features = [
    { icon: <IconInfoCircle className="w-8 h-8" />, title: "Información Completa", description: "Consulta convocatorias vigentes, requisitos y plazos del proceso CAS.", gradient: "from-blue-500 to-cyan-400" },
    { icon: <IconUpload className="w-8 h-8" />, title: "Postulación Digital", description: "Presenta tu documentación y regístrate en los concursos de manera digital.", gradient: "from-emerald-500 to-teal-400" },
    { icon: <IconTrendingUp className="w-8 h-8" />, title: "Seguimiento en Tiempo Real", description: "Monitorea el estado de tu postulación: admitido, calificado, seleccionado.", gradient: "from-purple-500 to-pink-400" },
    { icon: <IconShield className="w-8 h-8" />, title: "Seguridad Garantizada", description: "Tus datos están protegidos con los más altos estándares de seguridad.", gradient: "from-orange-500 to-red-400" },
    { icon: <IconFileText className="w-8 h-8" />, title: "Resultados Oficiales", description: "Accede a listas de resultados y resoluciones finales publicadas.", gradient: "from-indigo-500 to-blue-400" },
    { icon: <IconClock className="w-8 h-8" />, title: "Disponible 24/7", description: "Sistema disponible las 24 horas del día, los 7 días de la semana.", gradient: "from-green-500 to-emerald-400" }
];

export const IntroduccionSection = ({ setActiveSection, cardClasses, textClasses, textSecondaryClasses, darkMode }: IntroduccionSectionProps) => {
  // Removed notification state and useEffect as certificate download is moved

  // Removed handleDownloadCertificate function

  return (
    <motion.section
      key="introduccion"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <div className="text-center mb-12">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-block p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl mb-6"
        >
            <UgelTalaraLogo className={cn("w-16 h-16", darkMode ? "text-blue-400" : "text-blue-600")} />
        </motion.div>
        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
                "text-4xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent",
                darkMode 
                    ? "bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300"
                    : "bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"
            )}
        >
            Sistema CAS UGEL Talara
        </motion.h1>
        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={cn("text-xl max-w-3xl mx-auto", textSecondaryClasses)} 
        >
            Plataforma moderna para la gestión de convocatorias del Contrato Administrativo de Servicios.
        </motion.p>
        
        {/* Removed Download Certificate Button */}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={cn("relative p-6 rounded-3xl shadow-lg group cursor-pointer overflow-hidden", cardClasses)} 
          >
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300", feature.gradient)} />
            <div className="relative z-10 flex flex-col h-full">
                <div className={cn("p-3 rounded-2xl w-fit mb-4 bg-gradient-to-r", feature.gradient)}>
                    <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className={cn("text-xl font-bold mb-3", textClasses)}>{feature.title}</h3> 
                <p className={cn("text-sm leading-relaxed", textSecondaryClasses)}>{feature.description}</p> 
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className={cn("text-center p-8 rounded-3xl shadow-lg border relative overflow-hidden", cardClasses)} 
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10" />
        <div className="relative z-10">
            <h3 className={cn("text-2xl font-bold mb-4", textClasses)}>¿Listo para comenzar tu postulación?</h3> 
            <p className={cn("mb-6", textSecondaryClasses)}>Inicia tu proceso de postulación y forma parte del equipo UGEL Talara.</p> 
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection('convocatorias')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/20 transition-all"
            >
                <div className="flex items-center gap-2">
                    <IconBriefcase />
                    <span>Explorar Convocatorias</span>
                </div>
            </motion.button>
        </div>
      </motion.div>
      {/* Removed Notification Component */}
    </motion.section>
  );
};