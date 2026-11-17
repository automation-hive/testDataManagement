export type ComponentType = 'BUTTON' | 'TEXT_FIELD' | 'CARD' | 'TABLE';

export interface DashboardComponent {
  id: string;
  type: ComponentType;
  label: string;
  actionKey: string;
}

export interface DashboardConfig {
  version: 1;
  components: DashboardComponent[];
}

export interface Project {
  id: string;
  name: string;
  configJson: string;
}
