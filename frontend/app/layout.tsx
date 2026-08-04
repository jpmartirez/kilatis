import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plus_jakarta_sans = Plus_Jakarta_Sans({
  variable: "--font-plus_jakarta_sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KILATIS - Digital Image Authentication Analysis Tool",
  description:
    "Advanced image forensic analysis powered by a tri-stream deep learning architecture for cybercrime investigators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plus_jakarta_sans.variable} font-sans h-full antialiased`}
    >
      <body className={`${plus_jakarta_sans.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
