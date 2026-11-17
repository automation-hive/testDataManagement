export type ComponentType = 'BUTTON' | 'TEXT_FIELD' | 'DROPDOWN' | 'CHECKBOX' | 'METRIC_CARD' | 'DATA_TABLE' | 'CHART' | 'ALERT' | 'STATUS_BADGE';

export interface DashboardComponent {
  id: string;
  type: ComponentType;
  label: string;
  actionKey: string;
  properties: Record<string, string | number | boolean>;
}

export interface DashboardConfig {
  version: 2;
  components: DashboardComponent[];
}

export interface Project {
  id: string;
  name: string;
  configJson: string;
}
