import { LayoutDashboard, TrendingUp, AlertTriangle, Package, Map, Lightbulb, Database } from 'lucide-react';

export interface NavigationItem {
  title: string;
  route: string;
  icon: React.ElementType;
  enabled: boolean;
}

export const dashboardNavigation: NavigationItem[] = [
  {
    title: 'Overview',
    route: '/dashboard/overview',
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    title: 'Profit Analytics',
    route: '/dashboard/profit',
    icon: TrendingUp,
    enabled: true,
  },
  {
    title: 'Return Risk',
    route: '/dashboard/returns',
    icon: AlertTriangle,
    enabled: true,
  },
  {
    title: 'Products',
    route: '/dashboard/products',
    icon: Package,
    enabled: true,
  },
  {
    title: 'Geography',
    route: '/dashboard/geography',
    icon: Map,
    enabled: true,
  },
  {
    title: 'Recommendations',
    route: '/dashboard/recommendations',
    icon: Lightbulb,
    enabled: true,
  },
  {
    title: 'Data Health',
    route: '/dashboard/health',
    icon: Database,
    enabled: true,
  },
];
