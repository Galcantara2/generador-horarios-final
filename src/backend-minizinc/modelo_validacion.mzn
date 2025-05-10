int: NUM_DIAS = 5;
int: NUM_BLOQUES = 8;
int: NUM_GRADOS;
int: NUM_CURSOS;
int: NUM_DOCENTES;

set of int: DIAS = 1..NUM_DIAS;
set of int: BLOQUES = 1..NUM_BLOQUES;
set of int: GRADOS = 1..NUM_GRADOS;
set of int: CURSOS = 1..NUM_CURSOS;
set of int: DOCENTES = 1..NUM_DOCENTES;

array[DIAS, BLOQUES, GRADOS] of var 0..NUM_CURSOS: horario;
array[CURSOS, GRADOS] of int: docente_asignado;
array[CURSOS, GRADOS] of int: horas_curso_grado;
array[DOCENTES, DIAS, BLOQUES] of bool: disponible;

% 🚫 No más de una clase por docente al mismo tiempo
constraint forall(d in DIAS, b in BLOQUES, prof in DOCENTES)(
  sum(g in GRADOS)(
    let { var int: c = horario[d,b,g] } in
      bool2int(c > 0 /\ docente_asignado[c,g] = prof)
  ) <= 1
);

% ✅ El docente debe estar disponible
constraint forall(d in DIAS, b in BLOQUES, g in GRADOS)(
  let { var int: c = horario[d,b,g] } in
    c = 0 \/ disponible[docente_asignado[c,g], d, b]
);

% ⏱️ Respetar carga horaria por curso y grado
constraint forall(c in CURSOS, g in GRADOS)(
  sum(d in DIAS, b in BLOQUES)(
    bool2int(horario[d,b,g] = c)
  ) = horas_curso_grado[c,g]
);

% 📏 Dividir bien según cantidad de horas
constraint forall(c in CURSOS, g in GRADOS)(
  let {
    int: h = horas_curso_grado[c,g]
  } in
    if h = 4 then
      exists(d1 in DIAS, d2 in DIAS where d1 != d2)(
        let {
          int: b1 = sum(b in BLOQUES)(bool2int(horario[d1,b,g] = c)),
          int: b2 = sum(b in BLOQUES)(bool2int(horario[d2,b,g] = c))
        } in
          b1 = 2 /\ b2 = 2
      )
    else if h = 5 then
      exists(d1 in DIAS, d2 in DIAS where d1 != d2)(
        let {
          int: b1 = sum(b in BLOQUES)(bool2int(horario[d1,b,g] = c)),
          int: b2 = sum(b in BLOQUES)(bool2int(horario[d2,b,g] = c))
        } in
          (b1 = 2 /\ b2 = 3) \/ (b1 = 3 /\ b2 = 2)
      )
    else if h = 6 then
      exists(d1 in DIAS, d2 in DIAS where d1 != d2)(
        let {
          int: b1 = sum(b in BLOQUES)(bool2int(horario[d1,b,g] = c)),
          int: b2 = sum(b in BLOQUES)(bool2int(horario[d2,b,g] = c))
        } in
          (b1 = 3 /\ b2 = 3) \/ 
          (exists(d3 in DIAS where d3 != d1 /\ d3 != d2)(
            let {
              int: b3 = sum(b in BLOQUES)(bool2int(horario[d3,b,g] = c))
            } in
              b1 = 2 /\ b2 = 2 /\ b3 = 2
          ))
      )
    else if h = 7 then
      exists(d1 in DIAS, d2 in DIAS where d1 != d2)(
        let {
          int: b1 = sum(b in BLOQUES)(bool2int(horario[d1,b,g] = c)),
          int: b2 = sum(b in BLOQUES)(bool2int(horario[d2,b,g] = c))
        } in
          (b1 = 3 /\ b2 = 4) \/ (b1 = 4 /\ b2 = 3) \/
          (exists(d3 in DIAS where d3 != d1 /\ d3 != d2)(
            let {
              int: b3 = sum(b in BLOQUES)(bool2int(horario[d3,b,g] = c))
            } in
              (b1 = 2 /\ b2 = 2 /\ b3 = 3) \/ (b1 = 2 /\ b2 = 3 /\ b3 = 2)
          ))
      )
    else
      true
);

% 🎯 Maximizar bloques asignados
var int: total_asignado = sum(d in DIAS, b in BLOQUES, g in GRADOS)(
  bool2int(horario[d,b,g] > 0)
);
solve maximize total_asignado;

output ["{\"horario\": ", show(horario), "}"];
