import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Active Alerts",
  description:
    "Real-time weather alerts and risk warnings from AEMET and TrueRisk ML models.",
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
