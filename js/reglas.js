// reglas.js — KUXTAL rules engine (traffic light)
// Decides whether each health value is green ("verde"), yellow ("amarillo") or red ("rojo").
// Note: identifiers stay in Spanish because the whole team's code shares them.

// How serious each color is (used to know which color "wins")
const GRAVEDAD = { verde: 0, amarillo: 1, rojo: 2 };

// Is the value inside the range [min, max]?
function dentroDe(valor, rango) {
  return valor >= rango[0] && valor <= rango[1];
}

// Classifies ONE value using the rule of ONE indicator
function clasificar(valor, indicador) {
  if (dentroDe(valor, indicador.verde)) {
    return "verde";
  } else if (dentroDe(valor, indicador.amarillo)) {
    return "amarillo";
  } else {
    return "rojo";
  }
}

// Evaluates a full check-in and returns a list of results
function evaluarChequeo(chequeo, indicadores) {
  const resultados = [];
  for (const ind of indicadores) {
    const valor = chequeo[ind.id];
    if (valor === undefined || valor === null || valor === "") continue; // not entered

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
      fuente: ind.fuente,
      por_que: ind.por_que,          // why it matters (NASA HRP)
      riesgo_nasa: ind.riesgo_nasa,  // NASA HRP risk name
      url_nasa: ind.url_nasa         // link to the NASA HRP risk page
    });
  }
  return resultados;
}

// For the body map: each body system takes the WORST color among its indicators
function estadoPorSistema(resultados) {
  const estado = {};
  for (const r of resultados) {
    const actual = estado[r.sistema];
    if (actual === undefined || GRAVEDAD[r.color] > GRAVEDAD[actual]) {
      estado[r.sistema] = r.color;
    }
  }
  return estado; // example: { corazon: "amarillo", sueno: "rojo" }
}

// Who to notify, based on how many red and yellow results there are.
// With 2 or more reds, the advice depends on the mission environment (environment.js),
// because on Mars the ground team can take up to 44 minutes to answer.
function nivelDeAccion(resultados) {
  const rojos = resultados.filter(r => r.color === "rojo").length;
  const amarillos = resultados.filter(r => r.color === "amarillo").length;

  if (rojos >= 2) {
    if (typeof Environment !== "undefined") return Environment.current().escalation;
    return "Contact flight surgeons on Earth";
  }
  if (rojos === 1) return "Notify the crew medical officer";
  if (amarillos > 0) return "Self-care: follow the recommendations and measure again";
  return "No action needed";
}
