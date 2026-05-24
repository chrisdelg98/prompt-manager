const STORAGE_KEY = "prompt-cms-projects-v1";
const THEME_KEY = "prompt-cms-theme-v1";
const ITEM_HEIGHT = 104;
const OVERSCAN = 6;
const OVERVIEW_INDEX = -1;

const exampleText = `@PROJECT: Galaxies
@GENRE: Space Trance

@SUNO
Progressive Trance track, extended version, no vocals, 128 BPM, energetic and uplifting mood.

@WALLPAPERS
IMG01|16:9:: Colorful spiral galaxy filling the night sky above futuristic observatory. Cartoon sci-fi wallpaper.
IMG02|16:9:: Anime-style astronaut sitting on floating rock watching giant galaxies and nebulae.

@VERTICALS
IMG01|9:16:: Spiral galaxy observatory vertical wallpaper, centered galaxy, soft glow, vibrant colors.

@TRACKS
TRACK01:: Beyond the Spiral Horizon
TRACK02:: Orbital Bloom

@COVER
Album cover with a chrome planet, radiant rings, elegant sci-fi typography area

@YT_TITLE
Galaxies - Space Trance Journey

@DESCRIPTION
A high energy space trance concept pack with prompts for music, covers, and visual assets.`;

const state = {
  projects: loadProjects(),
  activeSection: OVERVIEW_INDEX,
  query: "",
  sort: "updatedDesc",
  filter: "all",
  editing: null
};

const page = document.body.dataset.page || "index";
const qs = selector => document.querySelector(selector);
const qsa = selector => [...document.querySelectorAll(selector)];

init();

function init() {
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "dark";
  bindCommon();
  if (page === "index") initIndex();
  if (page === "new") initNew();
  if (page === "project") initProject();
}

function bindCommon() {
  qs("#globalSearch")?.addEventListener("input", event => {
    state.query = event.target.value.trim().toLowerCase();
    renderSidebar();
    if (page === "index") renderLibrary();
    if (page === "project") renderProjectPage();
  });
  qs("#sortSelect")?.addEventListener("change", event => {
    state.sort = event.target.value;
    const librarySort = qs("#librarySortSelect");
    if (librarySort) librarySort.value = state.sort;
    renderSidebar();
    if (page === "index") renderLibrary();
  });
  qs("#librarySortSelect")?.addEventListener("change", event => {
    state.sort = event.target.value;
    const sort = qs("#sortSelect");
    if (sort) sort.value = state.sort;
    renderSidebar();
    renderLibrary();
  });
  qs("#allProjectsFilter")?.addEventListener("click", () => setFilter("all"));
  qs("#favoritesFilter")?.addEventListener("click", () => setFilter("favorites"));
  qs("#themeToggle")?.addEventListener("click", toggleTheme);
  qs("#backupBtn")?.addEventListener("click", exportBackup);
  qs("#importBtn")?.addEventListener("click", () => qs("#importFile")?.click());
  qs("#quickImportBtn")?.addEventListener("click", () => qs("#importFile")?.click());
  qs("#importFile")?.addEventListener("change", importFile);
  renderSidebar();
}

function setFilter(filter) {
  state.filter = filter;
  renderSidebar();
  if (page === "index") renderLibrary();
}

function initIndex() {
  renderHeader("Biblioteca de proyectos", "Biblioteca / Todos los proyectos", libraryFacts().join(""));
  qs("#libraryRecent")?.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (button) handleItemAction(button.dataset.action, button.dataset.itemKey);
  });
  renderLibrary();
}

function initNew() {
  renderHeader("Nuevo proyecto", "Biblioteca / Crear proyecto", fact("FORM", "Entrada estructurada a pantalla completa"));
  qs("#sourceInput").value = "";
  qs("#parseBtn")?.addEventListener("click", createProjectFromInput);
  qs("#exampleBtn")?.addEventListener("click", () => {
    qs("#sourceInput").value = exampleText;
    toast("Ejemplo cargado");
  });
}

function initProject() {
  const project = currentProject();
  if (!project) {
    location.href = "index.html";
    return;
  }
  qs("#formatExample").textContent = exampleText;
  qs("#copyExampleBtn")?.addEventListener("click", () => {
    copyText(exampleText);
    toast("Ejemplo copiado al portapapeles");
  });
  qs("#projectFavoriteBtn")?.addEventListener("click", toggleProjectFavorite);
  qs("#duplicateBtn")?.addEventListener("click", duplicateCurrentProject);
  qs("#quickDuplicateBtn")?.addEventListener("click", duplicateCurrentProject);
  qs("#exportBtn")?.addEventListener("click", exportCurrentProject);
  qs("#moreBtn")?.addEventListener("click", exportBackup);
  qs("#deleteBtn")?.addEventListener("click", deleteCurrentProject);
  qs("#quickDeleteBtn")?.addEventListener("click", deleteCurrentProject);
  qs("#editProjectBtn")?.addEventListener("click", openProjectDialog);
  qs("#editNotesBtn")?.addEventListener("click", openNotesDialog);
  qs("#addSectionBtn")?.addEventListener("click", openSectionCreateDialog);
  qs("#quickAddSectionBtn")?.addEventListener("click", openSectionCreateDialog);
  qs("#addItemBtn")?.addEventListener("click", openItemDialog);
  qs("#quickAddItemBtn")?.addEventListener("click", openItemDialog);
  qs("#editSectionBtn")?.addEventListener("click", openSectionDialog);
  qs("#copySectionBtn")?.addEventListener("click", copyActiveSection);
  qs("#markSectionUsedBtn")?.addEventListener("click", markActiveSectionUsed);
  qs("#quickSearchBtn")?.addEventListener("click", () => qs("#globalSearch")?.focus());
  qs("#viewAllBtn")?.addEventListener("click", () => {
    if (state.activeSection === OVERVIEW_INDEX) state.activeSection = 0;
    renderProjectPage();
    qs("#itemList")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  qs("#itemList")?.addEventListener("scroll", () => renderItems());
  qs("#quickList")?.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (button) handleItemAction(button.dataset.action, button.dataset.itemKey);
  });
  qs("#dialogSave")?.addEventListener("click", saveDialogEdit);
  renderProjectPage();
}

function renderHeader(title, meta, facts = "") {
  const titleEl = qs("#projectTitle");
  const metaEl = qs("#projectMeta");
  const factsEl = qs("#projectFacts");
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta;
  if (factsEl) factsEl.innerHTML = facts;
}

function renderProjectFavoriteButton(project) {
  const button = qs("#projectFavoriteBtn");
  if (!button) return;
  button.innerHTML = icon("star");
  button.classList.toggle("favorite-icon", Boolean(project.favorite));
  button.title = project.favorite ? "Quitar favorito" : "Marcar favorito";
}

function renderSidebar() {
  const favorites = state.projects.filter(project => project.favorite).length;
  const storageBytes = new Blob([localStorage.getItem(STORAGE_KEY) || "[]"]).size;
  const storageLimit = 5 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageBytes / storageLimit) * 100));

  setText("#allProjectsCount", state.projects.length);
  setText("#favoritesCount", favorites);
  setText("#storageText", `${formatBytes(storageBytes)} / 5 MB`);
  if (qs("#storageBar")) qs("#storageBar").style.width = `${storagePercent}%`;

  qsa(".menu-item").forEach(button => button.classList.remove("active"));
  if (state.filter === "favorites") qs("#favoritesFilter")?.classList.add("active");
  else qs("#allProjectsFilter")?.classList.add("active");

  const projectList = qs("#projectList");
  if (projectList) {
    projectList.innerHTML = visibleProjects().map(projectSidebarCard).join("") || `<div class="pill">No hay resultados</div>`;
  }
}

function renderLibrary() {
  const projects = visibleProjects();
  const totalItems = state.projects.reduce((sum, project) => sum + countItems(project), 0);
  const totalSections = state.projects.reduce((sum, project) => sum + project.sections.length, 0);
  const categories = categoryEntries();
  const usedItems = state.projects.reduce((sum, project) => {
    return sum + project.sections.reduce((sectionSum, section) => sectionSum + section.items.filter(item => item.used).length, 0);
  }, 0);

  qs("#librarySummary").innerHTML = [
    metricCard("Proyectos", state.projects.length, "Documentos guardados"),
    metricCard("Items", totalItems, "Prompts disponibles"),
    metricCard("Secciones", totalSections, "Creadas automaticamente"),
    metricCard("Usados", usedItems, "Marcados como utilizados"),
    metricCard("Categorias", categories.length, "Generadas por metadata")
  ].join("");

  qs("#libraryGrid").innerHTML = projects.map(projectLibraryCard).join("") || emptyLibraryCard();
  qs("#libraryRecent").innerHTML = allRecentItems().slice(0, 5)
    .map(({ project, section, item }) => quickRowTemplate(item, section, project))
    .join("") || `<div class="pill">Sin actividad reciente</div>`;
  qs("#libraryCategories").innerHTML = categories.slice(0, 12)
    .map(([label, count], index) => `<span class="pill ${["purple", "blue", "green"][index % 3]}">${escapeHtml(label)} ${count}</span>`)
    .join("") || `<span class="pill">Sin categorias</span>`;
}

function renderProjectPage() {
  const project = currentProject();
  if (!project) return;
  if (!project.sections.length) {
    project.sections.push({ id: crypto.randomUUID(), name: "NUEVA_SECCION", raw: "", items: [] });
  }
  if (state.activeSection >= project.sections.length) state.activeSection = OVERVIEW_INDEX;

  renderHeader(project.metadata.PROJECT || "Untitled Project", `Biblioteca / ${project.metadata.PROJECT || "Untitled Project"}`, [
    fact("CREADO", formatDate(project.createdAt, false)),
    fact("GENRE", project.metadata.GENRE || project.tags?.[0] || "Sin categoria", true),
    fact("SEC", `${project.sections.length} secciones`),
    fact("ITEMS", `${countItems(project)} items`)
  ].join(""));
  renderProjectFavoriteButton(project);

  renderProjectSummary(project);
  renderSectionTabs(project);
  renderQuickList(project);
  document.body.classList.toggle("section-focused", state.activeSection !== OVERVIEW_INDEX);

  if (state.activeSection === OVERVIEW_INDEX) renderOverviewWorkbench(project);
  else renderSectionWorkbench(project);
}

function renderProjectSummary(project) {
  const totalItems = countItems(project);
  const usedItems = project.sections.reduce((sum, section) => sum + section.items.filter(item => item.used).length, 0);
  const favorites = project.sections.reduce((sum, section) => sum + section.items.filter(item => item.favorite).length, 0);

  qs("#stats").innerHTML = [
    summaryRow("SEC", "Total de secciones", project.sections.length),
    summaryRow("ITEMS", "Total de items", totalItems),
    summaryRow("OK", "Items usados", usedItems),
    summaryRow("*", "Favoritos", favorites),
    summaryRow("@", "Ultima actualizacion", formatDate(project.updatedAt, false))
  ].join("");
  qs("#tagCloud").innerHTML = (project.tags || []).slice(0, 12).map((tag, index) => {
    const color = ["purple", "blue", "green"][index % 3];
    return `<span class="pill ${color}">${escapeHtml(tag)}</span>`;
  }).join("") || `<span class="pill">Sin etiquetas</span>`;
  setText("#projectNotes", project.notes || "Anade notas o informacion adicional sobre este proyecto...");
}

function renderSectionTabs(project) {
  const overview = `<button class="tab ${state.activeSection === OVERVIEW_INDEX ? "active" : ""}" data-section-index="${OVERVIEW_INDEX}" role="tab">Overview</button>`;
  const tabs = project.sections.map((section, index) => {
    return `<button class="tab ${index === state.activeSection ? "active" : ""}" data-section-index="${index}" role="tab">
      ${escapeHtml(humanizeSection(section.name))} <span class="tab-count">${section.items.length}</span>
    </button>`;
  }).join("");
  qs("#sectionTabs").innerHTML = overview + tabs;
  qsa("[data-section-index]").forEach(tab => {
    tab.addEventListener("click", () => {
      state.activeSection = Number(tab.dataset.sectionIndex);
      qs("#itemList").scrollTop = 0;
      renderProjectPage();
    });
  });
}

function renderQuickList(project) {
  const items = allProjectItems(project).slice(0, 5);
  qs("#quickList").innerHTML = items.map(({ item, section }) => quickRowTemplate(item, section, project)).join("") || `<div class="pill">No hay items todavia</div>`;
}

function renderOverviewWorkbench(project) {
  setText("#activeSectionTitle", "Overview");
  setText("#sectionSummary", "Resumen general del proyecto y ultimos items de todas las secciones.");
  setSectionActionsDisabled(true);
  const rows = project.sections.map((section, index) => {
    const used = section.items.filter(item => item.used).length;
    const favorites = section.items.filter(item => item.favorite).length;
    return `<article class="overview-section-card">
      <div>
        <strong>${escapeHtml(humanizeSection(section.name))}</strong>
        <p>${section.items.length} items - ${used} usados - ${favorites} favoritos</p>
      </div>
      <button class="ghost-button" data-overview-section="${index}">Abrir</button>
    </article>`;
  }).join("");
  qs("#itemList").innerHTML = `<div class="overview-list">${rows || `<div class="pill">No hay secciones todavia</div>`}</div>`;
  qsa("[data-overview-section]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeSection = Number(button.dataset.overviewSection);
      renderProjectPage();
    });
  });
}

function renderSectionWorkbench(project) {
  const section = activeSection();
  const ratios = unique(section.items.map(item => item.ratio).filter(Boolean));
  setText("#activeSectionTitle", humanizeSection(section.name));
  setText("#sectionSummary", `${section.items.length} elementos${ratios.length ? ` - ${ratios.join(", ")}` : ""}`);
  setSectionActionsDisabled(false);
  renderItems();
}

function renderItems() {
  if (state.activeSection === OVERVIEW_INDEX) return;
  const section = activeSection();
  if (!section) return;
  const list = qs("#itemList");
  const items = filteredItems(section);
  const totalHeight = items.length * ITEM_HEIGHT;
  const start = Math.max(0, Math.floor(list.scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(list.clientHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(items.length, start + visibleCount);
  const visible = items.slice(start, end);

  list.innerHTML = `<div class="virtual-spacer" style="height:${totalHeight}px">
    ${visible.map(({ item }, localIndex) => itemTemplate(item, start + localIndex)).join("")}
  </div>`;
  list.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => handleItemAction(button.dataset.action, button.dataset.itemKey));
  });
}

function parsePromptDocument(source) {
  const project = {
    id: crypto.randomUUID(),
    metadata: {},
    sections: [],
    source,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: false,
    notes: "",
    copyHistory: []
  };
  let current = null;
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const header = line.match(/^@([A-Za-z0-9_-]+)\s*(:?)\s*(.*)$/);
    if (header) {
      const name = header[1].trim();
      const hasColon = Boolean(header[2]);
      const inlineValue = header[3].trim();
      if (hasColon && inlineValue && project.sections.length === 0) {
        project.metadata[name] = inlineValue;
        current = null;
      } else {
        current = { id: crypto.randomUUID(), name, items: [], raw: inlineValue || "" };
        project.sections.push(current);
        if (inlineValue) current.items.push(parseItemLine(inlineValue));
      }
      continue;
    }
    if (!current) continue;
    current.raw = [current.raw, line].filter(Boolean).join("\n");
    if (line.trim()) current.items.push(parseItemLine(line));
  }
  if (!project.metadata.PROJECT) project.metadata.PROJECT = project.sections[0]?.name || "Untitled Project";
  project.tags = autoTags(project);
  return project;
}

function parseItemLine(line) {
  const trimmed = line.trim();
  const item = {
    uid: crypto.randomUUID(),
    id: "",
    type: "",
    ratio: "",
    content: trimmed,
    used: false,
    favorite: false,
    rating: null,
    expanded: false,
    createdAt: new Date().toISOString()
  };
  if (trimmed.includes("::")) {
    const [left, ...contentParts] = trimmed.split("::");
    item.content = contentParts.join("::").trim();
    const [idPart, typePart] = left.split("|");
    item.id = (idPart || "").trim();
    item.type = item.id.replace(/\d+$/g, "");
    item.ratio = (typePart || "").trim();
  }
  return item;
}

function createProjectFromInput() {
  const source = qs("#sourceInput").value.trim();
  if (!source) {
    toast("Pega un bloque primero");
    return;
  }
  const project = parsePromptDocument(source);
  state.projects.unshift(project);
  persist();
  location.href = `project.html?id=${encodeURIComponent(project.id)}`;
}

async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  let projectId = null;
  try {
    const data = JSON.parse(text);
    const imported = normalizeProjects(Array.isArray(data.projects) ? data.projects : [data]);
    imported.forEach(project => {
      project.id = project.id || crypto.randomUUID();
      project.updatedAt = new Date().toISOString();
      state.projects.unshift(project);
      projectId = projectId || project.id;
    });
  } catch {
    const project = parsePromptDocument(text);
    state.projects.unshift(project);
    projectId = project.id;
  }
  event.target.value = "";
  persist();
  location.href = projectId ? `project.html?id=${encodeURIComponent(projectId)}` : "index.html";
}

function openItemDialog() {
  if (state.activeSection === OVERVIEW_INDEX) state.activeSection = 0;
  state.editing = { type: "item" };
  setText("#dialogTitle", "Anadir item");
  setText("#dialogLabel", "Linea o bloque");
  qs("#dialogText").value = "";
  qs("#editDialog").showModal();
}

function openSectionDialog() {
  const section = activeSection();
  if (!section || state.activeSection === OVERVIEW_INDEX) return;
  state.editing = { type: "section" };
  setText("#dialogTitle", `Editar @${section.name}`);
  setText("#dialogLabel", "Contenido de la seccion");
  qs("#dialogText").value = section.items.map(formatItem).join("\n");
  qs("#editDialog").showModal();
}

function openSectionCreateDialog() {
  state.editing = { type: "new-section" };
  setText("#dialogTitle", "Anadir seccion");
  setText("#dialogLabel", "Nombre y contenido. Ej: @THUMBNAILS");
  qs("#dialogText").value = "@NUEVA_SECCION\n";
  qs("#editDialog").showModal();
}

function openNotesDialog() {
  const project = currentProject();
  state.editing = { type: "notes" };
  setText("#dialogTitle", "Notas del proyecto");
  setText("#dialogLabel", "Notas");
  qs("#dialogText").value = project.notes || "";
  qs("#editDialog").showModal();
}

function openProjectDialog() {
  const project = currentProject();
  state.editing = { type: "project" };
  setText("#dialogTitle", "Editar proyecto");
  setText("#dialogLabel", "Nombre del proyecto");
  qs("#dialogText").value = project.metadata.PROJECT || "";
  qs("#editDialog").showModal();
}

function saveDialogEdit(event) {
  event.preventDefault();
  const project = currentProject();
  const section = activeSection();
  const text = qs("#dialogText").value.trim();
  if (!project || !state.editing) return;

  if (state.editing.type === "item" && section && text) text.split("\n").filter(Boolean).forEach(line => section.items.push(parseItemLine(line)));
  if (state.editing.type === "section" && section) {
    section.items = text.split("\n").filter(Boolean).map(parseItemLine);
    section.raw = text;
  }
  if (state.editing.type === "new-section" && text) {
    const parsed = parseSectionBlock(text);
    project.sections.push(parsed);
    state.activeSection = project.sections.length - 1;
  }
  if (state.editing.type === "notes") project.notes = text;
  if (state.editing.type === "project" && text) project.metadata.PROJECT = text;

  project.updatedAt = new Date().toISOString();
  project.tags = autoTags(project);
  persist();
  qs("#editDialog").close();
  renderSidebar();
  renderProjectPage();
  toast("Guardado");
}

function parseSectionBlock(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const first = lines[0].match(/^@?([A-Za-z0-9_-]+)\s*(?::)?\s*(.*)$/);
  const name = first?.[1] || "NUEVA_SECCION";
  const inline = first?.[2] || "";
  const contentLines = [inline, ...lines.slice(1)].filter(Boolean);
  return { id: crypto.randomUUID(), name, raw: contentLines.join("\n"), items: contentLines.map(parseItemLine) };
}

function handleItemAction(action, itemKey) {
  const found = findItem(itemKey);
  if (!found) return;
  const { project, section, item } = found;
  if (action === "copy") {
    copyText(item.content);
    project.copyHistory.unshift({ itemId: item.id, section: section.name, copiedAt: new Date().toISOString() });
    project.copyHistory = project.copyHistory.slice(0, 100);
    toast("Copiado al portapapeles");
  }
  if (action === "used") item.used = !item.used;
  if (action === "like") item.rating = item.rating === "like" ? null : "like";
  if (action === "dislike") item.rating = item.rating === "dislike" ? null : "dislike";
  if (action === "favorite") item.favorite = !item.favorite;
  if (action === "expand") item.expanded = !item.expanded;
  project.updatedAt = new Date().toISOString();
  persist();
  renderSidebar();
  if (page === "project") renderProjectPage();
  if (page === "index") renderLibrary();
}

function copyActiveSection() {
  const section = activeSection();
  if (!section || state.activeSection === OVERVIEW_INDEX) return;
  copyText(section.items.map(item => item.content).join("\n"));
  toast("Seccion copiada al portapapeles");
}

function markActiveSectionUsed() {
  const project = currentProject();
  const section = activeSection();
  if (!section || state.activeSection === OVERVIEW_INDEX) return;
  section.items.forEach(item => item.used = true);
  project.updatedAt = new Date().toISOString();
  persist();
  renderProjectPage();
  toast("Seccion marcada");
}

function duplicateCurrentProject() {
  const project = currentProject();
  if (!project) return;
  const clone = structuredClone(project);
  clone.id = crypto.randomUUID();
  clone.metadata.PROJECT = `${clone.metadata.PROJECT || "Untitled Project"} Copy`;
  clone.createdAt = new Date().toISOString();
  clone.updatedAt = clone.createdAt;
  clone.sections.forEach(section => {
    section.id = crypto.randomUUID();
    section.items.forEach(item => item.uid = crypto.randomUUID());
  });
  state.projects.unshift(clone);
  persist();
  location.href = `project.html?id=${encodeURIComponent(clone.id)}`;
}

function exportCurrentProject() {
  const project = currentProject();
  if (project) downloadJson(`${slug(project.metadata.PROJECT)}.json`, project);
}

function exportBackup() {
  downloadJson(`prompt-manager-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    projects: state.projects
  });
}

function deleteCurrentProject() {
  const project = currentProject();
  if (!project || !confirm(`Eliminar "${project.metadata.PROJECT}"?`)) return;
  state.projects = state.projects.filter(candidate => candidate.id !== project.id);
  persist();
  location.href = "index.html";
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
}

function toggleProjectFavorite() {
  const project = currentProject();
  if (!project) return;
  project.favorite = !project.favorite;
  project.updatedAt = new Date().toISOString();
  persist();
  renderSidebar();
  renderProjectPage();
}

function currentProject() {
  const id = new URLSearchParams(location.search).get("id");
  return state.projects.find(project => project.id === id);
}

function activeSection() {
  return currentProject()?.sections[state.activeSection];
}

function sortedProjects() {
  return [...state.projects].sort((a, b) => {
    if (state.sort === "nameAsc") return (a.metadata.PROJECT || "").localeCompare(b.metadata.PROJECT || "");
    if (state.sort === "createdDesc") return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function visibleProjects() {
  return sortedProjects().filter(project => {
    if (!projectMatchesQuery(project)) return false;
    if (state.filter === "favorites") return project.favorite;
    return true;
  });
}

function projectMatchesQuery(project) {
  if (!state.query) return true;
  return searchableText(project).includes(state.query);
}

function searchableText(value) {
  return JSON.stringify(value).toLowerCase();
}

function autoTags(project) {
  const text = `${Object.values(project.metadata).join(" ")} ${project.sections.map(section => `${section.name} ${section.raw}`).join(" ")}`;
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{3,}/g) || [];
  const ignored = new Set(["prompt", "with", "para", "seccion", "description", "title", "wallpaper", "track"]);
  const counts = new Map();
  words.forEach(word => {
    if (!ignored.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word]) => word);
}

function allProjectItems(project) {
  return project.sections.flatMap(section => section.items.map(item => ({ section, item }))).sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
}

function allRecentItems() {
  return state.projects.flatMap(project => project.sections.flatMap(section => section.items.map(item => ({ project, section, item })))).sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
}

function findItem(itemKey) {
  for (const project of state.projects) {
    for (const section of project.sections) {
      const item = section.items.find(candidate => candidate.uid === itemKey);
      if (item) return { project, section, item };
    }
  }
  return null;
}

function countItems(project) {
  return project.sections.reduce((sum, section) => sum + section.items.length, 0);
}

function categoryEntries() {
  const categories = new Map();
  state.projects.forEach(project => {
    const label = project.metadata.GENRE || project.tags?.[0] || "Sin categoria";
    categories.set(label, (categories.get(label) || 0) + 1);
  });
  return [...categories.entries()].sort((a, b) => b[1] - a[1]);
}

function libraryFacts() {
  const totalItems = state.projects.reduce((sum, project) => sum + countItems(project), 0);
  const totalSections = state.projects.reduce((sum, project) => sum + project.sections.length, 0);
  return [
    fact("PROJECTS", `${state.projects.length} proyectos`),
    fact("ITEMS", `${totalItems} items`),
    fact("SECTIONS", `${totalSections} secciones`),
    fact("CATEGORIES", `${categoryEntries().length} categorias`)
  ];
}

function projectSidebarCard(project) {
  const count = countItems(project);
  const active = currentProject()?.id === project.id ? "active" : "";
  return `<a class="project-card ${active}" href="project.html?id=${encodeURIComponent(project.id)}">
    <strong>${escapeHtml(project.metadata.PROJECT || "Untitled Project")}</strong>
    <small>${count} items - ${project.sections.length} secciones</small>
  </a>`;
}

function projectLibraryCard(project) {
  const items = countItems(project);
  const genre = project.metadata.GENRE || project.tags?.[0] || "Sin categoria";
  return `<a class="library-card" href="project.html?id=${encodeURIComponent(project.id)}">
    <div class="library-card-head">
      <strong>${escapeHtml(project.metadata.PROJECT || "Untitled Project")}</strong>
      <span>${project.favorite ? "*" : "..."}</span>
    </div>
    <small>${formatDate(project.createdAt, false)}</small>
    <span class="pill blue">${escapeHtml(genre)}</span>
    <div class="library-card-stats">
      <b>${project.sections.length}<span>Secciones</span></b>
      <b>${items}<span>Items</span></b>
    </div>
  </a>`;
}

function emptyLibraryCard() {
  return `<a class="library-card library-card-empty" href="new.html">
    <strong>+</strong>
    <span>Nuevo proyecto</span>
  </a>`;
}

function metricCard(label, value, help) {
  return `<article class="metric-card">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(help)}</small>
  </article>`;
}

function icon(name) {
  const paths = {
    copy: '<rect x="9" y="9" width="10" height="10" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path>',
    circle: '<circle cx="12" cy="12" r="7"></circle>',
    "check-circle": '<path d="M8 12l2.5 2.5L16 9"></path><circle cx="12" cy="12" r="8"></circle>',
    star: '<path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z"></path>',
    "thumbs-up": '<path d="M7 10v10"></path><path d="M11 10l1-5a2 2 0 0 1 3 1v4h4a2 2 0 0 1 2 2l-1 6a2 2 0 0 1-2 2H7"></path><path d="M3 10h4v10H3z"></path>',
    "thumbs-down": '<path d="M7 14V4"></path><path d="M11 14l1 5a2 2 0 0 0 3-1v-4h4a2 2 0 0 0 2-2l-1-6a2 2 0 0 0-2-2H7"></path><path d="M3 4h4v10H3z"></path>',
    "chevron-down": '<path d="M6 9l6 6 6-6"></path>',
    "chevron-up": '<path d="M18 15l-6-6-6 6"></path>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.circle}</svg>`;
}

function quickRowTemplate(item, section, project = currentProject()) {
  const label = section.name === "TRACKS" ? "TRACK" : section.name;
  const name = project?.metadata?.PROJECT ? `<small>${escapeHtml(project.metadata.PROJECT)}</small>` : "";
  return `<article class="quick-row ${item.used ? "used" : ""}">
    <span class="badge ${label === "TRACK" ? "green" : ""}">${escapeHtml(label)}</span>
    <strong>${escapeHtml(item.id || item.type || "prompt")}</strong>
    <div class="quick-row-content">${name}<p>${escapeHtml(item.content)}</p></div>
    <div class="quick-row-actions">
      ${actionButton("copy", item, "copy", "Copiar")}
      ${actionButton("used", item, item.used ? "check-circle" : "circle", "Usado", item.used ? "used-icon" : "")}
      ${actionButton("favorite", item, "star", "Favorito", item.favorite ? "favorite-icon" : "")}
      ${actionButton("like", item, "thumbs-up", "Like", item.rating === "like" ? "rating-like" : "")}
      ${actionButton("dislike", item, "thumbs-down", "Dislike", item.rating === "dislike" ? "rating-dislike" : "")}
      ${actionButton("expand", item, "chevron-down", "Mas opciones")}
    </div>
  </article>`;
}

function itemTemplate(item, index) {
  const labels = [item.id, item.type, item.ratio].filter(Boolean);
  return `<article class="item-card ${item.used ? "used" : ""} ${item.expanded ? "expanded" : ""}" style="top:${index * ITEM_HEIGHT + 8}px">
    <div class="item-main">
      <div class="item-title">
        <strong>${escapeHtml(item.id || "Item")}</strong>
        ${labels.map(label => pill(escapeHtml(label))).join("")}
        ${item.used ? `<span class="pill used-pill">usado</span>` : ""}
      </div>
      <div class="item-content">${escapeHtml(item.content)}</div>
    </div>
    <div class="item-actions">
      ${actionButton("copy", item, "copy", "Copiar")}
      ${actionButton("used", item, item.used ? "check-circle" : "circle", "Marcar usado", item.used ? "used-icon" : "")}
      ${actionButton("favorite", item, "star", "Favorito", item.favorite ? "favorite-icon" : "")}
      ${actionButton("like", item, "thumbs-up", "Like", item.rating === "like" ? "rating-like" : "")}
      ${actionButton("dislike", item, "thumbs-down", "Dislike", item.rating === "dislike" ? "rating-dislike" : "")}
      ${actionButton("expand", item, item.expanded ? "chevron-up" : "chevron-down", "Expandir")}
    </div>
  </article>`;
}

function actionButton(action, item, iconName, title, extraClass = "") {
  return `<button class="icon-button ${extraClass}" title="${title}" aria-label="${title}" data-action="${action}" data-item-key="${item.uid}">${icon(iconName)}</button>`;
}

function filteredItems(section) {
  return section.items.map((item, index) => ({ item, index })).filter(({ item }) => {
    if (!state.query) return true;
    return searchableText({ ...item, section: section.name }).includes(state.query);
  });
}

function setSectionActionsDisabled(disabled) {
  ["#copySectionBtn", "#markSectionUsedBtn", "#editSectionBtn"].forEach(selector => {
    const button = qs(selector);
    if (button) button.disabled = disabled;
  });
}

function formatItem(item) {
  const prefix = [item.id, item.ratio].filter(Boolean).join("|");
  return prefix ? `${prefix}:: ${item.content}` : item.content;
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function loadProjects() {
  try {
    return normalizeProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function normalizeProjects(projects) {
  return (Array.isArray(projects) ? projects : []).map(project => {
    project.id = project.id || crypto.randomUUID();
    project.metadata = project.metadata || {};
    project.sections = Array.isArray(project.sections) ? project.sections : [];
    project.createdAt = project.createdAt || new Date().toISOString();
    project.updatedAt = project.updatedAt || project.createdAt;
    project.favorite = Boolean(project.favorite);
    project.notes = project.notes || "";
    project.copyHistory = Array.isArray(project.copyHistory) ? project.copyHistory : [];
    project.sections.forEach(section => {
      section.id = section.id || crypto.randomUUID();
      section.name = section.name || "SECTION";
      section.items = Array.isArray(section.items) ? section.items : [];
      section.items.forEach(item => {
        item.uid = item.uid || crypto.randomUUID();
        item.id = item.id || "";
        item.type = item.type || "";
        item.ratio = item.ratio || "";
        item.content = item.content || "";
        item.createdAt = item.createdAt || new Date().toISOString();
        item.used = Boolean(item.used);
        item.favorite = Boolean(item.favorite);
        item.expanded = Boolean(item.expanded);
        item.rating = item.rating || null;
      });
    });
    project.tags = Array.isArray(project.tags) ? project.tags : autoTags(project);
    return project;
  });
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(date, withTime = true) {
  const options = withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" };
  return new Intl.DateTimeFormat("es", options).format(new Date(date));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function slug(text = "project") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

function unique(values) {
  return [...new Set(values)];
}

function humanizeSection(value = "") {
  return value.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function pill(text) {
  return `<span class="pill">${text}</span>`;
}

function fact(icon, text, tag = false) {
  return `<span class="fact"><span>${escapeHtml(icon)}</span>${tag ? `<b>${escapeHtml(text)}</b>` : escapeHtml(text)}</span>`;
}

function summaryRow(icon, label, value) {
  return `<div class="summary-row"><span>${escapeHtml(icon)} ${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`;
}

function setText(selector, value) {
  const element = qs(selector);
  if (element) element.textContent = value;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toast(message) {
  const toastEl = qs("#toast");
  if (!toastEl) return;
  toastEl.textContent = `OK ${message}`;
  toastEl.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.remove("visible"), 1900);
}
