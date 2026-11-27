/* Marka website: fills in the current version, size, fingerprint and release notes from latest.json / releases.json,
   which the release script (tools/publish_release.sh) writes. The page reads fine without them. */
(function () {
  if (/[?&]light/.test(location.search)) document.documentElement.setAttribute("data-theme", "light");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function size(bytes) { return bytes >= 1e6 ? (bytes / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1e3)) + " KB"; }
  function date(iso) {
    var d = new Date(String(iso).slice(0, 10) + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function set(sel, text) { $$(sel).forEach(function (n) { n.textContent = text; }); }

  fetch("latest.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (m) {
    set("[data-version]", m.versionName);
    set("[data-version-short]", "v" + m.versionName);
    if (m.sizeBytes) set("[data-size]", size(m.sizeBytes));
    if (m.releasedAt) set("[data-date]", date(m.releasedAt));
    if (m.sha256) set("[data-sha]", m.sha256);
    if (m.apkUrl && /^https:\/\//.test(m.apkUrl)) {
      var b = $("#download-btn"); if (b) b.href = m.apkUrl;
    }
  }).catch(function () { set("[data-sha]", "Unavailable right now. Please try again later."); });

  fetch("releases.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (list) {
    var box = $("#releases");
    if (!list || !list.length) { box.innerHTML = '<p class="muted">No releases yet.</p>'; return; }
    box.innerHTML = list.map(function (r, i) {
      return '<article class="release"><div class="release-head"><h3>Marka ' + esc(r.versionName) + "</h3>" +
        (i === 0 ? '<span class="tag">Latest</span>' : "") +
        (r.releasedAt ? "<time>" + esc(date(r.releasedAt)) + "</time>" : "") + "</div><ul>" +
        (r.notes || []).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></article>";
    }).join("");
  }).catch(function () { $("#releases").innerHTML = '<p class="muted">Release notes could not be loaded.</p>'; });

  // Reveal on scroll (everything is simply visible when motion is reduced or the browser has no observer).
  var items = $$(".reveal");
  var calm = (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || /[?&]static/.test(location.search);
  if (!("IntersectionObserver" in window) || calm) { items.forEach(function (n) { n.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(function (n) { io.observe(n); });
})();

/* The Marka logo returns to the top of the home page (the header is sticky, so a plain #top link does nothing). */
(function () {
  var b = document.querySelector("a.brand");
  if (!b) return;
  b.addEventListener("click", function (e) {
    var home = !/tour\.html|tutorials\.html/.test(location.pathname);
    if (!home) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    try { history.replaceState(null, "", location.pathname + location.search); } catch (err) {}
  });
})();

/* Screens showcase: tabs switch the large phone; it advances by itself until the visitor picks one. */
(function () {
  var box = document.getElementById("showcase");
  if (!box) return;
  var tabs = Array.prototype.slice.call(box.querySelectorAll(".sc-tab"));
  var imgs = Array.prototype.slice.call(box.querySelectorAll(".sc-img"));
  var cap = document.getElementById("sc-caption");
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = 0, timer = null, touched = false;
  function show(i, user) {
    cur = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) { var on = k === cur; t.classList.toggle("on", on); t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
    imgs.forEach(function (m, k) { m.classList.toggle("on", k === cur); });
    var d = tabs[cur].querySelector(".sc-b span"); if (cap && d) cap.textContent = d.textContent;
    if (user) { touched = true; stop(); var t = tabs[cur]; if (t.scrollIntoView && window.innerWidth <= 860) t.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); }
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() { if (calm || touched || timer) return; timer = setInterval(function () { if (!document.hidden) show(cur + 1, false); }, 5000); }
  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () { show(k, true); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (n) { e.preventDefault(); show(cur + n, true); tabs[cur].focus(); }
    });
  });
  box.addEventListener("mouseenter", stop);
  box.addEventListener("mouseleave", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) start(); else stop(); }); }, { threshold: 0.4 }).observe(box);
  } else start();
  show(0, false);
})();
