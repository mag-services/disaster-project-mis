import {
  GraduationCap,
  Home,
  Heart,
  Building2,
  Shield,
  MapPin,
  Layers,
  Zap,
  UtensilsCrossed,
  Users,
  Globe,
  Droplets,
  Truck,
  Radio,
  Apple,
  LucideIcon,
} from "lucide-react";

/** Map cluster names (lowercase) to Lucide icons. Partial matches supported. */
const CLUSTER_ICON_MAP: Record<string, LucideIcon> = {
  education: GraduationCap,
  shelter: Shield,
  health: Heart,
  infrastructure: Building2,
  housing: Home,
  location: MapPin,
  energy: Zap,
  food: UtensilsCrossed,
  nutrition: Apple,
  wash: Droplets,
  water: Droplets,
  gender: Users,
  protection: Shield,
  geographic: Globe,
  geography: Globe,
  logistics: Truck,
  camp: Home,
  emergency: Radio,
  telecom: Radio,
  telecommunications: Radio,
  default: Layers,
};

export function getClusterIcon(name: string): LucideIcon {
  const key = name.toLowerCase().trim();
  if (CLUSTER_ICON_MAP[key]) return CLUSTER_ICON_MAP[key];
  // Partial match: e.g. "food security" -> food
  for (const [k, icon] of Object.entries(CLUSTER_ICON_MAP)) {
    if (k !== "default" && key.includes(k)) return icon;
  }
  return CLUSTER_ICON_MAP.default;
}
