import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "../theme";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "Auto", icon: ComputerDesktopIcon },
];

// Segmented control for the sidebar.
export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-switch" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          title={value === "system" ? "Match system setting" : `${label} mode`}
        >
          <Icon width={15} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

// Single icon button for tight spaces: toggles between light and dark.
export const ThemeButton = () => {
  const { resolved, setTheme } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  const Icon = resolved === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon width={18} />
    </button>
  );
};
