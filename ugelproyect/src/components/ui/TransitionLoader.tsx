// Ruta: @/components/ui/TransitionLoader.tsx

"use client";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

// --- ¡CORRECCIÓN IMPORTANTE! ---
// Importa el componente LoaderThree desde tu archivo de loaders
import { LoaderThree } from "@/components/ui/loader"; // <-- Ajusta esta ruta si es necesario

// (Ya no definimos LoaderThree aquí dentro)

export const TransitionLoader = ({ show }: { show: boolean }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[200]"
        >
          {/* Ahora esto usa el componente importado con la animación completa */}
          <LoaderThree />
        </motion.div>
      )}
    </AnimatePresence>
  );
};