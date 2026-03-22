(function () {
  const PROJECT_ID = "gen-lang-client-0981823570";
  const DATABASE_ID = "ai-studio-3c3a76c9-3737-49fe-9a9b-af0c8081da8b";
  const API_KEY = "AIzaSyAFIQ7FREzbrb31TyWz5rTMK_QPjTvIHk0";
  const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:runQuery?key=${API_KEY}`;

  const scriptTag =
    document.currentScript ||
    document.querySelector('script[src*="ticker.js"]');
  if (!scriptTag) return;

  const siteId = scriptTag.getAttribute("data-site-id");
  if (!siteId) return;

  const SEED_NAMES = [
    "Alex",
    "Maria",
    "James",
    "Sara",
    "Luca",
    "Emma",
    "Noah",
    "Priya",
  ];
  const SEED_CITIES = [
    "Austin",
    "London",
    "Berlin",
    "Lagos",
    "Toronto",
    "Sydney",
    "Dubai",
    "Paris",
  ];

  async function fetchFirestore(collectionId) {
    console.log(`Poplo: Fetching ${collectionId} for siteId: ${siteId}`);
    const res = await fetch(FIRESTORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            fieldFilter: {
              field: { fieldPath: "siteId" },
              op: "EQUAL",
              value: { stringValue: siteId },
            },
          },
        },
      }),
    });
    if (!res.ok) {
      console.error(`Poplo: Failed to fetch ${collectionId}`, await res.text());
      return [];
    }
    const data = await res.json();
    console.log(`Poplo: Raw response for ${collectionId}:`, data);
    return data
      .filter((d) => d.document)
      .map((d) => parseFirestoreDocument(d.document));
  }

  function parseFirestoreDocument(doc) {
    const result = {};
    for (const [key, val] of Object.entries(doc.fields || {})) {
      if ("stringValue" in val) result[key] = val.stringValue;
      else if ("integerValue" in val)
        result[key] = parseInt(val.integerValue, 10);
      else if ("doubleValue" in val) result[key] = parseFloat(val.doubleValue);
      else if ("booleanValue" in val) result[key] = val.booleanValue;
      else if ("timestampValue" in val) result[key] = val.timestampValue;
      else if ("nullValue" in val) result[key] = null;
    }
    return result;
  }

  async function init() {
    try {
      // Fetch config
      const configData = await fetchFirestore("site_configs");
      let config = {
        position: "bottom-left",
        messageTemplate: "{{name}} from {{city}} just signed up",
        delaySeconds: 3,
        intervalSeconds: 8,
        theme: "light",
        minDaily: 5,
        maxDaily: 20
      };

      if (configData && configData.length > 0) {
        config = { ...config, ...configData[0] };
      } else {
        console.warn("Poplo: No configuration found for this site. Using default configuration.");
      }

      // Fetch events
      let events = await fetchFirestore("notification_events");

      // Sort events by createdAt descending
      events.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      // If no events, check if we should use seed data
      if (!events || events.length === 0) {
        const minDaily = config.minDaily !== undefined ? config.minDaily : 5;
        const maxDaily = config.maxDaily !== undefined ? config.maxDaily : 20;
        
        if (maxDaily > 0) {
          // Generate fake events
          const count =
            Math.floor(
              Math.random() * (maxDaily - minDaily + 1),
            ) + minDaily;
          events = Array.from({ length: Math.max(1, count) }).map(() => ({
            name: SEED_NAMES[Math.floor(Math.random() * SEED_NAMES.length)],
            city: SEED_CITIES[Math.floor(Math.random() * SEED_CITIES.length)],
            action: "signed up",
            timestamp: "just now",
          }));
        } else {
          console.warn("Poplo: No events found and seed data is disabled (maxDaily is 0).");
          return; // No data and seed config disabled
        }
      }

      if (!events || events.length === 0) {
        console.warn("Poplo: No events to display.");
        return;
      }

      console.log("Poplo: Rendering ticker with config:", config);
      console.log("Poplo: Rendering ticker with events:", events);
      renderTicker(config, events);
    } catch (e) {
      // Exit silently on error
      console.error("Ticker error:", e);
    }
  }

  function renderTicker(config, events) {
    const position = config.position || "bottom-left";
    const template =
      config.messageTemplate || "{{name}} from {{city}} just signed up";
    const delayMs = (config.delaySeconds !== undefined ? config.delaySeconds : 3) * 1000;
    const intervalMs = (config.intervalSeconds !== undefined ? config.intervalSeconds : 8) * 1000;
    const theme = config.theme || "light";

    // Create container
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      ${position === "bottom-left" ? "left: 24px;" : "right: 24px;"}
      background: ${theme === "dark" ? "#1C1917" : "#FFFFFF"};
      border: 1px solid ${theme === "dark" ? "#1C1917" : "#EDE8DF"};
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 8px 32px rgba(28,25,23,0.10);
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 320px;
      font-family: "DM Sans", sans-serif;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 400ms ease, transform 400ms ease;
    `;

    // Inner structure
    const iconBox = document.createElement("div");
    iconBox.style.cssText = `
      width: 40px;
      height: 40px;
      background: #C1572B;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #FFFFFF;
      font-size: 18px;
      font-weight: bold;
    `;

    const textBox = document.createElement("div");
    textBox.style.cssText = `
      display: flex;
      flex-direction: column;
      text-align: left;
    `;

    const nameText = document.createElement("span");
    nameText.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: ${theme === "dark" ? "#FFFFFF" : "#1C1917"};
      line-height: 1.2;
    `;

    const subText = document.createElement("span");
    subText.style.cssText = `
      font-size: 11px;
      color: ${theme === "dark" ? "rgba(255,255,255,0.7)" : "#7A7168"};
      margin-top: 2px;
    `;

    const dotContainer = document.createElement("div");
    dotContainer.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      width: 6px;
      height: 6px;
    `;

    const dotPulse = document.createElement("span");
    dotPulse.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: #7CB98A;
      border-radius: 50%;
      opacity: 0.75;
      animation: poplo-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    `;

    const dotSolid = document.createElement("span");
    dotSolid.style.cssText = `
      position: relative;
      display: block;
      width: 6px;
      height: 6px;
      background: #7CB98A;
      border-radius: 50%;
    `;

    // Add keyframes for pulse if not exists
    if (!document.getElementById("poplo-keyframes")) {
      const style = document.createElement("style");
      style.id = "poplo-keyframes";
      style.textContent = `
        @keyframes poplo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(2); }
        }
      `;
      document.head.appendChild(style);
    }

    dotContainer.appendChild(dotPulse);
    dotContainer.appendChild(dotSolid);

    textBox.appendChild(nameText);
    textBox.appendChild(subText);

    container.appendChild(iconBox);
    container.appendChild(textBox);
    container.appendChild(dotContainer);

    document.body.appendChild(container);

    let currentIndex = 0;

    function showNext() {
      const event = events[currentIndex];

      // Update content
      const msg = template
        .replace(/{{name}}/gi, event.name || "Someone")
        .replace(/{{city}}/gi, event.city || "somewhere");

      nameText.textContent = msg;
      subText.textContent = event.timestamp || "just now";
      iconBox.textContent = (
        event.name ? event.name.charAt(0) : "👋"
      ).toUpperCase();

      // Fade in
      container.style.opacity = "1";
      container.style.transform = "translateY(0)";

      // Wait 4 seconds, then fade out
      setTimeout(() => {
        container.style.transition = "opacity 300ms ease, transform 300ms ease";
        container.style.opacity = "0";
        container.style.transform = "translateY(8px)";

        // Wait interval, then show next
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % events.length;
          container.style.transition =
            "opacity 400ms ease, transform 400ms ease";
          showNext();
        }, intervalMs);
      }, 4000);
    }

    // Start cycle
    setTimeout(showNext, delayMs);
  }

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
