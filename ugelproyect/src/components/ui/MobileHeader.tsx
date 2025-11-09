import React from 'react';
import { IconMenu } from '@tabler/icons-react';

// Define los props que el componente necesita recibir.
interface MobileHeaderProps {
    setSidebarOpen: (isOpen: boolean) => void;
    activeSectionLabel: string;
}

export const MobileHeader = ({ setSidebarOpen, activeSectionLabel }: MobileHeaderProps) => {
    return (
        // La clase "lg:hidden" hace que este componente DESAPAREZCA en pantallas grandes.
        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/30 sticky top-0 z-20">
            {/* Botón para abrir el menú (Sidebar) */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg bg-slate-700/30"
            >
                <IconMenu className="w-6 h-6 text-slate-300" />
            </button>

            {/* Título de la sección activa */}
            <h2 className="text-lg font-semibold text-slate-100">
                {activeSectionLabel}
            </h2>

            {/* Un div vacío para centrar el título correctamente */}
            <div className="w-10" />
        </div>
    );
};