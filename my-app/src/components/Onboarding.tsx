import { useState } from "react";
import "./Onboarding.css";
import background from "./yonggung.png";

function App() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("남성");
  const [calendar, setCalendar] = useState("양력");

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const [time, setTime] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);

  // 사주 확인하기 버튼
  const handleSubmit = () => {
    console.log("이름:", name);
    console.log("성별:", gender);
    console.log("달력:", calendar);
    console.log("생년월일:", `${year}-${month}-${day}`);
    console.log(
      "태어난 시간:",
      unknownTime ? "모름" : time
    );

    alert("사주 정보를 확인했습니다!");
  };

  return (
    <div className="page">

      {/* 배경 + 폼을 하나로 묶음 */}
      <div className="scene">

        {/* 용궁집 배경 */}
        <img
          src={background}
          alt="용궁집 배경"
          className="background"
        />

        {/* =========================
            가운데 입력폼
        ========================= */}
        <div className="form-area">

          {/* 이름 */}
          <div className="form-row">

            <div className="label">
              <span className="icon">♙</span>
              <span>이름</span>
            </div>

            <input
              type="text"
              placeholder="이름을 입력해주세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

          </div>


          {/* 성별 */}
          <div className="form-row">

            <div className="label">
              <span className="icon">♙</span>
              <span>성별</span>
            </div>

            <div className="button-group">

              <button
                type="button"
                className={gender === "남성" ? "active" : ""}
                onClick={() => setGender("남성")}
              >
                ♂ 남성
              </button>

              <button
                type="button"
                className={gender === "여성" ? "active" : ""}
                onClick={() => setGender("여성")}
              >
                ♀ 여성
              </button>

            </div>

          </div>


          {/* 달력 */}
          <div className="form-row">

            <div className="label">
              <span className="icon">▣</span>
              <span>달력</span>
            </div>

            <div className="button-group">

              <button
                type="button"
                className={calendar === "양력" ? "active" : ""}
                onClick={() => setCalendar("양력")}
              >
                ☼ 양력
              </button>

              <button
                type="button"
                className={calendar === "음력" ? "active" : ""}
                onClick={() => setCalendar("음력")}
              >
                ☾ 음력
              </button>

            </div>

          </div>


          {/* 생년월일 */}
          <div className="form-row">

            <div className="label">
              <span className="icon">▣</span>
              <span>생년월일</span>
            </div>

            <div className="birth-input">

              <input
                type="number"
                placeholder="YYYY"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />

              <span>년</span>

              <input
                type="number"
                placeholder="MM"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />

              <span>월</span>

              <input
                type="number"
                placeholder="DD"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />

              <span>일</span>

            </div>

          </div>


          {/* 태어난 시간 */}
          <div className="form-row time-row">

            <div className="label">
              <span className="icon">◷</span>
              <span>태어난 시간</span>
            </div>

            <div className="time-area">

              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={unknownTime}
              >
                <option value="">
                  태어난 시간을 선택해주세요
                </option>

                <option value="자시">
                  자시 (23:00 ~ 01:00)
                </option>

                <option value="축시">
                  축시 (01:00 ~ 03:00)
                </option>

                <option value="인시">
                  인시 (03:00 ~ 05:00)
                </option>

                <option value="묘시">
                  묘시 (05:00 ~ 07:00)
                </option>

                <option value="진시">
                  진시 (07:00 ~ 09:00)
                </option>

                <option value="사시">
                  사시 (09:00 ~ 11:00)
                </option>

                <option value="오시">
                  오시 (11:00 ~ 13:00)
                </option>

                <option value="미시">
                  미시 (13:00 ~ 15:00)
                </option>

                <option value="신시">
                  신시 (15:00 ~ 17:00)
                </option>

                <option value="유시">
                  유시 (17:00 ~ 19:00)
                </option>

                <option value="술시">
                  술시 (19:00 ~ 21:00)
                </option>

                <option value="해시">
                  해시 (21:00 ~ 23:00)
                </option>

              </select>


              {/* 시간 모름 */}
              <label className="unknown-time">

                <input
                  type="checkbox"
                  checked={unknownTime}
                  onChange={(e) => {
                    setUnknownTime(e.target.checked);

                    if (e.target.checked) {
                      setTime("");
                    }
                  }}
                />

                <span>
                  태어난 시간을 모르겠어요
                </span>

              </label>

            </div>

          </div>


          {/* =========================
              사주 확인하기 버튼
          ========================= */}
          <button
            type="button"
            className="submit-button"
            onClick={handleSubmit}
          >

            <span className="button-star">
              ✦
            </span>

            <span>
              사주 확인하기
            </span>

            <span className="button-arrow">
              →
            </span>

          </button>

        </div>

      </div>

    </div>
  );
}

export default App;