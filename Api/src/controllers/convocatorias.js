import { pool } from '../database/conexion.js';

// ============================================================
// 🔧 FUNCIONES DEL CONTROLADOR DE CONVOCATORIAS
// ============================================================

// Función para verificar y crear la tabla CONVOCATORIAS si no existe
async function ensureConvocatoriasTable() {
  try {
    // Verificar si la tabla existe
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'convocatorias'`
    );
    
    if (tables.length === 0) {
      // Crear la tabla con las columnas requeridas
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS convocatorias (
          IDCONVOCATORIA INT AUTO_INCREMENT PRIMARY KEY,
          area VARCHAR(255) NOT NULL,
          puesto VARCHAR(255) NOT NULL,
          sueldo VARCHAR(100),
          tituloProfesional ENUM('Sí', 'No') DEFAULT 'No',
          expPublicaMin VARCHAR(100),
          expPublicaMax VARCHAR(100),
          experienciaTotal VARCHAR(255),
          fechaInicio DATE NOT NULL,
          fechaFin DATE NOT NULL,
          estado ENUM('Activo', 'Inactivo', 'Publicada', 'No Publicada') DEFAULT 'No Publicada',
          publicada TINYINT(1) DEFAULT 0,
          numeroCAS VARCHAR(100) NOT NULL UNIQUE,
          requisitosAcademicos TEXT,
          habilidadesTecnicas TEXT,
          fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_area (area),
          INDEX idx_puesto (puesto),
          INDEX idx_estado (estado),
          INDEX idx_numeroCAS (numeroCAS),
          INDEX idx_fechaInicio (fechaInicio),
          INDEX idx_fechaFin (fechaFin)
        )
      `);
      console.log('✅ Tabla convocatorias creada exitosamente');
    } else {
      // Si la tabla existe, verificar y agregar columnas faltantes
      try {
        // Verificar y agregar columnas una por una si no existen
        const [columns] = await pool.execute(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'convocatorias'`
        );
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        // Agregar tituloProfesional si no existe
        if (!existingColumns.includes('tituloProfesional')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN tituloProfesional ENUM('Sí', 'No') DEFAULT 'No' AFTER sueldo
          `);
          console.log('✅ Columna tituloProfesional agregada');
        }
        
        // Agregar expPublicaMin si no existe
        if (!existingColumns.includes('expPublicaMin')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN expPublicaMin VARCHAR(100) AFTER tituloProfesional
          `);
          console.log('✅ Columna expPublicaMin agregada');
        }
        
        // Agregar expPublicaMax si no existe
        if (!existingColumns.includes('expPublicaMax')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN expPublicaMax VARCHAR(100) AFTER expPublicaMin
          `);
          console.log('✅ Columna expPublicaMax agregada');
        }
        
        // Agregar experienciaTotal si no existe
        if (!existingColumns.includes('experienciaTotal')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN experienciaTotal VARCHAR(255) AFTER expPublicaMax
          `);
          console.log('✅ Columna experienciaTotal agregada');
        }
        
        // Agregar fechaInicio si no existe
        if (!existingColumns.includes('fechaInicio')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN fechaInicio DATE NOT NULL AFTER experienciaTotal
          `);
          console.log('✅ Columna fechaInicio agregada');
        }
        
        // Agregar fechaFin si no existe
        if (!existingColumns.includes('fechaFin')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN fechaFin DATE NOT NULL AFTER fechaInicio
          `);
          console.log('✅ Columna fechaFin agregada');
        }
        
        // Agregar estado si no existe o actualizar ENUM
        if (!existingColumns.includes('estado')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN estado ENUM('Activo', 'Inactivo', 'Publicada', 'No Publicada') DEFAULT 'No Publicada' AFTER fechaFin
          `);
          console.log('✅ Columna estado agregada');
        } else {
          // Siempre intentar actualizar el ENUM para asegurar que tenga todas las opciones correctas
          try {
            // Primero verificar el tipo actual de la columna
            const [columnInfo] = await pool.execute(`
              SELECT COLUMN_TYPE, COLUMN_DEFAULT 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'convocatorias' 
              AND COLUMN_NAME = 'estado'
            `);
            
            if (columnInfo.length > 0) {
              const currentType = columnInfo[0].COLUMN_TYPE;
              const expectedType = "enum('Activo','Inactivo','Publicada','No Publicada')";
              
              // Si el tipo actual no coincide con el esperado, actualizarlo
              if (currentType && typeof currentType === 'string' && currentType.toLowerCase() !== expectedType.toLowerCase()) {
                await pool.execute(`
                  ALTER TABLE convocatorias 
                  MODIFY COLUMN estado ENUM('Activo', 'Inactivo', 'Publicada', 'No Publicada') DEFAULT 'No Publicada'
                `);
                console.log('✅ Columna estado actualizada con ENUM correcto');
              } else {
                console.log('✅ Columna estado ya tiene el formato correcto');
              }
            }
          } catch (e) {
            console.error('⚠️ Error al actualizar columna estado:', e.message);
            // Intentar una actualización más simple
            try {
              await pool.execute(`
                ALTER TABLE convocatorias 
                MODIFY COLUMN estado ENUM('Activo', 'Inactivo', 'Publicada', 'No Publicada') DEFAULT 'No Publicada'
              `);
              console.log('✅ Columna estado actualizada exitosamente');
            } catch (e2) {
              console.log('⚠️ No se pudo actualizar estado (puede que ya esté correcto):', e2.message);
            }
          }
        }
        
        // Agregar numeroCAS si no existe
        if (!existingColumns.includes('numeroCAS')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN numeroCAS VARCHAR(100) NOT NULL UNIQUE AFTER estado
          `);
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD INDEX idx_numeroCAS (numeroCAS)
          `);
          console.log('✅ Columna numeroCAS agregada');
        }
        
        // Agregar requisitosAcademicos si no existe
        if (!existingColumns.includes('requisitosAcademicos')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN requisitosAcademicos TEXT AFTER numeroCAS
          `);
          console.log('✅ Columna requisitosAcademicos agregada');
        }
        
        // Agregar habilidadesTecnicas si no existe
        if (!existingColumns.includes('habilidadesTecnicas')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN habilidadesTecnicas TEXT AFTER requisitosAcademicos
          `);
          console.log('✅ Columna habilidadesTecnicas agregada');
        }
        
        // Agregar publicada si no existe
        if (!existingColumns.includes('publicada')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN publicada TINYINT(1) DEFAULT 0 AFTER estado
          `);
          console.log('✅ Columna publicada agregada');
        }
        
        // Agregar fechaActualizacion si no existe
        if (!existingColumns.includes('fechaActualizacion')) {
          await pool.execute(`
            ALTER TABLE convocatorias 
            ADD COLUMN fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          `);
          console.log('✅ Columna fechaActualizacion agregada');
        }
        
      } catch (error) {
        console.error('Error al actualizar estructura de tabla convocatorias:', error);
      }
    }
  } catch (error) {
    console.error('Error al verificar/crear tabla convocatorias:', error);
    throw error;
  }
}

// Crear nueva convocatoria
const crearConvocatoria = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const {
      area,
      puesto,
      sueldo,
      tituloProfesional,
      expPublicaMin,
      expPublicaMax,
      experienciaTotal,
      experiencia,
      experienciaLaboral,
      fechaInicio,
      fechaFin,
      estado,
      numeroCAS,
      requisitosAcademicos,
      habilidadesTecnicas,
      publicada
    } = req.body;

    // Validar campos requeridos
    if (!area || !puesto || !numeroCAS || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        error: 'Los campos área, puesto, número CAS, fecha inicio y fecha fin son requeridos'
      });
    }

    // Validar formato de fechas
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    
    if (isNaN(fechaInicioDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha de inicio no es válida'
      });
    }
    
    if (isNaN(fechaFinDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha de fin no es válida'
      });
    }
    
    if (fechaFinDate < fechaInicioDate) {
      return res.status(400).json({
        error: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    // Verificar si el número CAS ya existe
    const [existingCAS] = await pool.execute(
      'SELECT IDCONVOCATORIA FROM convocatorias WHERE numeroCAS = ?',
      [numeroCAS]
    );

    if (existingCAS.length > 0) {
      return res.status(400).json({
        error: 'Ya existe una convocatoria con este número CAS'
      });
    }

    // Normalizar valores
    const tituloProf = tituloProfesional === 'Sí' || tituloProfesional === 'Si' ? 'Sí' : 'No';
    const experienciaTexto = experienciaTotal ?? experiencia ?? experienciaLaboral;
    const publicadaFlag = publicada === true || publicada === 'true' || publicada === 1 || publicada === '1';
    let estadoFinal = estado && ['Activo', 'Inactivo', 'Publicada', 'No Publicada'].includes(estado) 
      ? estado 
      : 'No Publicada';

    if (publicada !== undefined && estado === undefined) {
      estadoFinal = publicadaFlag ? 'Publicada' : 'No Publicada';
    }

    // Insertar nueva convocatoria
    const [result] = await pool.execute(
      `INSERT INTO convocatorias (
        area, puesto, sueldo, tituloProfesional, expPublicaMin, expPublicaMax, experienciaTotal,
        fechaInicio, fechaFin, estado, publicada, numeroCAS, requisitosAcademicos, habilidadesTecnicas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        area.trim(),
        puesto.trim(),
        sueldo ? sueldo.trim() : null,
        tituloProf,
        expPublicaMin ? expPublicaMin.trim() : null,
        expPublicaMax ? expPublicaMax.trim() : null,
        experienciaTexto ? experienciaTexto.toString().trim() : null,
        fechaInicio,
        fechaFin,
        estadoFinal,
        publicadaFlag ? 1 : 0,
        numeroCAS.trim(),
        requisitosAcademicos ? requisitosAcademicos.trim() : null,
        habilidadesTecnicas ? habilidadesTecnicas.trim() : null
      ]
    );

    console.log('✅ Convocatoria creada exitosamente:', result.insertId);
    res.status(201).json({
      message: 'Convocatoria creada exitosamente',
      convocatoriaId: result.insertId,
      numeroCAS: numeroCAS
    });
  } catch (error) {
    console.error('❌ Error al crear convocatoria:', error);
    res.status(500).json({
      error: 'Error al crear convocatoria',
      details: error.message
    });
  }
};

// Obtener todas las convocatorias
const obtenerConvocatorias = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const { estado, area, publicada } = req.query;
    
    // Verificar si la tabla grupos_comite_convocatorias existe
    let tablaGruposExiste = false;
    try {
      const [tables] = await pool.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grupos_comite_convocatorias'`
      );
      tablaGruposExiste = tables.length > 0;
    } catch (e) {
      // Si hay error, asumir que la tabla no existe
      tablaGruposExiste = false;
    }
    
    let query = 'SELECT * FROM convocatorias WHERE 1=1';
    const params = [];
    
    // Filtro por estado
    if (estado) {
      query += ' AND estado = ?';
      params.push(estado);
    }
    
    // Filtro por área
    if (area) {
      query += ' AND area = ?';
      params.push(area);
    }
    
    // Filtro por publicada (Publicada/No Publicada)
    if (publicada !== undefined) {
      if (publicada === 'true' || publicada === '1') {
        query += " AND estado IN ('Publicada', 'Activo')";
        // Excluir convocatorias que están asignadas a grupos de comité (solo si la tabla existe)
        if (tablaGruposExiste) {
          query += ` AND IDCONVOCATORIA NOT IN (
            SELECT DISTINCT IDCONVOCATORIA 
            FROM grupos_comite_convocatorias
          )`;
        }
      } else {
        query += " AND estado IN ('No Publicada', 'Inactivo')";
      }
    } else {
      // Si no hay filtro de publicada, pero se está buscando por estado activo/publicada, también excluir las asignadas a grupos
      if (estado && (estado === 'Publicada' || estado === 'Activo') && tablaGruposExiste) {
        query += ` AND IDCONVOCATORIA NOT IN (
          SELECT DISTINCT IDCONVOCATORIA 
          FROM grupos_comite_convocatorias
        )`;
      }
    }
    
    query += ' ORDER BY fechaCreacion DESC';
    
    const [convocatorias] = await pool.execute(query, params);
    
    console.log(`✅ ${convocatorias.length} convocatorias obtenidas`);
    res.status(200).json(convocatorias);
  } catch (error) {
    console.error('❌ Error al obtener convocatorias:', error);
    res.status(500).json({
      error: 'Error al obtener convocatorias',
      details: error.message
    });
  }
};

// Obtener convocatoria por ID
const obtenerConvocatoriaPorId = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const { id } = req.params;
    
    const [convocatorias] = await pool.execute(
      'SELECT * FROM convocatorias WHERE IDCONVOCATORIA = ?',
      [id]
    );
    
    if (convocatorias.length === 0) {
      return res.status(404).json({
        error: 'Convocatoria no encontrada'
      });
    }
    
    res.status(200).json(convocatorias[0]);
  } catch (error) {
    console.error('❌ Error al obtener convocatoria:', error);
    res.status(500).json({
      error: 'Error al obtener convocatoria',
      details: error.message
    });
  }
};

// Actualizar convocatoria
const actualizarConvocatoria = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const { id } = req.params;
    const {
      area,
      puesto,
      sueldo,
      tituloProfesional,
      expPublicaMin,
      expPublicaMax,
      experienciaTotal,
      experiencia,
      experienciaLaboral,
      fechaInicio,
      fechaFin,
      estado,
      numeroCAS,
      requisitosAcademicos,
      habilidadesTecnicas,
      publicada
    } = req.body;

    // Verificar que la convocatoria existe
    const [existing] = await pool.execute(
      'SELECT IDCONVOCATORIA FROM convocatorias WHERE IDCONVOCATORIA = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Convocatoria no encontrada'
      });
    }

    // Si se actualiza el número CAS, verificar que no esté duplicado
    if (numeroCAS) {
      const [existingCAS] = await pool.execute(
        'SELECT IDCONVOCATORIA FROM convocatorias WHERE numeroCAS = ? AND IDCONVOCATORIA != ?',
        [numeroCAS, id]
      );

      if (existingCAS.length > 0) {
        return res.status(400).json({
          error: 'Ya existe otra convocatoria con este número CAS'
        });
      }
    }

    // Validar fechas si se proporcionan
    if (fechaInicio && fechaFin) {
      const fechaInicioDate = new Date(fechaInicio);
      const fechaFinDate = new Date(fechaFin);
      
      if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({
          error: 'Las fechas proporcionadas no son válidas'
        });
      }
      
      if (fechaFinDate < fechaInicioDate) {
        return res.status(400).json({
          error: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }
    }

    // Construir query dinámico
    const updates = [];
    const values = [];

    if (area !== undefined) {
      updates.push('area = ?');
      values.push(area.trim());
    }
    if (puesto !== undefined) {
      updates.push('puesto = ?');
      values.push(puesto.trim());
    }
    if (sueldo !== undefined) {
      updates.push('sueldo = ?');
      values.push(sueldo ? sueldo.trim() : null);
    }
    if (tituloProfesional !== undefined) {
      updates.push('tituloProfesional = ?');
      values.push(tituloProfesional === 'Sí' || tituloProfesional === 'Si' ? 'Sí' : 'No');
    }
    if (expPublicaMin !== undefined) {
      updates.push('expPublicaMin = ?');
      values.push(expPublicaMin ? expPublicaMin.trim() : null);
    }
    if (expPublicaMax !== undefined) {
      updates.push('expPublicaMax = ?');
      values.push(expPublicaMax ? expPublicaMax.trim() : null);
    }
    const experienciaTexto = experienciaTotal ?? experiencia ?? experienciaLaboral;
    if (experienciaTexto !== undefined) {
      updates.push('experienciaTotal = ?');
      values.push(experienciaTexto ? experienciaTexto.toString().trim() : null);
    }
    if (fechaInicio !== undefined) {
      updates.push('fechaInicio = ?');
      values.push(fechaInicio);
    }
    if (fechaFin !== undefined) {
      updates.push('fechaFin = ?');
      values.push(fechaFin);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      const estadoFinal = ['Activo', 'Inactivo', 'Publicada', 'No Publicada'].includes(estado) 
        ? estado 
        : 'No Publicada';
      values.push(estadoFinal);
    }
    if (numeroCAS !== undefined) {
      updates.push('numeroCAS = ?');
      values.push(numeroCAS.trim());
    }
    if (requisitosAcademicos !== undefined) {
      updates.push('requisitosAcademicos = ?');
      values.push(requisitosAcademicos ? requisitosAcademicos.trim() : null);
    }
    if (habilidadesTecnicas !== undefined) {
      updates.push('habilidadesTecnicas = ?');
      values.push(habilidadesTecnicas ? habilidadesTecnicas.trim() : null);
    }
    if (publicada !== undefined) {
      const publicadaFlag = publicada === true || publicada === 'true' || publicada === 1 || publicada === '1';
      updates.push('publicada = ?');
      values.push(publicadaFlag ? 1 : 0);
      if (estado === undefined) {
        updates.push('estado = ?');
        values.push(publicadaFlag ? 'Publicada' : 'No Publicada');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No se proporcionaron campos para actualizar'
      });
    }

    values.push(id);

    const query = `UPDATE convocatorias SET ${updates.join(', ')} WHERE IDCONVOCATORIA = ?`;
    
    await pool.execute(query, values);

    console.log('✅ Convocatoria actualizada exitosamente:', id);
    res.status(200).json({
      message: 'Convocatoria actualizada exitosamente',
      convocatoriaId: id
    });
  } catch (error) {
    console.error('❌ Error al actualizar convocatoria:', error);
    res.status(500).json({
      error: 'Error al actualizar convocatoria',
      details: error.message
    });
  }
};

// Cambiar estado de publicación de una convocatoria
const cambiarEstadoPublicacion = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const { id } = req.params;
    const { estado } = req.body;

    // Verificar que la convocatoria existe
    const [existing] = await pool.execute(
      'SELECT IDCONVOCATORIA FROM convocatorias WHERE IDCONVOCATORIA = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Convocatoria no encontrada'
      });
    }

    // Validar estado
    const estadosPermitidos = ['Activo', 'Inactivo', 'Publicada', 'No Publicada'];
    const estadoFinal = estadosPermitidos.includes(estado) ? estado : 'No Publicada';

    // Si se está desactivando la convocatoria, removerla de todos los grupos
    const estaDesactivando = estadoFinal === 'No Publicada' || estadoFinal === 'Inactivo';
    if (estaDesactivando) {
      try {
        // Verificar si existe la tabla de grupos_comite_convocatorias
        const [tables] = await pool.execute(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grupos_comite_convocatorias'`
        );
        
        if (tables.length > 0) {
          // Obtener los grupos donde está asignada esta convocatoria
          const [gruposAsignados] = await pool.execute(
            `SELECT DISTINCT IDGRUPO FROM grupos_comite_convocatorias WHERE IDCONVOCATORIA = ?`,
            [id]
          );
          
          if (gruposAsignados.length > 0) {
            // Eliminar la convocatoria de todos los grupos
            await pool.execute(
              `DELETE FROM grupos_comite_convocatorias WHERE IDCONVOCATORIA = ?`,
              [id]
            );
            
            console.log(`✅ Convocatoria ${id} removida automáticamente de ${gruposAsignados.length} grupo(s) al desactivarse`);
          }
        }
      } catch (error) {
        // Si hay error al remover de grupos, continuar con el cambio de estado
        console.warn('⚠️ Error al remover convocatoria de grupos (continuando con cambio de estado):', error.message);
      }
    }

    await pool.execute(
      'UPDATE convocatorias SET estado = ?, publicada = ? WHERE IDCONVOCATORIA = ?',
      [estadoFinal, (estadoFinal === 'Publicada' || estadoFinal === 'Activo') ? 1 : 0, id]
    );

    console.log(`✅ Estado de convocatoria ${id} actualizado a: ${estadoFinal}`);
    res.status(200).json({
      message: 'Estado de publicación actualizado exitosamente',
      convocatoriaId: id,
      nuevoEstado: estadoFinal
    });
  } catch (error) {
    console.error('❌ Error al cambiar estado de publicación:', error);
    res.status(500).json({
      error: 'Error al cambiar estado de publicación',
      details: error.message
    });
  }
};

// Eliminar convocatoria
const eliminarConvocatoria = async (req, res) => {
  try {
    await ensureConvocatoriasTable();
    
    const { id } = req.params;

    // Verificar que la convocatoria existe
    const [existing] = await pool.execute(
      'SELECT IDCONVOCATORIA FROM convocatorias WHERE IDCONVOCATORIA = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Convocatoria no encontrada'
      });
    }

    await pool.execute(
      'DELETE FROM convocatorias WHERE IDCONVOCATORIA = ?',
      [id]
    );

    console.log('✅ Convocatoria eliminada exitosamente:', id);
    res.status(200).json({
      message: 'Convocatoria eliminada exitosamente',
      convocatoriaId: id
    });
  } catch (error) {
    console.error('❌ Error al eliminar convocatoria:', error);
    res.status(500).json({
      error: 'Error al eliminar convocatoria',
      details: error.message
    });
  }
};

export {
  crearConvocatoria,
  obtenerConvocatorias,
  obtenerConvocatoriaPorId,
  actualizarConvocatoria,
  cambiarEstadoPublicacion,
  eliminarConvocatoria
};
