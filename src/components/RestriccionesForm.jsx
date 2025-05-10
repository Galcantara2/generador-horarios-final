import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import es from "date-fns/locale/es";
import { supabase } from "../supabaseClient";
import { useDocentes } from "../context/DocenteContext"; // si usas contexto global

const locales = { es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const RestriccionesForm = () => {
  const [docentes, setDocentes] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const [eventos, setEventos] = useState([]);

  const { setRestricciones } = useDocentes(); // si manejas restricciones globalmente

  useEffect(() => {
    cargarDocentes();
  }, []);

  const cargarDocentes = async () => {
    const { data } = await supabase.from("docentes").select("id, nombre");
    setDocentes(data || []);
  };

  const manejarSeleccion = ({ start, end }) => {
    const nuevoEvento = {
      start,
      end,
      title: "Disponible",
    };
    setEventos([...eventos, nuevoEvento]);
  };

  const limpiarCalendario = () => setEventos([]);

  const guardarRestricciones = async () => {
    if (!docenteSeleccionado) return alert("Seleccione un docente.");

    const docente = docentes.find((d) => d.nombre === docenteSeleccionado);
    if (!docente) return alert("Docente no encontrado.");

    // Elimina restricciones anteriores del docente
    await supabase.from("restricciones_docente").delete().eq("docente_id", docente.id);

    // Calcular bloques seleccionados (disponibles)
    const bloquesDisponibles = new Set();
    eventos.forEach(({ start, end }) => {
      const dia = start.toLocaleDateString("es-PE", { weekday: "long" }).toLowerCase();
      const horaInicio = start.getHours() + start.getMinutes() / 60;
      const horaFin = end.getHours() + end.getMinutes() / 60;

      for (let i = 0; i < 8; i++) {
        const inicioBloque = 7.25 + i * 0.75;
        const finBloque = inicioBloque + 0.75;

        if (horaInicio < finBloque && horaFin > inicioBloque) {
          bloquesDisponibles.add(`${dia}-${i}`);
        }
      }
    });

    // Convertir a registros para Supabase
    const restricciones = [];
    const restriccionesMap = {}; // para el contexto global

    for (let clave of bloquesDisponibles) {
      const [dia, bloqueStr] = clave.split("-");
      const bloque = parseInt(bloqueStr);
      restricciones.push({
        docente_id: docente.id,
        dia,
        bloque,
      });
      restriccionesMap[clave] = true; // clave tipo "lunes-0": true
    }

    // Guardar en Supabase
    const { error } = await supabase.from("restricciones_docente").insert(restricciones);
    if (error) {
      alert("❌ Error al guardar restricciones");
      console.error(error);
    } else {
      alert("✅ Restricciones guardadas correctamente");

      // Si usas contexto global, actualiza las restricciones
      if (setRestricciones) {
        setRestricciones((prev) => ({
          ...prev,
          [docente.id.toString()]: restriccionesMap,
        }));
      }
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Restricciones tipo calendario</h2>

      <select
        value={docenteSeleccionado}
        onChange={(e) => {
          setDocenteSeleccionado(e.target.value);
          limpiarCalendario();
        }}
        className="border px-3 py-2 mb-4 rounded w-full"
      >
        <option value="">-- Seleccione un docente --</option>
        {docentes.map((d) => (
          <option key={d.id} value={d.nombre}>{d.nombre}</option>
        ))}
      </select>

      {docenteSeleccionado && (
        <>
          <div className="bg-white border rounded mb-4" style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              selectable
              defaultView="week"
              views={["week"]}
              timeslots={1}
              step={45}
              onSelectSlot={manejarSeleccion}
              defaultDate={new Date(2024, 3, 22)}
              min={new Date(1970, 1, 1, 7, 15)}
              max={new Date(1970, 1, 1, 13, 30)}
              toolbar={false}
              formats={{
                dayFormat: (date) => ["Lun", "Mar", "Mié", "Jue", "Vie"][date.getDay() - 1]
              }}
              dayPropGetter={(date) =>
                date.getDay() === 0 || date.getDay() === 6 ? { style: { display: "none" } } : {}
              }
            />
          </div>

          <button
            onClick={guardarRestricciones}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Guardar restricciones
          </button>
        </>
      )}
    </div>
  );
};

export default RestriccionesForm;
