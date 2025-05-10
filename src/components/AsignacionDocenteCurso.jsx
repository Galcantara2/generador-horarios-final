import { useEffect, useState } from "react";
import { useDocentes } from "../context/DocenteContext";
import { supabase } from "../supabaseClient";

const grados = ["1°", "2°", "3°", "4°", "5°"];

const AsignacionDocenteCurso = () => {
  const {
    docentes, setDocentes,
    asignaciones, setAsignaciones,
    horasCursos, setHorasCursos
  } = useDocentes();

  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    cargarDocentes();
    cargarCursos();
    cargarHorasCursoGrado();
    cargarAsignacionesExistentes();
  }, []);

  const cargarDocentes = async () => {
    const { data } = await supabase.from("docentes").select("id, nombre");
    setDocentes(data || []);
  };

  const cargarCursos = async () => {
    const { data } = await supabase.from("cursos").select("id, nombre");
    setCursos(data || []);
  };

  const cargarHorasCursoGrado = async () => {
    const { data } = await supabase.from("horas_curso_grado").select("horas, curso_id, grado_id");
    if (data) {
      const map = {};
      data.forEach(({ curso_id, grado_id, horas }) => {
        if (!map[curso_id]) map[curso_id] = {};
        map[curso_id][grado_id] = horas;
      });
      setHorasCursos(map);
    }
  };

  const cargarAsignacionesExistentes = async () => {
    const { data } = await supabase.from("asignaciones").select("curso_id, grado_id, docente_id");
    if (data) {
      const map = {};
      data.forEach(({ curso_id, grado_id, docente_id }) => {
        if (!map[curso_id]) map[curso_id] = {};
        map[curso_id][grado_id] = { docente_id, curso_id, grado_id };
      });
      setAsignaciones(map);
    }
  };

  const handleAsignacion = (cursoId, gradoId, docenteId) => {
    setAsignaciones(prev => ({
      ...prev,
      [cursoId]: {
        ...prev[cursoId],
        [gradoId]: {
          docente_id: parseInt(docenteId),
          curso_id: parseInt(cursoId),
          grado_id: parseInt(gradoId)
        }
      }
    }));
  };

  const asignarATodosLosGrados = (cursoId, docenteId) => {
    setAsignaciones(prev => ({
      ...prev,
      [cursoId]: grados.reduce((acc, _, idx) => {
        acc[idx + 1] = {
          docente_id: parseInt(docenteId),
          curso_id: parseInt(cursoId),
          grado_id: idx + 1
        };
        return acc;
      }, {})
    }));
  };

  const guardarTodo = async () => {
    const registros = [];

    for (const cursoId in asignaciones) {
      for (const gradoId in asignaciones[cursoId]) {
        const item = asignaciones[cursoId][gradoId];
        const horas = horasCursos[cursoId]?.[gradoId] || 0;
        if (item?.docente_id && horas > 0) {
          registros.push({ ...item, horas });
        }
      }
    }

    const registrosUnicos = Array.from(
      new Map(registros.map(r => [`${r.curso_id}-${r.grado_id}`, r])).values()
    );

    const { error } = await supabase.from("asignaciones").upsert(registrosUnicos, {
      onConflict: ['curso_id', 'grado_id']
    });

    if (error) alert("❌ Error al guardar");
    else alert("✅ Asignaciones guardadas correctamente.");
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Asignación de Docentes y Horas</h2>

      <div className="overflow-x-auto mb-8">
        <h3 className="text-lg font-bold mb-2">Horas programadas por curso y grado</h3>
        <table className="table-auto w-full border mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Curso</th>
              {grados.map((g, idx) => (
                <th key={idx} className="border px-2 py-1 text-center">{g}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso) => (
              <tr key={curso.id}>
                <td className="border px-2 py-1">{curso.nombre}</td>
                {grados.map((_, idx) => (
                  <td key={idx} className="border px-2 py-1 text-center">
                    {horasCursos[curso.id]?.[idx + 1] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <h3 className="text-lg font-bold mb-2">Asignar docentes a cada curso y grado</h3>
        <table className="table-auto w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Curso</th>
              {grados.map((g, idx) => (
                <th key={idx} className="border px-2 py-1 text-center">{g}</th>
              ))}
              <th className="border px-2 py-1 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso) => (
              <tr key={curso.id}>
                <td className="border px-2 py-1">{curso.nombre}</td>
                {grados.map((_, idx) => (
                  <td key={idx} className="border px-2 py-1">
                    <select
                      value={asignaciones[curso.id]?.[idx + 1]?.docente_id || ""}
                      onChange={(e) => handleAsignacion(curso.id, idx + 1, e.target.value)}
                      className="border px-2 py-1 w-full bg-blue-100"
                    >
                      <option value="">-- Asignar --</option>
                      {docentes.map((docente) => (
                        <option key={docente.id} value={docente.id}>{docente.nombre}</option>
                      ))}
                    </select>
                  </td>
                ))}
                <td className="border px-2 py-1 text-center">
                  <button
                    onClick={() => {
                      const primerGrado = 1;
                      const docenteId = asignaciones[curso.id]?.[primerGrado]?.docente_id;
                      if (docenteId) asignarATodosLosGrados(curso.id, docenteId);
                      else alert("Primero asigna al menos un grado.");
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Asignar a todos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={guardarTodo}
          className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Guardar todo
        </button>
      </div>
    </div>
  );
};

export default AsignacionDocenteCurso;
