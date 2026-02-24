"use client";

type Props = {
	label: string;
	placeholder?: string;

	// ✅ controlled value
	value?: string;

	// ✅ controlled change handler (setState)
	onChange?: (next: string) => void;

	disabled?: boolean;
	type?: string;

	select?: boolean;
	options?: string[];
};

export default function FieldRow({
	label,
	placeholder,
	value = "",
	onChange,
	disabled,
	type = "text",
	select,
	options = [],
}: Props) {
	return (
		<label htmlFor="apiKey" className="grid gap-2">
			<span className="text-sm font-medium">{label}</span>

			{select ? (
				<select
					disabled={disabled}
					className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:bg-slate-50"
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
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
				<input id="apiKey"
					type={type}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					onChange={(e) => onChange?.(e.target.value)}
					className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 disabled:bg-slate-50"
				/>
			)}
		</label>
	);
}
