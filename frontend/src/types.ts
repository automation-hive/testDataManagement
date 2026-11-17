export type ComponentType = 'BUTTON' | 'TEXT_FIELD' | 'CARD' | 'TABLE';
export type ComponentProps = Record<string, string | boolean>;

export interface DashboardComponent {
  id: string;
  type: ComponentType;
  label: string;
  actionKey: string;
  props: ComponentProps;
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
