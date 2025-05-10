import json

def dividir_horas(horas):
    if horas == 4:
        return [[2, 2]]
    elif horas == 5:
        return [[2, 3], [3, 2]]
    elif horas == 6:
        return [[3, 3], [2, 2, 2]]
    elif horas == 7:
        return [[3, 4], [4, 3], [2, 2, 3], [2, 3, 2]]
    elif horas == 8:
        return [[4, 4], [3, 3, 2]]
    elif horas == 9:
        return [[3, 3, 3], [4, 3, 2]]
    elif horas == 10:
        return [[5, 5], [4, 3, 3]]
    else:
        return [[horas]]

def generar_horario(docentes, asignaciones, restricciones, horas_curso_grado):
    NUM_DIAS = 5
    NUM_BLOQUES = 8
    dias = ["lunes", "martes", "miércoles", "jueves", "viernes"]

    horario = {dia: {bloque: {} for bloque in range(NUM_BLOQUES)} for dia in range(NUM_DIAS)}
    bloques_ocupados = {docente["id"]: set() for docente in docentes}

    intentos_fallidos = 0

    for curso_id, grados_dict in asignaciones.items():
        for grado_str, asignacion in grados_dict.items():
            grado = int(grado_str)
            docente_id = asignacion["docente_id"]
            horas_necesarias = horas_curso_grado.get(str(curso_id), {}).get(str(grado), 0)
            if horas_necesarias == 0:
                continue

            bloques_por_dia = dividir_horas(horas_necesarias)
            asignado_total = False

            for bloques_combo in bloques_por_dia:
                usado_dias = set()
                bloques_asignados = 0
                temp_asignaciones = []

                for cantidad in bloques_combo:
                    asignado = False
                    for dia_index, dia_nombre in enumerate(dias):
                        if dia_index in usado_dias:
                            continue

                        bloques_disponibles = []
                        for bloque in range(NUM_BLOQUES):
                            clave = f"{dia_nombre}-{bloque}"
                            if restricciones.get(str(docente_id), {}).get(clave, False) and \
                               (dia_index, bloque) not in bloques_ocupados[docente_id] and \
                               grado not in horario[dia_index][bloque]:
                                bloques_disponibles.append(bloque)

                        bloques_disponibles.sort()
                        for i in range(len(bloques_disponibles) - cantidad + 1):
                            consecutivos = bloques_disponibles[i:i + cantidad]
                            if consecutivos[-1] - consecutivos[0] == cantidad - 1:
                                for b in consecutivos:
                                    temp_asignaciones.append((dia_index, b))
                                usado_dias.add(dia_index)
                                asignado = True
                                break
                        if asignado:
                            break

                    if not asignado:
                        break  # falló este combo

                # Verificamos si logramos asignar todas las horas
                if len(temp_asignaciones) == horas_necesarias:
                    for dia_index, b in temp_asignaciones:
                        horario[dia_index][b][grado] = int(curso_id)
                        bloques_ocupados[docente_id].add((dia_index, b))
                    asignado_total = True
                    break

            if not asignado_total:
                intentos_fallidos += 1
                print(f"⚠️ No se pudo asignar completamente: curso {curso_id}, grado {grado}")

    print(f"✅ Asignación completada. Cursos no asignados completamente: {intentos_fallidos}")
    return horario
