import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

import DocentesForm from "./components/DocentesForm";
import FranjasHorariasForm from "./components/FranjasHorariasForm";
import AsignacionDocenteCurso from "./components/AsignacionDocenteCurso";
import RestriccionesForm from "./components/RestriccionesForm";
import HorarioTable from "./components/HorarioTable";
import HorarioPorDocente from "./components/HorarioPorDocente";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docentes" element={<DocentesForm />} />
        <Route path="/franjas" element={<FranjasHorariasForm />} />
        <Route path="/asignacion" element={<AsignacionDocenteCurso />} />
        <Route path="/restricciones" element={<RestriccionesForm />} />
        <Route path="/horario" element={<HorarioTable />} />
        <Route path="/horario-docente" element={<HorarioPorDocente />} />
      </Routes>
    </Router>
  );
}

export default App;
