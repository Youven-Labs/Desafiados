import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Desafiados - Challenge Your Friends",
  description:
    "Create, share, and complete challenges with your friends. Earn points, unlock rewards, and make every day an adventure!",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body className="antialiased">
        <AuthProvider>
        {children}
        </AuthProvider>
        <footer className="w-full py-4 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
          © 2025 Youven Labs. Todos los derechos reservados.
        </footer>
      </body>
    </html>
  );
}