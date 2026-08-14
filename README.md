# wasworkedinlocal_finalp

<img width="856" height="187" alt="image" src="https://github.com/user-attachments/assets/d4e5abae-f73a-4c05-8b97-23a1c475a194" />

## 브랜치 규칙
- main 브랜치에 직접 커밋 금지(최종 Progect용) -> 머지할때만..
- 브랜치 이름은 feature/기능이름 으로 짓는다(각자 개발 or 작업파일)

## 팀원 전원의 Claude가 같은 규칙
/init

## 건드리면 안 되는 것(.gitignore 넣을 내용)
 .env
*.key
node_modules/
__pycache__/

## 음력 변환 테스트 (브랜치 `test/lunar-api`)

음력 변환을 KASI API vs lunar-typescript 중 무엇으로 할지 정하는 A/B 테스트 브랜치.

- 결론: 한국 사주엔 **KASI(한국천문연구원)** 채택. lunar-typescript는 중국 기준이라 1990–2030 중 21개 달에서 하루 어긋남(설날·윤달 포함).
- 브랜치 개요: [`docs/lunar-ab-branch-overview.md`](docs/lunar-ab-branch-overview.md)
- 테스트 결과: [`docs/lunar-ab-test-report.md`](docs/lunar-ab-test-report.md)

A/B 도구(`LunarAB`)는 검증용이라 제품 UI엔 미배선. 자세한 재현법은 개요 문서 참고.
