// src/pages/tu-pagina/components/ConvocatoriasTable.tsx
import React from 'react';
import { Convocatoria } from '@/types'; // Usamos el tipo compartido

interface ConvocatoriasTableProps {
  convocatorias: Convocatoria[];
  onViewDetails: (convocatoria: Convocatoria) => void;
}

const ConvocatoriasTable: React.FC<ConvocatoriasTableProps> = ({ convocatorias, onViewDetails }) => {
  const estadoStyles = {
    abierta: 'bg-green-100 text-green-800',
    cerrada: 'bg-red-100 text-red-800',
    'en-proceso': 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Lista de Convocatorias</h3>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puesto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {convocatorias.map((conv) => (
            <tr key={conv.id}>
              <td className="px-6 py-4 whitespace-nowrap">{conv.puesto}</td>
              <td className="px-6 py-4 whitespace-nowrap">{conv.codigo}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoStyles[conv.estado]}`}>
                  {conv.estado}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onViewDetails(conv)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  Ver Detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConvocatoriasTable;