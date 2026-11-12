import {
  LayoutDashboard,
  Car,
  Wrench,
  Fuel,
  BellRing,
  ChartColumn,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Flota de vehículos", href: "/flota", icon: Car },
  { title: "Mantenimiento", href: "/mantenimiento", icon: Wrench },
  { title: "Combustible", href: "/combustible", icon: Fuel },
  { title: "Vencimientos y alertas", href: "/vencimientos", icon: BellRing },
  { title: "Estadísticas e informes", href: "/estadisticas", icon: ChartColumn },
  { title: "Configuración", href: "/configuracion", icon: Settings },
]
