import "./globals.css";
import type { Metadata } from "next";

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Rotoscope Meme Lab",
  description: "Client-side rotoscope meme editor powered by ffmpeg.wasm and a SAM 2 segmentation adapter."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
