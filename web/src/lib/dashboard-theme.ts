// Shared by the dashboard layout (server, reads the cookie for the first paint)
// and ThemeProvider (client). A plain module: server components can't import
// values from a "use client" file.

export type AppTheme = "light" | "dark";

// A cookie rather than localStorage so the server can render the dashboard in
// the right theme on the first paint (no flash). Scoped to /dashboard: the
// landing page is always dark and never sees or uses it.
export const DASHBOARD_THEME_COOKIE = "basis-dashboard-theme";
export const DASHBOARD_THEME_COOKIE_PATH = "/dashboard";

/** Light unless the user explicitly chose dark. */
export function parseDashboardTheme(value: string | undefined | null): AppTheme {
  return value === "dark" ? "dark" : "light";
}
