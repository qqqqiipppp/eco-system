# 15.7단계 현재 계약

24종·생산자5/소비자16/분해자3 유지. 기존22관계를 보존하고 연구 근거의 B관계5개를 추가해 총27개(A5/B22)를 사용합니다. 참지렁이는 낙엽 섭식과 토양 기여를 하는 소비자이며 홍단딱정벌레·족제비·고슴도치의 먹이가 될 수 있습니다. 청동풍뎅이→고슴도치, 솔나방 유충→직박구리도 B 단순화입니다. 최근접 탐색·거리·매복·성장·수명·분해·경제 설정은 유지합니다.

저장16/생태개정2/시간개정1 유지. 누적 관계 복원 상한과 도감 관계 수는 현재 정의에서 구합니다. 기존22관계 기준 검사는 별도 테스트 로더로, 실제27관계는 확장 검사·장시간 전후 비교·브라우저에서 검증합니다. 실기기 S5e 결과는 아닙니다.

[15.7 근거·균형·저장·검사·변경 목록](STAGE15_7_FOOD_WEB_EXPANSION.md). 아래 내용은 이전 단계 기록이며 관계 수·현재 식성은 이 계약을 우선합니다.

---

# 14단계 현재 계약

기존 food-relations.js의22개(A5/B17), 먹이→먹는 생물 방향, 먹이 부분과 근거 ID를 수정하지 않았습니다. 새 화면은 이 데이터에서만 목록을 만들고 누적 발견/이번 숲 발견/미발견/잠금 여부를 구분합니다. 카드를 얻는 것만으로 관계를 발견하지 않습니다. 낙엽 섭식·균류/세균 분해는 별도 설명이며22에 더하지 않습니다. 최초 발견12점은 누적 원장으로 한 번만 지급합니다.

[카드 해금](FOREST_CARD_UNLOCKS.md) · [도감·먹이그물](FOREST_FIELD_GUIDE.md) · [반복 숲·경제·저장](FOREST_REPLAY_SYSTEM.md) · [완료 보고](STAGE14_REPORT.md)

---

아래는 이전 단계의 설계·검증 이력입니다. 현재 기능은 위 14단계 계약을 우선합니다.

# 11.55단계 구조 조사 및 먹이그물 감사

조사일 2026-10-12. 생물 코드 수정 전에 작성한 기준표. 실제 저장소 `C:/Users/User/Documents/GitHub/eco-system`은 조사 시작 시 깨끗했다.

## 수정 전 ID·생애·참조 계약

|ID|기존 이름|확정 이름|기존 생애 / 분|보충|관계 수|저장 참조|
|---|---|---|---|---|---|---|
|oak|상수리나무|상수리나무|individual 180–240|없음|3|inventory/organisms/life/population/cooldowns|
|grass|풀|강아지풀|individual 24–32|없음|4|inventory/organisms/life/population/cooldowns|
|grasshopper|메뚜기|방아깨비|individual 14–20|egg-hatch|3|inventory/organisms/life/population/cooldowns|
|frog|개구리|참개구리|individual 55–75|없음|4|inventory/organisms/life/population/cooldowns|
|rabbit|토끼|멧토끼|individual 55–80|없음|2|inventory/organisms/life/population/cooldowns|
|mushroom|버섯|구름송편버섯|colony 12–18|없음|0|inventory/organisms/life/population/cooldowns|
|pine|소나무|소나무|individual 150–210|없음|1|inventory/organisms/life/population/cooldowns|
|raspberry|산딸기|산딸기|individual 70–100|없음|1|inventory/organisms/life/population/cooldowns|
|hazel|개암나무|팽나무|individual 90–120|없음|2|inventory/organisms/life/population/cooldowns|
|chipmunk|다람쥐|다람쥐|individual 50–70|없음|5|inventory/organisms/life/population/cooldowns|
|field-mouse|등줄쥐|고슴도치|individual 32–46|immigration|4|inventory/organisms/life/population/cooldowns|
|caterpillar|나방 애벌레|솔나방 애벌레(송충이)|individual 12–18|larval-recruitment|4|inventory/organisms/life/population/cooldowns|
|aphid|진딧물|청동풍뎅이|individual 12–16|없음|3|inventory/organisms/life/population/cooldowns|
|snail|달팽이|명주달팽이|individual 45–65|없음|1|inventory/organisms/life/population/cooldowns|
|spider|거미|무당거미|individual 24–36|immigration|4|inventory/organisms/life/population/cooldowns|
|ladybird|무당벌레|홍단딱정벌레|individual 28–42|immigration|1|inventory/organisms/life/population/cooldowns|
|tit|박새|박새|individual 65–90|없음|2|inventory/organisms/life/population/cooldowns|
|bulbul|직박구리|직박구리|individual 65–95|없음|2|inventory/organisms/life/population/cooldowns|
|snake|유혈목이|유혈목이|individual 75–100|없음|1|inventory/organisms/life/population/cooldowns|
|weasel|족제비|족제비|individual 50–75|없음|4|inventory/organisms/life/population/cooldowns|
|goshawk|참매|참매|individual 90–120|없음|3|inventory/organisms/life/population/cooldowns|
|litter-mold|낙엽 분해 곰팡이|낙엽 분해 곰팡이 군집|colony 8–12|없음|0|inventory/organisms/life/population/cooldowns|
|soil-bacteria|토양 분해 세균|고초균|colony 5–9|없음|0|inventory/organisms/life/population/cooldowns|

ID는 카드 슬롯·배치 권한이며 분류학적 동일성이 아니다. 기존 23개 ID를 유지하고 생태 개정 번호와 현재/이전 관찰을 분리했다. 위 생애값·관계 수·보충은 **수정 전** 조사이며 현재값은 FOREST_SPECIES.md와 FOREST_LIFESPANS.md를 따른다. 모든 종의 역할은 변경 없이 생산자5/소비자15/분해자3이다. data → state → systems → UI를 main.js가 연결한다. 생성은 organism-instance/life-state, 계산은 feeding/population/lifespan/decomposition, 관찰/학습/목표는 events/activities/forest-progress/goal-guidance, 저장 검사는 save-format과 ecology-migration이 담당한다. 신규17종 잠금·공통 RAF·0.5초 tick·30개체 상한 유지.

### 활동·이벤트·목표 참조 범위

|기존 슬롯 ID|현재 직접 학습·목표 참조|이벤트·저장 참조 처리|
|---|---|---|
|oak|상수리나무는 초기 카드; rabbit_habitat의 생산자 다양성 조건에 기여|식물 성장·환경 이벤트; 기존 카드/개체/수명/누적 기록 유지|
|grass|producer_quiz 정답, grass_observation 제공 종, rabbit_habitat 필수 풀, 숲 목표 필수 종|새 잎 섭식 발견 v2_grass_to_grasshopper; 옛 풀 관찰은 역사|
|grasshopper|grass_observation 소비자, 숲 목표 필수 종, 핵심 포식 발견의 제공 종|두 핵심 관계의 새 ID; 옛 메뚜기 관찰은 역사|
|frog|grass_observation 완료 해금, producer_quiz 선택지, 숲 목표 필수 종|핵심 v2_grasshopper_to_frog; 기존 개구리 카드 권한·학습 보존|
|rabbit|rabbit_habitat 완료 해금, producer_quiz 선택지|현재 멧토끼 부족/먹이 이벤트; 기존 권한·학습 보존|
|mushroom|decomposer_classify 완료 해금·역할 학습|현재 구름송편버섯 군집/분해 설명; 기존 권한·학습 보존|
|pine / raspberry / hazel / chipmunk / field-mouse / caterpillar / aphid / snail / spider / ladybird / tit / bulbul / snake / weasel / goshawk / litter-mold / soil-bacteria|신규17종은 14단계 정식 해금 전; 개발 fixture 대상이며 새 핵심 클리어 필수종으로 추가하지 않음|현재 식성의 발견·소비자 부족 이벤트는 공통 데이터에서 생성. 전체23슬롯 inventory·organisms·life·population·cooldowns 참조를 삭제하지 않음|

## 수정 전 27개 관계

|번호|기존 relationId|제공 ID|이용 ID|부위|방식|이전 출처 키|
|---|---|---|---|---|---|---|
|1|grass_to_grasshopper|grass|grasshopper|leaves|resource|R1|
|2|grasshopper_to_frog|grasshopper|frog|animal|predation|R2|
|3|grass_to_rabbit|grass|rabbit|leaves|resource|R3|
|4|oak_to_chipmunk|oak|chipmunk|acorn|resource|R4|
|5|pine_to_chipmunk|pine|chipmunk|seeds|resource|R5|
|6|hazel_to_chipmunk|hazel|chipmunk|nut|resource|R4|
|7|oak_to_field_mouse|oak|field-mouse|acorn|resource|R6|
|8|grass_to_field_mouse|grass|field-mouse|seeds|resource|R6|
|9|caterpillar_to_field_mouse|caterpillar|field-mouse|animal|predation|R6|
|10|oak_to_caterpillar|oak|caterpillar|leaves|resource|R7|
|11|hazel_to_aphid|hazel|aphid|sap|resource|R8|
|12|grass_to_snail|grass|snail|leaves|resource|R9|
|13|aphid_to_ladybird|aphid|ladybird|animal|predation|R10|
|14|aphid_to_spider|aphid|spider|animal|predation|R11|
|15|caterpillar_to_spider|caterpillar|spider|animal|predation|R12|
|16|spider_to_frog|spider|frog|animal|predation|R12|
|17|caterpillar_to_tit|caterpillar|tit|animal|predation|R13|
|18|spider_to_tit|spider|tit|animal|predation|R13|
|19|raspberry_to_bulbul|raspberry|bulbul|fruit|resource|R14|
|20|frog_to_snake|frog|snake|animal|predation|R15|
|21|field_mouse_to_weasel|field-mouse|weasel|animal|predation|R16|
|22|grasshopper_to_weasel|grasshopper|weasel|animal|predation|R16|
|23|chipmunk_to_weasel|chipmunk|weasel|animal|predation|R17|
|24|frog_to_weasel|frog|weasel|animal|predation|R18|
|25|rabbit_to_goshawk|rabbit|goshawk|animal|predation|R19|
|26|chipmunk_to_goshawk|chipmunk|goshawk|animal|predation|R19|
|27|bulbul_to_goshawk|bulbul|goshawk|animal|predation|R20|

번식 4개: grass/grasshopper/rabbit/aphid. 보충 5개: grasshopper/caterpillar/spider/ladybird/field-mouse. 저장7·8·9는 슬롯·개체·생애·관찰·학습·보상·관리·누적 변화·대기를 보존해야 한다. 옛 관찰은 현재 관찰로 자동 인정하지 않는다. 카드 권한·학습·클리어 성취는 보호한다.

## 검증 결과

검증일 2026-10-12. 실제 열린 기관 본문·학술 원문을 확인했다. 먹이군을 해당 두 종의 직접 관찰로 확대하지 않았다. **A=해당 종 쌍 확인, B=소비자의 먹이군 자료를 대표 카드에 적용한 교육적 단순화, C=현재 종·단계를 뒷받침하지 못하는 추정/미확인**이다. C는 실행하지 않는다. 제외 관계가 자연계에서 절대로 일어나지 않는다는 뜻은 아니다.

기존27개 중 **의미 유지6, 종·행동·근거 수정11, 제외10**, 현재 종의 의미로 **신설5**다. 최종 **22개: A5/B17/C0**. 27−10+5=22이며 관계 수를 맞추려고 미확인 관계를 넣지 않았다. ID는 전부 ecologyRevision2의 `v2_`로 구분하므로 ‘유지’는 생태적 의미를 가리키며 옛 relationId를 그대로 쓰는 뜻이 아니다.

## 기존 27개 전수 판정

|번호|기존 relationId·의미|현재 종에 적용했을 때의 문제·자료 판단|판정|현재 관계·근거|
|---|---|---|---|---|
|1|grass_to_grasshopper · 풀잎→메뚜기|방아깨비의 벼과 잎 식성은 확인. 강아지풀 정확쌍은 미확인|수정|v2_grass_to_grasshopper · 잎 resource · B F1|
|2|grasshopper_to_frog · 메뚜기→개구리|참개구리 위내용물의 메뚜기목 확인. 방아깨비·크기별 정확쌍은 미확인|수정|v2_grasshopper_to_frog · animal predation · B F2|
|3|grass_to_rabbit · 풀잎→토끼|멧토끼의 풀 먹이군 확인. 강아지풀 정확쌍은 미확인|수정|v2_grass_to_rabbit · 잎 resource · B F3|
|4|oak_to_chipmunk · 도토리→다람쥐|다람쥐의 도토리 식성 확인. 상수리나무 정확쌍은 미확인|의미 유지|v2_oak_to_chipmunk · 도토리 resource · B F4|
|5|pine_to_chipmunk · 소나무씨→다람쥐|침엽수 씨앗 식성 확인. 자료의 시베리아소나무와 국내 소나무는 다른 종|의미 유지|v2_pine_to_chipmunk · 씨앗 resource · B F5|
|6|hazel_to_chipmunk · 개암→다람쥐|팽나무 열매는 개암 견과가 아님. 팽나무·다람쥐 쌍 미확인 C|제외|견과 자원과 함께 제거|
|7|oak_to_field_mouse · 도토리→등줄쥐|고슴도치에 옛 쥐의 도토리 식성을 이전할 근거 없음 C|제외|새 고슴도치 식성은 F18|
|8|grass_to_field_mouse · 풀씨→등줄쥐|고슴도치·강아지풀 씨앗 쌍 미확인 C|제외|씨앗 먹이 삭제|
|9|caterpillar_to_field_mouse · 유충→등줄쥐|변경된 두 종의 솔나방 유충·고슴도치 관계 미확인 C|제외|곤충 전체를 무조건 연결하지 않음|
|10|oak_to_caterpillar · 참나무잎→나방 유충|솔나방의 소나무 솔잎 식성이 확인됨. 옛 참나무 유충 모델 부적합|제외 후 대체|신설 v2_pine_to_caterpillar · A F6|
|11|hazel_to_aphid · 개암 수액→진딧물|팽나무·청동풍뎅이 성충에 진딧물 수액 섭식을 적용할 수 없음|제외; 다른 행동 신설|새 v2_hazel_to_aphid · **잎** resource · A F19; 옛 수액 사건과 별개|
|12|grass_to_snail · 풀잎→달팽이|농사로 명주달팽이의 식물 잎 이용 확인. 강아지풀 정확쌍·국명 대응 한계|수정|v2_grass_to_snail · 잎 resource · B F7|
|13|aphid_to_ladybird · 진딧물→무당벌레|청동풍뎅이·홍단딱정벌레 성충의 정확쌍 미확인 C. 옛 진딧물 포식 부적합|제외|홍단딱정벌레의 새 연체동물 관계 F17|
|14|aphid_to_spider · 진딧물→거미|무당거미의 딱정벌레목 먹이 DNA 확인. 청동풍뎅이 정확쌍·그물 포획 크기 미확인|수정|v2_aphid_to_spider · animal predation · B F8; 근거리 대기만|
|15|caterpillar_to_spider · 유충→거미|이동형 일반 거미에서 무당거미로 변경. 솔나방 유충의 그물 포획 자료 미확인 C|제외|기존 추격·포식 연결 제거|
|16|spider_to_frog · 작은 거미→개구리|무당거미·참개구리 정확쌍과 먹이 크기 미확인 C|제외|작은 거미 일반 식성을 새 종으로 자동 이전하지 않음|
|17|caterpillar_to_tit · 나방 유충→박새|산림청 솔나방 본문에서 유충을 먹는 박새 명시|수정|v2_caterpillar_to_tit · animal predation · **A F6**|
|18|spider_to_tit · 거미→박새|Parus minor의 거미 식성 확인. 무당거미 정확쌍·크기 미확인|수정|v2_spider_to_tit · animal predation · B F9|
|19|raspberry_to_bulbul · 산딸기열매→직박구리|일본 현장 조사에서 두 학명 사이 과실 이용 확인|의미 유지|v2_raspberry_to_bulbul · 열매 resource · **A F10**|
|20|frog_to_snake · 개구리→유혈목이|유혈목이의 개구리 먹이군 확인. 참개구리 정확쌍 직접 관찰을 인용한 것은 아님|수정|v2_frog_to_snake · animal predation · B F11|
|21|field_mouse_to_weasel · 등줄쥐→족제비|고슴도치로 변경됐으므로 쥐 먹이 근거 적용 불가. 고슴도치 쌍 미확인 C|제외|고슴도치를 쥐 먹이로 처리하지 않음|
|22|grasshopper_to_weasel · 메뚜기→족제비|족제비의 곤충 먹이군 확인. 방아깨비 정확쌍 미확인|수정|v2_grasshopper_to_weasel · animal predation · B F12|
|23|chipmunk_to_weasel · 다람쥐→족제비|족제비의 chipmunk/squirrel 먹이군 확인. 한국 다람쥐 특정쌍 미확인|의미 유지|v2_chipmunk_to_weasel · animal predation · B F12|
|24|frog_to_weasel · 개구리→족제비|중국 조사에서 Rana dybowskii 검출. 참개구리와 다른 종이므로 먹이군 단순화|수정|v2_frog_to_weasel · animal predation · B F13|
|25|rabbit_to_goshawk · 토끼→참매|기관 자료의 토끼류 식성 확인. 멧토끼 정확쌍 미확인|수정|v2_rabbit_to_goshawk · animal predation · B F14|
|26|chipmunk_to_goshawk · 다람쥐→참매|기관 자료의 다람쥐 먹이 확인; 해당 두 학명 쌍의 직접 연구로 격상하지 않음|의미 유지|v2_chipmunk_to_goshawk · animal predation · B F14|
|27|bulbul_to_goshawk · 직박구리→참매|일본 참매 둥지 먹이 표의 Hypsipetes amaurotis 확인|의미 유지|v2_bulbul_to_goshawk · animal predation · **A F15**|

## 현재 실행 관계 22개

표의 ‘수정/유지/신설’은 위 전수 감사 기준이다. 모든 관계가 실제 가까운 개체의 먹이 탐색·resource 섭식 또는 predation 포식에 구현된다. 식물 부위는 동일 식물의 공통 foodStock을 이용하며 별도의 무한 자원이 아니다. 각 F키의 실제 링크와 확인 내용은 다음 출처표를 따른다.

|relationId|자원 제공/먹히는 종 → 소비자|부위|섭식 방식|근거|기존 대비|자료 한계|
|---|---|---|---|---|---|---|
|v2_grass_to_grasshopper|강아지풀 → 방아깨비|잎|resource|B F1|수정|벼과 먹이군; 특정쌍 미확인|
|v2_grasshopper_to_frog|방아깨비 → 참개구리|동물|predation|B F2|수정|메뚜기목; 크기·특정쌍 미확인|
|v2_grass_to_rabbit|강아지풀 → 멧토끼|잎|resource|B F3|수정|풀 먹이군|
|v2_oak_to_chipmunk|상수리나무 → 다람쥐|도토리|resource|B F4|의미 유지|참나무 도토리 먹이군|
|v2_pine_to_chipmunk|소나무 → 다람쥐|씨앗|resource|B F5|의미 유지|침엽수 먹이군; 국내 소나무 특정쌍 아님|
|v2_pine_to_caterpillar|소나무 → 솔나방 애벌레(송충이)|솔잎|resource|A F6|신설|기관의 소나무 유충 섭식;량은 게임값|
|v2_grass_to_snail|강아지풀 → 명주달팽이|잎|resource|B F7|수정|식물 잎 먹이군; 국명·학명 대응 추가확인|
|v2_aphid_to_spider|청동풍뎅이 → 무당거미|성충 동물|predation|B F8|수정|딱정벌레목 DNA; 종별 포획·크기 미확인|
|v2_caterpillar_to_tit|솔나방 애벌레(송충이) → 박새|유충 동물|predation|A F6|수정|종별 천적 문구; 모든 성장단계 보장 아님|
|v2_spider_to_tit|무당거미 → 박새|동물|predation|B F9|수정|거미 먹이군; 크기·종쌍 미확인|
|v2_raspberry_to_bulbul|산딸기 → 직박구리|열매|resource|A F10|의미 유지|일본 현장 자료; 국내 장소별 관찰 아님|
|v2_hazel_to_bulbul|팽나무 → 직박구리|열매|resource|B F16|신설|팽나무를 이용한 새의 먹이군; 특정쌍 근거 격상 안 함|
|v2_frog_to_snake|참개구리 → 유혈목이|성체 동물|predation|B F11|수정|개구리 먹이군|
|v2_grasshopper_to_weasel|방아깨비 → 족제비|동물|predation|B F12|수정|곤충 먹이군|
|v2_chipmunk_to_weasel|다람쥐 → 족제비|동물|predation|B F12|의미 유지|다람쥐류 먹이군|
|v2_frog_to_weasel|참개구리 → 족제비|성체 동물|predation|B F13|수정|DNA의 북방산개구리를 참개구리와 혼동하지 않음|
|v2_rabbit_to_goshawk|멧토끼 → 참매|동물|predation|B F14|수정|토끼류 먹이군|
|v2_chipmunk_to_goshawk|다람쥐 → 참매|동물|predation|B F14|의미 유지|기관 국명 자료; 직접 종쌍 연구 아님|
|v2_bulbul_to_goshawk|직박구리 → 참매|동물|predation|A F15|의미 유지|일본 둥지 먹이 자료|
|v2_snail_to_ladybird|명주달팽이 → 홍단딱정벌레|동물|predation|B F17|신설|성충 연체동물 + 종별 유충 달팽이 근거; 정확쌍 미확인|
|v2_grasshopper_to_field_mouse|방아깨비 → 고슴도치|동물|predation|B F18|신설|절지동물 먹이군; 모든 곤충 포식 주장 아님|
|v2_hazel_to_aphid|팽나무 → 청동풍뎅이|**성충의 잎**|resource|A F19|신설|일본 성충 식물 이용;량·재고 회복은 게임 단순화|

## 먹이 자료 확인 기록

본문 확인을 원칙으로 했다. 산림청·청주시·ZIN은 web 도구의 오류/차단이 발생하여 공개 URL을 승인된 읽기 요청으로 직접 열어 해당 본문을 확인했다. 접속 오류만으로 자료 확인을 주장하지 않았다. 게임 실행 중 외부 자료를 요청하지 않는다.

|키|실제 출처|확인 내용·한계|
|---|---|---|
|F1|[농촌진흥청 방아깨비](https://genebank.rda.go.kr/PB/st/cyberView.bo?ord_gb=0&species_id=ZE1AA0027&viewMenuList=0)|Acrida cinerea의 벼과 잎 섭식. 강아지풀 정확쌍은 없음|
|F2|[江口·島田·今村, 2025, 카메오카 논의 5종 개구리 식성 조사](https://www.jstage.jst.go.jp/article/izu/19/0/19_85/_pdf/-char/en)|Pelophylax nigromaculatus와 표2 메뚜기목 위내용물. 방아깨비 종별 기록은 아님|
|F3|[국립생물자원관 포유류 현장조사 가이드: 멧토끼](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1324&callmode=admin&catimage=&eclang=ko&start=50&um=s)|Lepus coreanus의 풀·나뭇가지 이용. 강아지풀 정확쌍 미확인|
|F4|[프랑스 생물다양성청 OFB: 다람쥐](https://ofb.gouv.fr/especes/tamia-de-siberie-tamias-sibiricus)|계절별 도토리 등 식단. 상수리나무 정확쌍 미확인|
|F5|[Handbook of Mammals of the World의 Tamias sibiricus 항목 공개본](https://zenodo.org/records/6818934)|침엽수 씨앗 식단. 서식지에 언급된 Pinus sibirica는 소나무 Pinus densiflora와 다름|
|F6|[산림청 산림병해충: 솔나방](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_01&viewType=detail)|Dendrolimus spectabilis의 소나무 솔잎 섭식 및 유충을 먹는 박새 명시. 연1회·유충 월동·유충 단계 구분 확인|
|F7|[농사로: 명주달팽이](https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10)|잎·꽃·열매 식해. 강아지풀 기주 및 국내 분류 대응은 미확인|
|F8|[2023 Frontiers 무당거미 DNA 먹이 연구](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1177446/full)|Trichonephila clavata 먹이 DNA의 딱정벌레목. 그물에 잡힌 것과 먹은 것의 시료 차이도 조사한 연구이며 청동풍뎅이 정확쌍은 미확인|
|F9|[일본 중부산림관리국 박새](https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html)|Parus minor가 거미 먹이 이용. 무당거미 종·개체 크기 직접 자료 아님|
|F10|[2022 일본 Rubus 3종의 정량적 씨앗 확산 연구](https://www.jstage.jst.go.jp/article/birdresearch/18/0/18_A1/_article/-char/en)|Rubus crataegifolius와 Hypsipetes amaurotis 현장 과실 이용. 자연계 씨앗 확산과 게임 섭식량 구분|
|F11|[청주시 우암산 자연생태: 유혈목이](https://www.cheongju.go.kr/nongjeong/contents.do?key=17378)|개구리 먹이군. 참개구리 정확쌍 직접 관찰 자료 아님|
|F12|[2018 Mammalian Species: Mustela sibirica](https://academic.oup.com/mspecies/article/50/966/109/5102491)|곤충·chipmunk/squirrel 식단. 방아깨비·한국 다람쥐 정확쌍 아님|
|F13|[2022 중국 동북부 족제비과 DNA 식단 분석](https://pmc.ncbi.nlm.nih.gov/articles/PMC9738120/)|족제비 먹이의 Rana dybowskii. 참개구리가 아니라 북방산개구리이므로 B|
|F14|[국립생태원 참매](https://www.nie.re.kr/nie/pgm/edSpecies/view.do?menuNo=200121&speciesSn=71)|본문 생태의 토끼·청설모·다람쥐 식성. 토끼류를 멧토끼 정확쌍 연구라 하지 않음|
|F15|[2018 Ornithological Science 17:229–235](https://www.jstage.jst.go.jp/article/osj/17/2/17_229/_pdf/-char/en)|참매 둥지 먹이 표1에 Hypsipetes amaurotis. 예전 Accipiter gentilis 명칭의 유라시아 개체 자료|
|F16|[2012 일본 조류학회지 61:100–111, 해안림 과실 이용 연구](https://www.jstage.jst.go.jp/article/jjo/61/1/61_1_100/_pdf)|팽나무 Celtis sinensis의 새 먹이 자원. 이 감사에서는 초록의 먹이군 근거만 사용하여 B|
|F17|[러시아 과학원 ZIN, 포식성 딱정벌레 사육 지침](https://www.zin.ru/Animalia/coleoptera/rus/worldc2.htm) + [청주시 홍단딱정벌레](https://www.cheongju.go.kr/nongjeong/contents.do?key=17364)|ZIN의 C. smaragdinus 달팽이 문구는 **유충** 단계. 성충은 청주시의 야행성·연체동물·작은곤충 식성으로 보완. 명주달팽이 정확쌍은 미확인|
|F18|[국립생물자원관 고슴도치, p.65](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=65&um=s)|Erinaceus amurensis의 야행성·절지동물 포함 잡식성. 방아깨비 정확쌍 미확인|
|F19|[Nakano 2015, Anomala albopilosa 성충의 식물 이용 조사](https://www.jstage.jst.go.jp/article/jjeez/26/2/26_55/_pdf)|p.56 방법5의 섭식 행동·흔적 확인, p.60 표5의 Celtis sinensis. 2002–2014 일본 도쿄 관찰 목록이며 국내 현장 자료가 아님|

## 연결성·단계·분해 판단

자료 확인 전 청동풍뎅이 성충의 먹이가 없어 고립된 상태였다. F19 원전에서 **팽나무를 이용하는 성충** 자료를 확인한 뒤 잎 관계를 추가해 현재 소비자15종 모두 최소1개 먹이를 가진다. 진딧물 수액·빠른 번식·유충 뿌리 먹이는 연결하지 않는다. 먹이쌍 존재만으로 생존이 보장되는 것은 아니다. 배치 거리·자원 고갈·환경·포식 경쟁·수명 종료로 감소가 일어날 수 있다.

무당거미는 배치 지점을 떠나 먹이를 쫓지 않는다. 가까운 딱정벌레 성충 먹이를 이용하는 최소 대기 모델이다. 실제 그물 생성·포획·먹이 크기·고도는 미구현이다. 솔나방은 유충 카드의 `life_stage_exit`가 유지되어 같은 그림의 성충 나방으로 남지 않는다. 고슴도치·홍단딱정벌레·무당거미의 옛 쥐/무당벌레/일반거미 자동 유입은 제거했다.

구름송편버섯→wood, 낙엽 분해 곰팡이 군집→litter, 고초균→remains는 기존 기초 분해 대상의 우선 연결이다. 동물처럼 살아 있는 먹이를 추격하지 않는다. 각각 그 물질만 이용하는 자연계 독점 관계라는 뜻도 아니다. 토양 양분 환원·군집 갱신은 공통 시스템을 재사용하며 정밀 물질 수지·영양소별 순환은 미구현이다.

## 기존 학생 진행·관찰 호환

speciesId는 23개 모두 유지하되 ecologyRevision2의 새로운 종 정의와 저장 schemaVersion10으로 분리한다. version7·8·9의 27개 관찰 ID와 옛 이름은 `legacyEcology` 역사로 보관하고 현재22개의 직접 게임 관찰로 인정하지 않는다. 획득 카드 권한·학습 완료·클리어·포인트·보상·관리 기록은 보존한다. 종 의미가 변한 생존·수명·번식 대기는 명시적인 이전으로 조정하거나 역사에 보관한다.

특히 옛 `hazel_to_aphid`의 개암 수액→진딧물 관찰은 새 `v2_hazel_to_aphid`의 팽나무 잎→청동풍뎅이 성충 관찰과 별개다. 같은 슬롯 쌍 때문에 역사 이름을 새 종으로 덮거나 관찰을 자동 인정하지 않는다. 과거 보상은 재관찰에서 중복 지급하지 않는다.

강아지풀→방아깨비와 방아깨비→참개구리의 2개 B 핵심 관계는 실제 섭식 완료 이벤트·발견·활동·해금·목표에 연결한다. B에 대한 한계는 학생 설명에 함께 표시한다. 옛 학습·클리어 성취를 삭제하지 않되 아직 클리어하지 않은 학생의 새로운 현재 관찰은 실제로 다시 획득하도록 한다. 초기3카드와 신규17종 잠금은 유지한다.

## 미확인 사항과 11.6 연결

17개 B 관계의 정확한 종쌍·국내 장소별 직접 관찰은 확정하지 않았다. 강아지풀·방아깨비, 방아깨비·참개구리, 명주달팽이·홍단딱정벌레의 종별 직접 기록과 먹이 크기가 우선 과제다. 명주달팽이의 농사로 국명과 국내·국제 분류 대응도 미해결이다. 홍단딱정벌레 속 배치는 문헌 체계마다 달라 별도 분류 검토가 필요하다.

11.6의 대표5종은 강아지풀·방아깨비·참개구리·멧토끼·구름송편버섯. 현재 먹이 자원·섭식·환경·수명·군집·번식의 연결 지점을 재사용한다. 한해살이 씨앗 세대, 방아깨비 알/약충/성충, 참개구리 올챙이와 물 서식지, 멧토끼 새끼, 구름송편버섯 자실체는 후속 범위다. 이번에는 상세 성장·새 연못·새 이미지·정식17종 해금·최종35–40분 밸런스를 앞당겨 구현하지 않는다.
# 13.5단계 먹이그물 보존 확인

2026-10-14. 기존23카드/22관계(A5/B17)를 유지하고 참지렁이1개를 더해24카드다. 살아 있는 생물 사이의 기존 연결20종은 그대로이며 참지렁이는 공유 litter를 이용하는 토양동물 소비자다. 기존22개 relationId/발견12점/핵심2관계/먹이 근거를 추가·변경하지 않았다. 참지렁이 섭식과 분해자 관심 확인을 새 생물 간 관계 발견으로 인정하거나 포인트를 주지 않는다. 아래 전수 감사는 기존22관계의 근거다.
