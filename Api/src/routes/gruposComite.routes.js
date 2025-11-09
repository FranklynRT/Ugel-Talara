import express from 'express';
import {
  obtenerGruposComite,
  crearGrupoComite,
  obtenerGrupoComitePorId,
  obtenerUsuariosGrupo,
  asignarUsuarioAGrupo,
  removerUsuarioDeGrupo,
  obtenerConvocatoriasGrupo,
  asignarConvocatoriaAGrupo,
  removerConvocatoriaDeGrupo
} from '../controllers/gruposComite.js';
import { verifyToken } from '../authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/grupos-comite', verifyToken, obtenerGruposComite);
router.post('/grupos-comite', verifyToken, crearGrupoComite);
router.get('/grupos-comite/:id', verifyToken, obtenerGrupoComitePorId);

// Rutas para usuarios de grupos
router.get('/grupos-comite/:id/usuarios', verifyToken, obtenerUsuariosGrupo);
router.post('/grupos-comite/:id/usuarios', verifyToken, asignarUsuarioAGrupo);
router.delete('/grupos-comite/:id/usuarios/:userId', verifyToken, removerUsuarioDeGrupo);

// Rutas para convocatorias de grupos
router.get('/grupos-comite/:id/convocatorias', verifyToken, obtenerConvocatoriasGrupo);
router.post('/grupos-comite/:id/convocatorias', verifyToken, asignarConvocatoriaAGrupo);
router.delete('/grupos-comite/:id/convocatorias/:convocatoriaId', verifyToken, removerConvocatoriaDeGrupo);

export default router;

