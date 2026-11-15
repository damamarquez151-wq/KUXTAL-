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

// Nombre bonito de cada zona (para la tarjeta de abajo del cuerpo)
const NOMBRE_ZONA = {
  head: "Head — Mind and sleep", neck: "Neck — Immune system",
  thorax: "Thorax — Heart", abdomen: "Abdomen — Nutrition",
  arms: "Arms — Muscles", legs: "Legs — Bones and muscles", joints: "Knees — Bones and joints"
};

// Los 5 sistemas de la lista "Body Systems" y en qué zona del cuerpo están
const SISTEMAS = {
  corazon: { nombre: "Heart", zona: "thorax" },
  inmune: { nombre: "Immune", zona: "neck" },
  nutricion: { nombre: "Nutrition", zona: "abdomen" },
  sueno: { nombre: "Sleep", zona: "head" },
  mente: { nombre: "Mind", zona: "head" }
};

// Aquí guardo los últimos resultados, para usarlos cuando den clic en el cuerpo
let ultimosResultados = [];
let zonaElegida = "head";

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

// Por qué importa cada zona: el riesgo de la NASA (de Jaret), sin repetir
function riesgosNasa(deLaZona) {
  let html = "";
  const yaPuestos = [];
  for (const r of deLaZona) {
    if (!r.url_nasa || yaPuestos.includes(r.url_nasa)) continue;   // sin link o repetido
    yaPuestos.push(r.url_nasa);
    html += '<div class="detail-row"><p>Why it matters: ' + r.por_que
         + ' <a href="' + r.url_nasa + '" target="_blank" rel="noopener">NASA: '
         + r.riesgo_nasa + " ↗</a></p></div>";
  }
  return html;
}

// 4. La tarjeta de detalle, abajo del cuerpo (al dar clic en una zona)
function mostrarDetalle(zona) {
  zonaElegida = zona;
  const sistemas = ZONAS[zona] || [];
  const deLaZona = ultimosResultados.filter(r => sistemas.includes(r.sistema));
  const color = peorColor(deLaZona.map(r => r.color));

  // Marco el circulito elegido (y le quito la marca a los demás)
  document.querySelectorAll(".body-node").forEach(nodo => {
    nodo.classList.toggle("selected", nodo.dataset.zone === zona);
  });

  document.getElementById("detail-title").textContent = NOMBRE_ZONA[zona];
  const etiqueta = document.getElementById("detail-badge");
  etiqueta.className = "badge badge-" + (color ? CLASE[color] : "none");
  etiqueta.textContent = color ? PALABRA[color] : "NO DATA";

  let html = "";
  if (ultimosResultados.length === 0) {
    html = "<p>Run a check-in to see this zone.</p>";
  } else if (deLaZona.length === 0) {
    html = "<p>No indicator is measured in this zone yet.</p>";
  } else {
    for (const r of deLaZona) {
      html += '<div class="detail-row">'
           + '<div class="detail-sys"><span class="dot dot-' + CLASE[r.color] + '"></span>'
           + r.nombre + ": " + r.valor + " " + r.unidad + "</div>"
           + '<p class="detail-rec"><b>Action:</b> ' + r.recomendacion + "</p>"
           + "</div>";
    }
    html += riesgosNasa(deLaZona);
  }
  document.getElementById("detail-body").innerHTML = html;

  const conFuente = deLaZona.find(r => r.fuente);
  document.getElementById("detail-source").textContent =
    "Source: " + (conFuente ? conFuente.fuente : "NASA Human Research Roadmap");
}

// 5. La lista "Body Systems" (derecha)
function pintarListaSistemas(porSistema) {
  const lista = document.getElementById("systems-list");
  lista.innerHTML = "";
  for (const clave in SISTEMAS) {
    const sistema = SISTEMAS[clave];
    const color = porSistema[clave];   // puede no existir si no se capturó
    const nombres = ultimosResultados.filter(r => r.sistema === clave).map(r => r.nombre);

    const renglon = document.createElement("li");
    renglon.tabIndex = 0;
    renglon.innerHTML = '<span class="dot dot-' + (color ? CLASE[color] : "none") + '"></span>'
      + "<strong>" + sistema.nombre + "</strong>"
      + "<span>" + (nombres.join(", ") || "—") + "</span>"
      + '<b class="sys-state st-' + (color ? CLASE[color] : "none") + '">'
      + (color ? CLASE[color].toUpperCase() : "N/A") + "</b>";
    renglon.addEventListener("click", () => mostrarDetalle(sistema.zona));
    lista.appendChild(renglon);
  }
}

// ===================== TODO JUNTO =====================
function actualizarTodo(resultados, porSistema) {
  if (resultados.length === 0) return;
  ultimosResultados = resultados;
  pintarCuerpo(porSistema);
  pintarTarjetas(resultados);
  pintarEstadoGeneral(resultados);
  pintarListaSistemas(porSistema);
  mostrarDetalle(zonaElegida);
  document.getElementById("escalate-msg").classList.add("hidden");   // una evaluación nueva borra el aviso viejo
}

// Evalúa el último día guardado del tripulante elegido (datos de Jesús + chequeos)
function mostrarUltimoDia() {
  const crew = document.getElementById("crew-select").value;
  const dias = historial(crew);                     // de Lili (graficas.js)
  if (dias.length === 0) return;
  const ultimo = dias[dias.length - 1];
  const resultados = evaluarChequeo(ultimo, indicadores);   // de Lili (reglas.js)
  actualizarTodo(resultados, estadoPorSistema(resultados));
  document.getElementById("eval-source").textContent =
    "Last check-in: " + ultimo.fecha + (ultimo.hora ? " " + ultimo.hora : "");
}

// Los datos de Jesús tardan un poquito en cargar: reviso cada 0.2 s (máximo 6 s)
function esperarDatos(intentos) {
  if (datosTripulacion.length > 0 && indicadores.length > 0) {
    mostrarUltimoDia();
  } else if (intentos < 30) {
    setTimeout(() => esperarDatos(intentos + 1), 200);
  }
}

// ===================== RADIACIÓN (datos de Jesús, NASA DONKI) =====================
// Textos del letrero de arriba, según el nivel que manda radiation.js
const TEXTO_DONKI = {
  green: ["NO ACTIVE SOLAR EVENTS — NOMINAL SPACE WEATHER", "Solar Flux: Nominal • Geomagnetic: Quiet"],
  yellow: ["ELEVATED SOLAR ACTIVITY — AVOID SPACEWALKS", "Keep your dosimeter on"],
  red: ["SOLAR RADIATION STORM — GO TO THE SHIELDED AREA", "Notify the crew medical officer"]
};
// De dónde vienen los datos: en vivo, guardados (sin internet) o simulados
const ORIGEN_DONKI = { nasa: "LIVE NASA DATA", cache: "OFFLINE — LAST NASA DATA", simulated: "SIMULATED DATA" };

// Pinta el letrero de arriba y el borde alrededor del cuerpo
function pintarRadiacion(resultado) {
  const nivel = resultado.level;   // "green", "yellow" o "red"

  const letrero = document.getElementById("donki-banner");
  letrero.classList.remove("status-green", "status-yellow", "status-red");
  letrero.classList.add("status-" + nivel);
  document.getElementById("donki-dot").className = "dot dot-" + nivel;
  document.getElementById("donki-title").textContent = TEXTO_DONKI[nivel][0];
  document.getElementById("donki-sub").textContent = TEXTO_DONKI[nivel][1];
  document.getElementById("donki-source").textContent = ORIGEN_DONKI[resultado.origin] || "SIMULATED DATA";

  // El borde del cuerpo: amarillo o rojo solo si hay alerta
  const borde = document.getElementById("radiation-halo");
  borde.classList.remove("rad-yellow", "rad-red");
  if (nivel !== "green") borde.classList.add("rad-" + nivel);
}

// Pide los datos a radiation.js (de Jesús) y los pinta
function cargarRadiacion() {
  if (typeof Radiation === "undefined") return;   // por si falta el archivo de Jesús
  // Modo demo de Jesús: si la dirección termina en ?demo=storm, se fuerza la tormenta simulada
  const modoDemo = new URLSearchParams(window.location.search).get("demo") === "storm";
  Radiation.load({ forceSimulated: modoDemo }).then(pintarRadiacion);   // su caja y mi letrero, iguales
}

// ===================== AMBIENTE DE MISIÓN (datos de Jesús, environment.js) =====================
// Texto chiquito debajo de "HABITAT A", según el ambiente
const SUBTITULO_AMBIENTE = { iss: "LOW EARTH ORBIT", moon: "LUNAR BASE", mars: "MARS TRANSIT" };

// Convierte el retraso de Jesús ({ min, max } en segundos) en un texto corto
function textoRetraso(retraso) {
  if (retraso.max >= 60) return Math.round(retraso.min / 60) + "–" + Math.round(retraso.max / 60) + " min";
  if (retraso.min === retraso.max) return retraso.max + " s";
  return "< " + retraso.max + " s";
}

// Llena la lista "Mission Environment" con los ambientes de Jesús
function llenarAmbientes() {
  const lista = document.getElementById("mission-env");
  lista.innerHTML = "";
  for (const ambiente of Environment.list()) {
    const opcion = document.createElement("option");
    opcion.value = ambiente.id;              // "iss", "moon" o "mars"
    opcion.textContent = ambiente.name;
    lista.appendChild(opcion);
  }
  lista.value = Environment.current().id;   // el que estaba guardado
}

// Pinta el ambiente elegido en la barra de arriba
function pintarAmbiente() {
  const ambiente = Environment.current();
  document.getElementById("habitat-subtitle").textContent = SUBTITULO_AMBIENTE[ambiente.id];
  document.getElementById("comms-delay").textContent = textoRetraso(ambiente.delaySeconds);
}

// Botón rojo "ESCALATE ALERT": confirma el envío, con el retraso y qué hacer
function escalarAlerta() {
  const hora = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  let texto = "Alert sent to Mission Control at " + hora + ".";
  if (typeof Environment !== "undefined") {
    const ambiente = Environment.current();
    texto += " Signal delay: " + ambiente.delay + ". " + ambiente.escalation;
  }
  const mensaje = document.getElementById("escalate-msg");
  mensaje.textContent = texto;
  mensaje.classList.remove("hidden");
}

// Botón "Reset history": borra los chequeos guardados en este navegador
function borrarHistorial() {
  if (!confirm("Delete all saved check-ins on this device?")) return;
  localStorage.removeItem(CLAVE_GUARDADO);   // CLAVE_GUARDADO es de Lili (app.js)
  actualizarGrafica();                       // de Lili (graficas.js)
  mostrarUltimoDia();
  // Limpio el recuadro "Result" de la ventana, para que se note que se borró
  document.getElementById("resultados").innerHTML =
    "<p>History cleared. Showing the simulated mission data only.</p>";
}

// ===================== ESCUCHAR EL AVISO DE LILI =====================
// app.js manda "kuxtal-evaluado" cada vez que se da clic en Evaluate
document.addEventListener("kuxtal-evaluado", (evento) => {
  actualizarTodo(evento.detail.resultados, evento.detail.porSistema);
  document.getElementById("eval-source").textContent = "Last check-in: today";
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
    mostrarUltimoDia();   // pinto el último día de ese tripulante
  });

  // Clic en un circulito del cuerpo o en una tarjeta de Vital Signs = ver su detalle
  document.querySelectorAll(".body-node, .vital-tile").forEach(elemento => {
    elemento.addEventListener("click", () => mostrarDetalle(elemento.dataset.zone));
  });

  // Al abrir la página, pinto el último día del tripulante A
  esperarDatos(0);

  // Radiación: la pido al abrir la página
  cargarRadiacion();

  // Para el demo: la lista "Space weather" del chequeo simula una tormenta
  document.getElementById("in-donki").addEventListener("change", (evento) => {
    const opcion = evento.target.value;   // "verde", "amarillo" o "rojo"
    if (opcion === "verde") {
      cargarRadiacion();                  // regreso a los datos reales
    } else {
      pintarRadiacion({ level: CLASE[opcion], origin: "simulated" });
    }
  });

  // Ambiente de misión: lista, barra de arriba y cambios
  if (typeof Environment !== "undefined") {   // por si falta el archivo de Jesús
    llenarAmbientes();
    pintarAmbiente();
    document.getElementById("mission-env").addEventListener("change", (evento) => {
      Environment.set(evento.target.value);   // Jesús lo guarda y avisa a los demás
      pintarAmbiente();
      // Lili cambia "a quién avisar" según el ambiente: vuelvo a pintar con los mismos resultados
      actualizarTodo(ultimosResultados, estadoPorSistema(ultimosResultados));
    });
  }

  // Botones de la izquierda y del chequeo
  document.getElementById("btn-escalate").addEventListener("click", escalarAlerta);
  document.getElementById("btn-reset-sim").addEventListener("click", borrarHistorial);
});