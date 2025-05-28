from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from generador_python import generar_horario
# from solver_hibrido import llamar_minizinc_chuffed  # Comentado temporalmente

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

        # Generar horario con algoritmo Python
        resultado_python = generar_horario(docentes, asignaciones, restricciones, horas_curso_grado)
        horario = resultado_python.get("horario", {})

        # Contar bloques asignados
        total_asignados = sum(
            1
            for dia in horario.values()
            for bloque in dia.values()
            for curso in bloque.values()
            if isinstance(curso, int) and curso > 0
        )

        print(f"🔢 Total de bloques asignados por Python: {total_asignados}")
        print("🟡 Modo presentación: MiniZinc + Chuffed está desactivado temporalmente.")

        # Comentado: no se usa MiniZinc
        # if total_asignados < 195:
        #     print("⚠ Python no asignó los 195 bloques. Usando MiniZinc + Chuffed como refuerzo...")
        #     resultado_chuffed = llamar_minizinc_chuffed(data)
        #     return jsonify(resultado_chuffed)

        # Formatear para frontend (lista tridimensional)
        resultado = {
            "horario": [
                [
                    [
                        horario.get(dia, {}).get(bloque, {}).get(grado, 0)
                        for grado in range(1, 6)
                    ]
                    for bloque in range(8)
                ]
                for dia in range(5)
            ]
        }

        print("\n📅 Horario generado desde Python:")
        print(json.dumps(resultado, indent=2))
        return jsonify(resultado)

    except Exception as e:
        print("❌ Excepción general:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
