import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/home";
import Login from "@/pages/login";
import Registro from "@/pages/registro";
import Olvido from "@/pages/recuperacion/ForgotPassword";
import AdminPage from "@/pages/admin/inicio";
import PostulantePage from "@/pages/postulante/inicio";
import InicioRRHH from "@/pages/rr.hh/inicio";
import AdministracionInformatica from "@/pages/rr.hh/AdministracionInformatica";
import AdministracionPatrimonio from "@/pages/rr.hh/AdministracionPatrimonio";
import AdministracionTesoreria from "@/pages/rr.hh/AdministracionTesoreria";
import AGP from "@/pages/rr.hh/AGP";
import Archivo from "@/pages/rr.hh/Archivo";
import Direccion from "@/pages/rr.hh/Direccion";
import DireccionMesaPartes from "@/pages/rr.hh/DireccionMesaPartes";
import Escalafon from "@/pages/rr.hh/Escalafon";
import Remuneraciones from "@/pages/rr.hh/Remuneraciones";
import UPDI from "@/pages/rr.hh/UPDI";
import Forbidden from "@/Forbidden";
import ResetPassword from "@/pages/recuperacion/ResetPassword";
import ComitePage from "@/pages/comite/inicio";
import EvaluacionesPage from "@/pages/comite/evaluaciones";
import ProfilePage from "@/pages/comite/ProfilePage"; // Added import for ProfilePage
import ReportesPage from "@/pages/comite/reportes/ReportesPage"; // Added import for ReportesPage
import VerificarCertificado from "@/pages/verificar-certificado"; // Added import for certificate verification
import TramitePage from "@/pages/tramite/inicio"; // Added import for Tramite (Mesa de Partes)


import {
  ComiteRoute, // Re-added ComiteRoute
  PostulanteRoute,
  RRHHRoute,
  TramiteRoute,
} from "@/components/ui/RouteGuards";

import { PrivateRoute } from "@/components/ui/PrivateRoute"; // ✅ protección global

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Página no encontrada</h1>
      <p className="text-slate-400 mb-6">La página que buscas no existe.</p>
      <a
        href="/"
        className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all"
      >
        Volver al inicio
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Registro />} />
      <Route path="/recuperar" element={<Olvido />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verificar-certificado" element={<VerificarCertificado />} /> 

      {/* 🔒 TODO lo demás requiere token */}
      <Route element={<PrivateRoute />}>
        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Comite */}
        <Route element={<ComiteRoute />}> {/* Added ComiteRoute protection */}
          <Route path="/comite" element={<ComitePage />} /> {/* Added ComitePage route */}
          <Route path="/comite/evaluaciones" element={<EvaluacionesPage />} /> {/* Added EvaluacionesPage route */}
          <Route path="/comite/perfil" element={<ProfilePage />} /> {/* Added ProfilePage route */}
          <Route path="/comite/reportes" element={<ReportesPage />} /> {/* Added ReportesPage route */}
        </Route>

        {/* Postulante */}
        <Route element={<PostulanteRoute />}>
          <Route path="/postulante" element={<PostulantePage />} />
        </Route>

        {/* Trámite - Mesa de Partes */}
        <Route element={<TramiteRoute />}>
          <Route path="/tramite" element={<TramitePage />} />
        </Route>

        {/* RRHH */}
        <Route element={<RRHHRoute />}>
          <Route path="/recursosHumanos" element={<InicioRRHH />} />
          <Route
            path="/recursosHumanos/administracionInformatica"
            element={<AdministracionInformatica />}
          />
          <Route
            path="/recursosHumanos/administracionPatrimonio"
            element={<AdministracionPatrimonio />}
          />
          <Route
            path="/recursosHumanos/administracionTesoreria"
            element={<AdministracionTesoreria />}
          />
          <Route path="/recursosHumanos/agp" element={<AGP />} />
          <Route path="/recursosHumanos/archivo" element={<Archivo />} />
          <Route path="/recursosHumanos/direccion" element={<Direccion />} />
          <Route
            path="/recursosHumanos/direccionMesaPartes"
            element={<DireccionMesaPartes />}
          />
          <Route path="/recursosHumanos/escalafon" element={<Escalafon />} />
          <Route
            path="/recursosHumanos/remuneraciones"
            element={<Remuneraciones />}
          />
          <Route path="/recursosHumanos/updi" element={<UPDI />} />
        </Route>
      </Route>

      {/* OTROS */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
