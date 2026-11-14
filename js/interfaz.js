// interfaz.js — Pantalla de KUXTAL (Carlos)

// ===================== TABLAS DE TRADUCCIÓN =====================
// Qué sistemas (los nombres de Lili) le tocan a cada zona de mi dibujo
const ZONAS = {
  head: ["mente", "sueno"],
  neck: ["inmune"],
  thorax: ["corazon"],
  abdomen: ["nutricion"],
  arms: [], legs: [], joints: []   // todavía sin indicador: se quedan grises
};

// Lili dice los colores en español; mi CSS los usa en inglés
const CLASE = { verde: "green", amarillo: "yellow", rojo: "red" };
const PALABRA = { verde: "STABLE", amarillo: "CAUTION", rojo: "CRITICAL" };

// Qué tarjeta de "Vital Signs" muestra cada indicador
const TARJETAS = {
  frecuencia_cardiaca: "v-hr", temperatura: "v-temp", glucosa: "v-glucose",
  sueno: "v-sleep", animo: "v-mood"
};

// ===================== AYUDANTES =====================
// De una lista de colores regresa el peor (rojo > amarillo > verde). Lista vacía = null
function peorColor(colores) {
  let peor = null;
  for (const c of colores) {
    if (peor === null || GRAVEDAD[c] > GRAVEDAD[peor]) peor = c;
  }
  return peor;
}

// Le quita a un elemento su color viejo y le pone el nuevo
function ponerColor(elemento, prefijo, color) {
  for (const c of ["green", "yellow", "red", "none"]) elemento.classList.remove(prefijo + c);
  elemento.classList.add(prefijo + (color ? CLASE[color] : "none"));
}

// ===================== PINTAR LA PANTALLA =====================
// 1. Los circulitos del cuerpo
function pintarCuerpo(porSistema) {
  document.querySelectorAll(".body-node").forEach(nodo => {
    const sistemas = ZONAS[nodo.dataset.zone] || [];
    const color = peorColor(sistemas.map(s => porSistema[s]).filter(c => c));
    ponerColor(nodo, "status-", color);
    nodo.classList.toggle("blink-red", color === "rojo");   // el rojo parpadea
  });
}

// 2. Las tarjetas de "Vital Signs"
function pintarTarjetas(resultados) {
  const porId = {};
  for (const r of resultados) porId[r.id] = r;

  for (const id in TARJETAS) {
    const r = porId[id];
    if (!r) continue;   // ese valor no se capturó
    const texto = document.getElementById(TARJETAS[id]);
    texto.textContent = r.valor;
    ponerColor(texto.closest(".vital-tile"), "status-", r.color);
  }

  // El ánimo se muestra como "3/10"
  if (porId.animo) document.getElementById("v-mood").textContent = porId.animo.valor + "/10";

  // La presión son 2 números en una sola tarjeta
  const sis = porId.presion_sistolica;
  const dia = porId.presion_diastolica;
  if (sis && dia) {
    const texto = document.getElementById("v-bp");
    texto.textContent = sis.valor + "/" + dia.valor;
    ponerColor(texto.closest(".vital-tile"), "status-", peorColor([sis.color, dia.color]));
  }
}

// 3. El anillo de estado general y las cajas de la izquierda
function pintarEstadoGeneral(resultados) {
  const color = peorColor(resultados.map(r => r.color));
  ponerColor(document.getElementById("global-ring"), "state-", color);
  document.getElementById("global-state-word").textContent = PALABRA[color];
  document.getElementById("global-state-code").textContent = "GLOBAL: " + CLASE[color].toUpperCase();

  const avisos = resultados.filter(r => r.color !== "verde");
  document.getElementById("global-caption").textContent = avisos.length === 0
    ? "All systems within operational parameters."
    : avisos.length + " indicator(s) need attention.";

  const recomendaciones = [...new Set(avisos.map(r => r.recomendacion))];   // sin repetidas
  document.getElementById("recommended-action").textContent = recomendaciones.length === 0
    ? "Continue nominal operational routine and daily exercise program."
    : recomendaciones.join(" ");

  document.getElementById("notification-protocol").textContent = nivelDeAccion(resultados);   // de Lili
  document.getElementById("btn-escalate").classList.toggle("hidden", color !== "rojo");
}

// ===================== ESCUCHAR EL AVISO DE LILI =====================
// app.js manda "kuxtal-evaluado" cada vez que se da clic en Evaluate
document.addEventListener("kuxtal-evaluado", (evento) => {
  const resultados = evento.detail.resultados;
  if (resultados.length === 0) return;
  pintarCuerpo(evento.detail.porSistema);
  pintarTarjetas(resultados);
  pintarEstadoGeneral(resultados);
});

// ===================== BOTONES =====================
document.addEventListener("DOMContentLoaded", () => {
  // Abrir y cerrar la ventana del chequeo
  const ventana = document.getElementById("checkin-modal");
  document.getElementById("btn-open-checkin").addEventListener("click", () => ventana.classList.remove("hidden"));
  document.getElementById("btn-close-checkin").addEventListener("click", () => ventana.classList.add("hidden"));

  // Que el letrero diga el tripulante elegido
  const crew = document.getElementById("crew-select");
  const letrero = document.getElementById("timeline-label");
  crew.addEventListener("change", () => {
    letrero.textContent = "CREWMEMBER " + crew.value + " — 5-DAY SIMULATION:";
  });
});