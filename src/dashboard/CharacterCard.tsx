import { DAY_GAN_INFO } from "./constants";
import { type DashboardProps } from "./types";

type Props = Pick<DashboardProps, "chart" | "name" | "gender" | "date" | "time" | "timeUnknown">;

export default function CharacterCard({ chart, name, gender, date, time, timeUnknown }: Props) {
  const info = DAY_GAN_INFO[chart.dayGan];
  const genderLabel = gender === "male" ? "남" : "여";
  const timeLabel = timeUnknown ? "시간모름" : `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
  const dateLabel = `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")}`;

  return (
    <section className="db-section db-character" aria-label="일간 캐릭터">
      <div className="db-char-row">
        <div
          className="db-hanja-card"
          style={{ background: `linear-gradient(135deg, ${info?.color ?? "#3a7a3a"}55, ${info?.color ?? "#3a7a3a"}22)`,
                   borderColor: `${info?.color ?? "#EACB8A"}66` }}
        >
          <span className="db-hanja">{chart.dayGan}</span>
        </div>
        <div className="db-char-meta">
          <p className="db-char-type">
            <b>{info ? `${info.nameKr}(${info.nameHanja})` : chart.dayGan}</b> · {info?.type ?? "알 수 없는 일간"} 타입
          </p>
          <p className="db-char-tags">{info?.tags.join("  ") ?? ""}</p>
        </div>
      </div>
      <div className="db-fields">
        <span>{name || "—"}</span>
        <span>{dateLabel}</span>
        <span>{timeLabel}</span>
        <span>{genderLabel}</span>
      </div>
    </section>
  );
}
