# 현재 설계 — 1~9단계

## 핵심 책임

정적 HTML/CSS/ES 모듈 구조입니다. data는 규칙과 콘텐츠, state는 도메인 상태, systems는 게임 계산/검증, ui는 표시/입력, main.js는 연결을 담당합니다. assets의 기존 SVG/이모지 placeholder를 유지합니다.

공통 update-loop 하나가 최대 30fps로 이동을 갱신합니다. feeding/ecology는 0.5초, event 평가는 1초 간격입니다. hidden 및 prefers-reduced-motion 중에는 기존 정책대로 시뮬레이션을 멈춥니다. 복귀할 때 시간 차를 누적 처리하지 않습니다.

placement는 inventory.acquired/정규화 좌표/영역/나무 겹침/30개 제한을 검증합니다. organism-layer는 개체별 DOM을 만들고 이동 transform/상태만 갱신합니다. wander, 먹이 탐색/섭식과 삭제, 환경/생산자 회복은 기존 시스템을 유지합니다. 풀 → 메뚜기 → 개구리만 실제 먹이 관계입니다. 버섯의 실제 분해와 토끼 먹이 AI는 없습니다.

## 환경·안정도·이벤트·학습

environment-config와 environment.js는 네 환경의 종별 가중 적합도, 성장 회복/감소, 공기 활동 배율을 유지합니다. food-resources는 growth에 비례한 먹이 한도/회복을 계산합니다.

stability-config/stability.js는 기존 다양성 20%, 역할 구성 20%, 먹이 25%, 환경 20%, 편중/최근 감소 15% 공식을 그대로 유지합니다. 이번 단계에서 공식이나 가중치를 변경하지 않았습니다. role에서 버섯의 존재를 계산하는 기존 지표와 실제 분해 시뮬레이션은 구별합니다.

events는 실제 조건과 섭식 신호에서 !/?/💡를 만들고 key/cooldown/상한으로 중복을 제한합니다. 화면 표시는 최대 4개입니다. 기록 전 발견 후보와 학생이 확인한 observations는 다릅니다. rewards는 의미 ID당 한 번만 지급합니다.

관리 흐름: event payload → management 검증 → state 변경 → 기존 ecology 반영 → event refresh → 실제 해결 보상. 물/토양 한 단계, 소비자 단기 배고픔 완화, 한시적 생산자 회복 배율을 유지합니다. 관리 내역은 최근 100개, 누적 managementActionCount는 별도로 유지합니다.

학습 흐름: 실제 observation/environment → activity condition → activity completion → unlock → inventory acquired → 기존 placement → 새 관찰. quiz/classify/observation/habitat 각 하나이며 UI가 관찰/포인트/해금을 직접 쓰지 않습니다. 스타터는 oak/grass/grasshopper입니다.

## 8단계 목표와 진행

`game state → forest goal evaluation → stable-duration progress → clear record`

설정: data/forest-goal.js. 계산: systems/forest-progress.js. 기존 stability≥70, 네 환경 값≥0.4, 두 핵심 observation, producer_quiz/decomposer_classify/grass_observation 완료, 현재 grass/grasshopper/frog 존재가 필수입니다. 버섯 개체/카드 수/포인트는 클리어 필수가 아닙니다.

main.js는 기존 stability 갱신 뒤 목표를 평가합니다. 0.5초 생태 tick에서만 유지 시간을 더하고 사용자 상태 변경은 0초로 즉시 평가합니다. 모든 조건을 30초 연속 유지하면 forestProgress.cleared/clearedAt을 한 번 기록합니다. 실패 시 stableSeconds=0입니다. 이미 클리어하면 기록은 유지하되 실제 안정도/조건은 계속 갱신합니다. 클리어 보상 포인트는 없습니다.

metrics.bestStability는 최고값만 유지합니다. 진행률은 관찰20/핵심활동20/추가해금10/관리경험10/유지목표20/클리어20의 설정 가중치로 계산하며 최종 클리어는 100으로 확정합니다. 미완료 목표 유지가 깨지면 해당 진행분은 줄 수 있습니다. 학습/게임 진행률이며 성적이 아닙니다.

## 저장 계층과 명시적 형식

`game state → save service → localStorage adapter`

- services/save-format.js: 버전 7 스냅샷의 whitelist 생성과 검증/정리. 도메인 전체를 그대로 stringify하지 않습니다.
- services/save-service.js: 로드, 저장 요청 병합, flush, reset, 오류 상태. adapter를 주입받습니다.
- adapters/local-storage.js: 게임 저장의 localStorage 접근 지점. key는 eco-system:forest-save. 안내 선호는 별도 guide-preference adapter가 담당합니다.
- ui/forest-view.js: 목표/저장 문구/초기화 확인. 저장 데이터를 직접 쓰지 않습니다.

저장 외피는 schemaVersion=7, savedAt(ISO 실제 저장 시각), domain, eventMemory입니다. domain.schemaVersion도 7입니다. savedAt은 게임 계산에 사용하지 않습니다.

지속 데이터: ecosystemId/simulationTime/nextInstanceSequence, inventory, organisms의 ID/종/정규화 위치/성장/foodStock/hunger/부족 누적/최근 섭식 활성 시각, environment, points/bestStability, observations, activities, rewardHistory, 관리 이력/누적 횟수/cooldown/effect, forestProgress.

제외: selectedSpeciesId, 열린 dialog/포커스, 현재 stabilitySummary(재계산), targetInstanceId/behaviorState/direction, RAF/DOM/render/geometry 캐시, wander/feeding의 재탐색·섭식 중 타이머, stability 최근 표본 이력, active event 객체. 이벤트 자체 대신 아래 명시적 기억만 저장합니다.

## 검증과 런타임 복원

`saved domain state → validation → runtime reconstruction → event refresh → render`

JSON/크기 상한/버전/핵심 구조를 검사합니다. 알려진 종·관계·활동·보상·관리 ID만 사용합니다. 중복 instanceId와 잘못된 종/비유한 좌표 개체는 제거하며 유한 좌표는 0~1, 환경은 0~1, 배고픔은 0~1, 성장/먹이량은 기존 한도, 포인트는 음수 방지/상한으로 제한합니다. 배열·문자열/이력 크기도 제한합니다. 알 수 없는 보상 ID는 버립니다.

부분 손상은 정리하고, 유효한 활동 완료 기록이 있으면 누락된 카드 해금 표시도 복구합니다. 필수 구조/JSON이 크게 손상되면 초기 상태로 복구합니다. 버전 누락은 안전 초기 상태, 명시적인 과거/미래 버전은 초기 화면으로 실행하되 원본 저장을 덮어쓰지 않습니다. 이전 단계에는 저장 형식이 없으므로 임의 migration을 하지 않습니다. 이 경계에서 향후 명시적 migration을 추가할 수 있습니다.

생물은 createOrganismInstance로 재구성한 뒤 허용된 지속 필드만 복원합니다. 소비자는 wander/target=null/direction=1로 시작합니다. feeding clock과 event clock은 저장된 simulationTime에서 시작하지만 추적·재시도 캐시는 새로 만듭니다. 저장 당시 안정도 표본 이력은 재구성하므로 로드 직후 최근 감소 항목은 새 표본으로 계산됩니다. 최고 안정도는 보존합니다.

미완료 안정 유지 시간은 로드 때 0부터 다시 확인합니다. 이미 클리어된 기록과 시각은 유지합니다. 이는 새 런타임에서 연속 안정성을 확인하는 정책이며 오프라인 시간 보상이 아닙니다.

관리 cooldown/효과는 simulationTime 기반 만료 시각을 검증하고 최대 남은 시간 이내로 복원합니다. 브라우저를 닫아 둔 시간은 더하지 않습니다. 저장 전 미해결 환경 관리의 보상 판정은 interrupted로 마감하여 새 이벤트 ID를 과거 행동에 잘못 연결하지 않습니다. 실제 환경 개선은 보존하며, 이미 받은 보상과 단기 지원/서식지 적용 이력도 유지합니다.

이벤트 복원: active alert/question 객체를 저장하지 않고 refresh로 다시 판단합니다. 환경 성장 저하는 기존 3초 관찰 대기 뒤 나타납니다. eventMemory에는 검증한 sequence, 재알림 cooldown, 같은 상황 조사 완료 기억, 기록 전 실제 섭식 발견 후보만 둡니다. 학생 observations와 rewardHistory는 별도로 보존합니다. 사라진 발견 대상은 숲 제목에 표시합니다. 종료 이벤트 목록은 새 세션에 재구성하지 않습니다.

## 저장 빈도와 초기화

의미 있는 배치·학습·발견 확인·관리·환경 변경·섭식/제거·클리어에 저장을 예약합니다. 요청은 1.2초 한 타이머로 합칩니다. 계속 입력해도 저장이 무기한 밀리지 않도록 첫 요청부터 최대 지연을 제한합니다. 추가로 활성 시간 15초마다 위치/배고픔/유지시간 체크포인트를 예약합니다. 매 frame/tick에는 JSON 변환이나 storage write가 없습니다.

pagehide와 hidden 전환에서 동기 최종 flush를 시도합니다. 저장 공간/권한 오류는 안내만 하고 게임을 계속합니다. 브라우저 강제 종료가 최종 이벤트를 보내지 않으면 마지막 완료 저장까지 복구합니다.

초기화: 확인 → adapter.remove 성공 → 예약 저장 취소 → 공통 loop 정지 → 같은 gameState 객체를 새 기본값으로 교체 → feeding/event/wander/stability 인스턴스 재생성 → DOM/선택/창/피드백 캐시 정리 → 초기 생물 렌더 → 기존 loop 재개. 페이지 새로고침에 의존하지 않습니다. 삭제 실패는 기존 숲을 유지합니다. 버튼/브라우저 이벤트 리스너는 다시 등록하지 않아 중복 입력을 방지합니다.

## 관리자/원격 경계

`game state → progress summary → future remote/admin boundary`

services/progress-summary.js의 createProgressSummary(state,lastUpdated)는 상태를 변경하지 않는 순수 함수입니다. theme/progress/cleared/카드·활동·관찰 수/누적 관리 횟수/currentStability/bestStability/lastUpdated/schemaVersion을 반환하며 studentId=null입니다. lastUpdated에는 saveService.getSavedAt()을 전달할 수 있습니다. 학생 이름/번호를 만들지 않고 전송하지 않습니다.

저장 서비스의 read/write/remove adapter와 진행 요약은 별도 책임입니다. 미래 remote adapter 또는 관리자 연동은 이 경계를 사용하되 지금 빈 원격 모듈은 없습니다. 다음 테마·분해·번식·오염·새 먹이그물은 이번 범위 밖입니다.

## 9단계 안내와 목표 표시

`game state → 기존 forest goal evaluation → 목표 UI`

systems/goal-guidance.js의 goalPresentation은 기존 evaluateForestGoal의 다섯 check와 forestProgress의 실제 연속 유지/클리어를 여섯 학생 목표로 표현합니다. forest-goal 설정에서 관찰·활동·종·환경 기준·70점·30초를 읽고 부족한 실제 이름과 수를 계산합니다. 목표 UI용 새 도메인 기록은 없습니다. 이미 클리어한 뒤 현재 조건이 악화하면 현재 조건은 미달성으로 표시하면서 달성 이력은 보존합니다.

nextAction은 현재 카드/개체, 실제 발견 후보·관찰, 완료 활동, 환경, 포인트, 실제 먹이 부족, 기존 안정도 hint를 읽는 순수 함수입니다. 최초 보상을 받을 수 있는 질문과 미완료 활동을 안내하고 잠긴 개구리의 선행 관찰을 설명합니다. 한 번에 한 문장만 표시합니다. stability 공식·goal 판정·활동 조건을 별도로 복제하지 않습니다.

ui/forest-view.js는 여섯 행의 DOM을 한 번 만들고 바뀐 문구와 체크만 갱신합니다. 기본 화면에는 한 줄 목표 수와 상세 버튼을 두고 기존 사이드 영역에 다음 행동을 표시합니다. 별도 갱신 loop를 추가하지 않고 기존 dashboard refresh 경로를 사용합니다.

ui/help-view.js는 새 게임 목적/조작 안내와 재열기를 담당합니다. main.js가 restored.status==='new'일 때만 최초 자동 표시를 요청합니다. 닫기·Escape·건너뛰기도 확인으로 처리합니다. adapters/guide-preference.js는 선택적인 UI key eco-system:forest-guide-seen만 읽고 쓰며 오류가 게임 실행을 중단시키지 않습니다. schemaVersion 7 도메인 저장과 독립적입니다.

## 9단계 환경 관찰과 유료 회복

`환경 변화 또는 관리 행동 → environment system → 생태계 상태 → 이벤트/안정도`

학생 UI는 environment 조회 가능 / 무료 직접 변경 불가입니다. ui/environment-panel.js는 qualityLabel로 네 상태와 실제 효과를 보여줍니다. main.js의 기존 무료 조절 callback을 제거했으며 UI에서 setEnvironmentLevel 또는 environment 필드 쓰기를 하지 않습니다. 환경은 기존 가중 생산자 적합도·먹이 회복·공기 활동 배율에 계속 연결됩니다.

물/토양/먹이 지원/서식지 회복 네 관리 행동은 기존 event payload → management 검증 흐름을 유지합니다. 이전 저장의 나쁜 햇빛·공기를 복원할 길이 없던 문제는 사용자 승인에 따라 기존 habitat-care만 최소 보완했습니다. 데이터 effect.recoveryFactors와 minimumRecoveryValue로 대상과 기준을 분리했습니다. 나쁜 요소 하나를 normal로 올리며 8포인트·공유 cooldown 75초·생산자 회복 배율 1.35/60초는 기존 값을 유지합니다.

햇빛/공기는 기존 실제 alert에서 회복할 수도 있고 읽기 전용 환경 패널에서 명시적인 유료 회복을 요청할 수도 있습니다. 후자는 `{sourceType:'environment',sourceId:factor}`를 management에 전달하고 검증된 요청 맥락만 내부 구성합니다. 신규 이벤트를 state에 삽입하지 않습니다. action/허용 요소/실제 나쁜 값/존재/비용/대기를 먼저 검증한 후 environment API로 상태를 바꿉니다. event.status를 강제로 해결하지 않습니다. 기존 물/토양 실제 해결 보상은 유지하되 햇빛/공기에 새 해결 보상을 만들지 않습니다.

save-format은 관리 기록의 factor를 기존 네 알려진 환경 key로 검증하도록 확장했습니다. 기존 optional factor/valueAfter 필드를 재사용하고 schema/key를 유지합니다. 로드할 때 나쁜 요소를 몰래 개선하지 않습니다. 저장 당시 진행/카드/활동/보상/클리어를 유지합니다.

## 개발 테스트 경계와 후속 연결

`별도의 개발 경계 → environment 변경 가능`

js/dev/environment-tools.js는 기존 네 환경 비교 선택창을 environment API와 연결하는 명시적 설치 함수입니다. production main.js가 import하지 않고 전역 객체/URL 매개변수/학생 토글도 없습니다. tests/fixtures.cjs가 테스트용 main 응답에만 해당 import와 설치를 삽입하고 기존 event/stability/goal/render/save 갱신을 호출합니다. 예전 비교 검사는 이 경계를 사용하며 새 학생 경로 검사는 일반 앱을 사용합니다. 이는 정적 클라이언트의 인증 체계가 아니라 제공되는 학생 조작 경계입니다.

10단계 23종 확장은 data/organisms.js, forest의 카드 초기 목록, ecology/environment 설정, activities/event 관계 정의에서 시작합니다. 인스턴스/placement/layer/카드/해금/저장은 현재 알려진 종 데이터와 시스템 경계를 활용합니다. 새 먹이 관계가 생기면 실제 ecology와 discovery 정의, 표시 이름, forest-goal 조건을 함께 검토해야 합니다. 모든 종이 현재 소비자 AI를 자동으로 갖는다고 가정하지 않습니다. 저장 종 검증과 진행 요약도 함께 검사합니다.

12단계 환경 변화는 기존 environment API를 통해 연결하고 15단계 유지시간은 forest-goal 설정에서 조정할 수 있습니다. 이번에는 날씨·위기·분해·번식·종 확대·관리자 UI/원격 서비스를 구현하지 않습니다. 최초 보상이 전부 소진된 저포인트 저장은 여전히 유료 관리가 막힐 수 있으므로 후속 경제 설계에서 별도 제한 회복 보상 등을 검토해야 합니다.
