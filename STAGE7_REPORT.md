# 7단계 완료 보고서

작성일: 2026-10-07

## 1. 실제 작업한 저장소 경로

`C:\Users\User\Documents\GitHub\eco-system`

이 저장소의 원본 파일을 직접 수정하고 검사했습니다. 기존 outputs/ZIP은 작업 원본으로 사용하지 않았으며 ZIP을 만들지 않았습니다. 로컬 확인 주소는 실제 저장소를 제공하는 http://127.0.0.1:8081/ 입니다.

## 2. 수정/추가 파일

활동 데이터, 조건 평가, 완료, 해금, 활동 UI 및 전용 CSS/테스트를 추가했습니다. 기존 초기 상태·보상·카드 UI·main 연결부·문서·회귀 테스트를 수정했습니다. 정확한 25개 파일 목록은 19번에 있습니다.

## 3. 초기 acquired 카드 구성

획득: 상수리나무/풀/메뚜기. 잠금: 개구리/토끼/버섯. 초기 배치된 나무와 풀은 유지합니다. inventory는 모든 6종을 보유하며 acquired만 다릅니다. 시작 포인트는 0이고, 처음부터 풀과 메뚜기를 배치하여 기존 관찰 12포인트를 얻을 수 있습니다.

## 4. activity 데이터 구조

data/activities.js에 activityId/type/title/prompt/choices/correctAnswer/requirements/hint/learningOutcome/unlockSpeciesId/pointReward/unlockHint를 정의했습니다. 유형에 필요한 필드만 사용합니다. state.activities는 activityId/completed/attempts/completedAt 및 정답 완료 선택지 ID인 lastAnswer를 기록합니다. 완료 시각은 simulationTime과 같은 활성 시뮬레이션 초입니다. 전체 답변 이력과 개인정보는 기록하지 않습니다.

## 5. 구현한 quiz

‘햇빛을 이용해 스스로 양분을 만드는 생물은 무엇일까요?’에서 풀/개구리/토끼를 선택합니다. 오답은 단서와 재선택, 정답은 최초 3포인트를 줍니다. 카드 해금은 없어서 퀴즈가 해금의 유일한 방법이 되지 않습니다.

## 6. 구현한 classify

이 숲에서 죽은 나무를 분해하는 버섯의 역할을 생산자/소비자/분해자 중 선택합니다. 분해자가 정답이며 버섯 카드와 최초 4포인트를 제공합니다. 모든 버섯이 같은 생활을 한다는 문구를 쓰지 않았습니다. 실제 분해나 토양 개선 효과는 추가하지 않았습니다.

## 7. observation activity 연결 방식

기존 observations에 grass_to_grasshopper 기록이 있어야 완료됩니다. 실제 섭식만으로는 부족하고 학생이 기존 💡 발견 기록하기를 눌러야 합니다. 기존 관찰 보상 12를 유지하며, 관찰 활동을 확인하면 개구리 카드와 활동 최초 4포인트를 줍니다. 활동 UI가 observations를 변경하지 않습니다.

## 8. habitat activity 조건

서로 다른 생산자 2종 이상, 풀 존재, 햇빛/물/공기/토양 각각 보통 이상(내부 0.4 이상), 기존 안정도 60 이상입니다. 현재 상태의 순수 안정도 평가도 확인해 오래된 점수만으로 해금하지 않습니다. 학생 화면에는 네 조건의 체크 문장을 보여줍니다. 조건을 만족하고 확인하면 토끼 카드/최초 4포인트를 받습니다. 토끼 자동 생성은 없습니다.

## 9. 카드 unlock 검증 구조

unlocks.js의 unlockSpecies가 실제 종, inventory 항목, 활동의 해금 대상 일치, 완료 기록, 실제 관찰/정답/서식 근거를 검증합니다. 이미 acquired이면 변경하지 않습니다. activities.js가 완료 조건을 검증하고 완료 기록 → unlock → reward 순으로 처리합니다. UI는 acquired를 쓰지 않습니다.

## 10. rewards.js 확장 방식

기존 observation/question/management를 유지하고 activity category를 추가했습니다. activityId로 콘텐츠의 pointReward를 조회하며 완료 기록이 있어야 지급합니다. amount를 UI에서 받지 않습니다. 카드 해금 함수 자체에는 포인트 지급이 없습니다.

## 11. 중복 보상 방지

activity:producer_quiz, activity:decomposer_classify 등 의미 ID를 기존 rewardHistory에 기록합니다. 완료 상태와 보상 이력을 함께 확인합니다. 재학습/재해금/창 반복 열기에는 최초 보상을 다시 주지 않습니다. 해금 뒤 환경이 악화되어도 이미 얻은 카드를 다시 잠그지 않습니다.

## 12. 잠긴 카드 UI

모든 6종 카드를 보여주되 잠금 기호·점선 테두리·짧은 조건 힌트로 구분합니다. 잠긴 카드 터치는 현재 배치 선택을 해제하고 관련 활동을 엽니다. 상단의 작은 배움 버튼으로도 네 활동에 접근합니다. 선택지는 터치 버튼이며 정밀 드래그는 없습니다. 해금 성공 메시지는 현재 활동 창 안에서 짧게 보여줍니다.

## 13. 카드 해금 후 기존 placement 연결

main.js가 해금 성공 응답을 받으면 기존 renderCards와 선택 표시를 갱신합니다. 카드는 즉시 선택할 수 있고, 기존 placement가 acquired/영역/겹침/최대 30개를 그대로 검증합니다. 개체 자동 배치나 카드 소모는 없습니다.

## 14. TEST A~L 결과

실제 초기 상태를 사용하는 activities.browser.test.cjs에서 모두 통과했습니다. 초기 잠금, 실제 풀 섭식/12포인트, 개구리 해금·배치·포식·새 발견, 분류 정오답/반복 보상 차단, 토끼 조건 미달·충족/자동 생성 없음, 잠금 힌트, 해금 후 관리, 30개체 활동 창을 검사했습니다. 실제 저장소의 로직 검사 44개도 통과했습니다. 상세 내용은 QA.md에 있습니다.

## 15. 기존 1~6단계 회귀 검사

기존 배치·wander·두 먹이 관계·foodStock·환경·안정도·!/?/💡·관찰·포인트·관리·대기·refresh·hidden/resume·30개 제한 검사를 다시 실행해 통과했습니다. 기존 시스템 전용 검사에는 이미 해금한 fixture를 명시하고 테스트를 삭제하지 않았습니다. 실제 초기 잠금/해금 진행은 새 통합 검사에서 fixture 없이 확인합니다.

## 16. 20~30개 성능 검사

30개체에서 활동 창을 열어 기존 생물 DOM 유지, 2.2초 측정 구간 크기 읽기 0회, setInterval 생성 0개를 확인했습니다. 실제 포식으로 사라진 개체는 제외하고 생존 DOM을 비교합니다. 기존 회귀에서도 RAF 예약 최대 1개를 유지했습니다. 960×600/412×915 가로 넘침 없음, 44px 이상 선택 버튼, 숨김/복귀를 확인했습니다. Galaxy Tab S5e 실기기 FPS/발열은 별도 확인이 필요합니다.

## 17. 의도적으로 구현하지 않은 기능

신규 이미지/퍼즐/문제은행/도감 완성, 번식/자연 증가/사망/질병, 분해 시뮬레이션, 토끼 먹이 AI, 새 먹이 관계, 오염/탄소/클리어, 저장/서버/관리자/인증/멀티플레이/강/바다는 구현하지 않았습니다. 기존 SVG와 placeholder를 유지했습니다.

## 18. 다음 안정도/숲 클리어/저장 연결 지점

안정도는 기존 stabilitySystem.update와 metrics.stabilitySummary를 재사용할 수 있습니다. 숲 목표는 실제 생태 상태와 observations/activities/managementHistory를 읽는 별도 판정으로 연결할 수 있습니다. 카드 개수만으로 클리어를 판단하지 않는 방향을 유지합니다.

저장은 schemaVersion=6의 domain state를 검증·이전·복원하는 경계가 필요합니다. 현재 events/feeding 내부 clock과 cooldown 등 일부 런타임 상태는 state 밖에 있으므로 단순 JSON 저장만으로 완전 복원이 되지는 않습니다. 해당 시스템의 복원 정책을 먼저 정해야 합니다. 이번 단계에서는 저장 모듈을 미리 만들지 않았습니다.

## 19. git status 기준 GitHub Desktop Changes 파일

아래는 작업 완료 시 실제 저장소의 미커밋 변경입니다. M은 수정, ??는 신규 파일입니다. 커밋·스테이징·푸시는 하지 않았으며 .git/Git 설정/Pages 설정도 변경하지 않았습니다. 사용자 GitHub Desktop에서 Changes 확인 → Commit to main → Push origin으로 진행할 수 있습니다.

```text
 M ARCHITECTURE.md
 M QA.md
 M README.md
 M data/forest.js
 M index.html
 M js/main.js
 M js/state/game-state.js
 M js/systems/rewards.js
 M js/ui/render.js
 M tests/browser.test.cjs
 M tests/events.browser.test.cjs
 M tests/events.test.mjs
 M tests/feeding.browser.test.cjs
 M tests/logic.test.mjs
 M tests/management.browser.test.cjs
?? STAGE7_REPORT.md
?? css/activities.css
?? data/activities.js
?? js/systems/activities.js
?? js/systems/activity-rules.js
?? js/systems/unlocks.js
?? js/ui/activity-view.js
?? tests/activities.browser.test.cjs
?? tests/activities.test.mjs
?? tests/fixtures.cjs
```
