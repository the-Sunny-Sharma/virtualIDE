import React from "react";
import Select, { SingleValue } from "react-select";
import { customStyles } from "../_constants/customStyles";
import { languageOptions } from "../_constants/languageOptions";

interface LanguageOption {
  id: number;
  name: string;
  label: string;
  value: string;
}

interface LanguagesDropdownProps {
  onSelectChange: (selectedOption: SingleValue<LanguageOption>) => void;
}

const LanguagesDropdown: React.FC<LanguagesDropdownProps> = ({
  onSelectChange,
}) => {
  return (
    <Select
      placeholder="Filter By Category"
      options={languageOptions}
      styles={customStyles}
      defaultValue={languageOptions[0]}
      onChange={(selectedOption) =>
        onSelectChange(selectedOption as SingleValue<LanguageOption>)
      }
    />
  );
};

export default LanguagesDropdown;
