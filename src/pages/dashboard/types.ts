import { type SajuExtended } from "../../saju";
import { type Story } from "../../services/sajuApi";

export type { SajuExtended, Story };

export interface DashboardProps {
  chart: SajuExtended;
  stories: Story[] | null;
  loading?: boolean;
  onRetry?: () => void;
  name: string;
  gender: string;
  date: { year: number; month: number; day: number };
  time: { hour: number; minute: number };
  timeUnknown: boolean;
  onBack: () => void;
}
