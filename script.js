// ================================================
// Beyond the Keys - BTK Management System
// Main Application JavaScript
// ================================================

// ============================================
// Theme Manager - Light/Dark Mode Toggle
// ============================================
class ThemeManager {
  constructor() {
    this.themeToggle = null;
    this.themeIcon = null;
    this.currentTheme = localStorage.getItem('btk-theme') || 'light';
  }

  init() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');

    // Apply saved theme
    this.applyTheme(this.currentTheme);

    // Add event listener
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      if (this.themeIcon) this.themeIcon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark-theme');
      if (this.themeIcon) this.themeIcon.textContent = '🌙';
    }
    this.currentTheme = theme;
    localStorage.setItem('btk-theme', theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }
}

const themeManager = new ThemeManager();

// ============================================
// Data Manager - Git-First Data Management
// ============================================
class DataManager {
  constructor() {
    this.cache = {};
    this.baseUrl = 'data/';
  }

  async load(fileName) {
    if (this.cache[fileName]) {
      return this.cache[fileName];
    }

    try {
      const response = await fetch(`${this.baseUrl}${fileName}`);
      if (!response.ok) throw new Error('Failed to load data');
      const data = await response.json();
      this.cache[fileName] = data;
      return data;
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
      return this.getDefaultData(fileName);
    }
  }

  async save(fileName, data) {
    this.cache[fileName] = data;
    // In a real Git-first system, this would trigger a git commit
    // For browser-based demo, we'll use localStorage
    localStorage.setItem(`btk_${fileName}`, JSON.stringify(data));
    console.log(`[BTK] Data saved: ${fileName}`);
    return true;
  }

  getDefaultData(fileName) {
    const defaults = {
      'dashboard.json': { tasks: [], reviews: [], writingProgress: {}, knowledgeSummary: {} },
      'documents.json': { documents: [] },
      'knowledge.json': { items: [] },
      'writing_projects.json': { projects: [] },
      'tasks.json': { tasks: [], reviews: [], metrics: {} }
    };
    return defaults[fileName] || {};
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  formatDateTime(date = new Date()) {
    return date.toISOString().replace('T', ' ').split('.')[0];
  }
}

// ============================================
// Router - View Management
// ============================================
class Router {
  constructor(app) {
    this.app = app;
    this.currentView = null;
    this.modules = {};
    this.setupNavigation();
  }

  registerModule(name, module) {
    this.modules[name] = module;
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.bt-nav button');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.navigate(view);

        // Update active state
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  navigate(viewName) {
    this.currentView = viewName;
    const module = this.modules[viewName];

    if (module) {
      module.render();
    } else {
      this.app.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">מודול לא נמצא</div>
      </div>`;
    }
  }
}

// ============================================
// Module 1: Dashboard
// ============================================
class DashboardModule {
  constructor(app, dataManager) {
    this.app = app;
    this.dm = dataManager;
  }

  async render() {
    this.app.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h1 class="module-title">📊 לוח מצב</h1>
          <p class="module-description">סקירה כללית של כל הפעילויות במערכת</p>
        </div>

        <div class="stats-grid" id="dashboard-stats">
          <div class="stat-card">
            <div class="stat-value">⏳</div>
            <div class="stat-label">טוען נתונים...</div>
          </div>
        </div>

        <div class="card-grid" id="dashboard-content">
          <div class="card">
            <div class="card-title">טוען...</div>
          </div>
        </div>

        <div class="btn-group">
          <button class="btn btn-success" onclick="dashboard.markDone()">✓ סיום</button>
          <button class="btn btn-secondary" onclick="dashboard.refresh()">🔄 רענון</button>
        </div>
      </div>
    `;

    await this.loadData();
  }

  async loadData() {
    const dashData = await this.dm.load('dashboard.json');
    const tasksData = await this.dm.load('tasks.json');
    const docsData = await this.dm.load('documents.json');
    const knowledgeData = await this.dm.load('knowledge.json');
    const writingData = await this.dm.load('writing_projects.json');

    this.renderStats(tasksData, docsData, knowledgeData, writingData);
    this.renderContent(dashData, tasksData);
  }

  renderStats(tasks, docs, knowledge, writing) {
    const statsContainer = document.getElementById('dashboard-stats');
    const totalTasks = tasks.tasks?.length || 0;
    const completedTasks = tasks.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalDocs = docs.documents?.length || 0;
    const totalKnowledge = knowledge.items?.length || 0;
    const totalProjects = writing.projects?.length || 0;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${totalTasks}</div>
        <div class="stat-label">משימות כוללות</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${completedTasks}</div>
        <div class="stat-label">משימות שהושלמו</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalDocs}</div>
        <div class="stat-label">מסמכים</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalKnowledge}</div>
        <div class="stat-label">פריטי ידע</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalProjects}</div>
        <div class="stat-label">פרויקטי כתיבה</div>
      </div>
    `;
  }

  renderContent(dashData, tasksData) {
    const contentContainer = document.getElementById('dashboard-content');
    const recentTasks = (tasksData.tasks || []).slice(-5);

    if (recentTasks.length === 0) {
      contentContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">אין משימות</div>
          <div class="empty-state-description">לחץ על מודול הניהול להוספת משימות</div>
        </div>
      `;
      return;
    }

    contentContainer.innerHTML = recentTasks.map(task => `
      <div class="card">
        <div class="card-title">${task.title}</div>
        <div class="card-content">${task.description || 'אין תיאור'}</div>
        <div class="card-meta">
          <span class="badge badge-${task.status === 'completed' ? 'success' : 'warning'}">
            ${task.status === 'completed' ? 'הושלם' : 'בתהליך'}
          </span>
          <span style="margin-right: 0.5rem;">${task.createdAt || ''}</span>
        </div>
      </div>
    `).join('');
  }

  async markDone() {
    const dashData = await this.dm.load('dashboard.json');
    dashData.lastUpdated = this.dm.formatDateTime();
    await this.dm.save('dashboard.json', dashData);
    this.showToast('✓ לוח המצב עודכן');
  }

  async refresh() {
    this.dm.cache = {}; // Clear cache
    await this.render();
    this.showToast('🔄 הנתונים רועננו');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

// ============================================
// Module 2: Document Library
// ============================================
class DocumentLibraryModule {
  constructor(app, dataManager) {
    this.app = app;
    this.dm = dataManager;
    this.currentDoc = null;
    this.editorStyles = null;
  }

  async render() {
    await this.loadEditorStyles();

    this.app.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h1 class="module-title">📄 ספריית מסמכים</h1>
          <p class="module-description">עורך מסמכים מתקדם עם יצוא DOCX/PDF</p>
        </div>

        <div class="btn-group mb-2">
          <button class="btn" onclick="docLibrary.createNewDoc()">+ מסמך חדש</button>
          <button class="btn btn-secondary" onclick="docLibrary.showDocList()">📚 רשימת מסמכים</button>
        </div>

        <div id="doc-workspace"></div>
      </div>
    `;

    await this.showDocList();
  }

  async loadEditorStyles() {
    try {
      const response = await fetch('data/editor_styles.json');
      this.editorStyles = await response.json();
    } catch (error) {
      console.error('Failed to load editor styles');
    }
  }

  async showDocList() {
    const data = await this.dm.load('documents.json');
    const docs = data.documents || [];
    const workspace = document.getElementById('doc-workspace');

    if (docs.length === 0) {
      workspace.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-title">אין מסמכים</div>
          <div class="empty-state-description">לחץ על "מסמך חדש" ליצירת המסמך הראשון</div>
        </div>
      `;
      return;
    }

    workspace.innerHTML = `
      <div class="item-list">
        ${docs.map(doc => `
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">${doc.title}</div>
              <div class="list-item-meta">
                ${doc.type || 'כללי'} | ${doc.status || 'טיוטה'} | ${doc.createdAt}
              </div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-secondary" onclick="docLibrary.editDoc('${doc.id}')">✎ עריכה</button>
              <button class="btn btn-warning" onclick="docLibrary.exportDoc('${doc.id}')">⬇ יצוא</button>
              <button class="btn btn-danger" onclick="docLibrary.deleteDoc('${doc.id}')">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  createNewDoc() {
    this.currentDoc = {
      id: this.dm.generateId(),
      title: 'מסמך חדש',
      content: '',
      type: 'general',
      status: 'draft',
      createdAt: this.dm.formatDateTime()
    };
    this.showEditor();
  }

  async editDoc(docId) {
    const data = await this.dm.load('documents.json');
    this.currentDoc = data.documents.find(d => d.id === docId);
    if (this.currentDoc) {
      this.showEditor();
    }
  }

  showEditor() {
    const workspace = document.getElementById('doc-workspace');
    workspace.innerHTML = `
      <div class="form-group">
        <label class="form-label">כותרת המסמך</label>
        <input type="text" class="form-input" id="doc-title" value="${this.currentDoc.title}">
      </div>

      <div class="editor-container">
        <div class="editor-toolbar">
          <button onclick="docLibrary.applyStyle('title')">כותרת</button>
          <button onclick="docLibrary.applyStyle('heading1')">כותרת 1</button>
          <button onclick="docLibrary.applyStyle('heading2')">כותרת 2</button>
          <button onclick="docLibrary.applyStyle('heading3')">כותרת 3</button>
          <button onclick="docLibrary.applyStyle('quote')">ציטוט</button>
          <button onclick="docLibrary.formatText('bold')">B</button>
          <button onclick="docLibrary.formatText('italic')">I</button>
          <button onclick="docLibrary.formatText('underline')">U</button>
        </div>
        <div class="editor-content" contenteditable="true" id="doc-editor">${this.currentDoc.content}</div>
      </div>

      <div class="form-group mt-2">
        <label class="form-label">סוג מסמך</label>
        <select class="form-select" id="doc-type">
          <option value="general" ${this.currentDoc.type === 'general' ? 'selected' : ''}>כללי</option>
          <option value="report" ${this.currentDoc.type === 'report' ? 'selected' : ''}>דוח</option>
          <option value="article" ${this.currentDoc.type === 'article' ? 'selected' : ''}>מאמר</option>
          <option value="note" ${this.currentDoc.type === 'note' ? 'selected' : ''}>הערה</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">סטטוס</label>
        <select class="form-select" id="doc-status">
          <option value="draft" ${this.currentDoc.status === 'draft' ? 'selected' : ''}>טיוטה</option>
          <option value="review" ${this.currentDoc.status === 'review' ? 'selected' : ''}>בסקירה</option>
          <option value="final" ${this.currentDoc.status === 'final' ? 'selected' : ''}>סופי</option>
        </select>
      </div>

      <div class="btn-group mt-2">
        <button class="btn btn-success" onclick="docLibrary.saveDoc()">💾 שמירה</button>
        <button class="btn btn-warning" onclick="docLibrary.exportCurrentDoc()">⬇ יצוא</button>
        <button class="btn btn-secondary" onclick="docLibrary.showDocList()">← חזרה</button>
      </div>
    `;
  }

  applyStyle(styleName) {
    const editor = document.getElementById('doc-editor');
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.setAttribute('data-style', styleName);
      span.style.fontWeight = styleName.includes('heading') || styleName === 'title' ? 'bold' : 'normal';
      span.style.fontSize = styleName === 'title' ? '2em' : styleName === 'heading1' ? '1.5em' : '1em';
      range.surroundContents(span);
    }
  }

  formatText(command) {
    document.execCommand(command, false, null);
  }

  async saveDoc() {
    const title = document.getElementById('doc-title').value;
    const content = document.getElementById('doc-editor').innerHTML;
    const type = document.getElementById('doc-type').value;
    const status = document.getElementById('doc-status').value;

    this.currentDoc.title = title;
    this.currentDoc.content = content;
    this.currentDoc.type = type;
    this.currentDoc.status = status;
    this.currentDoc.updatedAt = this.dm.formatDateTime();

    const data = await this.dm.load('documents.json');
    const existingIndex = data.documents.findIndex(d => d.id === this.currentDoc.id);

    if (existingIndex >= 0) {
      data.documents[existingIndex] = this.currentDoc;
    } else {
      data.documents.push(this.currentDoc);
    }

    await this.dm.save('documents.json', data);

    // Save markdown version
    const mdContent = this.convertToMarkdown(content, title);
    localStorage.setItem(`btk_doc_${this.currentDoc.id}.md`, mdContent);

    this.showToast('✓ המסמך נשמר בהצלחה');
  }

  convertToMarkdown(htmlContent, title) {
    let md = `# ${title}\n\n`;
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    md += temp.textContent;
    return md;
  }

  exportCurrentDoc() {
    if (!this.currentDoc) return;

    const content = document.getElementById('doc-editor').innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentDoc.title}.html`;
    a.click();

    this.showToast('✓ המסמך יוצא בהצלחה');
  }

  async exportDoc(docId) {
    const data = await this.dm.load('documents.json');
    const doc = data.documents.find(d => d.id === docId);
    if (doc) {
      const blob = new Blob([doc.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.html`;
      a.click();
      this.showToast('✓ המסמך יוצא');
    }
  }

  async deleteDoc(docId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

    const data = await this.dm.load('documents.json');
    data.documents = data.documents.filter(d => d.id !== docId);
    await this.dm.save('documents.json', data);
    await this.showDocList();
    this.showToast('✓ המסמך נמחק');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

// ============================================
// Module 3: Learning Environment
// ============================================
class LearningEnvironmentModule {
  constructor(app, dataManager) {
    this.app = app;
    this.dm = dataManager;
    this.currentItem = null;
    this.viewMode = 'hierarchical'; // Default to hierarchical view
    this.currentFilters = {};
  }

  async render() {
    this.app.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h1 class="module-title">📚 סביבת למידה</h1>
          <p class="module-description">העלאת חומרי למידה, הדגשות ותקצירים</p>
        </div>

        <div class="btn-group mb-2">
          <button class="btn" onclick="knowledgeEnv.uploadItem()">+ העלאת חומר</button>
          <button class="btn btn-secondary" onclick="knowledgeEnv.showKnowledgeList()">📚 רשימת פריטים</button>
        </div>

        <div id="knowledge-workspace"></div>
      </div>
    `;

    await this.showKnowledgeList();
  }

  async showKnowledgeList(filters = {}) {
    const data = await this.dm.load('knowledge.json');
    let items = data.items || [];
    const workspace = document.getElementById('knowledge-workspace');

    // Apply filters
    if (filters.course) {
      items = items.filter(item => item.course === filters.course);
    }
    if (filters.unitNumber) {
      items = items.filter(item => item.unitNumber === filters.unitNumber);
    }
    if (filters.documentType) {
      items = items.filter(item => item.documentType === filters.documentType);
    }

    if (items.length === 0) {
      workspace.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">אין פריטי ידע</div>
          <div class="empty-state-description">לחץ על "העלאת חומר" להתחלה</div>
        </div>
      `;
      return;
    }

    // Get all unique values for filters
    const allItems = data.items || [];
    const allCourses = [...new Set(allItems.map(i => i.course).filter(c => c))].sort();
    const allUnits = [...new Set(allItems.map(i => i.unitNumber).filter(u => u))].sort();
    const allDocTypes = [...new Set(allItems.map(i => i.documentType).filter(d => d))];

    workspace.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <button class="btn ${!filters.course && !filters.unitNumber && !filters.documentType ? 'btn-success' : 'btn-secondary'}"
                  onclick="knowledgeEnv.showKnowledgeList()">
            📚 הכל
          </button>
          <button class="btn btn-secondary" onclick="knowledgeEnv.toggleViewMode()">
            ${this.viewMode === 'hierarchical' ? '📋 תצוגה שטוחה' : '🗂 תצוגה היררכית'}
          </button>
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap; background: var(--bg-dark); padding: 1rem; border-radius: 8px;">
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label" style="margin-bottom: 0.5rem; display: block;">סינון לפי קורס:</label>
            <select class="form-select" onchange="knowledgeEnv.applyFilter('course', this.value)">
              <option value="">-- כל הקורסים --</option>
              ${allCourses.map(c => `<option value="${c}" ${filters.course === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label" style="margin-bottom: 0.5rem; display: block;">סינון לפי יחידה:</label>
            <select class="form-select" onchange="knowledgeEnv.applyFilter('unitNumber', this.value)">
              <option value="">-- כל היחידות --</option>
              ${allUnits.map(u => `<option value="${u}" ${filters.unitNumber === u ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label" style="margin-bottom: 0.5rem; display: block;">סינון לפי סוג:</label>
            <select class="form-select" onchange="knowledgeEnv.applyFilter('documentType', this.value)">
              <option value="">-- כל הסוגים --</option>
              ${allDocTypes.map(d => `<option value="${d}" ${filters.documentType === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div id="knowledge-list-content"></div>
    `;

    // Store current filters
    this.currentFilters = filters;

    // Render based on view mode
    if (this.viewMode === 'hierarchical') {
      this.renderHierarchicalView(items);
    } else {
      this.renderFlatView(items);
    }
  }

  renderHierarchicalView(items) {
    const content = document.getElementById('knowledge-list-content');

    // Group items by Course → UnitNumber → DocumentType
    const hierarchy = {};

    items.forEach(item => {
      const course = item.course || 'ללא קורס';
      const unit = item.unitNumber || 'ללא יחידה';
      const docType = item.documentType || 'ללא סוג';

      if (!hierarchy[course]) hierarchy[course] = {};
      if (!hierarchy[course][unit]) hierarchy[course][unit] = {};
      if (!hierarchy[course][unit][docType]) hierarchy[course][unit][docType] = [];

      hierarchy[course][unit][docType].push(item);
    });

    // Sort courses
    const courses = Object.keys(hierarchy).sort();

    // Document type order
    const docTypeOrder = ['Theory', 'Exercise', 'Summary', 'Reflection'];

    let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

    courses.forEach(course => {
      html += `
        <div class="card" style="background: var(--bg-darker);">
          <div class="card-title" style="background: var(--accent-purple); color: white; padding: 1rem; border-radius: 6px 6px 0 0; margin: -1rem -1rem 1rem -1rem;">
            ${course}
          </div>
          <div class="card-content">
      `;

      // Sort units
      const units = Object.keys(hierarchy[course]).sort();

      units.forEach(unit => {
        html += `
          <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-dark); border-radius: 6px; border-right: 4px solid var(--accent-blue);">
            <h3 style="color: var(--accent-blue); margin: 0 0 1rem 0;">${unit}</h3>
        `;

        // Sort document types by predefined order
        const docTypes = Object.keys(hierarchy[course][unit]).sort((a, b) => {
          const indexA = docTypeOrder.indexOf(a);
          const indexB = docTypeOrder.indexOf(b);
          if (indexA === -1 && indexB === -1) return a.localeCompare(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

        docTypes.forEach(docType => {
          const docItems = hierarchy[course][unit][docType];

          html += `
            <div style="margin-bottom: 1rem;">
              <div style="font-weight: bold; color: var(--accent-green); margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border-radius: 4px;">
                📄 ${docType} (${docItems.length})
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-right: 1rem;">
          `;

          docItems.forEach(item => {
            html += `
              <div class="list-item" style="padding: 0.75rem; background: var(--bg-darker); border-radius: 4px; border-right: 3px solid var(--accent-green);">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                  <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 0.25rem;">${item.title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                      ${item.summary ? item.summary.substring(0, 100) + (item.summary.length > 100 ? '...' : '') : 'אין תקציר'}
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                      <span class="badge badge-info">${this.getTypeLabel(item.type)}</span>
                      ${item.language ? `<span class="badge" style="background: var(--accent-orange);">${item.language}</span>` : ''}
                      <span style="font-size: 0.85rem; color: var(--text-muted);">
                        ${item.highlights || 0} הדגשות | ${item.notes || 0} הערות
                      </span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                      ${item.createdAt}
                    </div>
                  </div>
                  <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                    <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="knowledgeEnv.viewItem('${item.id}')">👁 צפייה</button>
                    <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="knowledgeEnv.deleteItem('${item.id}')">🗑</button>
                  </div>
                </div>
              </div>
            `;
          });

          html += `
              </div>
            </div>
          `;
        });

        html += `
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += '</div>';

    content.innerHTML = html;
  }

  renderFlatView(items) {
    const content = document.getElementById('knowledge-list-content');

    content.innerHTML = `
      <div class="card-grid">
        ${items.map(item => `
          <div class="card">
            <div class="card-title">${item.title}</div>
            <div class="card-content">
              <div style="margin-bottom: 0.5rem;">
                <span class="badge badge-info">${this.getTypeLabel(item.type)}</span>
                ${item.course ? `<span class="badge" style="background: var(--accent-purple);">${item.course}</span>` : ''}
                ${item.unitNumber ? `<span class="badge" style="background: var(--accent-blue);">${item.unitNumber}</span>` : ''}
                ${item.documentType ? `<span class="badge" style="background: var(--accent-green);">${item.documentType}</span>` : ''}
                ${item.language ? `<span class="badge" style="background: var(--accent-orange);">${item.language}</span>` : ''}
              </div>
              <p style="margin-top: 0.5rem;">${item.summary || 'אין תקציר'}</p>
            </div>
            <div class="card-meta">
              ${item.highlights || 0} הדגשות | ${item.notes || 0} הערות
              <div style="margin-top: 0.5rem;">
                <button class="btn btn-secondary" onclick="knowledgeEnv.viewItem('${item.id}')">👁 צפייה</button>
                <button class="btn btn-danger" onclick="knowledgeEnv.deleteItem('${item.id}')">🗑</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'hierarchical' ? 'flat' : 'hierarchical';
    this.showKnowledgeList(this.currentFilters || {});
  }

  applyFilter(filterType, value) {
    const filters = this.currentFilters || {};
    if (value) {
      filters[filterType] = value;
    } else {
      delete filters[filterType];
    }
    this.showKnowledgeList(filters);
  }

  getTypeLabel(type) {
    const labels = {
      pdf: 'PDF',
      text: 'טקסט',
      image: 'תמונה',
      video: 'וידאו'
    };
    return labels[type] || type;
  }

  uploadItem() {
    const workspace = document.getElementById('knowledge-workspace');
    workspace.innerHTML = `
      <div class="card">
        <h3 class="card-title">העלאת חומר למידה חדש</h3>

        <div class="form-group">
          <label class="form-label">כותרת</label>
          <input type="text" class="form-input" id="knowledge-title" placeholder="שם החומר">
        </div>

        <div class="form-group">
          <label class="form-label">קורס (Course)</label>
          <select class="form-select" id="knowledge-course">
            <option value="">-- בחר קורס --</option>
            <option value="C01">C01 – מבוא לאנטומיה ומכניקה של נגינה</option>
            <option value="C02">C02 – מבוא למדעי המוח במוזיקה</option>
            <option value="C03">C03 – מבוא למחקר למוזיקאים</option>
            <option value="C04">C04 – נוירופלסטיות ולמידה ממוקדת</option>
            <option value="C05">C05 – יומן אימון: מתודולוגיה איכותנית</option>
            <option value="C05_1">C05_1 – מתודיקה לפסנתר: גישות ויישום</option>
            <option value="C06">C06 – ניתוח תנועה וקשב בנגינה</option>
            <option value="C07">C07 – תכנון מחקר אישי (Pre-Project)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">יחידה (Unit Number)</label>
          <input type="text" class="form-input" id="knowledge-unit" placeholder="למשל: U01, U02, U03">
        </div>

        <div class="form-group">
          <label class="form-label">סוג מסמך (Document Type)</label>
          <select class="form-select" id="knowledge-doctype">
            <option value="">-- בחר סוג --</option>
            <option value="Theory">Theory (תיאוריה)</option>
            <option value="Exercise">Exercise (תרגול)</option>
            <option value="Summary">Summary (סיכום)</option>
            <option value="Reflection">Reflection (רפלקציה)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">שפה (Language)</label>
          <select class="form-select" id="knowledge-language">
            <option value="he">עברית (he)</option>
            <option value="en">English (en)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">סוג קובץ</label>
          <select class="form-select" id="knowledge-type">
            <option value="pdf">PDF</option>
            <option value="text">טקסט</option>
            <option value="image">תמונה</option>
            <option value="video">וידאו</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">תוכן / הערות</label>
          <textarea class="form-textarea" id="knowledge-content" placeholder="הדבק טקסט או כתוב הערות..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">תקציר</label>
          <textarea class="form-textarea" id="knowledge-summary" placeholder="תקציר קצר של החומר..."></textarea>
        </div>

        <div class="btn-group">
          <button class="btn btn-success" onclick="knowledgeEnv.saveItem()">💾 שמירה</button>
          <button class="btn btn-secondary" onclick="knowledgeEnv.showKnowledgeList()">← ביטול</button>
        </div>
      </div>
    `;
  }

  async saveItem(itemId = null) {
    const title = document.getElementById('knowledge-title').value;
    const type = document.getElementById('knowledge-type').value;
    const content = document.getElementById('knowledge-content').value;
    const summary = document.getElementById('knowledge-summary').value;
    const course = document.getElementById('knowledge-course').value;
    const unitNumber = document.getElementById('knowledge-unit').value;
    const documentType = document.getElementById('knowledge-doctype').value;
    const language = document.getElementById('knowledge-language').value;

    if (!title) {
      alert('יש למלא כותרת');
      return;
    }

    const data = await this.dm.load('knowledge.json');

    if (itemId) {
      // Edit existing item
      const item = data.items.find(i => i.id === itemId);
      if (item) {
        item.title = title;
        item.type = type;
        item.content = content;
        item.summary = summary;
        item.course = course;
        item.unitNumber = unitNumber;
        item.documentType = documentType;
        item.language = language;
        item.updatedAt = this.dm.formatDateTime();
      }
    } else {
      // Create new item
      const item = {
        id: this.dm.generateId(),
        title,
        type,
        content,
        summary,
        course,
        unitNumber,
        documentType,
        language,
        highlights: 0,
        notes: 0,
        userNotes: [],
        createdAt: this.dm.formatDateTime()
      };
      data.items.push(item);
    }

    await this.dm.save('knowledge.json', data);

    this.showToast('✓ החומר נשמר בהצלחה');
    await this.showKnowledgeList();
  }

  async viewItem(itemId) {
    const data = await this.dm.load('knowledge.json');
    const item = data.items.find(i => i.id === itemId);

    if (!item) return;

    const workspace = document.getElementById('knowledge-workspace');
    workspace.innerHTML = `
      <div class="card">
        <h2 class="card-title">${item.title}</h2>
        <div class="card-content">
          <div style="margin-bottom: 1rem;">
            <span class="badge badge-info">${this.getTypeLabel(item.type)}</span>
            ${item.course ? `<span class="badge" style="background: var(--accent-purple);">${item.course}</span>` : ''}
            ${item.unitNumber ? `<span class="badge" style="background: var(--accent-blue);">${item.unitNumber}</span>` : ''}
            ${item.documentType ? `<span class="badge" style="background: var(--accent-green);">${item.documentType}</span>` : ''}
            ${item.language ? `<span class="badge" style="background: var(--accent-orange);">${item.language}</span>` : ''}
          </div>

          <h3 style="margin-top: 1rem; color: var(--accent-blue);">תקציר</h3>
          <p>${item.summary || 'אין תקציר'}</p>

          <h3 style="margin-top: 1rem; color: var(--accent-blue);">תוכן</h3>
          <div style="white-space: pre-wrap; background: var(--bg-dark); padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
            ${item.content || 'אין תוכן'}
          </div>

          ${item.userNotes && item.userNotes.length > 0 ? `
            <h3 style="margin-top: 1rem; color: var(--accent-blue);">הערות (${item.userNotes.length})</h3>
            <div style="background: var(--bg-dark); padding: 1rem; border-radius: 6px; margin-top: 0.5rem;">
              ${item.userNotes.map(note => `
                <div style="margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-darker); border-radius: 4px;">
                  <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">${note.createdAt}</div>
                  <div>${note.text}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div style="margin-top: 1rem;">
            <button class="btn" onclick="knowledgeEnv.addHighlight('${item.id}')">✨ הוסף הדגשה (${item.highlights || 0})</button>
            <button class="btn btn-secondary" onclick="knowledgeEnv.addNote('${item.id}')">📝 הוסף הערה</button>
            <button class="btn btn-warning" onclick="knowledgeEnv.readAloud('${item.id}')">🔊 הקראה</button>
          </div>

          <div style="margin-top: 1rem;">
            <button class="btn" onclick="knowledgeEnv.editItem('${item.id}')">✏️ עריכה</button>
            <button class="btn btn-secondary" onclick="knowledgeEnv.showKnowledgeList()">← חזרה</button>
          </div>
        </div>
      </div>
    `;
  }

  async editItem(itemId) {
    const data = await this.dm.load('knowledge.json');
    const item = data.items.find(i => i.id === itemId);

    if (!item) return;

    const workspace = document.getElementById('knowledge-workspace');
    workspace.innerHTML = `
      <div class="card">
        <h3 class="card-title">עריכת חומר למידה</h3>

        <div class="form-group">
          <label class="form-label">כותרת</label>
          <input type="text" class="form-input" id="knowledge-title" value="${item.title || ''}" placeholder="שם החומר">
        </div>

        <div class="form-group">
          <label class="form-label">קורס (Course)</label>
          <select class="form-select" id="knowledge-course">
            <option value="">-- בחר קורס --</option>
            <option value="C01" ${item.course === 'C01' ? 'selected' : ''}>C01 – מבוא לאנטומיה ומכניקה של נגינה</option>
            <option value="C02" ${item.course === 'C02' ? 'selected' : ''}>C02 – מבוא למדעי המוח במוזיקה</option>
            <option value="C03" ${item.course === 'C03' ? 'selected' : ''}>C03 – מבוא למחקר למוזיקאים</option>
            <option value="C04" ${item.course === 'C04' ? 'selected' : ''}>C04 – נוירופלסטיות ולמידה ממוקדת</option>
            <option value="C05" ${item.course === 'C05' ? 'selected' : ''}>C05 – יומן אימון: מתודולוגיה איכותנית</option>
            <option value="C05_1" ${item.course === 'C05_1' ? 'selected' : ''}>C05_1 – מתודיקה לפסנתר: גישות ויישום</option>
            <option value="C06" ${item.course === 'C06' ? 'selected' : ''}>C06 – ניתוח תנועה וקשב בנגינה</option>
            <option value="C07" ${item.course === 'C07' ? 'selected' : ''}>C07 – תכנון מחקר אישי (Pre-Project)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">יחידה (Unit Number)</label>
          <input type="text" class="form-input" id="knowledge-unit" value="${item.unitNumber || ''}" placeholder="למשל: U01, U02, U03">
        </div>

        <div class="form-group">
          <label class="form-label">סוג מסמך (Document Type)</label>
          <select class="form-select" id="knowledge-doctype">
            <option value="">-- בחר סוג --</option>
            <option value="Theory" ${item.documentType === 'Theory' ? 'selected' : ''}>Theory (תיאוריה)</option>
            <option value="Exercise" ${item.documentType === 'Exercise' ? 'selected' : ''}>Exercise (תרגול)</option>
            <option value="Summary" ${item.documentType === 'Summary' ? 'selected' : ''}>Summary (סיכום)</option>
            <option value="Reflection" ${item.documentType === 'Reflection' ? 'selected' : ''}>Reflection (רפלקציה)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">שפה (Language)</label>
          <select class="form-select" id="knowledge-language">
            <option value="he" ${item.language === 'he' ? 'selected' : ''}>עברית (he)</option>
            <option value="en" ${item.language === 'en' ? 'selected' : ''}>English (en)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">סוג קובץ</label>
          <select class="form-select" id="knowledge-type">
            <option value="pdf" ${item.type === 'pdf' ? 'selected' : ''}>PDF</option>
            <option value="text" ${item.type === 'text' ? 'selected' : ''}>טקסט</option>
            <option value="image" ${item.type === 'image' ? 'selected' : ''}>תמונה</option>
            <option value="video" ${item.type === 'video' ? 'selected' : ''}>וידאו</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">תוכן / הערות</label>
          <textarea class="form-textarea" id="knowledge-content" placeholder="הדבק טקסט או כתוב הערות...">${item.content || ''}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">תקציר</label>
          <textarea class="form-textarea" id="knowledge-summary" placeholder="תקציר קצר של החומר...">${item.summary || ''}</textarea>
        </div>

        <div class="btn-group">
          <button class="btn btn-success" onclick="knowledgeEnv.saveItem('${item.id}')">💾 שמירה</button>
          <button class="btn btn-secondary" onclick="knowledgeEnv.viewItem('${item.id}')">← ביטול</button>
        </div>
      </div>
    `;
  }

  async addHighlight(itemId) {
    const data = await this.dm.load('knowledge.json');
    const item = data.items.find(i => i.id === itemId);
    if (item) {
      item.highlights = (item.highlights || 0) + 1;
      await this.dm.save('knowledge.json', data);
      this.showToast('✓ הדגשה נוספה');
      await this.viewItem(itemId);
    }
  }

  async addNote(itemId) {
    const note = prompt('הכנס הערה:');
    if (note) {
      const data = await this.dm.load('knowledge.json');
      const item = data.items.find(i => i.id === itemId);
      if (item) {
        item.notes = (item.notes || 0) + 1;
        if (!item.userNotes) item.userNotes = [];
        item.userNotes.push({ text: note, createdAt: this.dm.formatDateTime() });
        await this.dm.save('knowledge.json', data);
        this.showToast('✓ הערה נוספה');
      }
    }
  }

  readAloud(itemId) {
    this.showToast('🔊 תכונת הקראה תהיה זמינה בקרוב');
  }

  async deleteItem(itemId) {
    if (!confirm('האם למחוק פריט זה?')) return;

    const data = await this.dm.load('knowledge.json');
    data.items = data.items.filter(i => i.id !== itemId);
    await this.dm.save('knowledge.json', data);
    await this.showKnowledgeList();
    this.showToast('✓ הפריט נמחק');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

// ============================================
// Module 4: Creative Studio
// ============================================
class CreativeStudioModule {
  constructor(app, dataManager) {
    this.app = app;
    this.dm = dataManager;
    this.currentProject = null;
  }

  async render() {
    this.app.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h1 class="module-title">✍️ סטודיו כתיבה יצירתית</h1>
          <p class="module-description">כתיבה מובנית: ספר → חלק → פרק → מקטע</p>
        </div>

        <div class="btn-group mb-2">
          <button class="btn" onclick="writingStudio.createProject()">+ פרויקט חדש</button>
          <button class="btn btn-secondary" onclick="writingStudio.showProjectList()">📖 הפרויקטים שלי</button>
        </div>

        <div id="writing-workspace"></div>
      </div>
    `;

    await this.showProjectList();
  }

  async showProjectList() {
    const data = await this.dm.load('writing_projects.json');
    const projects = data.projects || [];
    const workspace = document.getElementById('writing-workspace');

    if (projects.length === 0) {
      workspace.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✍️</div>
          <div class="empty-state-title">אין פרויקטי כתיבה</div>
          <div class="empty-state-description">צור פרויקט חדש להתחלת כתיבה</div>
        </div>
      `;
      return;
    }

    workspace.innerHTML = `
      <div class="card-grid">
        ${projects.map(project => `
          <div class="card">
            <div class="card-title">${project.title}</div>
            <div class="card-content">
              <p>${project.description || 'אין תיאור'}</p>
              <div style="margin-top: 1rem;">
                <span class="badge badge-info">${project.parts?.length || 0} חלקים</span>
                <span class="badge badge-success">${project.wordCount || 0} מילים</span>
              </div>
            </div>
            <div class="card-meta">
              <button class="btn btn-secondary" onclick="writingStudio.openProject('${project.id}')">✎ פתיחה</button>
              <button class="btn btn-warning" onclick="writingStudio.exportProject('${project.id}')">⬇ יצוא</button>
              <button class="btn btn-danger" onclick="writingStudio.deleteProject('${project.id}')">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  createProject() {
    const workspace = document.getElementById('writing-workspace');
    workspace.innerHTML = `
      <div class="card">
        <h3 class="card-title">פרויקט כתיבה חדש</h3>

        <div class="form-group">
          <label class="form-label">שם הפרויקט</label>
          <input type="text" class="form-input" id="project-title" placeholder="לדוגמה: הספר שלי">
        </div>

        <div class="form-group">
          <label class="form-label">תיאור</label>
          <textarea class="form-textarea" id="project-description" placeholder="תיאור קצר של הפרויקט..."></textarea>
        </div>

        <div class="btn-group">
          <button class="btn btn-success" onclick="writingStudio.saveNewProject()">💾 יצירה</button>
          <button class="btn btn-secondary" onclick="writingStudio.showProjectList()">← ביטול</button>
        </div>
      </div>
    `;
  }

  async saveNewProject() {
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;

    if (!title) {
      alert('יש למלא שם פרויקט');
      return;
    }

    const project = {
      id: this.dm.generateId(),
      title,
      description,
      parts: [],
      wordCount: 0,
      createdAt: this.dm.formatDateTime()
    };

    const data = await this.dm.load('writing_projects.json');
    data.projects.push(project);
    await this.dm.save('writing_projects.json', data);

    this.showToast('✓ הפרויקט נוצר בהצלחה');
    await this.showProjectList();
  }

  async openProject(projectId) {
    const data = await this.dm.load('writing_projects.json');
    this.currentProject = data.projects.find(p => p.id === projectId);

    if (!this.currentProject) return;

    const workspace = document.getElementById('writing-workspace');
    workspace.innerHTML = `
      <div style="display: grid; grid-template-columns: 250px 1fr 300px; gap: 1rem;">
        <!-- Structure Panel -->
        <div class="card">
          <h3 class="card-title">מבנה</h3>
          <div id="structure-panel">
            <button class="btn btn-secondary mb-1" onclick="writingStudio.addPart()">+ חלק חדש</button>
            ${this.renderStructure()}
          </div>
        </div>

        <!-- Editor Panel -->
        <div class="card">
          <h3 class="card-title">${this.currentProject.title}</h3>
          <div class="form-group">
            <input type="text" class="form-input" id="section-title" placeholder="כותרת המקטע">
          </div>
          <div class="editor-container">
            <div class="editor-content" contenteditable="true" id="writing-editor" style="min-height: 500px;">
              התחל לכתוב כאן...
            </div>
          </div>
          <div class="btn-group mt-1">
            <button class="btn btn-success" onclick="writingStudio.saveSection()">💾 שמירה</button>
            <button class="btn btn-secondary" onclick="writingStudio.showProjectList()">← חזרה</button>
          </div>
        </div>

        <!-- Knowledge Panel (Read-Only) -->
        <div class="card">
          <h3 class="card-title">📚 ידע</h3>
          <div id="knowledge-panel" style="max-height: 600px; overflow-y: auto;">
            ${await this.renderKnowledgePanel()}
          </div>
        </div>
      </div>
    `;
  }

  renderStructure() {
    if (!this.currentProject.parts || this.currentProject.parts.length === 0) {
      return '<p class="text-muted">אין חלקים עדיין</p>';
    }

    return this.currentProject.parts.map(part => `
      <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--bg-dark); border-radius: 4px;">
        <strong>${part.title}</strong>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          ${part.chapters?.length || 0} פרקים
        </div>
      </div>
    `).join('');
  }

  async renderKnowledgePanel() {
    const knowledgeData = await this.dm.load('knowledge.json');
    const items = knowledgeData.items || [];

    if (items.length === 0) {
      return '<p class="text-muted">אין פריטי ידע</p>';
    }

    return items.map(item => `
      <div style="margin: 0.5rem 0; padding: 0.5rem; background: var(--bg-dark); border-radius: 4px; cursor: pointer;"
           onclick="writingStudio.copyFromKnowledge('${item.id}')">
        <strong>${item.title}</strong>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${item.summary || ''}</div>
      </div>
    `).join('');
  }

  async copyFromKnowledge(itemId) {
    const knowledgeData = await this.dm.load('knowledge.json');
    const item = knowledgeData.items.find(i => i.id === itemId);

    if (item) {
      const editor = document.getElementById('writing-editor');
      const sourceTag = `[מקור: ${item.title}]`;
      editor.innerHTML += `<p>${sourceTag}</p><p>${item.content}</p>`;
      this.showToast('✓ המידע הועתק עם תגית מקור');
    }
  }

  addPart() {
    const partName = prompt('שם החלק:');
    if (partName) {
      if (!this.currentProject.parts) this.currentProject.parts = [];
      this.currentProject.parts.push({
        id: this.dm.generateId(),
        title: partName,
        chapters: []
      });
      this.openProject(this.currentProject.id);
    }
  }

  async saveSection() {
    const content = document.getElementById('writing-editor').innerHTML;
    const title = document.getElementById('section-title').value;

    // Update word count
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0);
    this.currentProject.wordCount = words.length;

    const data = await this.dm.load('writing_projects.json');
    const index = data.projects.findIndex(p => p.id === this.currentProject.id);
    if (index >= 0) {
      data.projects[index] = this.currentProject;
      await this.dm.save('writing_projects.json', data);
    }

    this.showToast('✓ המקטע נשמר');
  }

  async exportProject(projectId) {
    const data = await this.dm.load('writing_projects.json');
    const project = data.projects.find(p => p.id === projectId);

    if (project) {
      const content = JSON.stringify(project, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}.json`;
      a.click();
      this.showToast('✓ הפרויקט יוצא');
    }
  }

  async deleteProject(projectId) {
    if (!confirm('האם למחוק פרויקט זה?')) return;

    const data = await this.dm.load('writing_projects.json');
    data.projects = data.projects.filter(p => p.id !== projectId);
    await this.dm.save('writing_projects.json', data);
    await this.showProjectList();
    this.showToast('✓ הפרויקט נמחק');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

// ============================================
// Module 5: Management Layer
// ============================================
class ManagementModule {
  constructor(app, dataManager) {
    this.app = app;
    this.dm = dataManager;
  }

  async render() {
    this.app.innerHTML = `
      <div class="module-container">
        <div class="module-header">
          <h1 class="module-title">⚙️ שכבת ניהול</h1>
          <p class="module-description">ניהול משימות, סקירות ומדדים</p>
        </div>

        <div class="btn-group mb-2">
          <button class="btn" onclick="management.createTask()">+ משימה חדשה</button>
          <button class="btn btn-secondary" onclick="management.createReview()">📋 סקירה חדשה</button>
          <button class="btn btn-warning" onclick="management.viewMetrics()">📊 מדדים</button>
        </div>

        <div id="management-workspace"></div>
      </div>
    `;

    await this.showTaskList();
  }

  async showTaskList() {
    const data = await this.dm.load('tasks.json');
    const tasks = data.tasks || [];
    const workspace = document.getElementById('management-workspace');

    if (tasks.length === 0) {
      workspace.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">אין משימות</div>
          <div class="empty-state-description">צור משימה חדשה להתחלה</div>
        </div>
      `;
      return;
    }

    workspace.innerHTML = `
      <h3 style="color: var(--accent-blue); margin-bottom: 1rem;">רשימת משימות</h3>
      <div class="item-list">
        ${tasks.map(task => `
          <div class="list-item">
            <div class="list-item-content">
              <div class="list-item-title">${task.title}</div>
              <div class="list-item-meta">${task.description || ''}</div>
            </div>
            <div class="list-item-actions">
              <span class="badge badge-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'secondary'}">
                ${this.getStatusLabel(task.status)}
              </span>
              <button class="btn btn-success" onclick="management.completeTask('${task.id}')">✓</button>
              <button class="btn btn-danger" onclick="management.deleteTask('${task.id}')">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getStatusLabel(status) {
    const labels = {
      'pending': 'ממתין',
      'in-progress': 'בתהליך',
      'completed': 'הושלם'
    };
    return labels[status] || status;
  }

  createTask() {
    const workspace = document.getElementById('management-workspace');
    workspace.innerHTML = `
      <div class="card">
        <h3 class="card-title">משימה חדשה</h3>

        <div class="form-group">
          <label class="form-label">כותרת</label>
          <input type="text" class="form-input" id="task-title" placeholder="שם המשימה">
        </div>

        <div class="form-group">
          <label class="form-label">תיאור</label>
          <textarea class="form-textarea" id="task-description" placeholder="פרטי המשימה..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">סטטוס</label>
          <select class="form-select" id="task-status">
            <option value="pending">ממתין</option>
            <option value="in-progress">בתהליך</option>
            <option value="completed">הושלם</option>
          </select>
        </div>

        <div class="btn-group">
          <button class="btn btn-success" onclick="management.saveTask()">💾 שמירה</button>
          <button class="btn btn-secondary" onclick="management.showTaskList()">← ביטול</button>
        </div>
      </div>
    `;
  }

  async saveTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const status = document.getElementById('task-status').value;

    if (!title) {
      alert('יש למלא כותרת');
      return;
    }

    const task = {
      id: this.dm.generateId(),
      title,
      description,
      status,
      createdAt: this.dm.formatDateTime()
    };

    const data = await this.dm.load('tasks.json');
    data.tasks.push(task);
    data.metrics.totalTasks = data.tasks.length;
    data.metrics.completedTasks = data.tasks.filter(t => t.status === 'completed').length;

    await this.dm.save('tasks.json', data);

    this.showToast('✓ המשימה נוצרה');
    await this.showTaskList();
  }

  async completeTask(taskId) {
    const data = await this.dm.load('tasks.json');
    const task = data.tasks.find(t => t.id === taskId);

    if (task) {
      task.status = 'completed';
      task.completedAt = this.dm.formatDateTime();
      data.metrics.completedTasks = data.tasks.filter(t => t.status === 'completed').length;
      await this.dm.save('tasks.json', data);
      await this.showTaskList();
      this.showToast('✓ המשימה הושלמה');
    }
  }

  async deleteTask(taskId) {
    if (!confirm('האם למחוק משימה זו?')) return;

    const data = await this.dm.load('tasks.json');
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    data.metrics.totalTasks = data.tasks.length;
    await this.dm.save('tasks.json', data);
    await this.showTaskList();
    this.showToast('✓ המשימה נמחקה');
  }

  createReview() {
    this.showToast('📋 תכונת סקירות תהיה זמינה בקרוב');
  }

  viewMetrics() {
    this.showToast('📊 תכונת מדדים תהיה זמינה בקרוב');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent-green);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

// ============================================
// Application Initialization
// ============================================
const app = document.getElementById('app');
const dataManager = new DataManager();
const router = new Router(app);

// Initialize modules
const dashboard = new DashboardModule(app, dataManager);
const docLibrary = new DocumentLibraryModule(app, dataManager);
const knowledgeEnv = new LearningEnvironmentModule(app, dataManager);
const writingStudio = new CreativeStudioModule(app, dataManager);
const management = new ManagementModule(app, dataManager);

// Register modules
router.registerModule('dashboard', dashboard);
router.registerModule('docs', docLibrary);
router.registerModule('knowledge', knowledgeEnv);
router.registerModule('writing', writingStudio);
router.registerModule('management', management);

// Initialize theme manager
themeManager.init();

// Load default view
router.navigate('dashboard');

console.log('✓ BTK Management System loaded successfully');
