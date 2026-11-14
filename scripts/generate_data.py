# -*- coding: utf-8 -*-
"""
KUXTAL - Simulated crew data generator
Author: Jesus (Data and NASA integration)

Creates data/tripulacion.json: a list of 15 check-ins
(3 crew members x 5 days), using the keys that js/reglas.js reads.
ALL DATA IS MADE UP (simulated). It is not real medical data.

- Crew member A: reproduces exactly the 5-day scenario of the
  progress report (day 3 = solar storm, day 4 = red alert).
- Crew member B: healthy and stable (random values inside green).
- Crew member C: sleep problem that slowly gets worse.

How to use it: save this file in KUXTAL-/scripts/generate_data.py
and press F5 in Spyder. It creates KUXTAL-/data/tripulacion.json

Note: the data keys (tripulante, fecha, sueno, animo, ...) stay in
Spanish on purpose, because js/reglas.js and the charts read them
with those exact names.
"""

import json
import os
import random
from datetime import date, timedelta

# Fixed seed: every run produces the same numbers
# (so the demo always looks the same).
random.seed(2026)

# ---------------------------------------------------------------
# 1. General mission settings
# ---------------------------------------------------------------
ENVIRONMENT = "moon"             # "iss", "moon" or "mars"
START_DATE = date(2026, 11, 10)  # mission day 1 (made up)
DAYS = 5

# ---------------------------------------------------------------
# 2. Ranges ONLY to check that the data looks the way we want.
#    They are the general adult references from the progress report.
#    The official ones are in data/indicadores.json (Jaret).
# ---------------------------------------------------------------
def blood_pressure_color(systolic, diastolic):
    if systolic >= 140 or diastolic >= 90:
        return "red"
    if systolic >= 120 or diastolic >= 80:
        return "yellow"
    return "green"

def heart_rate_color(bpm):
    if bpm < 50 or bpm > 120:
        return "red"
    if bpm < 60 or bpm > 100:
        return "yellow"
    return "green"

def temperature_color(t):
    if t >= 38.0:
        return "red"
    if t >= 37.3:
        return "yellow"
    return "green"

def glucose_color(g):
    if g < 70 or g > 125:
        return "red"
    if g >= 100:
        return "yellow"
    return "green"

def sleep_color(hours):
    if hours < 5:
        return "red"
    if hours < 7:
        return "yellow"
    return "green"

# Mood on a 0-10 scale (Jaret's proposal):
#   0-2 very negative, 3-4 negative  -> red
#   5-6 neutral                      -> yellow
#   7-8 positive, 9-10 very positive -> green
def mood_color(m):
    if m <= 4:
        return "red"
    if m <= 6:
        return "yellow"
    return "green"

# ---------------------------------------------------------------
# 3. Builds one check-in (like a constructor in Java)
#    The keys are EXACTLY the ones js/reglas.js reads (Lili).
# ---------------------------------------------------------------
def check_in(crew, day_number, systolic, diastolic, bpm, temp, glucose, sleep, mood):
    return {
        "tripulante": crew,
        "fecha": (START_DATE + timedelta(days=day_number - 1)).isoformat(),
        "presion_sistolica": systolic,
        "presion_diastolica": diastolic,
        "frecuencia_cardiaca": bpm,
        "temperatura": temp,
        "glucosa": glucose,
        "sueno": sleep,
        "animo": mood,
    }

# ---------------------------------------------------------------
# 4. Crew member A: fixed scenario from the report (not random)
# ---------------------------------------------------------------
def crew_a():
    return [
        check_in("A", 1, 115, 75, 72, 36.6, 88, 7.5, 8),
        check_in("A", 2, 122, 82, 78, 36.7, 92, 6.0, 6),
        check_in("A", 3, 128, 84, 84, 36.8, 95, 5.0, 5),
        check_in("A", 4, 142, 92, 98, 36.9, 97, 4.5, 3),
        check_in("A", 5, 124, 80, 76, 36.6, 90, 7.0, 7),
    ]

# ---------------------------------------------------------------
# 5. Crew member B: healthy, random values inside green
# ---------------------------------------------------------------
def crew_b():
    letter = "B"
    result = []
    for d in range(1, DAYS + 1):
        result.append(check_in(
            letter,
            d,
            random.randint(108, 118),            # systolic
            random.randint(68, 78),              # diastolic
            random.randint(62, 80),              # heart rate
            round(random.uniform(36.3, 36.9), 1),
            random.randint(78, 95),              # glucose
            round(random.uniform(7.0, 8.5), 1),  # sleep
            random.choice([7, 8, 9]),            # mood (0-10)
        ))
    return result

# ---------------------------------------------------------------
# 6. Crew member C: sleep drops every day and pulls mood down
# ---------------------------------------------------------------
def crew_c():
    letter = "C"
    sleep_by_day = [7.2, 6.5, 5.8, 5.2, 4.6]   # getting worse
    mood_by_day = [8, 7, 6, 5, 3]               # 0-10 scale
    result = []
    for d in range(1, DAYS + 1):
        result.append(check_in(
            letter,
            d,
            random.randint(112, 119),
            random.randint(72, 79),
            random.randint(66, 88),
            round(random.uniform(36.4, 36.9), 1),
            random.randint(80, 97),
            sleep_by_day[d - 1],
            mood_by_day[d - 1],
        ))
    return result

# ---------------------------------------------------------------
# 7. Simulated space weather events (offline fallback).
#    With internet, js/radiation.js uses the real DONKI data.
# ---------------------------------------------------------------
simulated_events = [
    {
        "date": (START_DATE + timedelta(days=2)).isoformat(),
        "type": "SEP",
        "level": "red",
        "message": "Solar radiation storm: go to the shielded area now and notify the crew medical officer.",
        "simulated": True,
    }
]

# ---------------------------------------------------------------
# 8. Build the list of check-ins (format requested by Lili):
#    [ {...}, {...}, ... ]  -> 15 check-ins (3 crew members x 5 days)
# ---------------------------------------------------------------
check_ins = crew_a() + crew_b() + crew_c()

# ---------------------------------------------------------------
# 9. Review: prints the traffic light of every check-in
# ---------------------------------------------------------------
INITIAL = {"green": "G", "yellow": "Y", "red": "R"}

print("Traffic light review (G=green, Y=yellow, R=red)")
print("Order: blood pressure, heart rate, temp, glucose, sleep, mood\n")
previous = None
for c in check_ins:
    if c["tripulante"] != previous:
        print(f"\nCrew member {c['tripulante']}")
        previous = c["tripulante"]
    colors = [
        blood_pressure_color(c["presion_sistolica"], c["presion_diastolica"]),
        heart_rate_color(c["frecuencia_cardiaca"]),
        temperature_color(c["temperatura"]),
        glucose_color(c["glucosa"]),
        sleep_color(c["sueno"]),
        mood_color(c["animo"]),
    ]
    letters = " ".join(INITIAL[x] for x in colors)
    print(f"  {c['fecha']}:  {letters}")
print()

# ---------------------------------------------------------------
# 10. Save into KUXTAL-/data/
#     This script lives in KUXTAL-/scripts/, so we go up one level
#     to reach the main project folder.
#     - tripulacion.json        -> read by reglas.js and the charts
#     - simulated_events.json   -> offline fallback for radiation.js
# ---------------------------------------------------------------
script_folder = os.path.dirname(os.path.abspath(__file__))
project_folder = os.path.dirname(script_folder)
data_folder = os.path.join(project_folder, "data")
os.makedirs(data_folder, exist_ok=True)

check_ins_path = os.path.join(data_folder, "tripulacion.json")
with open(check_ins_path, "w", encoding="utf-8") as f:
    json.dump(check_ins, f, ensure_ascii=False, indent=2)

events_path = os.path.join(data_folder, "simulated_events.json")
with open(events_path, "w", encoding="utf-8") as f:
    json.dump(simulated_events, f, ensure_ascii=False, indent=2)

print(f"Done. {len(check_ins)} check-ins saved to:")
print(check_ins_path)
print("Simulated space weather events saved to:")
print(events_path)
