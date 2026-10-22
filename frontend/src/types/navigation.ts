export type Section = "principal" | "configuracoes" | "busca-local";

export interface NavigationItem {
  id: Section;
  label: string;
  icon: string;
}

export const navigationItems: NavigationItem[] = [
  { id: "principal", label: "Visão geral", icon: "⌂" },
  { id: "configuracoes", label: "Configurações", icon: "⚙" },
  { id: "busca-local", label: "Busca local", icon: "⌁" },
];
