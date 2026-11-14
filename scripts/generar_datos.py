# -*- coding: utf-8 -*-
"""
KUXTAL - Generador de datos simulados de la tripulacion
Autor: Jesus (Datos e integracion NASA)

Genera data/tripulacion.json: una lista de 15 chequeos
(3 tripulantes x 5 dias), con las claves que usa js/reglas.js.
TODOS LOS DATOS SON INVENTADOS (simulados). No son datos medicos reales.

- Tripulante A: reproduce exactamente el escenario de 5 dias del avance
  del profesor Mario (dia 3 = tormenta solar, dia 4 = alerta roja).
- Tripulante B: sano y estable (valores aleatorios dentro de verde).
- Tripulante C: problema de sueno que empeora poco a poco.

Como usarlo: guarda este archivo en KUXTAL-/scripts/
y presiona F5 en Spyder. Se crea KUXTAL-/data/tripulacion.json
"""

import json
import os
import random
from datetime import date, timedelta

# Semilla fija: cada vez que corras el script salen los mismos numeros
# (asi el demo siempre se ve igual).
random.seed(2026)

# ---------------------------------------------------------------
# 1. Configuracion general de la mision
# ---------------------------------------------------------------
ENTORNO = "luna"                 # "iss", "luna" o "marte"
FECHA_INICIO = date(2026, 11, 10)  # dia 1 de la mision (inventado)
DIAS = 5

# ---------------------------------------------------------------
# 2. Rangos SOLO para revisar que los datos queden como queremos.
#    Son los de la guia del avance (referencia general de adulto).
#    Los oficiales los pone Jaret en data/indicadores.json.
# ---------------------------------------------------------------
def color_presion(sis, dia):
    if sis >= 140 or dia >= 90:
        return "rojo"
    if sis >= 120 or dia >= 80:
        return "amarillo"
    return "verde"

def color_pulso(p):
    if p < 50 or p > 120:
        return "rojo"
    if p < 60 or p > 100:
        return "amarillo"
    return "verde"

def color_temp(t):
    if t >= 38.0:
        return "rojo"
    if t >= 37.3:
        return "amarillo"
    return "verde"

def color_glucosa(g):
    if g < 70 or g > 125:
        return "rojo"
    if g >= 100:
        return "amarillo"
    return "verde"

def color_sueno(h):
    if h < 5:
        return "rojo"
    if h < 7:
        return "amarillo"
    return "verde"

def color_animo(a):
    if a <= 2:
        return "rojo"
    if a == 3:
        return "amarillo"
    return "verde"

# ---------------------------------------------------------------
# 3. Funcion que arma un chequeo (como un "constructor" en Java)
# ---------------------------------------------------------------
#    Las claves son EXACTAMENTE las que lee js/reglas.js (Lili).
def chequeo(tripulante, num_dia, sis, dia, pulso, temp, glucosa, sueno, animo):
    return {
        "tripulante": tripulante,
        "fecha": (FECHA_INICIO + timedelta(days=num_dia - 1)).isoformat(),
        "presion_sistolica": sis,
        "presion_diastolica": dia,
        "frecuencia_cardiaca": pulso,
        "temperatura": temp,
        "glucosa": glucosa,
        "sueno": sueno,
        "animo": animo,
    }

# ---------------------------------------------------------------
# 4. Tripulante A: escenario fijo de la guia (no aleatorio)
# ---------------------------------------------------------------
def tripulante_a():
    return [
        chequeo("A", 1, 115, 75, 72, 36.6, 88, 7.5, 4),
        chequeo("A", 2, 122, 82, 78, 36.7, 92, 6.0, 3),
        chequeo("A", 3, 128, 84, 84, 36.8, 95, 5.0, 3),
        chequeo("A", 4, 142, 92, 98, 36.9, 97, 4.5, 2),
        chequeo("A", 5, 124, 80, 76, 36.6, 90, 7.0, 4),
    ]

# ---------------------------------------------------------------
# 5. Tripulante B: sano, valores aleatorios dentro de verde
# ---------------------------------------------------------------
def tripulante_b():
    letra = "B"
    lista = []
    for d in range(1, DIAS + 1):
        lista.append(chequeo(
            letra,
            d,
            random.randint(108, 118),            # sistolica
            random.randint(68, 78),              # diastolica
            random.randint(62, 80),              # pulso
            round(random.uniform(36.3, 36.9), 1),
            random.randint(78, 95),              # glucosa
            round(random.uniform(7.0, 8.5), 1),  # sueno
            random.choice([4, 5]),               # animo
        ))
    return lista

# ---------------------------------------------------------------
# 6. Tripulante C: el sueno baja cada dia y arrastra el animo
# ---------------------------------------------------------------
def tripulante_c():
    letra = "C"
    sueno_por_dia = [7.2, 6.5, 5.8, 5.2, 4.6]   # va empeorando
    animo_por_dia = [4, 4, 3, 3, 2]
    lista = []
    for d in range(1, DIAS + 1):
        lista.append(chequeo(
            letra,
            d,
            random.randint(112, 119),
            random.randint(72, 79),
            random.randint(66, 88),
            round(random.uniform(36.4, 36.9), 1),
            random.randint(80, 97),
            sueno_por_dia[d - 1],
            animo_por_dia[d - 1],
        ))
    return lista

# ---------------------------------------------------------------
# 7. Eventos de clima espacial simulados (respaldo sin internet).
#    Con internet, js/radiacion.js usa los datos reales de DONKI.
# ---------------------------------------------------------------
eventos_simulados = [
    {
        "fecha": (FECHA_INICIO + timedelta(days=2)).isoformat(),
        "tipo": "SEP",
        "nivel": "rojo",
        "mensaje": "Solar storm alert: go to the shielded area",
        "simulado": True,
    }
]

# ---------------------------------------------------------------
# 8. Armar la lista de chequeos (formato que pidio Lili):
#    [ {...}, {...}, ... ]  -> 15 chequeos (3 tripulantes x 5 dias)
# ---------------------------------------------------------------
chequeos = tripulante_a() + tripulante_b() + tripulante_c()

# ---------------------------------------------------------------
# 9. Revision: imprime el semaforo de cada chequeo en la consola
# ---------------------------------------------------------------
INICIAL = {"verde": "V", "amarillo": "A", "rojo": "R"}

print("Revision del semaforo (V=verde, A=amarillo, R=rojo)")
print("Orden: presion, pulso, temp, glucosa, sueno, animo\n")
anterior = None
for c in chequeos:
    if c["tripulante"] != anterior:
        print(f"\nTripulante {c['tripulante']}")
        anterior = c["tripulante"]
    colores = [
        color_presion(c["presion_sistolica"], c["presion_diastolica"]),
        color_pulso(c["frecuencia_cardiaca"]),
        color_temp(c["temperatura"]),
        color_glucosa(c["glucosa"]),
        color_sueno(c["sueno"]),
        color_animo(c["animo"]),
    ]
    letras = " ".join(INICIAL[x] for x in colores)
    print(f"  {c['fecha']}:  {letras}")
print()

# ---------------------------------------------------------------
# 10. Guardar en KUXTAL-/data/
#     El script vive en KUXTAL-/scripts/, asi que subimos un nivel
#     para llegar a la carpeta principal del proyecto.
#     - tripulacion.json        -> lo leen reglas.js y las graficas
#     - eventos_simulados.json  -> respaldo de radiacion.js sin internet
# ---------------------------------------------------------------
carpeta_script = os.path.dirname(os.path.abspath(__file__))
carpeta_proyecto = os.path.dirname(carpeta_script)
carpeta_data = os.path.join(carpeta_proyecto, "data")
os.makedirs(carpeta_data, exist_ok=True)

ruta_chequeos = os.path.join(carpeta_data, "tripulacion.json")
with open(ruta_chequeos, "w", encoding="utf-8") as f:
    json.dump(chequeos, f, ensure_ascii=False, indent=2)

ruta_eventos = os.path.join(carpeta_data, "eventos_simulados.json")
with open(ruta_eventos, "w", encoding="utf-8") as f:
    json.dump(eventos_simulados, f, ensure_ascii=False, indent=2)

print(f"Listo. {len(chequeos)} chequeos guardados en:")
print(ruta_chequeos)
print("Eventos de clima espacial simulados en:")
print(ruta_eventos)