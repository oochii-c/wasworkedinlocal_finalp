import { useState } from "react";
import "./App.css";
import kero from "./kero.png";


function App() {

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [calendar, setCalendar] = useState("solar");

  return (

    <div className="page">

      <div className="logo-box">

        {/* 코너 장식 */}
        <div className="corner tl"></div>
        <div className="corner tr"></div>
        <div className="corner bl"></div>
        <div className="corner br"></div>

        {/* 중앙 별 */}
        <div className="center-star">
          <div className="wing-l"></div>
          <div className="circle"></div>
          <div className="wing-r"></div>
        </div>

        <h1>
          사팔사팔
        </h1>

        <p className="sub">
          생년월일을 입력하고<br/>
          나의 운명을 확인하세요
        </p>

        <h3>이름</h3>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <h3>성별</h3>
        <div className="button-group">
          <button
            className={gender === "male" ? "active" : ""}
            onClick={() => setGender("male")}
          >남</button>
          <button
            className={gender === "female" ? "active" : ""}
            onClick={() => setGender("female")}
          >여</button>
        </div>

        <h3>달력</h3>
        <div className="button-group">
          <button
            className={calendar === "solar" ? "active" : ""}
            onClick={() => setCalendar("solar")}
          >양력</button>
          <button
            className={calendar === "lunar" ? "active" : ""}
            onClick={() => setCalendar("lunar")}
          >음력</button>
        </div>

        <button className="submit">
          <img className="btn-kero" src={kero} alt="케로" />
          사주 보기
        </button>

      </div>

    </div>

  );

}

export default App;