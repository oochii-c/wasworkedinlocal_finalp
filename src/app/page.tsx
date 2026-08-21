import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>사주 운세 앱</h1>
      <p>
        <Link href="/year-fortune/2026">2026년 운세 상세 보기 →</Link>
      </p>
    </main>
  );
}
