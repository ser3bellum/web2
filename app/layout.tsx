import "./globals.css";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="h-screen overflow-hidden app-gradient">{children}</body>
		</html>
	);
}
