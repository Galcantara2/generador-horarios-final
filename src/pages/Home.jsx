import { useState } from "react";
import { Link } from "react-router-dom";
import SelectorNivel from "../components (VIEWS)/SelectorNivel";

const Home = () => {
  const [nivelSeleccionado, setNivelSeleccionado] = useState("Secundaria");

  return (
    <div className="p-6 text-center space-y-6">
      <h1 className="text-3xl font-bold text-blue-800">Bienvenido al Generador de Horarios</h1>
      <p className="text-lg text-gray-700">Selecciona un nivel y una sección para continuar:</p>

      <SelectorNivel
        nivelSeleccionado={nivelSeleccionado}
        setNivelSeleccionado={setNivelSeleccionado}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">
        <Link
          to={`/docentes?nivel=${nivelSeleccionado}`}
          className="bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 shadow"
        >
          📋 Registrar Docentes
        </Link>

        {nivelSeleccionado === "Secundaria" && (
          <Link
            to={`/restricciones?nivel=${nivelSeleccionado}`}
            className="bg-red-600 text-white py-3 px-4 rounded hover:bg-red-700 shadow"
          >
            🚫 Restricciones
          </Link>
        )}

        <Link
          to={`/franjas?nivel=${nivelSeleccionado}`}
          className="bg-yellow-500 text-white py-3 px-4 rounded hover:bg-yellow-600 shadow"
        >
          🕒 Franjas Horarias
        </Link>

        <Link
          to={`/asignacion?nivel=${nivelSeleccionado}`}
          className="bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 shadow"
        >
          📘 Asignar Materias
        </Link>

        <Link
          to={`/horario?nivel=${nivelSeleccionado}`}
          className="bg-purple-600 text-white py-3 px-4 rounded hover:bg-purple-700 shadow"
        >
          📅 Horario General
        </Link>

        <Link
          to={`/horario-docente?nivel=${nivelSeleccionado}`}
          className="bg-indigo-600 text-white py-3 px-4 rounded hover:bg-indigo-700 shadow"
        >
          👤 Horario por Docente
        </Link>
      </div>
    </div>
  );
};

export default Home;
