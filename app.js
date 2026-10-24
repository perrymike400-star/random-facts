(function () {
  "use strict";

  var FACTS = window.FACTS.map(function (f, i) { return { id: i, c: f.c, t: f.t }; });
  var CATS = window.CATEGORIES;
  var catById = {};
  CATS.forEach(function (c) { catById[c.id] = c; });

  var main = document.getElementById("main");
  var toastEl = document.getElementById("toast");

  // ---------- storage (safe if blocked) ----------
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }
  var saved = load("dyk-saved", []);

  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }
  function isSaved(id) { return saved.indexOf(id) !== -1; }
  function toggleSaved(id) {
    var i = saved.indexOf(id);
    if (i === -1) saved.push(id); else saved.splice(i, 1);
    save("dyk-saved", saved);
    updateSavedCount();
    return i === -1;
  }
  function updateSavedCount() {
    var el = document.getElementById("savedCount");
    el.textContent = saved.length;
    el.hidden = saved.length === 0;
  }
  function pickRandom(excludeId, pool) {
    pool = pool || FACTS;
    if (pool.length === 1) return pool[0];
    var f;
    do { f = pool[Math.floor(Math.random() * pool.length)]; } while (f.id === excludeId);
    return f;
  }
  function factOfTheDay() {
    var d = new Date();
    var n = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return FACTS[n % FACTS.length];
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast("Copied to clipboard"); }, function () { toast("Could not copy"); });
    }
    toast("Copy not supported in this browser");
  }
  function shareText(f) { return f.t + " (Did You Know? " + location.href.split("#")[0] + ")"; }
  function share(f) {
    if (navigator.share) {
      navigator.share({ title: "Did you know?", text: f.t, url: location.href.split("#")[0] }).catch(function () {});
    } else {
      copyText(shareText(f));
    }
  }

  // ---------- views ----------
  function factCard(f, label) {
    return (
      '<article class="fact-card" data-fact="' + f.id + '">' +
        '<a class="tag" href="#category/' + f.c + '">' + esc(catById[f.c].name) + '</a>' +
        (label ? ' <span class="tag" style="background:none;color:var(--muted)">' + esc(label) + '</span>' : '') +
        '<p class="text">' + esc(f.t) + '</p>' +
        '<div class="actions">' +
          '<button class="btn" type="button" data-act="save" aria-pressed="' + isSaved(f.id) + '">' + (isSaved(f.id) ? "★ Saved" : "☆ Save") + '</button>' +
          '<button class="btn" type="button" data-act="copy">Copy</button>' +
          '<button class="btn" type="button" data-act="share">Share</button>' +
        '</div>' +
      '</article>'
    );
  }

  function viewHome() {
    var f = pickRandom();
    var today = factOfTheDay();
    main.innerHTML =
      '<section class="hero">' +
        '<h1>Did you know?</h1>' +
        '<p class="lede">Small, surprising facts from science, space, animals, history, math and more. Tap the button for another.</p>' +
      '</section>' +
      '<div id="randomSlot">' + factCard(f) + '</div>' +
      '<div class="actions"><button id="another" class="btn primary">Show me another ↻</button> <a class="btn" href="#facts">Browse by topic</a></div>' +
      '<h2 style="margin-top:40px">Fact of the day</h2>' +
      factCard(today, "Changes daily") +
      '<h2 style="margin-top:40px">Topics</h2>' +
      catGrid();
    var current = f;
    document.getElementById("another").addEventListener("click", function () {
      current = pickRandom(current.id);
      var slot = document.getElementById("randomSlot");
      slot.innerHTML = factCard(current);
      slot.firstChild.classList.add("flip");
    });
  }

  function catGrid() {
    return '<div class="grid">' + CATS.map(function (c) {
      var n = FACTS.filter(function (f) { return f.c === c.id; }).length;
      return '<a class="cat" href="#category/' + c.id + '"><h3>' + esc(c.name) + '</h3><p>' + esc(c.blurb) + '</p><small>' + n + ' facts</small></a>';
    }).join("") + '</div>';
  }

  function listItems(list) {
    if (!list.length) return '<p class="empty">Nothing here yet.</p>';
    return '<ul class="list">' + list.map(function (f) {
      return '<li data-fact="' + f.id + '"><div><p>' + esc(f.t) + '</p><a class="tag" href="#category/' + f.c + '">' + esc(catById[f.c].name) + '</a></div>' +
        '<button class="star" type="button" data-act="star" aria-pressed="' + isSaved(f.id) + '" aria-label="Save this fact">' + (isSaved(f.id) ? "★" : "☆") + '</button></li>';
    }).join("") + '</ul>';
  }

  function viewBrowse() {
    main.innerHTML =
      '<h1>Browse</h1><p class="lede">Pick a topic, or search all ' + FACTS.length + ' facts.</p>' +
      catGrid() +
      '<div class="toolbar"><input id="q" type="search" placeholder="Search facts…" aria-label="Search facts"></div>' +
      '<div id="results" aria-live="polite"></div>';
    var q = document.getElementById("q");
    var results = document.getElementById("results");
    function run() {
      var term = q.value.trim().toLowerCase();
      if (!term) { results.innerHTML = ""; return; }
      var hits = FACTS.filter(function (f) { return f.t.toLowerCase().indexOf(term) !== -1; });
      results.innerHTML = '<h2>' + hits.length + ' result' + (hits.length === 1 ? "" : "s") + '</h2>' + (hits.length ? listItems(hits) : '<p class="empty">No facts match that search. Try a broader word.</p>');
    }
    q.addEventListener("input", run);
  }

  function viewCategory(id) {
    var c = catById[id];
    if (!c) return viewNotFound();
    var list = FACTS.filter(function (f) { return f.c === id; });
    main.innerHTML =
      '<p class="crumbs"><a href="#facts">Browse</a> / ' + esc(c.name) + '</p>' +
      '<h1>' + esc(c.name) + '</h1><p class="lede">' + esc(c.blurb) + '</p>' +
      '<div class="actions" style="margin:16px 0"><button id="randomIn" class="btn primary">Random from ' + esc(c.name) + ' ↻</button></div>' +
      '<div id="randomSlot"></div>' +
      listItems(list);
    var cur = null;
    document.getElementById("randomIn").addEventListener("click", function () {
      cur = pickRandom(cur && cur.id, list);
      var slot = document.getElementById("randomSlot");
      slot.innerHTML = factCard(cur);
      slot.firstChild.classList.add("flip");
    });
  }

  function viewSaved() {
    var list = saved.map(function (id) { return FACTS[id]; }).filter(Boolean);
    main.innerHTML =
      '<h1>Saved</h1><p class="lede">Facts you starred are kept in this browser only.</p>' +
      (list.length ? listItems(list) : '<p class="empty">No saved facts yet. Tap ☆ on any fact to keep it here.</p>');
  }

  function viewAbout() {
    main.innerHTML =
      '<h1>About</h1>' +
      '<p class="lede">A small, free, static website of surprising facts. It has no tracking, no ads and no server.</p>' +
      '<p>Facts are written to be short and checkable. Where a topic is still debated by scientists, the fact says so. If you spot a mistake, please report it so it can be fixed.</p>' +
      '<p>Your saved facts and theme choice stay in your own browser.</p>' +
      '<p><a class="btn primary" href="#home">Back to home</a></p>';
  }

  function viewNotFound() {
    main.innerHTML = '<h1>Page not found</h1><p class="lede">That page does not exist.</p><p><a class="btn primary" href="#home">Go home</a></p>';
  }

  // ---------- routing ----------
  function route() {
    var hash = location.hash.replace(/^#/, "") || "home";
    var parts = hash.split("/");
    var base = parts[0];
    if (base === "home") viewHome();
    else if (base === "facts") viewBrowse();
    else if (base === "category") viewCategory(parts[1]);
    else if (base === "saved") viewSaved();
    else if (base === "about") viewAbout();
    else viewNotFound();

    var navKey = base === "category" ? "facts" : base;
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === navKey) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
    document.title = (base === "home" ? "" : base.charAt(0).toUpperCase() + base.slice(1) + " | ") + "Did You Know? Random Facts";
  }

  // ---------- events (delegated) ----------
  main.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var holder = btn.closest("[data-fact]");
    var f = FACTS[Number(holder.getAttribute("data-fact"))];
    var act = btn.getAttribute("data-act");
    if (act === "copy") copyText(f.t);
    else if (act === "share") share(f);
    else if (act === "save" || act === "star") {
      var now = toggleSaved(f.id);
      btn.setAttribute("aria-pressed", String(now));
      if (act === "save") btn.textContent = now ? "★ Saved" : "☆ Save";
      else btn.textContent = now ? "★" : "☆";
      toast(now ? "Saved" : "Removed from saved");
      if (location.hash === "#saved" && !now) viewSaved();
    }
  });

  // theme
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    document.getElementById("themeBtn").setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", t === "dark" ? "#171411" : "#f6f2ea");
  }
  var theme = load("dyk-theme", null) || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  document.getElementById("themeBtn").addEventListener("click", function () {
    theme = theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    save("dyk-theme", theme);
    toast(theme === "dark" ? "Dark theme on" : "Light theme on");
  });

  document.getElementById("factTotal").textContent = FACTS.length + " facts and counting.";
  updateSavedCount();
  window.addEventListener("hashchange", route);
  route();
})();
