import "./Onboarding.css"
import { useState } from "react"

// 숫자만 추려 YYYY.MM.DD로 자동 포맷 (입력하는 동안 점 자동 삽입)
const formatBirthDate = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 8)
    const parts = [d.slice(0, 4)]
    if (d.length > 4) parts.push(d.slice(4, 6))
    if (d.length > 6) parts.push(d.slice(6, 8))
    return parts.join(".")
}

const Onboarding = () => {
    // 사용자 이름 저장
    const [userName, setUserName] = useState<string>("")
    const [gender, setGender] = useState<string>("남자")
    const [calendarType, setCalendarType] = useState<string>("양력")
    const [birthDate, setbirthDate] = useState<string>("")
    const [birthTime, setBirthTime] = useState<string>("")
    const [timeUnknown, setTimeUnknown] = useState<boolean>(false)
    const [birthCity, setBirthCity] = useState<string>("")

    return (
        <div className="onboarding-page">
            <form action="" className="onboarding-form">
                <h1 className="onboarding-title">당신의 사주를 봅니다</h1>
                <p className="onboarding-subtitle">생년월일시로 원국을 그립니다</p>

                <div className="form-field">
                    <label className="field-label" htmlFor="user-name">이름</label>
                    <input className="field-input" type="text" id="user-name" value={userName} onChange={(e) => setUserName(e.target.value)} autoFocus />
                </div>

                <fieldset className="form-field">
                    <legend className="field-label">성별</legend>
                    <div className="segment">
                        <input type="radio" id="gender-male" name="gender" value="남자" checked={gender === "남자"} onChange={(e) => setGender(e.target.value)} />
                        <label className="segment-option" htmlFor="gender-male">남자</label>
                        <input type="radio" id="gender-female" name="gender" value="여자" checked={gender === "여자"} onChange={(e) => setGender(e.target.value)} />
                        <label className="segment-option" htmlFor="gender-female">여자</label>
                    </div>
                </fieldset>

                <fieldset className="form-field">
                    <legend className="field-label">생년월일시</legend>
                    <label className="sr-only" htmlFor="calendar-type">날짜 형식</label>
                    <select className="field-input" name="calendar-type" id="calendar-type" value={calendarType} onChange={(e) => setCalendarType(e.target.value)}>
                        <option value="양력">양력</option>
                        <option value="음력">음력</option>
                    </select>
                    <div className="datetime-row">
                        <label className="sr-only" htmlFor="birth-date">생년월일</label>
                        <input className="field-input" type="text" inputMode="numeric" maxLength={10} id="birth-date" placeholder="2000.01.01" value={birthDate} onChange={(e) => setbirthDate(formatBirthDate(e.target.value))} />
                        <label className="sr-only" htmlFor="birth-time">시간</label>
                        <input className="field-input" type="number" id="birth-time" placeholder="00:00" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} disabled={timeUnknown} />
                    </div>
                    <label className="toggle">
                        <input className="toggle-input" type="checkbox" id="time-unknown" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
                        <span className="toggle-track" aria-hidden="true"></span>
                        <span className="toggle-text">태어난 시간 모름</span>
                    </label>
                </fieldset>

                <div className="form-field">
                    <label className="field-label" htmlFor="birth-city">도시</label>
                    <input className="field-input" type="text" id="birth-city" list="city-list" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} />
                    <datalist id="city-list">
                        <option value="서울" />
                        <option value="부산" />
                        <option value="대구" />
                        <option value="인천" />
                        <option value="광주" />
                        <option value="대전" />
                        <option value="울산" />
                        <option value="세종" />
                        <option value="경기" />
                        <option value="강원" />
                        <option value="충북" />
                        <option value="충남" />
                        <option value="전북" />
                        <option value="전남" />
                        <option value="경북" />
                        <option value="경남" />
                        <option value="제주" />
                    </datalist>
                </div>

                <button className="submit-button" type="submit">원국 생성</button>
            </form>
        </div>
    )
}

export default Onboarding
