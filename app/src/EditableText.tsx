import { useState, useRef, useEffect, useLayoutEffect } from "react";


export const EditableText = ({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [isEditing]);

  useLayoutEffect(() => {
    if (textareaRef.current && spanRef.current) {
      textareaRef.current.style.width = `${spanRef.current.getBoundingClientRect().width + 8}px`;
      textareaRef.current.style.height = `${spanRef.current.getBoundingClientRect().height}px`;
      textareaRef.current.style.textAlign = window.getComputedStyle(
        spanRef.current
      ).textAlign;
    }
  }, [value, isEditing]);

  return (
    <span className="relative inline-block">
      <span
        ref={spanRef}
        onClick={() => {
          setIsEditing(true);
        }}
        className={"inline-block" +
          (isEditing ? " whitespace-pre-wrap invisible" : "") +
          (value === "" ? " text-gray-400" : "")}
      >
        {value ? value : placeholder ?? "\u00A0\u00A0\u00A0\u00A0"}
      </span>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onBlur={() => {
            setIsEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setIsEditing(false);
            }
          }}
          autoFocus
          className="inline-block absolute top-0 -left-1 pl-1 pr-1 bg-white bg-opacity-75 text-black overflow-hidden" />
      ) : undefined}
    </span>
  );
};
