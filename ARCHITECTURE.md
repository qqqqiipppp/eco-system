# 현재 설계 — 1~11.55단계

## 11.55단계: 종의 의미와 과거 기록

기존 data → state → systems → ui 흐름과 main.js 연결을 유지한다. 새 모듈은 실제 필요한 세 가지 데이터와 한 가지 이전 서비스다.

- data/species-taxonomy.js: ecologyRevision2, 학명·이명·분류 종류·자료/불확실성, 변경13슬롯/수명변환7슬롯/식성변경5슬롯.
- data/food-evidence.js: 실제로 읽은 근거 URL과 정확한 적용 한계. A5관계는 두 종 자료, B17관계는 먹이군 단순화. data/food-relations.js에서 relationId/evidenceLevel/ecologyRevision을 선언하고 events·학습 표시가 같은 근거 수준을 사용한다.
- data/legacy-ecology.js: version7·8·9의 기존23슬롯 이름·27관계·수명·번식·보충 규칙을 보관한다. 현재 feeding과는 연결하지 않는다.
- js/services/ecology-migration.js: whitelist와 유한/크기 검사로 과거 관찰·미확인 후보·교체 전 생리/수명·번식/보충 대기·누적 변화를 보관한다. 현재 섭식/발견/학습 요건을 자동 생성하지 않는다.

모든 speciesId는 획득 카드 슬롯으로 유지한다. hazel이 팽나무, aphid가 청동풍뎅이, field-mouse가 고슴도치를 뜻하는 현재 정의와 과거 종을 혼동하지 않는다. 개체ID·수·위치·획득 권한·학습·포인트·보상·관리·클리어·최고 안정도·활성 시계를 유지한다.

새 관계는 v2_ 접두사다. 이전 관찰27개와 미확인 후보는 legacyEcology에만 남고 현재 observations는 비어 시작한다. 과거 완료 활동은 ecologyRevision1로 표시해 학습 성취로 보호한다. 이전 클리어는 유지하며 아직 클리어하지 않은 저장의 새 관찰 요건은 실제 새 섭식·학생 확인으로 갖춰야 한다. rewards.hasReceivedReward를 안내와 지급이 공유하여 동일 슬롯의 이전 보상은 재지급하지 않는다.

version9의 변경7슬롯 life는 기존 누적 나이/기존duration으로 상대 나이를 계산하고 최대90%로 제한한다. 기존 범위 내duration의 상대 위치를 새 범위에 적용하며 startedAt은 복원 simulationTime, initialAge는 새duration×상대나이다. 기존 원값도 archive에 남긴다. 나머지 유효한 life와 군집 상태는 그대로 복원한다. 과거 진딧물/쥐/이동거미 등의 먹이 상태는 별도로 보관하고 새 섭식 시각/쇠약 누적/포만 기한을 안전하게 초기화한다. 기존 hunger는 유지하고 적응 시간을 제공한다. 새 종의 실제 섭식에 성공했다고 꾸미지 않는다.

현재 번식은 강아지풀·방아깨비·멧토끼3규칙, 자연 보충은 방아깨비·솔나방 유충2규칙이다. 비활성화한 과거 번식/유입 대기는 archive에 남으며 실행하지 않는다. 초기도입·종별 수용·대기·먹이·공간 정책은 유지한다. 청동풍뎅이는 팽나무를 먹이 식물로 이용한 종별 성충 조사에 근거해 잎 자원으로 연결해 정상 먹이/재도입 검사를 재사용한다.

무당거미는 기존 wander 경로에서 wanders=false, feeding에서는 huntMode=ambush와 짧은 탐색 반경/속도0이다. 타깃이 유효한 근거리에서만 먹으며 먼 먹이를 쫓지 않는다. 별도 RAF/타이머/거미줄 그림을 만들지 않는다. 분해자3종은 일반 포식관계가 아니라 기존 wood/litter/remains와 군집 갱신을 유지한다.

progress-summary는 현재/과거 관찰 수와 누적/과거/현재 개체 변화 합계를 분리한다. 전송이나 관리자 UI는 없다. 과거 population history는 이전 이름/단위로 표시하며 새 현재 알림으로 재발송하지 않는다.

11.6의 대표5종 상세 성장/번식은 아직 구현하지 않았다. 현재 데이터 정의·life/군집·foodStock·공유 lifecycle·population 조건·placement 제약을 연결 지점으로 사용한다. 정확한 종 자료와 교육용 게임 시험값은 FOREST_SPECIES/FOREST_LIFESPANS/감사 문서에서 구분한다.

## 핵심 책임

정적 HTML/CSS/ES 모듈 구조입니다. data는 규칙과 콘텐츠, state는 도메인 상태, systems는 게임 계산/검증, ui는 표시/입력, main.js는 연결을 담당합니다. assets의 기존 SVG/이모지 placeholder를 유지합니다.

공통 update-loop 하나가 최대 30fps로 이동을 갱신합니다. feeding/ecology는 0.5초, event 평가는 1초 간격입니다. hidden 및 prefers-reduced-motion 중에는 기존 정책대로 시뮬레이션을 멈춥니다. 복귀할 때 시간 차를 누적 처리하지 않습니다.

placement는 inventory.acquired/정규화 좌표/영역/나무 겹침/30개 제한을 검증합니다. organism-layer는 개체별 DOM을 만들고 이동 transform/상태만 갱신합니다. 23개 카드 정의 중 15개 소비자가 22개 관계에 따라 실제 섭식합니다. 멧토끼의 강아지풀 섭식도 연결했습니다. 3개 분해자는 별도의 유기물 풀에서 기초 분해를 수행합니다.

## 환경·안정도·이벤트·학습

environment-config와 environment.js는 네 환경의 종별 가중 적합도, 성장 회복/감소, 공기 활동 배율을 유지합니다. food-resources는 growth에 비례한 먹이 한도/회복을 계산합니다.

stability-config/stability.js는 기존 다양성 20%, 역할 구성 20%, 먹이 25%, 환경 20%, 편중/최근 감소 15% 가중치를 유지합니다. 10단계에서 먹이 항목만 소비자 종류별 평가로 최소 조정했습니다. 허용 먹이 공급을 합산해 대체 먹이가 모두 있어야 점수가 나오는 오류를 막습니다. 먹이 충족/영양의 기존 계수와 다른 항목, 클리어 기준은 유지합니다. 분해자의 존재를 계산하는 역할 지표와 실제 분해 시뮬레이션은 구별합니다.

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

- services/save-format.js: 버전10 스냅샷의 whitelist 및 버전7·8·9 이전 검증/정리. ecology-migration.js는 과거 생태 기록 보관과 종별 수명 변환을 담당합니다. 도메인 전체를 그대로 stringify하지 않습니다.
- services/save-service.js: 로드, 저장 요청 병합, flush, reset, 오류 상태. adapter를 주입받습니다.
- adapters/local-storage.js: 게임 저장의 localStorage 접근 지점. key는 eco-system:forest-save. 안내 선호는 별도 guide-preference adapter가 담당합니다.
- ui/forest-view.js: 목표/저장 문구/초기화 확인. 저장 데이터를 직접 쓰지 않습니다.

저장 외피는 schemaVersion=10, savedAt(ISO 실제 저장 시각), domain, eventMemory입니다. domain.schemaVersion=10, ecologyRevision=2입니다. 7·8·9버전은 기존 진행을 보존하고 종의 의미 변화도 명시적으로 이전합니다. savedAt은 게임 계산에 사용하지 않습니다.

지속 데이터: ecosystemId/simulationTime/nextInstanceSequence, inventory, organisms의 ID/종/정규화 위치/성장/foodStock/hunger/부족 누적/최근 섭식 활성 시각, environment, points/bestStability, observations, activities, rewardHistory, 관리 이력/누적 횟수/cooldown/effect, forestProgress.

제외: selectedSpeciesId, 열린 dialog/포커스, 현재 stabilitySummary(재계산), targetInstanceId/behaviorState/direction, RAF/DOM/render/geometry 캐시, wander/feeding의 재탐색·섭식 중 타이머, stability 최근 표본 이력, active event 객체. 이벤트 자체 대신 아래 명시적 기억만 저장합니다.

## 검증과 런타임 복원

`saved domain state → validation → runtime reconstruction → event refresh → render`

JSON/크기 상한/버전/핵심 구조를 검사합니다. 알려진 종·관계·활동·보상·관리 ID만 사용합니다. 중복 instanceId와 잘못된 종/비유한 좌표 개체는 제거하며 유한 좌표는 0~1, 환경은 0~1, 배고픔은 0~1, 성장/먹이량은 기존 한도, 포인트는 음수 방지/상한으로 제한합니다. 배열·문자열/이력 크기도 제한합니다. 알 수 없는 보상 ID는 버립니다.

부분 손상은 정리하고, 유효한 활동 완료 기록이 있으면 누락된 카드 해금 표시도 복구합니다. 필수 구조/JSON이 크게 손상되면 초기 상태로 복구합니다. 버전 누락은 안전 초기 상태, 명시적인 과거/미래 버전은 초기 화면으로 실행하되 원본 저장을 덮어쓰지 않습니다. 7보다 오래된 형식에는 지원되는 저장 계약이 없으므로 임의 변환하지 않습니다. 7·8·9에는 명시적 이전 경로를 적용합니다. 알 수 없는 ecologyRevision도 원본 덮어쓰기를 막습니다.

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

저장 서비스의 read/write/remove adapter와 진행 요약은 별도 책임입니다. 미래 remote adapter 또는 관리자 연동은 이 경계를 사용하되 지금 빈 원격 모듈은 없습니다. 다음 테마·정밀 물질 순환·오염·완성형 먹이그물 화면은 이번 범위 밖입니다.

## 9단계 안내와 목표 표시

`game state → 기존 forest goal evaluation → 목표 UI`

systems/goal-guidance.js의 goalPresentation은 기존 evaluateForestGoal의 다섯 check와 forestProgress의 실제 연속 유지/클리어를 여섯 학생 목표로 표현합니다. forest-goal 설정에서 관찰·활동·종·환경 기준·70점·30초를 읽고 부족한 실제 이름과 수를 계산합니다. 목표 UI용 새 도메인 기록은 없습니다. 이미 클리어한 뒤 현재 조건이 악화하면 현재 조건은 미달성으로 표시하면서 달성 이력은 보존합니다.

nextAction은 현재 카드/개체, 실제 발견 후보·관찰, 완료 활동, 환경, 포인트, 실제 먹이 부족, 기존 안정도 hint를 읽는 순수 함수입니다. 최초 보상을 받을 수 있는 질문과 미완료 활동을 안내하고 잠긴 개구리의 선행 관찰을 설명합니다. 한 번에 한 문장만 표시합니다. stability 공식·goal 판정·활동 조건을 별도로 복제하지 않습니다.

ui/forest-view.js는 여섯 행의 DOM을 한 번 만들고 바뀐 문구와 체크만 갱신합니다. 기본 화면에는 한 줄 목표 수와 상세 버튼을 두고 기존 사이드 영역에 다음 행동을 표시합니다. 별도 갱신 loop를 추가하지 않고 기존 dashboard refresh 경로를 사용합니다.

ui/help-view.js는 새 게임 목적/조작 안내와 재열기를 담당합니다. main.js가 restored.status==='new'일 때만 최초 자동 표시를 요청합니다. 닫기·Escape·건너뛰기도 확인으로 처리합니다. adapters/guide-preference.js는 선택적인 UI key eco-system:forest-guide-seen만 읽고 쓰며 오류가 게임 실행을 중단시키지 않습니다. schemaVersion10 도메인 저장과 독립적입니다.

## 9단계 환경 관찰과 유료 회복

`환경 변화 또는 관리 행동 → environment system → 생태계 상태 → 이벤트/안정도`

학생 UI는 environment 조회 가능 / 무료 직접 변경 불가입니다. ui/environment-panel.js는 qualityLabel로 네 상태와 실제 효과를 보여줍니다. main.js의 기존 무료 조절 callback을 제거했으며 UI에서 setEnvironmentLevel 또는 environment 필드 쓰기를 하지 않습니다. 환경은 기존 가중 생산자 적합도·먹이 회복·공기 활동 배율에 계속 연결됩니다.

물/토양/먹이 지원/서식지 회복 네 관리 행동은 기존 event payload → management 검증 흐름을 유지합니다. 이전 저장의 나쁜 햇빛·공기를 복원할 길이 없던 문제는 사용자 승인에 따라 기존 habitat-care만 최소 보완했습니다. 데이터 effect.recoveryFactors와 minimumRecoveryValue로 대상과 기준을 분리했습니다. 나쁜 요소 하나를 normal로 올리며 8포인트·공유 cooldown 75초·생산자 회복 배율 1.35/60초는 기존 값을 유지합니다.

햇빛/공기는 기존 실제 alert에서 회복할 수도 있고 읽기 전용 환경 패널에서 명시적인 유료 회복을 요청할 수도 있습니다. 후자는 `{sourceType:'environment',sourceId:factor}`를 management에 전달하고 검증된 요청 맥락만 내부 구성합니다. 신규 이벤트를 state에 삽입하지 않습니다. action/허용 요소/실제 나쁜 값/존재/비용/대기를 먼저 검증한 후 environment API로 상태를 바꿉니다. event.status를 강제로 해결하지 않습니다. 기존 물/토양 실제 해결 보상은 유지하되 햇빛/공기에 새 해결 보상을 만들지 않습니다.

save-format은 관리 기록의 factor를 기존 네 알려진 환경 key로 검증하도록 확장했습니다. 기존 optional factor/valueAfter 필드를 재사용하고 schema/key를 유지합니다. 로드할 때 나쁜 요소를 몰래 개선하지 않습니다. 저장 당시 진행/카드/활동/보상/클리어를 유지합니다.

## 개발 테스트 경계와 후속 연결

`별도의 개발 경계 → environment 변경 가능`

js/dev/environment-tools.js는 기존 네 환경 비교 선택창을 environment API와 연결하는 명시적 설치 함수입니다. production main.js가 import하지 않고 전역 객체/URL 매개변수/학생 토글도 없습니다. tests/fixtures.cjs가 테스트용 main 응답에만 해당 import와 설치를 삽입하고 기존 event/stability/goal/render/save 갱신을 호출합니다. 예전 비교 검사는 이 경계를 사용하며 새 학생 경로 검사는 일반 앱을 사용합니다. 이는 정적 클라이언트의 인증 체계가 아니라 제공되는 학생 조작 경계입니다.

11단계의 개체 수 변화는 공유 개체 생성자와 nextInstanceSequence, placement의 30개 상한, 생물 DOM 추가/삭제 경계에서 연결합니다. 번식·사망의 새 원인은 feeding의 포식 삭제와 구별하고, 먹이 대상 캐시 정리와 저장·목표 재평가를 함께 검사해야 합니다. 현재 상한을 늘리거나 빈 모듈을 추가하지 않았습니다.

## 10단계 먹이그물 데이터 흐름

`OrganismDefinition → FoodRelation → organisms instance → feeding / food-resource system → 실제 상호작용 → observation event → 저장 → 이후 먹이그물 UI`

- `organisms.js`: 안정적인 id, 이름, 역할, 서식 환경, 설명, 기존 이미지/placeholder, behaviorType. 신규 17종의 unlockStage=14는 예정 정보이며 해금 권한이 아니다.
- `food-relations.js`: 먹히는 쪽 source → 먹는 쪽 target. relationId, foodPart, feedingMode, evidenceId, core. 관계별 출처는 FOREST_SPECIES.md에 대응한다. 소비자별 목록과 종 쌍 Map을 한 번 만들어 조회한다.
- `ecology-config.js`: 5개 생산자의 먹이량/회복/허용 부위, 15개 소비자의 배고픔·속도·탐색 범위. 식물 부위들은 현재 동일 foodStock을 공유한다. environment-config가 새 생산자에 네 비생물 요소의 적합도를 제공한다.
- 실제 개체에는 위치·성장·먹이량·배고픔·추적 상태만 둔다. 정의나 먹이 관계를 개체마다 복제하지 않는다.
- feeding은 낮은 빈도로 살아 있는 개체를 종별로 색인한다. 허용 관계 안에서 존재·남은 자원·거리·접근 가능성을 검사한다. 타깃 고갈/삭제 시 기존 재탐색 상태로 돌아가 다른 먹이를 찾는다. 식물 자원 소비와 동물 삭제를 feedingMode로 구분한다. 동기 삭제 후 stale target을 정리한다.
- wander는 종별 motion 설정을 사용하며 식물/분해자를 이동시키지 않는다. 새 RAF·setInterval·무거운 효과는 없다.
- 실제 섭식 신호의 relationId/foodPart를 feedback과 events가 사용한다. 발견 후보는 자동 수집하지만 observations와 최초 보상은 학생 확인 후 기록한다. 기존 두 핵심 관계를 우선하고 화면 4개 제한, 중복/재보상 방지를 유지한다.
- save-format은 관계 정의에서 허용 관찰·보상·후보를 검증한다. 현재 관찰/후보 상한은22개 정의를 사용한다. 과거 관찰27개는 역사 기록에만 남는다. 누락된 신규 inventory는 잠금으로 추가한다. 이전 상수리/토끼의 새 runtime 필드 누락은 정상 기본값으로 보충한다. key는 유지하고 현재 relationId에는 v2_ 접두사를 쓴다. 현재 저장은 schemaVersion=10, 이전7·8·9를 안전하게 읽는다.

## 카드와 개발 경계

cards.css의 한 줄 가로 스크롤로 23개를 담고 이름 줄바꿈과 터치 크기를 유지한다. 기존 6종은 기존 활동/해금 조건을 사용한다. 신규 17종은 ‘추후 해금 예정’이며 클릭해도 가짜 학습 활동을 열거나 무단 배치하지 않는다.

학생 main.js는 dev 모듈을 가져오지 않는다. useDeveloperSpecies 테스트 fixture만 main 응답의 명시적 경계에 installSpeciesTools를 연결한다. 카드 권한을 열어도 포인트·학습 기록은 지급하지 않는다. URL 플래그는 없다. 이 경계는 개발 검증 편의 기능이며 개발자 도구로 저장을 직접 변조하는 행위까지 막는 인증 시스템은 아니다.

12단계 환경 변화는 기존 environment API를 통해 연결하고 15단계 유지시간은 forest-goal 설정에서 조정할 수 있습니다. 이번에는 날씨·위기·정밀 물질 순환·종 확대·관리자 UI/원격 서비스를 구현하지 않습니다. 최초 보상이 전부 소진된 저포인트 저장은 여전히 유료 관리가 막힐 수 있으므로 후속 경제 설계에서 별도 제한 회복 보상 등을 검토해야 합니다.

## 11단계: 생명주기와 기초 분해

- data/population-config.js: 모든 활성 시간·쇠약·회복·번식·도입·자원 상한 조정값. 실측 생태 시간은 아니다.
- lifecycle.js: 고유 ID 생성, 실제 organisms 추가/제거, 추적 참조 해제, 종별 실제 수에서 변화 이력/누적 통계를 기록한다. 포식·굶주림·번식·배치·재도입·학생의 돌려보내기를 구별한다. 포식은 유기물을 중복 생성하지 않고 굶주림만 잔존 유기물을 만든다.
- population.js: 생존 단계/활동 배율, 성공 섭식 회복, 지원 완화, 도입 검증, 조건부 번식을 담당한다. 초기 대기 면제는 종별 도입 횟수로 기록하고, 감소 시 대기를 적용한다. 현재 개체 수는 별도 저장하지 않고 organisms에서 계산한다.
- placement-rules.js: 순수 화면 영역/footprint/나무 간격 검증을 분리해 학생 배치와 자연 발생이 공유한다. placement.js는 카드 권한·전체 상한과 도입 정책을 검증한 뒤 공통 생성 경로를 쓴다. 개발 검사에서만 WeakSet 권한으로 도입 제한을 우회하며 상한/영역/카드 권한은 그대로 검증한다.
- feeding.js: 기존 0.5초 tick에서 실제 섭식·포식 → 생존 감소 → 번식, 같은 tick에서 유기물 분해/생산자 회복을 연결한다. 실제 동물 섭식 후 포만 기한에는 hunger 증가를 멈춘다. 학생의 즉시 반복 배치/포인트 지원은 성공 섭식으로 취급하지 않는다.
- decomposition.js: wood/litter/remains 각 최대 30. 소량의 배경 분해와 3분해자의 자원별 활동, soilNutrients(0~1)를 계산한다. 양분은 최대 1.12배 회복 배율이며 환경 quality 값을 직접 변경하지 않는다.
- main.js: added/removedIds를 organism-layer의 추가/삭제에 연결하고 실제 변화 후 이벤트·안정도·목표·저장을 갱신한다. 생물별 타이머나 별도 번식 scheduler는 없다. 식물만 있을 때에도 기존 공통 loop에서 분해/씨앗 확산을 처리한다.
- events.js: 쇠약/굶주림 감소는 기존 핵심 발견보다 우선, 먹이 경쟁과 제한적 번식도 실제 상태에서 알린다. 최근 이력은 원인/종별 최신 항목을 묶어 최대 6후보를 만들며 화면 최대 4개를 유지한다. population notice 확인은 noted만 기록하고 새 보상을 지급하지 않는다.
- population-view.js: 23종 선택 상태 패널, 실제 수/생존/도입 조건/최근 이력/유기물 질적 표현. 두 번 확인하는 돌려보내기는 release 원인으로 제거하며 유기물/포인트를 만들지 않는다. 30개체에서 재도입 공간을 마련하는 최소 복구 경로다.

현재 1 instance = 1 화면 개체인 방식 A를 채택한다. 종별 번식 상한과 전체 30개체를 유지한다. 23종 모두에게 번식 짝을 두기는 좁으므로 대표 개체 분리는 향후 성능·저장·관찰 의미를 검토한 뒤 판단한다.

8버전 저장은 bornAt/deprivationSeconds/satietyUntil, 종별 breeding/introductions, organicMatter/soilNutrients/processed, 변화 이력 80건/누적 통계를 whitelist로 검증한다. DOM/추적 대상/행동 캐시/현재 팝업은 저장하지 않는다. 7버전은 새 누적 없이 적응 120초, 8버전은 누적 유지와 복원 대응 30초를 제공한다. 미래 스키마 덮어쓰기 차단은 유지한다.

안정도 가중치는 변경하지 않았다. 실제 counts·hunger·허용 먹이·종 구성·최근 감소가 기존 평가에 들어가며 감소당 고정 벌점은 없다. 진행 요약에 activeOrganismCount와 populationChanges를 추가했지만 학생 식별/전송은 없다. 12단계 환경 위기는 기존 environment API와 이 생존/자원 계산을 통해 연결한다.

## 11.5단계: 개체 수명과 군집의 세대교체

- data/lifespan-config.js: 23종의 게임 범위·초기 상대 나이·단위·종료 원인·유기물과 제한 보충 규칙. 실제 수명 근거/불확실성은 FOREST_LIFESPANS.md. 생물·비생물 데이터의 ID는 유지한다.
- state/life-state.js: 생성/이전 때만 종과 ID의 해시로 개체별 기간을 결정한다. 동식물은 life={startedAt,initialAge,duration}, 군집은 life={renewalSeconds,nextRenewalAt,vigor,stressSeconds,generation}. effectiveAge=initialAge+활성 시간 경과. bornAt은 기존 도입/굶주림 적응 시각으로 유지하며 생물학적 출생 시각으로 재해석하지 않는다. 재생산 자식은 상대 나이 0, 직접 도입은 종별 5~18%의 상대 나이. 그래픽은 기존 성체 placeholder인 교육적 생략이다.
- systems/lifespan.js: 기존 0.5초 ecology tick에서 동식물 자연 종료/유충 단계 종료, 군집의 활동·휴면·환경 스트레스·내부 갱신을 처리한다. 프레임/DOM/벽시계/새 타이머와 독립적이다. 군집 갱신은 같은 instance와 DOM 유지, delta 0 기록이며 알림을 만들지 않는다. 자체 유기물 소비/양분 생성도 하지 않는다.
- feeding 순서: 활성 시각/관리 → 기존 분해/자원/성장 → 실제 섭식·포식 → 굶주림 → 수명/군집 → 참조 정리 → 기존 4종 번식 → 제한 보충. 같은 tick의 사유 우선순위는 포식 > 굶주림 > 수명. release는 학생 입력 시 즉시 처리한다. 삭제가 먼저 실제 배열과 index/timing 캐시를 정리하므로 이중 제거/유기물이 없다.
- lifecycle.removeOrganism: natural_lifespan은 나무/관목 wood, 풀/산딸기 litter, 동물 remains로 1회만 발생시킨다. 포식·release·life_stage_exit·colony_decline은 별도 유기물을 생성하지 않는다. 기존 30 자원 상한 유지. 분해율만 군집 vigor와 물/흙/공기 적합도로 조정하며 기존 배경 분해와 최대 12% 생장 보조를 유지한다.
- population.replenishment: 실제 번식 이후 방아깨비 알 보충 가능량 최대6, 소나무의 솔나방 유충 발생2개 규칙의 healthySeconds/nextAt. 기존 무당벌레·일반 거미·등줄쥐의 자동 유입은 현재 홍단딱정벌레·무당거미·고슴도치에 적용하지 않는다. 신규 해금 없음. 획득+과거 실제 도입 count>0+먹이+환경+영역/밀도+대기+30 상한을 검사한다. 저장 복원으로 생성된 count=0 도입 항목은 유입 권한이 아니다. 알 가능량은 게임 보충 예산이고 현재 살아 있는 숨은 개체 수가 아니다. 실제 생물 1 instance=1 DOM 정책은 유지한다.
- population history: 기존 80건/누적 통계 정책, natural_lifespan(-1), life_stage_exit(-1), colony_decline(-1), colony_renewal(0), replenishment(+1). 상태 창은 단위와 상대 생애, 실제 최근 변화만 보여준다. 남은 초 카운트다운은 없다. main은 변화 후 DOM/안정도/목표/이벤트/저장을 연결한다. 안정도 가중치와 최근 실제 감소 지표를 변경하지 않았고 원인마다 추가 벌점도 없다.

현재 저장 계약은 schemaVersion10과 기존 eco-system:forest-save key다. 8·7은 누락된 life를 복원 활성 시각 기준으로 안전하게 할당한다. 9는 기존 정의로 life를 검증하고 변경7슬롯의 상대 나이/종료 분포를 새 정의로 변환한다. 10은 검증·whitelist 복사해 재추첨하지 않는다. 8의 생존·번식/재도입·분해/진행과7의 적응 정책을 유지한다. 알려진 cause/mode 및 종별 범위, 군집 상태, 보충/알 상한을 검증한다. 과거 nextAt가 남아 있는 휴면도 유효하다. 부적절한 life만 안전하게 보정하고 미래 형식 덮어쓰기는 막는다.

12단계는 기존 environment의 값만 변경하는 사건을 연결할 지점이다. 현재 수명 기간은 관리/환경으로 무한 연장되지 않는다. 환경 영향은 식물/먹이/번식/군집 활동을 통한다. 날씨·오염 사건은 추가하지 않았다. 15단계에는 초기 상대 나이·수명 하한·알 보충/번식 조건·30 상한·최종 수업 시간·경제를 함께 조정한다.
