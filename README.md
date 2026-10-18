# 메이플 장비 진단

캐릭터 이름과 본인의 넥슨 오픈 API 키를 넣으면 장비의 스타포스·잠재능력을 진단하는 대화형 화면. [mesulive](https://github.com/kurateh/mesulive)(AGPL-3.0)를 포크해 화면 틀과 배포 구성은 그대로 쓰고, 기존 계산기 기능은 제거했다.

- 대화창의 설명은 LLM 없이 코드가 만든 고정 문장이다.
- "Gemini에게 물어보기": 계산값과 필요한 규칙만 발췌한 진단 프롬프트를 만들어 준다(복사해서 Gemini 등에 붙여 넣기). 비용·키 없음.
- 넥슨 키는 서버에 저장하지 않는다. 화면에서 입력받아 요청 헤더(`x-nxopen-api-key`)로만 전달하고 그 요청 안에서만 쓴다.
- 효율 순위(능력치 상승 ÷ 메소)는 아직 없다. 필요한 규칙 데이터가 없다 → [CLAUDE.md](CLAUDE.md)

## 실행

```bash
pnpm install
pnpm dev:next        # http://localhost:3000
pnpm test
pnpm type-check
```

Node 20+, pnpm 9.15.1. 경매장 시세는 범위 밖.

## 규칙 데이터

`rules/starforce.yaml`, `rules/cube.yaml`. 모든 수치에 출처 URL 주석이 있고, 확인 못 한 값은 `TODO`. 출처 등급은 공식 > `community`(포크의 역산 값, 공식 대조 전).

## 라이선스

AGPL-3.0 ([LICENSE](LICENSE), 앱의 `/license`). 네트워크로 서비스하므로 소스를 사용자에게 공개해야 한다.
