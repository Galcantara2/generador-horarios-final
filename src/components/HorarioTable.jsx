import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDocentes } from "../context(CONTROLLER)/DocenteContext";
import { enviarDznAlServidor } from "../services/horarioService";
import Breadcrumbs from "../components/Breadcrumbs";

const bloques = [
  "07:15 - 08:00", "08:00 - 08:45", "08:45 - 09:30", "09:30 - 10:15",
  "10:30 - 11:15", "11:15 - 12:00", "12:00 - 12:45", "12:45 - 13:30"
];

const nombresCursos = {
  1: "Matemática", 2: "Comunicación", 3: "Arte", 4: "Tutoría", 5: "Inglés",
  6: "Ciencia y tecnología", 7: "Ciencias sociales", 8: "Desarrollo personal",
  9: "Ed. Física", 10: "Ed. trabajo", 11: "Religión"
};

const getColorPorDocente = (nombreDocente) => {
  const mapa = {
    "Javier Delgado": "bg-yellow-300",
    "Omar Alcántara": "bg-blue-700 text-white",
    "César Alcalde": "bg-red-600 text-white",
    "Elmerí Salinas": "bg-green-700 text-white",
    "Kevin": "bg-yellow-200",
    "Jhon": "bg-cyan-300",
    "Rolando": "bg-amber-700 text-white",
    "Padre Otto": "bg-purple-700 text-white"
  };
  return mapa[nombreDocente] || "bg-gray-200";
};

const esHorarioVacio = (horario) => {
  return !horario?.some(dia => dia.some(bloque => bloque.some(curso => curso > 0)));
};

const HorarioTable = () => {
  const [historial, setHistorial] = useState(() => {
    const almacenado = localStorage.getItem("historialHorarios");
    return almacenado ? JSON.parse(almacenado) : [];
  });
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const [cargando, setCargando] = useState(false);
  const { docentes, restricciones, asignaciones, horasCursos, setHorarioGeneral } = useDocentes();
  const location = useLocation();
  const nivel = new URLSearchParams(location.search).get("nivel") || "Secundaria";

  const grados = nivel === "Primaria" ? ["1°", "2°", "3°", "4°", "5°", "6°"] : ["1°", "2°", "3°", "4°", "5°"];
  const cursosOrdenados = Object.keys(asignaciones || {});

  const obtenerNombreDocente = (cursoId, gradoIndex) => {
    const gradoId = gradoIndex + 1 + (nivel === "Primaria" ? 5 : 0);
    const asignacion = asignaciones?.[cursoId]?.[gradoId];
    if (!asignacion || !asignacion.docente_id) return "";
    const docente = docentes.find(d => d.id === asignacion.docente_id);
    return docente ? docente.nombre : "";
  };

  const exportarPDF = async () => {
    const pdf = new jsPDF("landscape", "pt", "a4");
    for (let diaIndex = 0; diaIndex < 5; diaIndex++) {
      const diaElement = document.getElementById(`dia-${diaIndex}`);
      if (!diaElement) continue;
      const canvas = await html2canvas(diaElement);
      const imgData = canvas.toDataURL("image/png");
      const props = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (props.height * pdfWidth) / props.width;
      if (diaIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, pdfHeight);
    }
    pdf.save(`Horario_${nivel}.pdf`);
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const horario = historial[indiceSeleccionado];
    horario.forEach((bloquesDia, diaIndex) => {
      const sheetData = [["Hora", ...grados]];
      bloques.forEach((hora, bloqueIndex) => {
        const fila = [hora];
        grados.forEach((_, gradoIndex) => {
          const cursoId = bloquesDia?.[bloqueIndex]?.[gradoIndex] || 0;
          const cursoIdReal = parseInt(cursosOrdenados[cursoId - 1]);
          const cursoNombre = nombresCursos[cursoIdReal] || "";
          const docenteNombre = cursoId > 0 ? obtenerNombreDocente(cursoIdReal, gradoIndex) : "";
          fila.push(cursoNombre ? `${cursoNombre} - ${docenteNombre}` : "");
        });
        sheetData.push(fila);
      });
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][diaIndex]);
    });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Horario_${nivel}.xlsx`);
  };

  const generarHorario = async () => {
    setCargando(true);
    try {
      const docentesFiltrados = docentes.filter(d => d.nivel === nivel);
      const asignacionesFiltradas = Object.fromEntries(
        Object.entries(asignaciones).map(([cursoId, gradosObj]) => [
          cursoId,
          Object.fromEntries(
            Object.entries(gradosObj).filter(([gradoId]) => {
              const g = parseInt(gradoId);
              return nivel === "Primaria" ? g >= 6 : g <= 5;
            })
          )
        ])
      );

      console.log("📤 Datos que se enviarán:", {
        docentes: docentesFiltrados,
        asignaciones: asignacionesFiltradas,
        restricciones,
        horas_curso_grado: horasCursos,
        nivel
      });

      const resultado = await enviarDznAlServidor(
        docentesFiltrados,
        asignacionesFiltradas,
        restricciones,
        horasCursos,
        nivel
      );

      if (!resultado || !resultado.horario || esHorarioVacio(resultado.horario)) {
        throw new Error("❌ MiniZinc no encontró una asignación válida.");
      }

      const nuevoHistorial = [...historial, resultado.horario];
      if (nuevoHistorial.length > 3) nuevoHistorial.shift();

      localStorage.setItem("historialHorarios", JSON.stringify(nuevoHistorial));
      setHistorial(nuevoHistorial);
      setIndiceSeleccionado(nuevoHistorial.length - 1);
      setHorarioGeneral(resultado.horario);
    } catch (err) {
      alert("❌ Error al generar el horario: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  const horarioSeleccionado = historial[indiceSeleccionado];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <Breadcrumbs />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🧱️ Generar Horario Escolar - {nivel}</h2>
        <button
          onClick={generarHorario}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded shadow"
        >
          📅 Generar horario
        </button>
      </div>

      {cargando && <p className="text-gray-600">Generando horario, por favor espere...</p>}

      {historial.length > 0 && (
        <div className="flex items-center gap-4">
          <label>Horario generado:</label>
          <select
            className="border px-2 py-1"
            value={indiceSeleccionado}
            onChange={(e) => setIndiceSeleccionado(Number(e.target.value))}
          >
            {historial.map((_, i) => (
              <option key={i} value={i}>Horario #{i + 1}</option>
            ))}
          </select>
          <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Exportar PDF</button>
          <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
        </div>
      )}

      {horarioSeleccionado && horarioSeleccionado.map((bloquesDia, diaIndex) => (
        <div key={diaIndex} id={`dia-${diaIndex}`} className="mb-4">
          <h4 className="text-xl font-bold mb-2">{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][diaIndex]}</h4>
          <div className="overflow-auto border shadow rounded">
            <table className="w-full text-sm text-center border-collapse border border-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black px-2 py-1">Hora</th>
                  {grados.map((grado) => (
                    <th key={grado} className="border border-black px-2 py-1">{grado}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloques.map((horaLabel, bloqueIndex) => (
                  <tr key={bloqueIndex}>
                    <td className="border border-black px-2 py-1 font-medium">{horaLabel}</td>
                    {grados.map((_, gradoIndex) => {
                      const cursoId = bloquesDia?.[bloqueIndex]?.[gradoIndex] || 0;
                      const cursoIdReal = parseInt(cursosOrdenados[cursoId - 1]);
                      const cursoNombre = nombresCursos[cursoIdReal] || "";
                      const docenteNombre = cursoId > 0 ? obtenerNombreDocente(cursoIdReal, gradoIndex) : "";
                      return (
                        <td key={gradoIndex} className={`border border-black px-2 py-1 ${getColorPorDocente(docenteNombre)}`}>
                          <div className="font-semibold">{cursoNombre}</div>
                          <div className="text-xs italic">{docenteNombre}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HorarioTable;
