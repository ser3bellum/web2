import "./globals.css";
import { Sidebar } from "./components/Sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden app-gradient">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />

          {/* Main is the scroll container - NO padding here */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
