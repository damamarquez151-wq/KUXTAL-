// app.js — Formulario de chequeo y resultados de KUXTAL (Lili)

// Los id de las cajas de texto (deben ser iguales en el HTML)
const CAMPOS = ["presion_sistolica", "presion_diastolica", "frecuencia_cardiaca",
                "temperatura", "glucosa", "sueno", "animo"];

const COLORES = { verde: "#2e7d32", amarillo: "#f9a825", rojo: "#c62828" };
const ETIQUETAS = { verde: "GREEN", amarillo: "YELLOW", rojo: "RED" };
const CLAVE_GUARDADO = "kuxtal_chequeos";

// TEMPORAL: solo se usa mientras Jaret no suba data/indicadores.json
// Rangos ilustrativos; los reales los documenta Jaret con fuentes NASA
const INDICADORES_RESPALDO = [
  { id: "presion_sistolica", nombre: "Systolic blood pressure", unidad: "mmHg", sistema: "corazon",
    verde: [90, 119], amarillo: [80, 139],
    recomendacion_amarillo: "Rest, reduce salt and measure again tomorrow.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "presion_diastolica", nombre: "Diastolic blood pressure", unidad: "mmHg", sistema: "corazon",
    verde: [60, 79], amarillo: [50, 89],
    recomendacion_amarillo: "Rest, reduce salt and measure again tomorrow.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "frecuencia_cardiaca", nombre: "Heart rate", unidad: "bpm", sistema: "corazon",
    verde: [60, 100], amarillo: [50, 120],
    recomendacion_amarillo: "Rest 10 minutes and measure again.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "temperatura", nombre: "Body temperature", unidad: "°C", sistema: "inmune",
    verde: [36.1, 37.2], amarillo: [35.5, 37.9],
    recomendacion_amarillo: "Hydrate and measure again in 2 hours.",
    recomendacion_rojo: "Possible fever: notify the crew medical officer." },
  { id: "glucosa", nombre: "Blood sugar", unidad: "mg/dL", sistema: "nutricion",
    verde: [70, 99], amarillo: [60, 125],
    recomendacion_amarillo: "Review your last meal and measure again before eating.",
    recomendacion_rojo: "Notify the crew medical officer." },
  { id: "sueno", nombre: "Sleep", unidad: "h", sistema: "sueno",
    verde: [7, 12], amarillo: [5, 6.99],
    recomendacion_amarillo: "Keep a regular sleep schedule tonight.",
    recomendacion_rojo: "Reduce workload and rest." },
  { id: "animo", nombre: "Mood", unidad: "1-5", sistema: "mente",
    verde: [4, 5], amarillo: [3, 3],
    recomendacion_amarillo: "Take a break and talk with your crew.",
    recomendacion_rojo: "Schedule a talk with the psychological support team." }
];

let indicadores = [];

// 1. Cargar los rangos (de Jaret, o los de respaldo)
async function cargarIndicadores() {
  try {
    const respuesta = await fetch("data/indicadores.json");
    if (!respuesta.ok) throw new Error("Todavia no existe");
    indicadores = await respuesta.json();
    console.log("Indicadores cargados de data/indicadores.json");
  } catch (error) {
    indicadores = INDICADORES_RESPALDO;
    console.warn("Usando indicadores de respaldo (temporal)");
  }
}

// 2. Leer lo que escribió el astronauta
function leerFormulario() {
  const chequeo = { tripulante: "Crew A", fecha: new Date().toISOString().slice(0, 10) };
  for (const campo of CAMPOS) {
    const caja = document.getElementById(campo);
    if (caja && caja.value !== "") {
      chequeo[campo] = Number(caja.value);
    }
  }
  return chequeo;
}

// 3. Guardar y leer chequeos en el navegador (sirve sin internet)
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
    console.warn("No se pudo guardar el chequeo", e);
  }
}

// 4. Mostrar el semáforo en la página
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
         + "<br>" + r.recomendacion + "</li>";
  }
  html += "</ul>";
  contenedor.innerHTML = html;
}

// 5. Lo que pasa al dar clic en "Evaluate"
function evaluar() {
  const chequeo = leerFormulario();
  const resultados = evaluarChequeo(chequeo, indicadores);
  mostrarResultados(resultados);
  if (resultados.length > 0) guardarChequeo(chequeo);

  // Aviso para el mapa del cuerpo de Carlos
  document.dispatchEvent(new CustomEvent("kuxtal-evaluado", {
    detail: { resultados: resultados, porSistema: estadoPorSistema(resultados) }
  }));
}

// Arranque
document.addEventListener("DOMContentLoaded", async () => {
  await cargarIndicadores();
  const boton = document.getElementById("btn-evaluar");
  if (boton) boton.addEventListener("click", evaluar);
});