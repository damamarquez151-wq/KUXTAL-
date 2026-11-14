// app.js — KUXTAL check-in form and results
// Note: identifiers stay in Spanish because the whole team's code shares them.

// Ids of the input fields (must match the HTML)
const CAMPOS = ["presion_sistolica", "presion_diastolica", "frecuencia_cardiaca",
                "temperatura", "glucosa", "sueno", "animo"];

const COLORES = { verde: "#2e7d32", amarillo: "#f9a825", rojo: "#c62828" };
const ETIQUETAS = { verde: "GREEN", amarillo: "YELLOW", rojo: "RED" };
const CLAVE_GUARDADO = "kuxtal_chequeos";

// FALLBACK: ranges from the team's progress report, used only until data/indicadores.json exists
const INDICADORES_RESPALDO = [
  { id: "presion_sistolica", nombre: "Systolic blood pressure", unidad: "mmHg", sistema: "corazon",
    verde: [90, 120], amarillo: [90, 139],
    recomendacion_amarillo: "Rest, reduce salt and measure again tomorrow.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "presion_diastolica", nombre: "Diastolic blood pressure", unidad: "mmHg", sistema: "corazon",
    verde: [60, 80], amarillo: [60, 89],
    recomendacion_amarillo: "Rest, reduce salt and measure again tomorrow.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "frecuencia_cardiaca", nombre: "Heart rate", unidad: "bpm", sistema: "corazon",
    verde: [60, 100], amarillo: [50, 120],
    recomendacion_amarillo: "Rest 10 minutes and measure again.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "temperatura", nombre: "Body temperature", unidad: "°C", sistema: "inmune",
    verde: [36.1, 37.2], amarillo: [35.0, 38.0],
    recomendacion_amarillo: "Hydrate and measure again in 2 hours.",
    recomendacion_rojo: "Possible fever or hypothermia: notify the crew medical officer." },
  { id: "glucosa", nombre: "Blood sugar", unidad: "mg/dL", sistema: "nutricion",
    verde: [70, 110], amarillo: [70, 140],
    recomendacion_amarillo: "Review your last meal and measure again before eating.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "sueno", nombre: "Sleep", unidad: "h", sistema: "sueno",
    verde: [7, 9], amarillo: [5, 12],
    recomendacion_amarillo: "Keep a regular sleep schedule tonight.",
    recomendacion_rojo: "Reduce workload and rest." },
  { id: "animo", nombre: "Mood", unidad: "/10", sistema: "mente",
    verde: [7, 10], amarillo: [5, 6],
    recomendacion_amarillo: "Take a break and talk with your crew.",
    recomendacion_rojo: "Schedule a talk with the psychological support team." }
];

let indicadores = [];

// 1. Load the ranges (from data/indicadores.json, or the fallback)
async function cargarIndicadores() {
  try {
    const respuesta = await fetch("data/indicadores.json");
    if (!respuesta.ok) throw new Error("File not found yet");
    indicadores = await respuesta.json();
    console.log("Indicators loaded from data/indicadores.json");
  } catch (error) {
    indicadores = INDICADORES_RESPALDO;
    console.warn("Using fallback indicators (temporary)");
  }
}

// Possible values for a human; anything outside is most likely a typing error
const LIMITES = {
  presion_sistolica: [50, 250], presion_diastolica: [30, 150],
  frecuencia_cardiaca: [20, 250], temperatura: [30, 45],
  glucosa: [20, 600], sueno: [0, 24], animo: [0, 10]
};

// Which crew member is selected (if there is no list, "A")
function tripulanteActual() {
  const selector = document.getElementById("crew-select");
  return selector && selector.value ? selector.value : "A";
}

// Readable name of a field, for error messages
function nombreDeCampo(campo) {
  const ind = indicadores.find(i => i.id === campo);
  return ind ? ind.nombre : campo;
}

// 2. Read what the astronaut entered (and check that it makes sense)
function leerFormulario() {
    const ahora = new Date();
  const chequeo = { tripulante: tripulanteActual(), fecha: ahora.toISOString().slice(0, 10),
                    hora: ahora.toTimeString().slice(0, 5) };
  const errores = [];
  for (const campo of CAMPOS) {
    const caja = document.getElementById(campo);
    if (!caja || caja.value === "") continue;
    const numero = Number(caja.value);
    const limite = LIMITES[campo];
    if (!Number.isFinite(numero) || numero < limite[0] || numero > limite[1]) {
      errores.push(campo);
    } else {
      chequeo[campo] = numero;
    }
  }
  return { chequeo: chequeo, errores: errores };
}

// 3. Save and read check-ins in the browser (works offline)
function obtenerChequeos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO)) || [];
  } catch (e) {
    return [];
  }
}

function guardarChequeo(chequeo) {
  const lista = obtenerChequeos();
  lista.push(chequeo);
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(lista));
  } catch (e) {
    console.warn("Could not save the check-in", e);
  }
}

// 4. Show the traffic light on the page
function mostrarResultados(resultados) {
  const contenedor = document.getElementById("resultados");
  if (!contenedor) return;

  if (resultados.length === 0) {
    contenedor.innerHTML = "<p>Please enter at least one value.</p>";
    return;
  }

  let html = "<h2>Result</h2>";
  html += "<p><strong>Action:</strong> " + nivelDeAccion(resultados) + "</p>";
  html += '<ul style="list-style:none; padding:0">';
  for (const r of resultados) {
    html += '<li style="margin:8px 0; padding:8px; border-left:8px solid ' + COLORES[r.color] + '">'
         + "<strong>" + r.nombre + ":</strong> " + r.valor + " " + r.unidad
         + ' — <span style="color:' + COLORES[r.color] + '; font-weight:bold">' + ETIQUETAS[r.color] + "</span>"
         + "<br>" + r.recomendacion
         + (r.url_nasa && r.color !== "verde"
             ? '<br><small>Why it matters: ' + (r.por_que || "") + ' <a href="' + r.url_nasa
               + '" target="_blank" rel="noopener" style="color:#64b5f6; text-decoration:underline">NASA HRP: '
               + r.riesgo_nasa + "</a></small>"
             : "")
         + "</li>";
  }
  html += "</ul>";
  contenedor.innerHTML = html;
}

// 5. What happens when "Evaluate" is clicked
function evaluar() {
  const lectura = leerFormulario();
  if (lectura.errores.length > 0) {
    document.getElementById("resultados").innerHTML =
      '<p style="color:#c62828"><strong>Please check these values:</strong> '
      + lectura.errores.map(nombreDeCampo).join(", ") + "</p>";
    return;
  }
  const chequeo = lectura.chequeo;
  const resultados = evaluarChequeo(chequeo, indicadores);
  mostrarResultados(resultados);
  if (resultados.length > 0) guardarChequeo(chequeo);
  if (typeof actualizarGrafica === "function") actualizarGrafica();

  // Notify the rest of the page (body map, cards, status)
  document.dispatchEvent(new CustomEvent("kuxtal-evaluado", {
    detail: { resultados: resultados, porSistema: estadoPorSistema(resultados) }
  }));
}

// Start-up
document.addEventListener("DOMContentLoaded", async () => {
  await cargarIndicadores();
  const boton = document.getElementById("btn-evaluar");
  if (boton) boton.addEventListener("click", evaluar);
  if (typeof iniciarGraficas === "function") await iniciarGraficas();
});
