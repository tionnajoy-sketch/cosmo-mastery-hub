import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { GraduationCap, LayoutDashboard, Library, ClipboardList, Wand2 } from "lucide-react";

const navItems = [
  { to: "/lms", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/lms/courses", label: "Course Library", icon: Library, end: false },
  { to: "/lms/instructor", label: "Instructor", icon: ClipboardList, end: false },
  { to: "/lms/builder", label: "Curriculum Builder", icon: Wand2, end: false },
];

export default function LmsLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="lms-scope min-h-screen">
      <header className="border-b border-[hsl(var(--lms-border))] bg-[hsl(var(--lms-cream))]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[hsl(var(--lms-teal))] flex items-center justify-center text-[hsl(var(--lms-cream))]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="lms-display text-lg leading-tight font-semibold">TJ Anderson Layer Method</div>
              <div className="text-xs text-[hsl(var(--lms-muted))] tracking-wide uppercase">Learning Center</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 ml-auto flex-wrap">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-[hsl(var(--lms-teal))] text-[hsl(var(--lms-cream))]"
                      : "text-[hsl(var(--lms-ink-soft))] hover:bg-[hsl(var(--lms-cream-soft))]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}

export function LmsProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="lms-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="lms-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LmsChip({
  children,
  variant = "teal",
}: {
  children: ReactNode;
  variant?: "teal" | "gold" | "status";
}) {
  const cls =
    variant === "gold"
      ? "lms-chip-gold"
      : variant === "status"
      ? "lms-chip-status"
      : "lms-chip-teal";
  return (
    <span className={`${cls} inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
      {children}
    </span>
  );
}
