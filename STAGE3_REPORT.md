# 3단계 구현 완료 보고서

작성일: 2026-10-06

기존 숲 화면, 카드 선택, 터치 배치, 정규화 좌표, 기본 이동을 유지하면서 **풀 → 메뚜기 → 개구리**의 먹이 관계를 구현했습니다. 신규 이미지와 생태계 전체 시뮬레이션은 추가하지 않았습니다.

## 1. 수정/추가한 파일

수정 15개:

- index.html
- css/placement.css
- data/organisms.js
- data/forest.js
- data/interaction-config.js
- js/state/game-state.js
- js/systems/placement.js
- js/systems/wander.js
- js/main.js
- js/ui/render.js
- js/ui/organism-layer.js
- tests/browser.test.cjs
- README.md
- ARCHITECTURE.md
- QA.md

추가 8개:

- data/food-relations.js
- data/ecology-config.js
- js/state/organism-instance.js
- js/systems/feeding.js
- js/systems/food-resources.js
- tests/feeding.test.mjs
- tests/feeding.browser.test.cjs
- STAGE3_REPORT.md

기존 공통 update-loop, base.css/game.css, SVG 6개, 오디오 공간, 정적 호스팅 설정은 유지했습니다. 이전 STAGE2_REPORT.md는 이력으로 남겼습니다. 전달용 forest-ecosystem.zip을 갱신했습니다.

## 2. 새로 추가한 데이터 구조

종 정의에 behaviorType(static/wander/forager)을 추가했습니다. 메뚜기·개구리는 이모지 placeholder를 사용합니다. 종 정의와 런타임 상태는 분리합니다.

풀 인스턴스에는 foodStock, 메뚜기/개구리에는 direction, behaviorState, targetInstanceId, hunger, foodShortageDuration, lastSuccessfulFeedingAt만 추가했습니다. 필요 없는 age/health/reproduction/genetics 등은 없습니다. 기존 ID와 정규화 좌표는 유지하며 schemaVersion은 계약 변경에 맞춰 2로 올렸습니다. 실제 저장 기능은 없습니다.

## 3. foodRelations 구조

별도 데이터 배열로 sourceSpeciesId, targetSpeciesId, type을 정의합니다.

- grass → grasshopper
- grasshopper → frog

source는 먹히는 생물, target은 먹는 생물입니다. type은 food 하나만 사용합니다. 토끼나 버섯까지 관계를 임의로 확장하지 않았습니다.

## 4. 행동 상태 시스템 구조

feeding.js의 명시적 handler로 wander → searchFood → moveToFood → eat → wander를 처리합니다. 목표가 사라지거나 먹이량이 부족하면 안전하게 돌아다니며 재탐색합니다. 도망 행동은 핵심 흐름에 집중하기 위해 이번 단계에서 생략했습니다.

## 5. 먹이 탐색 방식

0.5초 tick마다 종별/ID별 개체 인덱스를 갱신합니다. 배고픈 개체가 탐색 상태에 들어갈 때만 먹이 관계에 있는 종의 후보를 검사하고, 거리 안의 가까운 먹이를 선택합니다. 탐색 실패 후 최소 2초 간격을 두고 재시도합니다. 매 표시 프레임에 모든 개체를 상호 검색하지 않습니다.

## 6. 메뚜기가 식물을 먹는 과정

배고픔 증가 → 풀 탐색 → 접근 → 1초 먹기 → foodStock 1 감소 → 배고픔 감소 → 다시 wander입니다. 풀은 삭제하지 않습니다. stock이 1 미만이면 먹이 후보에서 제외되고, 최대 3까지 초당 0.06씩 회복합니다. 회복은 별도 함수/설정에 있으며 햇빛·물·흙과 연결하지 않았습니다. 학생에게 stock 숫자는 표시하지 않습니다.

## 7. 개구리가 메뚜기를 먹는 과정

배고픈 개구리가 범위 안의 메뚜기를 찾아 접근합니다. 가까이에서 짧은 먹이 행동을 마친 뒤 거리와 대상 존재를 다시 확인하고, 해당 메뚜기 하나를 제거합니다. 개구리의 hunger를 낮추고 마지막 섭식 시점을 기록합니다. 결과는 짧은 문장으로 표시하며 잔혹한 연출은 없습니다.

## 8. state.organisms의 실제 변화

풀은 foodStock이 감소/회복합니다. 소비자는 position, direction, behaviorState, targetInstanceId, hunger, 부족 시간과 마지막 섭식 시점이 변합니다. 포식 성공 시 메뚜기 인스턴스를 배열에서 제거합니다. 같은 먹이를 중복 소비하지 않도록 인덱스에서도 즉시 제거하고, 다른 개체의 사라진 목표 참조를 정리합니다. 개체 자동 증가는 없습니다.

## 9. 행동 tick과 화면 animation 분리

기존 공통 requestAnimationFrame 루프를 유지하고 표시 갱신은 최대 30회/초로 제한합니다. feeding.update 안에 시간을 누적해 행동 판단/먹이량 회복은 0.5초마다 실행합니다. 그 사이에는 현재 목표를 향한 이동만 계산합니다. main.js가 시스템 결과를 표시 계층에 전달합니다.

## 10. 성능 고려

개체별 타이머/루프가 없습니다. 종별 후보 검색, ID 조회, 기존 DOM 재사용, transform 기반 이동을 적용했습니다. 먹힌 개체만 제거하고, 먹는 중/먹이 부족 표시도 상태가 바뀔 때만 수정합니다. 문서 숨김 시 이동과 먹이 판단을 함께 중단하고, 복귀할 때 숨겨진 시간만큼 몰아서 처리하지 않습니다. 무거운 필터·blur·파티클은 없습니다.

## 11. 20~30개 개체 테스트 결과

실제 브라우저에서 A~E를 카드 터치로 배치해 검사했습니다.

- A: 풀 3 + 메뚜기 2. 풀 섭식과 stock 감소 확인, 풀 삭제 없음.
- B: 풀 3 + 메뚜기 3 + 개구리 1. 메뚜기 제거와 개구리 hunger 감소 확인.
- C: 풀 0 + 메뚜기 2. 부족 시간 누적, 재탐색, 개체 유지.
- D: 메뚜기 0 + 개구리 2. 오류 없이 재탐색, 개체 유지.
- E: 풀 10 + 메뚜기 14 + 개구리 6, 총 30개. 기록한 실행에서 28 tick 동안 풀 섭식 14회, 포식 6회 발생, 최종 24개. 새 생물 DOM 추가 0회, 제거 6회, 생존 개체 DOM 동일, 이동 구간 화면 크기 측정 0회.

먹이 탐색은 E 기록에서 21회/후보 검사 235회였습니다. 랜덤 이동에 따라 횟수는 실행마다 달라질 수 있습니다. 순수 로직 14개 검사와 기존 기능 브라우저 회귀 검사도 통과했습니다. 상세 실행 결과와 한계는 QA.md에 정리했습니다.

Galaxy Tab S5e 실기기 FPS/발열/배터리 사용량은 아직 측정하지 않았습니다.

## 12. 의도적으로 구현하지 않은 기능

신규 이미지, 도망, 번식, 자연 개체 증가, 굶주림 사망, 노화/질병, 분해, 전체 먹이그물 UI, 안정도/점수 계산, 비생물 효과, 이벤트, 보전 활동, 오염, 퀴즈/퍼즐, 저장, 관리자/서버/인증/멀티플레이, 강/바다는 구현하지 않았습니다. 필요 없는 빈 모듈도 없습니다.

## 13. 다음 단계 비생물 요소 연결 지점

`js/systems/food-resources.js`의 **recoverFoodStock(instance, seconds)**가 정확한 연결 지점입니다. 호출부는 `js/systems/feeding.js`의 **tick**이며 기본값은 `data/ecology-config.js`의 **foodResourceConfig**에 있습니다.

다음 단계에서 검토한 햇빛·물·흙의 효과를 state.environment로부터 계산하고 이 회복 함수에 명시적으로 전달하면 됩니다. 화면 렌더러나 생물 정의에 환경 규칙을 하드코딩하지 않습니다. 현재는 연결하지 않았습니다.
