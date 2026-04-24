"use client";

import { ThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" disableTransitionOnChange={false} {...props} />
  );
}

export type ColorMode = "light" | "dark";

export interface UseColorModeReturn {
  colorMode: ColorMode;
  setColorMode: (theme: string) => void;
  toggleColorMode: () => void;
}

/**
 * Resolves the active appearance for the whole app (Command Centre + map shell).
 * Uses `resolvedTheme` when set; falls back through `theme` / `systemTheme` so the
 * topbar toggle always flips `document.documentElement` between light and dark.
 */
export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, setTheme, forcedTheme, theme, systemTheme } = useTheme();

  const effective =
    forcedTheme ||
    resolvedTheme ||
    (theme === "system" ? systemTheme : theme) ||
    "light";

  const toggleColorMode = () => {
    const current =
      resolvedTheme ||
      (theme === "system" ? systemTheme : theme) ||
      "light";
    setTheme(current === "dark" ? "light" : "dark");
  };

  return {
    colorMode: (effective === "dark" ? "dark" : "light") as ColorMode,
    setColorMode: setTheme,
    toggleColorMode,
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? <LuMoon className="size-5 icon-interactive" /> : <LuSun className="size-5 icon-interactive" />;
}

interface ColorModeButtonProps extends React.ComponentProps<typeof Button> {}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const [mounted, setMounted] = React.useState(false);
  const { toggleColorMode } = useColorMode();

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-9"
        aria-label="Toggle color mode"
        ref={ref}
        {...props}
      >
        <span className="size-5 animate-pulse rounded bg-muted" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleColorMode}
      aria-label="Toggle color mode"
      ref={ref}
      {...props}
    >
      <ColorModeIcon />
    </Button>
  );
});
