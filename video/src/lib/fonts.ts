import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const loadAllFonts = async () => {
  await Promise.all([
    loadFont({
      family: "Geist Sans",
      url: staticFile("GeistSans-Light.woff2"),
      weight: "300",
    }),
    loadFont({
      family: "Geist Sans",
      url: staticFile("GeistSans-Regular.woff2"),
      weight: "400",
    }),
    loadFont({
      family: "Geist Sans",
      url: staticFile("GeistSans-SemiBold.woff2"),
      weight: "600",
    }),
    loadFont({
      family: "Geist Sans",
      url: staticFile("GeistSans-Bold.woff2"),
      weight: "700",
    }),
    loadFont({
      family: "Geist Mono",
      url: staticFile("GeistMono-Regular.woff2"),
      weight: "400",
    }),
    loadFont({
      family: "Geist Mono",
      url: staticFile("GeistMono-Bold.woff2"),
      weight: "700",
    }),
  ]);
};

loadAllFonts();
