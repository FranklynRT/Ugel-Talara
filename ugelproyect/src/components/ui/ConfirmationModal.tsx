import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconAlertCircle } from '@tabler/icons-react';

// Define los props que el componente modal necesita
interface ConfirmationModalProps {
    showConfirmModal: boolean;
    setShowConfirmModal: (show: boolean) => void;
    confirmAnexoSubmission: () => void;
    cardClasses: string;
    textClasses: string;
    textSecondaryClasses: string;
    darkMode: boolean;
}

export const ConfirmationModal = ({
    showConfirmModal,
    setShowConfirmModal,
    confirmAnexoSubmission,
    cardClasses,
    textClasses,
    textSecondaryClasses,
    darkMode
}: ConfirmationModalProps) => {
    return (
        <AnimatePresence>
            {showConfirmModal && (
                <motion.div
                    key="confirmation-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    // Fondo oscuro y borroso que cubre toda la pantalla
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        // El panel del modal
                        className={cn(
                            "w-full max-w-md rounded-3xl border shadow-lg overflow-hidden",
                            cardClasses
                        )}
                    >
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                    className="inline-block p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl mb-4"
                                >
                                    <IconAlertCircle className="w-12 h-12 text-amber-400" />
                                </motion.div>
                                <h3 className={cn("text-2xl font-bold mb-2", textClasses)}>
                                    Confirmar Envío
                                </h3>
                                <p className={cn("text-sm", textSecondaryClasses)}>
                                    ¿Está seguro de que desea procesar y descargar este anexo con la información proporcionada?
                                </p>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-4">
                                <motion.button
                                    onClick={() => setShowConfirmModal(false)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className={cn(
                                        "flex-1 p-4 rounded-2xl font-semibold border-2 transition-all",
                                        darkMode
                                            ? "border-slate-600 bg-slate-700/30 text-slate-300 hover:bg-slate-700/50"
                                            : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    onClick={confirmAnexoSubmission}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-1 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Confirmar
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};