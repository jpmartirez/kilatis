import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
      className={`${montserrat.variable} font-sans h-full antialiased`}
    >
      <body className={`${montserrat.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
