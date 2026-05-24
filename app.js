const STORAGE_KEY = "prompt-cms-projects-v1";
const THEME_KEY = "prompt-cms-theme-v1";
const ITEM_HEIGHT = 154;
const OVERSCAN = 6;

const exampleText = `@PROJECT: Galaxies
@GENRE: Space Trance

@SUNO
Cosmic trance anthem with shimmering arps, deep sidechain bass, wide pads, and a euphoric drop.

@WALLPAPERS
IMG01|16:9:: A luminous spiral galaxy above a glassy alien ocean, cinematic, ultra detailed
IMG02|16:9:: Neon starship crossing a purple nebula, high contrast, clean composition

@VERTICALS
IMG01|9:16:: Astronaut floating through glowing dust clouds, mobile wallpaper, crisp focus

@TRACKS
TRACK01:: Sunset Motion
TRACK02:: Orbital Bloom

@COVER
Album cover with a chrome planet, radiant rings, elegant sci-fi typography area

@YT_TITLE_EN
Galaxies - Space Trance Journey

@DESC_EN
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
  globalSearch: document.querySelector("#globalSearch"),
  sortSelect: document.querySelector("#sortSelect"),
  sourceInput: document.querySelector("#sourceInput"),
  parseBtn: document.querySelector("#parseBtn"),
  exampleBtn: document.querySelector("#exampleBtn"),
  newProjectBtn: document.querySelector("#newProjectBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  backupBtn: document.querySelector("#backupBtn"),
  themeToggle: document.querySelector("#themeToggle"),
  duplicateBtn: document.querySelector("#duplicateBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  projectTitle: document.querySelector("#projectTitle"),
  projectMeta: document.querySelector("#projectMeta"),
  composer: document.querySelector("#composer"),
  projectPanel: document.querySelector("#projectPanel"),
  stats: document.querySelector("#stats"),
  sectionTabs: document.querySelector("#sectionTabs"),
  sectionSummary: document.querySelector("#sectionSummary"),
  itemList: document.querySelector("#itemList"),
  copySectionBtn: document.querySelector("#copySectionBtn"),
  markSectionUsedBtn: document.querySelector("#markSectionUsedBtn"),
  addItemBtn: document.querySelector("#addItemBtn"),
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
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || "light";
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
  els.exampleBtn.addEventListener("click", () => {
    els.sourceInput.value = exampleText;
    toast("Ejemplo cargado");
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
  els.copySectionBtn.addEventListener("click", copyActiveSection);
  els.markSectionUsedBtn.addEventListener("click", markActiveSectionUsed);
  els.addItemBtn.addEventListener("click", () => openItemDialog());
  els.editSectionBtn.addEventListener("click", openSectionDialog);
  els.duplicateBtn.addEventListener("click", duplicateCurrentProject);
  els.exportBtn.addEventListener("click", exportCurrentProject);
  els.deleteBtn.addEventListener("click", deleteCurrentProject);
  els.importBtn.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", importFile);
  els.backupBtn.addEventListener("click", exportBackup);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.dialogSave.addEventListener("click", saveDialogEdit);
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
  renderProjectList();
  renderCurrentProject();
}

function renderProjectList() {
  const projects = sortedProjects().filter(projectMatchesQuery);
  els.projectList.innerHTML = projects.map(project => {
    const count = project.sections.reduce((sum, section) => sum + section.items.length, 0);
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
  els.duplicateBtn.disabled = !hasProject;
  els.exportBtn.disabled = !hasProject;
  els.deleteBtn.disabled = !hasProject;

  if (!project) {
    els.projectTitle.textContent = "Crea o importa un documento";
    els.projectMeta.textContent = "Sin proyecto seleccionado";
    return;
  }

  els.projectTitle.textContent = project.metadata.PROJECT || "Untitled Project";
  els.projectMeta.textContent = `${project.sections.length} secciones · actualizado ${formatDate(project.updatedAt)}`;
  renderProjectPanel();
}

function renderProjectPanel() {
  const project = currentProject();
  if (!project) return;
  if (state.activeSection >= project.sections.length) state.activeSection = 0;
  const totalItems = project.sections.reduce((sum, section) => sum + section.items.length, 0);
  const usedItems = project.sections.reduce((sum, section) => sum + section.items.filter(item => item.used).length, 0);

  els.stats.innerHTML = [
    pill(`${totalItems} items`),
    pill(`${usedItems} usados`),
    pill(`${project.tags?.length || 0} tags`)
  ].join("");

  els.sectionTabs.innerHTML = project.sections.map((section, index) => {
    return `<button class="tab ${index === state.activeSection ? "active" : ""}" data-section-index="${index}" role="tab">
      @${escapeHtml(section.name)} (${section.items.length})
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
  els.sectionSummary.innerHTML = [
    pill(`Seccion @${section.name}`),
    pill(`${section.items.length} elementos`),
    ...ratios.map(ratio => pill(ratio))
  ].join("");
  renderItems();
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

function itemTemplate(item, index) {
  const labels = [item.id, item.type, item.ratio].filter(Boolean);
  return `<article class="item-card ${item.used ? "used" : ""} ${item.expanded ? "expanded" : ""}" style="top:${index * ITEM_HEIGHT}px">
    <div class="item-main">
      <div class="item-title">
        <strong>${escapeHtml(item.id || "Item")}</strong>
        ${labels.map(label => pill(escapeHtml(label))).join("")}
        ${item.used ? `<span class="pill used-pill">usado</span>` : ""}
      </div>
      <div class="item-content">${escapeHtml(item.content)}</div>
    </div>
    <div class="item-actions">
      <button class="icon-button" title="Copiar" data-action="copy" data-item-key="${item.uid}">C</button>
      <button class="icon-button" title="Marcar usado" data-action="used" data-item-key="${item.uid}">U</button>
      <button class="icon-button rating-like" title="Like" data-action="like" data-item-key="${item.uid}">+</button>
      <button class="icon-button rating-dislike" title="Dislike" data-action="dislike" data-item-key="${item.uid}">-</button>
      <button class="icon-button" title="Favorito" data-action="favorite" data-item-key="${item.uid}">F</button>
      <button class="icon-button" title="Expandir" data-action="expand" data-item-key="${item.uid}">${item.expanded ? "^" : "v"}</button>
    </div>
  </article>`;
}

function handleItemAction(action, itemKey) {
  const project = currentProject();
  const section = activeSection();
  const item = section.items.find(candidate => candidate.uid === itemKey);
  if (!item) return;

  if (action === "copy") {
    copyText(item.content);
    project.copyHistory.unshift({ itemId: item.id, section: section.name, copiedAt: new Date().toISOString() });
    project.copyHistory = project.copyHistory.slice(0, 100);
    toast("Item copiado");
  }
  if (action === "used") item.used = !item.used;
  if (action === "like") item.rating = item.rating === "like" ? null : "like";
  if (action === "dislike") item.rating = item.rating === "dislike" ? null : "dislike";
  if (action === "favorite") item.favorite = !item.favorite;
  if (action === "expand") item.expanded = !item.expanded;

  project.updatedAt = new Date().toISOString();
  persist();
  renderProjectPanel();
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
  toast("Seccion copiada");
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
  els.dialogTitle.textContent = "Agregar item";
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

function saveDialogEdit(event) {
  event.preventDefault();
  const project = currentProject();
  const section = activeSection();
  const text = els.dialogText.value.trim();
  if (!project || !section || !state.editing) return;

  if (state.editing.type === "item" && text) {
    text.split("\n").filter(Boolean).forEach(line => section.items.push(parseItemLine(line)));
    toast("Item agregado");
  }
  if (state.editing.type === "section") {
    section.items = text.split("\n").filter(Boolean).map(parseItemLine);
    section.raw = text;
    toast("Seccion actualizada");
  }

  project.updatedAt = new Date().toISOString();
  project.tags = autoTags(project);
  persist();
  els.editDialog.close();
  render();
}

function duplicateCurrentProject() {
  const project = currentProject();
  if (!project) return;
  const clone = structuredClone(project);
  clone.id = crypto.randomUUID();
  clone.metadata.PROJECT = `${clone.metadata.PROJECT || "Untitled Project"} Copy`;
  clone.createdAt = new Date().toISOString();
  clone.updatedAt = clone.createdAt;
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
  const ignored = new Set(["prompt", "with", "para", "seccion", "description", "title"]);
  const counts = new Map();
  words.forEach(word => {
    if (!ignored.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word]) => word);
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
    project.copyHistory = Array.isArray(project.copyHistory) ? project.copyHistory : [];
    project.sections.forEach(section => {
      section.id = section.id || crypto.randomUUID();
      section.name = section.name || "SECTION";
      section.items = Array.isArray(section.items) ? section.items : [];
      section.items.forEach(item => {
        item.uid = item.uid || crypto.randomUUID();
        item.content = item.content || "";
        item.createdAt = item.createdAt || new Date().toISOString();
        item.used = Boolean(item.used);
        item.favorite = Boolean(item.favorite);
        item.expanded = Boolean(item.expanded);
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

function formatDate(date) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function slug(text = "project") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

function unique(values) {
  return [...new Set(values)];
}

function pill(text) {
  return `<span class="pill">${text}</span>`;
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
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("visible"), 1800);
}
