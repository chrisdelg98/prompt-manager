const STORAGE_KEY = "prompt-cms-projects-v1";
const THEME_KEY = "prompt-cms-theme-v1";
const ITEM_HEIGHT = 154;
const OVERSCAN = 6;

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
  currentProjectId: null,
  activeSection: 0,
  query: "",
  sort: "updatedDesc",
  editing: null
};

const els = {
  projectList: document.querySelector("#projectList"),
  categoryList: document.querySelector("#categoryList"),
  allProjectsCount: document.querySelector("#allProjectsCount"),
  favoritesCount: document.querySelector("#favoritesCount"),
  recentCount: document.querySelector("#recentCount"),
  storageText: document.querySelector("#storageText"),
  storageBar: document.querySelector("#storageBar"),
  globalSearch: document.querySelector("#globalSearch"),
  sortSelect: document.querySelector("#sortSelect"),
  sourceInput: document.querySelector("#sourceInput"),
  parseBtn: document.querySelector("#parseBtn"),
  exampleBtn: document.querySelector("#exampleBtn"),
  copyExampleBtn: document.querySelector("#copyExampleBtn"),
  newProjectBtn: document.querySelector("#newProjectBtn"),
  importBtn: document.querySelector("#importBtn"),
  quickImportBtn: document.querySelector("#quickImportBtn"),
  importFile: document.querySelector("#importFile"),
  backupBtn: document.querySelector("#backupBtn"),
  themeToggle: document.querySelector("#themeToggle"),
  duplicateBtn: document.querySelector("#duplicateBtn"),
  quickDuplicateBtn: document.querySelector("#quickDuplicateBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  quickDeleteBtn: document.querySelector("#quickDeleteBtn"),
  moreBtn: document.querySelector("#moreBtn"),
  editProjectBtn: document.querySelector("#editProjectBtn"),
  projectFavoriteBtn: document.querySelector("#projectFavoriteBtn"),
  projectTitle: document.querySelector("#projectTitle"),
  projectMeta: document.querySelector("#projectMeta"),
  projectFacts: document.querySelector("#projectFacts"),
  composer: document.querySelector("#composer"),
  projectPanel: document.querySelector("#projectPanel"),
  stats: document.querySelector("#stats"),
  tagCloud: document.querySelector("#tagCloud"),
  projectNotes: document.querySelector("#projectNotes"),
  editNotesBtn: document.querySelector("#editNotesBtn"),
  formatExample: document.querySelector("#formatExample"),
  sectionTabs: document.querySelector("#sectionTabs"),
  addSectionBtn: document.querySelector("#addSectionBtn"),
  quickAddSectionBtn: document.querySelector("#quickAddSectionBtn"),
  sectionSummary: document.querySelector("#sectionSummary"),
  activeSectionTitle: document.querySelector("#activeSectionTitle"),
  itemList: document.querySelector("#itemList"),
  quickList: document.querySelector("#quickList"),
  viewAllBtn: document.querySelector("#viewAllBtn"),
  copySectionBtn: document.querySelector("#copySectionBtn"),
  markSectionUsedBtn: document.querySelector("#markSectionUsedBtn"),
  addItemBtn: document.querySelector("#addItemBtn"),
  quickAddItemBtn: document.querySelector("#quickAddItemBtn"),
  quickSearchBtn: document.querySelector("#quickSearchBtn"),
  editSectionBtn: document.querySelector("#editSectionBtn"),
  editDialog: document.querySelector("#editDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogLabel: document.querySelector("#dialogLabel"),
  dialogText: document.querySelector("#dialogText"),
  dialogSave: document.querySelector("#dialogSave"),
  toast: document.querySelector("#toast")
};

init();

function init() {
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "dark";
  els.formatExample.textContent = exampleText;
  bindEvents();
  if (state.projects.length) {
    state.currentProjectId = sortedProjects()[0].id;
  } else {
    els.sourceInput.value = exampleText;
  }
  render();
}

function bindEvents() {
  els.parseBtn.addEventListener("click", createProjectFromInput);
  els.exampleBtn.addEventListener("click", loadExample);
  els.copyExampleBtn.addEventListener("click", () => {
    copyText(exampleText);
    toast("Ejemplo copiado al portapapeles");
  });
  els.newProjectBtn.addEventListener("click", () => {
    state.currentProjectId = null;
    state.activeSection = 0;
    els.sourceInput.value = "";
    render();
    els.sourceInput.focus();
  });
  els.globalSearch.addEventListener("input", event => {
    state.query = event.target.value.trim().toLowerCase();
    renderProjectList();
    renderProjectPanel();
  });
  els.sortSelect.addEventListener("change", event => {
    state.sort = event.target.value;
    renderProjectList();
  });
  els.itemList.addEventListener("scroll", () => renderItems());
  els.quickList.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (button) handleItemAction(button.dataset.action, button.dataset.itemKey);
  });
  els.copySectionBtn.addEventListener("click", copyActiveSection);
  els.markSectionUsedBtn.addEventListener("click", markActiveSectionUsed);
  els.addItemBtn.addEventListener("click", () => openItemDialog());
  els.quickAddItemBtn.addEventListener("click", () => openItemDialog());
  els.editSectionBtn.addEventListener("click", openSectionDialog);
  els.addSectionBtn.addEventListener("click", openSectionCreateDialog);
  els.quickAddSectionBtn.addEventListener("click", openSectionCreateDialog);
  els.duplicateBtn.addEventListener("click", duplicateCurrentProject);
  els.quickDuplicateBtn.addEventListener("click", duplicateCurrentProject);
  els.exportBtn.addEventListener("click", exportCurrentProject);
  els.deleteBtn.addEventListener("click", deleteCurrentProject);
  els.quickDeleteBtn.addEventListener("click", deleteCurrentProject);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.quickImportBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importFile);
  els.backupBtn.addEventListener("click", exportBackup);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.dialogSave.addEventListener("click", saveDialogEdit);
  els.projectFavoriteBtn.addEventListener("click", toggleProjectFavorite);
  els.editNotesBtn.addEventListener("click", openNotesDialog);
  els.editProjectBtn.addEventListener("click", openProjectDialog);
  els.moreBtn.addEventListener("click", exportBackup);
  els.viewAllBtn.addEventListener("click", () => els.itemList.scrollIntoView({ behavior: "smooth", block: "center" }));
  els.quickSearchBtn.addEventListener("click", () => els.globalSearch.focus());
}

function loadExample() {
  els.sourceInput.value = exampleText;
  toast("Ejemplo cargado");
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
        current = {
          id: crypto.randomUUID(),
          name,
          items: [],
          raw: inlineValue || ""
        };
        project.sections.push(current);
        if (inlineValue) current.items.push(parseItemLine(inlineValue));
      }
      continue;
    }

    if (!current) continue;
    current.raw = [current.raw, line].filter(Boolean).join("\n");
    if (line.trim()) current.items.push(parseItemLine(line));
  }

  if (!project.metadata.PROJECT) {
    project.metadata.PROJECT = project.sections[0]?.name || "Untitled Project";
  }
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
  const source = els.sourceInput.value.trim();
  if (!source) {
    toast("Pega un bloque primero");
    return;
  }
  const project = parsePromptDocument(source);
  state.projects.unshift(project);
  state.currentProjectId = project.id;
  state.activeSection = 0;
  persist();
  render();
  toast("Proyecto creado");
}

function render() {
  renderSidebarStats();
  renderProjectList();
  renderCurrentProject();
}

function renderSidebarStats() {
  const totalItems = state.projects.reduce((sum, project) => sum + countItems(project), 0);
  const favorites = state.projects.filter(project => project.favorite).length;
  const recent = state.projects.filter(project => project.copyHistory?.length).length;
  const storageBytes = new Blob([localStorage.getItem(STORAGE_KEY) || "[]"]).size;
  const storageLimit = 5 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageBytes / storageLimit) * 100));

  els.allProjectsCount.textContent = state.projects.length;
  els.favoritesCount.textContent = favorites;
  els.recentCount.textContent = recent;
  els.storageText.textContent = `${formatBytes(storageBytes)} / 5 MB`;
  els.storageBar.style.width = `${storagePercent}%`;

  const categories = new Map();
  state.projects.forEach(project => {
    const label = project.metadata.GENRE || project.tags?.[0] || "Sin categoria";
    categories.set(label, (categories.get(label) || 0) + 1);
  });

  els.categoryList.innerHTML = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([label, count]) => `<div class="category-row"><span>${escapeHtml(label)}</span><span>${count}</span></div>`)
    .join("") || `<div class="category-row"><span>Sin categorias</span><span>0</span></div>`;
}

function renderProjectList() {
  const projects = sortedProjects().filter(projectMatchesQuery);
  els.projectList.innerHTML = projects.map(project => {
    const count = countItems(project);
    return `<button class="project-card ${project.id === state.currentProjectId ? "active" : ""}" data-project-id="${project.id}">
      <strong>${escapeHtml(project.metadata.PROJECT || "Untitled Project")}</strong>
      <small>${count} items · ${project.sections.length} secciones</small>
      <small>${escapeHtml((project.tags || []).slice(0, 5).join(", "))}</small>
    </button>`;
  }).join("") || `<div class="pill">No hay resultados</div>`;

  els.projectList.querySelectorAll("[data-project-id]").forEach(button => {
    button.addEventListener("click", () => {
      state.currentProjectId = button.dataset.projectId;
      state.activeSection = 0;
      render();
    });
  });
}

function renderCurrentProject() {
  const project = currentProject();
  const hasProject = Boolean(project);
  els.composer.hidden = hasProject;
  els.projectPanel.hidden = !hasProject;
  [
    els.duplicateBtn,
    els.quickDuplicateBtn,
    els.exportBtn,
    els.deleteBtn,
    els.quickDeleteBtn,
    els.moreBtn,
    els.editProjectBtn
  ].forEach(button => button.disabled = !hasProject);
  els.projectFavoriteBtn.hidden = !hasProject;

  if (!project) {
    els.projectTitle.textContent = "Crea o importa un documento";
    els.projectMeta.textContent = "Biblioteca / Sin proyecto";
    els.projectFacts.innerHTML = "";
    return;
  }

  els.projectTitle.textContent = project.metadata.PROJECT || "Untitled Project";
  els.projectMeta.textContent = `Biblioteca / ${project.metadata.PROJECT || "Untitled Project"}`;
  els.projectFavoriteBtn.textContent = project.favorite ? "★" : "☆";
  els.projectFacts.innerHTML = [
    fact("▣", `Creado: ${formatDate(project.createdAt, false)}`),
    fact("◇", project.metadata.GENRE || project.tags?.[0] || "Sin categoria", true),
    fact("□", `${project.sections.length} secciones`),
    fact("☷", `${countItems(project)} items`)
  ].join("");
  renderProjectPanel();
}

function renderProjectPanel() {
  const project = currentProject();
  if (!project) return;
  if (state.activeSection >= project.sections.length) state.activeSection = 0;
  if (!project.sections.length) {
    project.sections.push({ id: crypto.randomUUID(), name: "NUEVA_SECCION", raw: "", items: [] });
  }

  const totalItems = countItems(project);
  const usedItems = project.sections.reduce((sum, section) => sum + section.items.filter(item => item.used).length, 0);
  const favorites = project.sections.reduce((sum, section) => sum + section.items.filter(item => item.favorite).length, 0);

  els.stats.innerHTML = [
    summaryRow("□", "Total de secciones", project.sections.length),
    summaryRow("▤", "Total de items", totalItems),
    summaryRow("✓", "Items usados", usedItems),
    summaryRow("☆", "Favoritos", favorites),
    summaryRow("◴", "Ultima actualizacion", formatDate(project.updatedAt, false))
  ].join("");

  els.tagCloud.innerHTML = (project.tags || []).slice(0, 12).map((tag, index) => {
    const color = ["purple", "blue", "green"][index % 3];
    return `<span class="pill ${color}">${escapeHtml(tag)}</span>`;
  }).join("") || `<span class="pill">Sin etiquetas</span>`;

  els.projectNotes.textContent = project.notes || "Anade notas o informacion adicional sobre este proyecto...";

  els.sectionTabs.innerHTML = project.sections.map((section, index) => {
    const sectionLabel = humanizeSection(section.name);
    return `<button class="tab ${index === state.activeSection ? "active" : ""}" data-section-index="${index}" role="tab">
      ${escapeHtml(sectionLabel)} <span class="tab-count">${section.items.length}</span>
    </button>`;
  }).join("");

  els.sectionTabs.querySelectorAll("[data-section-index]").forEach(tab => {
    tab.addEventListener("click", () => {
      state.activeSection = Number(tab.dataset.sectionIndex);
      els.itemList.scrollTop = 0;
      renderProjectPanel();
    });
  });

  const section = activeSection();
  const ratios = unique(section.items.map(item => item.ratio).filter(Boolean));
  els.activeSectionTitle.textContent = humanizeSection(section.name);
  els.sectionSummary.textContent = `${section.items.length} elementos${ratios.length ? ` · ${ratios.join(", ")}` : ""}`;
  renderQuickList(project);
  renderItems();
}

function renderQuickList(project) {
  const items = allProjectItems(project).slice(0, 5);
  els.quickList.innerHTML = items.map(({ item, section }) => quickRowTemplate(item, section)).join("") || `<div class="pill">No hay items todavia</div>`;
}

function renderItems() {
  const section = activeSection();
  if (!section) return;
  const items = filteredItems(section);
  const totalHeight = items.length * ITEM_HEIGHT;
  const start = Math.max(0, Math.floor(els.itemList.scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(els.itemList.clientHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(items.length, start + visibleCount);
  const visible = items.slice(start, end);

  els.itemList.innerHTML = `<div class="virtual-spacer" style="height:${totalHeight}px">
    ${visible.map(({ item }, localIndex) => itemTemplate(item, start + localIndex)).join("")}
  </div>`;

  els.itemList.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => handleItemAction(button.dataset.action, button.dataset.itemKey));
  });
}

function quickRowTemplate(item, section) {
  const label = section.name === "TRACKS" ? "TRACK" : section.name;
  return `<article class="quick-row ${item.used ? "used" : ""}">
    <span class="badge ${label === "TRACK" ? "green" : ""}">${escapeHtml(label)}</span>
    <strong>${escapeHtml(item.id || item.type || "prompt")}</strong>
    <div class="quick-row-content"><p>${escapeHtml(item.content)}</p></div>
    <div class="quick-row-actions">
      ${actionButton("copy", item, "⧉", "Copiar")}
      ${actionButton("used", item, item.used ? "✓" : "○", "Usado", item.used ? "used-icon" : "")}
      ${actionButton("favorite", item, item.favorite ? "★" : "☆", "Favorito", item.favorite ? "favorite-icon" : "")}
      ${actionButton("like", item, "♡", "Like", item.rating === "like" ? "rating-like" : "")}
      ${actionButton("dislike", item, "♢", "Dislike", item.rating === "dislike" ? "rating-dislike" : "")}
      ${actionButton("expand", item, "⌄", "Mas opciones")}
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
      ${actionButton("copy", item, "⧉", "Copiar")}
      ${actionButton("used", item, item.used ? "✓" : "○", "Marcar usado", item.used ? "used-icon" : "")}
      ${actionButton("favorite", item, item.favorite ? "★" : "☆", "Favorito", item.favorite ? "favorite-icon" : "")}
      ${actionButton("like", item, "♡", "Like", item.rating === "like" ? "rating-like" : "")}
      ${actionButton("dislike", item, "♢", "Dislike", item.rating === "dislike" ? "rating-dislike" : "")}
      ${actionButton("expand", item, item.expanded ? "⌃" : "⌄", "Expandir")}
    </div>
  </article>`;
}

function actionButton(action, item, icon, title, extraClass = "") {
  return `<button class="icon-button ${extraClass}" title="${title}" data-action="${action}" data-item-key="${item.uid}">${icon}</button>`;
}

function handleItemAction(action, itemKey) {
  const project = currentProject();
  const found = findItem(itemKey);
  if (!project || !found) return;
  const { section, item } = found;

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
  render();
}

function filteredItems(section) {
  return section.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!state.query) return true;
      return searchableText({ ...item, section: section.name }).includes(state.query);
    });
}

function copyActiveSection() {
  const section = activeSection();
  if (!section) return;
  copyText(section.items.map(formatItem).join("\n"));
  toast("Seccion copiada al portapapeles");
}

function markActiveSectionUsed() {
  const project = currentProject();
  const section = activeSection();
  if (!section) return;
  section.items.forEach(item => item.used = true);
  project.updatedAt = new Date().toISOString();
  persist();
  renderProjectPanel();
  toast("Seccion marcada");
}

function openItemDialog() {
  state.editing = { type: "item" };
  els.dialogTitle.textContent = "Anadir item";
  els.dialogLabel.textContent = "Linea o bloque";
  els.dialogText.value = "";
  els.editDialog.showModal();
}

function openSectionDialog() {
  const section = activeSection();
  if (!section) return;
  state.editing = { type: "section" };
  els.dialogTitle.textContent = `Editar @${section.name}`;
  els.dialogLabel.textContent = "Contenido de la seccion";
  els.dialogText.value = section.items.map(formatItem).join("\n");
  els.editDialog.showModal();
}

function openSectionCreateDialog() {
  state.editing = { type: "new-section" };
  els.dialogTitle.textContent = "Anadir seccion";
  els.dialogLabel.textContent = "Nombre y contenido. Ej: @THUMBNAILS";
  els.dialogText.value = "@NUEVA_SECCION\n";
  els.editDialog.showModal();
}

function openNotesDialog() {
  const project = currentProject();
  if (!project) return;
  state.editing = { type: "notes" };
  els.dialogTitle.textContent = "Notas del proyecto";
  els.dialogLabel.textContent = "Notas";
  els.dialogText.value = project.notes || "";
  els.editDialog.showModal();
}

function openProjectDialog() {
  const project = currentProject();
  if (!project) return;
  state.editing = { type: "project" };
  els.dialogTitle.textContent = "Editar proyecto";
  els.dialogLabel.textContent = "Nombre del proyecto";
  els.dialogText.value = project.metadata.PROJECT || "";
  els.editDialog.showModal();
}

function saveDialogEdit(event) {
  event.preventDefault();
  const project = currentProject();
  const section = activeSection();
  const text = els.dialogText.value.trim();
  if (!project || !state.editing) return;

  if (state.editing.type === "item" && section && text) {
    text.split("\n").filter(Boolean).forEach(line => section.items.push(parseItemLine(line)));
    toast("Item agregado");
  }
  if (state.editing.type === "section" && section) {
    section.items = text.split("\n").filter(Boolean).map(parseItemLine);
    section.raw = text;
    toast("Seccion actualizada");
  }
  if (state.editing.type === "new-section" && text) {
    const parsed = parseSectionBlock(text);
    project.sections.push(parsed);
    state.activeSection = project.sections.length - 1;
    toast("Seccion agregada");
  }
  if (state.editing.type === "notes") {
    project.notes = text;
    toast("Notas guardadas");
  }
  if (state.editing.type === "project" && text) {
    project.metadata.PROJECT = text;
    toast("Proyecto actualizado");
  }

  project.updatedAt = new Date().toISOString();
  project.tags = autoTags(project);
  persist();
  els.editDialog.close();
  render();
}

function parseSectionBlock(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const first = lines[0].match(/^@?([A-Za-z0-9_-]+)\s*(?::)?\s*(.*)$/);
  const name = first?.[1] || "NUEVA_SECCION";
  const inline = first?.[2] || "";
  const contentLines = [inline, ...lines.slice(1)].filter(Boolean);
  return {
    id: crypto.randomUUID(),
    name,
    raw: contentLines.join("\n"),
    items: contentLines.map(parseItemLine)
  };
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
  state.currentProjectId = clone.id;
  persist();
  render();
  toast("Proyecto duplicado");
}

function exportCurrentProject() {
  const project = currentProject();
  if (!project) return;
  downloadJson(`${slug(project.metadata.PROJECT)}.json`, project);
}

function exportBackup() {
  downloadJson(`prompt-cms-backup-${new Date().toISOString().slice(0, 10)}.json`, {
    exportedAt: new Date().toISOString(),
    projects: state.projects
  });
}

function deleteCurrentProject() {
  const project = currentProject();
  if (!project) return;
  const ok = confirm(`Eliminar "${project.metadata.PROJECT}"?`);
  if (!ok) return;
  state.projects = state.projects.filter(candidate => candidate.id !== project.id);
  state.currentProjectId = state.projects[0]?.id || null;
  state.activeSection = 0;
  persist();
  render();
  toast("Proyecto eliminado");
}

async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    const imported = normalizeProjects(Array.isArray(data.projects) ? data.projects : [data]);
    imported.forEach(project => {
      project.id = project.id || crypto.randomUUID();
      project.updatedAt = new Date().toISOString();
      state.projects.unshift(project);
    });
    state.currentProjectId = state.projects[0]?.id || null;
  } catch {
    const project = parsePromptDocument(text);
    state.projects.unshift(project);
    state.currentProjectId = project.id;
  }
  event.target.value = "";
  persist();
  render();
  toast("Importado");
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
  render();
}

function currentProject() {
  return state.projects.find(project => project.id === state.currentProjectId);
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
  return project.sections
    .flatMap(section => section.items.map(item => ({ section, item })))
    .sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt));
}

function findItem(itemKey) {
  const project = currentProject();
  if (!project) return null;
  for (const section of project.sections) {
    const item = section.items.find(candidate => candidate.uid === itemKey);
    if (item) return { section, item };
  }
  return null;
}

function countItems(project) {
  return project.sections.reduce((sum, section) => sum + section.items.length, 0);
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
  return `<span class="fact"><span>${icon}</span>${tag ? `<b>${escapeHtml(text)}</b>` : escapeHtml(text)}</span>`;
}

function summaryRow(icon, label, value) {
  return `<div class="summary-row"><span>${icon} ${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`;
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
  els.toast.textContent = `✓ ${message}`;
  els.toast.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("visible"), 1900);
}
