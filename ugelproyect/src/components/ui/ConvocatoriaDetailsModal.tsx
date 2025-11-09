// src/pages/tu-pagina/components/ConvocatoriaDetailsModal.tsx
import React from 'react';
import { Convocatoria } from '@/types';

interface ConvocatoriaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  convocatoria: Convocatoria | null;
}

const ConvocatoriaDetailsModal: React.FC<ConvocatoriaDetailsModalProps> = ({ isOpen, onClose, convocatoria }) => {
  if (!isOpen || !convocatoria) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{convocatoria.puesto}</h2>
        <p className="text-gray-600 mb-2"><strong>Código:</strong> {convocatoria.codigo}</p>
        <p className="text-gray-600 mb-2"><strong>Estado:</strong> <span className="capitalize">{convocatoria.estado}</span></p>
        <p className="text-gray-600 mb-2"><strong>Plazas:</strong> {convocatoria.cantidad}</p>
        <p className="text-gray-600 mb-2"><strong>Periodo:</strong> {convocatoria.fechaInicio} al {convocatoria.fechaFin}</p>
        <div className="mt-4 pt-4 border-t">
          <h3 className="font-semibold">Detalles:</h3>
          <p className="text-gray-700 mt-2">{convocatoria.detalles}</p>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvocatoriaDetailsModal;