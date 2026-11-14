// graficas.js — Gráficas de tendencia de KUXTAL (Lili)

let grafica = null;
let datosTripulacion = [];

// Datos simulados de Jesús (si ya los subió)
async function cargarTripulacion() {
  try {
    const respuesta = await fetch("data/tripulacion.json");
    if (!respuesta.ok) throw new Error("Todavia no existe");
    datosTripulacion = await respuesta.json();
  } catch (e) {
    datosTripulacion = [];
    console.warn("Todavia no hay data/tripulacion.json");
  }
}

// Junta los datos de Jesús con los chequeos guardados, ordenados por fecha
function historial(tripulante) {
  const todos = datosTripulacion.concat(obtenerChequeos());
  return todos
    .filter(c => c.tripulante === tripulante)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Dibuja las franjas verde, amarilla y roja detrás de la línea (sin encimarse)
const franjas = {
  id: "franjas",
  beforeDatasetsDraw(chart, args, opciones) {
    const ind = opciones.indicador;
    if (!ind) return;
    const { ctx, chartArea, scales } = chart;
    const y = scales.y;

    function banda(desde, hasta, color) {
      const arriba = Math.max(y.getPixelForValue(hasta), chartArea.top);
      const abajo = Math.min(y.getPixelForValue(desde), chartArea.bottom);
      if (abajo <= arriba) return;
      ctx.fillStyle = color;
      ctx.fillRect(chartArea.left, arriba, chartArea.right - chartArea.left, abajo - arriba);
    }

    const bajo = Math.min(ind.amarillo[0], ind.verde[0]);
    const alto = Math.max(ind.amarillo[1], ind.verde[1]);
    const ROJO = "rgba(198, 40, 40, 0.25)";
    const AMARILLO = "rgba(249, 168, 37, 0.40)";
    const VERDE = "rgba(46, 125, 50, 0.35)";

    ctx.save();
    banda(y.min, bajo, ROJO);                    // rojo de abajo
    banda(alto, y.max, ROJO);                    // rojo de arriba
    banda(bajo, ind.verde[0], AMARILLO);         // amarillo de abajo
    banda(ind.verde[1], alto, AMARILLO);         // amarillo de arriba
    banda(ind.verde[0], ind.verde[1], VERDE);    // verde
    ctx.restore();
  }
};  

function dibujarGrafica(idIndicador) {
  const lienzo = document.getElementById("grafica-tendencia");
  if (!lienzo || typeof Chart === "undefined") return;

  const ind = indicadores.find(i => i.id === idIndicador);
  if (!ind) return;

  const datos = historial(tripulanteActual()).filter(c => c[idIndicador] !== undefined);
    const bajo = Math.min(ind.amarillo[0], ind.verde[0]);
  const alto = Math.max(ind.amarillo[1], ind.verde[1]);
  const margen = (alto - bajo) * 0.25;

  if (grafica) grafica.destroy();
  grafica = new Chart(lienzo, {
    type: "line",
    data: {
      labels: datos.map(c => c.fecha),
      datasets: [{
        label: ind.nombre + " (" + ind.unidad + ")",
        data: datos.map(c => c[idIndicador]),
        borderColor: "#1565c0",
        backgroundColor: "#1565c0",
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: { y: { suggestedMin: ind.amarillo[0] - margen, suggestedMax: ind.amarillo[1] + margen } },
      plugins: { franjas: { indicador: ind } }
    },
    plugins: [franjas]
  });
}

// La lista para elegir qué indicador ver
function llenarSelector() {
  const selector = document.getElementById("indicador-grafica");
  if (!selector) return;
  selector.innerHTML = "";
  for (const ind of indicadores) {
    const opcion = document.createElement("option");
    opcion.value = ind.id;
    opcion.textContent = ind.nombre;
    selector.appendChild(opcion);
  }
  selector.addEventListener("change", () => dibujarGrafica(selector.value));
}

function actualizarGrafica() {
  const selector = document.getElementById("indicador-grafica");
  if (selector && selector.value) dibujarGrafica(selector.value);
}

async function iniciarGraficas() {
  await cargarTripulacion();
  llenarSelector();
  const crew = document.getElementById("crew-select");
  if (crew) crew.addEventListener("change", actualizarGrafica);
  actualizarGrafica();
}