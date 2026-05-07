/* MD Studio — app.js */

// ── Storage helpers ──────────────────────────────────────────
const DOCS_KEY = 'mdstudio_docs';
const ACTIVE_KEY = 'mdstudio_active';

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY)) || []; }
  catch { return []; }
}

function saveDocs(docs) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── State ────────────────────────────────────────────────────
let docs = loadDocs();
let activeId = localStorage.getItem(ACTIVE_KEY);
let currentMode = 'edit';
let saveTimer = null;
let searchQuery = '';

// ── DOM refs ─────────────────────────────────────────────────
const $sidebar      = document.getElementById('sidebar');
const $docList      = document.getElementById('doc-list');
const $searchInput  = document.getElementById('search-input');
const $editor       = document.getElementById('editor');
const $preview      = document.getElementById('preview');
const $editorPane   = document.getElementById('editor-pane');
const $previewPane  = document.getElementById('preview-pane');
const $divider      = document.getElementById('divider');
const $docTitle     = document.getElementById('doc-title');
const $wordCount    = document.getElementById('word-count');
const $charCount    = document.getElementById('char-count');
const $saveStatus   = document.getElementById('save-status');
const $formatBar    = document.getElementById('format-bar');
const $newDocBtn    = document.getElementById('new-doc-btn');
const $deleteDocBtn = document.getElementById('delete-doc-btn');
const $sidebarToggle= document.getElementById('sidebar-toggle');

// ── Marked config ────────────────────────────────────────────
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; } catch {}
    }
    return hljs.highlightAuto(code).value;
  }
});

// ── Render ───────────────────────────────────────────────────
function renderPreview(md) {
  $preview.innerHTML = marked.parse(md || '');
}

// ── Stats ────────────────────────────────────────────────────
function updateStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $wordCount.textContent = words + (words === 1 ? ' word' : ' words');
  $charCount.textContent = text.length + (text.length === 1 ? ' char' : ' chars');
}

// ── Save ─────────────────────────────────────────────────────
function scheduleSave() {
  $saveStatus.textContent = 'Saving…';
  $saveStatus.className = 'saving';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(commitSave, 800);
}

function commitSave() {
  const doc = docs.find(d => d.id === activeId);
  if (!doc) return;
  doc.title = $docTitle.value || 'Untitled';
  doc.content = $editor.value;
  doc.updatedAt = Date.now();
  saveDocs(docs);
  renderDocList();
  $saveStatus.textContent = 'Saved';
  $saveStatus.className = 'saved';
  setTimeout(() => {
    if ($saveStatus.textContent === 'Saved') $saveStatus.className = '';
  }, 1800);
}

// ── Doc list ─────────────────────────────────────────────────
function renderDocList() {
  const q = searchQuery.toLowerCase();
  const filtered = docs
    .filter(d => !q || d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (filtered.length === 0) {
    $docList.innerHTML = `
      <div style="padding:24px 12px;text-align:center;color:var(--text-secondary);font-size:13px;">
        ${q ? 'No results' : 'No documents yet'}
      </div>`;
    return;
  }

  $docList.innerHTML = filtered.map(d => `
    <div class="doc-item${d.id === activeId ? ' active' : ''}" data-id="${d.id}">
      <span class="doc-item-icon">📄</span>
      <div class="doc-item-info">
        <div class="doc-item-name">${escHtml(d.title || 'Untitled')}</div>
        <div class="doc-item-date">${formatDate(d.updatedAt)}</div>
      </div>
    </div>`
  ).join('');

  $docList.querySelectorAll('.doc-item').forEach(el => {
    el.addEventListener('click', () => openDoc(el.dataset.id));
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Open / Create / Delete ────────────────────────────────────
function openDoc(id) {
  clearTimeout(saveTimer);
  activeId = id;
  localStorage.setItem(ACTIVE_KEY, id);
  const doc = docs.find(d => d.id === id);
  if (!doc) return;
  $docTitle.value = doc.title || '';
  $editor.value = doc.content || '';
  renderPreview(doc.content || '');
  updateStats(doc.content || '');
  renderDocList();
  $saveStatus.textContent = '';
}

function createDoc(content = '', title = '') {
  const doc = {
    id: genId(),
    title: title || 'Untitled',
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  docs.unshift(doc);
  saveDocs(docs);
  openDoc(doc.id);
}

function deleteCurrentDoc() {
  if (!activeId) return;
  const idx = docs.findIndex(d => d.id === activeId);
  if (idx === -1) return;
  docs.splice(idx, 1);
  saveDocs(docs);
  if (docs.length > 0) {
    openDoc(docs[0].id);
  } else {
    activeId = null;
    localStorage.removeItem(ACTIVE_KEY);
    $docTitle.value = '';
    $editor.value = '';
    $preview.innerHTML = '';
    updateStats('');
    renderDocList();
  }
}

// ── Mode switching ────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  const showEdit    = mode === 'edit'    || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';
  const showDivider = mode === 'split';

  $editorPane.classList.toggle('hidden', !showEdit);
  $previewPane.classList.toggle('hidden', !showPreview);
  $divider.classList.toggle('hidden', !showDivider);

  if (showEdit) $editor.focus();
}

// ── Resizable divider ─────────────────────────────────────────
let dividerDragging = false;

$divider.addEventListener('mousedown', e => {
  dividerDragging = true;
  $divider.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!dividerDragging) return;
  const area = document.getElementById('editor-area');
  const rect = area.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width) * 100;
  const clamped = Math.min(Math.max(pct, 20), 80);
  $editorPane.style.flex = 'none';
  $editorPane.style.width = clamped + '%';
  $previewPane.style.flex = '1';
});

document.addEventListener('mouseup', () => {
  if (!dividerDragging) return;
  dividerDragging = false;
  $divider.classList.remove('dragging');
});

// ── Format bar ───────────────────────────────────────────────
const formatActions = {
  bold:       { wrap: '**', placeholder: 'bold text' },
  italic:     { wrap: '_', placeholder: 'italic text' },
  code:       { wrap: '`', placeholder: 'code' },
  link:       { before: '[', after: '](url)', placeholder: 'link text' },
  h1:         { before: '# ', linePrefix: true },
  h2:         { before: '## ', linePrefix: true },
  ul:         { before: '- ', linePrefix: true },
  blockquote: { before: '> ', linePrefix: true },
};

$formatBar.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    applyFormat(btn.dataset.action);
  });
});

function applyFormat(action) {
  const { wrap, before, after, placeholder, linePrefix } = formatActions[action] || {};
  const start = $editor.selectionStart;
  const end   = $editor.selectionEnd;
  const text  = $editor.value;
  const sel   = text.slice(start, end);

  let newText, newStart, newEnd;

  if (linePrefix) {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const prefix = before;
    const lineText = text.slice(lineStart, end);
    newText = text.slice(0, lineStart) + prefix + lineText + text.slice(end);
    newStart = start + prefix.length;
    newEnd   = end + prefix.length;
  } else if (wrap) {
    const inserted = sel || placeholder;
    newText  = text.slice(0, start) + wrap + inserted + wrap + text.slice(end);
    newStart = start + wrap.length;
    newEnd   = newStart + inserted.length;
  } else {
    const inserted = sel || placeholder;
    const suf = after || '';
    newText  = text.slice(0, start) + before + inserted + suf + text.slice(end);
    newStart = start + before.length;
    newEnd   = newStart + inserted.length;
  }

  $editor.value = newText;
  $editor.setSelectionRange(newStart, newEnd);
  $editor.focus();
  handleEditorInput();
}

// Show/hide format bar on selection
$editor.addEventListener('mouseup', positionFormatBar);
$editor.addEventListener('keyup', e => {
  if (e.shiftKey) positionFormatBar();
  else hideFormatBar();
});

function positionFormatBar() {
  const start = $editor.selectionStart;
  const end   = $editor.selectionEnd;
  if (start === end) { hideFormatBar(); return; }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const rect  = range.getBoundingClientRect();

  if (rect.width === 0) {
    // Fallback: position above editor
    const er = $editor.getBoundingClientRect();
    $formatBar.style.left = (er.left + er.width / 2 - 120) + 'px';
    $formatBar.style.top  = (er.top + 8) + 'px';
  } else {
    const barW = 240;
    let x = rect.left + rect.width / 2 - barW / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - barW - 8));
    $formatBar.style.left = x + 'px';
    $formatBar.style.top  = (rect.top - 50 + window.scrollY) + 'px';
  }

  $formatBar.classList.add('visible');
}

function hideFormatBar() {
  $formatBar.classList.remove('visible');
}

document.addEventListener('mousedown', e => {
  if (!$formatBar.contains(e.target) && e.target !== $editor) hideFormatBar();
});

// ── Editor input ─────────────────────────────────────────────
function handleEditorInput() {
  const text = $editor.value;
  renderPreview(text);
  updateStats(text);
  scheduleSave();
}

$editor.addEventListener('input', handleEditorInput);

// Tab key → indent
$editor.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = $editor.selectionStart;
    const v = $editor.value;
    $editor.value = v.slice(0, s) + '  ' + v.slice($editor.selectionEnd);
    $editor.selectionStart = $editor.selectionEnd = s + 2;
    handleEditorInput();
  }
  // Cmd/Ctrl+S
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    clearTimeout(saveTimer);
    commitSave();
  }
  // Cmd+B/I/K shortcuts
  if (e.metaKey || e.ctrlKey) {
    if (e.key === 'b') { e.preventDefault(); applyFormat('bold'); }
    if (e.key === 'i') { e.preventDefault(); applyFormat('italic'); }
    if (e.key === 'k') { e.preventDefault(); applyFormat('link'); }
  }
});

$docTitle.addEventListener('input', scheduleSave);

// ── Sidebar toggle ────────────────────────────────────────────
$sidebarToggle.addEventListener('click', () => {
  $sidebar.classList.toggle('collapsed');
});

// ── New / Delete ─────────────────────────────────────────────
$newDocBtn.addEventListener('click', () => {
  clearTimeout(saveTimer);
  if (activeId) commitSave();
  createDoc('', 'Untitled');
});

$deleteDocBtn.addEventListener('click', () => {
  if (!activeId) return;
  const doc = docs.find(d => d.id === activeId);
  const name = doc ? (doc.title || 'Untitled') : 'this document';
  if (confirm(`Delete "${name}"?`)) deleteCurrentDoc();
});

// ── Mode buttons ─────────────────────────────────────────────
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// ── Search ───────────────────────────────────────────────────
$searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  renderDocList();
});

// ── Init ─────────────────────────────────────────────────────
function init() {
  if (docs.length === 0) {
    createDoc(WELCOME_MD, 'Welcome to MD Studio');
  } else {
    const id = activeId && docs.find(d => d.id === activeId) ? activeId : docs[0].id;
    openDoc(id);
  }
  setMode('split');
  renderDocList();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ── Welcome content ───────────────────────────────────────────
const WELCOME_MD = `# Welcome to MD Studio

A **fluid, offline-capable** Markdown editor inspired by Apple's design language.

## Features

- **Live split view** — edit and preview simultaneously
- **Floating format bar** — select text to reveal formatting tools
- **Keyboard shortcuts** — \`⌘B\` bold, \`⌘I\` italic, \`⌘K\` link, \`⌘S\` save
- **Auto-save** — changes persist locally in your browser
- **Offline** — works entirely without an internet connection
- **Syntax highlighting** — code blocks render beautifully

---

## Markdown Showcase

### Inline formatting

You can write **bold**, *italic*, \`inline code\`, and [links](https://example.com).

### Code Block

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet('World'));
\`\`\`

### Blockquote

> The details are not the details. They make the design.
> — Charles Eames

### Table

| Feature       | Status  |
|---------------|---------|
| Markdown       | ✅ Done |
| Syntax highlight | ✅ Done |
| Offline        | ✅ Done |
| Dark mode      | ✅ Done |

### Task list

- [x] Create a new document
- [x] Try split view mode
- [ ] Write something amazing

---

*Start writing by clicking the **+** button in the sidebar, or edit this document.*
`;

init();
