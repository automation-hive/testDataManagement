import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, DashboardComponent, DashboardConfig, Project } from './types';

const API = 'http://localhost:8080/api/projects';
const emptyConfig: DashboardConfig = { version: 1, components: [] };

const componentOptions: { type: ComponentType; title: string; description: string }[] = [
  { type: 'BUTTON', title: 'Button', description: 'Trigger a backend action' },
  { type: 'TEXT_FIELD', title: 'Text field', description: 'Capture user input' },
  { type: 'CARD', title: 'Info card', description: 'Display a value or status' },
  { type: 'TABLE', title: 'Data table', description: 'Display rows of data' }
];

export default function App() {
  const [projectName, setProjectName] = useState('My first dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [config, setConfig] = useState<DashboardConfig>(emptyConfig);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('Create a component to get started.');

  const selected = useMemo(
    () => config.components.find(c => c.id === selectedId) ?? null,
    [config.components, selectedId]
  );

  async function refreshProjects() {
    try {
      const response = await fetch(API);
      if (!response.ok) throw new Error('API unavailable');
      setProjects(await response.json());
    } catch {
      setMessage('Backend not connected. Start the Spring Boot API to save projects.');
    }
  }

  useEffect(() => { void refreshProjects(); }, []);

  function addComponent(type: ComponentType) {
    const item: DashboardComponent = {
      id: crypto.randomUUID(),
      type,
      label: componentOptions.find(o => o.type === type)?.title ?? type,
      actionKey: ''
    };
    setConfig(current => ({ ...current, components: [...current.components, item] }));
    setSelectedId(item.id);
    setMessage(`${item.label} added to your dashboard.`);
  }

  function updateSelected(field: 'label' | 'actionKey', value: string) {
    if (!selectedId) return;
    setConfig(current => ({
      ...current,
      components: current.components.map(c => c.id === selectedId ? { ...c, [field]: value } : c)
    }));
  }

  function removeSelected() {
    if (!selectedId) return;
    setConfig(current => ({ ...current, components: current.components.filter(c => c.id !== selectedId) }));
    setSelectedId(null);
  }

  async function saveProject() {
    const payload = { name: projectName, configJson: JSON.stringify(config) };
    try {
      const response = await fetch(projectId ? `${API}/${projectId}` : API, {
        method: projectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Save failed');
      const saved: Project = await response.json();
      setProjectId(saved.id);
      setMessage('Project saved successfully.');
      await refreshProjects();
    } catch {
      setMessage('Could not save. Check that PostgreSQL and the Spring Boot API are running.');
    }
  }

  async function openProject(id: string) {
    try {
      const response = await fetch(`${API}/${id}`);
      if (!response.ok) throw new Error('Load failed');
      const project: Project = await response.json();
      setProjectId(project.id);
      setProjectName(project.name);
      setConfig(JSON.parse(project.configJson) as DashboardConfig);
      setSelectedId(null);
      setMessage(`Loaded ${project.name}.`);
    } catch {
      setMessage('Could not load this project.');
    }
  }

  function exportConfig() {
    const blob = new Blob([JSON.stringify({ name: projectName, ...config }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Configuration JSON exported.');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">D</div>
        <div className="brand">DashboardForge <span>BUILDER</span></div>
        <div className="topbar-spacer" />
        <span className="save-status">{message}</span>
        <button className="button secondary" onClick={exportConfig}>Export JSON</button>
        <button className="button primary" onClick={() => void saveProject()}>Save project</button>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="section-label">PROJECT</div>
          <input className="project-input" value={projectName} onChange={e => setProjectName(e.target.value)} />
          <select className="project-select" defaultValue="" onChange={e => e.target.value && void openProject(e.target.value)}>
            <option value="">Open saved project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="section-label component-heading">COMPONENTS</div>
          <p className="helper">Select a component to add it to the dashboard.</p>
          <div className="component-list">
            {componentOptions.map(option => (
              <button className="component-option" key={option.type} onClick={() => addComponent(option.type)}>
                <span className="component-symbol">{option.title.slice(0, 1)}</span>
                <span><strong>{option.title}</strong><small>{option.description}</small></span>
                <b>+</b>
              </button>
            ))}
          </div>
          <div className="sidebar-footer"><span className="status-dot" /> Local workspace</div>
        </aside>

        <main className="canvas-area">
          <div className="canvas-heading">
            <div><div className="section-label">DESIGN CANVAS</div><h1>{projectName}</h1></div>
            <span className="component-count">{config.components.length} components</span>
          </div>
          <div className="canvas">
            {config.components.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">＋</div><h2>Your dashboard starts here</h2><p>Choose a component from the left panel to add it.</p></div>
            ) : (
              <div className="preview-grid">
                {config.components.map(component => (
                  <button
                    key={component.id}
                    className={`preview-item ${selectedId === component.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(component.id)}
                  >
                    <span className="preview-type">{component.type.replace('_', ' ')}</span>
                    {component.type === 'BUTTON' ? <span className="mock-button">{component.label}</span> :
                     component.type === 'TEXT_FIELD' ? <span className="mock-field">{component.label}<i>Enter value…</i></span> :
                     component.type === 'CARD' ? <span className="mock-card"><strong>{component.label}</strong><b>—</b><small>Sample metric</small></span> :
                     <span className="mock-table"><strong>{component.label}</strong><i /><i /><i /></span>}
                    {component.actionKey && <small className="action-tag">{component.actionKey}</small>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="inspector">
          <div className="section-label">PROPERTIES</div>
          {selected ? (
            <>
              <h2>{selected.type.replace('_', ' ')}</h2>
              <label className="field-label">Component label</label>
              <input className="property-input" value={selected.label} onChange={e => updateSelected('label', e.target.value)} />
              <label className="field-label">Backend action key</label>
              <input className="property-input" placeholder="e.g. reports.refresh" value={selected.actionKey} onChange={e => updateSelected('actionKey', e.target.value)} />
              <p className="field-help">Use a registered action key. Java methods are mapped to approved keys on the server; arbitrary method execution is not supported.</p>
              <button className="button danger full" onClick={removeSelected}>Remove component</button>
            </>
          ) : (
            <div className="inspector-empty"><div>⚙</div><strong>No component selected</strong><p>Select a component on the canvas to edit its properties.</p></div>
          )}
          <div className="inspector-note"><strong>Backend connection</strong><p>Java actions and REST API mappings will be configured in the next milestone.</p><span className="pill">SPRING BOOT API</span></div>
        </aside>
      </div>
    </div>
  );
}
