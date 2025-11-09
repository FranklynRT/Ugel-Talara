// src/pages/tu-pagina/components/ProfileModal.tsx
import React from 'react';
import { UserProfile } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Perfil de Usuario</h2>
        <div>
          <p className="mb-2"><strong>Nombre:</strong> {user.nombre}</p>
          <p className="mb-2"><strong>Email:</strong> {user.email}</p>
          <p className="mb-4"><strong>Rol:</strong> {user.rol}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;