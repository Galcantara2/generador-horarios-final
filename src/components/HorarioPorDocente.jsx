import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDocentes } from "../context/DocenteContext";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const bloques = [
  "07:15 - 08:00",
  "08:00 - 08:45",
  "08:45 - 09:30",
  "09:30 - 10:15",
  "10:30 - 11:15",
  "11:15 - 12:00",
  "12:00 - 12:45",
  "12:45 - 13:30"
];

const HorarioPorDocente = () => {
  const { docentes } = useDocentes();
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("");
  const tablaRef = useRef();

  const docente = docentes.find((d) => d.nombre === docenteSeleccionado);

  // Construir horario estimado
  const horario = {};
  if (docente) {
    let bloqueIndex = 0;
    docente.materias.forEach((materia) => {
      Object.entries(materia.horasPorGrado).forEach(([grado, horas]) => {
        for (let h = 0; h < horas; h++) {
          const dia = dias[Math.floor(bloqueIndex / bloques.length) % dias.length];
          const bloque = bloqueIndex % bloques.length;
          if (!horario[dia]) horario[dia] = {};
          horario[dia][bloque] = `${materia.nombre} (${grado})`;
          bloqueIndex++;
        }
      });
    });
  }

  const exportarPDF = async () => {
    const canvas = await html2canvas(tablaRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "pt", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 20, 20, pdfWidth - 40, pdfHeight);
    pdf.save(`Horario_${docenteSeleccionado}.pdf`);
  };

  const exportarExcel = () => {
    const tabla = tablaRef.current;
    const wb = XLSX.utils.table_to_book(tabla, { sheet: "Horario" });
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Horario_${docenteSeleccionado}.xlsx`);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Horario por Docente</h2>

      <select
        value={docenteSeleccionado}
        onChange={(e) => setDocenteSeleccionado(e.target.value)}
        className="border px-3 py-2 mb-6 rounded w-full"
      >
        <option value="">-- Seleccione un docente --</option>
        {docentes.map((d) => (
          <option key={d.nombre} value={d.nombre}>
            {d.nombre}
          </option>
        ))}
      </select>

      {docenteSeleccionado && (
        <>
          <div className="flex gap-4 mb-4">
            <button
              onClick={exportarPDF}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Exportar PDF
            </button>
            <button
              onClick={exportarExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Exportar Excel
            </button>
          </div>

          <div className="overflow-auto border rounded shadow" ref={tablaRef}>
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Hora</th>
                  {dias.map((dia) => (
                    <th key={dia} className="border px-2 py-1">
                      {dia}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloques.map((bloque, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 font-medium">{bloque}</td>
                    {dias.map((dia) => (
                      <td key={dia} className="border px-2 py-1">
                        {horario[dia]?.[i] || ""}
                      </td>
                    ))}
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
