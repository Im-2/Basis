import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DASHBOARD_THEME_COOKIE, parseDashboardTheme } from "@/lib/dashboard-theme";
import { ThemeProvider } from "@/lib/theme";
import { DashboardShell } from "./_components/dashboard-shell";

// Reads the dashboard's theme cookie on the server so the first paint is
// already in the right theme (light by default) -- no flash of the wrong one.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const theme = parseDashboardTheme((await cookies()).get(DASHBOARD_THEME_COOKIE)?.value);

  return (
    <ThemeProvider initialTheme={theme}>
      <DashboardShell>{children}</DashboardShell>
    </ThemeProvider>
  );
}
