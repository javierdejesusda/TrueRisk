import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Map",
  description:
    "Interactive map of Spain showing real-time multi-hazard risk scores by province.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
