# 설계와 연결 지점 — 3단계

## 기존 책임 분리 유지

`data → state → ui`와 main.js의 연결 책임을 유지합니다. 실제 상태 변경은 systems에서 처리합니다. 기존 placement와 wander는 재사용하며, update-loop는 변경하지 않았습니다.

- 초기화: 정의 → createGameState → 공통 인스턴스 생성 → 카드/상태판/생물 레이어.
- 배치: 카드 선택 → 화면 좌표 정규화 → placement 검증 → 공통 인스턴스 생성 → DOM 하나 추가.
- 갱신: 공통 루프 → feeding.update → wander.update → 제거/이동/섭식 상태만 렌더링.
- feeding.update 내부: 0.5초 누적 때만 먹이량 회복·인덱스 재구축·행동 판단. 매 표시 갱신에서는 현재 목표를 향한 이동만 수행.

## 종 정의와 인스턴스

종 정의는 id, name, role, description, caption, image 또는 placeholder, behaviorType으로 구성합니다. behaviorType은 static/wander/forager입니다. 종 정의에 현재 배고픔이나 목표를 넣지 않습니다.

공통 개체: instanceId, speciesId, position{x,y}. 풀은 foodStock만 추가합니다. 메뚜기/개구리는 direction, behaviorState, targetInstanceId, hunger, foodShortageDuration, lastSuccessfulFeedingAt을 추가합니다. 토끼·상수리나무·버섯에는 불필요한 섭식 상태를 붙이지 않습니다.

`js/state/organism-instance.js`의 createOrganismInstance를 초기 배치와 학생 배치에서 함께 사용합니다. schemaVersion은 런타임 계약 변경을 표시하기 위해 2로 올렸으며 실제 저장/이전 기능은 없습니다. inventory는 여전히 배치 권한으로서 소모되지 않습니다. metrics와 environment는 초기값을 유지합니다.

## 먹이 방향과 정책

`data/food-relations.js`의 sourceSpeciesId가 먹히는 생물, targetSpeciesId가 먹는 생물입니다. type은 food 하나만 사용합니다.

- grass → grasshopper
- grasshopper → frog

feeding은 이 관계를 먹는 종별 먹이 목록으로 한 번 정리합니다. 각 0.5초 tick에서 현재 개체를 ID별·종별 인덱스로 묶고, 탐색 시 해당 먹이 종 목록만 검사합니다. 기본 탐색 범위는 메뚜기 0.34, 개구리 0.38(정규화 좌표 거리)입니다. 실제 미터나 과학적 측정값이 아닙니다.

## 행동 상태

명시적 handler 목록으로 wander/searchFood/moveToFood/eat를 분리합니다.

- wander: 기존 걷기/멈춤을 재사용. hunger가 기준 이상이고 재탐색 시간이 되면 searchFood.
- searchFood: 범위 안에서 아직 존재하고 먹을 수 있는 가까운 먹이 탐색. 성공하면 targetInstanceId를 지정, 실패하면 wander로 돌아가 2초 이후 재시도.
- moveToFood: 표시 갱신에서 목표 쪽으로 이동. 화면 영역 규칙을 계속 적용. 도착 시 eat, 목표가 사라지거나 추적 18초가 지나면 재탐색으로 복귀.
- eat: 1초간 짧은 행동. 완료 때 먹이 존재/거리/먹이량을 재검사. 살아 있는 먹이가 멀어지면 다시 접근.

도망은 선택 사항으로서 이번 단계에서 생략합니다. 빈 flee/idle handler를 만들지 않았습니다.

타이밍은 feeding 내부 Map으로 관리합니다. hunger/행동/목표/부족 시간/마지막 섭식 시점 등 관찰 가능한 런타임 값은 인스턴스에 둡니다. 모든 시간은 화면이 활성화된 동안의 시뮬레이션 시간입니다.

## 식물 먹이량과 포식

`data/ecology-config.js`의 foodResourceConfig: 풀 최대 3, 한 번 섭식에 1 소모, 초당 0.06 회복. 1 미만이면 새 목표에서 제외됩니다. 회복은 `js/systems/food-resources.js`의 recoverFoodStock에서 처리하고 최대값으로 제한합니다. 지금은 비생물 요소를 읽지 않습니다.

식물 섭식은 stock만 감소시키며 풀 인스턴스를 유지합니다. 동물 섭식은 state.organisms와 ID 인덱스에서 대상 하나를 동기적으로 제거합니다. 같은 tick에서 다른 개구리가 이미 제거된 메뚜기를 다시 먹을 수 없습니다. 제거된 목표를 참조하던 다른 개체도 같은 tick에서 목표를 해제합니다.

성공 시 hunger 감소, lastSuccessfulFeedingAt 기록, foodShortageDuration=0으로 초기화합니다. 탐색 실패 기간은 내부적으로 누적하되 사망/경고 UI와 연결하지 않습니다. 번식이나 자연적인 개체 증가는 없습니다.

## 표시와 성능

기존 공통 requestAnimationFrame 예약 하나, 표시 갱신 최대 30회/초를 유지합니다. 생태 판단은 0.5초마다 진행하고, 프레임마다 전체 먹이 후보를 검색하지 않습니다. 움직이는 개체는 대상 ID 조회와 단순 거리 계산만 수행합니다.

feeding.update 결과는 moved, updated, removedIds, feedingEvents, ticked입니다. main.js가 wander 결과와 합쳐 UI에 전달합니다. 레이어는 instanceId별 DOM을 재사용하고 제거된 개체만 삭제합니다. 상태가 달라질 때만 먹는 중/먹이량 부족 클래스를 바꾸고, 디버그가 꺼져 있을 때 배고픔 같은 숫자를 DOM에 쓰지 않습니다. 같은 tick의 섭식 메시지는 관계별로 묶어 하나의 피드백으로 표시합니다.

문서 숨김 또는 움직임 줄이기에서는 루프 전체를 멈춥니다. 복귀 시 프레임 기준 시간을 초기화하고 최대 dt=0.1초로 제한해 대량의 추격/섭식이 한꺼번에 발생하지 않습니다. 음식량이 회복 중인 풀만 남은 경우에도 회복이 끝날 때까지 갱신할 수 있습니다.

## 2단계 화면 위치 규칙 유지

지면 x=0.08~0.69/y=0.68~0.78, 활동 영역 x=0.08~0.69/y=0.58~0.78입니다. 실제 서식 조건이 아닙니다. UI 영역/스프라이트 경계/큰 나무 간격/전체 30개 제한을 유지합니다. 크기 변경 시 앵커 좌표를 바꾸지 않습니다.

## 다음 단계: 비생물 요소의 정확한 연결 지점

1. `js/systems/food-resources.js`의 **recoverFoodStock(instance, seconds)**가 식물 먹이량 회복의 단일 연결 지점입니다.
2. `js/systems/feeding.js`의 **tick**에서 이 함수를 호출합니다. 다음 단계에서 검토된 환경 효과를 추가할 때, 이 호출에 state.environment로부터 계산한 성장 조정값을 명시적으로 전달합니다.
3. `data/ecology-config.js`의 **foodResourceConfig**가 기본 회복량/최대값의 설정 위치입니다. 환경 정책은 화면 코드에 하드코딩하지 않습니다.

현재는 인자나 빈 환경 모듈을 미리 추가하지 않았습니다. 환경 변화, 저장, 교사용 조회 등은 이후 승인된 단계에서 별도로 구현합니다.
