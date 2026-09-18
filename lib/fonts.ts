import { Fraunces, Archivo } from "next/font/google";

// Display serif — tall, high-contrast, editorial. Carries the brand's fashion-house register.
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  weight: "variable",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

// Functional sans — clean, geometric, quiet. Carries UI, body copy, commerce chrome.
export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600"],
  display: "swap",
});
