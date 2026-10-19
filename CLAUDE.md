# CLAUDE.md

메이플스토리 장비 진단 웹앱 (Next.js 15 + shadcn/ui(Radix) + Tailwind v3, pnpm). mesulive 포크를 `mcp-rebuild` 브랜치에서 재구성 중. (브랜치명은 MCP 서버였던 이력 때문이며 MCP는 제거됨.)

## 원칙

- YAGNI. 요청하지 않은 기능·추상화·설정 옵션 금지. 기존 코드 재사용 우선.
- 가정은 명시하고, 불확실하면 멈추고 질문한다.
- 수치는 출처 URL을 `rules/*.yaml` 주석에 남긴다. 출처 없는 수치는 넣지 말고 `TODO`.
- 순위는 코드가 정하고 LLM은 설명만 한다. 대화창은 LLM 없이 템플릿 문장.
- 넥슨 오픈 API 키는 서버에 저장·로그하지 않는다(요청 헤더로만).
- 화면 문구는 [im-not-ai](https://github.com/epoko77-ai/im-not-ai) 규칙을 따른다: 대시(—)로 덧붙이기, "A가 아니라 B" 대구, 따옴표 강조, "다음과 같은"·"결론적으로" 같은 결산 어투를 줄이고 해요체 평서문으로 쓴다.
- 금액은 억 단위로 쓰고 끝의 `.00`은 붙이지 않는다(`src/format.ts`). 장비는 레벨이 아니라 세트 이름(에테르넬, 칠흑 등)으로 고른다.

## 구조

- `rules/` 규칙 YAML(`version` 필드). `src/rules.ts`가 cwd 기준으로 읽고 검증한다. `next.config.mjs`의 `outputFileTracingIncludes`로 standalone 빌드에 포함.
- `src/starforce.ts` 스타포스 기대 비용(닫힌 식). `getCosts`는 포크에서 가져온 **비공식** 비용식.
- `src/nexon.ts` 넥슨 오픈 API(OCID → 장비).
- `src/diagnose.ts` 장비별 진단, 대화 문장, Gemini용 진단 프롬프트(필요한 규칙 행만 발췌).
- `src/app/starforce/` 스타포스 페이지(`/starforce`) 하나에 탭 두 개: 게임(기본)과 계산표(`?tab=table`, `TablePanel.tsx`). 예전 `/starforce/game`은 `/starforce`로 리다이렉트, 예전 `/starforce?level=&star=` 주소는 계산표로 간다. 게임은 브라우저 저장(`game/GameScreen.tsx`, 로직은 `src/game.ts`, 레벨별 데이터는 `src/gameData.ts` → `GET /api/game?level=`). 모드 2가지: 처음부터 하기(세트를 고르면 그 세트의 부위별 장비를 하나씩 사서 ★0부터 키움)와 내 장비로 하기(`POST /api/game`으로 장비를 모두 불러와 현재 성에서 시작, 넥슨 키는 헤더로만). 장비마다 구매가가 달라 `GET /api/game?level=&price=`로 (레벨, 구매가) 조합별 데이터를 받는다. 구매가는 `src/items.ts`의 `ITEM_PRICES`(비어 있으면 `DEFAULT_PRICE`). 게임 판매가는 원가 기반 가정값이고 계정·공유는 아직 없다.
- `src/items.ts` 아이템 세트(이름, 착용 레벨, 색, 부위). 레벨은 커뮤니티 값이라 공식 확인 전이다. 아이콘은 `ITEM_IMAGES`에 적힌 `public/items/<세트>/<부위>.png`를 먼저 쓰고(나무위키 등에서 받은 작은 파일, 아직 비어 있음), 없으면 `src/components/item-icon.tsx`의 임시 SVG를 쓴다. 내 장비 모드는 넥슨이 주는 `item_icon`과 캐릭터 그림(`character/basic`)을 쓴다. 장비창은 `equipment-window.tsx`로 게임 장비창처럼 7열 격자에 가운데 캐릭터, 칸 위치는 `SLOT_POSITIONS`(확인 필요).
- `src/app/api/diagnose/route.ts` POST. `src/app/_components/ChatScreen.tsx` 화면.
- UI: shadcn/ui(new-york, zinc, CSS 변수 토큰은 `src/app/globals.css`, 라이트/다크는 `next-themes`). 컴포넌트는 `src/components/ui/`, 조합 컴포넌트는 `src/components/`(`SectionContainer`, `PageTitle`, `ThemeToggle`, `AnimatedMeso`, `StarStrip`). `components.json`이 있어 새 컴포넌트는 `pnpm dlx shadcn@latest add <name>`로 추가한다(클라우드 샌드박스는 shadcn 레지스트리가 막혀 있어 소스를 직접 옮겼다). 색은 `bg-primary` 같은 토큰만 쓰고 hex를 직접 쓰지 않는다. 연출은 `tailwind.config.ts`의 `star-pop`·`shake`·`destroy-flash` 키프레임과 framer-motion, 모션 줄이기 설정은 `globals.css`에서 일괄 처리.
- 배포(Dockerfile, compose, `manage.sh`, 워크플로우)는 원본을 유지하되 Prisma/Postgres, HeroUI, 스토리북은 제거함.

## 명령

`pnpm install` → `pnpm type-check` → `pnpm test` → `pnpm dev:next`

## 검증 상태 (중요)

이 코드는 Node가 없는 환경에서 작성되어 **한 번도 설치·타입체크·테스트·실행된 적이 없다.** 첫 작업은 위 명령을 순서대로 돌려 오류를 고치는 것.
- 의존성 정리(Prisma, tRPC, superjson 등 제거)와 `shared/` 미사용 모듈 삭제는 grep으로만 확인했다. 깨진 import가 있을 수 있다.
- `pnpm-lock.yaml`은 제거 전 의존성 기준이라 낡았다(`pnpm install`로 갱신).
- `src/diagnose.ts` 테스트가 아직 없다. `src/starforce.test.ts`(기대 비용·YAML 검증)만 있다.
- 넥슨 응답 필드명(`starforce_scroll_flag` 값 등)은 다른 저장소의 타입에서 가져왔고 실제 응답으로 대조하지 않았다.

## 아직 없는 것 (효율 순위 구현 전 사용자 결정/데이터 필요)

- 스타포스 성별 능력치 상승 폭 (`stat_gain_per_star`) — 공식 문서에 표 없음. 그래서 부위별 추천(`recommendSlots`)의 순위는 효율이 아니라 임시로 "다음 1성 기대 메소가 적은 순"
- 큐브 메소 가격 기준 ("공식 메소 가격"의 정의)
- 환산 주스탯 계수, 직업별 유효 옵션
- 파괴 시 복구 규칙: 12성 복구는 포크의 가정, 확정복구(15~22성, 8개 레벨) 표는 원본 kurateh/mesulive(5361818)에서 옮긴 비공식 값. 둘 다 공식 확인 전. 대체 장비 비용은 0 가정
- 스타캐치 삭제(2026-03-19) 이후 확률: 공식 표를 그대로 쓰기로 결정(×1.05 미적용). 게임 내 UI와 대조는 아직 안 함
- 스타포스를 못 하는 슬롯(엠블렘·뱃지·포켓 등) 구분 — 슬롯명 미확인이라 현재는 레벨/최대 성 규칙으로만 거름

## 라이선스

AGPL-3.0 (원본 kurateh/mesulive). 포크 코드를 가져온 파일은 주석에 출처를 적는다. Footer의 제작자 링크는 원본 그대로이니 운영 전 교체 여부를 확인할 것.
