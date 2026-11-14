// interfaz.js — Pantalla de KUXTAL (Carlos)
// Parte 1: abrir y cerrar la ventana del chequeo diario

document.addEventListener("DOMContentLoaded", () => {
  // Busco en la página las 3 piezas que necesito, por su id
  const ventana = document.getElementById("checkin-modal");
  const botonAbrir = document.getElementById("btn-open-checkin");
  const botonCerrar = document.getElementById("btn-close-checkin");

  // Al dar clic en "CHECK-IN": le quito la clase "hidden" (oculto) y se ve
  botonAbrir.addEventListener("click", () => ventana.classList.remove("hidden"));

  // Al dar clic en la ✕: le vuelvo a poner "hidden" y se esconde
  botonCerrar.addEventListener("click", () => ventana.classList.add("hidden"));
});