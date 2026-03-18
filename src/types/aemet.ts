export type AemetSeverity = "green" | "yellow" | "orange" | "red";

export interface AemetCapAlert {
  identifier: string;
  sender: string;
  sent: string;
  severity: AemetSeverity;
  event: string;
  headline: string;
  description: string;
  area_desc: string;
  geocode: string;
  onset: string;
  expires: string;
}
