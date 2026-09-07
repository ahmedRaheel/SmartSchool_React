/**
 * useFormState — generic form state with reset and field setter.
 *
 * Usage:
 *   const { form, setField, reset, error, setError } = useFormState({ name:"", email:"" });
 *   <input value={form.name} onChange={setField("name")} />
 */
import { useState, useCallback } from "react";

export function useFormState<T extends Record<string, any>>(initial: T) {
  const [form,  setForm]  = useState<T>(initial);
  const [error, setError] = useState("");

  const setField = useCallback(
    (key: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [key]: e.target.value })),
    [],
  );

  const setFieldValue = useCallback(
    (key: keyof T, value: any) =>
      setForm(p => ({ ...p, [key]: value })),
    [],
  );

  const reset = useCallback(() => {
    setForm(initial);
    setError("");
  }, [initial]);

  return { form, setForm, setField, setFieldValue, reset, error, setError };
}
