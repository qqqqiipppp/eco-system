# 8단계 완료 보고서

작성일: 2026-10-08

## 1. 실제 작업한 저장소 경로

`C:\Users\User\Documents\GitHub\eco-system`의 원본을 직접 수정했습니다. ZIP/outputs/복사본을 원본으로 사용하지 않았습니다.

## 2. 수정/추가 파일

숲 목표 설정/계산, 저장 형식/서비스/로컬 adapter, 진행 요약, 목표·초기화 UI 및 저장 테스트를 추가했습니다. 기존 main 연결, 상태, 시스템 초기 시계와 UI reset 경계, 관리 누적 횟수, 회귀 검사와 문서를 수정했습니다. 정확한 파일 목록은 25번에 있습니다.

## 3. 숲 클리어 조건

안정도≥70, 햇빛/물/공기/토양 각각≥0.4, grass_to_grasshopper와 grasshopper_to_frog 관찰 기록, producer_quiz/decomposer_classify/grass_observation 완료, 현재 grass/grasshopper/frog 존재를 요구합니다. data/forest-goal.js에서 조정합니다. 카드 수/포인트/버섯의 미구현 분해 기능은 클리어 조건이 아닙니다. 안정도 공식은 변경하지 않았습니다.

## 4. 안정 상태 유지 방식

모든 조건을 활성 시뮬레이션 시간 30초 연속 유지해야 합니다. 기존 0.5초 ecology tick에서만 시간을 더합니다. 조건 실패 시 0으로 초기화합니다. 숨김 시간과 오프라인 시간은 세지 않습니다. 불러오기 후 미완료 유지 시간도 0부터 다시 확인합니다.

## 5. 클리어 기록 구조

forestProgress={cleared,clearedAt,stableSeconds}. 최초 달성 시 cleared=true와 활성 시각을 기록합니다. 이후 악화되어도 취소하지 않으며 계속 플레이합니다. 별도 클리어 포인트 보상은 없습니다. 작은 목표 표시/패널로 안내합니다.

## 6. bestStability 구조

metrics.bestStability는 기존 안정도 계산 결과의 최고값만 기록하고 저장합니다. 현재 stability/stabilitySummary는 매번 실제 상태로 재계산합니다.

## 7. forest progress 계산 방식

관찰20/핵심활동20/추가해금10/관리경험10/유지목표20/클리어20의 가중치를 별도 설정에 둡니다. 미완료 유지가 깨지면 해당 부분은 줄 수 있고, 최종 클리어는 100으로 확정합니다. 학습/게임 진행이며 성적이 아닙니다.

## 8. 저장 대상 데이터

버전, 테마, 활성 시간, 개체 ID 다음 순번, 카드, 생물 ID/종/위치/성장/먹이량/배고픔/부족 누적/최근 섭식 시각, 환경, 포인트/최고 안정도, 관찰, 활동, 보상 이력, 관리 최근 100개 이력/누적 횟수/대기/효과, 숲 달성을 명시적으로 저장합니다. 저장 외피에는 ISO savedAt을 따로 둡니다.

## 9. 저장하지 않는 runtime 데이터

선택 카드, 열린 창/포커스, targetInstanceId, behaviorState/direction, RAF/DOM/렌더·좌표 캐시, wander/feeding의 현재 행동 타이머, stability 최근 표본 이력, active 이벤트 객체는 저장하지 않습니다. state 전체를 그대로 직렬화하지 않습니다.

## 10. organism 행동 복원 정책

createOrganismInstance로 안전하게 구성한 뒤 허용된 도메인 필드만 복원합니다. 소비자는 wander/target=null/direction=1에서 새로 탐색합니다. feeding 시계는 저장된 simulationTime에 맞춥니다. 사라진 먹이를 계속 추적하지 않습니다.

## 11. event 복원 정책

문제 이벤트는 refresh로 실제 상태를 다시 판단합니다. 환경 성장 저하에는 기존 3초 관찰 대기가 적용됩니다. eventMemory에 sequence, 재알림 cooldown, 같은 상황 조사 완료 기억, 기록 전 실제 섭식 발견 후보만 보존합니다. observations/rewardHistory는 별도 지속 데이터입니다. 종료 이벤트 목록은 복원하지 않습니다.

과거 미해결 환경 관리의 보상 판정은 interrupted로 마감해 새 이벤트를 이전 행동의 결과로 오인하지 않게 합니다. 이미 적용한 환경/효과·받은 보상은 유지합니다.

## 12. save service / local adapter 구조

save-format은 명시적 스냅샷과 검증, save-service는 저장 예약/로드/flush/reset/오류, local-storage adapter는 실제 저장소 접근만 맡습니다. 게임과 UI 곳곳에서 localStorage를 직접 호출하지 않습니다. adapter 주입 경계를 마련했으며 원격 코드는 없습니다.

## 13. localStorage key

`eco-system:forest-save`를 한 파일에서 정의합니다. 같은 origin의 같은 브라우저 저장소를 사용합니다. 다른 포트/브라우저/기기와는 공유되지 않습니다.

## 14. schemaVersion과 검증 방식

도메인/저장 외피 모두 7입니다. 버전 누락·과거·미래·필수 구조 누락을 구별합니다. 이전 단계에는 저장 형식이 없었으므로 근거 없는 migration은 하지 않습니다. 명시적인 과거/미래 버전은 원본 저장을 보존하고 초기 화면을 제공하되 덮어쓰기를 막습니다. 확인 후 새로 시작할 수 있습니다.

## 15. 자동 저장 방식

의미 있는 조작/섭식/제거/클리어 후 1.2초 동안 요청을 합쳐 저장합니다. 잦은 입력에도 저장이 무기한 밀리지 않게 제한합니다. 활성 시간 15초 체크포인트와 pagehide/hidden 최종 flush도 사용합니다. 매 프레임이나 tick마다 쓰지 않습니다. 작은 저장 문구만 보여줍니다.

## 16. 손상 데이터 복구 방식

JSON/크기/필수 형식을 확인하고 잘못된 종·중복 ID·비유한 좌표 개체를 제거합니다. 좌표/환경/먹이량/배고픔/포인트 등은 허용 범위로 정리하며 관계·활동·보상 ID를 검증합니다. 유효한 활동 완료 기록으로 누락된 해금 표시도 복구합니다. 심각한 손상은 안전한 초기 상태로 복구합니다. 저장 거부/용량 오류에도 게임은 계속됩니다.

## 17. 처음부터 다시 하기 방식

목표 패널에서 확인 창을 거칩니다. 취소는 기존 숲을 유지합니다. 확인 시 저장 삭제 성공 후 예약 저장/loop를 멈추고 도메인·시스템 시계/캐시·선택/창/화면을 초기화한 뒤 기존 loop를 재개합니다. reload에 의존하지 않습니다. 삭제 실패 시 기존 진행을 유지합니다.

## 18. 관리자용 progress summary 구조

createProgressSummary(state,lastUpdated)는 schemaVersion/theme/studentId:null/progress/cleared/acquiredSpeciesCount/completedActivitiesCount/observationsCount/managementActionCount/currentStability/bestStability/lastUpdated를 반환하는 순수 함수입니다. 관리 누적 횟수는 최근 100개 이력과 별도로 보존합니다. lastUpdated에는 saveService.getSavedAt()을 전달할 수 있습니다. 이름/학번을 생성하지 않고 전송하지 않습니다.

## 19. TEST A~O 결과

모두 통과했습니다. 실제 조작 후 저장/복원, 실제 먹이 탐색 중 복원, 손상/범위 오류, 저장 병합, 초기화 취소/확인, 30개체, 하위 경로를 검사했습니다. 브라우저에서도 생태 계산을 계속 돌리며 실제 30초 유지 클리어를 확인했습니다. 별도 임시 프로필에서 Edge 완전 종료/재실행 후 활동/포인트 복원도 통과했습니다.

## 20. 기존 1~7단계 회귀 검사

기존 6개 브라우저 검사 파일과 전체 로직 53개를 통과했습니다. 카드/배치/이동/먹이/환경/안정도/이벤트/관찰/포인트/관리/활동/해금/숨김/30개 제한을 확인했습니다. 재로드 초기화 기대는 확인된 새로 시작하기로, 관찰 재로드 기대는 보존으로 수정했습니다. 기존 테스트를 삭제하지 않았습니다.

## 21. 20~30개 저장/복원 성능 검사

30개체 복원 뒤 위치/핵심 상태 일치, 생존 DOM 유지, 저장 측정 구간 크기 읽기 0회, 연속 25개 저장 요청의 실제 쓰기 1회를 확인했습니다. 별도 RAF/고주파 타이머를 만들지 않았습니다. 기존 동시 RAF 최대 1개도 유지합니다. Windows 자동화 결과이며 Galaxy Tab S5e 발열/FPS는 실기기 확인이 필요합니다.

## 22. GitHub Pages 환경 검사

실제 저장소 부모 경로를 제공하는 정적 서버 `http://127.0.0.1:8082/eco-system/`에서 상대 자원/저장/새로고침을 검사했습니다. 서버 API에 의존하지 않습니다. 실제 Pages 배포/설정은 변경하지 않았으므로 커밋·푸시 뒤 배포 주소 실기기 확인은 별도입니다.

## 23. 의도적으로 구현하지 않은 기능

신규 이미지/강/바다/관리자 화면/학생 로그인·이름·번호/Firebase/Supabase/원격 저장/멀티플레이/랭킹/학생 비교/오염/탄소/번식/사망/질병/분해/새 먹이 관계/문제은행을 추가하지 않았습니다. 기존 이미지와 안정도 공식도 유지했습니다.

## 24. 다음 단계 공통 시스템

forest-goal 설정과 목표 판정, schema 검증 경계, read/write/remove 저장 adapter, 개인정보 없는 progress summary를 재사용할 수 있습니다. 원격 저장과 관리자 연동은 각각 저장 adapter와 요약 경계를 확장해야 하며, runtime target/DOM을 외부 데이터로 옮기지 않아야 합니다. 새로운 테마나 서버용 빈 모듈은 만들지 않았습니다.

## 25. GitHub Desktop Changes 파일 목록

아래는 실제 저장소의 미커밋 변경입니다. M은 수정, ??는 추가입니다. ZIP 생성, staging/commit/push, .git/Git 설정/Pages 설정 변경은 하지 않았습니다. GitHub Desktop에서 Changes 확인 → Commit → Push를 사용자가 진행하면 됩니다.

```text
 M ARCHITECTURE.md
 M QA.md
 M README.md
 M index.html
 M js/main.js
 M js/state/game-state.js
 M js/systems/events.js
 M js/systems/feeding.js
 M js/systems/management.js
 M js/systems/update-loop.js
 M js/ui/activity-view.js
 M js/ui/event-view.js
 M js/ui/organism-layer.js
 M tests/activities.test.mjs
 M tests/browser.test.cjs
 M tests/events.browser.test.cjs
 M tests/feeding.test.mjs
 M tests/logic.test.mjs
?? STAGE8_REPORT.md
?? css/progress.css
?? data/forest-goal.js
?? js/adapters/local-storage.js
?? js/services/progress-summary.js
?? js/services/save-format.js
?? js/services/save-service.js
?? js/systems/forest-progress.js
?? js/ui/forest-view.js
?? tests/persistence.browser.test.cjs
?? tests/persistence.test.mjs
```
