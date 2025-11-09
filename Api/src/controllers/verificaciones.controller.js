import { pool } from '../database/conexion.js';
import { initializePostulacionesModule } from './postulaciones.js';

// ============================================================
// CONTROLADOR: VERIFICACIONES DE QR - UGEL TALARA
// ============================================================

/**
 * Asegurar que la tabla verificaciones_qr existe
 */
const asegurarTablaVerificaciones = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS verificaciones_qr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigoCertificado VARCHAR(255) UNIQUE NOT NULL,
        datosQR JSON,
        datosVerificados JSON,
        fechaRegistro DATETIME NOT NULL,
        fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_codigoCertificado (codigoCertificado),
        INDEX idx_fechaRegistro (fechaRegistro)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla verificaciones_qr verificada/creada');
  } catch (error) {
    console.error('❌ Error al crear tabla verificaciones_qr:', error);
  }
};

/**
 * Asegurar que la tabla postulantes_registrados existe
 */
const asegurarTablaPostulantesRegistrados = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS postulantes_registrados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        IDUSUARIO INT NULL,
        certificadoId VARCHAR(255) UNIQUE NOT NULL,
        nombreCompleto VARCHAR(255) NOT NULL,
        apellidoPaterno VARCHAR(100),
        apellidoMaterno VARCHAR(100),
        dni VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(20),
        numeroCAS VARCHAR(50),
        puesto VARCHAR(255),
        area VARCHAR(255),
        convocatoriaId INT,
        anexoId INT,
        curriculumId INT,
        expedienteSIGEA VARCHAR(100),
        estado ENUM('Registrado', 'Pendiente', 'En proceso', 'Rechazado') DEFAULT 'Pendiente',
        fechaRegistro DATETIME NOT NULL,
        fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_certificadoId (certificadoId),
        INDEX idx_dni (dni),
        INDEX idx_fechaRegistro (fechaRegistro),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'postulantes_registrados'`
    );
    const columnNames = columns.map((col) => col.COLUMN_NAME);

    if (!columnNames.includes('IDUSUARIO')) {
      await pool.execute(`
        ALTER TABLE postulantes_registrados
        ADD COLUMN IDUSUARIO INT NULL AFTER id
      `);
      console.log('✅ Columna IDUSUARIO agregada a postulantes_registrados');
    }

    // Verificar si el ENUM incluye 'Rechazado', si no, agregarlo
    const [columnInfo] = await pool.execute(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'postulantes_registrados' 
         AND COLUMN_NAME = 'estado'`
    );
    
    if (columnInfo.length > 0) {
      const columnType = columnInfo[0].COLUMN_TYPE;
      if (!columnType.includes("'Rechazado'")) {
        try {
          await pool.execute(`
            ALTER TABLE postulantes_registrados
            MODIFY COLUMN estado ENUM('Registrado', 'Pendiente', 'En proceso', 'Rechazado') DEFAULT 'Pendiente'
          `);
          console.log('✅ Estado "Rechazado" agregado al ENUM de postulantes_registrados');
        } catch (alterError) {
          console.warn('⚠️ No se pudo agregar "Rechazado" al ENUM (puede que ya exista):', alterError.message);
        }
      }
    }

    const [uniqueKeys] = await pool.execute(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'postulantes_registrados' 
         AND INDEX_NAME = 'uniq_usuario_convocatoria'`
    );

    if (uniqueKeys.length === 0) {
      await pool.execute(`
        ALTER TABLE postulantes_registrados
        ADD UNIQUE KEY uniq_usuario_convocatoria (IDUSUARIO, convocatoriaId)
      `);
      console.log('✅ Índice único uniq_usuario_convocatoria agregado a postulantes_registrados');
    }

    console.log('✅ Tabla postulantes_registrados verificada/creada');
  } catch (error) {
    console.error('❌ Error al crear tabla postulantes_registrados:', error);
  }
};

// Inicializar las tablas al cargar el módulo
asegurarTablaVerificaciones();
asegurarTablaPostulantesRegistrados();

/**
 * Crear o actualizar una verificación de QR
 * POST /ugel-talara/documentos/verificacion
 */
export const crearVerificacion = async (req, res) => {
  try {
    const {
      codigoCertificado,
      datosQR,
      datosVerificados,
      fechaRegistro
    } = req.body;

    console.log('📥 POST /verificacion - Datos recibidos:');
    console.log('   codigoCertificado:', codigoCertificado);
    console.log('   datosQR:', JSON.stringify(datosQR, null, 2));
    console.log('   datosVerificados:', JSON.stringify(datosVerificados, null, 2));

    if (!codigoCertificado) {
      return res.status(400).json({
        success: false,
        error: 'El código de certificado es requerido'
      });
    }

    // Verificar si ya existe una verificación con este certificado
    const [existentes] = await pool.execute(
      `SELECT id, fechaRegistro FROM verificaciones_qr WHERE codigoCertificado = ?`,
      [codigoCertificado]
    );

    if (existentes.length > 0) {
      // El QR ya está registrado, no permitir registro duplicado
      const fechaRegistroOriginal = existentes[0].fechaRegistro;
      console.log('⚠️ QR ya registrado:', codigoCertificado);
      return res.status(409).json({
        success: false,
        error: 'QR ya registrado',
        message: 'Este código QR ya fue registrado anteriormente. No se puede registrar dos veces.',
        alreadyRegistered: true,
        codigoCertificado: codigoCertificado,
        fechaRegistroOriginal: fechaRegistroOriginal
      });
    } else {
      // Asegurar que datosQR tenga todos los campos necesarios
      const datosQRCompletos = {
        certificado: codigoCertificado,
        postulante: datosQR?.postulante || datosQR?.nombreCompleto || '',
        nombreCompleto: datosQR?.nombreCompleto || datosQR?.postulante || '',
        puesto: datosQR?.puesto || 'Postulante',
        convocatoriaId: datosQR?.convocatoriaId || null,
        fecha: datosQR?.fecha || new Date().toISOString().split('T')[0],
        hora: datosQR?.hora || new Date().toTimeString().split(' ')[0],
        entidad: datosQR?.entidad || 'UGEL TALARA',
        sistema: datosQR?.sistema || 'Sistema CAS 2025',
        anexoId: datosQR?.anexoId || null,
        curriculumId: datosQR?.curriculumId || null,
        convocatoriaInfo: datosQR?.convocatoriaInfo || (datosQR?.convocatoriaId ? `CONVOCATORIA-${datosQR.convocatoriaId}` : null),
        area: datosQR?.area || null,
        numeroCAS: datosQR?.numeroCAS || null,
        email: datosQR?.email || null,
        ...datosQR // Mantener cualquier otro campo adicional
      };

      // Asegurar que datosVerificados tenga los campos necesarios
      const datosVerificadosCompletos = {
        nombreCompleto: datosVerificados?.nombreCompleto || datosQRCompletos.nombreCompleto || '',
        email: datosVerificados?.email || datosQRCompletos.email || null,
        puesto: datosVerificados?.puesto || datosQRCompletos.puesto || 'Postulante',
        dni: datosVerificados?.dni || null,
        telefono: datosVerificados?.telefono || null,
        estado: datosVerificados?.estado || 'Registrado',
        ...datosVerificados // Mantener cualquier otro campo adicional
      };

      console.log('💾 Guardando verificación con datosQR completos:');
      console.log(JSON.stringify(datosQRCompletos, null, 2));

      // Crear nueva verificación
      const [result] = await pool.execute(
        `INSERT INTO verificaciones_qr (codigoCertificado, datosQR, datosVerificados, fechaRegistro)
         VALUES (?, ?, ?, ?)`,
        [
          codigoCertificado,
          JSON.stringify(datosQRCompletos),
          JSON.stringify(datosVerificadosCompletos),
          fechaRegistro || new Date().toISOString()
        ]
      );

      console.log('✅ Verificación guardada con ID:', result.insertId);

      // Obtener la verificación creada
      const [verificacion] = await pool.execute(
        `SELECT * FROM verificaciones_qr WHERE id = ?`,
        [result.insertId]
      );

      // Parsear los JSON para la respuesta
      const verificacionParseada = {
        ...verificacion[0],
        datosQR: typeof verificacion[0].datosQR === 'string' 
          ? JSON.parse(verificacion[0].datosQR) 
          : verificacion[0].datosQR,
        datosVerificados: typeof verificacion[0].datosVerificados === 'string' 
          ? JSON.parse(verificacion[0].datosVerificados) 
          : verificacion[0].datosVerificados
      };

      return res.status(201).json({
        success: true,
        message: 'Verificación creada exitosamente',
        data: verificacionParseada
      });
    }
  } catch (error) {
    console.error('❌ Error al crear/actualizar verificación:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error al crear/actualizar verificación',
      details: error.message
    });
  }
};

/**
 * Obtener todas las verificaciones de QR para el comité
 * GET /ugel-talara/documentos/verificaciones-sesion-comite
 */
export const obtenerVerificacionesComite = async (req, res) => {
  try {
    const [verificaciones] = await pool.execute(
      `SELECT 
        id,
        codigoCertificado,
        datosQR,
        datosVerificados,
        fechaRegistro,
        fechaActualizacion
       FROM verificaciones_qr
       ORDER BY fechaRegistro DESC`
    );

    // Parsear los campos JSON
    const verificacionesParseadas = verificaciones.map(v => ({
      id: v.id,
      codigoCertificado: v.codigoCertificado,
      datosQR: typeof v.datosQR === 'string' ? JSON.parse(v.datosQR) : v.datosQR,
      datosVerificados: typeof v.datosVerificados === 'string' ? JSON.parse(v.datosVerificados) : v.datosVerificados,
      fechaRegistro: v.fechaRegistro,
      fechaActualizacion: v.fechaActualizacion
    }));

    // Deshabilitar caché para asegurar datos frescos
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(200).json({
      success: true,
      verificaciones: verificacionesParseadas
    });
  } catch (error) {
    console.error('❌ Error al obtener verificaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener verificaciones',
      details: error.message
    });
  }
};

/**
 * Verificar un certificado por su código
 * GET /ugel-talara/documentos/verificar-certificado/:codigo
 */
export const verificarCertificado = async (req, res) => {
  try {
    // El parámetro puede venir como :codigo o desde el body
    const codigo = req.params.codigo || req.params.id || req.query.codigo || req.body.codigo;

    if (!codigo) {
      return res.status(400).json({
        success: false,
        error: 'El código de certificado es requerido'
      });
    }

    const [verificaciones] = await pool.execute(
      `SELECT 
        id,
        codigoCertificado,
        datosQR,
        datosVerificados,
        fechaRegistro,
        fechaActualizacion
       FROM verificaciones_qr
       WHERE codigoCertificado = ?`,
      [codigo]
    );

    if (verificaciones.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Certificado no encontrado'
      });
    }

    const verificacion = verificaciones[0];

    // Parsear los campos JSON
    const datosQR = typeof verificacion.datosQR === 'string' 
      ? JSON.parse(verificacion.datosQR) 
      : verificacion.datosQR;
    const datosVerificados = typeof verificacion.datosVerificados === 'string' 
      ? JSON.parse(verificacion.datosVerificados) 
      : verificacion.datosVerificados;

    res.status(200).json({
      success: true,
      certificado: verificacion.codigoCertificado,
      postulante: datosQR.postulante || datosQR.nombreCompleto || datosVerificados.nombreCompleto,
      convocatoria: datosQR.convocatoriaId ? {
        id: datosQR.convocatoriaId,
        numeroCAS: datosQR.numeroCAS,
        area: datosQR.area,
        puesto: datosQR.puesto
      } : null,
      archivos: {
        curriculum: [],
        anexos: []
      },
      fechaRegistro: verificacion.fechaRegistro
    });
  } catch (error) {
    console.error('❌ Error al verificar certificado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar certificado',
      details: error.message
    });
  }
};

/**
 * Obtener todos los postulantes registrados para Mesa de Partes
 * GET /ugel-talara/documentos/postulantes-registrados
 */
export const obtenerPostulantesRegistrados = async (req, res) => {
  try {
    await asegurarTablaPostulantesRegistrados();
    
    const [postulantes] = await pool.execute(
      `SELECT 
        id,
        IDUSUARIO,
        certificadoId,
        nombreCompleto,
        apellidoPaterno,
        apellidoMaterno,
        dni,
        email,
        telefono,
        numeroCAS,
        puesto,
        area,
        convocatoriaId,
        anexoId,
        curriculumId,
        expedienteSIGEA,
        estado,
        fechaRegistro,
        fechaActualizacion
       FROM postulantes_registrados
       ORDER BY fechaRegistro DESC`
    );
    
    // Actualizar certificados con formato "POST-..." al nuevo formato "CERT-..."
    const año = new Date().getFullYear();
    const updates = [];
    
    for (const postulante of postulantes) {
      const certificadoIdAnterior = postulante.certificadoId;
      
      // Solo actualizar si NO tiene formato CERT- válido (POST- o null)
      if (!certificadoIdAnterior || String(certificadoIdAnterior).startsWith('POST-') || !String(certificadoIdAnterior).startsWith('CERT-')) {
        const timestamp = Date.now(); // Timestamp completo en milisegundos
        const idUsuario = postulante.IDUSUARIO || '0';
        const idConvocatoria = postulante.convocatoriaId || null;
        let nuevoCertificadoId;
        
        if (idConvocatoria) {
          nuevoCertificadoId = `CERT-${idUsuario}-${idConvocatoria}-${año}-${timestamp}`;
        } else {
          nuevoCertificadoId = `CERT-${idUsuario}-${año}-${timestamp}`;
        }
        
        // Guardar el valor anterior antes de actualizar
        const idPostulante = postulante.id;
        
        // Actualizar en la base de datos
        updates.push(
          pool.execute(
            `UPDATE postulantes_registrados SET certificadoId = ? WHERE id = ?`,
            [nuevoCertificadoId, idPostulante]
          ).then(() => {
            // Actualizar el objeto en memoria
            postulante.certificadoId = nuevoCertificadoId;
            console.log('✅ CertificadoId actualizado de POST- a CERT-:', {
              id: idPostulante,
              antiguo: certificadoIdAnterior,
              nuevo: nuevoCertificadoId
            });
          }).catch(err => {
            console.error('❌ Error al actualizar certificadoId:', err);
          })
        );
      }
    }
    
    // Esperar a que todas las actualizaciones se completen
    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`✅ ${updates.length} certificado(s) actualizado(s) de formato POST- a CERT-`);
    }

    // Normalizar los datos y convertir a strings
    const postulantesNormalizados = postulantes.map(p => ({
      id: p.id,
      certificadoId: String(p.certificadoId || 'N/A'),
      idUsuario: p.IDUSUARIO !== undefined && p.IDUSUARIO !== null ? Number(p.IDUSUARIO) : null,
      nombreCompleto: String(p.nombreCompleto || 'Sin nombre'),
      apellidoPaterno: String(p.apellidoPaterno || ''),
      apellidoMaterno: String(p.apellidoMaterno || ''),
      dni: String(p.dni || 'N/A'),
      email: String(p.email || 'N/A'),
      telefono: String(p.telefono || 'N/A'),
      numeroCAS: String(p.numeroCAS || 'N/A'),
      puesto: String(p.puesto || 'N/A'),
      area: String(p.area || 'N/A'),
      convocatoriaId: p.convocatoriaId ? String(p.convocatoriaId) : null,
      anexoId: p.anexoId ? String(p.anexoId) : null,
      curriculumId: p.curriculumId ? String(p.curriculumId) : null,
      expedienteSIGEA: String(p.expedienteSIGEA || ''),
      estado: String(p.estado || 'Pendiente'), // Incluir el estado en la respuesta
      registrado: p.estado === 'Registrado' || (p.expedienteSIGEA && p.expedienteSIGEA !== ''),
      fechaRegistro: p.fechaRegistro,
      fechaActualizacion: p.fechaActualizacion
    }));

    const certificadosRegistrados = new Set(
      postulantesNormalizados.map((p) => {
        const cert = p.certificadoId && p.certificadoId !== 'N/A' ? p.certificadoId : null;
        return cert || `ID-${p.id}`;
      })
    );

    let postulacionesActivas = [];
    try {
      let [postulacionesTable] = await pool.execute(
        `SELECT TABLE_NAME 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'postulaciones'`
      );

      if (postulacionesTable.length === 0) {
        await initializePostulacionesModule().catch(() => {});
        [postulacionesTable] = await pool.execute(
          `SELECT TABLE_NAME 
           FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'postulaciones'`
        );
      }

      if (postulacionesTable.length > 0) {
        const [rows] = await pool.execute(
          `SELECT 
             p.IDPOSTULACION,
             p.IDUSUARIO,
             p.IDCONVOCATORIA,
             p.estado,
             p.fechaRegistro,
             u.nombreCompleto,
             u.apellidoPaterno,
             u.apellidoMaterno,
             u.documento AS dni,
             u.correo AS email,
             u.telefono,
             c.numeroCAS,
             c.puesto,
             c.area
           FROM postulaciones p
           INNER JOIN usuarios u ON u.IDUSUARIO = p.IDUSUARIO
           LEFT JOIN convocatorias c ON c.IDCONVOCATORIA = p.IDCONVOCATORIA
           WHERE p.estado = 'registrada'
           ORDER BY p.fechaRegistro DESC`
        );
        postulacionesActivas = rows;
      }
    } catch (error) {
      if (error?.code === 'ER_NO_SUCH_TABLE') {
        postulacionesActivas = [];
      } else {
        throw error;
      }
    }

    for (const postulacion of postulacionesActivas) {
      const idUsuario = postulacion.IDUSUARIO || '0';
      const idConvocatoria = postulacion.IDCONVOCATORIA || null;
      
      // IMPORTANTE: Buscar si ya existe un certificadoId válido para este usuario y convocatoria
      // en postulantes_registrados antes de generar uno nuevo
      let certificadoGenerado = null;
      
      const [existentesCertificado] = await pool.execute(
        `SELECT certificadoId 
         FROM postulantes_registrados 
         WHERE IDUSUARIO = ? 
           AND (convocatoriaId = ? OR (convocatoriaId IS NULL AND ? IS NULL))
           AND certificadoId IS NOT NULL 
           AND certificadoId LIKE 'CERT-%'
         ORDER BY fechaRegistro DESC 
         LIMIT 1`,
        [idUsuario, idConvocatoria, idConvocatoria]
      );
      
      if (existentesCertificado.length > 0 && existentesCertificado[0].certificadoId) {
        // Usar el certificadoId existente si hay uno válido
        certificadoGenerado = existentesCertificado[0].certificadoId;
        console.log('✅ CertificadoId existente encontrado para postulación:', {
          usuario: idUsuario,
          convocatoria: idConvocatoria,
          certificadoId: certificadoGenerado
        });
      } else {
        // Solo generar uno nuevo si no existe uno válido
        // Formato: CERT-{userId}-{convocatoriaId}-{año}-{timestamp completo}
        const año = new Date().getFullYear();
        const timestamp = Date.now(); // Timestamp completo en milisegundos
        
        if (idConvocatoria) {
          certificadoGenerado = `CERT-${idUsuario}-${idConvocatoria}-${año}-${timestamp}`;
        } else {
          // Si no hay convocatoria, usar formato sin convocatoria
          certificadoGenerado = `CERT-${idUsuario}-${año}-${timestamp}`;
        }
        
        console.log('✅ CertificadoId generado para nueva postulación:', certificadoGenerado);
      }

      if (certificadosRegistrados.has(certificadoGenerado)) {
        continue;
      }

      const numeroCAS =
        postulacion.numeroCAS ||
        postulacion.numeroCas ||
        postulacion.numero_cas ||
        'N/A';

      postulantesNormalizados.push({
        id: -(postulacion.IDPOSTULACION || Date.now()),
        idUsuario: postulacion.IDUSUARIO ? Number(postulacion.IDUSUARIO) : null,
        certificadoId: certificadoGenerado,
        nombreCompleto: String(
          postulacion.nombreCompleto ||
            `${postulacion.apellidoPaterno || ''} ${postulacion.apellidoMaterno || ''}`.trim() ||
            'Postulante'
        ),
        apellidoPaterno: String(postulacion.apellidoPaterno || ''),
        apellidoMaterno: String(postulacion.apellidoMaterno || ''),
        dni: String(postulacion.dni || 'N/A'),
        email: String(postulacion.email || 'N/A'),
        telefono: String(postulacion.telefono || 'N/A'),
        numeroCAS: String(numeroCAS || 'N/A'),
        puesto: String(postulacion.puesto || 'N/A'),
        area: String(postulacion.area || 'N/A'),
        convocatoriaId: postulacion.IDCONVOCATORIA ? String(postulacion.IDCONVOCATORIA) : null,
        anexoId: null,
        curriculumId: null,
        expedienteSIGEA: '',
        estado: postulacion.estado ? String(postulacion.estado) : 'Pendiente',
        registrado: false,
        fechaRegistro: postulacion.fechaRegistro,
        fechaActualizacion: postulacion.fechaRegistro
      });

      certificadosRegistrados.add(certificadoGenerado);
    }

    // Deshabilitar caché para asegurar datos frescos
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.status(200).json({
      success: true,
      postulantes: postulantesNormalizados,
      total: postulantesNormalizados.length
    });
  } catch (error) {
    console.error('❌ Error al obtener postulantes registrados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener postulantes registrados',
      details: error.message
    });
  }
};

/**
 * Registrar un postulante en la base de datos con todos sus datos
 * POST /ugel-talara/documentos/registrar-postulante
 */
export const registrarPostulante = async (req, res) => {
  try {
    await asegurarTablaPostulantesRegistrados();
    
    const {
      idVerificacion,
      certificadoId,
      nombreCompleto,
      apellidoPaterno,
      apellidoMaterno,
      dni,
      email,
      telefono,
      numeroCAS,
      puesto,
      area,
      anexoId,
      curriculumId,
      convocatoriaId,
      expedienteSIGEA
    } = req.body;

    // Validar campos requeridos
    if (!certificadoId || !nombreCompleto || !dni) {
      return res.status(400).json({
        success: false,
        error: 'Los campos certificadoId, nombreCompleto y dni son requeridos'
      });
    }

    // Obtener IDs de anexos y curriculum si no están en los datos recibidos
    let anexoIdFinal = anexoId ? parseInt(anexoId) : null;
    let curriculumIdFinal = curriculumId ? parseInt(curriculumId) : null;

    // Si no tenemos el anexoId, intentar obtenerlo desde la base de datos usando el DNI
    if (!anexoIdFinal && dni) {
      try {
        // Buscar el usuario por DNI
        const [usuarios] = await pool.execute(
          `SELECT IDUSUARIO FROM usuarios WHERE documento = ? LIMIT 1`,
          [dni]
        );
        
        if (usuarios.length > 0) {
          const userId = usuarios[0].IDUSUARIO;
          
          // Buscar el anexo más reciente del usuario
          const [anexos] = await pool.execute(
            `SELECT IDANEXO FROM anexos_completos WHERE IDUSUARIO = ? ORDER BY fechaCreacion DESC LIMIT 1`,
            [userId]
          );
          
          if (anexos.length > 0) {
            anexoIdFinal = anexos[0].IDANEXO;
            console.log('✅ ID del anexo obtenido desde BD:', anexoIdFinal);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener anexoId desde BD:', error);
      }
    }

    // Si no tenemos el curriculumId, intentar obtenerlo desde la base de datos usando el DNI
    if (!curriculumIdFinal && dni) {
      try {
        // Buscar el usuario por DNI
        const [usuarios] = await pool.execute(
          `SELECT IDUSUARIO FROM usuarios WHERE documento = ? LIMIT 1`,
          [dni]
        );
        
        if (usuarios.length > 0) {
          const userId = usuarios[0].IDUSUARIO;
          
          // Buscar el curriculum más reciente del usuario
          const [curriculums] = await pool.execute(
            `SELECT IDCURRICULUM FROM curriculum WHERE IDUSUARIO = ? ORDER BY fechaCreacion DESC LIMIT 1`,
            [userId]
          );
          
          if (curriculums.length > 0) {
            curriculumIdFinal = curriculums[0].IDCURRICULUM;
            console.log('✅ ID del curriculum obtenido desde BD:', curriculumIdFinal);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener curriculumId desde BD:', error);
      }
    }

    // Verificar si ya existe un registro con este certificadoId
    const [existentes] = await pool.execute(
      `SELECT id FROM postulantes_registrados WHERE certificadoId = ?`,
      [certificadoId]
    );

    if (existentes.length > 0) {
      // Actualizar registro existente
      const postulanteId = existentes[0].id;
      
      await pool.execute(
        `UPDATE postulantes_registrados 
         SET nombreCompleto = ?,
             apellidoPaterno = ?,
             apellidoMaterno = ?,
             dni = ?,
             email = ?,
             telefono = ?,
             numeroCAS = ?,
             puesto = ?,
             area = ?,
             convocatoriaId = ?,
             anexoId = ?,
             curriculumId = ?,
             expedienteSIGEA = ?,
             estado = 'Registrado',
             fechaActualizacion = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          nombreCompleto,
          apellidoPaterno || null,
          apellidoMaterno || null,
          dni,
          email || null,
          telefono || null,
          numeroCAS || null,
          puesto || null,
          area || null,
          convocatoriaId ? parseInt(convocatoriaId) : null,
          anexoIdFinal,
          curriculumIdFinal,
          expedienteSIGEA || null,
          postulanteId
        ]
      );

      console.log('✅ Postulante actualizado correctamente:', postulanteId);

      res.status(200).json({
        success: true,
        message: 'Postulante registrado/actualizado correctamente',
        postulante: {
          id: postulanteId,
          certificadoId,
          nombreCompleto,
          apellidoPaterno,
          apellidoMaterno,
          dni,
          email,
          telefono,
          numeroCAS,
          puesto,
          area,
          anexoId: anexoIdFinal,
          curriculumId: curriculumIdFinal,
          convocatoriaId: convocatoriaId ? parseInt(convocatoriaId) : null,
          expedienteSIGEA
        }
      });
    } else {
      // Crear nuevo registro
      const [result] = await pool.execute(
        `INSERT INTO postulantes_registrados (
          certificadoId,
          nombreCompleto,
          apellidoPaterno,
          apellidoMaterno,
          dni,
          email,
          telefono,
          numeroCAS,
          puesto,
          area,
          convocatoriaId,
          anexoId,
          curriculumId,
          expedienteSIGEA,
          estado,
          fechaRegistro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Registrado', NOW())`,
        [
          certificadoId,
          nombreCompleto,
          apellidoPaterno || null,
          apellidoMaterno || null,
          dni,
          email || null,
          telefono || null,
          numeroCAS || null,
          puesto || null,
          area || null,
          convocatoriaId ? parseInt(convocatoriaId) : null,
          anexoIdFinal,
          curriculumIdFinal,
          expedienteSIGEA || null
        ]
      );

      console.log('✅ Postulante registrado correctamente:', result.insertId);

      res.status(201).json({
        success: true,
        message: 'Postulante registrado correctamente',
        postulante: {
          id: result.insertId,
          certificadoId,
          nombreCompleto,
          apellidoPaterno,
          apellidoMaterno,
          dni,
          email,
          telefono,
          numeroCAS,
          puesto,
          area,
          anexoId: anexoIdFinal,
          curriculumId: curriculumIdFinal,
          convocatoriaId: convocatoriaId ? parseInt(convocatoriaId) : null,
          expedienteSIGEA
        }
      });
    }
  } catch (error) {
    console.error('❌ Error al registrar postulante:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar postulante',
      details: error.message
    });
  }
};

/**
 * Actualizar expediente SIGEA de un postulante
 * PUT /ugel-talara/documentos/postulantes-registrados/:id/expediente
 */
export const actualizarExpedientePostulante = async (req, res) => {
  try {
    await asegurarTablaPostulantesRegistrados();
    
    const { id } = req.params;
    const { expedienteSIGEA } = req.body;

    if (!expedienteSIGEA) {
      return res.status(400).json({
        success: false,
        error: 'El número de expediente SIGEA es requerido'
      });
    }

    // Actualizar en la nueva tabla postulantes_registrados
    // NO cambiar el estado automáticamente, solo actualizar el expediente SIGEA
    const [result] = await pool.execute(
      `UPDATE postulantes_registrados 
       SET expedienteSIGEA = ?,
           fechaActualizacion = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [expedienteSIGEA, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Postulante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expediente SIGEA actualizado correctamente',
      expedienteSIGEA: expedienteSIGEA
    });
  } catch (error) {
    console.error('❌ Error al actualizar expediente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar expediente SIGEA',
      details: error.message
    });
  }
};

/**
 * Rechazar un postulante
 * PUT /ugel-talara/documentos/postulantes-registrados/:id/rechazar
 */
export const rechazarPostulante = async (req, res) => {
  try {
    await asegurarTablaPostulantesRegistrados();
    
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'El ID del postulante es requerido'
      });
    }

    // Actualizar el estado a 'Rechazado'
    const [result] = await pool.execute(
      `UPDATE postulantes_registrados 
       SET estado = 'Rechazado',
           fechaActualizacion = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Postulante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Postulante rechazado correctamente',
      estado: 'Rechazado'
    });
  } catch (error) {
    console.error('❌ Error al rechazar postulante:', error);
    res.status(500).json({
      success: false,
      error: 'Error al rechazar postulante',
      details: error.message
    });
  }
};

/**
 * Eliminar una verificación de QR por ID o código de certificado
 * DELETE /ugel-talara/documentos/verificacion/:id
 * DELETE /ugel-talara/documentos/verificacion/codigo/:codigo
 */
export const eliminarVerificacion = async (req, res) => {
  try {
    const id = req.params.id;
    const codigo = req.params.codigo || req.query.codigo;

    if (!id && !codigo) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el ID o el código del certificado para eliminar'
      });
    }

    let eliminado = false;
    let nombrePostulante = '';

    // Intentar eliminar por ID primero
    if (id && !isNaN(id)) {
      // Obtener el nombre del postulante antes de eliminar (para el mensaje)
      try {
        const [verificacion] = await pool.execute(
          `SELECT datosQR FROM verificaciones_qr WHERE id = ?`,
          [id]
        );
        
        if (verificacion.length > 0) {
          const datosQR = typeof verificacion[0].datosQR === 'string' 
            ? JSON.parse(verificacion[0].datosQR) 
            : verificacion[0].datosQR;
          nombrePostulante = datosQR.postulante || datosQR.nombreCompleto || 'Postulante';
        }

        const [result] = await pool.execute(
          `DELETE FROM verificaciones_qr WHERE id = ?`,
          [id]
        );

        if (result.affectedRows > 0) {
          eliminado = true;
        }
      } catch (error) {
        console.error('Error al eliminar por ID:', error);
      }
    }

    // Si no se eliminó por ID, intentar por código de certificado
    if (!eliminado && codigo) {
      try {
        // Obtener el nombre del postulante antes de eliminar
        const [verificacion] = await pool.execute(
          `SELECT datosQR FROM verificaciones_qr WHERE codigoCertificado = ?`,
          [codigo]
        );
        
        if (verificacion.length > 0) {
          const datosQR = typeof verificacion[0].datosQR === 'string' 
            ? JSON.parse(verificacion[0].datosQR) 
            : verificacion[0].datosQR;
          nombrePostulante = datosQR.postulante || datosQR.nombreCompleto || 'Postulante';
        }

        const [result] = await pool.execute(
          `DELETE FROM verificaciones_qr WHERE codigoCertificado = ?`,
          [codigo]
        );

        if (result.affectedRows > 0) {
          eliminado = true;
        }
      } catch (error) {
        console.error('Error al eliminar por código:', error);
      }
    }

    if (eliminado) {
      console.log(`✅ Verificación eliminada: ${nombrePostulante || id || codigo}`);
      res.status(200).json({
        success: true,
        message: 'Verificación eliminada exitosamente',
        postulante: nombrePostulante
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Verificación no encontrada'
      });
    }
  } catch (error) {
    console.error('❌ Error al eliminar verificación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar verificación',
      details: error.message
    });
  }
};

