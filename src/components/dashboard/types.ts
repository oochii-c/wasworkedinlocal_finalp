import { type SajuExtended } from "../../saju";
import { type Story } from "../../SajuReading";

export type { SajuExtended, Story };

export interface DashboardProps {
  chart: SajuExtended;
  stories: Story[];
  name: string;
  gender: string;
  date: { year: number; month: number; day: number };
  time: { hour: number; minute: number };
  timeUnknown: boolean;
  onBack: () => void;
}
