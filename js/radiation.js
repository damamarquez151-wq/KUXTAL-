/*
 * KUXTAL - Radiation alert using NASA space weather data (DONKI)
 * Author: Jesus (Data and NASA integration)
 *
 * Sources:
 *   - DONKI, NASA Community Coordinated Modeling Center (CCMC)
 *     https://ccmc.gsfc.nasa.gov/DONKI/
 *   - Canadian Space Agency (CSA), "Monitoring radiation for astronaut health"
 *     https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
 *   Both links are shown under the alert.
 *
 * What it does:
 *   1. Requests the solar events of the last few days from DONKI:
 *      - SEP: solar energetic particles (radiation)    -> RED
 *      - FLR: solar flares of class M or X             -> YELLOW
 *      - GST: geomagnetic storms with Kp 5 or higher   -> YELLOW
 *   2. Decides the overall level: green, yellow or red.
 *   3. Shows the alert inside <div id="radiation-alert"></div>.
 *
 * Offline (requirement RNF-01):
 *   - Uses the last response saved in localStorage, or
 *   - if nothing was ever saved, uses data/simulated_events.json
 *     (and labels it as "Simulated data").
 *
 * How to use it in a page:
 *   <div id="radiation-alert"></div>
 *   <script src="js/radiation.js"></script>
 *   It runs by itself when the page loads.
 *
 * If js/environment.js is also on the page, yellow and red alerts add
 * the radiation advice for the chosen environment (ISS, Moon or Mars).
 *
 * For the demo (force the simulated storm even if there is none today):
 *   Radiation.load({ forceSimulated: true });
 *
 * Everything lives inside the "Radiation" object so it does not
 * clash with the functions written by other team members.
 */

const Radiation = (function () {

  // ------------------------------------------------------------
  // 1. Settings
  // ------------------------------------------------------------
  // Since September 30, 2026 DONKI is no longer served on
  // api.nasa.gov: it moved to NASA's CCMC and needs NO API key.
  // Official notice: https://ccmc.gsfc.nasa.gov/news/major-updates/
  // (same parameters and same JSON format; at most 60 days per request)
  const BASE_URL = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/";
  const DAYS_BACK = 7;                  // how many days to check
  const CACHE_MINUTES = 60;             // do not ask again before this
  const CACHE_KEY = "kuxtal_radiation";
  const SIMULATED_PATH = "data/simulated_events.json";
  const CONTAINER_ID = "radiation-alert";

  // Official resources shown under the alert (NASA + partner agency CSA)
  const RESOURCES = [
    { name: "NASA DONKI (space weather data)",
      url: "https://ccmc.gsfc.nasa.gov/DONKI/" },
    { name: "CSA: Monitoring radiation for astronaut health",
      url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" }
  ];

  const MESSAGES = {
    red: "Solar radiation storm: go to the shielded area now and notify the crew medical officer.",
    yellow: "Elevated solar activity: avoid spacewalks and keep your dosimeter on.",
    green: "No solar radiation events in the last " + DAYS_BACK + " days."
  };

  // ------------------------------------------------------------
  // 2. Date helpers
  // ------------------------------------------------------------
  // Returns "2026-11-14" (the format DONKI expects)
  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function dateRange() {
    const today = new Date();
    const start = new Date(today.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000);
    return { start: formatDate(start), end: formatDate(today) };
  }

  // ------------------------------------------------------------
  // 3. Request data from DONKI
  // ------------------------------------------------------------
  async function requestDonki(type, range) {
    const url = BASE_URL + type +
      "?startDate=" + range.start +
      "&endDate=" + range.end;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("DONKI " + type + " answered " + response.status);
    }
    const text = await response.text();
    // When there are no events, DONKI sometimes answers with nothing
    if (text.trim() === "") return [];
    // If it answers with a web page instead of data, treat it as an error
    if (text.trim()[0] === "<") {
      throw new Error("DONKI " + type + " did not answer with JSON");
    }
    return JSON.parse(text);
  }

  // ------------------------------------------------------------
  // 4. Turn DONKI responses into a simple list
  //    Each event: { type, date, level, detail, link }
  // ------------------------------------------------------------
  function sepEvents(list) {
    return list.map(e => ({
      type: "SEP",
      date: e.eventTime,
      level: "red",
      detail: "Solar energetic particles (radiation)",
      link: e.link
    }));
  }

  function flareEvents(list) {
    // Only strong flares count: class M or X
    return list
      .filter(e => e.classType && (e.classType[0] === "M" || e.classType[0] === "X"))
      .map(e => ({
        type: "FLR",
        date: e.peakTime || e.beginTime,
        level: "yellow",
        detail: "Solar flare class " + e.classType,
        link: e.link
      }));
  }

  function stormEvents(list) {
    // Strong geomagnetic storm: Kp index of 5 or higher
    const result = [];
    for (const e of list) {
      const kps = (e.allKpIndex || []).map(k => k.kpIndex);
      const maxKp = kps.length > 0 ? Math.max(...kps) : 0;
      if (maxKp >= 5) {
        result.push({
          type: "GST",
          date: e.startTime,
          level: "yellow",
          detail: "Geomagnetic storm (Kp " + maxKp + ")",
          link: e.link
        });
      }
    }
    return result;
  }

  // ------------------------------------------------------------
  // 5. Decide the overall level (the worst of all events)
  // ------------------------------------------------------------
  function overallLevel(events) {
    if (events.some(e => e.level === "red")) return "red";
    if (events.some(e => e.level === "yellow")) return "yellow";
    return "green";
  }

  function buildResult(events, origin) {
    // Most recent first
    events.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const level = overallLevel(events);
    return {
      level: level,
      message: MESSAGES[level],
      events: events,
      origin: origin,                     // "nasa", "cache" or "simulated"
      updated: new Date().toISOString()
    };
  }

  // ------------------------------------------------------------
  // 6. Save and read the last response (to work offline)
  // ------------------------------------------------------------
  function saveCache(result) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (e) { /* if the browser does not allow saving, ignore it */ }
  }

  function readCache() {
    try {
      const text = localStorage.getItem(CACHE_KEY);
      return text ? JSON.parse(text) : null;
    } catch (e) {
      return null;
    }
  }

  function minutesSince(isoDate) {
    return (Date.now() - new Date(isoDate).getTime()) / 60000;
  }

  // ------------------------------------------------------------
  // 7. Fallback: simulated events (data/simulated_events.json)
  // ------------------------------------------------------------
  async function loadSimulated() {
    let list = [];
    try {
      const r = await fetch(SIMULATED_PATH);
      list = await r.json();
    } catch (e) {
      // If even the file cannot be read, use one fixed example storm
      list = [{ date: "2026-11-12", type: "SEP", level: "red",
                message: MESSAGES.red, simulated: true }];
    }
    const events = list.map(e => ({
      type: e.type,
      date: e.date,
      level: e.level,
      detail: "Simulated event",
      link: null
    }));
    return buildResult(events, "simulated");
  }

  // ------------------------------------------------------------
  // 8. Main function
  // ------------------------------------------------------------
  async function get(options) {
    options = options || {};

    if (options.forceSimulated) {
      return loadSimulated();
    }

    // If we asked recently, use the saved answer (saves requests)
    const cache = readCache();
    if (cache && cache.origin === "nasa" &&
        minutesSince(cache.updated) < CACHE_MINUTES) {
      return cache;
    }

    try {
      const range = dateRange();
      // The 3 requests at the same time
      const [sep, flr, gst] = await Promise.all([
        requestDonki("SEP", range),
        requestDonki("FLR", range),
        requestDonki("GST", range)
      ]);
      const events = [
        ...sepEvents(sep),
        ...flareEvents(flr),
        ...stormEvents(gst)
      ];
      const result = buildResult(events, "nasa");
      saveCache(result);
      return result;
    } catch (error) {
      console.warn("[KUXTAL radiation] Cannot reach DONKI:", error.message);
      if (cache) {
        cache.origin = "cache";
        return cache;
      }
      return loadSimulated();
    }
  }

  // ------------------------------------------------------------
  // 9. Show it on the page
  // ------------------------------------------------------------
  const COLORS = { green: "#2e9e5b", yellow: "#e0a800", red: "#d63b3b" };
  // Links take the page text color, so they read well on light or dark backgrounds
  const LINK_STYLE = "color:inherit;text-decoration:underline";
  const TITLES = { green: "Radiation: normal", yellow: "Radiation: caution", red: "Radiation alert" };

  function resourcesHtml() {
    const links = RESOURCES.map(r =>
      '<a href="' + r.url + '" target="_blank" rel="noopener" style="' + LINK_STYLE + '">' + r.name + "</a>");
    return '<small style="display:block;margin-top:4px">Learn more: ' + links.join(" · ") + "</small>";
  }

  function originText(result) {
    const time = new Date(result.updated).toLocaleString("en-US");
    if (result.origin === "nasa") return "Source: NASA DONKI (live) · " + time;
    if (result.origin === "cache") return "Offline: last NASA DONKI data from " + time;
    return "Simulated data (offline demo)";
  }

  // The last result shown, so it can be redrawn when the environment changes
  let lastResult = null;

  // If environment.js is on the page, add its radiation advice
  function environmentNote() {
    if (typeof Environment === "undefined") return "";
    const env = Environment.current();
    return '<p style="margin:4px 0"><em>' + env.shortName + ": " + env.radiation + "</em></p>";
  }

  function show(result) {
    lastResult = result;
    if (typeof document === "undefined") return;
    const box = document.getElementById(CONTAINER_ID);
    if (!box) return;

    const color = COLORS[result.level];
    let items = "";
    for (const e of result.events.slice(0, 5)) {
      const date = (e.date || "").replace("T", " ").replace("Z", " UTC");
      const name = e.link
        ? '<a href="' + e.link + '" target="_blank" rel="noopener" style="' + LINK_STYLE + '">' + e.detail + "</a>"
        : e.detail;
      items += "<li>" + date + " · " + name + "</li>";
    }

    box.innerHTML =
      '<div style="border-left:6px solid ' + color + ';padding:8px 12px;margin:8px 0;">' +
        '<strong style="color:' + color + '">' + TITLES[result.level] + "</strong>" +
        "<p style=\"margin:4px 0\">" + result.message + "</p>" +
        (result.level === "green" ? "" : environmentNote()) +
        (items ? "<ul style=\"margin:4px 0;padding-left:18px\">" + items + "</ul>" : "") +
        '<small style="opacity:.7">' + originText(result) + "</small>" +
        resourcesHtml() +
      "</div>";
  }

  async function load(options) {
    const result = await get(options);
    show(result);
    console.log("[KUXTAL radiation]", result);
    return result;
  }

  // Run by itself when the page opens
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => load());
    // Redraw the alert when the mission environment changes
    window.addEventListener("kuxtal:environment-change", () => {
      if (lastResult) show(lastResult);
    });
  }

  // What the other files can use
  return {
    load: load,              // gets the data and shows it
    get: get,                // only gets the data (returns the result)
    overallLevel: overallLevel,
    RESOURCES: RESOURCES,
    _internal: { sepEvents, flareEvents, stormEvents, buildResult }
  };
})();
