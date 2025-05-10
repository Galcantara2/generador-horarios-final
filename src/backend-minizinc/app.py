from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import json
from generador_python import generar_horario

app = Flask(__name__)
CORS(app)

@app.route('/generar-horario-general', methods=['POST'])
def generar_horario_general():
    try:
        data = request.get_json()

        docentes = data['docentes']
        asignaciones = data['asignaciones']
        restricciones = data['restricciones']
        horas_curso_grado = data['horas_curso_grado']

        # Generar horario con Python
        horario_generado = generar_horario(docentes, asignaciones, restricciones, horas_curso_grado)

        # Adaptar al formato de salida esperado por el frontend
        resultado = {
            "horario": [
                [
                    [
                        horario_generado.get(dia, {}).get(bloque, {}).get(grado, 0)
                        for grado in range(1, 6)
                    ]
                    for bloque in range(8)
                ]
                for dia in range(5)
            ]
        }

        print("\n\U0001F4C5 Horario generado desde Python:")
        print(json.dumps(resultado, indent=2))

        return jsonify(resultado)

    except Exception as e:
        print("\u274C Excepci\u00f3n general:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
