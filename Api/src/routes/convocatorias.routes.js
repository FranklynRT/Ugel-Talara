import express from 'express';
import {
  crearConvocatoria,
  obtenerConvocatorias,
  obtenerConvocatoriaPorId,
  actualizarConvocatoria,
  cambiarEstadoPublicacion,
  eliminarConvocatoria
} from '../controllers/convocatorias.js';

const router = express.Router();

// Rutas de gestión de convocatorias (públicas, sin autenticación)
router.get('/', obtenerConvocatorias);
router.get('/:id', obtenerConvocatoriaPorId);
router.post('/', crearConvocatoria);
router.put('/:id', actualizarConvocatoria);
router.patch('/:id/estado', cambiarEstadoPublicacion);
router.delete('/:id', eliminarConvocatoria);

export default router;
