import { useSearchParams } from "@remix-run/react";
import { useState, useRef, useEffect, useCallback } from "react";


export const useSearchParamForInput = (
  key: string,
  defaultValue: string
): [string, (newValue: string) => void] => {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const [tempValue, setTempValue] = useState(value);
  const ignoreNextUpdateRef = useRef(false);

  if (value !== tempValue && !ignoreNextUpdateRef.current) {
    setTempValue(value);
  }

  useEffect(() => {
    ignoreNextUpdateRef.current = false;
  }, [value]);

  const setValue = useCallback(
    (newValue: string) => {
      ignoreNextUpdateRef.current = true;
      setTempValue(newValue);
      setSearchParams(
        (prev) => {
          prev.set(key, newValue);
          return prev;
        },
        { preventScrollReset: true }
      );
    },
    [key, setSearchParams]
  );

  return [value, setValue];
};
