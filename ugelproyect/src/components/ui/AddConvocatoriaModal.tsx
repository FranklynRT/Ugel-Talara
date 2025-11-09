// src/pages/tu-pagina/components/AddConvocatoriaModal.tsx
import React from 'react';

interface AddConvocatoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddConvocatoriaModal: React.FC<AddConvocatoriaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log('Formulario enviado');
    onClose(); // Cierra el modal después de enviar
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Añadir Nueva Convocatoria</h2>
        <form onSubmit={handleSubmit}>
          {/* Aquí irían los inputs del formulario */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="puesto">
              Nombre del Puesto
            </label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" id="puesto" type="text" placeholder="Ej. Especialista en TI" />
          </div>
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddConvocatoriaModal;