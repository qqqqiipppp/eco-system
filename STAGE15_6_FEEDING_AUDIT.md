# 작은 숲 연구소 — 15.6단계 먹이 관계·포식 감사

검사일: 2026-10-15~16, 한국 시간. 실제 저장소: `C:/Users/User/Documents/GitHub/eco-system`.
시작 HEAD: `fc468cd485200752232fb6b8869471bde399fd86`. 시작 작업 트리는 깨끗했다. 기존 저장소를 직접 수정했으며 스테이징·커밋·푸시·Pages 설정 변경은 하지 않았다.

## A. 현재 구현 분석

### 보존 계약과 검사 경로

24종(생산자5·소비자16·분해자3), 기존22관계(A5/B17), speciesId·relationId를 유지했다. 참지렁이는 소비자이고 별도 litter 섭식을 한다. 최대 실제 개체30, schemaVersion16, ecologyRevision2, pacingRevision1, 저장 키 `eco-system:forest-save` 유지. 포인트·중복 보상 방지·해금·도감·관찰·클리어 조건·이미지·환경·성장·수명·번식·분해 설정은 변경하지 않았다. 공통 RAF와0.5초 생태 tick 유지.

- 데이터: [관계](data/food-relations.js), [근거](data/food-evidence.js), [생태 설정](data/ecology-config.js), [24종](data/organisms.js), [배치·이동 설정](data/interaction-config.js).
- 실제 후보·이동·섭식: [feeding](js/systems/feeding.js), [food-resources](js/systems/food-resources.js), [placement-rules](js/systems/placement-rules.js), [wander](js/systems/wander.js).
- 생존·생애·분해: [population](js/systems/population.js), [lifecycle](js/systems/lifecycle.js), [lifespan](js/systems/lifespan.js), [development](js/systems/development.js), [decomposition](js/systems/decomposition.js).
- 화면과 연결: [habitat-presentation](js/systems/habitat-presentation.js), [habitat-anchors](js/systems/habitat-anchors.js), [organism-layer](js/ui/organism-layer.js), [main](js/main.js).
- 발견·저장: [events](js/systems/events.js), [save-format](js/services/save-format.js). 기존 [먹이그물 근거 감사](FOREST_FOOD_WEB_AUDIT.md)도 대조했다.

외부 생태 서버나 새 네트워크 의존성을 추가하지 않았다. 기존 정적 HTTP/Pages와 로컬 저장 방식이다. `file://` 실행이나 방문하지 않은 기기의 완전 오프라인 설치·캐시는 새로 보장하지 않는다.

### 후보와 선택 알고리즘

매 tick 현재 `state.organisms`를 byId/bySpecies로 색인한다. `relationsByConsumer`의 **모든 관계와 해당 종의 모든 개체**를 검색한다. 자기 자신·삭제된 대상·자원이 부족한 식물·소비자의 배치 조건에 맞지 않는 목적지를 제외한다. 이번에 현재 직선 추격 경로가 장애물을 통과하는 후보도 제외했다. 남은 후보 중 **실제 정규화 좌표 거리**가 탐색 반경 안에서 가장 짧은 대상을 고른다. 종별 확률·순환·그림상 거리·ID 이름 선호는 없다.

정확히 같은 거리에서는 기존 `<=` 비교 때문에 나중에 순회한 후보가 선택된다. 같은 위치의 참매 먹이3종은 원래 관계 순서에서 직박구리, 역순에서 멧토끼였다. 이 동률 의존성은 남겼다. 거리가 다르면 관계·생성 순서를 뒤집어도 같은 최근접 대상을 고른다. 새 무작위성·동률 우선순위는 도입하지 않았다.

`wander → searchFood → moveToFood → eat`. 진행 중인 유효한 목표는 더 가까운 먹이가 생겨도 바꾸지 않는다. 대상 소멸·고갈 시 취소하고 기존2초 재시도 후 다시 찾는다. 실패 직후 shortage는 잠시 켜질 수 있지만 대체 먹이를 찾으면 해제된다. 이는 숲 전체에 먹이가 없다는 뜻은 아니다. 우회 경로 AI는 없고 움직이는 먹이의 추격 실패에는 기존 시간 제한이 적용된다.

살아 있지만 건강이 나쁜 먹이를 제외하는 규칙이나 정밀 크기 모델은 없다. 사망·회수·생애단계 종료로 실제 제거된 개체는 먹이가 아니다. 새끼 멧토끼의 초기 비섭식 단계는 소비자 쪽 조건이다. 성장·건강·생애 처리 순서는 변경하지 않았다.

### 식물 섭식과 포식

식물은 `foodPart`를 허용 parts와 대조하고 `foodStock`에서 portion을 차감한다. 식물 개체는 남고 환경·성장·분해 기여에 따라 자원이 회복된다. **솔잎/씨앗, 팽나무 잎/열매의 종류는 구별하지만 양은 식물 개체별 공용 재고다. 부위별 독립 재고가 아니다.** 기존 단순화를 유지했다. 충분한 양이 있는 최근접 식물을 고르며 먼 식물의 더 많은 재고를 우선하지 않는다.

동물은 실제 살아 있는 대상·거리를 다시 확인하고 `removeOrganism(...,'predation')`으로 제거한다. 같은 tick에 byId에서도 지워 다른 포식자의 중복 섭식을 막는다. 성공 후에만 feedingEvents·배고픔 완화·마지막 섭식 시각을 갱신한다. 실제 신호가 발견 후보가 되며 학생 확인 후 관찰·최초12점이 생긴다. 반복 확인은 중복 지급하지 않는다. 참지렁이·분해자에 일반 포식 관계를 추가하지 않았다.

### 두 좌표와 점선 배치 영역

실제 position은 저장·배치·거리 판정, projection은 수관·줄기 등의 표시용이다. 화면상 가까워도 실제로 멀 수 있고 반대도 가능하다. 새의 쉬는 수관 위치가 곧 먹이 탐색 중심인 것은 아니다. 일반 포식자는 실제 목표 ID와 거리가 가까워지면 표시를 그 먹이 쪽으로 연결한다. 탐색 반경은 확대하지 않았다.

거미는 이번에 공통 추격 표시에서 제외했다. 실제 범위 안의 현재 포획 대상만 거미의 정지 위치에 접촉 표시하며 범위를 벗어나면 연결을 끊는다. 이는 포획 중 표시이고 새 생태 이동·그물·포식 성공을 만드는 기능이 아니다. 30개체 안의 캐시된 매복자 목록만 확인하며 타이머·DOM 측정 루프를 추가하지 않았다. 여러 거미의 같은 대상 표시는 기존 개체 순서를 따르고 실제 포식 승자는 feeding이 결정한다.

점선은 임시 물리 구역(ground x .08~.69/y .68~.78, activity x .08~.69/y .58~.78)이며 숲 그림의 모든 서식지 경계가 아니다. 일부 수관 터치는 기존 `placementPosition`에서 물리 y .72로 대응된다. 배치점과 최종 그림이 다를 수 있는 이유다. 원인·영향만 조사했고 배치 UI 전면 개편이나 저장 좌표 재배치는 하지 않았다.

## B. 22개 관계 전수 결과

각 행을 실제 `feeding.update`로 실행해 성공 신호·개체 제거/재고 감소를 확인했다. 실패 조건은 부재·탐색 범위 밖·목적지 장애물·먹는 도중 제거를 독립 실행했다. 식물은0재고·섭식 도중 고갈·회복도 검사했다. 발견 확인·한 번 보상·저장 복원까지 통과했다. [검사 원본](tests/feeding-audit.results.json).

A/B는 기존 근거 등급이다. 실행 성공이 야생 종 쌍의 과학적 입증은 아니다. 아래 근거 설명은 기존 data/food-evidence.js 대조 결과로,19개 원문을 모두 이번에 재열람했다고 주장하지 않는다.

|relationId|먹이·speciesId|먹는 생물·speciesId|자원/방식|성공|실패 검사|근거·불확실성|
|---|---|---|---|---|---|---|
|v2_grass_to_grasshopper|강아지풀 (grass)|방아깨비 (grasshopper)|leaves/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F1](https://genebank.rda.go.kr/PB/st/cyberView.bo?ord_gb=0&species_id=ZE1AA0027&viewMenuList=0) 방아깨비의 벼과 잎 먹이. 강아지풀 특정 쌍 직접 기록은 아님.|
|v2_grasshopper_to_frog|방아깨비 (grasshopper)|참개구리 (frog)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F2](https://www.jstage.jst.go.jp/article/izu/19/0/19_85/_pdf/-char/en) 2025 일본 조사 표2: 참개구리 위내용물의 메뚜기목. 방아깨비 특정 쌍은 아님.|
|v2_grass_to_rabbit|강아지풀 (grass)|멧토끼 (rabbit)|leaves/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F3](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1324&callmode=admin&catimage=&eclang=ko&start=50&um=s) 멧토끼의 풀 먹이군. 강아지풀 특정 쌍은 아님.|
|v2_oak_to_chipmunk|상수리나무 (oak)|다람쥐 (chipmunk)|acorn/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F4](https://ofb.gouv.fr/especes/tamia-de-siberie-tamias-sibiricus) 다람쥐의 도토리 먹이군. 상수리나무 특정 쌍은 아님.|
|v2_pine_to_chipmunk|소나무 (pine)|다람쥐 (chipmunk)|seeds/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F5](https://zenodo.org/records/6818934) 다람쥐의 침엽수 씨앗 먹이. 자료의 시베리아소나무를 국내 소나무와 동일 종이라 하지 않음.|
|v2_pine_to_caterpillar|소나무 (pine)|솔나방 애벌레(송충이) (caterpillar)|needles/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|A [F6](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_01&viewType=detail) 솔나방 유충의 소나무 솔잎 섭식, 유충을 먹는 박새, 연1회·유충 월동. 본문 직접 확인.|
|v2_grass_to_snail|강아지풀 (grass)|명주달팽이 (snail)|leaves/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F7](https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10) 명주달팽이의 잎·꽃·열매 식해. 강아지풀 특정 기주 기록은 아님.|
|v2_aphid_to_spider|청동풍뎅이 (aphid)|무당거미 (spider)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F8](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1177446/full) 무당거미 먹이의 DNA 연구.딱정벌레목 먹이군을 성충 카드로 단순화. 청동풍뎅이 특정 포식은 미확인.|
|v2_caterpillar_to_tit|솔나방 애벌레(송충이) (caterpillar)|박새 (tit)|animal/predation|통과|부재·거리·장애물·도중제거 거부|A [F6](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_01&viewType=detail) 솔나방 유충의 소나무 솔잎 섭식, 유충을 먹는 박새, 연1회·유충 월동. 본문 직접 확인.|
|v2_spider_to_tit|무당거미 (spider)|박새 (tit)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F9](https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html) Parus minor의 거미 먹이군. 무당거미 특정 쌍·개체 크기는 미확인.|
|v2_raspberry_to_bulbul|산딸기 (raspberry)|직박구리 (bulbul)|fruit/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|A [F10](https://www.jstage.jst.go.jp/article/birdresearch/18/0/18_A1/_article/-char/en) 일본 산딸기 Rubus crataegifolius와 직박구리의 현장 과실 이용.|
|v2_hazel_to_bulbul|팽나무 (hazel)|직박구리 (bulbul)|fruit/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|B [F16](https://www.jstage.jst.go.jp/article/jjo/61/1/61_1_100/_pdf) 해안림 새들의 팽나무 열매 자원 이용. 초록의 먹이군 근거로 B 채택; 특정 쌍 직접 증명으로 확대하지 않음.|
|v2_hazel_to_aphid|팽나무 (hazel)|청동풍뎅이 (aphid)|leaves/resource|통과|부재·거리·장애물·도중제거 거부·고갈/회복 확인|A [F19](https://www.jstage.jst.go.jp/article/jjeez/26/2/26_55/_pdf) Nakano 2015 p56 성충의 실제 섭식 행동·흔적 조사, p60 표5에 팽나무 Celtis sinensis. 일본 도쿄2002~2014 식물 이용 기록이며 국내 현장 검증은 아님. 잎 자원량·회복 속도는 게임 단순화.|
|v2_frog_to_snake|참개구리 (frog)|유혈목이 (snake)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F11](https://www.cheongju.go.kr/nongjeong/contents.do?key=17378) 유혈목이의 개구리 먹이군. 참개구리 특정 쌍은 아님.|
|v2_grasshopper_to_weasel|방아깨비 (grasshopper)|족제비 (weasel)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F12](https://academic.oup.com/mspecies/article/50/966/109/5102491) 족제비의 곤충·다람쥐류 식단. 방아깨비와 한국 다람쥐 특정 쌍은 아님.|
|v2_chipmunk_to_weasel|다람쥐 (chipmunk)|족제비 (weasel)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F12](https://academic.oup.com/mspecies/article/50/966/109/5102491) 족제비의 곤충·다람쥐류 식단. 방아깨비와 한국 다람쥐 특정 쌍은 아님.|
|v2_frog_to_weasel|참개구리 (frog)|족제비 (weasel)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F13](https://pmc.ncbi.nlm.nih.gov/articles/PMC9738120/) 족제비의 개구리 DNA는 Rana dybowskii. 참개구리로 적용하는 것은 먹이군 단순화.|
|v2_rabbit_to_goshawk|멧토끼 (rabbit)|참매 (goshawk)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F14](https://www.nie.re.kr/nie/pgm/edSpecies/view.do?menuNo=200121&speciesSn=71) 참매의 토끼류와 다람쥐 먹이. 멧토끼 특정 쌍은 미확인.|
|v2_chipmunk_to_goshawk|다람쥐 (chipmunk)|참매 (goshawk)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F14](https://www.nie.re.kr/nie/pgm/edSpecies/view.do?menuNo=200121&speciesSn=71) 참매의 토끼류와 다람쥐 먹이. 멧토끼 특정 쌍은 미확인.|
|v2_bulbul_to_goshawk|직박구리 (bulbul)|참매 (goshawk)|animal/predation|통과|부재·거리·장애물·도중제거 거부|A [F15](https://www.jstage.jst.go.jp/article/osj/17/2/17_229/_pdf/-char/en) 일본 참매 둥지 먹이 표1의 직박구리 기록.|
|v2_snail_to_ladybird|명주달팽이 (snail)|홍단딱정벌레 (ladybird)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F17](https://www.cheongju.go.kr/bluecity/contents.do?key=17364) 청주시 홍단딱정벌레 성충의 밤 연체동물·작은 곤충 식성. 명주달팽이 특정 쌍은 미확인. ZIN 달팽이 지침은 유충 자료라 성충의 직접 근거로 쓰지 않음.|
|v2_grasshopper_to_field_mouse|방아깨비 (grasshopper)|고슴도치 (field-mouse)|animal/predation|통과|부재·거리·장애물·도중제거 거부|B [F18](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=65&um=s) 고슴도치의 절지동물 먹이군. 방아깨비 특정 쌍은 미확인, 모든 곤충을 먹는다는 주장 아님.|

## C. 복수 먹이 집중 검사

|생물|각 먹이 단독|모두 있을 때|첫 목표 소멸|거리·접근·자원|순서 교환|
|---|---|---|---|---|---|
|참매|멧토끼·다람쥐·직박구리 각각 성공|각 종류가 최근접이면 선택|멧토끼 제거 후 다람쥐 포식|먼/막힌 멧토끼 대신 가능한 먹이|36조합 통과|
|족제비|방아깨비·다람쥐·참개구리 각각 성공|각 종류 최근접 선택|방아깨비 제거 후 다람쥐 포식|범위 밖/막힌 목적지 제외|36조합 통과|
|박새|솔나방 애벌레·무당거미 각각 성공|가까운 유효 대상|애벌레 제거 후 거미 포식|두 종류 모두 실제 접근 필요|8조합 통과|
|직박구리|산딸기·팽나무 각각 성공|재고 있는 최근접 열매|산딸기 제거 후 팽나무 섭식|0재고 거부·회복 후 섭식|8조합 통과|
|다람쥐|상수리나무·소나무 각각 성공|재고 있는 최근접 자원|상수리나무 제거 후 소나무 섭식|도토리/씨앗 구별·차감|8조합 통과|

모든 관계 순열과 정/역 개체 생성 순서, 각 종류가 가장 가까운 위치를 조합한96조건이다. 더 가까운 다른 먹이가 생겨도 진행 중 유효 목표를 유지하는 검사도5종 모두 통과했다.

참매 요구7상황은 세 종류 생존, 각 한 종류만 존재(3), 멧토끼 소멸, 범위 밖 먹이, 가까우나 목적지/경로 조건 불충족을 포함한다. 족제비에도 동일 조건을 적용했다. 멧토끼만 선택하는 일반적인 종 선호 버그는 재현되지 않았다. 개체 수·실제 거리·재고·정확한 동률·진행 중 추격에 따라 특정 먹이를 더 자주 먹는 것은 허용한다. 특정 학생 저장에서 보인 편향을 재현했다고 주장하지 않는다.

## D. 발견된 오류와 수정

### D1. 거미 포획 범위 이탈 후 섭식

거미 x .4, 청동풍뎅이 .41, y .72에서 eat 진입 후 먹이를 .43으로 옮긴다. 포획 반경 .025 밖이지만 일반 섭식 허용 .025×1.3=.0325 안이라 수정 전 포식1회·2→1개체였다. 수정 후0회·2개체 유지. .42의 범위 안 먹이는 정상 포식, 먼 먹이는 추격하지 않는다.

`feeding.js/eat`에 기존 매복 포획 반경 재검사만 추가했다. 종별 반경·속도·일반 섭식 허용·포만 시간은 유지했다.

### D2. 정지 거미의 화면상 추격

1200×340에서 실제 좌표가 고정된 거미가 eat 진입 시 표시 (292,204)→(480,244.8), 약192.38px 이동했다. 공통 접근 투영이 매복자에게도 적용된 오류다.

`habitat-presentation.js/rebuild·position`에서 거미를 기본 위치에 두고 실제 포획 중인 먹잇감 접촉만 연결했다. 이탈·제거 시 연결 해제, 생태 좌표 불변을 검사했다. 브라우저에서는 정지 먹잇감에 이동 delta가 없어 새 접촉 좌표가 다시 그려지지 않는 문제도 확인했다. organism-layer.js의 showStates에서 포획 시작·종료의 현재/직전 대상만 다시 그려 해결했다. 생태 개체 수·재고·보상 변화 없음. 정밀 그물·스프라이트는 미구현이다.

### D3. 막힌 가까운 먹이만 재추격

참매 .4, 멧토끼 .2, 다람쥐 .65, y .72와 x .29~.31의 전 높이 장애물. 목적지는 둘 다 유효하지만 멧토끼까지 직선이 막혔다. 시작 HEAD의 원본을 메모리에서 실행한40초 전후 비교: 수정 전 섭식0회·멧토끼 재추격, 수정 후 다람쥐1회 포식.

초기 검사 초안의 대체 먹이 .7은 허용 구역 밖이어서 폐기하고 유효한 .65에서 전후 재현했다. `feeding.js/clearApproach·findFood`는 이동 발자국 크기로 장애물을 확장해 직선 교차를 검사한다. 막힌 후보를 제외한 뒤 기존 최근접을 적용한다. 경로 밖 장애물은 좌/우 이동 모두 방해하지 않는다. 우회 AI·확률 추가 없음. 이는 인위적 장애물 fixture의 확정 결함이며 모든 실제 화면에 이 장벽이 있다는 뜻은 아니다.

### 남긴 한계

정확한 동률의 순회 의존, 식물 공용 재고, 크기·고도·그물 모델 부재, 소멸 후 짧은 재시도, 점선과 표시 좌표 차이, 이동 먹이의 추격 제한을 유지했다. 불확실한 선호·확률을 넣거나 기존 B근거를 A로 격상하거나 관계를 삭제하지 않았다.

## E. 회귀·브라우저·장시간 결과

### 자동 검사

수정 전669개(과거 시간314+현재355). 최종 **기존669+신규52=721개 통과**, 실패·건너뜀0(314+407). 신규 관계/선택/표시50개와 실제 이동 장시간2개를 [실행기](tests/run-tests.mjs)에 포함했다. 기존 검사 완화·삭제 없음. 저장7~16, 경제 원장·환경 학습 보상·일회성 복구 지원·해금·반복 숲·분해·성장·환경 사건·15.5공간 검사를 함께 실행했다.

### 장시간·저장

기존 결정적 경제 harness의20분3프로필은 수정 전 전체 저장 스냅샷·지표와 정확히 일치했다. 이 harness는 배회 이동을 사용하지 않아 아래 실제 이동 검사와 구분한다. [20분 원본](tests/feeding-audit.long-results.json).

|프로필|최종 개체|포식|포인트|클리어|수정 전 저장 비교|
|---|---|---|---|---|---|
|student|7|8|72|true|전체 일치|
|established|10|8|31|true|전체 일치|
|mixed24|11|13|12|false|전체 일치|

기존 spatial.long의10분→저장→10분 비교도 통과했다. 일시적 event-N 출처와0카운터를 정규화하는 기존 비교 조건을 유지했다. 표시 유무 분할 실행은 전체 스냅샷 일치.5회 실제 클리어·24카드·28점 반복 관리 예산 검사도 통과했다.

별도로 배회+추격30step/s의24종·30개체를20분 실행했다. 추가 배치·관리 없이 실제 발견 확인만 수행했다. 연속 실행 최종11개체, 포식9회,16관계·192점, 분해 처리43.644, 참지렁이 litter 처리6.522. 참매는 다람쥐·직박구리·멧토끼를 각각 실제로 먹었다. 무관리 혼합 fixture는 미클리어이며 학급 성공률로 해석하지 않는다.

실제 이동10분→저장→10분에서도 저장 순간 생물·카드·관찰·포인트·클리어 보존과 복원 후30상한·유일 포식/보상 ID를 확인했다. 기존 배회 위상·난수 상태는 저장되지 않으므로 이동을 포함한 분할 실행의 최종 개체 수가 연속 실행과 같다고 주장하지 않는다. [이동 장시간 원본](tests/feeding-audit.motion-results.json).

### 브라우저

최종 수정본에서 **기존 브라우저20묶음 전부 통과**했다. 신규1묶음을 합하면21묶음이다. [전체 회귀 결과](tests/feeding-audit.regression-results.json). 신규1묶음의 **9장면은 모두 통과**했다. 실제 Edge 1280×800·터치 context에서 실제 시계, DOM의 먹는 중 표시, 대상 제거, 안내 문구,44px 이상 개체 관찰 조작을 확인했다. 시작 상태와 배회 난수는 재현용 fixture이고 제품 디버그 옵션이 아니다.

|소비자 ID|먹이 ID|상황|섭식 표시의 두 기준점 거리|DOM|조작|
|---|---|---|---|---|---|
|goshawk|rabbit|실제 섭식|20.70px|대상 DOM 제거|관찰 터치 통과|
|goshawk|chipmunk|실제 섭식|16.39px|대상 DOM 제거|관찰 터치 통과|
|goshawk|bulbul|실제 섭식|15.80px|대상 DOM 제거|관찰 터치 통과|
|weasel|frog|실제 섭식|22.43px|대상 DOM 제거|관찰 터치 통과|
|tit|spider|실제 섭식|17.63px|대상 DOM 제거|관찰 터치 통과|
|bulbul|hazel|실제 섭식|21.38px|식물 유지|관찰 터치 통과|
|chipmunk|pine|실제 섭식|20.77px|식물 유지|관찰 터치 통과|
|spider|aphid|실제 섭식|12.22px|대상 DOM 제거|관찰 터치 통과|
|goshawk|chipmunk|기존 두 번 확인 회수 후 대체 포식|27.34px|대상 DOM 제거|관찰 터치 통과|

거리는 두 표시 transform 기준점의 거리이지 알파 픽셀 접촉 면적은 아니다. 모든 장면50px 미만, 거미의 표시 기준점은 포획 전후 동일했다. 멧토끼는 실제 기존 회수 버튼을 두 번 눌러 제거했으며 회수한 멧토끼를 먹었다는 신호는 없고 다람쥐 포식만 발생했다. 자동 확인 전 포인트0·발견 기록0도 확인했다. [브라우저 결과](tests/feeding-audit.browser-results.json), [브라우저 검사](tests/feeding-audit.browser.test.cjs).

저장된 거미 포획/참매 대체 포식 화면을 눈으로도 검토했다. 임시 그림·짧은 먹는 중 표시는 존재하지만 정밀 포식 애니메이션이나 학생의 실제 이해도를 보장하지 않는다. 발견 표시가 관찰 버튼 중심보다 우선하는 기존 동작을 존중하여 관찰 버튼 하단을 터치했다. 테스트 작성 중 자원 섭식 문구와 거미 시작 거리 등 fixture 오류는 바로잡았으며 실제 게임 오류로 집계하지 않았다.

### 현장 미확인

S5e 실기기 FPS·발열·배터리·장시간 터치 반응, 실제 학생의 먹이 대체 이해, 배포 Pages 및 미방문/오프라인 캐시는 미확인이다. PC Edge 터치 모사를 실기기 결과로 부르지 않는다. S5e에서는 참매3먹이, 멧토끼 회수 후 대체 먹이, 거미 정지·이탈, 숨겨진 이름과 발견 표시 우선 터치,20분/저장복원을 확인해야 한다.

## F. 다음 단계 후보 — 이번에는 추가 없음

분류는 연구 우선순위이지 채택 결정이 아니다.9후보의 정확한 국내 종 쌍 직접 자료를 이번에 확인한 것은 없다.

|분류|후보|자료 수준·주의|
|---|---|---|
|1 우선 검토|참지렁이→족제비|족제비 종 자료의 지렁이 먹이군. Amynthas koreanus 특정 쌍 아님. litter 섭식·토양 기여 감소 영향 검토.|
|1 우선 검토|솔나방 애벌레→족제비|족제비 자료의 애벌레 먹이군. 솔나방 종·단계 직접 증거 필요.|
|2 근거 보강|참지렁이→홍단딱정벌레|F17 연체동물·작은 곤충 근거에 지렁이를 자동 포함할 수 없음. 성충/유충·정확 종 조사 필요.|
|2 근거 보강|청동풍뎅이→고슴도치|F18 절지동물 먹이군. 특정 성충·크기·국내 고슴도치 자료 보강.|
|2 근거 보강|참지렁이→고슴도치|절지동물 근거는 환형동물인 참지렁이 증거가 아님. 해당 고슴도치 종의 지렁이 식단부터 확인.|
|2 근거 보강|산딸기→멧토끼|F3은 풀 먹이군. 열매/잎 구별·정확 종 자료 필요.|
|3 현재 보류|솔나방 애벌레→고슴도치|기존 감사에서 정확쌍 미확인으로 제외. 일반 곤충 식성으로 재도입하지 않음.|
|3 현재 보류|방아깨비→무당거미|DNA 연구의 메뚜기목 검출은 정확쌍·포획 크기·조우 증거가 아님. 그물 잔해와 실제 섭식도 구분. 현재 매복 모델 한계.|
|3 현재 보류|솔나방 애벌레→직박구리|현재 과실 이용 자료로 유충 관계를 추가할 수 없음. 종·단계 근거 확보 전 보류.|

이번에 본문 확인한 [Law 2018 족제비 종 논문](https://academic.oup.com/mspecies/article/50/966/109/5102491)은 지렁이·애벌레 먹이군을 정리한다. 우선순위 두 후보는 여기서 내린 연구 방향 추론이며 정확쌍 확인이 아니다. [무당거미 DNA 원연구](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1177446/full)는 딱정벌레목 등 검출과 그물 잔해/실제 섭식 증거의 차이도 논의한다. 청주시 F17은 이번 웹 도구에서 열기 실패해 기존 보관 설명 이상을 새로 확인했다고 적지 않았다.

다음에는 독립 부위 재고의 교육적 필요, 점선과 서식지 표시의 설명, 실제 그물·접촉 그림을 별도 범위로 결정한다. 기존22개 B17을 직접 종 쌍 조사처럼 설명하지 않는다.

## G. 변경 파일·GitHub Desktop

제품 변경3파일, 실행기1파일, 새 검사·결과·보고서. 전체 미커밋 목록:

- [STAGE15_6_FEEDING_AUDIT.md](STAGE15_6_FEEDING_AUDIT.md)
- [js/systems/feeding.js](js/systems/feeding.js)
- [js/systems/habitat-presentation.js](js/systems/habitat-presentation.js)
- [js/ui/organism-layer.js](js/ui/organism-layer.js)
- [tests/feeding-audit.browser-results.json](tests/feeding-audit.browser-results.json)
- [tests/feeding-audit.browser.test.cjs](tests/feeding-audit.browser.test.cjs)
- [tests/feeding-audit.long-results.json](tests/feeding-audit.long-results.json)
- [tests/feeding-audit.long.test.mjs](tests/feeding-audit.long.test.mjs)
- [tests/feeding-audit.motion-results.json](tests/feeding-audit.motion-results.json)
- [tests/feeding-audit.regression-results.json](tests/feeding-audit.regression-results.json)
- [tests/feeding-audit.results.json](tests/feeding-audit.results.json)
- [tests/feeding-audit.test.mjs](tests/feeding-audit.test.mjs)
- [tests/feeding-audit.validation-results.json](tests/feeding-audit.validation-results.json)
- [tests/run-tests.mjs](tests/run-tests.mjs)

영문 Summary:

    Audit feeding relations and fix pursuit and ambush edge cases

영문 Description:

    Verify all 22 existing feeding relations and alternative prey selection across five consumers.
    Reject blocked straight-line approaches, keep ambush capture within its existing radius, and preserve stationary spider presentation.
    Add feeding, discovery/reward, browser contact, and long-run save regression coverage.
    Preserve 24 species, schema 16, economy, progression, assets, and GitHub Pages structure.
