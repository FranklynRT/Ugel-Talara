// src/components/modals/FormModal.tsx
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { ConvocatoriaFormData, LicenciaturaStatus } from '../../types';

interface FormModalProps {
  areas: string[];
  onClose: () => void;
  onSubmit: (formData: ConvocatoriaFormData) => void;
}

const FormModal: React.FC<FormModalProps> = ({ areas, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<ConvocatoriaFormData>({
    area: '',
    puesto: '',
    sueldo: '',
    requisitos: '',
    experiencia: '',
    licenciatura: 'No',
    habilidades: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>): void => {
      e.preventDefault();
      // validación simple
      if(!formData.area || !formData.puesto) {
          alert("Por favor, complete los campos de Área y Puesto.");
          return;
      }
      onSubmit(formData);
  }

  // El JSX no cambia, pero ahora los eventos como `onChange` están tipados.
  return (
    <div className="fixed inset-0 ...">
      {/* ... */}
    </div>
  );
};

export default FormModal;   