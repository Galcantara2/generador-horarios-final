import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDocentes } from "../context/DocenteContext";
import { enviarDznAlServidor } from "../services/horarioService";

const bloques = [
  "07:15 - 08:00", "08:00 - 08:45", "08:45 - 09:30", "09:30 - 10:15",
  "10:30 - 11:15", "11:15 - 12:00", "12:00 - 12:45", "12:45 - 13:30"
];

const grados = ["1°", "2°", "3°", "4°", "5°"];

const nombresCursos = {
  1: "Matemática",
  2: "Comunicación",
  3: "Arte",
  4: "Tutoría",
  5: "Inglés",
  6: "Ciencia y tecnología",
  7: "Ciencias sociales",
  8: "Desarrollo personal",
  9: "Ed. Física",
  10: "Ed. trabajo",
  11: "Religión"
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
  return !horario?.some(dia =>
    dia.some(bloque =>
      bloque.some(curso => curso > 0)
    )
  );
};

const HorarioTable = () => {
  const tablaRef = useRef();
  const [horario, setHorario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { docentes, restricciones, asignaciones, horasCursos } = useDocentes();

  const cursosOrdenados = Object.keys(asignaciones || {});

  const obtenerNombreDocente = (cursoId, gradoIndex) => {
    const gradoId = gradoIndex + 1;
    const asignacion = asignaciones?.[cursoId]?.[gradoId];
    if (!asignacion || !asignacion.docente_id) return "";
    const docente = docentes.find(d => d.id === asignacion.docente_id);
    return docente ? docente.nombre : "";
  };

  const exportarPDF = async () => {
    const canvas = await html2canvas(tablaRef.current);
    const pdf = new jsPDF("landscape", "pt", "a4");
    const imgData = canvas.toDataURL("image/png");
    const props = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (props.height * pdfWidth) / props.width;
    pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, pdfHeight);
    pdf.save("HorarioGeneral.pdf");
  };

  const exportarExcel = () => {
    const tabla = tablaRef.current;
    const wb = XLSX.utils.table_to_book(tabla, { sheet: "Horario" });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "HorarioGeneral.xlsx");
  };

  const generarHorario = async () => {
    setCargando(true);
    try {
      if (!docentes.length) throw new Error("No hay docentes registrados");

      const resultado = await enviarDznAlServidor(
        docentes,
        asignaciones,
        restricciones,
        horasCursos
      );

      if (!resultado || !resultado.horario || esHorarioVacio(resultado.horario)) {
        throw new Error("❌ MiniZinc no encontró una asignación válida (resultado vacío).");
      }

      setHorario(resultado.horario);
    } catch (err) {
      alert("❌ Error al generar el horario: " + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🧱️ Generar Horario Escolar</h2>
        <button
          onClick={generarHorario}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded shadow"
        >
          📅 Generar horario
        </button>
      </div>

      {cargando && <p className="text-gray-600">Generando horario, por favor espere...</p>}

      {horario && (
        <>
          <div className="flex gap-4 mb-4">
            <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Exportar PDF</button>
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          </div>

          <div ref={tablaRef}>
            {horario.map((bloquesDia, diaIndex) => (
              <div key={diaIndex}>
                <h2 className="text-xl font-bold mb-2">{["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][diaIndex]}</h2>
                <div className="overflow-auto border shadow rounded mb-6">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-2 py-1">Hora</th>
                        {grados.map((grado) => (
                          <th key={grado} className="border px-2 py-1">{grado}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bloques.map((horaLabel, bloqueIndex) => (
                        <tr key={bloqueIndex}>
                          <td className="border px-2 py-1 font-medium">{horaLabel}</td>
                          {grados.map((_, gradoIndex) => {
                            const cursoId = bloquesDia?.[bloqueIndex]?.[gradoIndex] || 0;
                            const cursoIdReal = parseInt(cursosOrdenados[cursoId - 1]);
                            const cursoNombre = nombresCursos[cursoIdReal] || "";
                            const docenteNombre = cursoId > 0 ? obtenerNombreDocente(cursoIdReal, gradoIndex) : "";

                            return (
                              <td key={gradoIndex} className={`border px-2 py-1 ${getColorPorDocente(docenteNombre)}`}>
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
        </>
      )}
    </div>
  );
};

export default HorarioTable;
