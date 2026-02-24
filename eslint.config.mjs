// eslint.config.mjs
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: [
			"**/node_modules/**",
			"**/.next/**",
			"next-env.d.ts",
			"eslint.config.*",
		],
	},

	js.configs.recommended,
	...tseslint.configs.recommended,

	{
		plugins: { "react-hooks": reactHooks },
		rules: {
			// keep hooks sane
			...reactHooks.configs.recommended.rules,

			// your “ship it” stance
			"@typescript-eslint/no-explicit-any": "warn",
			"react-hooks/set-state-in-effect": "off",
		},
	},
];
