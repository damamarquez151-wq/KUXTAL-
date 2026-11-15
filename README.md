# KUXTAL: The Astronaut's Pocket Doctor

> **KUXTAL** is an autonomous, lightweight web-based health monitoring system designed for astronauts on long-duration space missions. It serves as a "pocket doctor," turning daily vital check-ins into rapid, visual, and actionable medical triage while accounting for deep space environmental hazards.

---

## About the Project
During deep space missions (such as travel to Mars or lunar habitation), communication delays with Earth can exceed 20 minutes, making real-time medical supervision from ground control impossible. **KUXTAL** bridges this gap by empowering astronauts to autonomously monitor their physiological and psychological wellbeing through a fast, intuitive 2-minute daily check-in and environment-aware risk evaluation.

Developed for the **NASA Space Apps Challenge 2026 (Carmen City)**, KUXTAL integrates official data frameworks including the **NASA Human Research Roadmap (5 Hazards of Spaceflight)**, **NASA-STD-3001 Vol. 1**, live space weather from the **NASA DONKI API**, and radiation monitoring resources from the **CSA (Canadian Space Agency)**.

---

## Key Features
* **Mission Environment Selector:** Real-time context switching between **Lunar Base**, **Low Earth Orbit (ISS)**, and **Mars Transit** to adapt health triage parameters.
* **NASA DONKI Space Weather Integration:** Live and simulated space weather monitoring (solar flux, geomagnetic activity, and CME/solar storm alerts) affecting crew safety.
* **2-Minute Daily Check-in:** Fast logging of 6 key biometric indicators (Systolic/Diastolic BP, Heart Rate, Body Temp, Blood Glucose, Sleep Hours, and Mood Score).
* **Interactive Human Body Map:** Translates raw medical data into an intuitive visual body map with interactive zones (Head, Neck, Thorax, Abdomen, Arms, Legs, Joints) color-coded by clinical triage status:
  * 🟢 **Green:** Optimal / Within expected range
  * 🟡 **Yellow:** Requires attention / Warning
  * 🔴 **Red:** Critical / Immediate review needed
* **Trend Analysis & Charts:** Local Chart.js integration to track biometric trends over simulation timelines without requiring internet access.
* **Offline-First Resilience:** Designed to function seamlessly in isolated space environments where network connectivity is intermittent or unavailable.

---

##  Live Demo & How to Run
* **Live site:**[ [https://damamarquez151-wq.github.io/KUXTAL-/](https://damamarquez151-wq.github.io/KUXTAL-/)](https://damamarquez151-wq.github.io/KUXTAL-/).
* **Run locally:** Open the folder in VS Code and start `index.html` with the **Live Server** extension. *Do not open `index.html` by double-clicking it directly; modern browsers block reading local data files via the file protocol.*

---

##  Data Notice
All crew health data in this prototype is **simulated** for demonstration purposes. No real medical data is used. KUXTAL is a software prototype, not a medical device.

---

## NASA & Space Agency Resources Used
* **NASA Human Research Program:** *5 Hazards of Human Spaceflight* and *Risks of Human Spaceflight* (each indicator links to its HRP risk page).
* **NASA-STD-3001 Vol. 1** (Crew Health), OCHMO-STD-100.1A, NASA Behavioral Health and Performance.
* **NASA DONKI API** (space weather events).
* **CSA:** *Monitoring Radiation for Astronaut Health* (consulted resource).

---

##  Use of AI Tools
* **Claude (Anthropic):** Helped write and review the rules engine, check-in form, validation, and trend charts (`reglas.js`, `app.js`, `graficas.js`), and assisted in project planning.
* **[Tool used by Jaret]:** Helped research reference ranges and sources (reviewed and verified by the team).
* **[Team additions]:** Integrated development and documentation support.

---

## Project Structure
```text
KUXTAL/
│
├── index.html              # Main HUD interface, environment selector & check-in modal
├── css/
│   └── estilos.css         # Space-themed glassmorphism and UI styling
├── js/
│   ├── app.js              # Check-in logic, evaluation & local storage (Lili)
│   ├── reglas.js           # Clinical triage rules and traffic-light engine
│   ├── interfaz.js         # UI management & simulation timeline renderer (Carlos)
│   ├── graficas.js         # Chart.js trend visualizations
│   ├── environment.js      # Mission environments handler (Lunar, ISS, Mars)
│   ├── radiation.js        # NASA DONKI & CSA radiation alert integration (Jesús)
│   └── chart.umd.js        # Local Chart.js library for offline capability
└── img/
    └── cuerpo.svg          # Custom human body silhouette (MIT license)
