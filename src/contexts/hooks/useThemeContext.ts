import { useContext } from "react";
import type { ThemeContextType } from "../ThemeContext";
import ThemeContext from "../ThemeContext";

export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
