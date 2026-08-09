import {
  Award,
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileLock2,
  FileSignature,
  Home,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  MessageSquareText,
  ScrollText,
  Star,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const publicNavigation: NavigationItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/company", label: "Life at ConnectSphere", icon: Building2 },
  { href: "/my-applications", label: "Applications", icon: ClipboardList },
  { href: "/privacy", label: "Privacy", icon: LockKeyhole },
  { href: "/login", label: "Login", icon: LogIn },
];

export const superAdminNavigation: NavigationItem[] = [
  {
    href: "/recruitment",
    label: "Recruitment dashboard",
    icon: LayoutDashboard,
  },
  { href: "/recruitment/jobs", label: "Manage jobs", icon: BriefcaseBusiness },
  {
    href: "/recruitment/applications",
    label: "Applications",
    icon: ClipboardList,
  },
  { href: "/recruitment/offers", label: "Offer letters", icon: FileSignature },
  { href: "/recruitment/contracts", label: "Contracts", icon: FileLock2 },
  { href: "/recruitment/certificates", label: "Certificates", icon: Award },
  { href: "/admin/employees", label: "Employees", icon: UserCog },
  { href: "/admin/operations", label: "People operations", icon: Workflow },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/hr", label: "HR permissions", icon: KeyRound },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  {
    href: "/admin/recommendations",
    label: "Recommendations",
    icon: MessageSquareText,
  },
  { href: "/admin/notifications", label: "All notifications", icon: Bell },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ScrollText },
];
