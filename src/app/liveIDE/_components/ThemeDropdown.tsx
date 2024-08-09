import React from "react";
import Select, { SingleValue } from "react-select";
import monacoThemes from "monaco-themes/themes/themelist.json";
import { customStyles } from "../_constants/customStyles";

interface ThemeOption {
  label: string;
  value: string;
  key: string;
}

interface ThemeDropdownProps {
  handleThemeChange: (theme: ThemeOption | null) => void;
  theme: ThemeOption;
}

const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  handleThemeChange,
  theme,
}) => {
  return (
    <Select
      placeholder={`Select Theme`}
      options={Object.entries(monacoThemes).map(([themeId, themeName]) => ({
        label: themeName,
        value: themeId,
        key: themeId, // Ensure this property is included
      }))}
      value={theme}
      styles={customStyles}
      onChange={handleThemeChange}
    />
  );
};

export default ThemeDropdown;
