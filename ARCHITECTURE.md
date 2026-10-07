# 현재 설계 — 환경·안정도·관찰 이벤트

## 책임 분리

기존 data → state → ui 흐름과 main.js 연결을 유지합니다. update-loop는 공통 예약 하나를 유지하며 feeding의 0.5초 tick 안에서 생산자 성장·먹이 회복·섭식 판단을 수행합니다. 안정도도 이 tick에서 계산하고, 배치/환경 변경 시 즉시 한 번 계산합니다.

## 데이터

- 환경: environment.sunlight/water/air/soil.value. 내부 0~1, 학생 표시는 좋음/보통/나쁨. good=1, normal=0.6, bad=0.15.
- 생산자: growth 추가, 기본 1. 풀의 foodStock은 기존 값을 유지하되 실제 최대량은 growth에 비례.
- metrics.stability: 내부 0~100. stabilitySummary: score, label, hint, breakdown.
- schemaVersion=6. 저장 기능은 없으므로 데이터 이전은 구현하지 않음.
- 기존 메뚜기/개구리 hunger, behaviorState, targetInstanceId, 부족 시간 등 유지.

## 환경 영향

설정: data/environment-config.js. 계산: js/systems/environment.js.

종별 적합도는 네 환경 값의 가중 기하평균입니다. 풀은 햇빛/물 가중치가 각각 0.35, 상수리나무는 토양 가중치가 0.45입니다. 생산자의 growth는 적합도(최저 0.15)를 향해 초당 최대 0.025 감소하거나 0.015 증가합니다. 순간적으로 생물을 삭제하지 않습니다.

js/systems/food-resources.js의 recoverFoodStock에서:

- 최대 먹이량 = 기본 최대량 × 현재 growth.
- 회복량 = 기본 초당 회복량 × growth × 환경 적합도 × 시간.
- 실제 foodStock은 현재 최대 먹이량을 넘지 않음.

공기가 나쁘면 동물 활동 배율도 감소합니다. 배율=0.4+0.6×공기 상태이며 wander 이동과 먹이 접근에 똑같이 적용합니다. 먹이 관계 자체, 배고픔 증가율, 종 정의는 변경하지 않습니다.

온도 같은 새 요소는 environmentFactors와 필요한 종별 weights/효과를 함께 추가할 수 있습니다. 아직 사용하지 않는 온도 상태나 빈 시스템은 만들지 않았습니다.

## 안정도

설정: data/stability-config.js. 순수 평가 함수: js/systems/stability.js의 evaluateStability. 기록 관리: createStabilitySystem.

기본 가중치:

| 항목 | 비중 | 기준 |
|---|---:|---|
| 다양성 | 20% | 서로 다른 종 수, 현재 목표 4종에서 상한 |
| 역할 구성 | 20% | 생산자/소비자/분해자 역할 존재와 소비자 비율 |
| 먹이 관계 | 25% | 현재 소비자의 먹이 공급량과 배고픔. 구현된 두 관계만 평가 |
| 환경 | 20% | 네 비생물 요소 상태의 평균 |
| 편중/감소 | 15% | 한 종의 점유율과 최근 종별 감소 |

종 점유율 65% 초과부터 편중을 감점합니다. 5초마다 종별 개체 수를 기록하고 최대 약 30초의 최근 감소를 비교합니다. 개체가 하나도 없으면 환경이 좋아도 안정도는 0입니다. 사라진 개체의 영향은 최근 기록에서만 유지됩니다. 모든 항목은 0~1로 제한하고 가중합을 0~100으로 변환합니다.

분해자의 실제 분해 기능은 아직 없으므로 역할 구성에서 존재만 평가합니다. 토끼의 먹이 행동도 아직 없어서 먹이 점수는 메뚜기/개구리 관계만 평가합니다. 이는 실제 생태계 평가 지표가 아니라 조정 가능한 학습용 모델입니다. 점수를 맞추는 것이 실제 생태계의 정답이라는 뜻이 아닙니다.

학생 표시: 75 이상 ‘안정적이에요’, 45 이상 ‘살펴봐요’, 그 아래 ‘돌봄이 필요해요’. 숫자 대신 게이지를 표시하고 가장 약한 항목에 맞는 짧은 설명을 환경 창에서 보여줍니다.

## 화면/성능

환경 패널은 js/ui/environment-panel.js의 네 가지 선택 항목을 사용합니다. native dialog라 숲 조작과 겹치지 않으며 닫기/Escape로 복귀합니다. 기존 숲 우측 안내, 카드, 이미지 자산은 유지합니다.

계산은 기존 저빈도 tick을 사용하고 별도 타이머를 만들지 않습니다. 성장량 표시만 기존 이미지 transform에 적용하며 실제 생물 DOM을 재생성하지 않습니다. 상태판 문구도 달라질 때만 갱신합니다. 탭 숨김/움직임 줄이기 중단 정책은 유지합니다.

## 5단계 이벤트와 관찰

설정/문구는 data/event-config.js, 상태 판단/종료/중복 방지는 js/systems/events.js, 표시는 js/ui/event-view.js와 css/events.css가 담당합니다. main.js는 기존 섭식 결과를 이벤트 시스템으로 전달하고 상태 변경 뒤 UI를 갱신합니다.

state.events에는 eventId, key, kind, sourceType, sourceId, status, title, message, explanation, createdAt, payload를 보관합니다. kind는 alert/question/insight, status는 active/resolved/dismissed입니다. 시간은 활성 시뮬레이션 경과 초입니다. observations에는 학생이 직접 확인한 relationId/eventId/discoveredAt을 보관합니다. 저장소·서버 연동은 없습니다.

이벤트 평가는 기존 0.5초 생태 tick에서 1초마다 실행합니다. 배치·환경 변경·확인에는 즉시 재평가합니다. 먹이 부족 8초, 성장 적합도 0.8 미만 3초가 기본 조건입니다. 실제 섭식 신호에만 발견 후보를 만들고, 학생 확인 후 기록합니다. 같은 조건의 활성 이벤트는 하나이며 종료 후 30초 재알림 대기를 둡니다. 활성 36개/이력 60개/화면 4개 상한을 분리했습니다.

UI는 기존 개체 anchor에 버튼을 붙여 이동을 따릅니다. 환경은 해당 배지에, 대상이 사라진 발견은 숲 제목에 표시합니다. 기존 생물 DOM을 재생성하지 않고 캐시된 배치 좌표로 표시 겹침을 줄입니다. 기존 requestAnimationFrame 하나와 숨김/움직임 줄이기 중단 정책을 유지합니다.

nextInstanceSequence는 포식 뒤 instanceId 재사용을 방지합니다. 관리 행동은 별도 시스템에서 상태를 바꾼 뒤 eventSystem.refresh로 해결 여부를 평가하도록 연결합니다. acknowledge 자체는 환경이나 먹이를 개선하지 않습니다. 안정도 공식은 4단계 그대로입니다.

## 6단계 포인트와 관리 책임 흐름

이벤트 → 관리 행동 선택 → management action 검증 → state change → ecology systems 반영 → event refresh → 실제 resolved 판정 → 최초 해결 보상.

- data/management-actions.js: 4개 행동의 비용/적용 대상/효과/지속/cooldown 및 rewardConfig.
- js/systems/management.js: 검증, 원자적 실행, 효과/대기 시간 관리. event.status를 변경하지 않음.
- js/systems/rewards.js: 의미 ID 중복 검사 후 metrics.points 지급. UI가 재화를 변경하지 않음.
- js/systems/events.js: 기존 실제 조건 판단 유지. 성공한 acknowledge 이후 발견/조사 보상, 실제 resolved 후 환경 해결 보상.
- main.js: 실행 성공 → eventSystem.refresh → 기존 stabilitySystem.update → 필요한 화면 갱신. 환경 계산은 순수 함수여서 바뀐 값이 즉시 반영되며, 실제 성장/먹이량은 이후 feeding tick이 반영.

새 state 필드: simulationTime(활성 초), rewardHistory(rewardId/grantedAt/sourceId/amount), managementHistory(actionId/sourceEventId/sourceId/executedAt/cost/result 및 환경 factor/valueAfter), managementCooldowns(키→만료 초), managementEffects(actionId/startedAt/expiresAt/multiplier). 관리 기록은 최근 100개로 제한하며 중복 보상 이력과 대기 시간은 별도로 유지합니다. 저장·관리자 기능은 없습니다.

기존 0.5초 feeding tick에서 simulationTime을 늘리고 효과를 만료시킵니다. 이벤트의 기존 1초 평가 간격은 유지합니다. 새로운 타이머가 없고 hidden/reduced-motion에서는 모든 활성 시간이 정지합니다. 효과나 대기 시간이 남아 있으면 기존 루프를 유지합니다.

임시 지원은 hunger 0.65 완화와 shortage 초기화 한 번으로 끝나며 실제 먹이 개체나 섭식 신호를 만들지 않습니다. 서식지 회복은 기존 updateProducerGrowth/recoverFoodStock의 선택적 회복 배율 인자로 연결합니다. 회복 속도만 조절하며 감소 속도·목표 적합도·먹이 최대량은 바꾸지 않습니다.

보상: 관계별 최초 기록 12, 요소별 최초 조사 정답 10, 물/토양 관리 해결 최초 3. 안정도 유지 보상은 이번 단계에서 제외했습니다. 실제 해결 보상은 관련 alert가 resolved이고, 행동이 적용한 환경 값이 유지되며, 살아 있는 생산자의 환경 적합도 조건이 해소된 경우만 인정합니다. 무료 환경 비교 변경/대상 제거/단기 먹이 지원에는 해결 보상을 주지 않습니다.

상황별 관리 옵션은 availableManagement가 제공합니다. UI는 관리 호출과 짧은 결과 표시만 합니다. 선택창은 재진입 시 실제 환경 값으로 동기화합니다. 포인트 부족 안내는 사용 가능한 학습 경로도 알려줍니다. 기존 환경 비교 선택은 이전 단계 기능으로 유지합니다.

6단계에서 마련한 grantReward와 inventory/renderCards 연결 지점을 아래 7단계 학습·해금 시스템이 사용합니다.

## 7단계 학습 활동과 카드 해금

실제 game observation/environment → activity condition → activity completion → unlock system → inventory acquired → existing placement → 새로운 먹이 상호작용/관찰.

- data/activities.js: quiz/classify/observation/habitat 각 1개. activityId/type/title/prompt/choices/correctAnswer/requirements/hint/learningOutcome/unlockSpeciesId/pointReward/unlockHint. 필요한 유형만 해당 필드를 사용합니다.
- js/systems/activity-rules.js: 실제 observations, 생물 역할/종, 네 환경, 기존 안정도를 읽는 순수 조건 함수. UI가 관찰 기록을 만들어 넣지 않습니다.
- js/systems/activities.js: 유효 답안·대상·조건 확인 후 진행을 완료하고 해금/보상을 호출합니다. 오답에는 시도 횟수만 남기며 다시 선택할 수 있습니다.
- js/systems/unlocks.js: 종/인벤토리/활동 대상 일치, 완료 여부, 실제 근거를 검증한 뒤 acquired 변경. 재해금은 추가 변경/보상이 없습니다.
- js/systems/rewards.js: 기존 observation/question/management를 유지하면서 activity:<activityId> 보상을 확장합니다. 활동 데이터의 pointReward를 사용하고 완료 기록과 rewardHistory로 최초만 지급합니다.
- js/ui/activity-view.js: 잠긴 카드 또는 작은 배움 버튼에서 여는 활동 창. 시스템 호출/안내만 담당합니다. main.js는 해금 성공 시 기존 renderCards 및 선택 표시를 갱신합니다.

inventory는 모든 6종의 speciesId/acquired를 유지합니다. forest.initialInventory는 처음 획득한 oak/grass/grasshopper만 정의합니다. frog/rabbit/mushroom은 잠금으로 보이며 클릭 시 선택을 해제하고 조건 안내를 엽니다. placement의 acquired 검증은 변경하지 않았습니다.

state.activities는 activityId/completed/attempts/completedAt과 정답 완료 시 lastAnswer(선택지 ID)만 저장합니다. 전체 답변 이력이나 개인정보는 없습니다. completedAt은 simulationTime과 같은 활성 시뮬레이션 초입니다. 틀린 답을 제출해도 기존 완료 상태를 되돌리지 않습니다. 다시 풀 수 있지만 보상은 최초 한 번입니다.

토끼 조건: 서로 다른 생산자 2종 이상, 풀 존재, 네 환경 값 각각 0.4 이상, 기존 stability 점수 60 이상. 오래된 화면 점수만으로 해금하지 않도록 현재 상태의 evaluateStability도 확인합니다. main.js는 완료 요청 직전에 기존 stabilitySystem.update를 호출합니다. 학생에게는 숫자 대신 체크 문장을 보여줍니다. 조건 만족은 해금 가능 상태이며 학생이 확인해야 완료됩니다. 해금 후 환경이 나빠져도 카드를 다시 잠그지 않습니다.

별도 timer/RAF가 없고 활동 창이 열려 있을 때만 기존 ecology tick에서 조건 문구를 갱신합니다. 생물 DOM은 손대지 않습니다. habitat은 자동 배치가 없으며, 분해·토끼 먹이 AI·새 먹이 관계를 추가하지 않습니다.

다음 단계 연결: 안정도는 기존 stabilitySystem.update와 metrics.stabilitySummary, 숲 목표는 observations/activities/managementHistory와 실제 생태 상태를 읽는 별도 조건으로 구성할 수 있습니다. 저장은 schemaVersion=6의 domain state를 검증하여 복원하는 경계가 필요합니다. 현재 이벤트 시스템의 내부 clock/cooldown, feeding 내부 상태 등은 직렬화되지 않으므로 단순 JSON 저장만으로 완전 복원이 되는 구조는 아닙니다. 저장·클리어 시스템은 이번에 구현하지 않았습니다.
