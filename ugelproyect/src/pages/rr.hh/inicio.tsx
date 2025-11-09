import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Filter, Briefcase, DollarSign, FileText, Calendar, GraduationCap, Award, X, PieChart, User, Camera, Menu, LogOut, FileSpreadsheet, Palette, Globe, Users } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import * as XLSX from 'xlsx'; // Import XLSX for Excel generation
import { motion, AnimatePresence } from 'framer-motion';

// Error Boundary Component (Sin cambios)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
	 state = { error: null };
	 static getDerivedStateFromError(error: Error) {
		 return { error };
	 }
	 render() {
		 if (this.state.error) {
			 return <div className="text-red-400 text-center py-10">Error: {(this.state.error as Error).message}</div>;
		 }
		 return this.props.children;
	 }
}

// SplitText Component (Sin cambios)
const SplitText = ({ text, className }: { text: string; className: string }) => {
	 const ref = useRef(null);
	 const [isVisible, setIsVisible] = useState(false);
	 useEffect(() => {
		 const observer = new IntersectionObserver(([entry]) => {
			 if (entry.isIntersecting) {
				 setIsVisible(true);
				 observer.disconnect();
			 }
		 }, { threshold: 0.1 });
		 if (ref.current) observer.observe(ref.current);
		 return () => observer.disconnect();
	 }, []);
	 return (
		 <div ref={ref} className={className}>
			 {text.split('').map((char, index) => (
				 <span key={index} className="inline-block" style={{ animation: isVisible ? `slideUpFadeIn 0.6s ease-out ${index * 50}ms forwards` : 'none', opacity: 0 }}>
					 {char === ' ' ? '\u00A0' : char}
				 </span>
			 ))}
		 </div>
	 );
};

// Interface Convocatoria (¡SIN CAMBIOS, TAL COMO PEDISTE!)
interface Convocatoria {
	id: number;
	area: string;
	puesto: string;
	sueldo: string;
	requisitos: string;
	experiencia: string;
  licenciatura: string;
  expPublicaMin?: string; // años experiencia mínima sector público
  expPublicaMax?: string; // años experiencia máxima sector público
	habilidades: string;
	fechaPublicacion: string;
	fechaFinalizacion: string;
	estado: string;
	numero_cas: string; // Add numero_cas field
	publicada: boolean;
}

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

const decodeFieldValue = (value: any): string => {
	if (value === null || value === undefined) {
		return '';
	}

	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}

	if (Array.isArray(value)) {
		return value.map(decodeFieldValue).join(', ');
	}

	if (typeof value === 'object') {
		if ((value as { type?: string }).type === 'Buffer' && Array.isArray((value as { data?: number[] }).data)) {
			const bufferData = (value as { data: number[] }).data;
			if (textDecoder) {
				try {
					return textDecoder.decode(new Uint8Array(bufferData));
				} catch (error) {
					console.warn('No se pudo decodificar el buffer con TextDecoder', error);
				}
			}
			return bufferData.map((byte) => String.fromCharCode(byte)).join('');
		}

		if (value instanceof Date) {
			return value.toISOString();
		}

		return JSON.stringify(value);
	}

	return '';
};

const normalizeDateField = (value: any): string => {
	const decoded = decodeFieldValue(value).trim();

	if (!decoded) {
		return '';
	}

	const sanitized = decoded.replace(' ', 'T');
	const parsed = new Date(sanitized);

	if (!Number.isNaN(parsed.getTime())) {
		const year = parsed.getUTCFullYear();
		const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
		const day = String(parsed.getUTCDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	const directMatch = decoded.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (directMatch) {
		return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
	}

	return decoded;
};

const DATE_FALLBACK = 'Fecha no disponible';

const formatDateDisplay = (value: string, options?: Intl.DateTimeFormatOptions): string => {
	if (!value) {
		return DATE_FALLBACK;
	}

	const trimmedValue = value.trim();
	const simpleDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (simpleDateMatch) {
		const year = Number(simpleDateMatch[1]);
		const month = Number(simpleDateMatch[2]) - 1;
		const day = Number(simpleDateMatch[3]);
		const date = new Date(year, month, day);
		return date.toLocaleDateString('es-ES', options);
	}

	const parsed = new Date(trimmedValue);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed.toLocaleDateString('es-ES', options);
	}

	const normalized = trimmedValue.replace(' ', 'T');
	const reparsed = new Date(normalized);
	if (!Number.isNaN(reparsed.getTime())) {
		return reparsed.toLocaleDateString('es-ES', options);
	}

	return trimmedValue;
};

const formatDateRangeDisplay = (start: string, end: string): string => {
	const startText = formatDateDisplay(start);
	const endText = formatDateDisplay(end);

	if (startText === DATE_FALLBACK && endText === DATE_FALLBACK) {
		return DATE_FALLBACK;
	}

	return `${startText} - ${endText}`;
};

const decodeStringField = (value: any, fallback = ''): string => {
	const decoded = decodeFieldValue(value).trim();
	return decoded || fallback;
};

const decodeBooleanField = (value: any, fallback = false): boolean => {
	if (typeof value === 'boolean') {
		return value;
	}

	if (value === null || value === undefined) {
		return fallback;
	}

	if (typeof value === 'number') {
		return value !== 0;
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return fallback;
		}
		if (['true', '1', 'si', 'sí', 'publicada', 'activo', 'activa'].includes(normalized)) {
			return true;
		}
		if (['false', '0', 'no', 'desactivada', 'inactivo', 'inactiva', 'no publicada', 'desactivado'].includes(normalized)) {
			return false;
		}
		return fallback;
	}

	if (typeof value === 'object') {
		const decoded = decodeFieldValue(value).trim();
		if (!decoded) {
			return fallback;
		}
		return decodeBooleanField(decoded, fallback);
	}

	return fallback;
};

const normalizeEstado = (estado: string | null | undefined): string => (estado ?? '').toString().trim().toLowerCase();

const capitalizeText = (text: string): string => {
	if (!text) return '';
	return text.charAt(0).toUpperCase() + text.slice(1);
};

const isEstadoPublicado = (estado: string): boolean => {
	const normalized = normalizeEstado(estado);
	return ['publicada', 'publicado', 'activo', 'activa'].includes(normalized);
};

const isEstadoDesactivado = (estado: string): boolean => {
	const normalized = normalizeEstado(estado);
	return ['no publicada', 'no publicado', 'desactivada', 'desactivado', 'inactivo', 'inactiva', 'desactivado', 'suspendida', 'suspendido'].includes(normalized);
};

const getEstadoDisplay = (estado: string, publicada: boolean): string => {
	const normalized = normalizeEstado(estado);

	if (publicada || isEstadoPublicado(normalized)) {
		return 'Publicada';
}

	if (isEstadoDesactivado(normalized)) {
		return 'Desactivada';
	}

	if (normalized) {
		return capitalizeText(normalized);
	}

	return publicada ? 'Publicada' : 'Desactivada';
};

const getExperienciaDisplay = (conv: Pick<Convocatoria, 'experiencia' | 'expPublicaMin' | 'expPublicaMax'>): string => {
	const experienciaTexto = conv.experiencia?.toString().trim();
	if (experienciaTexto) {
		return experienciaTexto;
	}

	const min = conv.expPublicaMin?.toString().trim();
	const max = conv.expPublicaMax?.toString().trim();

	if (min && max) {
		if (min === max) {
			return min;
		}
		return `${min} - ${max}`;
	}

	if (min) {
		return min;
	}

	if (max) {
		return max;
	}

	return '-';
};

export default function SistemaConvocatorias() {
	const [selectedArea, setSelectedArea] = useState('Todas');
	const [showForm, setShowForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const [showChart, setShowChart] = useState(false);
	const [showProfile, setShowProfile] = useState(false);
	const [selectedConv, setSelectedConv] = useState<Convocatoria | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [profileData, setProfileData] = useState({
		name: 'Usuario Administrador',
		role: 'Recursos Humanos',
		email: 'admin@ugeltalara.gob.pe',
	});
	const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [tipoAlerta, setTipoAlerta] = useState<'success' | 'error' | 'info'>('error');
	// Cargar el tema desde localStorage o usar azul claro por defecto
	const [temaAzul, setTemaAzul] = useState(() => {
		const savedTema = localStorage.getItem('temaAzul');
		return savedTema === null ? true : savedTema === 'true';
	});
	
	// Estados para grupos de comité
	const [showGruposComiteModal, setShowGruposComiteModal] = useState(false);
	const [gruposComite, setGruposComite] = useState<any[]>([]);
	const [usuariosComite, setUsuariosComite] = useState<any[]>([]);
	const [selectedGrupo, setSelectedGrupo] = useState<any | null>(null);
	const [loadingGrupos, setLoadingGrupos] = useState(false);
	const [convocatoriasDisponibles, setConvocatoriasDisponibles] = useState<any[]>([]);
	const [convocatoriasAsignadas, setConvocatoriasAsignadas] = useState<any[]>([]);
	const [convocatoriasAsignadasATodosLosGrupos, setConvocatoriasAsignadasATodosLosGrupos] = useState<any[]>([]);
	
	// Función para actualizar el tema y guardarlo en localStorage
	const cambiarTema = (nuevoTema: boolean) => {
		setTemaAzul(nuevoTema);
		localStorage.setItem('temaAzul', String(nuevoTema));
	};
	
	const [formData, setFormData] = useState({
		area: '',
		puesto: '',
		sueldo: '',
		requisitos: '',
    licenciatura: 'No',
    expPublicaMin: '',
    expPublicaMax: '',
		experiencia: '',
		habilidades: '',
		fechaPublicacion: '',
		fechaFinalizacion: '',
		numero_cas: '',
		publicada: false,
	});

	const allAreas = [
		'Administración - Informática',
		'Administración - Tesorería',
		'Administración - Patrimonio',
		'Dirección - Mesa de Partes',
		'Dirección',
		'AGP',
		'Recursos Humanos',
		'Recursos Humanos - Remuneraciones',
		'Recursos Humanos - Escalafón',
		'UPDI',
		'Archivo',
	];

	const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#2563eb', '#1e40af', '#1e3a8a', '#1e90ff', '#4169e1', '#4682b4', '#5f9ea0', '#87ceeb'];

	const API_URL = 'http://localhost:9000/ugel-talara/convocatorias';
	const API_BASE_URL = 'http://localhost:9000/ugel-talara';
	const API_USERS_URL = `${API_BASE_URL}/users`;

	const navigate = useNavigate();
	const { user, updateUserProfile, logout } = useAuth(); // Use useAuth hook

	// Cargar datos de perfil desde localStorage (Sin cambios)
	useEffect(() => {
		if (user) {
			setProfileData({
				name: user.nombreCompleto || 'No disponible',
				role: user.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'No disponible', // Format role
				email: user.email || 'No disponible',
			});
			setProfileImage(user.profilePicture || null);
		}
	}, [user]);

	// Fetch convocatorias
	const fetchConvocatorias = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(`${API_URL}`);
			if (!response.ok) throw new Error('No se pudo conectar al servidor.');
			const data = await response.json();
			// Mapear datos del backend al formato del frontend
			const mappedData: Convocatoria[] = data.map((item: any, index: number) => {
				const expPublicaMin = decodeStringField(item.expPublicaMin);
				const expPublicaMax = decodeStringField(item.expPublicaMax);
				const experienciaRequerida = decodeStringField(
					item.experienciaTotal ??
					item.experienciaRequerida ??
					item.experienciaLaboral ??
					item.experienciaGeneral ??
					item.experiencia
				);
				const fechaInicio = normalizeDateField(item.fechaInicio ?? item.fechaPublicacion) || '';
				const fechaFin = normalizeDateField(item.fechaFin ?? item.fechaFinalizacion) || '';
				const rawIdValue = item.IDCONVOCATORIA ?? item.id ?? 0;
				const parsedId = Number(rawIdValue);
				const id = Number.isNaN(parsedId) || parsedId === 0 ? index + 1 : parsedId;
				// Determinar si está publicada basándose en el campo publicada del backend
				const publicadaValue = decodeBooleanField(item.publicada, false);
				
				// Obtener el estado del backend
				const estadoRaw = decodeStringField(item.estado);
				const estadoNormalizado = normalizeEstado(estadoRaw);
				
				// Determinar el estado final:
				// 1. Si el campo publicada es true, el estado debe ser "Publicada"
				// 2. Si el campo publicada es false, el estado debe ser "No Publicada"
				// 3. Si el estado del backend indica que está publicada/activa pero publicada es false, usar el estado del backend
				// 4. Si el estado del backend indica que está desactivada pero publicada es true, usar "Publicada"
				let estadoFinal: string;
				if (publicadaValue) {
					// Si está publicada, el estado debe ser "Publicada"
					estadoFinal = 'Publicada';
				} else if (isEstadoDesactivado(estadoNormalizado)) {
					// Si está explícitamente desactivada, usar "No Publicada"
					estadoFinal = 'No Publicada';
				} else if (isEstadoPublicado(estadoNormalizado)) {
					// Si el estado indica que está publicada pero publicada es false, mantener el estado del backend
					// pero normalizar a "Publicada" para consistencia
					estadoFinal = 'Publicada';
				} else {
					// Por defecto, si no hay información, usar "No Publicada"
					estadoFinal = estadoRaw || 'No Publicada';
				}
				
				// El campo publicada debe reflejar el estado final
				const publicada = estadoFinal === 'Publicada' || publicadaValue;

				return {
					id,
					area: decodeStringField(item.area),
					puesto: decodeStringField(item.puesto),
					sueldo: decodeStringField(item.sueldo),
					requisitos: decodeStringField(item.requisitosAcademicos ?? item.requisitos),
					experiencia: experienciaRequerida,
					licenciatura: decodeStringField(item.tituloProfesional ?? item.licenciatura, 'No'),
					expPublicaMin: expPublicaMin || undefined,
					expPublicaMax: expPublicaMax || undefined,
					habilidades: decodeStringField(item.habilidadesTecnicas ?? item.habilidades),
					fechaPublicacion: fechaInicio,
					fechaFinalizacion: fechaFin,
					estado: estadoFinal,
					numero_cas: decodeStringField(item.numeroCAS ?? item.numero_cas),
					publicada
				};
			});
			setConvocatorias(mappedData);
		} catch (err: any) {
			console.error('Error fetching convocatorias:', err);
			setError('No se pudo conectar al servidor. ' + (err.message || ''));
			setTipoAlerta('error');
			setConvocatorias([]);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchConvocatorias();
	}, []);

	// Guardar perfil (Sin cambios)
	const saveProfile = async () => {
		// This function should probably update the backend and then call updateUserProfile
		// For now, we'll just update the local state to match the user context
		// since the fields are read-only for display
		setShowProfile(false);
	};

	// Logout (Sin cambios)
	const handleLogout = () => {
		localStorage.clear();
		logout(); // Use logout from AuthContext
		navigate('/', { replace: true });
	};

	// Funciones para grupos de comité
	const getAuthHeaders = useCallback(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			console.error("Authentication headers are missing. Redirecting to login.");
			logout();
			return null;
		}
		return { 
			'Content-Type': 'application/json', 
			'Authorization': `Bearer ${token}`,
			'ngrok-skip-browser-warning': 'true'
		};
	}, [logout]);

	const mostrarAlerta = (texto: string, tipo: 'success' | 'error' | 'info') => {
		setError(texto);
		setTipoAlerta(tipo);
		setTimeout(() => {
			setError(null);
			setTipoAlerta('error');
		}, 5000);
	};

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
		
		// Si el ID existe y está en rango válido (1-5), usar ese índice
		if (grupoId && grupoId >= 1 && grupoId <= 5) {
			const indicePorId = grupoId - 1;
			return {
				nombre: nombresGrupos[indicePorId] || `Grupo ${grupoId}`,
				descripcion: grupo.descripcion || descripcionesGrupos[indicePorId] || 'Sin descripción'
			};
		}
		
		// Si el índice está en rango válido, usar ese índice
		if (indice >= 0 && indice < nombresGrupos.length) {
			return {
				nombre: nombresGrupos[indice] || `Grupo ${indice + 1}`,
				descripcion: grupo.descripcion || descripcionesGrupos[indice] || 'Sin descripción'
			};
		}
		
		// Fallback: usar el nombre del grupo o un nombre genérico
		return {
			nombre: nombreActual || `Grupo ${grupoId || indice + 1}`,
			descripcion: grupo.descripcion || 'Sin descripción'
		};
	};

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
			
			// Cargar todas las convocatorias asignadas a todos los grupos
			const convocatoriasAsignadasTodos = await fetchConvocatoriasAsignadasATodosLosGrupos();
			setConvocatoriasAsignadasATodosLosGrupos(convocatoriasAsignadasTodos);
			
			// Cargar convocatorias disponibles (solo publicadas/activas) para tenerlas listas
			const resDisponibles = await fetch(`${API_BASE_URL}/convocatorias?publicada=true`, { 
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			if (resDisponibles.ok) {
				const todasConvocatorias = await resDisponibles.json();
				const convocatoriasArray = Array.isArray(todasConvocatorias) ? todasConvocatorias : [];
				// Filtrar explícitamente solo convocatorias publicadas/activas (excluir desactivadas)
				const convocatoriasPublicadas = convocatoriasArray.filter((conv: any) => {
					const estado = String(conv.estado || '').toLowerCase();
					return estado === 'publicada' || estado === 'activo' || estado === 'activa';
				});
				setConvocatoriasDisponibles(convocatoriasPublicadas);
			}
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
			const res = await fetch(`${API_USERS_URL}?roles=comite`, { headers });
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

	const fetchConvocatoriasAsignadasATodosLosGrupos = async () => {
		const headers = getAuthHeaders();
		if (!headers) return [];
		
		try {
			// Obtener todos los grupos
			const resGrupos = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
			if (!resGrupos.ok) return [];
			
			const grupos = await resGrupos.json();
			const gruposArray = Array.isArray(grupos) ? grupos : [grupos];
			
			// Obtener todas las convocatorias asignadas a todos los grupos
			const todasConvocatoriasAsignadas: any[] = [];
			for (const grupo of gruposArray) {
				try {
					const resConvocatorias = await fetch(`${API_BASE_URL}/grupos-comite/${grupo.id}/convocatorias`, { headers });
					if (resConvocatorias.ok) {
						const convocatorias = await resConvocatorias.json();
						const convArray = Array.isArray(convocatorias) ? convocatorias : [convocatorias];
						todasConvocatoriasAsignadas.push(...convArray);
					}
				} catch (error) {
					console.warn(`Error al obtener convocatorias del grupo ${grupo.id}:`, error);
				}
			}
			
			// Normalizar y eliminar duplicados (una convocatoria puede estar en múltiples grupos, pero solo queremos los IDs únicos)
			const idsUnicos = new Set<number>();
			const convocatoriasUnicas = todasConvocatoriasAsignadas.filter((conv: any) => {
				const id = conv.IDCONVOCATORIA || conv.id;
				if (id && !idsUnicos.has(id)) {
					idsUnicos.add(id);
					return true;
				}
				return false;
			});
			
			return convocatoriasUnicas.map((conv: any) => ({
				...conv,
				IDCONVOCATORIA: conv.IDCONVOCATORIA || conv.id,
				puesto: typeof conv.puesto === 'string' ? conv.puesto : String(conv.puesto || 'Sin puesto'),
				area: typeof conv.area === 'string' ? conv.area : String(conv.area || 'Sin área'),
				numeroCAS: typeof conv.numeroCAS === 'string' ? conv.numeroCAS : String(conv.numeroCAS || 'N/A'),
				estado: typeof conv.estado === 'string' ? conv.estado : String(conv.estado || '')
			}));
		} catch (error: any) {
			console.error('Error al obtener convocatorias asignadas a todos los grupos:', error);
			return [];
		}
	};

	const fetchConvocatoriasGrupo = async (grupoId: number) => {
		const headers = getAuthHeaders();
		if (!headers) return;
		
		try {
			// Obtener todas las convocatorias disponibles (solo las publicadas/activas y no asignadas)
			const resDisponibles = await fetch(`${API_BASE_URL}/convocatorias?publicada=true`, { 
				headers: { 'ngrok-skip-browser-warning': 'true' }
			});
			if (resDisponibles.ok) {
				const todasConvocatorias = await resDisponibles.json();
				const convocatoriasArray = Array.isArray(todasConvocatorias) ? todasConvocatorias : [];
				// Filtrar explícitamente solo convocatorias publicadas/activas (excluir desactivadas)
				const convocatoriasPublicadas = convocatoriasArray.filter((conv: any) => {
					const estado = String(conv.estado || '').toLowerCase();
					// Solo incluir si está explícitamente publicada o activa
					return estado === 'publicada' || estado === 'activo' || estado === 'activa';
				});
				setConvocatoriasDisponibles(convocatoriasPublicadas);
			} else {
				setConvocatoriasDisponibles([]);
			}
			
			// Obtener todas las convocatorias asignadas a todos los grupos
			const convocatoriasAsignadasTodos = await fetchConvocatoriasAsignadasATodosLosGrupos();
			setConvocatoriasAsignadasATodosLosGrupos(convocatoriasAsignadasTodos);
			
			// Obtener convocatorias asignadas al grupo actual
			// El backend ahora incluye convocatorias con estado "Inactivo" (asignadas a grupos)
			// y excluye solo las que tienen estado "No Publicada" (desactivadas)
			const resAsignadas = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}/convocatorias`, { headers });
			if (resAsignadas.ok) {
				const asignadas = await resAsignadas.json();
				// Normalizar para asegurar que es un array y convertir campos a strings si es necesario
				const convocatoriasArray = Array.isArray(asignadas) ? asignadas : (asignadas ? [asignadas] : []);
				// El backend ya filtra las convocatorias desactivadas, así que solo normalizamos
				// No necesitamos filtrar aquí porque el backend ya devuelve solo las válidas
				const convocatoriasValidas = convocatoriasArray;
				// Asegurar que todos los campos sean strings o valores válidos
				const convocatoriasNormalizadas = convocatoriasValidas.map((conv: any) => ({
					...conv,
					IDCONVOCATORIA: conv.IDCONVOCATORIA || conv.id,
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
			} else {
				// Si no hay grupo seleccionado, actualizar la lista de convocatorias asignadas a todos los grupos
				const convocatoriasAsignadasTodos = await fetchConvocatoriasAsignadasATodosLosGrupos();
				setConvocatoriasAsignadasATodosLosGrupos(convocatoriasAsignadasTodos);
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
			} else {
				// Si no hay grupo seleccionado, actualizar la lista de convocatorias asignadas a todos los grupos
				const convocatoriasAsignadasTodos = await fetchConvocatoriasAsignadasATodosLosGrupos();
				setConvocatoriasAsignadasATodosLosGrupos(convocatoriasAsignadasTodos);
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
			// Verificar si el usuario ya está en otro grupo antes de asignarlo
			const usuarioEnOtroGrupo = gruposComite.find((grupo: any) => {
				if (grupo.id === grupoId) return false; // Ignorar el grupo actual
				return grupo.usuarios && grupo.usuarios.some((u: any) => 
					(u.id || u.IDUSUARIO) === userId
				);
			});
			
			if (usuarioEnOtroGrupo) {
				const nombreGrupoAnterior = normalizarNombreGrupo(usuarioEnOtroGrupo, (usuarioEnOtroGrupo.id - 1) || 0).nombre;
				mostrarAlerta(`Este usuario ya está asignado al grupo "${nombreGrupoAnterior}". Un usuario solo puede estar en un grupo a la vez.`, 'error');
				return;
			}
			
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
			
			// Refrescar todos los grupos primero para actualizar la lista completa
			await fetchGruposComite();
			
			// Actualizar el grupo seleccionado después de refrescar
			if (selectedGrupo && selectedGrupo.id === grupoId) {
				// Recargar datos del grupo desde el backend
				const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}`, { headers });
				if (resGrupo.ok) {
					const grupoActualizado = await resGrupo.json();
					const nombreNormalizado = normalizarNombreGrupo(grupoActualizado, (grupoActualizado.id - 1) || 0);
					setSelectedGrupo({
						...grupoActualizado,
						nombre: nombreNormalizado.nombre,
						descripcion: nombreNormalizado.descripcion,
						usuarios: Array.isArray(grupoActualizado.usuarios) ? grupoActualizado.usuarios : []
					});
				}
			}
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
			mostrarAlerta(`Usuario removido de ${grupoNombre} exitosamente. Ahora está disponible para asignar a otro grupo.`, 'success');
			
			// Refrescar todos los grupos primero para actualizar la lista completa
			await fetchGruposComite();
			
			// Actualizar el grupo seleccionado después de refrescar
			if (selectedGrupo && selectedGrupo.id === grupoId) {
				// Recargar datos del grupo desde el backend
				const resGrupo = await fetch(`${API_BASE_URL}/grupos-comite/${grupoId}`, { headers });
				if (resGrupo.ok) {
					const grupoActualizado = await resGrupo.json();
					const nombreNormalizado = normalizarNombreGrupo(grupoActualizado, (grupoActualizado.id - 1) || 0);
					setSelectedGrupo({
						...grupoActualizado,
						nombre: nombreNormalizado.nombre,
						descripcion: nombreNormalizado.descripcion,
						usuarios: Array.isArray(grupoActualizado.usuarios) ? grupoActualizado.usuarios : []
					});
				}
			}
		} catch (error: any) {
			mostrarAlerta(error.message || 'Error al remover usuario', 'error');
		}
	};

	const closeGruposComiteModal = () => {
		setShowGruposComiteModal(false);
		setSelectedGrupo(null);
		setConvocatoriasDisponibles([]);
		setConvocatoriasAsignadas([]);
		setConvocatoriasAsignadasATodosLosGrupos([]);
	};

	// getChartData (Sin cambios)
	const getChartData = () => {
		const areaCounts: Record<string, number> = {};
		convocatorias.forEach(conv => {
			areaCounts[conv.area] = (areaCounts[conv.area] || 0) + 1;
		});
		return Object.entries(areaCounts).map(([name, value]) => ({ name, value }));
	};

	// handleInputChange (Sin cambios)
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const target = e.target;
		const { name } = target;
		let newValue: any = (target as HTMLInputElement).value;

		if (name === 'publicada') {
			const element = target as HTMLInputElement;
			newValue = element.type === 'checkbox' ? element.checked : element.value === 'true';
		}

		setFormData(prev => ({
			...prev,
			[name]: newValue,
		}));
		console.log(`Input changed: ${name}: ${newValue}`, { ...formData, [name]: newValue });
	};

	// handleProfileImageChange
	const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const formData = new FormData();
			formData.append('profilePicture', file);

			if (!user || !user.id) {
				setError("No se pudo identificar al usuario para subir la imagen.");
				setTipoAlerta('error');
				return;
			}

			try {
				const token = localStorage.getItem('token');
				const response = await fetch(`http://localhost:9000/ugel-talara/users/${user.id}/profile-picture`, {
					method: 'PUT',
					headers: { 
						'Authorization': `Bearer ${token}`
						// No Content-Type header - el navegador lo establece automáticamente para FormData
					},
					body: formData,
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ message: `Error ${response.status}: ${response.statusText}` }));
					throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${response.statusText}`);
				}

				const updatedUserResponse = await response.json();
				// El backend devuelve user.fotoperfil o profilePicture directamente
				const profilePictureUrl = updatedUserResponse.user?.fotoperfil || updatedUserResponse.user?.profilePicture || updatedUserResponse.profilePicture || updatedUserResponse.url;
				if (profilePictureUrl) {
					updateUserProfile({ profilePicture: profilePictureUrl });
					setProfileImage(profilePictureUrl);
				}
				setError("Imagen de perfil actualizada con éxito.");
				setTipoAlerta('success');
			} catch (err: any) {
				console.error("Error uploading profile picture:", err);
				setError(err.message || "Error al subir la imagen de perfil.");
				setTipoAlerta('error');
			}
		}
	};

	// handleSubmit - Mapea datos del frontend al formato del backend
	const handleSubmit = async (e: React.FormEvent, type: 'create' | 'edit') => {
		e.preventDefault();
		
		// Validar campos requeridos
		if (!formData.area || !formData.puesto || !formData.numero_cas || !formData.fechaPublicacion || !formData.fechaFinalizacion) {
			setError('Por favor, completa todos los campos requeridos: área, puesto, número CAS, fecha inicio y fecha fin.');
			setTipoAlerta('error');
			return;
		}

		// Validar fechas
		const fechaInicio = new Date(formData.fechaPublicacion);
		const fechaFin = new Date(formData.fechaFinalizacion);
		
		if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
			setError('Las fechas proporcionadas no son válidas.');
			setTipoAlerta('error');
			return;
		}
		
		if (fechaFin < fechaInicio) {
			setError('La fecha de fin debe ser posterior a la fecha de inicio.');
			setTipoAlerta('error');
			return;
		}

		// Mapear datos del frontend al formato del backend
		const publicada = Boolean(formData.publicada);
		const estado = publicada ? 'Publicada' : 'No Publicada';

		const payload: any = {
			area: formData.area.trim(),
			puesto: formData.puesto.trim(),
			sueldo: formData.sueldo ? formData.sueldo.trim() : null,
			tituloProfesional: formData.licenciatura === 'Sí' || formData.licenciatura === 'Si' ? 'Sí' : 'No',
			expPublicaMin: formData.expPublicaMin ? formData.expPublicaMin.trim() : null,
			expPublicaMax: formData.expPublicaMax ? formData.expPublicaMax.trim() : null,
			fechaInicio: new Date(formData.fechaPublicacion).toISOString().split('T')[0],
			fechaFin: new Date(formData.fechaFinalizacion).toISOString().split('T')[0],
			estado,
			publicada,
			numeroCAS: formData.numero_cas.trim(),
			requisitosAcademicos: formData.requisitos ? formData.requisitos.trim() : null,
			habilidadesTecnicas: formData.habilidades ? formData.habilidades.trim() : null,
			experienciaLaboral: formData.experiencia ? formData.experiencia.trim() : null,
			experiencia: formData.experiencia ? formData.experiencia.trim() : null,
			experienciaTotal: formData.experiencia ? formData.experiencia.trim() : null
		};

		try {
			const url = type === 'create' ? `${API_URL}` : `${API_URL}/${selectedConv!.id}`;
			const method = type === 'create' ? 'POST' : 'PUT';
			console.log(`Sending ${method} request to ${url} with payload:`, payload);
			
			const response = await fetch(url, { 
				method, 
				headers: { 'Content-Type': 'application/json' }, 
				body: JSON.stringify(payload) 
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ 
					error: `El servidor respondió con un error ${response.status}. Verifique los datos.` 
				}));
				console.error("Backend Error Details:", JSON.stringify(errorData, null, 2));
				throw new Error(errorData.error || errorData.message || `Error en la operación (Estado: ${response.status})`);
			}
			
			await fetchConvocatorias();
			setShowForm(false);
			setShowEditForm(false);
			setError(null);
			setTipoAlerta('error');
			setFormData({ 
				area: '', 
				puesto: '', 
				sueldo: '', 
				requisitos: '', 
				licenciatura: 'No', 
				expPublicaMin: '', 
				expPublicaMax: '', 
				experiencia: '',
				habilidades: '', 
				fechaPublicacion: '', 
				fechaFinalizacion: '', 
				numero_cas: '',
				publicada: false 
			});
		} catch (err: any) {
			setError(err.message || 'Error al procesar la solicitud.');
			setTipoAlerta('error');
			console.error('Error in handleSubmit:', err);
		}
	};

	// handleDelete
	const handleDelete = async () => {
		if (!selectedConv) return;
		try {
			const response = await fetch(`${API_URL}/${selectedConv.id}`, { 
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ 
					error: `Error ${response.status}: ${response.statusText}` 
				}));
				throw new Error(errorData.error || errorData.message || 'Error al eliminar');
			}
			await fetchConvocatorias();
			setShowDelete(false);
			setSelectedConv(null);
			setError(null);
			setTipoAlerta('error');
		} catch (err: any) {
			setError(err.message || 'Error al eliminar la convocatoria.');
			setTipoAlerta('error');
			console.error('Error in handleDelete:', err);
		}
	};

	// Toggle publicación - Cambiar entre Publicada y No Publicada
	const togglePublicacion = async (id: number, conv: Convocatoria) => {
		try {
			// Usar getEstadoDisplay para obtener el estado actual real
			const estadoDisplay = getEstadoDisplay(conv.estado, conv.publicada);
			const estaPublicada = isEstadoPublicado(estadoDisplay) || conv.publicada || isEstadoPublicado(conv.estado);
			
			// Determinar el nuevo estado basado en el estado actual real
			const nuevoEstado = estaPublicada ? 'No Publicada' : 'Publicada';
			const nuevaPublicada = !estaPublicada;

			const response = await fetch(`${API_URL}/${id}/estado`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ estado: nuevoEstado, publicada: nuevaPublicada })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ 
					error: `Error ${response.status}: ${response.statusText}` 
				}));
				throw new Error(errorData.error || errorData.message || 'Error al cambiar estado de publicación');
			}

			// Mostrar mensaje de éxito
			mostrarAlerta(
				nuevaPublicada 
					? 'Convocatoria publicada exitosamente' 
					: 'Convocatoria desactivada exitosamente', 
				'success'
			);

			// Si se está desactivando la convocatoria, el backend ya la remueve automáticamente de todos los grupos
			// Solo necesitamos refrescar las listas en el frontend si el modal está abierto
			const estaDesactivando = !nuevaPublicada;
			if (estaDesactivando && showGruposComiteModal) {
				const headers = getAuthHeaders();
				if (headers) {
					try {
						// Refrescar grupos y convocatorias
						await fetchGruposComite();
						const convocatoriasAsignadasTodos = await fetchConvocatoriasAsignadasATodosLosGrupos();
						setConvocatoriasAsignadasATodosLosGrupos(convocatoriasAsignadasTodos);
						
						// Si hay un grupo seleccionado, refrescar sus convocatorias
						if (selectedGrupo) {
							await fetchConvocatoriasGrupo(selectedGrupo.id);
						}
						
						mostrarAlerta('Convocatoria desactivada y removida automáticamente de todos los grupos', 'success');
					} catch (error) {
						console.error('Error al refrescar grupos después de desactivar convocatoria:', error);
					}
				}
			}

			// Refrescar las convocatorias después de cambiar el estado
			await fetchConvocatorias();
			
			// Si el modal de grupos de comité está abierto, refrescar las convocatorias disponibles
			if (showGruposComiteModal) {
				if (selectedGrupo) {
					// Si hay un grupo seleccionado, refrescar sus convocatorias
					await fetchConvocatoriasGrupo(selectedGrupo.id);
				} else {
					// Si no hay grupo seleccionado, solo refrescar la lista de disponibles
					const resDisponibles = await fetch(`${API_BASE_URL}/convocatorias?publicada=true`, { 
						headers: { 'ngrok-skip-browser-warning': 'true' }
					});
					if (resDisponibles.ok) {
						const todasConvocatorias = await resDisponibles.json();
						const convocatoriasArray = Array.isArray(todasConvocatorias) ? todasConvocatorias : [];
						// Filtrar explícitamente solo convocatorias publicadas/activas (excluir desactivadas)
						const convocatoriasPublicadas = convocatoriasArray.filter((conv: any) => {
							const estado = String(conv.estado || '').toLowerCase();
							const publicada = decodeBooleanField(conv.publicada, false);
							return (publicada || estado === 'publicada' || estado === 'activo' || estado === 'activa');
						});
						setConvocatoriasDisponibles(convocatoriasPublicadas);
					}
				}
			}
		} catch (err: any) {
			setError(err.message || 'Error al cambiar estado de publicación.');
			setTipoAlerta('error');
			console.error('Error in togglePublicacion:', err);
		}
	};


// *** FUNCIÓN downloadExcel MEJORADA PARA GENERAR TABLA PROFESIONAL Y BONITA ***
const downloadExcel = async () => {
	try {
		// Crear un nuevo libro de trabajo
		const workbook = XLSX.utils.book_new();

		// === HOJA PRINCIPAL: CONVOCATORIAS ===
		// Preparar los datos para Excel (ordenados por área y sin duplicados)
		const excelData = convocatoriasFiltradas
			.sort((a, b) => a.area.localeCompare(b.area)) // Ordenar por área
			.map((conv, index) => {
				const estadoDisplay = getEstadoDisplay(conv.estado, conv.publicada);
				return {
					'N°': index + 1,
					'Área': conv.area,
					'Puesto': conv.puesto,
					'Fecha Inicio': formatDateDisplay(conv.fechaPublicacion),
					'Fecha Fin': formatDateDisplay(conv.fechaFinalizacion),
					'Sueldo': conv.sueldo,
					'Experiencia (Años)': getExperienciaDisplay(conv),
					'Título profesional o académico': conv.licenciatura,
					'N° CAS': conv.numero_cas,
					'Estado': estadoDisplay,
					'Requisitos': conv.requisitos,
					'Habilidades': conv.habilidades
				};
			});

		// Crear hoja de trabajo vacía
		const worksheet: any = {};

		// === TÍTULOS Y ENCABEZADOS ===
		// Fila 1: Título principal (merging necesario en Excel)
		worksheet['A1'] = { v: 'SISTEMA DE CONVOCATORIAS LABORALES - UGEL TALARA', t: 's' };
		worksheet['A1'].s = {
			font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
			fill: { fgColor: { rgb: "1E40AF" } },
			alignment: { horizontal: "center", vertical: "center" }
		};

		// Fila 2: Información adicional
		worksheet['A2'] = { v: `Reporte generado el: ${new Date().toLocaleDateString('es-ES')} | Área: ${selectedArea} | Total: ${convocatoriasFiltradas.length} convocatorias`, t: 's' };
		worksheet['A2'].s = {
			font: { bold: true, size: 12, color: { rgb: "1E40AF" } },
			fill: { fgColor: { rgb: "E0F2FE" } },
			alignment: { horizontal: "center", vertical: "center" }
		};

		// Fila 3: Vacía para separación
		worksheet['A3'] = { v: '', t: 's' };

		// Fila 4: Encabezados de columnas
		const headers = ['N°', 'Área', 'Puesto', 'Fecha Inicio', 'Fecha Fin', 'Sueldo', 'Experiencia (Años)', 'Título profesional o académico', 'N° CAS', 'Estado', 'Requisitos', 'Habilidades'];
		headers.forEach((header, index) => {
			const cellAddress = XLSX.utils.encode_cell({ r: 3, c: index });
			worksheet[cellAddress] = { v: header, t: 's' };
			worksheet[cellAddress].s = {
				font: { bold: true, color: { rgb: "FFFFFF" }, size: 13 },
				fill: { fgColor: { rgb: "1E40AF" } },
				alignment: { horizontal: "center", vertical: "center" },
				border: {
					top: { style: "thin", color: { rgb: "FFFFFF" } },
					bottom: { style: "thin", color: { rgb: "FFFFFF" } },
					left: { style: "thin", color: { rgb: "FFFFFF" } },
					right: { style: "thin", color: { rgb: "FFFFFF" } }
				}
			};
		});

		// Filas 5+: Datos
		excelData.forEach((row, rowIndex) => {
			const excelRow = [
				row['N°'],
				row['Área'],
				row['Puesto'],
				row['Fecha Inicio'],
				row['Fecha Fin'],
				row['Sueldo'],
				row['Experiencia (Años)'],
				row['Título profesional o académico'],
				row['N° CAS'],
				row['Estado'],
				row['Requisitos'],
				row['Habilidades']
			];

			excelRow.forEach((cellValue, colIndex) => {
				const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
				worksheet[cellAddress] = { v: cellValue, t: typeof cellValue === 'number' ? 'n' : 's' };
				
				const isEvenRow = rowIndex % 2 === 0;
				const fillColor = isEvenRow ? "F8FAFC" : "FFFFFF";
				
				worksheet[cellAddress].s = {
					alignment: { vertical: "top", horizontal: "left" },
					border: {
						top: { style: "thin", color: { rgb: "E5E7EB" } },
						bottom: { style: "thin", color: { rgb: "E5E7EB" } },
						left: { style: "thin", color: { rgb: "E5E7EB" } },
						right: { style: "thin", color: { rgb: "E5E7EB" } }
					},
					font: { size: 11 },
					fill: { fgColor: { rgb: fillColor } }
				};
			});
		});

		// Establecer rango de la hoja
		const lastRow = excelData.length + 3;
		const lastCol = headers.length - 1;
		worksheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } });

		// === CONFIGURACIÓN DE COLUMNAS ===
		worksheet['!cols'] = [
			{ wch: 8 },   // N°
			{ wch: 35 },  // Área
			{ wch: 45 },  // Puesto
			{ wch: 18 },  // Fecha Inicio
			{ wch: 18 },  // Fecha Fin
			{ wch: 25 },  // Sueldo
			{ wch: 25 },  // Experiencia (Años)
			{ wch: 28 },  // Título profesional o académico
			{ wch: 25 },  // N° CAS
			{ wch: 18 },  // Estado
			{ wch: 70 },  // Requisitos
			{ wch: 70 }   // Habilidades
		];

		// === CONFIGURACIÓN AVANZADA ===
		worksheet['!freeze'] = { xSplit: 0, ySplit: 4 }; // Congelar encabezados
		worksheet['!autofilter'] = { ref: `A4:${XLSX.utils.encode_cell({ r: lastRow, c: lastCol })}` };

		// Agregar la hoja principal
		XLSX.utils.book_append_sheet(workbook, worksheet, '📋 Convocatorias');

		// === HOJA DE RESUMEN BONITA ===
		// Contar convocatorias activas/publicadas usando las funciones helper
		// Una convocatoria está activa/publicada si: publicada === true O estado es "publicada"/"activo"/"activa"
		const convocatoriasActivas = convocatoriasFiltradas.filter(c => {
			return c.publicada || isEstadoPublicado(c.estado);
		}).length;
		
		// Una convocatoria está deshabilitada si: estado es "no publicada"/"desactivada"/"inactivo"/etc. Y NO está publicada
		const convocatoriasDeshabilitadas = convocatoriasFiltradas.filter(c => {
			return isEstadoDesactivado(c.estado) || (!c.publicada && !isEstadoPublicado(c.estado));
		}).length;
		
		const summaryData = [
			['🏢 SISTEMA DE CONVOCATORIAS LABORALES - UGEL TALARA'],
			[''],
			['📊 INFORMACIÓN GENERAL'],
			['📈 Total de Convocatorias', convocatoriasFiltradas.length],
			['✅ Convocatorias Publicadas/Activas', convocatoriasActivas],
			['❌ Convocatorias Deshabilitadas', convocatoriasDeshabilitadas],
			['🏢 Área Filtrada', selectedArea],
			['📅 Fecha de Reporte', new Date().toLocaleDateString('es-ES')],
			[''],
			['📈 ESTADÍSTICAS POR ÁREA']
		];

		// Agregar estadísticas por área
		if (selectedArea === 'Todas') {
			const areaStats = getChartData().map(item => [`📁 ${item.name}`, item.value]);
			summaryData.push(...areaStats);
		} else {
			summaryData.push([`📁 ${selectedArea}`, convocatoriasFiltradas.length]);
		}

		const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
		summaryWorksheet['!cols'] = [
			{ wch: 50 },
			{ wch: 30 }
		];

		// === ESTILOS BONITOS PARA RESUMEN ===
		// Título principal
		summaryWorksheet['A1'].s = {
			font: { bold: true, size: 20, color: { rgb: "1E40AF" } },
			fill: { fgColor: { rgb: "E0F2FE" } },
			alignment: { horizontal: "center", vertical: "center" },
			border: {
				top: { style: "thick", color: { rgb: "1E40AF" } },
				bottom: { style: "thick", color: { rgb: "1E40AF" } },
				left: { style: "thick", color: { rgb: "1E40AF" } },
				right: { style: "thick", color: { rgb: "1E40AF" } }
			}
		};

		// Sección de información general
		summaryWorksheet['A3'].s = {
			font: { bold: true, size: 16, color: { rgb: "059669" } },
			fill: { fgColor: { rgb: "ECFDF5" } },
			alignment: { horizontal: "left", vertical: "center" }
		};

		// Sección de estadísticas
		summaryWorksheet['A9'].s = {
			font: { bold: true, size: 16, color: { rgb: "7C3AED" } },
			fill: { fgColor: { rgb: "F3E8FF" } },
			alignment: { horizontal: "left", vertical: "center" }
		};

		// Estilos para datos del resumen
		for (let row = 4; row <= 7; row++) {
			summaryWorksheet[`A${row}`].s = {
				font: { size: 12, color: { rgb: "374151" } },
				alignment: { horizontal: "left", vertical: "center" }
			};
			summaryWorksheet[`B${row}`].s = {
				font: { bold: true, size: 12, color: { rgb: "1E40AF" } },
				alignment: { horizontal: "center", vertical: "center" }
			};
		}

		XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '📊 Resumen');

		// === GENERAR ARCHIVO ===
		const fileName = `UGEL_Talara_Convocatorias_${selectedArea}_${new Date().toISOString().split('T')[0]}.xlsx`;
		XLSX.writeFile(workbook, fileName);

		console.log('✅ Archivo Excel generado exitosamente con diseño bonito:', fileName);
	} catch (error) {
		console.error('❌ Error al generar Excel:', error);
		setError('Error al generar el archivo Excel');
		setTipoAlerta('error');
	}
};


	const convocatoriasFiltradas = selectedArea === 'Todas' 
		? convocatorias 
		: convocatorias.filter(c => c.area === selectedArea);

	// --- TODO EL JSX DE TU COMPONENTE (SIN CAMBIOS) ---
	return (
		<ErrorBoundary>
			<div className={`fixed inset-0 w-full h-full overflow-hidden ${temaAzul ? 'bg-gradient-to-br from-blue-50 via-white to-blue-100' : 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950'}`}>
				<div
					className="absolute inset-0 z-0"
					style={{
						background: temaAzul ? 'transparent' : '#1e3a8a',
						backgroundImage: temaAzul ? `
							linear-gradient(to right, rgba(59,130,246,0.05) 1px, transparent 1px),
							linear-gradient(to bottom, rgba(59,130,246,0.05) 1px, transparent 1px),
							radial-gradient(circle at 50% 60%, rgba(59,130,246,0.1) 0%, rgba(147,197,253,0.05) 40%, transparent 70%)
						` : `
							linear-gradient(to right, rgba(59,130,246,0.1) 1px, transparent 1px),
							linear-gradient(to bottom, rgba(59,130,246,0.1) 1px, transparent 1px),
							radial-gradient(circle at 50% 60%, rgba(59,130,246,0.15) 0%, rgba(30,58,138,0.1) 40%, transparent 70%)
						`,
						backgroundSize: "40px 40px, 40px 40px, 100% 100%",
					}}
				/>
				<style>{`
					@keyframes slideUpFadeIn {
						from { opacity: 0; transform: translateY(20px); }
						to { opacity: 1; transform: translateY(0); }
					}
					@keyframes fade-in {
						from { opacity: 0; }
						to { opacity: 1; }
					}
					@keyframes slide-in {
						from { opacity: 0; transform: translateX(-10px); }
						to { opacity: 1; transform: translateX(0); }
					}
					@keyframes slide-up {
						from { opacity: 0; transform: translateY(20px); }
						to { opacity: 1; transform: translateY(0); }
					}
					.animate-fade-in { animation: fade-in 0.5s ease-out; }
					.animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
					.animate-slide-up { animation: slide-up 0.5s ease-out; }
					.custom-scrollbar::-webkit-scrollbar {
						width: 8px;
						height: 8px;
					}
					.custom-scrollbar::-webkit-scrollbar-track {
						background: ${temaAzul ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)'};
						border-radius: 10px;
					}
					.custom-scrollbar::-webkit-scrollbar-thumb {
						background: ${temaAzul ? 'rgba(59, 130, 246, 0.5)' : 'rgba(236, 72, 153, 0.5)'};
						border-radius: 10px;
					}
					.custom-scrollbar::-webkit-scrollbar-thumb:hover {
						background: ${temaAzul ? 'rgba(59, 130, 246, 0.7)' : 'rgba(236, 72, 153, 0.7)'};
					}
				`}</style>

				<div className="relative z-10 flex h-screen">
					<div className={`${sidebarOpen ? 'w-72' : 'w-16 sm:w-20'} transition-all duration-300 backdrop-blur-xl border-r shadow-2xl ${temaAzul ? 'bg-white/90 border-blue-200' : 'bg-slate-900/95 border-slate-700'} flex flex-col`}>
						<div className={`p-3 sm:p-6 border-b ${temaAzul ? 'border-blue-200' : 'border-blue-700'}`}>
							<div className="flex items-center justify-between mb-2 sm:mb-4">
								{sidebarOpen && (
									<div className="animate-fade-in">
										<h1 className={`text-lg sm:text-2xl font-bold ${temaAzul ? 'bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent' : 'text-blue-200'}`}>
											UGEL TALARA
										</h1>
										<p className={`${temaAzul ? 'text-gray-600' : 'text-blue-300'} text-xs sm:text-sm mt-1`}>Sistema de Convocatorias</p>
									</div>
								)}
								<button
									onClick={() => setSidebarOpen(!sidebarOpen)}
									className={`p-1.5 sm:p-2 rounded-lg transition-colors ${temaAzul ? 'hover:bg-blue-100' : 'hover:bg-blue-800'}`}
								>
									<Menu className={temaAzul ? 'text-blue-600' : 'text-blue-200'} size={18} />
								</button>
							</div>
							{sidebarOpen && (
								<div
									className={`mt-4 p-4 rounded-xl border transition-all cursor-pointer group ${temaAzul ? 'bg-blue-50 border-blue-200 hover:border-blue-400' : 'bg-blue-800 border-blue-700 hover:border-blue-600'}`}
									onClick={() => setShowProfile(true)}
								>
									<div className="flex items-center gap-3">
										<div className="relative">
											<div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ring-2 transition-all ${temaAzul ? 'bg-blue-600 ring-blue-400 group-hover:ring-blue-500' : 'bg-blue-700 ring-blue-500 group-hover:ring-blue-400'}`}>
												{user?.profilePicture ? ( // Use user?.profilePicture from AuthContext
													<img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
												) : (
													<User className="text-white" size={24} />
												)}
											</div>
											<div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 ${temaAzul ? 'border-white' : 'border-blue-900'}`}></div>
										</div>
										<div className="flex-1 min-w-0">
											<p className={`font-semibold text-sm truncate ${temaAzul ? 'text-gray-800' : 'text-blue-100'}`}>{user?.nombreCompleto || 'No disponible'}</p>
											<p className={`text-xs truncate ${temaAzul ? 'text-gray-600' : 'text-blue-300'}`}>{user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'No disponible'}</p>
										</div>
									</div>
								</div>
							)}
						</div>
						{sidebarOpen && (
							<div className="p-4 flex-grow flex flex-col min-h-0">
								<div className={`flex items-center gap-2 mb-4 ${temaAzul ? 'text-gray-600' : 'text-blue-300'}`}>
									<Filter size={18} />
									<span className="text-sm font-semibold">FILTRAR POR ÁREA</span>
								</div>
								<nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
									<button
										onClick={() => setSelectedArea('Todas')}
										style={{ animationDelay: `0ms` }}
										className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 text-sm animate-slide-in ${
											selectedArea === 'Todas'
												? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg scale-105'
												: temaAzul ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-700 hover:translate-x-1' : 'text-blue-200 hover:bg-blue-800 hover:text-white hover:translate-x-1'
										}`}
									>
										Todas
									</button>
									{allAreas.map((area, index) => (
										<button
											key={area}
											onClick={() => setSelectedArea(area)}
											style={{ animationDelay: `${(index + 1) * 50}ms` }}
											className={`w-full text-left px-6 py-2 rounded-lg transition-all duration-300 text-sm animate-slide-in ${
												selectedArea === area
													? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-lg scale-105'
													: temaAzul ? 'text-gray-700 hover:bg-blue-100 hover:text-blue-700 hover:translate-x-1' : 'text-blue-200 hover:bg-blue-800 hover:text-white hover:translate-x-1'
											}`}
										>
											{area}
										</button>
									))}
								</nav>
							</div>
						)}
						{sidebarOpen && (
							<div className={`p-4 border-t ${temaAzul ? 'border-blue-200' : 'border-blue-700'} mt-auto`}>
								<button
									onClick={() => cambiarTema(!temaAzul)}
									className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg hover:scale-[1.02] mb-2 ${temaAzul ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-800 text-blue-100 hover:bg-blue-700'}`}
								>
									<Palette size={20} />
									Cambiar Tema
								</button>
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg hover:scale-[1.02]"
								>
									<LogOut size={20} />
									Cerrar Sesión
								</button>
							</div>
						)}
					</div>

					<div className="flex-1 overflow-auto custom-scrollbar">
						<div className="p-4 sm:p-8">
							<div className="mb-4 sm:mb-8 animate-fade-in">
								<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
									<div>
										<SplitText text={selectedArea} className={`text-base sm:text-xl font-semibold ${temaAzul ? 'text-blue-600' : 'text-blue-300'} mb-2`} />
										<SplitText text="Convocatorias Laborales" className={`text-xl sm:text-3xl font-bold ${temaAzul ? 'text-gray-800' : 'text-white'} mb-2`} />
										<SplitText text="Resumen de Oportunidades Laborales" className={`text-sm sm:text-lg font-medium ${temaAzul ? 'text-blue-500' : 'text-blue-300'} italic`} />
										<div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
											<span className={temaAzul ? 'text-gray-600' : 'text-blue-300'}>Total: <span className={`${temaAzul ? 'text-blue-600' : 'text-blue-300'} font-semibold`}>{convocatoriasFiltradas.length}</span></span>
										</div>
									</div>
									<div className="flex flex-wrap gap-2 sm:gap-3">
										<button
											onClick={handleManageGruposComite}
											className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg hover:scale-105 text-xs sm:text-sm"
										>
											<Users size={16} className="sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
											<span className="hidden sm:inline">Gestionar Grupos de Comité</span>
											<span className="sm:hidden">Grupos</span>
										</button>
										{selectedArea === 'Todas' && (
											<button
												onClick={() => setShowChart(!showChart)}
												className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:scale-105 text-xs sm:text-sm"
											>
												<PieChart size={16} className="sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
												<span className="hidden sm:inline">Estadísticas</span>
												<span className="sm:hidden">Stats</span>
											</button>
										)}
										<button
											onClick={downloadExcel}
											className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:scale-105 text-xs sm:text-sm"
										>
											<FileSpreadsheet size={16} className="sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
											<span className="hidden sm:inline">Exportar Excel</span>
											<span className="sm:hidden">Excel</span>
										</button>
										<button
											onClick={() => setShowForm(!showForm)}
											className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg hover:scale-105 text-xs sm:text-sm"
										>
											<Plus size={16} className="sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" />
											<span className="hidden sm:inline">Nueva</span>
											<span className="sm:hidden">+</span>
										</button>
									</div>
								</div>
							</div>

							{error && (
								<div className={`mb-6 p-4 rounded-lg text-sm animate-slide-up ${
									tipoAlerta === 'success' 
										? 'bg-green-900/50 text-green-300 border border-green-500/30' 
										: tipoAlerta === 'info'
										? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
										: 'bg-red-900/50 text-red-300 border border-red-500/30'
								}`}>
									{error}
								</div>
							)}

							{showChart && selectedArea === 'Todas' && (
								<div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8 border border-slate-700/50 animate-slide-up">
									<h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
										<PieChart className="text-blue-400" />
										Distribución de Convocatorias por Área
									</h3>
									<div className="grid md:grid-cols-2 gap-6">
										<div>
											<ResponsiveContainer width="100%" height={300}>
												<RechartsPie>
													<Pie
														data={getChartData()}
														cx="50%"
														cy="50%"
														labelLine={false}
														label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
														outerRadius={100}
														fill="#3b82f6"
														dataKey="value"
														animationBegin={0}
														animationDuration={800}
													>
														{getChartData().map((_, index) => (
															<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
														))}
													</Pie>
													<Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff' }} />
													<Legend wrapperStyle={{ color: '#fff' }} />
												</RechartsPie>
											</ResponsiveContainer>
										</div>
										<div>
											<ResponsiveContainer width="100%" height={300}>
												<BarChart data={getChartData()}>
													<XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} angle={45} textAnchor="start" />
													<YAxis tick={{ fill: '#cbd5e1' }} />
													<Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff' }} />
													<Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
												</BarChart>
											</ResponsiveContainer>
										</div>
									</div>
								</div>
							)}

							{(showForm || showEditForm) && (
								<div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 mb-8 border border-slate-700/50 animate-slide-up">
									<h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
										<FileText className="text-pink-400" />
										{showForm ? 'Publicar Nueva Convocatoria' : 'Editar Convocatoria'}
									</h3>
									<form onSubmit={(e) => handleSubmit(e, showForm ? 'create' : 'edit')} className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Área</label>
												<select
													name="area"
													value={formData.area}
													onChange={handleInputChange}
													disabled={showEditForm} // Solo deshabilitar en modo edición
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all disabled:opacity-50"
												>
													<option value="">Seleccionar área</option>
													{allAreas.map(area => (
														<option key={area} value={area}>
															{area}
														</option>
													))}
												</select>
											</div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Puesto</label>
												<input
													type="text"
													name="puesto"
													value={formData.puesto}
													onChange={handleInputChange}
													placeholder="Ej: Analista de Sistemas"
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Sueldo</label>
												<input
													type="text"
													name="sueldo"
													value={formData.sueldo}
													onChange={handleInputChange}
													placeholder="Ej: S/ 3,500"
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
											<div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Titulo profesional o academico</label>
												<select
													name="licenciatura"
													value={formData.licenciatura}
													onChange={handleInputChange}
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
												>
													<option value="Sí">Sí</option>
													<option value="No">No</option>
												</select>
											</div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Años de experiencias públicas (mínimo)</label>
                        <input
                          type="text"
                          name="expPublicaMin"
                          value={formData.expPublicaMin}
                          onChange={handleInputChange}
                          placeholder="Ej: 1 año, 1.5 años"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Años de experiencias públicas (máximo)</label>
                        <input
                          type="text"
                          name="expPublicaMax"
                          value={formData.expPublicaMax}
                          onChange={handleInputChange}
                          placeholder="Ej: 5 años, 2.5 años"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        />
                      </div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Años totales requeridos</label>
												<input
													type="text"
													name="experiencia"
													value={formData.experiencia}
													onChange={handleInputChange}
													placeholder="Ej: 3 años en el puesto"
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Fecha Inicio</label>
												<input
													type="date"
													name="fechaPublicacion"
													value={formData.fechaPublicacion}
													onChange={handleInputChange}
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Fecha Fin</label>
												<input
													type="date"
													name="fechaFinalizacion"
													value={formData.fechaFinalizacion}
													onChange={handleInputChange}
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
												/>
											</div>
											<div> {/* New div for Numero CAS */}
												<label className="block text-sm font-semibold text-slate-300 mb-2">Número CAS</label>
												<input
													type="text"
													name="numero_cas"
													value={formData.numero_cas}
													onChange={handleInputChange}
													placeholder="Ej: CAS N° 001-2025-UGEL-T" // Example placeholder
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
											<div>
												<label className="block text-sm font-semibold text-slate-300 mb-2">Estado de publicación</label>
												<select
													name="publicada"
													value={formData.publicada ? 'true' : 'false'}
													onChange={handleInputChange}
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
												>
													<option value="true">Publicada</option>
													<option value="false">Desactivada</option>
												</select>
											</div>
                                            <div className="col-span-2">
												<label className="block text-sm font-semibold text-slate-300 mb-2">Requisitos Académicos</label>
												<input
													type="text"
													name="requisitos"
													value={formData.requisitos}
													onChange={handleInputChange}
													placeholder="Ej: Título profesional en..."
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
											<div className="col-span-2">
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">Habilidades y Conocimientos Técnicos</label>
												<textarea
													name="habilidades"
													value={formData.habilidades}
													onChange={handleInputChange}
													placeholder="Ej: Manejo de Office, SQL, idiomas, etc."
													rows={3}
													className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
												/>
											</div>
										</div>
										{error && (
											<div className={`p-3 rounded-lg text-sm ${
												tipoAlerta === 'success' 
													? 'bg-green-900/50 text-green-300 border border-green-500/30' 
													: tipoAlerta === 'info'
													? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
													: 'bg-red-900/50 text-red-300 border border-red-500/30'
											}`}>
												{error}
											</div>
										)}
										<div className="flex gap-3 pt-4">
											<button
												type="submit"
												className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-green-400 transition-all font-semibold shadow-lg hover:scale-105"
											>
												{showForm ? 'Publicar Convocatoria' : 'Actualizar Convocatoria'}
											</button>
											<button
												type="button"
												onClick={() => {
													setShowForm(false);
													setShowEditForm(false);
													setFormData({
														area: '',
														puesto: '',
														sueldo: '',
														requisitos: '',
														licenciatura: 'No',
														expPublicaMin: '',
														expPublicaMax: '',
														experiencia: '',
														habilidades: '',
														fechaPublicacion: '',
														fechaFinalizacion: '',
														numero_cas: '',
														publicada: false
													});
												}}
												className="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
											>
												Cancelar
											</button>
										</div>
									</form>
								</div>
							)}

							<div className={`${temaAzul ? 'bg-white/90' : 'bg-slate-900/80'} backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border ${temaAzul ? 'border-blue-200' : 'border-slate-700'} animate-fade-in mb-8`}>
								<h3 className={`text-xl font-bold p-6 ${temaAzul ? 'text-gray-800' : 'text-white'} bg-gradient-to-r ${temaAzul ? 'from-blue-100 to-blue-200' : 'from-slate-800 to-slate-900'} border-b ${temaAzul ? 'border-blue-200' : 'border-slate-700'}`}>
									{selectedArea === 'Todas' ? 'Todas las Convocatorias' : `Convocatorias de ${selectedArea}`}
								</h3>
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead className={`bg-gradient-to-r ${temaAzul ? 'from-blue-600 to-blue-700' : 'from-slate-800 to-slate-900'}`}>
											<tr>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">N°</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Área</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Puesto</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Tiempo</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Sueldo</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Exp. Pública (Min)</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Exp. Pública (Max)</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Experiencia (Años)</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Título profesional o académico</th>
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">N° CAS</th> {/* Add N° CAS column header */}
												<th className="px-6 py-4 text-left text-sm font-semibold text-white">Estado</th>
												<th className="px-6 py-4 text-center text-sm font-semibold text-white">Acciones</th>
											</tr>
										</thead>
										<tbody>
											{isLoading ? (
												<tr>
													<td colSpan={12} className="px-6 py-12 text-center text-slate-400">
														<div className="flex items-center justify-center space-x-2">
															<div className="w-5 h-5 rounded-full animate-pulse bg-pink-500"></div>
															<div className="w-5 h-5 rounded-full animate-pulse bg-purple-500" style={{ animationDelay: '0.2s' }}></div>
															<div className="w-5 h-5 rounded-full animate-pulse bg-blue-500" style={{ animationDelay: '0.4s' }}></div>
														</div>
													</td>
												</tr>
											) : convocatoriasFiltradas.length === 0 ? (
												<tr>
													<td colSpan={12} className="px-6 py-12 text-center text-slate-400">
														<Briefcase size={48} className="mx-auto text-slate-600 mb-4" />
														No hay convocatorias disponibles para esta área
													</td>
												</tr>
											) : (
												convocatoriasFiltradas.map((conv, index) => (
													<tr
														key={conv.id}
														style={{ animationDelay: `${index * 100}ms` }}
														className={`border-b transition-all duration-300 animate-slide-in ${temaAzul ? 'border-blue-200 hover:bg-blue-50' : 'border-slate-700 hover:bg-slate-800/50'}`}
													>
														<td className={`px-6 py-4 text-sm font-semibold ${temaAzul ? 'text-gray-700' : 'text-blue-200'}`}>{index + 1}</td>
														<td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-700' : 'text-blue-100'}`}>{conv.area}</td>
														<td className={`px-6 py-4 text-sm font-semibold ${temaAzul ? 'text-blue-600' : 'text-blue-300'}`}>{conv.puesto}</td>
														<td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'}`}>{formatDateRangeDisplay(conv.fechaPublicacion, conv.fechaFinalizacion)}</td>
														<td className={`px-6 py-4 text-sm font-semibold ${temaAzul ? 'text-green-600' : 'text-green-400'}`}>{conv.sueldo}</td>
                                                        <td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'}`}>{conv.expPublicaMin || '-'}</td>
                                                        <td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'}`}>{conv.expPublicaMax || '-'}</td>
														<td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'}`}>{getExperienciaDisplay(conv)}</td>
														<td className="px-6 py-4 text-sm">
															<span
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
																	conv.licenciatura === 'Sí'
																		? temaAzul ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-500/20 text-green-400 border border-green-500/30'
																		: temaAzul ? 'bg-gray-200 text-gray-600 border border-gray-300' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
																}`}
															>
                                                            {conv.licenciatura}
															</span>
														</td>
														<td className={`px-6 py-4 text-sm ${temaAzul ? 'text-gray-600' : 'text-blue-200'}`}>{conv.numero_cas}</td>
														<td className="px-6 py-4 text-sm">
															{(() => {
																const estadoDisplay = getEstadoDisplay(conv.estado, conv.publicada);
																const estadoActivo = isEstadoPublicado(estadoDisplay) || conv.publicada || isEstadoPublicado(conv.estado);
																return (
															<span
																className={`px-3 py-1 rounded-full text-xs font-semibold ${
																	estadoActivo
																		? temaAzul ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-green-500/20 text-green-400 border border-green-500/30'
																		: temaAzul ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
																}`}
															>
																{estadoDisplay}
															</span>
																);
															})()}
														</td>
														<td className="px-6 py-4 text-center flex gap-2 justify-center">
															<button
																onClick={() => {
																	setSelectedConv(conv);
																	setShowDetails(true);
																}}
																className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
																title="Ver detalles"
															>
																Ver
															</button>
															<button
																onClick={() => {
																	setSelectedConv(conv);
									setFormData({
										area: conv.area,
										puesto: conv.puesto,
										sueldo: conv.sueldo,
										requisitos: conv.requisitos,
										licenciatura: conv.licenciatura,
										expPublicaMin: conv.expPublicaMin || '',
										expPublicaMax: conv.expPublicaMax || '',
										experiencia: (() => {
											const experienciaTexto = conv.experiencia?.toString().trim();
											if (experienciaTexto) return experienciaTexto;
											const fallback = getExperienciaDisplay(conv);
											return fallback === '-' ? '' : fallback;
										})(),
										habilidades: conv.habilidades,
										fechaPublicacion: conv.fechaPublicacion,
										fechaFinalizacion: conv.fechaFinalizacion,
										numero_cas: conv.numero_cas,
										publicada: !!conv.publicada,
									});
																	setShowEditForm(true);
																}}
																className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
																title="Editar convocatoria"
															>
																Editar
															</button>
															{(() => {
																const estadoDisplay = getEstadoDisplay(conv.estado, conv.publicada);
																const estaPublicada = isEstadoPublicado(estadoDisplay) || conv.publicada || isEstadoPublicado(conv.estado);
																return (
																	<button
																		onClick={() => togglePublicacion(conv.id, conv)}
																		className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:scale-105 transition-all ${
																			estaPublicada
																				? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400'
																				: 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400'
																		}`}
																		title={estaPublicada ? 'Desactivar publicación' : 'Publicar convocatoria'}
																	>
																		{estaPublicada ? (
																			<><Globe size={16} className="inline mr-1" /> Desactivar</>
																		) : (
																			<><Globe size={16} className="inline mr-1" /> Publicar</>
																		)}
																	</button>
																);
															})()}
															<button
																onClick={() => {
																	setSelectedConv(conv);
																	setShowDelete(true);
																}}
																className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
																title="Eliminar convocatoria"
															>
																Eliminar
															</button>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>

							{showProfile && (
								<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
									<div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50 animate-slide-up">
										<div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
											<h3 className="text-xl font-bold text-white">Mi Perfil</h3>
											<button
												onClick={() => setShowProfile(false)}
												className="hover:bg-white/20 rounded-full p-2 transition-colors"
											>
												<X size={24} className="text-white" />
											</button>
										</div>
										<div className="p-8">
											<div className="flex flex-col items-center mb-6">
												<div className="relative group">
													<div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden ring-4 ring-pink-500/50 group-hover:ring-pink-400 transition-all">
														{profileImage ? (
															<img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
														) : (
															<User className="text-white" size={48} />
														)}
													</div>
													<label className="absolute bottom-0 right-0 bg-pink-600 hover:bg-pink-500 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all hover:scale-110">
														<Camera size={20} />
														<input
															type="file"
															accept="image/*"
															onChange={handleProfileImageChange}
															className="hidden"
														/>
													</label>
												</div>
											</div>
											<div className="space-y-4">
												<div>
													<label className="block text-sm font-semibold text-slate-400 mb-2">Nombre Completo</label>
													<input
														type="text"
														value={profileData.name || 'No disponible'}
														readOnly // Make read-only
														className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
													/>
												</div>
												<div>
													<label className="block text-sm font-semibold text-slate-400 mb-2">Cargo</label>
													<input
														type="text"
														value={profileData.role || 'No disponible'} // Display role from context
														readOnly // Make read-only
														className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
													/>
												</div>
												<div>
													<label className="block text-sm font-semibold text-slate-400 mb-2">Correo Electrónico</label>
													<input
														type="email"
														value={profileData.email || 'No disponible'}
														readOnly // Make read-only
														className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
													/>
												</div>
											</div>
											<div className="mt-8 flex gap-3">
												<button
													onClick={saveProfile}
													className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all font-semibold shadow-lg hover:scale-105"
												>
													Guardar Cambios
												</button>
												<button
													onClick={() => setShowProfile(false)}
													className="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
												>
													Cancelar
												</button>
											</div>
										</div>
									</div>
								</div>
							)}

							{showDetails && selectedConv && (
								<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
									<div className="bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-700/50">
										<div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex justify-between items-center sticky top-0">
											<h3 className="text-2xl font-bold text-white">Detalles de la Convocatoria</h3>
											<button
												onClick={() => setShowDetails(false)}
												className="hover:bg-white/20 rounded-full p-2 transition-colors"
											>
												<X size={24} className="text-white" />
											</button>
										</div>
										<div className="p-8 space-y-6">
											<div className="border-b border-slate-700 pb-4">
												<h4 className="text-2xl font-bold text-white mb-2">{selectedConv.puesto}</h4>
												<p className="text-pink-400 font-semibold">{selectedConv.area}</p>
											</div>
											<div className="grid grid-cols-2 gap-6">
												<div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30">
													<div className="flex items-center gap-3 mb-2">
														<DollarSign className="text-green-400" size={24} />
														<p className="text-sm font-semibold text-slate-400">Remuneración</p>
													</div>
													<p className="text-2xl font-bold text-green-400">{selectedConv.sueldo}</p>
												</div>
												<div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30">
													<div className="flex items-center gap-3 mb-2">
														<Calendar className="text-blue-400" size={24} />
														<p className="text-sm font-semibold text-slate-400">Tiempo</p>
													</div>
													<p className="text-2xl font-bold text-blue-400">{formatDateRangeDisplay(selectedConv.fechaPublicacion, selectedConv.fechaFinalizacion)}</p>
												</div>
											</div>
											{(() => {
												const estadoDisplay = getEstadoDisplay(selectedConv.estado, selectedConv.publicada);
												const estadoActivo = isEstadoPublicado(estadoDisplay);
												return (
													<div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
														<div className="flex items-center gap-3 mb-2">
															<Award className="text-purple-400" size={24} />
															<p className="text-sm font-semibold text-slate-400">Estado</p>
														</div>
														<p className={`text-2xl font-bold ${estadoActivo ? 'text-green-400' : 'text-red-400'}`}>
															{estadoDisplay}
														</p>
														<p className="text-sm text-slate-400 mt-2">
															{estadoActivo
																? 'Esta convocatoria está publicada en el portal.'
																: 'Esta convocatoria está desactivada en el portal.'}
														</p>
													</div>
												);
											})()}
											<div className="space-y-4">
												<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
													<div className="flex items-start gap-3 mb-2">
														<GraduationCap className="text-purple-400 mt-1" size={24} />
														<div className="flex-1">
															<p className="text-sm font-semibold text-slate-400 mb-2">Requisitos Académicos</p>
															<p className="text-slate-200 leading-relaxed">{selectedConv.requisitos}</p>
														</div>
													</div>
												</div>
												<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
													<div className="flex items-start gap-3 mb-2">
														<Briefcase className="text-blue-400 mt-1" size={24} />
														<div className="flex-1">
															<p className="text-sm font-semibold text-slate-400 mb-2">Experiencia requerida (años)</p>
															<p className="text-slate-200 leading-relaxed">{getExperienciaDisplay(selectedConv)}</p>
														</div>
													</div>
												</div>
												<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
													<div className="flex items-start gap-3 mb-2">
														<Award className="text-orange-400 mt-1" size={24} />
														<div className="flex-1">
															<p className="text-sm font-semibold text-slate-400 mb-2">Título profesional o académico</p>
															<span
																className={`px-4 py-2 rounded-full text-sm font-semibold inline-block ${
																	selectedConv.licenciatura === 'Sí'
																		? 'bg-green-500/20 text-green-400 border border-green-500/30'
																		: 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
																}`}
															>
																{selectedConv.licenciatura === 'Sí' ? 'Requerida' : 'No Requerida'}
															</span>
														</div>
													</div>
												</div>
												<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
													<div className="flex items-start gap-3 mb-2">
														<FileText className="text-indigo-400 mt-1" size={24} />
														<div className="flex-1">
															<p className="text-sm font-semibold text-slate-400 mb-2">Habilidades y Conocimientos Técnicos</p>
															<p className="text-slate-200 leading-relaxed">{selectedConv.habilidades}</p>
														</div>
													</div>
												</div>
												<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50"> {/* New div for Numero CAS */}
													<div className="flex items-start gap-3 mb-2">
														<FileText className="text-orange-400 mt-1" size={24} /> {/* Reusing icon for numero_cas */}
														<div className="flex-1">
															<p className="text-sm font-semibold text-slate-400 mb-2">Número CAS</p>
															<p className="text-slate-200 leading-relaxed">{selectedConv.numero_cas}</p>
														</div>
													</div>
												</div>
											</div>
											<div className="border-t border-slate-700 pt-4 flex justify-between items-center">
												<p className="text-sm text-slate-400">
													Publicado el{' '}
													{formatDateDisplay(selectedConv.fechaPublicacion, {
														year: 'numeric',
														month: 'long',
														day: 'numeric',
													})}
												</p>
												<button
													onClick={() => setShowDetails(false)}
													className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all font-semibold shadow-lg hover:scale-105"
												>
													Cerrar
												</button>
											</div>
										</div>
									</div>
								</div>
							)}

							{showDelete && selectedConv && (
								<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
									<div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50 animate-slide-up">
										<div className="p-6">
											<h3 className="text-lg font-bold text-white">Eliminar Convocatoria</h3>
											<p className="text-sm text-slate-400 mt-2">¿Estás seguro? Esta acción no se puede deshacer.</p>
										</div>
										<div className="p-6 flex justify-end gap-4">
											<button
												onClick={() => setShowDelete(false)}
												className="px-6 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-slate-300"
											>
												Cancelar
											</button>
											<button
												onClick={handleDelete}
												className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-white"
											>
												Eliminar
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Modal de Grupos de Comité */}
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
											Organiza los usuarios del comité en los grupos: Administración, UPDI, AGP, Recursos Humanos y Dirección. Las convocatorias son opcionales.
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
													Selecciona un grupo para asignar usuarios. Haz clic en una tarjeta de grupo para comenzar.
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
											Grupos de Comité Disponibles (solo grupos con usuarios asignados)
										</h3>
										{(() => {
											const gruposConUsuarios = gruposComite.filter((grupo: any) => {
												// Mostrar solo grupos que tienen usuarios asignados
												const tieneUsuarios = grupo.usuarios && Array.isArray(grupo.usuarios) && grupo.usuarios.length > 0;
												return tieneUsuarios;
											});
											
											if (gruposConUsuarios.length === 0) {
												return (
													<div className={`p-6 rounded-lg border text-center ${temaAzul ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
														<p className={`text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
															No hay grupos con usuarios asignados. Asigna usuarios a los grupos primero.
														</p>
													</div>
												);
											}
											
											return (
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
											{gruposConUsuarios.map((grupo, index) => {
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
											);
										})()}
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
															// Obtener todos los usuarios que ya están asignados a CUALQUIER grupo (incluyendo el actual)
															const usuariosAsignadosEnCualquierGrupo = new Set<number>();
															gruposComite.forEach((grupo: any) => {
																if (grupo.usuarios && Array.isArray(grupo.usuarios)) {
																	grupo.usuarios.forEach((usuario: any) => {
																		const usuarioId = usuario.id || usuario.IDUSUARIO;
																		if (usuarioId) {
																			usuariosAsignadosEnCualquierGrupo.add(usuarioId);
																		}
																	});
																}
															});
															
															// Filtrar usuarios: excluir TODOS los que ya están en cualquier grupo
															// Un usuario solo puede estar en un grupo a la vez
															const usuariosDisponibles = usuariosComite.filter(u => {
																// Verificar si el usuario está asignado a cualquier grupo
																const estaAsignado = usuariosAsignadosEnCualquierGrupo.has(u.id);
																return !estaAsignado;
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
															{(() => {
																// Filtrar convocatorias disponibles (publicadas y no asignadas a ningún grupo)
																const convocatoriasDisponiblesFiltradas = convocatoriasDisponibles.filter(conv => {
																	const convId = conv.IDCONVOCATORIA || conv.id;
																	const estado = String(conv.estado || '').toLowerCase();
																	
																	// Filtrar convocatorias que:
																	// 1. Están publicadas/activas (excluir explícitamente las desactivadas)
																	const esPublicada = estado === 'publicada' || estado === 'activo' || estado === 'activa';
																	const estaDesactivada = estado === 'no publicada' || estado === 'inactivo' || estado === 'inactiva' || estado === 'desactivado' || estado === 'desactivada';
																	
																	// 2. NO están asignadas a NINGÚN grupo (verificar en convocatoriasAsignadasATodosLosGrupos)
																	const noAsignada = !convocatoriasAsignadasATodosLosGrupos.some(asc => 
																		(asc.IDCONVOCATORIA || asc.id) === convId
																	);
																	
																	// Solo incluir si está publicada Y no está desactivada Y no está asignada
																	return esPublicada && !estaDesactivada && noAsignada;
																});
																
																if (convocatoriasDisponiblesFiltradas.length === 0) {
																	return (
																		<div className={`p-3 rounded-lg border ${temaAzul ? 'bg-gray-50 border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
																			<p className={`text-sm ${temaAzul ? 'text-gray-600' : 'text-gray-400'}`}>
																				No hay convocatorias disponibles. Todas las convocatorias publicadas ya están asignadas a algún grupo o no hay convocatorias publicadas.
																			</p>
																		</div>
																	);
																}
																
																return (
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
																		<option value="">-- Selecciona una convocatoria disponible (opcional) --</option>
																		{convocatoriasDisponiblesFiltradas.map(conv => (
																			<option key={conv.IDCONVOCATORIA || conv.id} value={conv.IDCONVOCATORIA || conv.id}>
																				{conv.puesto || 'Sin puesto'} - {conv.area || 'Sin área'} (CAS: {conv.numeroCAS || conv.numero_cas || 'N/A'})
																			</option>
																		))}
																	</select>
																);
															})()}
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
		</ErrorBoundary>
	);
}