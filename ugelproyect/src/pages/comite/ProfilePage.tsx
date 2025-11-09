import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ComiteLayout from '@/layouts/ComiteLayout';
import { UserCircle, UploadCloud } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Importar toast y Toaster

// Using centralized API config
import { API_BASE_URL } from '@/lib/api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userProfilePictureUrl, setUserProfilePictureUrl] = useState<string | null>(null);
  // const [uploadError, setUploadError] = useState<string | null>(null); // Ya no es necesario
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Tema oscuro/claro dinámico
  const [theme, setTheme] = useState<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark');
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-slate-600';
  
  useEffect(() => {
    const sync = () => setTheme((document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark');
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', sync);
    return () => { observer.disconnect(); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    fetchUserProfile();
    
    const savedProfilePicture = localStorage.getItem('userProfilePicture');
    if (savedProfilePicture) {
      setUserProfilePictureUrl(savedProfilePicture);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Authentication token is missing.");
      // Mostrar toast de error antes de desloguear
      toast.error("Sesión expirada. Por favor, inicia sesión de nuevo.");
      logout();
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchUserProfile = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    
    setLoadingProfile(true);
    try {
      console.log("Frontend: Obteniendo datos completos del usuario...");
      const userId = (user as any)?.id;
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...headers 
        }
      });
      
      if (!response.ok) {
        // Notificar error de carga de perfil
        toast.error("No se pudieron cargar los datos del perfil.");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new SyntaxError('Respuesta no JSON del servidor');
      }
      const data = await response.json();
      console.log("Frontend: Datos del usuario obtenidos:", data);
      setUserProfileData(data);
      
      // Obtener la URL de la foto de perfil desde diferentes posibles ubicaciones
      const profilePictureUrl = data.profilePictureUrl || 
                                data.profilePicture || 
                                data.user?.profilePicture || 
                                data.user?.fotoperfil ||
                                (data.profilePicture ? `${API_BASE_URL.replace('/ugel-talara', '')}/ugel-talara/uploads/profiles/${data.profilePicture}` : null);
      
      if (profilePictureUrl) {
        setUserProfilePictureUrl(profilePictureUrl);
        localStorage.setItem('userProfilePicture', profilePictureUrl);
      } else {
        // Intentar desde localStorage como fallback
        const savedProfilePicture = localStorage.getItem('userProfilePicture');
        if (savedProfilePicture && !savedProfilePicture.startsWith('data:')) {
          setUserProfilePictureUrl(savedProfilePicture);
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Notificar fallback
      toast.error("Error al cargar el perfil, mostrando datos locales.");
      setUserProfileData(user);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePictureFile(file);

      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
      setProfilePicturePreview(URL.createObjectURL(file));
      toast.dismiss(); // Limpiar notificaciones de error anteriores
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) {
      toast.error("Por favor, selecciona una imagen para subir.");
      return;
    }

    if (!profilePictureFile.type.startsWith('image/')) {
      toast.error("Por favor, selecciona un archivo de imagen válido.");
      return;
    }

    if (profilePictureFile.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande. Máximo 5MB.");
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    const userId = (user as any)?.id;
    if (!userId) {
      toast.error("No se pudo identificar al usuario. Por favor, intenta iniciar sesión de nuevo.");
      return;
    }

    setUploadingImage(true);
    const uploadToastId = toast.loading("Subiendo imagen al servidor...");

    try {
      console.log("Frontend: Subiendo foto de perfil al servidor...", {
        userId,
        fileName: profilePictureFile.name,
        fileSize: profilePictureFile.size,
        fileType: profilePictureFile.type
      });
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('profilePicture', profilePictureFile);

      // Subir la imagen al servidor
      const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'ngrok-skip-browser-warning': 'true'
          // No incluir 'Content-Type' - el navegador lo establece automáticamente para FormData
        },
        body: formData
      });

      if (!response.ok) {
        let errorMessage = 'Error al subir la imagen de perfil';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Frontend: Respuesta del servidor:", result);
      
      // Obtener la URL de la imagen desde diferentes posibles ubicaciones en la respuesta
      const profilePictureUrl = result.profilePictureUrl || 
                                result.profilePicture || 
                                result.user?.profilePicture || 
                                result.user?.fotoperfil ||
                                result.url ||
                                result.fotoUrl;

      if (profilePictureUrl) {
        // Actualizar el estado con la URL del servidor
        setUserProfilePictureUrl(profilePictureUrl);
        
        // Actualizar también en localStorage como fallback
        localStorage.setItem('userProfilePicture', profilePictureUrl);
        
        // Recargar el perfil para obtener los datos actualizados
        await fetchUserProfile();
        
        toast.success("¡Foto de perfil actualizada exitosamente!", { id: uploadToastId });
      } else {
        console.warn("No se recibió URL de la imagen en la respuesta:", result);
        toast.success("Foto subida, pero no se recibió la URL. Recarga la página.", { id: uploadToastId });
      }
      
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      
    } catch (err: any) {
      console.error("Error uploading profile picture:", err);
      toast.error(err.message || "Error al subir la imagen. Inténtalo de nuevo.", { id: uploadToastId });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <ComiteLayout>
      {/* Añadir el componente Toaster aquí, se encargará de renderizar las notificaciones */}
      <Toaster 
        position="top-right"
        toastOptions={{
          // Estilos para que coincida con el tema oscuro
          style: {
            background: '#1f2937', // gray-800
            color: '#ffffff',
          },
          success: {
            iconTheme: {
              primary: '#10b981', // green-500
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#ffffff',
            },
          },
        }}
      />
      <div className="w-full px-4 py-8">
        <h1 className={`text-4xl font-bold ${textPrimary} mb-8 ${isDark ? 'bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent' : ''}`}>
          Perfil de Usuario
        </h1>

        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900/60 to-cyan-900/20 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <label htmlFor="profile-picture-upload" className="cursor-pointer relative w-32 h-32 rounded-full mb-4 group">
              {(profilePicturePreview || userProfilePictureUrl) ? (
                <img
                  src={profilePicturePreview || userProfilePictureUrl || ''}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover rounded-full border-4 border-cyan-500 group-hover:border-blue-400 transition-colors"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-4 border-cyan-500 group-hover:border-blue-400 transition-colors">
                  <UserCircle className="w-20 h-20 text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
            </label>
            <input
              id="profile-picture-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {userProfileData?.nombreCompleto || userProfileData?.nombre_completo || userProfileData?.nombre || user?.nombreCompleto || user?.nombre_completo || user?.nombre || 'Nombre de Usuario'}
            </h2>
            <p className="text-cyan-300 text-lg mb-4">
              {userProfileData?.email || userProfileData?.correo || user?.email || user?.correo || 'email@example.com'}
            </p>

            {/* Ya no se necesita el <p> para uploadError */}
            {/* {uploadError && <p className="text-red-500 text-sm mb-4">{uploadError}</p>} */}

            {profilePictureFile && (
              <button
                onClick={handleUploadProfilePicture}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando... {/* Cambiado de "Subiendo..." para coincidir con el toast */}
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Subir Foto de Perfil
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 p-6 rounded-xl border border-cyan-500/50 shadow-lg">
              <label className="block text-cyan-300 text-lg font-semibold mb-3">Nombre Completo</label>
              <div className="text-xl font-medium text-white bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30">
                {loadingProfile ? 'Cargando...' : (userProfileData?.nombreCompleto || userProfileData?.nombre_completo || userProfileData?.nombre || user?.nombreCompleto || user?.nombre_completo || user?.nombre || 'No disponible')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-xl border border-blue-500/50 shadow-lg">
              <label className="block text-blue-300 text-lg font-semibold mb-3">Correo Electrónico</label>
              <div className="text-xl font-medium text-white bg-gray-800/50 p-4 rounded-lg border border-blue-500/30 break-words">
                {loadingProfile ? 'Cargando...' : (userProfileData?.email || userProfileData?.correo || user?.email || user?.correo || 'No disponible')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/50 shadow-lg">
              <label className="block text-purple-300 text-lg font-semibold mb-3">Rol</label>
              <div className="text-xl font-medium text-white bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                {loadingProfile ? 'Cargando...' : (userProfileData?.rol || user?.rol || 'No disponible')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComiteLayout>
  );
};

export default ProfilePage;