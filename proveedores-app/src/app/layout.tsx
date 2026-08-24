import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Nota: se usa una pila de fuentes del sistema (sin next/font/google) a propósito,
// para que el build no dependa de una conexión saliente a Google Fonts en tiempo
// de compilación. El resultado visual en dispositivos modernos es equivalente.

export const metadata: Metadata = {
  title: "Reciservicios | Selección de Proveedores",
  description:
    "Reciservicios — plataforma empresarial de cumplimiento, módulo de selección de proveedores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
