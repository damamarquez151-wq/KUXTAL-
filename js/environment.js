/*
 * KUXTAL - Mission environment selector (ISS, Moon, Mars)
 *
 * Use case: "Change mission environment".
 *
 * What it does:
 *   1. Draws a drop-down menu inside <div id="environment-selector"></div>.
 *   2. Shows, for the chosen environment:
 *      - the one-way communication delay with Earth,
 *      - who to contact when a result is red,
 *      - how protected the crew is from space radiation.
 *   3. Remembers the choice (localStorage), so it survives a reload.
 *   4. Tells the other files when the environment changes, through the
 *      browser event "kuxtal:environment-change".
 *
 * Communication delays (one way, speed of light):
 *   - Moon: about 1.3 seconds (384,000 km).
 *   - Mars: about 3 to 22 minutes, depending on where both planets are.
 *   Source: https://spaceacademy.net.au/spacelink/commdly.htm
 *
 * How to use it in a page:
 *   <div id="environment-selector"></div>   (menu + info)
 *   <script src="js/environment.js"></script>
 *
 * If the page already has its own menu (for example #mission-env),
 * skip #environment-selector and connect the menu with
 * Environment.set(value). To still show the info, add:
 *   <div id="environment-info"></div>       (info only)
 *
 * How other files can use it:
 *   Environment.current()          -> the chosen environment (object)
 *   Environment.current().escalation -> who to contact on a red result
 *   window.addEventListener("kuxtal:environment-change", e => {
 *     console.log(e.detail.id);    // "iss", "moon" or "mars"
 *   });
 */

const Environment = (function () {

  // ------------------------------------------------------------
  // 1. Settings
  // ------------------------------------------------------------
  const CONTAINER_ID = "environment-selector";   // menu + info
  const INFO_ID = "environment-info";             // info only (no menu)
  const STORAGE_KEY = "kuxtal_environment";
  const DEFAULT_ID = "moon";          // the report scenario is a lunar base
  const EVENT_NAME = "kuxtal:environment-change";

  // ------------------------------------------------------------
  // 2. The three environments
  // ------------------------------------------------------------
  const ENVIRONMENTS = {
    iss: {
      id: "iss",
      name: "International Space Station",
      shortName: "ISS",
      delay: "Less than 1 second (near real time)",
      delaySeconds: { min: 0, max: 1 },
      escalation: "Contact the ground medical team now: the link is near real time.",
      radiation: "Partly shielded by Earth's magnetic field."
    },
    moon: {
      id: "moon",
      name: "Lunar base",
      shortName: "Moon",
      delay: "About 1.3 seconds each way",
      delaySeconds: { min: 1.3, max: 1.3 },
      escalation: "Contact the ground medical team now: expect about 3 seconds per question and answer.",
      radiation: "No magnetic field or atmosphere: during a solar storm, go to the shielded area."
    },
    mars: {
      id: "mars",
      name: "Mars mission",
      shortName: "Mars",
      delay: "3 to 22 minutes each way",
      delaySeconds: { min: 180, max: 1320 },
      escalation: "The crew medical officer leads the response. The ground team can take 6 to 44 minutes to reply, so do not wait for them.",
      radiation: "No global magnetic field and a thin atmosphere: during a solar storm, go to the shielded area."
    }
  };

  // ------------------------------------------------------------
  // 3. Remember the choice
  // ------------------------------------------------------------
  function readSaved() {
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      return ENVIRONMENTS[id] ? id : DEFAULT_ID;
    } catch (e) {
      return DEFAULT_ID;
    }
  }

  function save(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) { /* if the browser does not allow saving, ignore it */ }
  }

  let currentId = readSaved();

  // ------------------------------------------------------------
  // 4. Public functions
  // ------------------------------------------------------------
  function current() {
    return ENVIRONMENTS[currentId];
  }

  function list() {
    return Object.values(ENVIRONMENTS);
  }

  function set(id) {
    if (!ENVIRONMENTS[id]) {
      console.warn("[KUXTAL environment] Unknown environment:", id);
      return;
    }
    currentId = id;
    save(id);
    show();
    // Tell the other files (radiation alert, rules, charts...)
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: current() }));
    }
  }

  // ------------------------------------------------------------
  // 5. Draw it on the page
  // ------------------------------------------------------------
  function infoHtml(env) {
    return '<ul style="margin:6px 0;padding-left:18px">' +
        "<li><strong>Communication delay with Earth:</strong> " + env.delay + "</li>" +
        "<li><strong>If a result is red:</strong> " + env.escalation + "</li>" +
        "<li><strong>Radiation:</strong> " + env.radiation + "</li>" +
      "</ul>";
  }

  function show() {
    if (typeof document === "undefined") return;
    const env = current();

    // Info only, for pages that already have their own menu
    const infoBox = document.getElementById(INFO_ID);
    if (infoBox) infoBox.innerHTML = infoHtml(env);

    const box = document.getElementById(CONTAINER_ID);
    if (!box) return;

    let options = "";
    for (const e of list()) {
      const selected = e.id === env.id ? " selected" : "";
      options += '<option value="' + e.id + '"' + selected + ">" + e.name + "</option>";
    }

    box.innerHTML =
      '<label for="environment-select"><strong>Mission environment:</strong></label> ' +
      '<select id="environment-select">' + options + "</select>" +
      infoHtml(env);

    document.getElementById("environment-select")
      .addEventListener("change", e => set(e.target.value));
  }

  // Draw it by itself when the page opens
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", show);
  }

  return {
    current: current,
    list: list,
    set: set,
    EVENT_NAME: EVENT_NAME
  };
})();
