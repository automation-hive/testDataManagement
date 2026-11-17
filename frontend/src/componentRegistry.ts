import type { ComponentType, DashboardComponent } from './types';

export type PropertyField = {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'boolean' | 'select' | 'textarea';
  defaultValue?: string | number | boolean;
  placeholder?: string;
  help?: string;
  options?: { label: string; value: string }[];
};

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  description: string;
  category: string;
  icon: string;
  defaults: Record<string, string | number | boolean>;
  fields: PropertyField[];
}

export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  BUTTON: {
    type: 'BUTTON', label: 'Button', description: 'Trigger an action', category: 'Basic', icon: '↗',
    defaults: { variant: 'primary', size: 'medium', disabled: false },
    fields: [
      { key: 'variant', label: 'Button style', kind: 'select', defaultValue: 'primary', options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }] },
      { key: 'size', label: 'Button size', kind: 'select', defaultValue: 'medium', options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] },
      { key: 'disabled', label: 'Disabled', kind: 'boolean', defaultValue: false, help: 'Prevent interaction in the preview.' }
    ]
  },
  TEXT_FIELD: {
    type: 'TEXT_FIELD', label: 'Text field', description: 'Collect user input', category: 'Basic', icon: 'T',
    defaults: { placeholder: 'Enter a value…', maxLength: 100, required: false },
    fields: [
      { key: 'placeholder', label: 'Placeholder', kind: 'text', defaultValue: 'Enter a value…' },
      { key: 'maxLength', label: 'Maximum characters', kind: 'number', defaultValue: 100 },
      { key: 'required', label: 'Required field', kind: 'boolean', defaultValue: false, help: 'Mark this input as required.' }
    ]
  },
  DROPDOWN: {
    type: 'DROPDOWN', label: 'Dropdown', description: 'Choose from options', category: 'Basic', icon: '⌄',
    defaults: { placeholder: 'Select an option', options: 'Option 1, Option 2, Option 3', required: false },
    fields: [
      { key: 'placeholder', label: 'Placeholder', kind: 'text', defaultValue: 'Select an option' },
      { key: 'options', label: 'Options', kind: 'textarea', defaultValue: 'Option 1, Option 2, Option 3', help: 'Separate options with commas.' },
      { key: 'required', label: 'Required selection', kind: 'boolean', defaultValue: false }
    ]
  },
  CHECKBOX: {
    type: 'CHECKBOX', label: 'Checkbox', description: 'Capture a true or false value', category: 'Basic', icon: '☑',
    defaults: { text: 'I agree to the terms', checked: false },
    fields: [
      { key: 'text', label: 'Checkbox text', kind: 'text', defaultValue: 'I agree to the terms' },
      { key: 'checked', label: 'Initially checked', kind: 'boolean', defaultValue: false }
    ]
  },
  METRIC_CARD: {
    type: 'METRIC_CARD', label: 'Metric card', description: 'Highlight a key metric', category: 'Data', icon: '▤',
    defaults: { value: '1,284', caption: 'Compared with last period', trend: '+12.8%' },
    fields: [
      { key: 'value', label: 'Metric value', kind: 'text', defaultValue: '1,284' },
      { key: 'caption', label: 'Caption', kind: 'text', defaultValue: 'Compared with last period' },
      { key: 'trend', label: 'Trend indicator', kind: 'text', defaultValue: '+12.8%' }
    ]
  },
  DATA_TABLE: {
    type: 'DATA_TABLE', label: 'Data table', description: 'Present structured records', category: 'Data', icon: '▦',
    defaults: { columns: 'Name, Status', rows: 3 },
    fields: [
      { key: 'columns', label: 'Column names', kind: 'text', defaultValue: 'Name, Status', help: 'Separate column names with commas.' },
      { key: 'rows', label: 'Preview rows', kind: 'number', defaultValue: 3 }
    ]
  },
  CHART: {
    type: 'CHART', label: 'Chart', description: 'Visualize trends and totals', category: 'Data', icon: '▥',
    defaults: { chartType: 'bar', title: 'Performance overview' },
    fields: [
      { key: 'chartType', label: 'Chart type', kind: 'select', defaultValue: 'bar', options: [{ label: 'Bar chart', value: 'bar' }, { label: 'Line chart', value: 'line' }, { label: 'Pie chart', value: 'pie' }] },
      { key: 'title', label: 'Chart title', kind: 'text', defaultValue: 'Performance overview' }
    ]
  },
  ALERT: {
    type: 'ALERT', label: 'Alert', description: 'Communicate important messages', category: 'Utility', icon: '!',
    defaults: { severity: 'info', message: 'This is an example alert message.' },
    fields: [
      { key: 'severity', label: 'Alert severity', kind: 'select', defaultValue: 'info', options: [{ label: 'Info', value: 'info' }, { label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }, { label: 'Error', value: 'error' }] },
      { key: 'message', label: 'Message', kind: 'textarea', defaultValue: 'This is an example alert message.' }
    ]
  },
  STATUS_BADGE: {
    type: 'STATUS_BADGE', label: 'Status badge', description: 'Show a current state', category: 'Utility', icon: '●',
    defaults: { status: 'success', text: 'Operational' },
    fields: [
      { key: 'status', label: 'Status style', kind: 'select', defaultValue: 'success', options: [{ label: 'Success', value: 'success' }, { label: 'Warning', value: 'warning' }, { label: 'Error', value: 'error' }, { label: 'Neutral', value: 'neutral' }] },
      { key: 'text', label: 'Status text', kind: 'text', defaultValue: 'Operational' }
    ]
  }
};

export function createComponent(type: ComponentType): DashboardComponent {
  const definition = componentRegistry[type];
  return { id: crypto.randomUUID(), type, label: definition.label, actionKey: '', properties: { ...definition.defaults } };
}
