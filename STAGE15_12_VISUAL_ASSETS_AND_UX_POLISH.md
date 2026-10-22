# 작은 숲 연구소 —15.12 비주얼·모션·학생 UI 구현 보고서

## 작업 기준과 결과

실제 저장소: C:\Users\User\Documents\GitHub\eco-system. 시작 HEAD: **8cb9d9936d2b9a008a383a002187250d0ec99c99**. 시작 시 미커밋/스테이징 변경은 **0개**였습니다. 15.11.6 완료본을 검사한 뒤 해당 저장소에서 직접 수정했습니다. 별도 구현본·ZIP·새 브랜치를 만들지 않았고 Git stage/commit/push/config/.git/Pages 설정을 변경하지 않았습니다. 현재 52개 파일(17수정/35추가/0삭제)을 미커밋 상태로 남깁니다.

‘지금 할 일’과 버튼을 접지 않고 표시하고,24종을 직접 제작한 동일 화풍 SVG로 교체했습니다. 실제 엔진 상태와 두 프레임 모션을 연결하고 숲 배경을 수정했습니다. 기존 좌표·생태·경제·목표·저장 계약을 보존했습니다. PC Edge/Playwright 결과이며 실제 S5e·학생 수업 검증은 아닙니다.

## 학생 UI와 문장

| 변경 전 | 이번 변경 후 |
|---|---|
| 다음 행동 버튼은 숲 미션을 펼쳐야 보임 | ‘지금 할 일’+한 가지 행동+버튼을 기본 화면에 표시 |
| 한 줄 안내의 긴 문장은 말줄임 | 현재 행동은 줄바꿈으로 읽고, 미션 상세는 펼쳐서 확인 |
| 카드 선택 안내와 다음 행동이 같은 버튼 상태 | 카드 고르기 → 숲에 놓기 → 실제 발견/다음 탐구의 기존 콜백으로 연결 |
| 선택 생물 이름 중심 | 선택한 생물 표제와 같은 종 그림을 함께 표시 |
| 상태창은 글 중심 |24종 그림과 굵은 상태 문장을 함께 표시 |
| 저장 기록이 손상되어 새 숲을 열었어요 | 저장된 숲을 읽을 수 없어 새 숲을 열었어요 |
| 새로 시작하기 전에는 덮어쓰지 않아요 | 새로 시작하기 전에는 저장을 바꾸지 않아요 |
| 일부 저장 기록을 정리해 불러왔어요 | 읽을 수 있는 기록으로 숲을 불러왔어요. 일부 기록은 정리했어요. |
| 임시 숲 배경이라는 안내 | 수관·풀숲·낙엽층·토양과 오른쪽 숲을 설명 |
| 클리어 후 추가 관찰 문장 | ‘더 해볼 수 있는 것’ 제목 아래 성장·분해·환경 관찰과 다음 숲 안내 |

15.11.6에서 이미 바꾼 ‘미션 활동’, 카드 보유/관찰 구분, 실제 먹기 문장, 복습 안내, 조사 보정, 기본 화면의 ‘단순화’ 제거는 유지·재검증했습니다. 이번에 새로 바꿨다고 중복 주장하지 않습니다. 도감·먹이그물·활동·발견·목표·도움말·관리 도움·선택·저장 안내를 포함한115개 표시 상태를 검사했습니다. 저장/복구12개 상태도5개 화면 크기에서 가로 넘침 없이 표시됩니다. 생태/포인트 원문과 과학 근거 A/B는 그대로 보존합니다.

기본 본문17px·보조15px, 현재 할 일17px 굵게, 현재 행동 버튼17px/높이46px 이상, 선택한 생물17px, 상태 문장19px, 도감 상세 그림92×76px입니다. 생물 위 이름표는 기본 숨김·선택1개·전체 보기30개를 유지합니다. 작은 개체의 ‘먹기’ 표시는13px이므로 실기기에서 식별을 확인해야 합니다. 고초균 그림은 여러 세균을 크게 나타냈다는 설명을 도감에 추가했습니다.

##24종 자산과 실제 모션 수

모든 자산은 이 프로젝트에서 직접 그린 원본 벡터입니다. 외부 이미지·원격 자산·상업 자산·추가 폰트를 사용하지 않습니다. 생성 원본은 tools/build-species-art.mjs, 읽기 전용 연결은 js/ui/species-visuals.js입니다. SVG fragment view를 바꾸며 카드·선택·도감·먹이그물·상태창은 같은 파일의 대표 정지 프레임을 사용합니다. 숲의 개체만 상태 모션을 재생합니다.

| 생물/고정 ID | 자산 경로 | 모션 상태 | 상태 수 | 프레임 수 |
|---|---|---|---:|---|
| 상수리나무 (oak) | [oak.svg](assets/images/species/oak.svg) | idle / growth / leaf-turn | 3 | 각2 |
| 강아지풀 (grass) | [grass.svg](assets/images/species/grass.svg) | idle / growth / leaf-turn | 3 | 각2 |
| 방아깨비 (grasshopper) | [grasshopper.svg](assets/images/species/grasshopper.svg) | idle / move / eat | 3 | 각2 |
| 참개구리 (frog) | [frog.svg](assets/images/species/frog.svg) | idle / move / eat | 3 | 각2 |
| 멧토끼 (rabbit) | [rabbit.svg](assets/images/species/rabbit.svg) | idle / move / eat | 3 | 각2 |
| 구름송편버섯 (mushroom) | [mushroom.svg](assets/images/species/mushroom.svg) | idle / active | 2 | 각2 |
| 소나무 (pine) | [pine.svg](assets/images/species/pine.svg) | idle / growth / leaf-turn | 3 | 각2 |
| 산딸기 (raspberry) | [raspberry.svg](assets/images/species/raspberry.svg) | idle / growth / leaf-turn | 3 | 각2 |
| 팽나무 (hazel) | [hazel.svg](assets/images/species/hazel.svg) | idle / growth / leaf-turn | 3 | 각2 |
| 다람쥐 (chipmunk) | [chipmunk.svg](assets/images/species/chipmunk.svg) | idle / move / eat | 3 | 각2 |
| 고슴도치 (field-mouse) | [field-mouse.svg](assets/images/species/field-mouse.svg) | idle / move / eat | 3 | 각2 |
| 솔나방 애벌레(송충이) (caterpillar) | [caterpillar.svg](assets/images/species/caterpillar.svg) | idle / move / eat | 3 | 각2 |
| 청동풍뎅이 (aphid) | [aphid.svg](assets/images/species/aphid.svg) | idle / move / eat | 3 | 각2 |
| 명주달팽이 (snail) | [snail.svg](assets/images/species/snail.svg) | idle / move / eat | 3 | 각2 |
| 무당거미 (spider) | [spider.svg](assets/images/species/spider.svg) | idle / move / eat | 3 | 각2 |
| 홍단딱정벌레 (ladybird) | [ladybird.svg](assets/images/species/ladybird.svg) | idle / move / eat | 3 | 각2 |
| 박새 (tit) | [tit.svg](assets/images/species/tit.svg) | idle / move / eat | 3 | 각2 |
| 직박구리 (bulbul) | [bulbul.svg](assets/images/species/bulbul.svg) | idle / move / eat | 3 | 각2 |
| 유혈목이 (snake) | [snake.svg](assets/images/species/snake.svg) | idle / move / eat | 3 | 각2 |
| 족제비 (weasel) | [weasel.svg](assets/images/species/weasel.svg) | idle / move / eat | 3 | 각2 |
| 참매 (goshawk) | [goshawk.svg](assets/images/species/goshawk.svg) | idle / move / eat | 3 | 각2 |
| 낙엽 분해 곰팡이 군집 (litter-mold) | [litter-mold.svg](assets/images/species/litter-mold.svg) | idle / active | 2 | 각2 |
| 고초균 (soil-bacteria) | [soil-bacteria.svg](assets/images/species/soil-bacteria.svg) | idle / active | 2 | 각2 |
| 참지렁이 (earthworm) | [earthworm.svg](assets/images/species/earthworm.svg) | covered / surface / covered-eat / eat | 4 | 각2 |

기본70상태×2=**140개 프레임 뷰**입니다. 추가로 강아지풀 sprout6뷰, 방아깨비 nymph6뷰, 구름송편버섯 mycelium4뷰를 포함하여 총156뷰를 한 종당 하나의 파일에 담았습니다.24개 SVG 총 **192,190바이트**입니다. 새싹은 씨 이삭 없이, 약충은 짧은 날개싹, 균사체는 자실체 없이 표시합니다. 새끼/어린 멧토끼는 기존 실제 성장 단계에 맞춘 표시 배율로 구분합니다. 참개구리 알·올챙이를 숲에 새로 만들지 않습니다.

- 생산자 idle은 잎/수관 흔들림, leaf-turn은 성체에서도 보이는 다른 잎 자세입니다. leaf-turn은 실제 성장·바람 사건이라는 뜻이 아닙니다. growth는 실제 growth 값이 증가했을 때만 켭니다.
- 일반 소비자 idle은 머리/더듬이 자세, move는 실제 모델 위치 변화에 맞춘 다리/날개/몸 변화, eat은 실제 behaviorState=eat에 맞춘 머리 굽힘·입 주변 동작과 작은 ‘먹기’ 표시입니다.
- 무당거미 move는 실제 moveToFood 구간의 접촉 준비 자세입니다. 이동 거리를 새로 만들지 않습니다.
- 참지렁이는 기존120초 중3초의 지표 접근 함수를 그대로 읽습니다. 실제 litterConsumed 증가로 먹기를 표시하며 낙엽 아래에서는 covered-eat로 피복 그림을 유지합니다. 표면으로 나온 먹기는 eat입니다.
- 분해자 active는 이번 생태 tick에서 실제로 배분된 양이 양수인 경우만 켭니다. 자원이 없으면 켜지지 않습니다. 최초3군집과 실제 활동 가능한 군집을 구분합니다. 숲 전체 공유 자원을 특정 화면 지점에서 처리했다는 설명을 만들지 않습니다.

분해 함수에 선택적인 visualWork 출력만 추가했습니다. 기존 배분 계산 결과를 feeding의 일시 결과로 전달하며 goalRevision1에서도 작동합니다. 과거 누적 학습 원장을 불러온 것만으로 분해 중 표시를 만들지 않습니다. 계산식·처리량·영양분·기록·경제는 동일합니다. 방향과 성장 배율을 CSS 변수로 합성하여 서로 덮어쓰지 않으며, 저장된 먹기 상태는 실제 대상 쪽을 바라봅니다.

프레임 시간은 기존 공통 RAF의 dt에서만 가져옵니다. 이동/먹기/실제 성장/분해의 두 프레임 간격은0.22초, 일반 소비자 대기0.32초, 식물 대기·잎 자세·지렁이 피복/표면은1.2초입니다. native dialog·숨긴 탭·기존 reduced-motion 정지와 함께 멈춥니다. 별도 RAF/interval/CSS 반복 애니메이션·blur·필터·파티클을 추가하지 않았습니다.

## 실제 배경 수정과 전체 숲 배치

forest.svg의1200×470 좌표와 기존 두 나무 변환(292,325/.91 및673,310/.7)을 유지했습니다. 수관의 작은 가지·잎 결, 낮은 풀숲, 마른 낙엽, 어두운 부식층과 토양 층위·뿌리를 보강했습니다. 오른쪽은 기존 수관(1162,142)/줄기(1161,221) 지지점에 맞춰 실제 줄기·가지·수관과 풀숲·낙엽·뿌리를 그렸습니다. 배경 그림은 새 먹이 자원이나 개체로 세지 않습니다.

점선 경계 제거, 숲 배경→가까운 적합 서식지, 넓어진 실제 가로 범위, 기존 생물 살펴보기 우선순위, 실패 시 카드 선택 유지와 기존 먹이/수용량/장애물/재도입/대기 조건을 그대로 유지합니다.24종×좌/중/우72개 배치를 실제 브라우저에서 재검증했습니다. 오른쪽 강아지풀 실제 좌표 x=0.89963504, 화면 x=986px(폭1096px)였으며 투영만 오른쪽으로 옮긴 것이 아닙니다. 오른쪽 풀→방아깨비→개구리의 실제 먹기·포식, 소나무→송충이 먹기, 유기물·지렁이 처리도 확인했습니다.

## 보존 계약

24종(생산자5/소비자16/분해자3),27관계(A5/B22)와 ID/화살표 방향, 최대30개체, hunger1.6/포식자 포만1.0, 지렁이120/3 모델, 성장/번식/수명/먹이/분해/환경 계수, 포인트/경제/보상/초기0점/카드 해금/반복 숲/goal1·2, schema17/ecology2/pacing1/eco-system:forest-save,0.5초 tick·공통 RAF·정적 Pages·기존 마이그레이션을 유지합니다. 느낌표·그림 모션 확인으로 포인트를 지급하지 않습니다.

보호한 data/state/services/systems 80개 중78개는 바이트 해시가 같습니다. 변경된2개는 decomposition/feeding의 일시적인 실제 분해량 출력 연결뿐입니다. 이전 결과 JSON **114개 모두 해시 동일**합니다. 새 저장 필드/버전 변경은 없습니다.

## 검증 결과

- 기존 단위1474개 통과. 새 자산/실제 상태 연결53개 통과(합계1527개). 기존 전체 실행 로그의 신규 그룹52개에 마지막 방향 보존 검사1개를 추가한 뒤 신규53개 전부 재실행했습니다.
- 변경 전31개 브라우저 suite 통과. 변경 후31개 모두 통과. 마지막 저장 suite의 옛 단어 ‘손상’ 확인만 새 정확한 안내 문장으로 바꾸고 재실행했으며 저장/복원/이상 값/쓰기 횟수/초기화 검증은 그대로입니다. 최종30개체 검사를 함께 재실행했습니다.
-24종의 기본140 SVG뷰가 실제 래스터 이미지로 비어 있지 않고, 각 상태의 두 프레임 픽셀이 다름을 확인했습니다.15종 소비자의 실제 엔진 idle/move/eat와 두 프레임은 단위 검사, 브라우저에서는 실제 먹기 두 프레임과 dialog 정지·저장 복원을 확인했습니다.
- 카드/도감/먹이그물/상태창 각24종의 동일 자산 연결, 실제 분해자3종의 active0/1과 지렁이 covered-eat0/1·eat0/1, 성체 식물 leaf-turn0/1을 브라우저에서 확인했습니다.
-115개 표시 상태/5개 viewport: 가로 넘침 없음, native dialog 화면 안 배치, 닫기 버튼44px 이상, 텍스트 대비 실패0(불투명 UI 배경 계산; 숲 그림 위 모든 픽셀의 대비를 측정한 결과는 아님). 저장 안내12종×5크기도 가로 넘침 없습니다.
-20분 목표 프로필2개(즉시/보통),10분 저장+10분 이어하기1개, 관리/무관리24종×3seed6개, 총9개를 시작 HEAD와 결정적으로 비교했습니다. 최종 저장/경제/개체/환경 결과가 **9개 모두 동일**합니다. 보통 프로필 클리어930생태초, 즉시106.5초이며 실제 학생 플레이 시간 측정은 아닙니다.
- 오른쪽 숲20분 및10+10 이어하기는 기존 whole-forest 장시간 검사에서 최종 domain과 저장 경계 좌표가 같았습니다. 실제 먹기/포식/분해/환경 변화, 최대30, 자동 포인트0을 확인합니다.
- 브라우저의 실제 첫 숲 플레이는 세 미션0/3→1/3→2/3→3/3, 실제 선택 뒤 먹기/먹이 회복 확인과 안정 유지를 통과했습니다. 자동 조작의 active48초 결과이며 학생 수업 소요 시간으로 해석하지 않습니다.

| viewport | 변경 전 숲 영역 | 변경 후 숲 영역 | 지금 행동 버튼 | 페이지 높이 |
|---|---:|---:|---:|---:|
| 1280×800 | 1238×333 | 1238×333 | 119×46 | 864px |
| 1138×712 | 1096×247 | 1096×247 | 119×46 | 764px |
| 960×600 | 930×224 | 930×224 | 119×46 | 744px |
| 1366×768 | 1324×301 | 1324×301 | 119×46 | 832px |
| 412×915 | 390×378 | 390×378 | 119×46 | 1242px |

현재 할 일과 읽을 문장이 늘어나 페이지 세로 길이는 늘었습니다. 숲의 너비/높이는5크기 모두 유지했습니다. 작은 화면에서는 세로 스크롤, 카드/큰 먹이그물은 기존 방향의 내부 가로 스크롤을 사용합니다.

30개체×5크기150회 정확한 터치 선택, 기본 이름0/선택1/전체30/다시0, 상태창을 열어도 카드 선택 중 배치가 발생하지 않음, 저장 전후 모델 좌표 동일을 확인했습니다. 성능 계수는 **pending RAF 최대1 / 반복 interval0 / 움직이는 동안 geometry read0 / 기존 개체 DOM 유지**입니다. 겹침/경계는 tests/visual-assets.regression-results.json에5크기 실측을 기록했습니다. CSS hit 영역 최소48px, 밖으로 나간 개체0이며, 자연스럽게 겹친 그림은 후보 선택 창으로 정확히 고릅니다. 성능 수치는 PC Edge 짧은 구간 검사로 S5e의 FPS/전력/온도 측정이 아닙니다.

### 결과 파일과 전후 근거

- [브라우저 자산·실제 상태 결과](tests/visual-assets.browser-results.json)
- [9개 장시간 전후 비교](tests/visual-assets.ecology-results.json)
- [회귀·배치·성능·변경 계약 요약](tests/visual-assets.regression-results.json)
- 세부 로그/캡처 위치: C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work (stage15_12-*). 구현 복사본이 아닌 검사 결과입니다.
- [변경 전 숲](C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work/stage15_12-before-screens/stage15_11_6-after-first-forest.png)
- [변경 후 숲](C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work/stage15_12-final-screens/stage15_11_6-after-first-forest.png)
- [24종 그림 모음](C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work/stage15_12-final-screens/stage15_12-24-species.png)
- [실제 먹기](C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work/stage15_12-final-screens/stage15_12-live-grasshopper.png)
- [분해와 지렁이](C:/Users/User/Documents/Codex/2026-10-06/4-github-pages-samsung-galaxy-tab/work/stage15_12-final-screens/stage15_12-decomposition-worm.png)

## 한계와 Galaxy Tab S5e·학급 확인

그림은 교육용 관찰 도식으로 사진 수준의 종 식별 도해가 아닙니다. 동일 화풍의 최소 두 프레임으로 동작을 구분하며 부드러운 다중 프레임 애니메이션은 아닙니다. 실제 크기 비율·미생물 크기를 재현하지 않으며 고초균은 확대 설명이 있습니다. 도감·카드·상태창의 표본 그림은 정지 프레임입니다. 공유 자원의 분해 위치를 새로 시뮬레이션하지 않습니다.

실기기 확인: 가로1138×712 근처와 실제 브라우저 주소창·화면 확대·Samsung 글꼴, 작은 곤충/먹기 표시와 지렁이 피복 식별,30개체에서10~20분 프레임/메모리/발열/배터리, 회전·백그라운드 복귀·절전·오프라인 캐시·저장 제한, 실제 손가락 정확도와 먹이그물 스크롤을 확인해야 합니다. 초등4학년 학생이 ‘카드 고르기→숲에 놓기→💡 확인→실제 변화 관찰’과 클리어 후 추가 탐구를 스스로 이해하는지 학급에서 확인해야 합니다. 브라우저 자동화 통과로 수업 적합성이나15~20분 소요를 입증했다고 주장하지 않습니다.

## GitHub Desktop용 영문 문구

Summary:

Refine student-facing UI and add animated forest visuals

Description:

Polish student-facing goals, text, next-action controls, selection feedback, and save guidance. Preserve full-forest placement and right-side habitat use. Refresh all24 species with original local SVG assets, add per-species state-based two-frame motion, and improve canopy, undergrowth, litter, soil, and the right forest background.

Preserve ecology, economy, unlock, replay, learning-goal, and save contracts. Validate regression suites, browser layouts, all species assets, real feeding/decomposition motion,30-organism selection/performance,20-minute ecology, and save-resume flows. Galaxy Tab S5e and classroom validation remain pending.

## GitHub Desktop Changes 전체 파일

수정 17개:

- `RCHITECTURE.md`
- `README.md`
- `assets/images/forest.svg`
- `index.html`
- `js/main.js`
- `js/systems/decomposition.js`
- `js/systems/feeding.js`
- `js/ui/collection-dom.js`
- `js/ui/field-guide-view.js`
- `js/ui/forest-flow.js`
- `js/ui/forest-view.js`
- `js/ui/organism-layer.js`
- `js/ui/population-view.js`
- `js/ui/render.js`
- `tests/persistence.browser.test.cjs`
- `tests/run-tests.mjs`
- `tests/student-ux.ecology.mjs`

추가 35개:

- `STAGE15_12_VISUAL_ASSETS_AND_UX_POLISH.md`
- `assets/images/species/README.md`
- `assets/images/species/aphid.svg`
- `assets/images/species/bulbul.svg`
- `assets/images/species/caterpillar.svg`
- `assets/images/species/chipmunk.svg`
- `assets/images/species/earthworm.svg`
- `assets/images/species/field-mouse.svg`
- `assets/images/species/frog.svg`
- `assets/images/species/goshawk.svg`
- `assets/images/species/grass.svg`
- `assets/images/species/grasshopper.svg`
- `assets/images/species/hazel.svg`
- `assets/images/species/ladybird.svg`
- `assets/images/species/litter-mold.svg`
- `assets/images/species/mushroom.svg`
- `assets/images/species/oak.svg`
- `assets/images/species/pine.svg`
- `assets/images/species/rabbit.svg`
- `assets/images/species/raspberry.svg`
- `assets/images/species/snail.svg`
- `assets/images/species/snake.svg`
- `assets/images/species/soil-bacteria.svg`
- `assets/images/species/spider.svg`
- `assets/images/species/tit.svg`
- `assets/images/species/weasel.svg`
- `css/species-visuals.css`
- `js/ui/species-visuals.js`
- `tests/visual-assets.browser-results.json`
- `tests/visual-assets.browser.cjs`
- `tests/visual-assets.ecology-results.json`
- `tests/visual-assets.regression-results.json`
- `tests/visual-assets.test.mjs`
- `tests/visual-fixtures.mjs`
- `tools/build-species-art.mjs`

삭제0개. 기존 legacy SVG/placeholder 정의는 과거 근거·호환 자료로 남아 있으나 현재24종의 렌더링에는 새 자산을 사용합니다. 커밋·푸시는 사용자가 직접 진행합니다.
