# 6단계 구현 완료 보고서

작성일: 2026-10-07. 기존 1~5단계 책임 분리를 유지하고 관리 행동과 생태계 포인트를 연결했습니다. 비용·보상·지속 시간은 학습용 초기 설정이며 조정 가능합니다.

## 1. 수정/추가 파일

추가: data/management-actions.js, js/systems/management.js, js/systems/rewards.js, tests/management.test.mjs, tests/management.browser.test.cjs, STAGE6_REPORT.md.

수정: index.html, css/events.css, js/main.js, js/state/game-state.js, js/systems/events.js, js/systems/feeding.js, js/systems/environment.js, js/systems/food-resources.js, js/ui/event-view.js, js/ui/environment-panel.js, js/ui/render.js, README.md, ARCHITECTURE.md, QA.md.

기존 SVG 6개를 그대로 유지합니다. ZIP에는 현재 1~6단계 전체가 들어갑니다.

## 2. ecosystem points 구조

기존 metrics.points를 사용하며 처음에는 0입니다. 화면 명칭은 생태계 포인트입니다. UI는 지급/차감하지 않습니다. rewards.js가 지급, management.js가 검증 후 차감합니다. state는 schemaVersion=5로 확장했습니다.

## 3. 포인트 지급 규칙

- 실제 먹이 관계의 💡에서 발견 기록하기: 관계별 최초 12포인트.
- ? 조사 정답: 환경 요소별 최초 10포인트. 열기/오답에는 지급하지 않습니다.
- 물/토양 관리 행동으로 실제 환경 문제 해소: 요소별 최초 3포인트.
- 안정도 유지 자동 보상은 이번 단계에서 채택하지 않았습니다. 기다리기만으로 포인트를 벌거나 매 tick 지급하지 않습니다.

처음에는 무료 카드 배치로 먹이 관계를 발견하거나 환경 비교 후 ? 조사에 답해 관리 비용을 마련할 수 있습니다. 기존 환경 조건 비교 조작은 유지했으며 그 조작 자체에는 보상하지 않습니다.

## 4. 중복 보상 방지

rewardHistory에 rewardId/grantedAt/sourceId/amount를 기록합니다. 예: observation:grass_to_grasshopper, question:producer_water_limit, management:water_shortage_resolved. 같은 의미의 보상은 이벤트 ID가 바뀌어도 한 번만 지급합니다. UI 비활성화에 의존하지 않습니다. 환경의 무료 변경이나 생산자 제거로 이벤트가 없어지는 경우를 관리 해결 보상으로 인정하지 않습니다.

## 5. management action 데이터 구조

data/management-actions.js에 actionId/name/description/cost/applicableTo/effectType/effect/duration/cooldown을 정의합니다. 실행 조건은 effectType과 현재 source를 검증하는 management.js에 둡니다. 문구·비용·효과 설정은 이벤트 UI에 하드코딩하지 않습니다.

## 6. action 검증 시스템

validateManagement가 ID, 활성 alert, payload와 행동의 관련성, 대상 존재, 현재 부족/성장 저하, 이미 좋은 상태, cooldown, 잔액을 먼저 확인합니다. 실패는 state를 변경하지 않습니다. 성공한 뒤에만 효과·차감·cooldown·기록을 한 번에 적용합니다. 재입력도 같은 검증을 거칩니다.

## 7. 구현한 관리 행동 4종

| 행동 | 비용 | 효과 | 재사용 대기 |
|---|---:|---|---:|
| 물 환경 개선 | 6 | water 나쁨→보통→좋음 중 한 단계 | 8초 |
| 토양 돌보기 | 6 | soil 한 단계 | 8초 |
| 임시 먹이 지원 | 5 | 해당 소비자 hunger 0.65 완화, 부족 누적 초기화 | 개체별 45초 |
| 서식지 회복 | 8 | 60초 동안 생산자 성장 회복/먹이 회복 배율 1.35 | 숲 전체 75초 |

모든 시간은 활성 시뮬레이션 시간입니다. good 환경에는 개선을 적용하지 않습니다. 관련 alert가 있어야 사용할 수 있으며, 조건이 보통에서 이미 해소되면 그 이벤트로 추가 개선하지 않습니다.

## 8. 임시 먹이 지원 구현 방식

한 번의 배고픔 완화 방식으로 구현했습니다. 지속적인 자동 급식이나 먹이 생물 생성이 아닙니다. 기존 feeding 시스템의 배고픔 증가와 먹이 탐색은 계속되므로 원래 먹이가 없으면 부족 이벤트가 재발합니다. 인위적 지원은 실제 먹이 관계 발견으로 기록하지 않고 해결 보상도 주지 않습니다.

## 9. 장기 서식지 개선 구현 방식

managementEffects의 expiresAt과 multiplier를 기존 0.5초 ecology tick이 사용합니다. 기존 updateProducerGrowth와 recoverFoodStock에 선택적인 회복 배율을 전달합니다. 회복 목표/최대 먹이량/나쁜 환경의 감소 속도는 그대로입니다. 동물 hunger와 현재 foodStock을 즉시 변경하지 않습니다. 효과가 겹쳐 쌓이지 않으며 60초 후 종료합니다. 물/토양 조건 자체가 계속 나쁘면 alert가 남을 수 있습니다. 환경 창에 서식지 회복 중임을 표시합니다.

## 10. event payload와 action 연결 방식

물 factor alert에는 물 환경 개선·서식지 회복, 토양에는 토양 돌보기·서식지 회복을 제공합니다. 소비자 speciesId/sourceId alert에는 임시 먹이 지원을 제공합니다. ?와 💡에는 관리 행동이 없습니다. 비용·설명·사용할 수 없는 이유와 현재 포인트를 보여주고, 살펴본 뒤 행동을 고르게 합니다.

## 11. eventSystem.refresh를 통한 실제 해결 판정

이벤트 → 관리 행동 선택 → management 검증 → state 변경 → 기존 ecology 시스템의 변경된 환경/효과 사용 → eventSystem.refresh로 조건 재평가 흐름입니다. 환경 적합도는 순수 함수라 상태 변경 즉시 새 값으로 계산되며, 실제 성장/먹이 회복량은 다음 ecology tick부터 변합니다. management는 event.status를 쓰지 않습니다. refresh가 resolved를 판정한 뒤 조건을 충족한 해결 보상만 지급합니다.

## 12. cooldown 처리

state.managementCooldowns에 행동/대상별 만료 시간을 저장합니다. 기존 ecology tick의 advanceManagement가 시간과 만료를 처리합니다. 새 timer/setInterval/RAF가 없습니다. 숨김 및 움직임 줄이기 중에는 시간도 멈추며 복귀 때 몰아서 처리하지 않습니다. 화면에는 초 단위 카운트 대신 조금 뒤 다시 사용할 수 있다는 안내를 제공합니다.

## 13. management action 기록

managementHistory: actionId/sourceEventId/sourceId/executedAt/cost/result. 환경 변경은 factor/valueAfter도 기록해 해결 보상의 근거로 사용합니다. result는 applied/resolved/changed-elsewhere입니다. 최근 100개 기록을 유지하며, 보상 이력과 cooldown은 독립적이므로 기록 잘림으로 중복 보상이 되지 않습니다. executedAt/grantedAt은 활성 시뮬레이션 초이며 실제 저장 시각이 아닙니다. 메모리 전용입니다.

## 14. 기존 안정도와의 연결

기존 4단계 공식과 가중치를 유지했습니다. 성공한 관리 행동 뒤 기존 stabilitySystem.update를 호출하고, 이후 생태 tick에서도 기존 방식으로 계산합니다. 관리 행동 자체에 안정도 점수를 직접 더하지 않습니다. 기존 공기 영향도 유지하며 공기 개선 행동은 추가하지 않았습니다.

## 15. TEST A~I 결과

모두 통과했습니다. 물 개선/실제 해결, good 거절, 포인트 부족 시 무변경, 임시 지원/반복 차단/먹이 부족 재발, 서식지의 지연 회복, 발견 최초 보상, 조사 최초 보상, 해결 최초 보상, 30개체 동작을 검사했습니다. 순수 로직 37개와 브라우저 검사 결과 및 자동화 범위는 QA.md에 기록합니다. 재발·효과 만료·대조군 비교는 실제 로직을 빠르게 진행하는 테스트로 확인했습니다.

## 16. 20~30개 개체 성능 검사

실제 브라우저에서 30개 개구리와 active alert, 임시 지원을 함께 실행했습니다. 생물 DOM 참조 유지, 측정 구간 화면 크기 읽기 0회, setInterval 생성 0회, 표시 최대 4개를 확인했습니다. 기존 30개체 검사에서도 동시 RAF 예약 최대 1개입니다. 이는 구조적 성능 검사이며 Galaxy Tab S5e 실기기 FPS/발열 측정은 아닙니다.

## 17. 기존 기능 회귀 검사

기존 카드·터치 배치·동일 종 반복·정규화 위치·wander·두 먹이 관계·foodStock·환경·안정도·이벤트·이력·관찰 중복 방지·숨김/복귀·최대 30개 검사를 실행했습니다. 결과는 QA.md를 참고하세요. 환경 창 재진입 시 관리 행동으로 바뀐 환경 값도 선택창과 일치하도록 동기화했습니다.

## 18. 의도적으로 구현하지 않은 기능

신규 이미지, 별도 학습 게임/퀴즈, 카드 해금, 번식/자연 증가/사망/질병, 분해 확장, 오염/탄소, 안정도 재설계, 최종 클리어, 저장/서버/인증/관리자/멀티플레이/강/바다는 추가하지 않았습니다. GitHub Pages에 올릴 수 있는 정적 모듈 구조를 유지하며 실제 배포는 하지 않았습니다.

## 19. 다음 학습 활동/카드 해금 연결 지점

검증된 학습 완료 결과를 처리하는 별도 시스템에서 rewards.js의 grantReward에 새 보상 category와 고유 의미 ID를 연결할 수 있습니다. 지금은 observation/question/management만 허용합니다. 카드 해금은 gameState.inventory의 speciesId/acquired를 검증 후 변경하고 renderCards를 갱신하는 경계에 연결합니다. 현재 카드 6종 획득 상태와 배치 검증은 그대로 두었습니다. 이벤트 UI가 포인트나 inventory를 직접 바꾸지 않는 원칙을 유지해야 합니다.
