import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

interface RangeFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  output: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

/** Atomic Design: atom — a labeled, keyboard-operable numeric control. */
export function RangeField({
  id,
  label,
  output,
  ...props
}: RangeFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-muted-foreground">
          {output}
        </output>
      </div>
      <input
        {...props}
        id={id}
        type="range"
        className="h-8 w-full cursor-pointer accent-foreground"
      />
    </div>
  );
}

/** Atomic Design: atom — a labeled native select with resilient semantics. */
export function SelectField({
  id,
  label,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select
        {...props}
        id={id}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </div>
  );
}
