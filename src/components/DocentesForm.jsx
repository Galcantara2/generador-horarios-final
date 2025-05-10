import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const DocentesForm = () => {
  const [nombre, setNombre] = useState("");
  const [jornada, setJornada] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [aulas, setAulas] = useState([]);
  const [docentes, setDocentes] = useState([]);

  useEffect(() => {
    cargarDocentes();
    cargarAulas();
  }, []);

  const cargarDocentes = async () => {
    const { data } = await supabase.from("docentes").select("*, aulas(nombre)").order("id");
    setDocentes(data || []);
  };

  const cargarAulas = async () => {
    const { data } = await supabase.from("aulas").select();
    setAulas(data || []);
  };

  const agregarDocente = async () => {
    if (!nombre || !jornada || !aulaId) return;
    const { error } = await supabase.from("docentes").insert({
      nombre,
      jornada_total: parseInt(jornada),
      aula_id: parseInt(aulaId),
    });
    if (!error) {
      setNombre("");
      setJornada("");
      setAulaId("");
      cargarDocentes();
    }
  };

  const eliminarDocente = async (id) => {
    await supabase.from("docentes").delete().eq("id", id);
    cargarDocentes();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Registrar Docente</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nombre del docente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 border px-4 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Horas"
          value={jornada}
          onChange={(e) => setJornada(e.target.value)}
          className="w-24 border px-2 py-2 rounded"
        />
        <select
          value={aulaId}
          onChange={(e) => setAulaId(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">Seleccione un aula</option>
          {aulas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <button
          onClick={agregarDocente}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Agregar
        </button>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Nombre</th>
            <th className="border px-4 py-2">Horas</th>
            <th className="border px-4 py-2">Aula</th>
            <th className="border px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((d) => (
            <tr key={d.id}>
              <td className="border px-4 py-2">{d.nombre}</td>
              <td className="border px-4 py-2">{d.jornada_total}</td>
              <td className="border px-4 py-2">{d.aulas?.nombre || ""}</td>
              <td className="border px-4 py-2">
                {/* Aquí podrías poner botón Editar si deseas */}
                <button
                  onClick={() => eliminarDocente(d.id)}
                  className="text-red-600 hover:underline"
                >Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocentesForm;
