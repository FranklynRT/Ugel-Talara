// Ruta: src/pages/admin/inicio.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit2, Plus, X, Check, Search, Eye, EyeOff, LogOut, User, Shield, Palette, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = "http://localhost:9000/ugel-talara";
const API_URL = `${API_BASE_URL}/users`;
type MensajeTipo = 'success' | 'error' | 'deleted' | 'info';

interface UserData {
    id: number;
    nombre: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    email: string;
    telefono?: string;
    tipoDocumento?: string;
    documento?: string;
    rol: string;
    estado: string;
    fecha: string;
    profilePicture?: string | null; // Allow string (Base64) or null
}

const mapDBRoleToUI = (dbRole?: string): string => {
    if (!dbRole) return 'Desconocido';
    const role = dbRole.toLowerCase();
    if (role.includes('rr.hh') || role.includes('recursos humanos')) return 'RR.HH';
    if (role.includes('comite')) return 'Comité';
    if (role.includes('tramite')) return 'Tramite';
    if (role.includes('postulante')) return 'Postulante';
    if (role.includes('admin') || role.includes('administrador')) return 'Administrador';
    return dbRole.charAt(0).toUpperCase() + dbRole.slice(1);
};
const roleUIToDB = (uiRole: string) => {
    if (!uiRole) return '';
    if (uiRole === 'RR.HH') return 'recursos humanos';
    if (uiRole === 'Comité') return 'comite';
    if (uiRole === 'Tramite') return 'tramite';
    if (uiRole === 'Postulante') return 'postulante';
    if (uiRole === 'Administrador') return 'administrador';
    return uiRole.toLowerCase().replace('é', 'e');
};

const AdminPanel = () => {
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([]);
    const rolesParaCreacion = ['RR.HH', 'Comité', 'Tramite']; // Postulante no se puede crear desde el panel de admin
    const [editando, setEditando] = useState<number | null>(null);
    const [rolOriginal, setRolOriginal] = useState<string>(''); // Guardar el rol original antes de editar
    const [formData, setFormData] = useState<any>({ 
        nombre: '', 
        apellidoPaterno: '', 
        apellidoMaterno: '', 
        email: '', 
        telefono: '', 
        tipoDocumento: '', 
        documento: '', 
        rol: 'RR.HH', 
        estado: 'ACTIVO' 
    });
    const [mostrarForm, setMostrarForm] = useState(false);
    const [mensaje, setMensaje] = useState<{ texto: string, tipo: MensajeTipo | '' }>({ texto: '', tipo: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [tipoDocumentoBusqueda, setTipoDocumentoBusqueda] = useState('');
    const [numeroDocumentoBusqueda, setNumeroDocumentoBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [passwordData, setPasswordData] = useState({ contrasena: '', confirmarContrasena: '', });
    const [showPassword, setShowPassword] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profilePasswordData, setProfilePasswordData] = useState({ actual: '', nueva: '', confirmar: '', });
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [editingProfile, setEditingProfile] = useState({ documento: '', telefono: '' });
    const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserData | null>(null);
    const [showConvocatoriasModal, setShowConvocatoriasModal] = useState(false);
    const [selectedUserConvocatorias, setSelectedUserConvocatorias] = useState<UserData | null>(null);
    const [convocatoriasDisponibles, setConvocatoriasDisponibles] = useState<any[]>([]);
    const [convocatoriasAsignadas, setConvocatoriasAsignadas] = useState<any[]>([]);
    const [grupoUsuarioActual, setGrupoUsuarioActual] = useState<any | null>(null);
    const [loadingGrupoUsuario, setLoadingGrupoUsuario] = useState(false);
    // Estados para grupos de comité
    const [showGruposComiteModal, setShowGruposComiteModal] = useState(false);
    const [gruposComite, setGruposComite] = useState<any[]>([]);
    const [usuariosComite, setUsuariosComite] = useState<UserData[]>([]);
    const [selectedGrupo, setSelectedGrupo] = useState<any | null>(null);
    const [loadingGrupos, setLoadingGrupos] = useState(false);
    // Cargar el tema desde localStorage o usar azul claro por defecto
    const [temaAzul, setTemaAzul] = useState(() => {
        const savedTema = localStorage.getItem('temaAzul');
        return savedTema === null ? true : savedTema === 'true';
    });
    
    // Función para actualizar el tema y guardarlo en localStorage
    const cambiarTema = (nuevoTema: boolean) => {
        setTemaAzul(nuevoTema);
        localStorage.setItem('temaAzul', String(nuevoTema));
    };

    const { logout, user, updateUserProfile } = useAuth();
    const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
    console.log("Current user in AdminPanel:", user); // Add this line
    const userName = user?.nombreCompleto || "Admin";

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem('token'); // Corrected key from 'authToken' to 'token'
        if (!token) {
            console.error("Authentication headers are missing. Redirecting to login.");
            logout(); // Explicitly call logout to redirect
            return null;
        }
        return { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
        };
    }, [logout]);

    // Función para obtener la imagen de perfil del usuario desde el backend
    const fetchUserProfilePicture = useCallback(async () => {
        if (!user || !user.id) {
            setUserProfilePicture(null);
            return;
        }

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`${API_URL}/${user.id}`, {
                headers: {
                    ...headers,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('Datos del usuario desde el backend:', userData);
                
                // Intentar obtener la URL desde diferentes campos
                let pictureUrl: string | null = userData.profilePicture || 
                                               userData.fotoperfil || 
                                               userData.profilePictureUrl ||
                                               userData.user?.profilePicture ||
                                               userData.user?.fotoperfil ||
                                               null;
                
                // Si tenemos un nombre de archivo pero no una URL completa
                if (!pictureUrl && (userData.profilePicture || userData.fotoperfil)) {
                    const filename = userData.profilePicture || userData.fotoperfil;
                    // Usar la ruta de la API que creamos
                    pictureUrl = `${API_BASE_URL}/uploads/profiles/${filename}`;
                }
                
                // Validar que la URL no sea un string 'null' o vacío
                if (pictureUrl && (pictureUrl === 'null' || pictureUrl === '' || pictureUrl === 'undefined')) {
                    pictureUrl = null;
                }
                
                // Si tenemos una URL pero no es absoluta, construirla con la base URL de la API
                if (pictureUrl && typeof pictureUrl === 'string') {
                    // Función helper para extraer el nombre del archivo de cualquier URL
                    const extractFileName = (url: string): string | null => {
                        // Buscar el patrón /uploads/profiles/nombrearchivo
                        const match = url.match(/\/uploads\/profiles\/([^/?]+)/);
                        if (match && match[1]) {
                            return match[1];
                        }
                        // Si no tiene path, puede ser solo el nombre del archivo
                        if (!url.includes('/') && !url.includes('http')) {
                            return url;
                        }
                        return null;
                    };
                    
                    // Extraer el nombre del archivo de la URL
                    const fileName = extractFileName(pictureUrl);
                    
                    if (fileName) {
                        // Siempre reconstruir usando la ruta de la API: /ugel-talara/uploads/profiles/
                        pictureUrl = `${API_BASE_URL}/uploads/profiles/${fileName}`;
                    } else {
                        // Si no pudimos extraer el nombre, intentar construir desde cero
                        if (!pictureUrl.startsWith('http') && !pictureUrl.startsWith('data:')) {
                            if (!pictureUrl.includes('/')) {
                                pictureUrl = `${API_BASE_URL}/uploads/profiles/${pictureUrl}`;
                            } else if (pictureUrl.startsWith('/uploads/')) {
                                pictureUrl = `${API_BASE_URL}${pictureUrl}`;
                            } else if (pictureUrl.startsWith('/')) {
                                pictureUrl = `${API_BASE_URL}${pictureUrl}`;
                            }
                        }
                    }
                }
                
                if (pictureUrl) {
                    setUserProfilePicture(pictureUrl);
                    // Actualizar también en el contexto
                    updateUserProfile({ profilePicture: pictureUrl, fotoperfil: pictureUrl });
                } else {
                    setUserProfilePicture(null);
                }
            }
        } catch (error) {
            console.error('Error al obtener la imagen de perfil:', error);
        }
    }, [user, getAuthHeaders, updateUserProfile]);

    // Efecto para cargar y actualizar la imagen de perfil
    useEffect(() => {
        const loadProfilePicture = () => {
            if (!user) {
                setUserProfilePicture(null);
                return;
            }
            
            // Intentar obtener desde diferentes campos del objeto user
            let pictureUrl: string | null = user.profilePicture || 
                                           user.fotoperfil || 
                                           user.profilePictureUrl || 
                                           null;
            
            // Validar que la URL no sea un string 'null' o vacío
            if (pictureUrl && (pictureUrl === 'null' || pictureUrl === '' || pictureUrl === 'undefined')) {
                pictureUrl = null;
            }
            
            // Si tenemos una URL pero no es absoluta, construirla con la base URL de la API
            if (pictureUrl && typeof pictureUrl === 'string') {
                // Si la URL contiene '/uploads/profiles/', extraer el nombre del archivo y reconstruir
                if (pictureUrl.includes('/uploads/profiles/')) {
                    const fileName = pictureUrl.split('/uploads/profiles/')[1];
                    if (fileName) {
                        pictureUrl = `${API_BASE_URL}/uploads/profiles/${fileName}`;
                    }
                } else if (!pictureUrl.startsWith('http') && !pictureUrl.startsWith('data:')) {
                    // Si es solo el nombre del archivo, construir la URL completa usando la ruta de la API
                    if (!pictureUrl.includes('/')) {
                        pictureUrl = `${API_BASE_URL}/uploads/profiles/${pictureUrl}`;
                    } else if (pictureUrl.startsWith('/uploads/')) {
                        // Si comienza con /uploads/, agregar /ugel-talara al principio
                        pictureUrl = `${API_BASE_URL}${pictureUrl}`;
                    } else if (pictureUrl.startsWith('/')) {
                        // Si comienza con /, agregar la base URL
                        pictureUrl = `${API_BASE_URL}${pictureUrl}`;
                    }
                } else if (pictureUrl.includes('ngrok') || pictureUrl.includes('localhost')) {
                    // Si la URL tiene un host diferente, extraer solo el nombre del archivo y reconstruir
                    const fileNameMatch = pictureUrl.match(/\/uploads\/profiles\/([^/?]+)/);
                    if (fileNameMatch && fileNameMatch[1]) {
                        pictureUrl = `${API_BASE_URL}/uploads/profiles/${fileNameMatch[1]}`;
                    }
                }
            }
            
            // Si no hay imagen en el contexto, intentar obtenerla del backend
            if (!pictureUrl && user.id) {
                fetchUserProfilePicture();
            } else {
                setUserProfilePicture(pictureUrl);
            }
            
            // Debug logs
            console.log("=== DEBUG PROFILE PICTURE ===");
            console.log("User object completo:", user);
            console.log("user?.profilePicture:", user?.profilePicture);
            console.log("user?.fotoperfil:", user?.fotoperfil);
            console.log("Profile picture URL final:", pictureUrl);
            console.log("¿Tiene imagen?", !!pictureUrl);
        };
        
        loadProfilePicture();
    }, [user, fetchUserProfilePicture]);

    const mostrarAlerta = (texto: string, tipo: MensajeTipo) => {
        setMensaje({ texto, tipo });
        setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
    };

    const obtenerUsuariosAPI = useCallback(async () => {
        setLoading(true);
        const headers = getAuthHeaders();
        if (!headers) {
            console.error("Authentication headers are missing. Redirecting to login.");
            return;
        }
        console.log("Using headers:", headers);
        try {
            // Obtener usuarios filtrados por roles: recursos humanos, tramite, postulante, comite (excluir administrador)
            const res = await fetch(`${API_URL}?roles=recursos humanos,tramite,postulante,comite`, { headers });
            console.log("API response status:", res.status);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error ${res.status}: ${res.statusText}` }));
                console.error("API Error Data:", errorData);
                throw new Error(errorData.message || `Error del servidor: ${res.status}`);
            }
            const data = await res.json();
            console.log("Raw API data:", data);
            const mappedUsers: UserData[] = data
                .filter((u: any) => {
                    // Filtrar adicionalmente para excluir administradores
                    const rol = (u.rol || '').toLowerCase();
                    return rol !== 'administrador' && (rol === 'recursos humanos' || rol === 'tramite' || rol === 'postulante' || rol === 'comite');
                })
                .map((u: any) => {
                    // Manejar documento y tipoDocumento que pueden ser NULL
                    const documento = u.documento !== null && u.documento !== undefined ? String(u.documento) : '';
                    const tipoDocumento = u.tipoDocumento !== null && u.tipoDocumento !== undefined ? String(u.tipoDocumento) : '';
                    
                    return {
                        id: u.IDUSUARIO,
                        nombre: u.nombreCompleto,
                        apellidoPaterno: u.apellidoPaterno || '',
                        apellidoMaterno: u.apellidoMaterno || '',
                        email: u.correo,
                        telefono: u.telefono || '',
                        tipoDocumento: tipoDocumento,
                        documento: documento,
                        rol: mapDBRoleToUI(u.rol),
                        estado: u.estado === 'ACTIVO' ? 'Activo' : 'Desactivo',
                        fecha: new Date(u.fechaCreacion).toLocaleDateString('es-PE'),
                        profilePicture: u.fotoperfil, // Assuming fotoperfil is returned by the backend
                    };
                });
            console.log("Mapped users:", mappedUsers);
            setUsuarios(mappedUsers);
            const rolesUnicos: string[] = Array.from(new Set(mappedUsers.map((u: UserData) => u.rol as string))).filter(rol => rol !== 'Desconocido');
            console.log("Unique roles after mapping:", rolesUnicos);
            setRolesDisponibles(rolesUnicos);
        } catch (error: any) { mostrarAlerta(error.message, 'error'); } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        console.log("Calling obtenerUsuariosAPI on component mount...");
        obtenerUsuariosAPI();
    }, [obtenerUsuariosAPI]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editando) await guardarEdicion();
        else await agregarUsuario();
    };

    const agregarUsuario = async () => {
        // Validar contraseñas
        if (passwordData.contrasena !== passwordData.confirmarContrasena) {
            return mostrarAlerta('Las contraseñas no coinciden.', 'error');
        }

        // Validar campos requeridos y listar los que faltan
        const camposFaltantes: string[] = [];
        
        if (!formData.nombre || formData.nombre.trim() === '') {
            camposFaltantes.push('Nombre Completo');
        }
        
        if (!formData.email || formData.email.trim() === '') {
            camposFaltantes.push('Correo Electrónico');
        }
        
        // Tipo de documento es requerido para todos los roles
        if (!formData.tipoDocumento || formData.tipoDocumento.trim() === '') {
            camposFaltantes.push('Tipo de Documento');
        }
        
        // Número de documento es requerido para todos los roles
        if (!formData.documento || formData.documento.trim() === '') {
            camposFaltantes.push('Número de Documento');
        }
        
        if (!passwordData.contrasena || passwordData.contrasena.trim() === '') {
            camposFaltantes.push('Contraseña');
        }
        
        if (!passwordData.confirmarContrasena || passwordData.confirmarContrasena.trim() === '') {
            camposFaltantes.push('Confirmar Contraseña');
        }
        
        // Mostrar mensaje específico con los campos faltantes
        if (camposFaltantes.length > 0) {
            const mensaje = camposFaltantes.length === 1 
                ? `Por favor, completa el siguiente campo requerido: ${camposFaltantes[0]}` 
                : `Por favor, completa los siguientes campos requeridos: ${camposFaltantes.join(', ')}`;
            return mostrarAlerta(mensaje, 'error');
        }
        
        const headers = getAuthHeaders();
        if (!headers) return;
        
        // El documento es obligatorio para todos los roles
        const tipoDocFinal = formData.tipoDocumento?.trim() || 'dni';
        const docNumFinal = formData.documento?.trim() || '';
        
        const payload: any = { 
            nombreCompleto: formData.nombre.trim(), 
            apellidoPaterno: (formData.apellidoPaterno || '').trim(), 
            apellidoMaterno: (formData.apellidoMaterno || '').trim(), 
            correo: formData.email.trim(), 
            telefono: (formData.telefono || '').trim(), // Teléfono es opcional
            tipoDocumento: tipoDocFinal,
            documento: docNumFinal,
            rol: roleUIToDB(formData.rol), 
            contrasena: passwordData.contrasena,
            estado: formData.estado || 'ACTIVO'
        };
        
        console.log('Creando usuario con payload:', payload);
        console.log('Headers:', headers);
        
        try {
            const res = await fetch(API_URL, { method: 'POST', headers, body: JSON.stringify(payload) });
            console.log('Respuesta del servidor:', res.status, res.statusText);
            
            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await res.json();
                    console.log('Error data del servidor:', errorData);
                    // El backend puede devolver 'error' o 'message'
                    errorMessage = errorData.error || errorData.message || errorMessage;
                    console.log('Mensaje de error extraído:', errorMessage);
                } catch (parseError) {
                    console.log('Error al parsear respuesta de error:', parseError);
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await res.json();
            console.log('Usuario creado exitosamente:', responseData);
            
            await obtenerUsuariosAPI();
            cerrarYLimpiarFormulario();
            mostrarAlerta('Usuario creado con éxito', 'success');
        } catch (error: any) { 
            console.error('Error completo al crear usuario:', error);
            console.error('Mensaje de error:', error.message);
            mostrarAlerta(error.message || 'Error al crear usuario. Por favor, verifica los datos ingresados.', 'error'); 
        }
    };

    const guardarEdicion = async () => {
        if (passwordData.contrasena && passwordData.contrasena !== passwordData.confirmarContrasena) return mostrarAlerta('Las contraseñas no coinciden.', 'error');
        const headers = getAuthHeaders();
        if (!headers) return;
        
        // Verificar si el rol cambió de "Comité" a otro rol
        const rolOriginalDB = roleUIToDB(rolOriginal);
        const nuevoRolDB = roleUIToDB(formData.rol);
        const eraComite = rolOriginalDB === 'comite' || rolOriginal.toLowerCase().includes('comité') || rolOriginal.toLowerCase().includes('comite');
        const sigueSiendoComite = nuevoRolDB === 'comite' || formData.rol.toLowerCase().includes('comité') || formData.rol.toLowerCase().includes('comite');
        
        // Si el usuario era del comité y ahora cambia a otro rol, removerlo de todos los grupos
        if (eraComite && !sigueSiendoComite && editando) {
            try {
                await removerUsuarioDeTodosLosGrupos(editando);
                console.log(`Usuario ${editando} removido de todos los grupos de comité por cambio de rol`);
            } catch (error) {
                console.error('Error al remover usuario de los grupos:', error);
                // Continuar con la actualización aunque falle la remoción
            }
        }
        
        // Validar que el documento esté presente antes de actualizar
        if (!formData.tipoDocumento || !formData.documento || formData.documento.trim() === '') {
            return mostrarAlerta('Tipo de documento y número de documento son requeridos.', 'error');
        }
        
        // Include all fields in the payload
        // El documento es obligatorio para todos los roles
        const payload: any = { 
            nombreCompleto: formData.nombre, 
            apellidoPaterno: formData.apellidoPaterno || '',
            apellidoMaterno: formData.apellidoMaterno || '',
            correo: formData.email, 
            telefono: formData.telefono || '',
            tipoDocumento: formData.tipoDocumento.trim(),
            documento: formData.documento.trim(),
            rol: nuevoRolDB, 
            estado: formData.estado 
        };
        
        if (passwordData.contrasena) payload.contrasena = passwordData.contrasena;
        
        console.log('Actualizando usuario con payload:', payload);
        console.log('Headers:', headers);
        console.log('ID del usuario a actualizar:', editando);
        
        try {
            const res = await fetch(`${API_URL}/${editando}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
            console.log('Respuesta del servidor:', res.status, res.statusText);
            
            if (!res.ok) {
                let errorMessage = `Error ${res.status}: ${res.statusText}`;
                try {
                    const errorData = await res.json();
                    console.log('Error data del servidor:', errorData);
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    console.log('Error al parsear respuesta de error:', parseError);
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await res.json();
            console.log('Usuario actualizado exitosamente:', responseData);
            
            await obtenerUsuariosAPI();
            
            // Mostrar mensaje apropiado si se removió de los grupos
            if (eraComite && !sigueSiendoComite) {
                mostrarAlerta('Usuario actualizado correctamente. El usuario ha sido removido automáticamente de todos los grupos de comité por cambio de rol.', 'success');
            } else {
                mostrarAlerta('Usuario actualizado correctamente', 'success');
            }
            
            cerrarYLimpiarFormulario();
        } catch (error: any) { 
            console.error('Error completo al actualizar usuario:', error);
            mostrarAlerta(error.message, 'error'); 
        }
    };

    const toggleEstado = async (id: number, estadoActual: string) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        const nuevoEstadoDB = estadoActual === 'Activo' ? 'INACTIVO' : 'ACTIVO';
        try {
            const res = await fetch(`${API_URL}/${id}/estado`, { method: 'PATCH', headers, body: JSON.stringify({ estado: nuevoEstadoDB }) });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error al cambiar estado.` }));
                throw new Error(errorData.message);
            }
            await obtenerUsuariosAPI();
        } catch (error: any) { mostrarAlerta(error.message, 'error'); }
    };

    const handleDeleteRequest = (id: number) => { setConfirmingDelete(id); };

    const eliminarUsuario = async () => {
        if (confirmingDelete === null) return;
        const headers = getAuthHeaders();
        if (!headers) return;
        try {
            const res = await fetch(`${API_URL}/${confirmingDelete}`, { method: 'DELETE', headers });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `Error al eliminar.` }));
                throw new Error(errorData.message);
            }
            await obtenerUsuariosAPI();
            mostrarAlerta('Usuario eliminado', 'deleted');
        } catch (error: any) { mostrarAlerta(error.message, 'error'); }
        finally { setConfirmingDelete(null); }
    };

    const handleProfilePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (profilePasswordData.nueva !== profilePasswordData.confirmar) return mostrarAlerta('Las nuevas contraseñas no coinciden.', 'error');
        const headers = getAuthHeaders();
        if (!headers) return;
        const loggedInUserId = user?.id;
        if (!loggedInUserId) return mostrarAlerta("No se pudo identificar al usuario.", "error");
        try {
            const res = await fetch(`${API_URL}/${loggedInUserId}/change-password`, {
                method: 'PUT', headers, body: JSON.stringify({ contrasenaActual: profilePasswordData.actual, nuevaContrasena: profilePasswordData.nueva })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al cambiar la contraseña');
            }
            mostrarAlerta('Contraseña actualizada con éxito.', 'success');
            setProfilePasswordData({ actual: '', nueva: '', confirmar: '' });
        } catch (error: any) { mostrarAlerta(error.message, 'error'); }
    };

    // Inicializar datos del perfil cuando se abre el modal
    useEffect(() => {
        if (showProfileModal && user) {
            setEditingProfile({
                documento: user?.documento || user?.dni || '',
                telefono: user?.telefono || ''
            });
        }
    }, [showProfileModal, user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const headers = getAuthHeaders();
        if (!headers || !user?.id) return mostrarAlerta("No se pudo identificar al usuario.", "error");
        
        try {
            const payload: any = {};
            if (editingProfile.documento && editingProfile.documento !== (user?.documento || user?.dni || '')) {
                payload.documento = editingProfile.documento;
            }
            if (editingProfile.telefono && editingProfile.telefono !== (user?.telefono || '')) {
                payload.telefono = editingProfile.telefono;
            }
            
            if (Object.keys(payload).length === 0) {
                return mostrarAlerta('No hay cambios para guardar.', 'info');
            }
            
            const res = await fetch(`${API_URL}/${user.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'Error al actualizar perfil' }));
                throw new Error(errorData.message || 'Error al actualizar perfil');
            }
            
            mostrarAlerta('Perfil actualizado exitosamente.', 'success');
            updateUserProfile({
                ...user,
                documento: editingProfile.documento || user?.documento || user?.dni || '',
                telefono: editingProfile.telefono || user?.telefono || ''
            });
            setEditingProfile({ documento: '', telefono: '' });
        } catch (error: any) {
            mostrarAlerta(error.message, 'error');
        }
    };

    const cerrarYLimpiarFormulario = () => {
        setMostrarForm(false);
        setFormData({ 
            nombre: '', 
            apellidoPaterno: '', 
            apellidoMaterno: '', 
            email: '', 
            telefono: '', 
            tipoDocumento: '', 
            documento: '', 
            rol: 'RR.HH', 
            estado: 'ACTIVO' 
        });
        setEditando(null);
        setRolOriginal(''); // Resetear el rol original
        setPasswordData({ contrasena: '', confirmarContrasena: '', });
    };

    const abrirFormParaCrear = () => {
        cerrarYLimpiarFormulario();
        setMostrarForm(true);
    };

    const abrirFormParaEditar = (usuario: any) => {
        setEditando(usuario.id);
        // Guardar el rol original para comparar después
        setRolOriginal(usuario.rol || 'RR.HH');
        // Set all fields in formData when editing
        setFormData({ 
            nombre: usuario.nombre || '', 
            apellidoPaterno: usuario.apellidoPaterno || '',
            apellidoMaterno: usuario.apellidoMaterno || '',
            email: usuario.email || '', 
            telefono: usuario.telefono || '',
            tipoDocumento: usuario.tipoDocumento || 'dni', // Documento es obligatorio
            documento: usuario.documento || '',
            rol: usuario.rol || 'RR.HH', 
            estado: usuario.estado === 'Activo' || usuario.estado === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO' 
        });
        setPasswordData({ contrasena: '', confirmarContrasena: '', });
        setMostrarForm(true);
    };

    const handleViewDetails = (usuario: any) => {
        setSelectedUserForDetails(usuario);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setSelectedUserForDetails(null);
        setShowDetailsModal(false);
    };

    // Funciones para gestionar asignación de usuarios del comité a grupos
    const handleManageConvocatorias = async (usuario: UserData) => {
        if (usuario.rol !== 'Comité') return;
        // Abrir modal de gestión de grupos para el usuario
        setSelectedUserConvocatorias(usuario);
        setShowConvocatoriasModal(true);
        setLoadingGrupoUsuario(true);
        setGrupoUsuarioActual(null);
        
        // Cargar grupos disponibles
        await inicializarGruposComite();
        await fetchGruposComite();
        
        // Buscar en qué grupo está el usuario
        const headers = getAuthHeaders();
        if (headers) {
            try {
                const res = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
                if (res.ok) {
                    const grupos = await res.json();
                    const gruposArray = Array.isArray(grupos) ? grupos : [grupos];
                    // Buscar el grupo donde está el usuario
                    for (const grupo of gruposArray) {
                        const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupo.id}`, { headers });
                        if (resGrupo.ok) {
                            const grupoCompleto = await resGrupo.json();
                            const usuariosGrupo = Array.isArray(grupoCompleto.usuarios) ? grupoCompleto.usuarios : [];
                            const usuarioEnGrupo = usuariosGrupo.find((u: any) => 
                                (u.id || u.IDUSUARIO) === usuario.id
                            );
                            if (usuarioEnGrupo) {
                                // Usuario está en este grupo
                                const nombreNormalizado = normalizarNombreGrupo(grupoCompleto, (grupoCompleto.id - 1) || 0);
                                setGrupoUsuarioActual({
                                    ...grupoCompleto,
                                    nombre: nombreNormalizado.nombre,
                                    descripcion: nombreNormalizado.descripcion,
                                    usuarios: usuariosGrupo
                                });
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error al buscar grupo del usuario:', error);
            } finally {
                setLoadingGrupoUsuario(false);
            }
        }
    };
    
    // Asignar usuario a un grupo desde el modal de usuario
    const handleAsignarUsuarioAGrupoDesdeModal = async (grupoId: number) => {
        if (!selectedUserConvocatorias) return;
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            // Si el usuario ya está en otro grupo, removerlo primero
            if (grupoUsuarioActual) {
                await fetch(`${API_BASE_URL}/grupos-comite/${grupoUsuarioActual.id}/usuarios/${selectedUserConvocatorias.id}`, {
                    method: 'DELETE',
                    headers
                });
            }
            
            // Asignar al nuevo grupo
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/usuarios`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId: selectedUserConvocatorias.id })
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al asignar usuario');
            }
            
            // Obtener el grupo actualizado
            const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}`, { headers });
            if (resGrupo.ok) {
                const grupoActualizado = await resGrupo.json();
                const nombreNormalizado = normalizarNombreGrupo(grupoActualizado, (grupoActualizado.id - 1) || 0);
                setGrupoUsuarioActual({
                    ...grupoActualizado,
                    nombre: nombreNormalizado.nombre,
                    descripcion: nombreNormalizado.descripcion,
                    usuarios: Array.isArray(grupoActualizado.usuarios) ? grupoActualizado.usuarios : []
                });
            }
            
            // Refrescar grupos
            await fetchGruposComite();
            mostrarAlerta(`Usuario asignado al grupo exitosamente`, 'success');
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al asignar usuario', 'error');
        }
    };
    
    // Remover usuario de grupo desde el modal de usuario
    const handleRemoverUsuarioDeGrupoDesdeModal = async () => {
        if (!selectedUserConvocatorias || !grupoUsuarioActual) return;
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoUsuarioActual.id}/usuarios/${selectedUserConvocatorias.id}`, {
                method: 'DELETE',
                headers
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al remover usuario');
            }
            
            setGrupoUsuarioActual(null);
            await fetchGruposComite();
            mostrarAlerta(`Usuario removido del grupo exitosamente`, 'success');
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al remover usuario', 'error');
        }
    };


    const closeConvocatoriasModal = () => {
        setSelectedUserConvocatorias(null);
        setShowConvocatoriasModal(false);
        setConvocatoriasDisponibles([]);
        setConvocatoriasAsignadas([]);
        setGrupoUsuarioActual(null);
        setLoadingGrupoUsuario(false);
    };

    // Función para normalizar nombres de grupos (convertir nombres antiguos a nuevos)
    const normalizarNombreGrupo = (grupo: any, indice: number) => {
        const nombresGrupos = ['Administración', 'UPDI', 'AGP', 'Recursos Humanos', 'Dirección'];
        const descripcionesGrupos = [
            'Grupo de Administración para evaluación de postulantes',
            'Grupo UPDI para evaluación de postulantes',
            'Grupo AGP para evaluación de postulantes',
            'Grupo de Recursos Humanos para evaluación de postulantes',
            'Grupo de Dirección para evaluación de postulantes'
        ];
        
        const nombreActual = String(grupo.nombre || '').trim();
        const grupoId = grupo.id;
        
        // Si el nombre ya está en la lista correcta, mantenerlo
        if (nombresGrupos.includes(nombreActual)) {
            const indiceNombre = nombresGrupos.indexOf(nombreActual);
            return {
                nombre: nombreActual,
                descripcion: grupo.descripcion || descripcionesGrupos[indiceNombre] || 'Sin descripción'
            };
        }
        
        // Si el nombre es "Grupo 1", "Grupo 2", etc., convertir al nombre correspondiente
        const matchGrupo = nombreActual.match(/^Grupo\s*(\d+)$/i);
        if (matchGrupo) {
            const numeroGrupo = parseInt(matchGrupo[1]);
            if (numeroGrupo >= 1 && numeroGrupo <= 5) {
                return {
                    nombre: nombresGrupos[numeroGrupo - 1],
                    descripcion: descripcionesGrupos[numeroGrupo - 1]
                };
            }
        }
        
        // Si tenemos un ID válido (1-5), usar ese para determinar el nombre
        if (grupoId >= 1 && grupoId <= 5) {
            return {
                nombre: nombresGrupos[grupoId - 1],
                descripcion: descripcionesGrupos[grupoId - 1]
            };
        }
        
        // Si tenemos un índice válido, usar ese como respaldo
        if (indice >= 0 && indice < nombresGrupos.length) {
            return {
                nombre: nombresGrupos[indice],
                descripcion: descripcionesGrupos[indice]
            };
        }
        
        // Último recurso: mantener el nombre actual o usar un valor por defecto
        return {
            nombre: nombreActual || nombresGrupos[0] || 'Administración',
            descripcion: grupo.descripcion || descripcionesGrupos[0] || 'Sin descripción'
        };
    };

    // Función para ordenar grupos en el orden específico
    const ordenarGrupos = (grupos: any[]) => {
        const ordenGrupos = ['Administración', 'UPDI', 'AGP', 'Recursos Humanos', 'Dirección'];
        return grupos.sort((a, b) => {
            const indexA = ordenGrupos.indexOf(a.nombre);
            const indexB = ordenGrupos.indexOf(b.nombre);
            // Si ambos están en el orden definido, ordenar por índice
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            // Si solo uno está en el orden definido, ese va primero
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            // Si ninguno está en el orden definido, ordenar alfabéticamente
            return String(a.nombre || '').localeCompare(String(b.nombre || ''));
        });
    };

    // Funciones para gestionar grupos de comité (usando backend)
    const inicializarGruposComite = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            // Verificar cuántos grupos existen
            const res = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
            let grupos: any[] = [];
            
            if (res.ok) {
                const data = await res.json();
                grupos = Array.isArray(data) ? data : [data];
            }
            
            // Asegurar que siempre hay exactamente 5 grupos con los nombres correctos
            const gruposNombres = [
                { nombre: 'Administración', descripcion: 'Grupo de Administración para evaluación de postulantes' },
                { nombre: 'UPDI', descripcion: 'Grupo UPDI para evaluación de postulantes' },
                { nombre: 'AGP', descripcion: 'Grupo AGP para evaluación de postulantes' },
                { nombre: 'Recursos Humanos', descripcion: 'Grupo de Recursos Humanos para evaluación de postulantes' },
                { nombre: 'Dirección', descripcion: 'Grupo de Dirección para evaluación de postulantes' }
            ];
            
            if (grupos.length < 5) {
                // Crear los grupos faltantes con los nombres específicos
                for (let i = grupos.length; i < 5; i++) {
                    try {
                        const grupo = gruposNombres[i];
                        await fetch(`${API_BASE_URL}/grupos-comite`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                nombre: grupo.nombre,
                                descripcion: grupo.descripcion
                            })
                        });
                    } catch (error) {
                        console.warn(`Error al crear grupo ${i + 1}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error al inicializar grupos:', error);
        }
    };

    const handleManageGruposComite = async () => {
        setShowGruposComiteModal(true);
        setLoadingGrupos(true);
        setSelectedGrupo(null);
        
        try {
            // Asegurar que existan los 5 grupos
            await inicializarGruposComite();
            
            // Cargar usuarios del comité
            await fetchUsuariosComite();
            
            // Cargar grupos desde el backend
            await fetchGruposComite();
        } catch (error) {
            console.error('Error al inicializar grupos de comité:', error);
            mostrarAlerta('Error al cargar los grupos de comité', 'error');
        } finally {
            setLoadingGrupos(false);
        }
    };

    const fetchGruposComite = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            
            const grupos = await res.json();
            // Asegurar que es un array y procesar cada grupo
            let gruposArray = Array.isArray(grupos) ? grupos : (grupos ? [grupos] : []);
            
            // Ordenar grupos por ID primero para tener un orden consistente
            gruposArray = gruposArray.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
            
            // Normalizar cada grupo para asegurar que usuarios y convocatorias sean arrays y campos sean strings
            gruposArray = gruposArray.map((grupo: any, indice: number) => {
                // Normalizar el nombre del grupo usando el ID o el índice
                const nombreNormalizado = normalizarNombreGrupo(grupo, indice);
                
                return {
                    ...grupo,
                    nombre: nombreNormalizado.nombre,
                    descripcion: nombreNormalizado.descripcion,
                    usuarios: Array.isArray(grupo.usuarios) ? grupo.usuarios : (grupo.usuarios ? [grupo.usuarios] : []),
                    convocatorias: Array.isArray(grupo.convocatorias) ? grupo.convocatorias : (grupo.convocatorias ? [grupo.convocatorias] : [])
                };
            });
            
            // Asegurar que hay exactamente 5 grupos
            if (gruposArray.length < 5) {
                await inicializarGruposComite();
                // Volver a cargar
                const res2 = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
                if (res2.ok) {
                    const grupos2 = await res2.json();
                    let gruposArray2 = Array.isArray(grupos2) ? grupos2 : (grupos2 ? [grupos2] : []);
                    // Ordenar grupos por ID primero
                    gruposArray2 = gruposArray2.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
                    // Normalizar de nuevo
                    gruposArray2 = gruposArray2.map((grupo: any, indice: number) => {
                        // Normalizar el nombre del grupo usando el ID o el índice
                        const nombreNormalizado = normalizarNombreGrupo(grupo, indice);
                        
                        return {
                            ...grupo,
                            nombre: nombreNormalizado.nombre,
                            descripcion: nombreNormalizado.descripcion,
                            usuarios: Array.isArray(grupo.usuarios) ? grupo.usuarios : (grupo.usuarios ? [grupo.usuarios] : []),
                            convocatorias: Array.isArray(grupo.convocatorias) ? grupo.convocatorias : (grupo.convocatorias ? [grupo.convocatorias] : [])
                        };
                    });
                    setGruposComite(ordenarGrupos(gruposArray2.slice(0, 5)));
                }
            } else {
                // Limitar a 5 y ordenar
                setGruposComite(ordenarGrupos(gruposArray.slice(0, 5)));
            }
        } catch (error: any) {
            console.error('Error al obtener grupos:', error);
            mostrarAlerta('Error al cargar los grupos de comité desde el servidor', 'error');
        }
    };

    const fetchUsuariosComite = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_URL}?roles=comite`, { headers });
            if (res.ok) {
                const data = await res.json();
                const usuariosComiteData = data
                    .filter((u: any) => (u.rol || '').toLowerCase() === 'comite')
                    .map((u: any) => ({
                        id: u.IDUSUARIO,
                        nombre: u.nombreCompleto,
                        apellidoPaterno: u.apellidoPaterno || '',
                        apellidoMaterno: u.apellidoMaterno || '',
                        email: u.correo,
                        rol: 'Comité',
                        estado: u.estado === 'ACTIVO' ? 'Activo' : 'Desactivo',
                    }));
                setUsuariosComite(usuariosComiteData);
            }
        } catch (error: any) {
            console.error('Error al obtener usuarios del comité:', error);
        }
    };

    const fetchConvocatoriasGrupo = async (grupoId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            // Obtener todas las convocatorias disponibles
            const resDisponibles = await fetch(`${API_BASE_URL}/convocatorias`, { 
                headers: { 'ngrok-skip-browser-warning': 'true' }
            });
            if (resDisponibles.ok) {
                const todasConvocatorias = await resDisponibles.json();
                setConvocatoriasDisponibles(todasConvocatorias);
            }
            
            // Obtener convocatorias asignadas al grupo desde el backend
            const resAsignadas = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/convocatorias`, { headers });
            if (resAsignadas.ok) {
                const asignadas = await resAsignadas.json();
                // Normalizar para asegurar que es un array y convertir campos a strings si es necesario
                const convocatoriasArray = Array.isArray(asignadas) ? asignadas : (asignadas ? [asignadas] : []);
                // Asegurar que todos los campos sean strings o valores válidos
                const convocatoriasNormalizadas = convocatoriasArray.map((conv: any) => ({
                    ...conv,
                    puesto: typeof conv.puesto === 'string' ? conv.puesto : String(conv.puesto || 'Sin puesto'),
                    area: typeof conv.area === 'string' ? conv.area : String(conv.area || 'Sin área'),
                    numeroCAS: typeof conv.numeroCAS === 'string' ? conv.numeroCAS : String(conv.numeroCAS || 'N/A'),
                    estado: typeof conv.estado === 'string' ? conv.estado : String(conv.estado || '')
                }));
                setConvocatoriasAsignadas(convocatoriasNormalizadas);
            } else {
                setConvocatoriasAsignadas([]);
            }
        } catch (error: any) {
            console.error('Error al obtener convocatorias del grupo:', error);
            setConvocatoriasAsignadas([]);
        }
    };

    const handleAsignarConvocatoriaGrupo = async (grupoId: number, convocatoriaId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/convocatorias`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ convocatoriaId })
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al asignar convocatoria');
            }
            
            // Obtener el nombre del grupo para el mensaje
            const grupoNombre = gruposComite.find((g: any) => g.id === grupoId)?.nombre || 'el grupo';
            mostrarAlerta(`Convocatoria asignada a ${grupoNombre} exitosamente`, 'success');
            
            // Actualizar el grupo seleccionado y refrescar grupos
            if (selectedGrupo && selectedGrupo.id === grupoId) {
                await fetchConvocatoriasGrupo(grupoId);
            }
            await fetchGruposComite();
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al asignar convocatoria', 'error');
        }
    };

    const handleRemoverConvocatoriaGrupo = async (grupoId: number, convocatoriaId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/convocatorias/${convocatoriaId}`, {
                method: 'DELETE',
                headers
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al remover convocatoria');
            }
            
            // Obtener el nombre del grupo para el mensaje
            const grupoNombre = gruposComite.find((g: any) => g.id === grupoId)?.nombre || 'el grupo';
            mostrarAlerta(`Convocatoria removida de ${grupoNombre} exitosamente`, 'success');
            
            // Actualizar el grupo seleccionado y refrescar grupos
            if (selectedGrupo && selectedGrupo.id === grupoId) {
                await fetchConvocatoriasGrupo(grupoId);
            }
            await fetchGruposComite();
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al remover convocatoria', 'error');
        }
    };

    const handleAsignarUsuarioAGrupo = async (grupoId: number, userId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/usuarios`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId })
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al asignar usuario');
            }
            
            // Obtener el nombre del grupo para el mensaje
            const grupoNombre = gruposComite.find((g: any) => g.id === grupoId)?.nombre || 'el grupo';
            mostrarAlerta(`Usuario asignado a ${grupoNombre} exitosamente`, 'success');
            
            // Actualizar el grupo seleccionado
            if (selectedGrupo && selectedGrupo.id === grupoId) {
                // Recargar datos del grupo desde el backend
                const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}`, { headers });
                if (resGrupo.ok) {
                    const grupoActualizado = await resGrupo.json();
                    setSelectedGrupo(grupoActualizado);
                }
            }
            
            // Refrescar todos los grupos
            await fetchGruposComite();
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al asignar usuario', 'error');
        }
    };

    const handleRemoverUsuarioDeGrupo = async (grupoId: number, userId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/usuarios/${userId}`, {
                method: 'DELETE',
                headers
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: `Error ${res.status}: ${res.statusText}` }));
                throw new Error(errorData.error || errorData.message || 'Error al remover usuario');
            }
            
            // Obtener el nombre del grupo para el mensaje
            const grupoNombre = gruposComite.find((g: any) => g.id === grupoId)?.nombre || 'el grupo';
            mostrarAlerta(`Usuario removido de ${grupoNombre} exitosamente`, 'success');
            
            // Actualizar el grupo seleccionado
            if (selectedGrupo && selectedGrupo.id === grupoId) {
                // Recargar datos del grupo desde el backend
                const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}`, { headers });
                if (resGrupo.ok) {
                    const grupoActualizado = await resGrupo.json();
                    setSelectedGrupo(grupoActualizado);
                }
            }
            
            // Refrescar todos los grupos
            await fetchGruposComite();
        } catch (error: any) {
            mostrarAlerta(error.message || 'Error al remover usuario', 'error');
        }
    };

    // Función para remover un usuario de todos los grupos de comité
    const removerUsuarioDeTodosLosGrupos = async (userId: number) => {
        const headers = getAuthHeaders();
        if (!headers) return;
        
        try {
            // Obtener todos los grupos
            const resGrupos = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
            if (!resGrupos.ok) {
                console.warn('No se pudieron obtener los grupos para remover el usuario');
                return;
            }
            
            const grupos = await resGrupos.json();
            const gruposArray = Array.isArray(grupos) ? grupos : [grupos];
            
            // Remover el usuario de cada grupo donde esté asignado
            const promesasRemocion = gruposArray.map(async (grupo: any) => {
                // Verificar si el usuario está en este grupo
                if (grupo.usuarios && Array.isArray(grupo.usuarios)) {
                    const usuarioEnGrupo = grupo.usuarios.find((u: any) => 
                        (u.id || u.IDUSUARIO) === userId
                    );
                    
                    if (usuarioEnGrupo) {
                        // Remover el usuario del grupo
                        try {
                            const res = await fetch(`${API_BASE_URL}/grupos-comite/${grupo.id}/usuarios/${userId}`, {
                                method: 'DELETE',
                                headers
                            });
                            
                            if (res.ok) {
                                console.log(`Usuario ${userId} removido del grupo ${grupo.id}`);
                            }
                        } catch (error) {
                            console.warn(`Error al remover usuario del grupo ${grupo.id}:`, error);
                        }
                    }
                }
            });
            
            await Promise.all(promesasRemocion);
            
            // Refrescar los grupos después de remover si el modal está abierto
            if (showGruposComiteModal && gruposComite.length > 0) {
                await fetchGruposComite();
            }
        } catch (error: any) {
            console.error('Error al remover usuario de todos los grupos:', error);
            // No mostrar error al usuario, solo loguear
        }
    };

    const closeGruposComiteModal = () => {
        setShowGruposComiteModal(false);
        setSelectedGrupo(null);
        setConvocatoriasDisponibles([]);
        setConvocatoriasAsignadas([]);
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setProfilePictureFile(event.target.files[0]);
        }
    };

    const handleProfilePictureUpload = async () => {
        if (!profilePictureFile) return mostrarAlerta('Por favor, selecciona una imagen para subir.', 'error');

        const headers = getAuthHeaders();
        if (!headers) return;

        // Ensure user is not null and has an id
        if (!user || !user.id) {
            return mostrarAlerta("No se pudo identificar al usuario. Por favor, intenta iniciar sesión de nuevo.", "error");
        }
        const loggedInUserId = user.id;

        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);

        try {
            const res = await fetch(`${API_URL}/${loggedInUserId}/profile-picture`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'ngrok-skip-browser-warning': 'true'
                }, // No Content-Type for FormData
                body: formData,
            });

            if (!res.ok) {
                let errorMessage = 'Error al subir la imagen de perfil';
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si la respuesta no es JSON, usar el texto de la respuesta
                    const text = await res.text();
                    if (text) errorMessage = text;
                }
                throw new Error(errorMessage);
            }

            const updatedUserResponse = await res.json();
            console.log('✅ Respuesta completa del servidor:', JSON.stringify(updatedUserResponse, null, 2));
            
            // Obtener la URL de la imagen desde diferentes posibles ubicaciones en la respuesta
            let profilePictureUrl = updatedUserResponse.user?.fotoperfil || 
                                   updatedUserResponse.user?.profilePicture || 
                                   updatedUserResponse.profilePicture || 
                                   updatedUserResponse.url ||
                                   updatedUserResponse.fotoperfil ||
                                   updatedUserResponse.fotoUrl;
            
            console.log('📷 URL de imagen extraída (raw):', profilePictureUrl);
            
            // Construir la URL usando la ruta de la API que creamos
            if (profilePictureUrl && typeof profilePictureUrl === 'string') {
                // Función helper para extraer el nombre del archivo de cualquier URL
                const extractFileName = (url: string): string | null => {
                    // Buscar el patrón /uploads/profiles/nombrearchivo (sin query params)
                    const match = url.match(/\/uploads\/profiles\/([^/?]+)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                    // Si no tiene path, puede ser solo el nombre del archivo
                    if (!url.includes('/') && !url.includes('http') && !url.includes(':')) {
                        return url;
                    }
                    return null;
                };
                
                // Extraer el nombre del archivo de la URL (sin importar si tiene ngrok, localhost, etc.)
                const fileName = extractFileName(profilePictureUrl);
                
                if (fileName) {
                    // Siempre reconstruir usando la ruta de la API: /ugel-talara/uploads/profiles/
                    profilePictureUrl = `${API_BASE_URL}/uploads/profiles/${fileName}`;
                } else {
                    // Si no pudimos extraer el nombre, intentar construir desde cero
                    if (!profilePictureUrl.startsWith('http') && !profilePictureUrl.startsWith('data:')) {
                        if (!profilePictureUrl.includes('/')) {
                            profilePictureUrl = `${API_BASE_URL}/uploads/profiles/${profilePictureUrl}`;
                        } else if (profilePictureUrl.startsWith('/uploads/')) {
                            profilePictureUrl = `${API_BASE_URL}${profilePictureUrl}`;
                        } else if (profilePictureUrl.startsWith('/')) {
                            profilePictureUrl = `${API_BASE_URL}${profilePictureUrl}`;
                        }
                    }
                }
            }
            
            console.log('🎯 URL de imagen final (construida):', profilePictureUrl);
            
            // Actualizar el contexto de autenticación con la URL de la imagen
            if (profilePictureUrl) {
                // Actualizar el estado local PRIMERO para que se vea inmediatamente
                setUserProfilePicture(profilePictureUrl);
                
                // Actualizar el perfil del usuario en el contexto
                const updatedUserData = { 
                    ...user, 
                    profilePicture: profilePictureUrl,
                    fotoperfil: profilePictureUrl 
                };
                updateUserProfile(updatedUserData);
                console.log('✅ Usuario actualizado en contexto:', updatedUserData);
                
                // También actualizar en localStorage para persistencia
                try {
                    const savedUser = localStorage.getItem('user');
                    if (savedUser) {
                        const userObj = JSON.parse(savedUser);
                        userObj.profilePicture = profilePictureUrl;
                        userObj.fotoperfil = profilePictureUrl;
                        localStorage.setItem('user', JSON.stringify(userObj));
                        console.log('✅ Usuario actualizado en localStorage');
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudo actualizar el usuario en localStorage:', e);
                }
                
                mostrarAlerta('Imagen de perfil actualizada con éxito', 'success');
                
                // NO recargar la página, solo esperar un momento para que se actualice el estado
                setTimeout(() => {
                    // Forzar re-renderizado refrescando los datos del usuario desde el backend
                    fetchUserProfilePicture();
                }, 300);
            } else {
                console.warn('⚠️ No se pudo obtener la URL de la imagen del servidor');
                mostrarAlerta('No se pudo obtener la URL de la imagen actualizada', 'error');
            }
            
            setProfilePictureFile(null);
        } catch (error: any) {
            console.error("Error uploading profile picture:", error);
            mostrarAlerta(error.message || 'Error al subir la imagen de perfil', 'error');
        }
    };

    const getRolBgColor = (rol?: string) => {
        if (!rol) return temaAzul ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-500/10 border-gray-500/30 text-gray-300';
        const colors: { [key: string]: string } = {
            'RR.HH': temaAzul ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-blue-500/10 border-blue-500/30 text-blue-300',
            'Comité': temaAzul ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-purple-500/10 border-purple-500/30 text-purple-300',
            'Tramite': temaAzul ? 'bg-green-100 border-green-300 text-green-700' : 'bg-green-500/10 border-green-500/30 text-green-300',
            'Postulante': temaAzul ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
            'Administrador': temaAzul ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-orange-500/10 border-orange-500/30 text-orange-300',
            'Admin': temaAzul ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-orange-500/10 border-orange-500/30 text-orange-300',
        };
        return colors[rol] || (temaAzul ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-gray-500/10 border-gray-500/30 text-gray-300');
    };

    const usuariosFiltrados = usuarios.filter(u => {
        // Búsqueda por nombre o email
        const matchNombreEmail = !searchTerm || 
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro por rol
        const matchRol = !filtroRol || u.rol === filtroRol;
        
        // Búsqueda por documento
        const matchDocumento = (!tipoDocumentoBusqueda || !numeroDocumentoBusqueda) || 
            (u.tipoDocumento && u.tipoDocumento.toLowerCase() === tipoDocumentoBusqueda.toLowerCase() &&
             u.documento && u.documento.toLowerCase().includes(numeroDocumentoBusqueda.toLowerCase()));
        
        return matchNombreEmail && matchRol && matchDocumento;
    });

    return (
        <div className={`min-h-screen w-full text-gray-800 flex ${temaAzul ? 'bg-gradient-to-br from-blue-50 via-white to-blue-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white'}`}>
            <aside className={`w-16 sm:w-64 border-r flex-shrink-0 flex flex-col p-2 sm:p-4 shadow-lg ${temaAzul ? 'bg-gradient-to-b from-blue-100 to-blue-200 border-blue-400' : 'bg-gradient-to-b from-blue-800 to-blue-900 border-blue-500'}`}>
                <div className="text-lg sm:text-2xl font-bold mb-4 sm:mb-10 text-center truncate" style={{color: temaAzul ? '#2563eb' : '#60a5fa'}}>
                    <span className="hidden sm:inline">AdminPanel</span>
                    <span className="sm:hidden">AP</span>
                </div>
                <nav className="flex-grow">
                    <ul>
                        <li>
                            <a href="#" className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg transition-colors font-medium ${temaAzul ? 'bg-blue-300 text-blue-800 hover:bg-blue-400' : 'bg-blue-600 text-blue-100 hover:bg-blue-500'}`}>
                                <User size={18} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Gestión Usuarios</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div className={`mt-auto border-t pt-2 sm:pt-4 ${temaAzul ? 'border-blue-200' : 'border-blue-700'}`}>
                    <button onClick={() => setShowProfileModal(true)} className={`flex items-center gap-2 sm:gap-3 w-full text-left px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors ${temaAzul ? 'hover:bg-blue-200 text-blue-800' : 'hover:bg-blue-700 text-blue-100'}`}>
                        <div className="relative flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                            {/* Avatar por defecto - siempre visible como fallback */}
                            <div 
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white border-2 border-blue-400 text-xs sm:text-base ${userProfilePicture && userProfilePicture !== 'null' && userProfilePicture !== '' ? 'hidden' : ''}`}
                            >
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            {/* Imagen de perfil - se muestra si existe */}
                            {userProfilePicture && userProfilePicture !== 'null' && userProfilePicture !== '' && (
                                <img 
                                    key={userProfilePicture} 
                                    src={userProfilePicture} 
                                    alt="Profile" 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-400"
                                    style={{ display: 'block' }}
                                    onError={(e) => {
                                        console.error('❌ Error al cargar imagen de perfil en sidebar:', userProfilePicture);
                                        console.error('Error details:', e);
                                        e.currentTarget.style.display = 'none';
                                        // Mostrar el avatar por defecto si falla
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) {
                                            fallback.style.display = 'flex';
                                        }
                                    }}
                                    onLoad={() => {
                                        console.log('✅ Imagen de perfil cargada exitosamente en sidebar:', userProfilePicture);
                                    }}
                                />
                            )}
                        </div>
                        <div className="hidden sm:block min-w-0">
                            <p className={`font-semibold truncate ${temaAzul ? 'text-blue-800' : 'text-blue-100'}`}>{userName}</p>
                            <p className={`text-xs ${temaAzul ? 'text-blue-600' : 'text-blue-200'}`}>Ver Perfil</p>
                        </div>
                    </button>
                    <button onClick={() => cambiarTema(!temaAzul)} className={`flex items-center gap-2 sm:gap-3 w-full text-left mt-1 sm:mt-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${temaAzul ? 'text-blue-700 hover:bg-blue-200 font-medium' : 'text-blue-100 hover:bg-blue-700 font-medium'}`}>
                        <Palette size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Cambiar Tema</span>
                    </button>
                    <button onClick={logout} className={`flex items-center gap-2 sm:gap-3 w-full text-left mt-1 sm:mt-2 px-2 sm:px-4 py-2 rounded-lg transition-colors ${temaAzul ? 'text-red-600 hover:bg-red-100 hover:text-red-700 font-medium' : 'text-red-300 hover:bg-red-800 hover:text-red-200 font-medium'}`}>
                        <LogOut size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 relative overflow-y-auto">
                <div className="absolute inset-0 z-0" style={{ backgroundImage: `linear-gradient(to right, ${temaAzul ? 'rgba(59,130,246,0.05)' : 'rgba(147,197,253,0.1)'} 1px, transparent 1px), linear-gradient(to bottom, ${temaAzul ? 'rgba(59,130,246,0.05)' : 'rgba(147,197,253,0.1)'} 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
                <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -z-10 ${temaAzul ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-gradient-to-br from-blue-700/20 to-cyan-700/20'}`} />
                <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl -z-10 ${temaAzul ? 'bg-gradient-to-tr from-blue-100 to-blue-200' : 'bg-gradient-to-tr from-blue-800/20 to-blue-900/20'}`} />
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    <header className="mb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight ${temaAzul ? 'text-gray-800' : 'text-blue-50'}`}>Gestión de Usuarios</h1>
                                <p className={`text-xs sm:text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'} mt-1`}>Administra todos los usuarios del sistema y sus roles.</p>
                            </div>
                            <button 
                                onClick={handleManageGruposComite} 
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md text-xs sm:text-sm"
                            >
                                <Briefcase size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">Gestionar Grupos de Comité</span>
                                <span className="sm:hidden">Grupos</span>
                            </button>
                        </div>
                    </header>
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full md:w-auto"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${temaAzul ? 'text-gray-400' : 'text-blue-300'}`} size={20} /><input type="text" placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${temaAzul ? 'bg-white border border-gray-300 text-gray-800' : 'bg-blue-800 border border-blue-600 text-blue-50 placeholder-blue-300'}`} /></div>
                            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className={`w-full md:w-auto rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${temaAzul ? 'bg-white border border-gray-300 text-gray-800' : 'bg-blue-800 border border-blue-600 text-blue-50'}`}><option value="">Todos los roles</option>{rolesDisponibles.map(r => <option key={r} value={r}>{r}</option>)}</select>
                            <button onClick={abrirFormParaCrear} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md"><Plus size={18} /> Nuevo Usuario</button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 items-center border-t pt-4">
                            <div className={`flex items-center gap-2 text-sm font-medium ${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>
                                <span className={`${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>Buscar por documento:</span>
                            </div>
                            <select value={tipoDocumentoBusqueda} onChange={(e) => { setTipoDocumentoBusqueda(e.target.value); if (!e.target.value) setNumeroDocumentoBusqueda(''); }} className={`w-full md:w-auto rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 ${temaAzul ? 'bg-white border border-gray-300 text-gray-800' : 'bg-blue-800 border border-blue-600 text-blue-50'}`}>
                                <option value="">Seleccione tipo</option>
                                <option value="dni">DNI</option>
                                <option value="pasaporte">Pasaporte</option>
                                <option value="carnet_extranjeria">Carnet de Extranjería</option>
                            </select>
                            <div className="relative flex-grow w-full md:w-auto">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${temaAzul ? 'text-gray-400' : 'text-blue-300'}`} size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Número de documento..." 
                                    value={numeroDocumentoBusqueda} 
                                    onChange={(e) => setNumeroDocumentoBusqueda(e.target.value)}
                                    disabled={!tipoDocumentoBusqueda}
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${!tipoDocumentoBusqueda ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' : temaAzul ? 'bg-white border border-gray-300 text-gray-800' : 'bg-blue-800 border border-blue-600 text-blue-50 placeholder-blue-300'}`} 
                                />
                            </div>
                            {(tipoDocumentoBusqueda || numeroDocumentoBusqueda) && (
                                <button 
                                    onClick={() => { setTipoDocumentoBusqueda(''); setNumeroDocumentoBusqueda(''); }}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${temaAzul ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                    <div className={`border rounded-lg overflow-x-auto shadow-md ${temaAzul ? 'bg-white border-gray-200' : 'bg-slate-900/80 border-slate-700'}`}>
                        <table className="w-full min-w-[1200px]">
                            <thead className={temaAzul ? 'bg-blue-50' : 'bg-slate-800'}>
                                <tr>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Nombre Completo</th>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Email</th>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Documento</th>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Rol</th>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Estado</th>
                                    <th className={`p-3 text-left text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Fecha Creación</th>
                                    <th className={`p-3 text-right text-xs font-medium uppercase ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className={temaAzul ? 'divide-y divide-gray-200' : 'divide-y divide-slate-700'}>
                                  {loading ? (<tr><td colSpan={7} className={`text-center py-16 ${temaAzul ? 'text-gray-500' : 'text-blue-300'}`}>Cargando usuarios...</td></tr>) : usuariosFiltrados.length > 0 ? (usuariosFiltrados.map(usuario => (
                                      <tr key={usuario.id} className={temaAzul ? 'hover:bg-blue-50' : 'hover:bg-slate-800/50'}>
                                          <td className="p-3">
                                              <div className={`font-medium ${temaAzul ? 'text-gray-800' : 'text-blue-50'}`}>
                                                  {usuario.nombre} {usuario.apellidoPaterno || ''} {usuario.apellidoMaterno || ''}
                                              </div>
                                              {(usuario.apellidoPaterno || usuario.apellidoMaterno) && (
                                                  <div className={`text-xs ${temaAzul ? 'text-gray-500' : 'text-blue-300'}`}>
                                                      {usuario.apellidoPaterno && `P: ${usuario.apellidoPaterno}`}
                                                      {usuario.apellidoPaterno && usuario.apellidoMaterno && ' • '}
                                                      {usuario.apellidoMaterno && `M: ${usuario.apellidoMaterno}`}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="p-3">
                                              <div className={`text-sm ${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>{usuario.email}</div>
                                          </td>
                                          <td className="p-3">
                                              {usuario.documento ? (
                                                  <div>
                                                      <div className={`text-sm font-medium ${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>{usuario.documento}</div>
                                                      {usuario.tipoDocumento && (
                                                          <div className={`text-xs ${temaAzul ? 'text-gray-500' : 'text-blue-300'}`}>{usuario.tipoDocumento.toUpperCase()}</div>
                                                      )}
                                                  </div>
                                              ) : (
                                                  <span className={`text-sm ${temaAzul ? 'text-gray-400' : 'text-blue-400'}`}>-</span>
                                              )}
                                          </td>
                                          <td className="p-3">
                                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRolBgColor(usuario.rol)}`}>{usuario.rol}</span>
                                          </td>
                                          <td className="p-3">
                                              <button onClick={() => toggleEstado(usuario.id, usuario.estado)} className={`px-2 py-1 text-xs font-semibold rounded-full border ${usuario.estado === 'Activo' ? (temaAzul ? 'bg-green-100 text-green-700 border-green-300' : 'bg-green-500/10 text-green-300 border-green-500/30') : (temaAzul ? 'bg-red-100 text-red-700 border-red-300' : 'bg-red-500/10 text-red-300 border-red-500/30')}`}>{usuario.estado}</button>
                                          </td>
                                          <td className="p-3">
                                              <div className={`text-sm ${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>{usuario.fecha}</div>
                                          </td>
                                          <td className="p-3 text-right space-x-2">
                                              <button onClick={() => handleViewDetails(usuario)} className="text-blue-400 p-1 hover:text-blue-600 transition-colors" title="Ver detalles"><Eye size={18} /></button>
                                              {usuario.rol === 'Comité' && (
                                                  <button onClick={() => handleManageConvocatorias(usuario)} className="text-purple-400 p-1 hover:text-purple-600 transition-colors" title="Gestionar convocatorias"><Briefcase size={18} /></button>
                                              )}
                                              <button onClick={() => abrirFormParaEditar(usuario)} className="text-blue-400 p-1 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={18} /></button>
                                              <button onClick={() => handleDeleteRequest(usuario.id)} className="text-red-400 p-1 hover:text-red-600 transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                                          </td>
                                      </tr>
                                  ))) : (<tr><td colSpan={7} className={`text-center py-16 ${temaAzul ? 'text-gray-500' : 'text-blue-300'}`}>No se encontraron usuarios que coincidan con los filtros.</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <AnimatePresence>{mensaje.texto && (<motion.div initial={{ opacity: 0, y: 50, scale: 0.3 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }} className={`fixed bottom-5 right-5 p-4 rounded-lg text-white font-semibold z-50 ${mensaje.tipo === 'success' ? 'bg-green-600' : ''} ${mensaje.tipo === 'error' ? 'bg-red-600' : ''} ${mensaje.tipo === 'deleted' ? 'bg-yellow-600' : ''}`}>{mensaje.texto}</motion.div>)}</AnimatePresence>
            <AnimatePresence>{mostrarForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={cerrarYLimpiarFormulario}>
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white border border-blue-300 rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-blue-800">{editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
                                <button onClick={cerrarYLimpiarFormulario} className="text-blue-600 hover:text-blue-800"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Nombre Completo</label>
                                        <input type="text" value={formData.nombre || ''} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Apellido Paterno</label>
                                        <input type="text" value={formData.apellidoPaterno || ''} onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Apellido Materno</label>
                                        <input type="text" value={formData.apellidoMaterno || ''} onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Correo Electrónico</label>
                                        <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Teléfono <span className="text-gray-500 text-xs font-normal">(opcional)</span></label>
                                        <input type="text" value={formData.telefono || ''} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" placeholder="Teléfono (opcional)" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Tipo de Documento</label>
                                        <select 
                                            value={formData.tipoDocumento || ''} 
                                            onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value, documento: e.target.value ? formData.documento : '' })} 
                                            className="mt-1 w-full bg-blue-50 border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-blue-900" 
                                            required
                                        >
                                            <option value="">Seleccione un tipo</option>
                                            <option value="dni">DNI</option>
                                            <option value="pasaporte">Pasaporte</option>
                                            <option value="carnet_extranjeria">Carnet de Extranjería</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Número de Documento</label>
                                        <input 
                                            type="text" 
                                            value={formData.documento || ''} 
                                            onChange={(e) => setFormData({ ...formData, documento: e.target.value })} 
                                            disabled={!formData.tipoDocumento} 
                                            className={`mt-1 w-full pl-3 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400 ${
                                                !formData.tipoDocumento
                                                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-blue-50 border-blue-300'
                                            }`} 
                                            placeholder={!formData.tipoDocumento ? 'Seleccione primero el tipo de documento' : 'Ingrese el número de documento'} 
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-blue-700">Rol</label>
                                        <select value={formData.rol || ''} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className="mt-1 w-full bg-blue-50 border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-blue-900">
                                            {rolesParaCreacion.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-blue-700">Estado</label>
                                    <select value={formData.estado || 'ACTIVO'} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} className="mt-1 w-full bg-blue-50 border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-blue-900">
                                        <option value="ACTIVO">Activo</option>
                                        <option value="INACTIVO">Desactivo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-blue-700">{editando ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
                                    <div className="relative">
                                        <input type={showPassword ? 'text' : 'password'} value={passwordData.contrasena} onChange={(e) => setPasswordData({ ...passwordData, contrasena: e.target.value })} className="mt-1 w-full pl-3 pr-10 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" required={!editando} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-blue-600">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-blue-700">Confirmar Contraseña</label>
                                    <input type={showPassword ? 'text' : 'password'} value={passwordData.confirmarContrasena} onChange={(e) => setPasswordData({ ...passwordData, confirmarContrasena: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400" required={!editando || !!passwordData.contrasena} />
                                </div>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button type="button" onClick={cerrarYLimpiarFormulario} className="px-4 py-2 bg-blue-200 text-blue-800 rounded-lg font-semibold hover:bg-blue-300">Cancelar</button>
                                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90">
                                        <Check size={18} /> {editando ? 'Guardar Cambios' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
            )}</AnimatePresence>
            <AnimatePresence>{showProfileModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}><motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-white border border-blue-300 rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-blue-800">Mi Perfil</h2><button onClick={() => { setShowProfileModal(false); setEditingProfile({ documento: '', telefono: '' }); setProfilePasswordData({ actual: '', nueva: '', confirmar: '' }); }} className="text-blue-600 hover:text-blue-800"><X size={24} /></button></div>
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><p className="text-sm text-blue-600 font-medium">Nombre Completo</p><p className="font-semibold text-blue-900">{user?.nombreCompleto || 'No disponible'}</p></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Apellido Paterno</p><p className="font-semibold text-blue-900">{user?.apellidoPaterno || 'No disponible'}</p></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Apellido Materno</p><p className="font-semibold text-blue-900">{user?.apellidoMaterno || 'No disponible'}</p></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Email</p><p className="font-semibold text-blue-900">{user?.correo || user?.email || 'No disponible'}</p></div>
                                    <div><label className="text-sm text-blue-600 font-medium">Teléfono</label><input type="text" value={editingProfile.telefono || user?.telefono || ''} onChange={(e) => setEditingProfile({ ...editingProfile, telefono: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900" placeholder="Ingrese el teléfono" /></div>
                                    <div><label className="text-sm text-blue-600 font-medium">DNI / Documento</label><input type="text" value={editingProfile.documento || user?.documento || user?.dni || ''} onChange={(e) => setEditingProfile({ ...editingProfile, documento: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900" placeholder="Ingrese el número de documento" /></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Tipo de Documento</p><p className="font-semibold text-blue-900">{(user?.tipoDocumento || 'DNI').toUpperCase()}</p></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Rol</p><span className={`font-medium px-2 py-1 text-xs rounded-full self-start ${getRolBgColor(mapDBRoleToUI(user?.rol))}`}>{mapDBRoleToUI(user?.rol) || 'No disponible'}</span></div>
                                    <div><p className="text-sm text-blue-600 font-medium">Estado</p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user?.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user?.estado || 'No disponible'}</span></div>
                                </div>
                                <div className="flex flex-col items-center space-y-2 border-t border-blue-200 pt-4">
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                                        {/* Avatar por defecto - visible como fallback */}
                                        <div 
                                            className={`w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-2xl sm:text-3xl border-2 border-blue-500 ${userProfilePicture && userProfilePicture !== 'null' && userProfilePicture !== '' ? 'hidden' : ''}`}
                                        >
                                            {userName.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Imagen de perfil - se muestra si existe */}
                                        {userProfilePicture && userProfilePicture !== 'null' && userProfilePicture !== '' && (
                                            <img 
                                                key={userProfilePicture} 
                                                src={userProfilePicture} 
                                                alt="Profile" 
                                                className="w-full h-full rounded-full object-cover border-2 border-blue-500"
                                                style={{ display: 'block' }}
                                                onError={(e) => {
                                                    console.error('❌ Error al cargar imagen de perfil en modal:', userProfilePicture);
                                                    console.error('Error details:', e);
                                                    e.currentTarget.style.display = 'none';
                                                    // Mostrar el avatar por defecto si falla
                                                    const fallback = e.currentTarget.previousElementSibling as HTMLElement;
                                                    if (fallback) {
                                                        fallback.style.display = 'flex';
                                                    }
                                                }}
                                                onLoad={() => {
                                                    console.log('✅ Imagen de perfil cargada exitosamente en modal:', userProfilePicture);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        className="text-xs sm:text-sm text-blue-600 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 w-full sm:w-auto" 
                                    />
                                    {profilePictureFile && (
                                        <button 
                                            onClick={handleProfilePictureUpload} 
                                            className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors text-white text-xs sm:text-sm w-full sm:w-auto"
                                        >
                                            Subir Imagen
                                        </button>
                                    )}
                                </div>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="space-y-4 border-t border-blue-200 pt-6">
                                <h3 className="font-semibold text-blue-800">Editar Información Personal</h3>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90">
                                        <Check size={18} /> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                            <form onSubmit={handleProfilePasswordChange} className="space-y-4 border-t border-blue-200 pt-6"><h3 className="font-semibold text-blue-800">Cambiar Contraseña</h3><div><label className="text-sm font-medium text-blue-700">Contraseña Actual</label><input type="password" value={profilePasswordData.actual} onChange={e => setProfilePasswordData({...profilePasswordData, actual: e.target.value})} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900" required /></div><div><label className="text-sm font-medium text-blue-700">Nueva Contraseña</label><input type="password" value={profilePasswordData.nueva} onChange={e => setProfilePasswordData({...profilePasswordData, nueva: e.target.value})} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900" required /></div>
                                <div>
                                    <label className="text-sm font-medium text-blue-700">Confirmar Nueva Contraseña</label>
                                    <input type="password" value={profilePasswordData.confirmar} onChange={e => setProfilePasswordData({ ...profilePasswordData, confirmar: e.target.value })} className="mt-1 w-full pl-3 pr-3 py-2 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-900" required />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:opacity-90">
                                        <Check size={18} /> Guardar Contraseña
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {confirmingDelete !== null && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-sm p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-500/10 mb-4"><Shield size={24} className="text-yellow-400" /></div>
                            <h3 className="text-lg font-medium text-white mb-2">Confirmación Requerida</h3>
                            <p className="text-sm text-slate-400 mb-6">¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.</p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setConfirmingDelete(null)} className="px-6 py-2 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600 transition-colors w-full">Cancelar</button>
                                <button onClick={eliminarUsuario} className="px-6 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition-colors w-full">Aceptar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showDetailsModal && selectedUserForDetails && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeDetailsModal}>
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Detalles del Usuario</h2>
                                <button onClick={closeDetailsModal} className="text-slate-400 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="space-y-4 text-slate-300">
                                <p><strong>Nombre Completo:</strong> {selectedUserForDetails.nombre}</p>
                                {selectedUserForDetails.apellidoPaterno && <p><strong>Apellido Paterno:</strong> {selectedUserForDetails.apellidoPaterno}</p>}
                                {selectedUserForDetails.apellidoMaterno && <p><strong>Apellido Materno:</strong> {selectedUserForDetails.apellidoMaterno}</p>}
                                <p><strong>Correo Electrónico:</strong> {selectedUserForDetails.email}</p>
                                {selectedUserForDetails.telefono && <p><strong>Teléfono:</strong> {selectedUserForDetails.telefono}</p>}
                                {selectedUserForDetails.tipoDocumento && <p><strong>Tipo de Documento:</strong> {selectedUserForDetails.tipoDocumento.toUpperCase()}</p>}
                                {selectedUserForDetails.documento && <p><strong>Número de Documento:</strong> {selectedUserForDetails.documento}</p>}
                                <p><strong>Rol:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRolBgColor(selectedUserForDetails.rol)}`}>{selectedUserForDetails.rol}</span></p>
                                <p><strong>Estado:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedUserForDetails.estado === 'Activo' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>{selectedUserForDetails.estado}</span></p>
                                <p><strong>Fecha de Creación:</strong> {selectedUserForDetails.fecha}</p>
                            </div>
                            <div className="flex justify-end pt-6">
                                <button onClick={closeDetailsModal} className="px-4 py-2 bg-slate-700 rounded-lg font-semibold hover:bg-slate-600">Cerrar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showConvocatoriasModal && selectedUserConvocatorias && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeConvocatoriasModal}>
                        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`${temaAzul ? 'bg-white' : 'bg-slate-900'} border ${temaAzul ? 'border-gray-200' : 'border-slate-700'} rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
                            <div className={`flex justify-between items-center p-6 border-b ${temaAzul ? 'border-gray-200' : 'border-slate-700'}`}>
                                <div>
                                    <h2 className={`text-xl font-bold ${temaAzul ? 'text-gray-800' : 'text-white'}`}>Gestionar Grupo del Usuario</h2>
                                    <p className={`text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                                        Usuario: {selectedUserConvocatorias.nombre} {selectedUserConvocatorias.apellidoPaterno || ''} {selectedUserConvocatorias.apellidoMaterno || ''}
                                    </p>
                                    <p className={`text-xs ${temaAzul ? 'text-blue-600' : 'text-blue-400'} mt-1`}>
                                        Un usuario solo puede estar en un grupo a la vez
                                    </p>
                                </div>
                                <button onClick={closeConvocatoriasModal} className={`${temaAzul ? 'text-gray-600 hover:text-gray-800' : 'text-slate-400 hover:text-white'}`}><X size={24} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingGrupoUsuario ? (
                                    <div className={`text-center py-12 ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>Cargando información del grupo...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Grupo Actual del Usuario */}
                                        <div>
                                            <h3 className={`text-lg font-semibold mb-4 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>Grupo Actual</h3>
                                            {grupoUsuarioActual ? (
                                                <div className={`p-4 rounded-lg border ${temaAzul ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700'}`}>
                                                    <p className={`font-semibold text-lg mb-2 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                        {grupoUsuarioActual.nombre}
                                                    </p>
                                                    <p className={`text-sm mb-3 ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                        {grupoUsuarioActual.descripcion}
                                                    </p>
                                                    <p className={`text-xs mb-3 ${temaAzul ? 'text-gray-500' : 'text-gray-500'}`}>
                                                        Usuarios en el grupo: {grupoUsuarioActual.usuarios?.length || 0}
                                                    </p>
                                                    <button
                                                        onClick={handleRemoverUsuarioDeGrupoDesdeModal}
                                                        className={`w-full px-4 py-2 rounded text-sm font-medium ${temaAzul ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                    >
                                                        Remover de este Grupo
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className={`p-4 rounded-lg border ${temaAzul ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
                                                    <p className={`text-center ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        El usuario no está asignado a ningún grupo
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Grupos Disponibles */}
                                        <div>
                                            <h3 className={`text-lg font-semibold mb-4 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>Grupos Disponibles</h3>
                                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                                {(() => {
                                                    // Filtrar "Recursos Humanos" una sola vez
                                                    const gruposFiltrados = gruposComite.filter((grupo: any) => {
                                                        const grupoNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || 0);
                                                        const nombreFinal = grupoNormalizado.nombre;
                                                        return nombreFinal !== 'Recursos Humanos' && grupo.id !== 4;
                                                    });
                                                    
                                                    if (gruposFiltrados.length === 0) {
                                                        return (
                                                            <p className={`text-center py-8 ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                No hay grupos disponibles
                                                            </p>
                                                        );
                                                    }
                                                    
                                                    return gruposFiltrados.map((grupo: any) => {
                                                    const grupoNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || 0);
                                                    const nombreFinal = grupoNormalizado.nombre;
                                                    const descripcionFinal = grupoNormalizado.descripcion;
                                                    const esGrupoActual = grupoUsuarioActual?.id === grupo.id;
                                                    const usuariosEnGrupo = Array.isArray(grupo.usuarios) ? grupo.usuarios : [];
                                                    
                                                    return (
                                                        <div 
                                                            key={grupo.id} 
                                                            className={`p-4 rounded-lg border ${
                                                                esGrupoActual 
                                                                    ? temaAzul 
                                                                        ? 'bg-green-100 border-green-300' 
                                                                        : 'bg-green-900/30 border-green-600'
                                                                    : temaAzul
                                                                        ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                                                                        : 'bg-slate-800 border-slate-700 hover:border-blue-500'
                                                            } transition-all cursor-pointer`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex-1">
                                                                    <p className={`font-semibold ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                                        {nombreFinal}
                                                                    </p>
                                                                    <p className={`text-xs mt-1 ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        {descripcionFinal}
                                                                    </p>
                                                                    <p className={`text-xs mt-2 ${temaAzul ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                        👥 {usuariosEnGrupo.length} usuario(s)
                                                                    </p>
                                                                </div>
                                                                {esGrupoActual && (
                                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${temaAzul ? 'bg-green-200 text-green-800' : 'bg-green-800 text-green-200'}`}>
                                                                        Actual
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!esGrupoActual && (
                                                                <button
                                                                    onClick={() => handleAsignarUsuarioAGrupoDesdeModal(grupo.id)}
                                                                    className={`w-full mt-2 px-3 py-2 rounded text-sm font-medium ${temaAzul ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                                >
                                                                    Asignar a este Grupo
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showGruposComiteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4"
                        onClick={closeGruposComiteModal}
                    >
                        <motion.div 
                            initial={{ y: -50, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 50, opacity: 0 }} 
                            className={`${temaAzul ? 'bg-white' : 'bg-slate-900'} border ${temaAzul ? 'border-gray-200' : 'border-slate-700'} rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col`} 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b ${temaAzul ? 'border-gray-200' : 'border-slate-700'} gap-3`}>
                                <div className="flex-1">
                                    <h2 className={`text-lg sm:text-xl font-bold ${temaAzul ? 'text-gray-800' : 'text-white'}`}>Gestión de Grupos de Comité</h2>
                                    <p className={`text-xs sm:text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                                        Organiza los usuarios del comité en los grupos: Administración, UPDI, AGP, Recursos Humanos y Dirección. Las convocatorias son opcionales. Un usuario solo puede estar en un grupo.
                                    </p>
                                </div>
                                <button onClick={closeGruposComiteModal} className={`${temaAzul ? 'text-gray-600 hover:text-gray-800' : 'text-slate-400 hover:text-white'} self-end sm:self-auto`}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                {loadingGrupos ? (
                                    <div className={`text-center py-12 ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>Cargando grupos...</div>
                                ) : (
                                    <>
                                    {/* Mostrar información de usuarios disponibles */}
                                    {usuariosComite.length > 0 && (
                                        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${temaAzul ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'}`}>
                                            <h3 className={`text-sm sm:text-base font-semibold mb-2 ${temaAzul ? 'text-blue-800' : 'text-blue-200'}`}>
                                                Usuarios del Comité Disponibles ({usuariosComite.length})
                                            </h3>
                                            <p className={`text-xs sm:text-sm ${temaAzul ? 'text-blue-600' : 'text-blue-300'}`}>
                                                Selecciona un grupo para asignar usuarios. Haz clic en una tarjeta de grupo para comenzar. Un usuario solo puede estar en un grupo.
                                            </p>
                                        </div>
                                    )}
                                    
                                    {usuariosComite.length === 0 && (
                                        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${temaAzul ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-900/20 border-yellow-700'}`}>
                                            <p className={`text-xs sm:text-sm ${temaAzul ? 'text-yellow-800' : 'text-yellow-200'}`}>
                                                ⚠️ No hay usuarios del comité disponibles. Primero crea usuarios con el rol "Comité" en la sección de gestión de usuarios.
                                            </p>
                                        </div>
                                    )}
                                    
                                    <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                        Todos los Grupos de Comité (Administración, UPDI, AGP, Dirección)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        {gruposComite
                                            .filter((grupo) => {
                                                // Filtrar "Recursos Humanos" antes de renderizar (por nombre e ID)
                                                const grupoNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || 0);
                                                const nombreFinal = grupoNormalizado.nombre;
                                                // Excluir si es "Recursos Humanos" por nombre o si tiene ID 4 (que corresponde a Recursos Humanos)
                                                return nombreFinal !== 'Recursos Humanos' && grupo.id !== 4;
                                            })
                                            .map((grupo, index) => {
                                            // Usar la función de normalización que usa el ID del grupo para obtener el nombre correcto
                                            const grupoNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || index);
                                            const nombreFinal = grupoNormalizado.nombre;
                                            const descripcionFinal = grupoNormalizado.descripcion;
                                            
                                            return (
                                            <div 
                                                key={grupo.id} 
                                                className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
                                                    selectedGrupo?.id === grupo.id 
                                                        ? temaAzul 
                                                            ? 'bg-blue-100 border-blue-400' 
                                                            : 'bg-blue-900/50 border-blue-500'
                                                        : temaAzul
                                                            ? 'bg-gray-50 border-gray-300 hover:border-blue-400'
                                                            : 'bg-slate-800 border-slate-700 hover:border-blue-500'
                                                }`}
                                                onClick={async () => {
                                                    const headers = getAuthHeaders();
                                                    if (!headers) return;
                                                    
                                                    try {
                                                        // Cargar datos completos del grupo desde el backend
                                                        const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupo.id}`, { headers });
                                                        if (resGrupo.ok) {
                                                            const grupoCompleto = await resGrupo.json();
                                                            // Normalizar usuarios - asegurar que son arrays y normalizar campos
                                                            const usuariosNormalizados = Array.isArray(grupoCompleto.usuarios) 
                                                                ? grupoCompleto.usuarios.map((u: any) => ({
                                                                    ...u,
                                                                    nombre: typeof u.nombre === 'string' ? u.nombre : String(u.nombre || ''),
                                                                    nombreCompleto: typeof u.nombreCompleto === 'string' ? u.nombreCompleto : String(u.nombreCompleto || ''),
                                                                    apellidoPaterno: typeof u.apellidoPaterno === 'string' ? u.apellidoPaterno : String(u.apellidoPaterno || ''),
                                                                    apellidoMaterno: typeof u.apellidoMaterno === 'string' ? u.apellidoMaterno : String(u.apellidoMaterno || ''),
                                                                    email: typeof u.email === 'string' ? u.email : String(u.email || '')
                                                                }))
                                                                : [];
                                                            // Normalizar convocatorias
                                                            const convocatoriasNormalizadas = Array.isArray(grupoCompleto.convocatorias)
                                                                ? grupoCompleto.convocatorias.map((c: any) => ({
                                                                    ...c,
                                                                    puesto: typeof c.puesto === 'string' ? c.puesto : String(c.puesto || 'Sin puesto'),
                                                                    area: typeof c.area === 'string' ? c.area : String(c.area || 'Sin área'),
                                                                    numeroCAS: typeof c.numeroCAS === 'string' ? c.numeroCAS : String(c.numeroCAS || 'N/A')
                                                                }))
                                                                : [];
                                                            // Normalizar el nombre del grupo
                                                            const nombreNormalizado = normalizarNombreGrupo(grupoCompleto, (grupoCompleto.id - 1) || 0);
                                                            
                                                            setSelectedGrupo({
                                                                ...grupoCompleto,
                                                                nombre: nombreNormalizado.nombre,
                                                                descripcion: nombreNormalizado.descripcion,
                                                                usuarios: usuariosNormalizados,
                                                                convocatorias: convocatoriasNormalizadas
                                                            });
                                                            
                                                            // Cargar convocatorias disponibles
                                                            await fetchConvocatoriasGrupo(grupo.id);
                                                        } else {
                                                            // Si falla, usar los datos del grupo actual y normalizar
                                                            const usuariosNormalizados = Array.isArray(grupo.usuarios) ? grupo.usuarios : [];
                                                            const convocatoriasNormalizadas = Array.isArray(grupo.convocatorias) ? grupo.convocatorias : [];
                                                            const nombreNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || 0);
                                                            setSelectedGrupo({
                                                                ...grupo,
                                                                nombre: nombreNormalizado.nombre,
                                                                descripcion: nombreNormalizado.descripcion,
                                                                usuarios: usuariosNormalizados,
                                                                convocatorias: convocatoriasNormalizadas
                                                            });
                                                            await fetchConvocatoriasGrupo(grupo.id);
                                                        }
                                                    } catch (error) {
                                                        console.error('Error al cargar datos del grupo:', error);
                                                        // Normalizar datos del grupo actual antes de establecerlo
                                                        const usuariosNormalizados = Array.isArray(grupo.usuarios) ? grupo.usuarios : [];
                                                        const convocatoriasNormalizadas = Array.isArray(grupo.convocatorias) ? grupo.convocatorias : [];
                                                        const nombreNormalizado = normalizarNombreGrupo(grupo, (grupo.id - 1) || 0);
                                                        setSelectedGrupo({
                                                            ...grupo,
                                                            nombre: nombreNormalizado.nombre,
                                                            descripcion: nombreNormalizado.descripcion,
                                                            usuarios: usuariosNormalizados,
                                                            convocatorias: convocatoriasNormalizadas
                                                        });
                                                    }
                                                }}
                                            >
                                                <h3 className={`font-semibold text-base sm:text-lg mb-2 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                    {nombreFinal}
                                                </h3>
                                                <p className={`text-xs sm:text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'} mb-2 sm:mb-3`}>
                                                    {descripcionFinal}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 sm:justify-between text-xs mb-2 sm:mb-3">
                                                    <span className={`px-2 py-1 rounded ${temaAzul ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/30 text-blue-300'}`}>
                                                        👥 {grupo.usuarios?.length || 0} usuarios
                                                    </span>
                                                    <span className={`px-2 py-1 rounded ${temaAzul ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-300'}`}>
                                                        📋 {grupo.convocatorias?.length || 0} convocatorias
                                                    </span>
                                                </div>
                                                {/* Lista de usuarios en la tarjeta */}
                                                {grupo.usuarios && grupo.usuarios.length > 0 && (
                                                    <div className={`mt-2 pt-2 border-t ${temaAzul ? 'border-gray-200' : 'border-slate-600'}`}>
                                                        <p className={`text-xs font-medium mb-1 ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                            Usuarios asignados:
                                                        </p>
                                                        <div className="space-y-1">
                                                            {grupo.usuarios.slice(0, 2).map((usuario: any) => {
                                                                const nombreUsuario = String(usuario.nombre || usuario.nombreCompleto || `${usuario.apellidoPaterno || ''} ${usuario.apellidoMaterno || ''}`.trim() || 'Sin nombre');
                                                                return (
                                                                    <p key={usuario.id || usuario.IDUSUARIO} className={`text-xs truncate ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        • {nombreUsuario}
                                                                    </p>
                                                                );
                                                            })}
                                                            {grupo.usuarios.length > 2 && (
                                                                <p className={`text-xs italic ${temaAzul ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                    ... y {grupo.usuarios.length - 2} más
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            );
                                        })}
                                    </div>
                                    </>
                                )}
                                
                                {selectedGrupo && (
                                    <div className={`mt-4 sm:mt-6 border-t pt-4 sm:pt-6 ${temaAzul ? 'border-gray-200' : 'border-slate-700'}`}>
                                        <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                            {String(selectedGrupo.nombre || 'Sin nombre')}
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                            {/* Usuarios del Grupo */}
                                            <div>
                                                <h4 className={`text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${temaAzul ? 'text-gray-700' : 'text-gray-300'}`}>
                                                    Usuarios de {selectedGrupo.nombre} ({selectedGrupo.usuarios?.length || 0})
                                                </h4>
                                                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto mb-3 sm:mb-4">
                                                    {selectedGrupo.usuarios && selectedGrupo.usuarios.length > 0 ? (
                                                        selectedGrupo.usuarios.map((usuario: any) => (
                                                            <div 
                                                                key={usuario.id || usuario.IDUSUARIO} 
                                                                className={`p-2 sm:p-3 rounded-lg border flex justify-between items-start gap-2 ${
                                                                    temaAzul 
                                                                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                                                                        : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-xs sm:text-sm font-medium truncate ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                                        {String(usuario.nombre || usuario.nombreCompleto || `${usuario.apellidoPaterno || ''} ${usuario.apellidoMaterno || ''}`.trim() || 'Sin nombre')}
                                                                    </p>
                                                                    {usuario.email && (
                                                                        <p className={`text-xs mt-1 truncate ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                            {String(usuario.email || '')}
                                                                        </p>
                                                                    )}
                                                                    {(usuario.apellidoPaterno || usuario.apellidoMaterno) && (
                                                                        <p className={`text-xs truncate ${temaAzul ? 'text-gray-500' : 'text-gray-500'}`}>
                                                                            {String(usuario.apellidoPaterno || '')} {String(usuario.apellidoMaterno || '')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoverUsuarioDeGrupo(selectedGrupo.id, usuario.id || usuario.IDUSUARIO)}
                                                                    className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                                                        temaAzul
                                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                            : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                                                    }`}
                                                                    title={`Remover de ${selectedGrupo.nombre}`}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className={`p-4 text-center rounded-lg border ${temaAzul ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
                                                            <p className={`text-sm ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                No hay usuarios asignados a {selectedGrupo.nombre}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Lista de usuarios disponibles para asignar */}
                                                <div className={`border-t pt-3 sm:pt-4 ${temaAzul ? 'border-gray-200' : 'border-slate-700'}`}>
                                                    <h5 className={`text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                        Agregar Usuario a {selectedGrupo.nombre}
                                                    </h5>
                                                    
                                                    {(() => {
                                                        // Obtener todos los usuarios que ya están asignados a cualquier grupo
                                                        const usuariosAsignadosEnOtrosGrupos = new Set<number>();
                                                        gruposComite.forEach((grupo: any) => {
                                                            if (grupo.id !== selectedGrupo.id && grupo.usuarios) {
                                                                grupo.usuarios.forEach((usuario: any) => {
                                                                    usuariosAsignadosEnOtrosGrupos.add(usuario.id || usuario.IDUSUARIO);
                                                                });
                                                            }
                                                        });
                                                        
                                                        // Filtrar usuarios: excluir los que ya están en este grupo o en otros grupos
                                                        const usuariosDisponibles = usuariosComite.filter(u => {
                                                            const estaEnEsteGrupo = selectedGrupo.usuarios?.some((ug: any) => 
                                                                (ug.id || ug.IDUSUARIO) === u.id
                                                            );
                                                            const estaEnOtroGrupo = usuariosAsignadosEnOtrosGrupos.has(u.id);
                                                            return !estaEnEsteGrupo && !estaEnOtroGrupo;
                                                        });
                                                        
                                                        if (usuariosDisponibles.length === 0) {
                                                            return (
                                                                <div className={`p-3 rounded-lg border ${temaAzul ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
                                                                    <p className={`text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        {usuariosComite.length === 0 
                                                                            ? 'No hay usuarios del comité disponibles. Crea usuarios con el rol "Comité" primero.'
                                                                            : 'Todos los usuarios del comité ya están asignados a este grupo o a otro grupo. Un usuario solo puede estar en un grupo a la vez.'}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <>
                                                                {/* Selector de usuarios */}
                                                                <div className="mb-3 sm:mb-4">
                                                                    <label className={`block text-xs sm:text-sm font-medium mb-2 ${temaAzul ? 'text-gray-700' : 'text-gray-300'}`}>
                                                        Selecciona un usuario del dropdown:
                                                                    </label>
                                                                    <select
                                                                        onChange={(e) => {
                                                                            const userId = parseInt(e.target.value);
                                                                            if (userId) {
                                                                                handleAsignarUsuarioAGrupo(selectedGrupo.id, userId);
                                                                                e.target.value = '';
                                                                            }
                                                                        }}
                                                                        className={`w-full px-3 py-2 rounded-lg border text-xs sm:text-sm ${
                                                                            temaAzul 
                                                                                ? 'bg-white border-gray-300 text-gray-800' 
                                                                                : 'bg-slate-800 border-slate-600 text-white'
                                                                        }`}
                                                                    >
                                                                        <option value="">-- Selecciona un usuario para agregar --</option>
                                                                        {usuariosDisponibles.map(u => {
                                                                            const nombreCompleto = `${String(u.nombre || '')} ${String(u.apellidoPaterno || '')} ${String(u.apellidoMaterno || '')}`.trim();
                                                                            const email = u.email ? `(${String(u.email)})` : '';
                                                                            return (
                                                                                <option key={u.id} value={u.id}>
                                                                                    {nombreCompleto} {email}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>
                                                                
                                                                {/* Lista visual de usuarios disponibles */}
                                                                <div>
                                                                    <label className={`block text-xs sm:text-sm font-medium mb-2 ${temaAzul ? 'text-gray-700' : 'text-gray-300'}`}>
                                                        O haz clic directamente en un usuario:
                                                                    </label>
                                                                    <div className={`p-2 sm:p-3 rounded-lg border ${temaAzul ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'}`}>
                                                                        <p className={`text-xs mb-2 ${temaAzul ? 'text-blue-700' : 'text-blue-300'}`}>
                                                                            {usuariosDisponibles.length} usuario(s) disponible(s):
                                                                        </p>
                                                                        <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                                                                            {usuariosDisponibles.map(u => (
                                                                                <div
                                                                                    key={u.id}
                                                                                    onClick={() => handleAsignarUsuarioAGrupo(selectedGrupo.id, u.id)}
                                                                                    className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${
                                                                                        temaAzul
                                                                                            ? 'bg-white border-gray-200 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md'
                                                                                            : 'bg-slate-800 border-slate-700 hover:bg-blue-900/40 hover:border-blue-600 hover:shadow-md'
                                                                                    }`}
                                                                                >
                                                                                    <p className={`text-xs sm:text-sm font-medium truncate ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                                                        {String(u.nombre || '')} {String(u.apellidoPaterno || '')} {String(u.apellidoMaterno || '')}
                                                                                    </p>
                                                                                    {u.email && (
                                                                                        <p className={`text-xs mt-1 truncate ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                                            📧 {String(u.email || '')}
                                                                                        </p>
                                                                                    )}
                                                                                    <p className={`text-xs mt-1 ${temaAzul ? 'text-blue-600' : 'text-blue-400'}`}>
                                                                                        👆 Haz clic para agregar a {String(selectedGrupo.nombre || 'este grupo')}
                                                                                    </p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            {/* Convocatorias del Grupo */}
                                            <div>
                                                <h4 className={`text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${temaAzul ? 'text-gray-700' : 'text-gray-300'}`}>Convocatorias de {selectedGrupo.nombre}</h4>
                                                <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                                                    {/* Convocatorias Asignadas */}
                                                    {convocatoriasAsignadas.length > 0 ? (
                                                        convocatoriasAsignadas.map((conv) => (
                                                            <div 
                                                                key={conv.IDCONVOCATORIA} 
                                                                className={`p-2 rounded border flex justify-between items-start gap-2 ${
                                                                    temaAzul 
                                                                        ? 'bg-green-50 border-green-200' 
                                                                        : 'bg-slate-800 border-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-xs sm:text-sm font-medium truncate ${temaAzul ? 'text-gray-800' : 'text-white'}`}>
                                                                        {conv.puesto || 'Sin puesto'}
                                                                    </p>
                                                                    <p className={`text-xs truncate ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
                                                                        {conv.area || 'Sin área'} - CAS: {conv.numeroCAS || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoverConvocatoriaGrupo(selectedGrupo.id, conv.IDCONVOCATORIA)}
                                                                    className="flex-shrink-0 text-red-500 hover:text-red-700 text-xs px-2 py-1"
                                                                >
                                                                    Remover
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className={`text-sm ${temaAzul ? 'text-gray-500' : 'text-gray-400'}`}>No hay convocatorias asignadas</p>
                                                    )}
                                                    
                                                    {/* Lista de convocatorias disponibles */}
                                                    <div className="mt-3 sm:mt-4">
                                                        <h5 className={`text-xs sm:text-sm font-medium mb-2 ${temaAzul ? 'text-gray-700' : 'text-gray-300'}`}>
                                                            Agregar Convocatoria <span className="text-xs text-gray-500">(Opcional)</span>
                                                        </h5>
                                                        <select
                                                            onChange={(e) => {
                                                                const convId = parseInt(e.target.value);
                                                                if (convId) {
                                                                    handleAsignarConvocatoriaGrupo(selectedGrupo.id, convId);
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            className={`w-full px-3 py-2 rounded border text-xs sm:text-sm ${
                                                                temaAzul 
                                                                    ? 'bg-white border-gray-300 text-gray-800' 
                                                                    : 'bg-slate-800 border-slate-600 text-white'
                                                            }`}
                                                        >
                                                            <option value="">-- Selecciona una convocatoria (opcional) --</option>
                                                            {convocatoriasDisponibles
                                                                .filter(conv => {
                                                                    const esPublicada = conv.estado === 'Publicada' || conv.estado === 'publicada' || conv.estado === 'Activo' || conv.estado === 'activo';
                                                                    const noAsignada = !convocatoriasAsignadas.some(asc => asc.IDCONVOCATORIA === conv.IDCONVOCATORIA);
                                                                    return esPublicada && noAsignada;
                                                                })
                                                                .map(conv => (
                                                                    <option key={conv.IDCONVOCATORIA} value={conv.IDCONVOCATORIA}>
                                                                        {conv.puesto} - {conv.area} (CAS: {conv.numeroCAS})
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;