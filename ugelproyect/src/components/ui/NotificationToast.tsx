import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconCheck, IconAlertCircle, IconX } from '@tabler/icons-react';

// Define la estructura del objeto de notificación
interface Notification {
    title: string;
    message: string;
    isError: boolean;
}

// Define los props que el componente necesita
interface NotificationToastProps {
    showNotification: boolean;
    setShowNotification: (show: boolean) => void;
    notification: Notification;
    cardClasses: string;
    textSecondaryClasses: string;
}

export const NotificationToast = ({
    showNotification,
    setShowNotification,
    notification,
    cardClasses,
    textSecondaryClasses,
}: NotificationToastProps) => {
    // AnimatePresence permite que el componente se anime al salir del DOM
    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    key="notification-toast"
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="fixed top-6 right-6 z-[100] w-96 max-w-[90vw]"
                >
                    <div className={cn(
                        "rounded-2xl border shadow-lg overflow-hidden",
                        cardClasses,
                        notification.isError
                            ? "border-red-500/50 bg-red-500/10"
                            : "border-emerald-500/50 bg-emerald-500/10"
                    )}>
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Icono condicional (Check o Alerta) */}
                                <div className={cn(
                                    "p-3 rounded-xl",
                                    notification.isError ? "bg-red-500" : "bg-emerald-500"
                                )}>
                                    {notification.isError ? (
                                        <IconAlertCircle className="w-6 h-6 text-white" />
                                    ) : (
                                        <IconCheck className="w-6 h-6 text-white" />
                                    )}
                                </div>

                                {/* Contenido del mensaje */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "font-bold text-lg mb-1",
                                        notification.isError ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {notification.title}
                                    </h4>
                                    <p className={cn("text-sm", textSecondaryClasses)}>
                                        {notification.message}
                                    </p>
                                </div>

                                {/* Botón para cerrar */}
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className={cn("p-2 rounded-lg transition-all hover:bg-slate-700/20", textSecondaryClasses)}
                                >
                                    <IconX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Barra de progreso que indica el tiempo restante */}
                        <motion.div
                            className={cn("h-1", notification.isError ? "bg-red-500" : "bg-emerald-500")}
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 5, ease: "linear" }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};