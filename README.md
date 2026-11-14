#  KUXTAL: The Astronaut's Pocket Doctor

> **KUXTAL** is an autonomous, lightweight web-based health monitoring system designed for astronauts on long-duration space missions. It serves as a "pocket doctor," turning daily vital check-ins into rapid, visual, and actionable medical triage.

---

## About the Project
During deep space missions (such as travel to Mars), communication delays with Earth can exceed 20 minutes, making real-time medical supervision from ground control impossible. **KUXTAL** bridges this gap by empowering astronauts to autonomously monitor their physiological and psychological wellbeing through a fast, intuitive 2-minute daily check-in.

---

## Key Features
* **2-Minute Daily Check-in:** Quick logging of vital indicators (sleep, heart rate, temperature, and mood) without disrupting high-stress schedules.
* **Interactive Human Body Map:** Translates raw medical data into an intuitive visual body map color-coded by clinical triage status:
  * 🟢 **Green:** Optimal / Healthy
  * 🟡 **Yellow:** Warning / Attention required
  * 🔴 **Red:** Critical / Immediate action needed
* **Actionable Guidance:** Instantly provides clear instructions on what steps to take and when to notify the onboard medical officer.
* **Offline-First Ready:** Designed to securely store logs locally and sync automatically when network connectivity is available.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (Responsive web interface designed for mission tablets and computers).
* **UI/UX Design:** Custom branding inspired by space aesthetics, featuring a starry constellation motif integrated into a clean, human-centered design.

---

## Project Structure
```text
KUXTAL/
│
├── index.html          # Main application interface & login
├── dashboard.html      # Interactive human body map and check-in portal
├── css/                # Stylesheets and color palettes (Purple/Blue space theme)
├── js/                 # Core logic for data handling and triage
└── assets/             # Logos, icons, and visual branding assets
