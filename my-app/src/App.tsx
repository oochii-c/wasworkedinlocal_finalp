import './App.css'
import Onboarding from './components/Onboarding.tsx'

// 음력 변환 A/B 테스트(KASI vs lunar-typescript)는 검증용 도구라 제품 UI에 미배선.
// 도구 코드는 components/LunarAB.tsx·server/, 결과는 docs/lunar-ab-test-report.md 참고.
function App() {
  return (
    <div className="app">
      <Onboarding />
    </div>
  )
}

export default App
