# CLAUDE.md

메이플스토리 장비 진단 웹앱 (Next.js 15 + HeroUI + Tailwind, pnpm). mesulive 포크를 `mcp-rebuild` 브랜치에서 재구성 중. (브랜치명은 MCP 서버였던 이력 때문이며 MCP는 제거됨.)

## 원칙

- YAGNI. 요청하지 않은 기능·추상화·설정 옵션 금지. 기존 코드 재사용 우선.
- 가정은 명시하고, 불확실하면 멈추고 질문한다.
- 수치는 출처 URL을 `rules/*.yaml` 주석에 남긴다. 출처 없는 수치는 넣지 말고 `TODO`.
- 순위는 코드가 정하고 LLM은 설명만 한다. 대화창은 LLM 없이 템플릿 문장.
- 넥슨 오픈 API 키는 서버에 저장·로그하지 않는다(요청 헤더로만).

## 구조

- `rules/` 규칙 YAML(`version` 필드). `src/rules.ts`가 cwd 기준으로 읽고 검증한다. `next.config.mjs`의 `outputFileTracingIncludes`로 standalone 빌드에 포함.
- `src/starforce.ts` 스타포스 기대 비용(닫힌 식). `getCosts`는 포크에서 가져온 **비공식** 비용식.
- `src/nexon.ts` 넥슨 오픈 API(OCID → 장비).
- `src/diagnose.ts` 장비별 진단, 대화 문장, Gemini용 진단 프롬프트(필요한 규칙 행만 발췌).
- `src/app/starforce/` 스타포스 테스트 페이지(`/starforce`)와 브라우저 저장 게임(`/starforce/game`, 로직은 `src/game.ts`). 게임 판매가는 원가 기반 가정값이고 계정·공유는 아직 없다.
- `src/app/api/diagnose/route.ts` POST. `src/app/_components/ChatScreen.tsx` 화면.
- 화면 틀·배포(`MainLayout`, `Footer`, `shared/ui`, Dockerfile, compose, `manage.sh`, 워크플로우)는 원본을 유지하되 Prisma/Postgres는 제거함.

## 명령

`pnpm install` → `pnpm type-check` → `pnpm test` → `pnpm dev:next`

## 검증 상태 (중요)

이 코드는 Node가 없는 환경에서 작성되어 **한 번도 설치·타입체크·테스트·실행된 적이 없다.** 첫 작업은 위 명령을 순서대로 돌려 오류를 고치는 것.
- 의존성 정리(Prisma, tRPC, superjson 등 제거)와 `shared/` 미사용 모듈 삭제는 grep으로만 확인했다. 깨진 import가 있을 수 있다.
- `pnpm-lock.yaml`은 제거 전 의존성 기준이라 낡았다(`pnpm install`로 갱신).
- `src/diagnose.ts` 테스트가 아직 없다. `src/starforce.test.ts`(기대 비용·YAML 검증)만 있다.
- 넥슨 응답 필드명(`starforce_scroll_flag` 값 등)은 다른 저장소의 타입에서 가져왔고 실제 응답으로 대조하지 않았다.

## 아직 없는 것 (효율 순위 구현 전 사용자 결정/데이터 필요)

- 스타포스 성별 능력치 상승 폭 (`stat_gain_per_star`) — 공식 문서에 표 없음
- 큐브 메소 가격 기준 ("공식 메소 가격"의 정의)
- 환산 주스탯 계수, 직업별 유효 옵션
- 파괴 시 복구 규칙: 12성 복구는 포크의 가정, 확정복구(15~22성, 8개 레벨) 표는 원본 kurateh/mesulive(5361818)에서 옮긴 비공식 값. 둘 다 공식 확인 전. 대체 장비 비용은 0 가정
- 스타캐치 삭제(2026-03-19) 이후 확률: 공식 표를 그대로 쓰기로 결정(×1.05 미적용). 게임 내 UI와 대조는 아직 안 함
- 스타포스를 못 하는 슬롯(엠블렘·뱃지·포켓 등) 구분 — 슬롯명 미확인이라 현재는 레벨/최대 성 규칙으로만 거름

## 라이선스

AGPL-3.0 (원본 kurateh/mesulive). 포크 코드를 가져온 파일은 주석에 출처를 적는다. Footer의 제작자 링크는 원본 그대로이니 운영 전 교체 여부를 확인할 것.
