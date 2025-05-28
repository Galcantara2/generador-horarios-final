import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDocentes } from "../context(CONTROLLER)/DocenteContext";

const bloques = [
  "07:15 - 08:00", "08:00 - 08:45", "08:45 - 09:30", "09:30 - 10:15",
  "10:30 - 11:15", "11:15 - 12:00", "12:00 - 12:45", "12:45 - 13:30"
];

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

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

const HorarioPorDocente = () => {
  const [docenteIdSeleccionado, setDocenteIdSeleccionado] = useState(null);
  const tablaRef = useRef();
  const { docentes, asignaciones, horarioGeneral } = useDocentes();

  const docenteNombre = docentes.find(d => d.id === docenteIdSeleccionado)?.nombre;

  const obtenerCursoAsignado = (cursoId, grado) => {
    const asignacion = asignaciones?.[cursoId]?.[grado];
    return asignacion?.docente_id === docenteIdSeleccionado;
  };

  const handleSeleccion = (e) => {
    const value = parseInt(e.target.value);
    setDocenteIdSeleccionado(value);
  };

  const exportarPDF = async () => {
    const canvas = await html2canvas(tablaRef.current);
    const pdf = new jsPDF("landscape", "pt", "a4");
    const imgData = canvas.toDataURL("image/png");
    const props = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (props.height * pdfWidth) / props.width;
    pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, pdfHeight);
    pdf.save(`Horario_${docenteNombre}.pdf`);
  };

  const exportarExcel = () => {
    const tabla = tablaRef.current;
    const wb = XLSX.utils.table_to_book(tabla, { sheet: "Horario" });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Horario_${docenteNombre}.xlsx`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📅 Horario de Docente</h2>

      <select
        onChange={handleSeleccion}
        className="border rounded p-2 mb-6 w-full"
        defaultValue=""
      >
        <option value="">-- Seleccione un docente --</option>
        {docentes.map((d) => (
          <option key={d.id} value={d.id}>{d.nombre}</option>
        ))}
      </select>

      {docenteIdSeleccionado && horarioGeneral && (
        <>
          <h3 className="text-xl font-semibold mb-4">Horario de {docenteNombre}</h3>
          <div className="flex gap-4 mb-4">
            <button onClick={exportarPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Exportar PDF</button>
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Exportar Excel</button>
          </div>
          <div ref={tablaRef} className="overflow-auto border shadow rounded">
            <table className="w-full text-sm text-center border-collapse border border-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black px-2 py-1">Hora</th>
                  {diasSemana.map((dia, i) => (
                    <th key={i} className="border border-black px-2 py-1">{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloques.map((bloque, bloqueIdx) => (
                  <tr key={bloqueIdx}>
                    <td className="border border-black px-2 py-1 font-medium">{bloque}</td>
                    {diasSemana.map((_, diaIndex) => {
                      let celda = null;
                      for (let gradoIndex = 0; gradoIndex < 5; gradoIndex++) {
                        const grado = gradoIndex + 1;
                        const cursoId = horarioGeneral?.[diaIndex]?.[bloqueIdx]?.[gradoIndex];
                        if (cursoId > 0 && obtenerCursoAsignado(cursoId, grado)) {
                          celda = (
                            <>
                              <div className="font-semibold">{nombresCursos[cursoId]}</div>
                              <div className="text-xs italic">{docenteNombre}</div>
                              <div className="text-xs text-gray-600">Grado: {grado}°</div>
                            </>
                          );
                          break;
                        }
                      }
                      return (
                        <td key={diaIndex} className="border border-black px-2 py-1">
                          {celda}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HorarioPorDocente;
