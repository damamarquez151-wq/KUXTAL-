// reglas.js — Motor de reglas (semáforo) de KUXTAL
// Decide si cada valor es verde, amarillo o rojo.

// Qué tan grave es cada color (sirve para saber cuál "gana")
const GRAVEDAD = { verde: 0, amarillo: 1, rojo: 2 };

// ¿El valor está dentro del rango [mínimo, máximo]?
function dentroDe(valor, rango) {
  return valor >= rango[0] && valor <= rango[1];
}

// Clasifica UN valor con la regla de UN indicador
function clasificar(valor, indicador) {
  if (dentroDe(valor, indicador.verde)) {
    return "verde";
  } else if (dentroDe(valor, indicador.amarillo)) {
    return "amarillo";
  } else {
    return "rojo";
  }
}

// Evalúa un chequeo completo y regresa una lista de resultados
function evaluarChequeo(chequeo, indicadores) {
  const resultados = [];
  for (const ind of indicadores) {
    const valor = chequeo[ind.id];
    if (valor === undefined || valor === null || valor === "") continue; // no se capturó

    const numero = Number(valor);
    const color = clasificar(numero, ind);

    let recomendacion = "All good. Keep your routine.";
    if (color === "amarillo") recomendacion = ind.recomendacion_amarillo;
    if (color === "rojo") recomendacion = ind.recomendacion_rojo;

    resultados.push({
      id: ind.id,
      nombre: ind.nombre,
      valor: numero,
      unidad: ind.unidad,
      sistema: ind.sistema,
      color: color,
      recomendacion: recomendacion,
      fuente: ind.fuente
    });
  }
  return resultados;
}

// Para el mapa del cuerpo de Carlos: cada sistema toma el PEOR color de sus indicadores
function estadoPorSistema(resultados) {
  const estado = {};
  for (const r of resultados) {
    const actual = estado[r.sistema];
    if (actual === undefined || GRAVEDAD[r.color] > GRAVEDAD[actual]) {
      estado[r.sistema] = r.color;
    }
  }
  return estado; // ejemplo: { corazon: "amarillo", sueno: "rojo" }
}

// A quién avisar, según cuántos rojos y amarillos hay
function nivelDeAccion(resultados) {
  const rojos = resultados.filter(r => r.color === "rojo").length;
  const amarillos = resultados.filter(r => r.color === "amarillo").length;

  if (rojos >= 2) return "Contact flight surgeons on Earth";
  if (rojos === 1) return "Notify the crew medical officer";
  if (amarillos > 0) return "Self-care: follow the recommendations and measure again";
  return "No action needed";
}