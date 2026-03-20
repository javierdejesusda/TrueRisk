import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Predictions",
  description:
    "ML-powered risk predictions for 7 natural hazards across Spanish provinces.",
};

export default function PredictionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
