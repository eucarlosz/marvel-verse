/* =========================================================
   MARVEL VERSE — Consumo da API e criação dinâmica dos cards
   ---------------------------------------------------------
   API: SuperHero API (akabab) — gratuita, sem token e com CORS liberado.
   Os personagens são filtrados para a editora "Marvel Comics".
   ========================================================= */

const API_URL = "https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/all.json";
const PUBLISHER = "Marvel Comics";
const PAGE_SIZE = 12;

// Personagens Marvel que a API registra com outra editora por engano (ex.: Thor = "Rune King Thor")
const EXTRA_MARVEL_IDS = [659];

// Estado da aplicação
const state = {
  all: [],        // todos os personagens Marvel vindos da API
  filtered: [],   // resultado após busca/filtro/ordenação
  shown: 0,       // quantos cards já estão na tela
  filter: "all",
  sort: "name",
  query: "",
};

// Referências do DOM
const el = {
  nav: document.getElementById("nav"),
  menuBtn: document.getElementById("menu-btn"),
  navLinks: document.getElementById("nav-links"),
  cards: document.getElementById("cards"),
  carousel: document.getElementById("carousel"),
  hero3d: document.getElementById("hero-3d"),
  scene: document.getElementById("scene"),
  search: document.getElementById("search"),
  filters: document.getElementById("filters"),
  sort: document.getElementById("sort"),
  loadMore: document.getElementById("load-more"),
  info: document.getElementById("result-info"),
};

// Traduções
const ALIGN = { good: "Herói", bad: "Vilão", neutral: "Neutro" };
const GENDER = { Male: "Masculino", Female: "Feminino" };
const STATS = {
  intelligence: "Inteligência",
  strength: "Força",
  speed: "Velocidade",
  durability: "Resistência",
  power: "Poder",
  combat: "Combate",
};

// Imagem reserva caso alguma imagem da API falhe
const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#14141c"/><text x="150" y="210" font-family="Arial" font-size="90" fill="#e62429" text-anchor="middle">?</text></svg>`
  );

// Pasta local com as imagens baixadas (assets/images/346-iron-man.jpg, por exemplo)
const LOCAL_IMG_DIR = "assets/images/";
const LOCAL_IMAGES = {
  149: "149-captain-america.webp",
  332: "332-hulk.webp",
  346: "346-iron-man.png",
  423: "423-magneto.webp",
  620: "620-spider-man.png",
  655: "655-thanos.png",
  659: "659-thor.jpg",
  717: "717-wolverine.jpg",
};

/*
  Define a imagem do personagem:
  1º tenta a imagem local (pasta assets/images/)
  2º se não existir, usa o link da API
  3º se também falhar, mostra a imagem reserva "?"
*/
function setCharacterImage(img, character) {
  const remote = character.images?.md || character.images?.sm || FALLBACK_IMG;
  // O slug da API já inclui o id (ex.: "346-iron-man"), então não repetimos o id
  const local = LOCAL_IMAGES[character.id] ? LOCAL_IMG_DIR + LOCAL_IMAGES[character.id] : remote;
  let step = 0;

  img.addEventListener("error", () => {
    step++;
    if (step === 1) img.src = remote;
    else if (step === 2) img.src = FALLBACK_IMG;
  });

  img.decoding = "async";
  img.src = local;
}

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover)").matches && !prefersReducedMotion;

/* ---------- Utilitários ---------- */
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const clean = (value, fallback = "Desconhecido") =>
  !value || value === "-" || value === "null" ? fallback : value;

const totalPower = (character) =>
  Object.values(character.powerstats ?? {}).reduce((sum, v) => sum + (Number(v) || 0), 0);

const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

/* ---------- 1. Consumo da API ---------- */
async function fetchCharacters() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(API_URL, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("A API retornou um formato inesperado.");

  return data
    .filter((character) => character?.biography?.publisher === PUBLISHER || EXTRA_MARVEL_IDS.includes(character?.id))
    .filter((character) => typeof character.name === "string" && character.id != null)
    .map((character) => ({ ...character, total: totalPower(character) }));
}

/* ---------- 2. Criação automática do CARD ---------- */
function createCard(c) {
  const card = document.createElement("article");
  card.className = "card";


  const alignment = c.biography?.alignment in ALIGN ? c.biography.alignment : "neutral";
  const gender = GENDER[c.appearance?.gender] || "Desconhecido";
  const race = clean(c.appearance?.race, "Desconhecida");
  const height = clean(c.appearance?.height?.[1], "—");
  const fullName = clean(c.biography?.fullName, c.name);
  const firstAppearance = clean(c.biography?.firstAppearance, "Não informada");
  const base = clean(c.work?.base, "Não informada");

  const bars = Object.entries(STATS)
    .map(([key, label]) => {
      const v = Math.max(0, Math.min(100, Number(c.powerstats?.[key]) || 0));
      return `
        <li>
          <div class="bar-label"><span>${label}</span><strong>${v}</strong></div>
          <div class="bar"><i style="--v:${v}"></i></div>
        </li>`;
    })
    .join("");

  card.innerHTML = `
    <button type="button" class="card-toggle" aria-label="Ver atributos de ${escapeHTML(c.name)}" aria-pressed="false">
    <div class="card-inner">
      <!-- FRENTE -->
      <div class="card-face card-front">
        <div class="card-img">
          <img alt="${escapeHTML(c.name)}" loading="lazy">
          <span class="badge ${alignment}">${ALIGN[alignment]}</span>
          <span class="card-id">#${String(c.id).padStart(3, "0")}</span>
        </div>
        <div class="card-body">
          <h3>${escapeHTML(c.name)}</h3>
          <p class="fullname">${escapeHTML(fullName)}</p>
          <ul class="meta">
            <li><span>Raça</span><strong>${escapeHTML(race)}</strong></li>
            <li><span>Gênero</span><strong>${gender}</strong></li>
            <li><span>Altura</span><strong>${escapeHTML(height)}</strong></li>
            <li><span>Alinhamento</span><strong>${ALIGN[alignment]}</strong></li>
          </ul>
          <div class="power"><span>Poder total</span><strong>${c.total}</strong></div>
        </div>
        <div class="glare"></div>
      </div>

      <!-- VERSO -->
      <div class="card-face card-back">
        <h3>${escapeHTML(c.name)}</h3>
        <p class="first">Primeira aparição: ${escapeHTML(firstAppearance)}</p>
        <ul class="bars">${bars}</ul>
        <p class="base">Base: ${escapeHTML(base)}</p>
        <span class="flip-hint">Clique para voltar</span>
      </div>
    </div>
    </button>`;

  setCharacterImage(card.querySelector("img"), c);

  // Virar o card
  const toggle = card.querySelector(".card-toggle");
  toggle.addEventListener("click", () => {
    const flipped = card.classList.toggle("flipped");
    toggle.setAttribute("aria-pressed", String(flipped));
    toggle.setAttribute("aria-label", `${flipped ? "Voltar às informações de" : "Ver atributos de"} ${c.name}`);
  });

  addTilt(card);
  if (prefersReducedMotion) card.classList.add("visible");
  else revealObserver.observe(card);
  return card;
}

/* ---------- Efeito 3D de inclinação ---------- */
function addTilt(card) {
  if (!canHover) return;

  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;

    card.classList.add("tilting");
    card.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("tilting");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
}

/* ---------- 3. Renderização (busca, filtro, ordenação, paginação) ---------- */
const sorters = {
  name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
  power: (a, b) => b.total - a.total,
  intelligence: (a, b) => (Number(b.powerstats?.intelligence) || 0) - (Number(a.powerstats?.intelligence) || 0),
  strength: (a, b) => (Number(b.powerstats?.strength) || 0) - (Number(a.powerstats?.strength) || 0),
};

function applyFilters() {
  const q = state.query.trim().toLowerCase();

  state.filtered = state.all
    .filter((c) => state.filter === "all" || c.biography?.alignment === state.filter)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.biography?.fullName || "").toLowerCase().includes(q))
    .sort(sorters[state.sort]);

  state.shown = 0;
  el.cards.replaceChildren();
  renderMore();
}

function renderMore() {
  if (!state.filtered.length) {
    el.cards.innerHTML = `<div class="state"><strong>Nenhum personagem encontrado</strong><p>Tente outro nome ou filtro.</p></div>`;
    el.info.textContent = "";
    el.loadMore.hidden = true;
    return;
  }

  const next = state.filtered.slice(state.shown, state.shown + PAGE_SIZE);
  const fragment = document.createDocumentFragment();

  next.forEach((character, i) => {
    const card = createCard(character);
    card.style.transitionDelay = `${i * 45}ms`;
    fragment.append(card);
  });

  el.cards.append(fragment);
  state.shown += next.length;

  el.loadMore.hidden = state.shown >= state.filtered.length;
  el.info.textContent = `Exibindo ${state.shown} de ${state.filtered.length} personagens`;
}

function showSkeletons(n = 8) {
  el.cards.replaceChildren(
    ...Array.from({ length: n }, () => {
      const div = document.createElement("div");
      div.className = "skeleton";
      return div;
    })
  );
}

function showError(message) {
  el.cards.innerHTML = `
    <div class="state">
      <strong>Não foi possível carregar os personagens</strong>
      <p>${escapeHTML(message)}</p>
      <button type="button" class="btn btn-primary" id="retry">Tentar novamente</button>
    </div>`;
  document.getElementById("retry").addEventListener("click", init);
}

/* ---------- Carrossel 3D do hero ---------- */
function buildCarousel(list) {
  if (!el.carousel) return;
  const top = [...list].sort((a, b) => b.total - a.total).slice(0, 8);
  const n = top.length;
  if (!n) return;
  const angle = 360 / n;
  const width = el.carousel.offsetWidth || 170;
  const radius = Math.round(width / 2 / Math.tan(Math.PI / n)) + 40;

  el.carousel.replaceChildren(
    ...top.map((c, i) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      item.style.setProperty("--a", `${i * angle}deg`);
      item.style.setProperty("--r", `${radius}px`);
      item.innerHTML = `<img alt="${escapeHTML(c.name)}"><span>${escapeHTML(c.name)}</span>`;
      setCharacterImage(item.querySelector("img"), c);
      return item;
    })
  );
}

// Inclina a cena 3D conforme o mouse
if (canHover) {
  el.hero3d?.addEventListener("pointermove", (e) => {
    const r = el.hero3d.getBoundingClientRect();
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.scene.style.setProperty("--tilt", `${-8 - y * 14}deg`);
  });
  el.hero3d?.addEventListener("pointerleave", () => el.scene.style.setProperty("--tilt", "-8deg"));
}

/* ---------- Estatísticas em tempo real ---------- */
function animateCount(node, to) {
  if (prefersReducedMotion) { node.textContent = to; return; }
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function updateStats(list) {
  const counts = {
    total: list.length,
    good: list.filter((c) => c.biography?.alignment === "good").length,
    bad: list.filter((c) => c.biography?.alignment === "bad").length,
  };
  document.querySelectorAll("[data-stat]").forEach((node) => animateCount(node, counts[node.dataset.stat]));
}

/* ---------- Animação de entrada ao rolar ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((node) => {
  if (prefersReducedMotion) node.classList.add("visible");
  else revealObserver.observe(node);
});

/* ---------- Eventos da interface ---------- */
el.search.addEventListener("input", debounce((e) => {
  state.query = e.target.value;
  applyFilters();
}));

el.filters.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip || !el.filters.contains(chip)) return;
  el.filters.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  el.filters.querySelectorAll(".chip").forEach((button) => button.setAttribute("aria-pressed", String(button === chip)));
  state.filter = chip.dataset.filter;
  applyFilters();
});

el.sort.addEventListener("change", (e) => {
  state.sort = e.target.value;
  applyFilters();
});

el.loadMore.addEventListener("click", renderMore);

// Menu mobile
el.menuBtn.addEventListener("click", () => {
  const open = el.navLinks.classList.toggle("open");
  el.menuBtn.classList.toggle("open", open);
  el.menuBtn.setAttribute("aria-expanded", open);
});
el.navLinks.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    el.navLinks.classList.remove("open");
    el.menuBtn.classList.remove("open");
    el.menuBtn.setAttribute("aria-expanded", "false");
  }
});

// Cabeçalho com fundo ao rolar
window.addEventListener("scroll", () => el.nav.classList.toggle("scrolled", window.scrollY > 30), { passive: true });

/* ---------- Inicialização ---------- */
async function init() {
  showSkeletons();
  el.cards.setAttribute("aria-busy", "true");
  el.loadMore.hidden = true;
  el.info.textContent = "Buscando personagens...";

  try {
    state.all = await fetchCharacters();
    updateStats(state.all);
    buildCarousel(state.all);
    applyFilters();
  } catch (error) {
    console.error(error);
    el.info.textContent = "";
    showError("Verifique sua conexão com a internet e tente novamente.");
  } finally {
    el.cards.setAttribute("aria-busy", "false");
  }
}

// O fundo editorial estático evita distrações e economiza recursos.
init();
