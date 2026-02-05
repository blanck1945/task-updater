import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi estado — Update status",
  description: "Página personal de estado: en qué estoy, qué tareas tengo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
