"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorWindowProps {
  onChange: (key: string, value: string) => void;
  language?: string;
  code?: string;
  theme?: string;
}

const CodeEditorWindow: React.FC<CodeEditorWindowProps> = ({
  onChange,
  language = "javascript",
  code = "",
  theme = "vs-dark",
}) => {
  const [value, setValue] = useState<string>(code);

  useEffect(() => {
    setValue(code); // Update the internal state whenever the code prop changes
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    setValue(value || "");
    onChange("code", value || "");
  };

  return (
    <div className="overlay rounded-md overflow-hidden w-full h-full shadow-4xl">
      <Editor
        height="85vh"
        width="100%"
        language={language}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default CodeEditorWindow;
