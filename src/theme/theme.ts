// Theme configuration for shadcn/ui
// Reference: https://ui.shadcn.com/docs/theming

export const theme = {
  // Default color scheme
  color: {
    primary: "hsl(222.2, 47.4%, 11.2%)",
    primaryForeground: "hsl(210, 40%, 98%)",
    secondary: "hsl(210, 40%, 96.1%)",
    secondaryForeground: "hsl(222.2, 47.4%, 11.2%)",
    muted: "hsl(210, 40%, 96.1%)",
    mutedForeground: "hsl(215.4, 16.3%, 46.9%)",
    accent: "hsl(210, 40%, 96.1%)",
    accentForeground: "hsl(222.2, 47.4%, 11.2%)",
    destructive: "hsl(0, 84.2%, 60.2%)",
    destructiveForeground: "hsl(210, 40%, 98%)",
    border: "hsl(214.3, 31.8%, 91.4%)",
    input: "hsl(214.3, 31.8%, 91.4%)",
    ring: "hsl(222.2, 84%, 4.9%)",
    background: "hsl(0, 0%, 100%)",
    foreground: "hsl(222.2, 84%, 4.9%)",
  },
  // Border radius
  radius: {
    small: "0.375rem",
    medium: "0.5rem",
    large: "0.75rem",
  },
  // Fonts
  font: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    heading: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  // Shadows
  shadow: {
    small: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    large: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
};

export default theme; 