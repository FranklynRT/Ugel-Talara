import React from 'react';
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserBlockedModalProps {
  isOpen: boolean;
  convocatoriaId: string | null;
  blockTimestamp: number | null;
  onClose: () => void;
  darkMode?: boolean;
}

const UserBlockedModal: React.FC<UserBlockedModalProps> = ({
  isOpen,
  convocatoriaId,
  blockTimestamp,
  onClose,
  darkMode = false
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden",
        darkMode && "bg-neutral-900"
      )}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, #ef4444 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              darkMode ? "text-white" : "text-gray-900"
            )}>
              Cuenta Bloqueada
            </h2>
            <p className={cn(
              "text-sm",
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>
              Tu acceso ha sido restringido temporalmente
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            <div className={cn(
              "p-4 rounded-lg border-l-4 border-red-500",
              darkMode ? "bg-red-900/20" : "bg-red-50"
            )}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    darkMode ? "text-red-300" : "text-red-800"
                  )}>
                    Postulación Completada
                  </p>
                  <p className={cn(
                    "text-sm mt-1",
                    darkMode ? "text-red-200" : "text-red-700"
                  )}>
                    Has completado tu postulación y tu cuenta ha sido bloqueada por seguridad.
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-lg",
              darkMode ? "bg-neutral-800" : "bg-gray-50"
            )}>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    darkMode ? "text-blue-300" : "text-blue-800"
                  )}>
                    Bloqueado desde
                  </p>
                  <p className={cn(
                    "text-sm mt-1",
                    darkMode ? "text-blue-200" : "text-blue-700"
                  )}>
                    {blockTimestamp ? formatDate(blockTimestamp) : 'Fecha no disponible'}
                  </p>
                </div>
              </div>
            </div>

            {convocatoriaId && (
              <div className={cn(
                "p-4 rounded-lg",
                darkMode ? "bg-neutral-800" : "bg-gray-50"
              )}>
                <p className={cn(
                  "text-sm",
                  darkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  <span className="font-medium">Convocatoria:</span> {convocatoriaId}
                </p>
              </div>
            )}
          </div>

          {/* Information */}
          <div className={cn(
            "p-4 rounded-lg border",
            darkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"
          )}>
            <h3 className={cn(
              "font-medium text-sm mb-2",
              darkMode ? "text-blue-300" : "text-blue-800"
            )}>
              ¿Cuándo podrás acceder nuevamente?
            </h3>
            <p className={cn(
              "text-sm",
              darkMode ? "text-blue-200" : "text-blue-700"
            )}>
              Tu cuenta será desbloqueada automáticamente cuando la convocatoria específica <span className="font-semibold">{convocatoriaId || 'actual'}</span> sea deshabilitada por el administrador.
            </p>
            <p className={cn(
              "text-xs mt-2",
              darkMode ? "text-blue-300" : "text-blue-600"
            )}>
              El sistema verificará automáticamente el estado de tu convocatoria cada 30 segundos.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-all duration-200",
                darkMode 
                  ? "bg-neutral-700 text-white hover:bg-neutral-600" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              )}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBlockedModal;
