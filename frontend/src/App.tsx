import { useEffect, useMemo, useState } from 'react';
import { componentRegistry, createComponent, type ComponentDefinition } from './componentRegistry';
import type { ComponentType, DashboardComponent, DashboardConfig, Project } from './types';

const API = 'http://localhost:8080/api/projects';
const CODEGEN_API = 'http://localhost:8080/api/code-generation/generate';
const emptyConfig: DashboardConfig = { version: 2, components: [] };

function normalizeConfig(raw: unknown): DashboardConfig {
  if (!raw || typeof raw !== 'object') return emptyConfig;
  const value = raw as { version?: number; components?: Array<Record<string, unknown>> };
  const components = Array.isArray(value.components) ? value.components.map((item) => {
    const legacyType = String(item.type ?? 'BUTTON');
    const type = (legacyType in componentRegistry ? legacyType : 'BUTTON') as ComponentType;
    const savedProperties = item.properties && typeof item.properties === 'object'
      ? item.properties as Record<string, string | number | boolean>
      : {};
    return {
      id: String(item.id ?? crypto.randomUUID()),
      type,
      label: String(item.label ?? componentRegistry[type].label),
      actionKey: String(item.actionKey ?? ''),
      properties: { ...componentRegistry[type].defaults, ...savedProperties }
    } as DashboardComponent;
  }) : [];
  return { version: 2, components };
}

export default function App() {
  const [projectName, setProjectName] = useState('My first dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [config, setConfig] = useState<DashboardConfig>(emptyConfig);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('Your workspace is ready.');
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => config.components.find((item) => item.id === selectedId) ?? null, [config.components, selectedId]);
  const filteredDefinitions = useMemo(() => Object.values(componentRegistry).filter((item) =>
    (item.label + ' ' + item.description + ' ' + item.category).toLowerCase().includes(search.toLowerCase())
  ), [search]);

  async function refreshProjects() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error('Could not load projects');
      setProjects(await response.json() as Project[]);
    } catch {
      setNotice('Backend is offline. You can still design locally; start Spring Boot to save projects.');
    }
  }

  useEffect(() => { void refreshProjects(); }, []);

  function updateComponent(id: string, updater: (item: DashboardComponent) => DashboardComponent) {
    setConfig((current) => ({ ...current, components: current.components.map((item) => item.id === id ? updater(item) : item) }));
  }

  function addComponent(definition: ComponentDefinition) {
    const item = createComponent(definition.type);
    setConfig((current) => ({ ...current, components: [...current.components, item] }));
    setSelectedId(item.id);
    setNotice(`${definition.label} added to the canvas.`);
  }

  function updateProperty(key: string, value: string | number | boolean) {
    if (!selected) return;
    updateComponent(selected.id, (item) => ({ ...item, properties: { ...item.properties, [key]: value } }));
  }

  function removeSelected() {
    if (!selected) return;
    setConfig((current) => ({ ...current, components: current.components.filter((item) => item.id !== selected.id) }));
    setSelectedId(null);
    setNotice('Component removed.');
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy = { ...selected, id: crypto.randomUUID(), label: `${selected.label} copy`, properties: { ...selected.properties } };
    setConfig((current) => ({ ...current, components: [...current.components, copy] }));
    setSelectedId(copy.id);
    setNotice('Component duplicated.');
  }

  function newProject() {
    setProjectId(null);
    setProjectName('Untitled dashboard');
    setConfig(emptyConfig);
    setSelectedId(null);
    setNotice('New dashboard created.');
  }

  async function saveProject() {
    setBusy(true);
    try {
      const payload = { name: projectName.trim() || 'Untitled dashboard', configJson: JSON.stringify(config) };
      const response = await fetch(projectId ? `${API}/${projectId}` : API, {
        method: projectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Save failed');
      const saved = await response.json() as Project;
      setProjectId(saved.id);
      setNotice('Project saved to PostgreSQL.');
      await refreshProjects();
    } catch {
      setNotice('Save failed. Check PostgreSQL and the Spring Boot API connection.');
    } finally { setBusy(false); }
  }

  async function openProject(id: string) {
    if (!id) return;
    try {
      const response = await fetch(`${API}/${id}`);
      if (!response.ok) throw new Error('Load failed');
      const project = await response.json() as Project;
      setProjectId(project.id);
      setProjectName(project.name);
      setConfig(normalizeConfig(JSON.parse(project.configJson)));
      setSelectedId(null);
      setNotice(`${project.name} loaded.`);
    } catch { setNotice('Could not load this project.'); }
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify({ name: projectName, ...config }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dashboard'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Dashboard configuration exported.');
  }

  async function generateCode() {
    setBusy(true);
    try {
      const response = await fetch(CODEGEN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, configJson: JSON.stringify(config) })
      });
      if (!response.ok) throw new Error('Code generation failed');
      const archive = await response.blob();
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dashboard'}-source.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice('React and Java source code generated.');
    } catch {
      setNotice('Code generation failed. Check the backend and dashboard configuration.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="DashboardForge home"><span className="brand-icon">D</span><span>DashboardForge<small>VISUAL BUILDER</small></span></a>
        <div className="topbar-context"><span className="live-dot" /> Workspace <b>/</b> {projectName}</div>
        <div className="topbar-actions">
          <button className="button button-quiet" onClick={newProject}>New project</button>
          <button className="button button-quiet" onClick={exportConfig}>Export JSON</button>
          <button className="button button-quiet" onClick={() => void generateCode()} disabled={busy}>{busy ? 'Generating…' : 'Generate code'}</button>
          <button className="button button-primary" onClick={() => void saveProject()} disabled={busy}>{busy ? 'Saving…' : 'Save project'}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="library-panel">
          <div className="panel-heading"><div><span className="eyebrow">GLOBAL LIBRARY</span><h2>Components</h2></div><span className="count-pill">{Object.keys(componentRegistry).length}</span></div>
          <div className="library-search"><span>⌕</span><input aria-label="Search components" placeholder="Search components…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="library-list">
            {filteredDefinitions.map((definition) => (
              <button className="library-item" key={definition.type} onClick={() => addComponent(definition)}>
                <span className={`library-icon icon-${definition.type.toLowerCase()}`}>{definition.icon}</span>
                <span className="library-copy"><strong>{definition.label}</strong><small>{definition.description}</small></span>
                <span className="add-symbol">+</span>
              </button>
            ))}
            {filteredDefinitions.length === 0 && <p className="empty-search">No components match your search.</p>}
          </div>
          <div className="library-footer"><span className="shield-icon">◆</span><span><strong>Global components</strong><small>Reusable across all projects</small></span></div>
        </aside>

        <main className="canvas-panel">
          <div className="canvas-toolbar">
            <div><span className="eyebrow">DASHBOARD DESIGNER</span><input className="dashboard-title" value={projectName} onChange={(event) => setProjectName(event.target.value)} aria-label="Dashboard name" /></div>
            <div className="canvas-meta"><span className="meta-chip"><i /> Auto layout</span><span className="meta-chip">{config.components.length} {config.components.length === 1 ? 'element' : 'elements'}</span></div>
          </div>
          <div className="canvas-surface">
            {config.components.length === 0 ? (
              <div className="canvas-empty"><div className="empty-illustration"><span>＋</span><i /><i /><i /></div><h3>Start building your dashboard</h3><p>Add components from the Global Library. Select any component to configure its properties.</p><span className="empty-hint">TIP&nbsp;&nbsp; Components are reusable across every DashboardForge project.</span></div>
            ) : (
              <div className="component-grid">
                {config.components.map((item) => (
                  <Preview key={item.id} item={item} selected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} />
                ))}
              </div>
            )}
          </div>
          <div className="canvas-foot"><span>{notice}</span><span>DESIGN MODE <i className="live-dot" /></span></div>
        </main>

        <aside className="inspector-panel">
          <div className="panel-heading"><div><span className="eyebrow">CONFIGURATION</span><h2>Properties</h2></div><span className="settings-symbol">⚙</span></div>
          {selected ? (
            <div className="property-content">
              <div className="selected-component"><span className={`library-icon icon-${selected.type.toLowerCase()}`}>{componentRegistry[selected.type].icon}</span><span><strong>{componentRegistry[selected.type].label}</strong><small>{componentRegistry[selected.type].category}</small></span></div>
              <label className="form-label">Display label<input value={selected.label} onChange={(event) => updateComponent(selected.id, (item) => ({ ...item, label: event.target.value }))} /></label>
              {componentRegistry[selected.type].fields.map((field) => (
                <label className="form-label" key={field.key}>{field.label}
                  {field.kind === 'select' ? <select value={String(selected.properties[field.key] ?? field.defaultValue ?? '')} onChange={(event) => updateProperty(field.key, event.target.value)}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
                   field.kind === 'boolean' ? <span className="toggle-row"><span>{field.help}</span><input type="checkbox" checked={Boolean(selected.properties[field.key])} onChange={(event) => updateProperty(field.key, event.target.checked)} /></span> :
                   field.kind === 'textarea' ? <textarea rows={3} value={String(selected.properties[field.key] ?? '')} onChange={(event) => updateProperty(field.key, event.target.value)} /> :
                   <input type={field.kind === 'number' ? 'number' : 'text'} value={String(selected.properties[field.key] ?? '')} placeholder={field.placeholder} onChange={(event) => updateProperty(field.key, field.kind === 'number' ? Number(event.target.value) : event.target.value)} />}
                  {field.kind !== 'boolean' && field.help && <small className="field-help">{field.help}</small>}
                </label>
              ))}
              <div className="property-divider" />
              <label className="form-label">Backend action key<input placeholder="e.g. reports.refresh" value={selected.actionKey} onChange={(event) => updateComponent(selected.id, (item) => ({ ...item, actionKey: event.target.value }))} /><small className="field-help">Identifier only. Actions must be explicitly registered on the server.</small></label>
              <div className="property-actions"><button className="button button-quiet" onClick={duplicateSelected}>Duplicate</button><button className="button button-danger" onClick={removeSelected}>Remove</button></div>
            </div>
          ) : (
            <div className="inspector-empty"><span className="inspector-empty-icon">⌘</span><strong>Nothing selected</strong><p>Select a component on the canvas to edit its configuration.</p></div>
          )}
          <div className="inspector-info"><span className="info-icon">i</span><div><strong>Safe by design</strong><p>Action keys are identifiers only. The backend executes registered actions through its allowlist.</p></div></div>
        </aside>
      </div>
      <footer className="app-footer"><span>DashboardForge <b>·</b> Phase 5</span><span>Professional dashboard design workspace</span></footer>
    </div>
  );
}

function Preview({ item, selected, onSelect }: { item: DashboardComponent; selected: boolean; onSelect: () => void }) {
  const definition = componentRegistry[item.type];
  const props = item.properties;
  return (
    <button className={`preview-card ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
      <span className="preview-card-top"><span>{definition.label.toUpperCase()}</span><span className="drag-dots">⠿</span></span>
      <span className="preview-content">
        {item.type === 'BUTTON' && <span className={`sample-button ${String(props.variant)}`}>{item.label}</span>}
        {item.type === 'TEXT_FIELD' && <span className="sample-field"><b>{item.label}</b><i>{String(props.placeholder || 'Enter a value…')}</i></span>}
        {item.type === 'DROPDOWN' && <span className="sample-field"><b>{item.label}</b><i>{String(props.placeholder || 'Select an option')} <em>⌄</em></i></span>}
        {item.type === 'CHECKBOX' && <span className="sample-check"><i className={props.checked ? 'checked' : ''}>{props.checked ? '✓' : ''}</i>{String(props.text || item.label)}</span>}
        {item.type === 'METRIC_CARD' && <span className="sample-metric"><b>{item.label}</b><strong>{String(props.value || '1,284')}</strong><small>{String(props.caption || 'Compared with last period')} <em>{String(props.trend || '+12.8%')}</em></small></span>}
        {item.type === 'DATA_TABLE' && <span className="sample-table"><b>{item.label}</b><span><i>Name</i><i>Status</i></span><span><i>Sample record</i><i className="table-status">Active</i></span><span><i>Sample record</i><i className="table-status">Active</i></span></span>}
        {item.type === 'CHART' && <span className="sample-chart"><b>{item.label}</b><span className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></span><small>Sample data visualization</small></span>}
        {item.type === 'ALERT' && <span className={`sample-alert alert-${String(props.severity)}`}><b>{item.label}</b><small>{String(props.message || 'This is an example alert message.')}</small></span>}
        {item.type === 'STATUS_BADGE' && <span className="sample-status"><b>{item.label}</b><i className={`status-${String(props.status)}`}>{String(props.text || 'Operational')}</i></span>}
      </span>
      {item.actionKey && <span className="action-key">ACTION&nbsp; {item.actionKey}</span>}
    </button>
  );
}
