import whirl from "../assets/icons/whirl_loading.svg";
import "./WhirlLoader.css";

// 풀이·운세 등 LLM 응답 대기용 회전 스피너.
export default function WhirlLoader({ size = 24 }: { size?: number }) {
  return (
    <img
      src={whirl}
      className="whirl-loader"
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size }}
    />
  );
}
