"use client";

type Props = {
  label: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  type?: string;
  select?: boolean;
  options?: string[];
};

export default function FieldRow({
  label,
  placeholder,
  value,
  disabled,
  type = "text",
  select,
  options = [],
}: Props) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>

      {select ? (
        <select
          disabled={disabled}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-50"
          defaultValue={value ?? ""}
        >
          <option value="" disabled>
            {placeholder ?? "Select..."}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 disabled:bg-slate-50"
        />
      )}
    </label>
  );
}
