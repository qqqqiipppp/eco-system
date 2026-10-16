# 작은 숲 연구소 — 15.7단계 먹이그물 확장·균형 검증

작업일 2026-10-16(한국 시간). 실제 저장소 `C:/Users/User/Documents/GitHub/eco-system`.
시작 HEAD `6c9617104ce6415731382ee849ea0265d1c36222`, 시작 작업 트리 깨끗함. 기존 저장소에서 직접 작업했고 Git 스테이징·커밋·푸시·Pages 설정 변경은 하지 않았다.

## A. 기존 구조·15.6 완료 상태 확인

[15.6 감사](STAGE15_6_FEEDING_AUDIT.md), [기존 근거 감사](FOREST_FOOD_WEB_AUDIT.md), [종 정의](FOREST_SPECIES.md), data의 관계·근거·생물·분류·생태/개체군 설정과 feeding/food-resources/population/lifecycle/lifespan/decomposition/events/rewards/activities/save-format/collection-migration을 대조했다.

시작 기준 자동721개(과거시간314+현재407)와 브라우저21묶음이 모두 통과했다. 시작 결과는 [불변 기준 JSON](tests/food-expansion.baseline-results.json), [시작 브라우저 결과](tests/food-expansion.browser-before-results.json)에 보존했다. 15.6의 직선 접근 장애물 검사, 매복 범위 이탈 거부, 정지 거미 접촉 표시·정지 대상 다시 그리기가 코드에 있다.

24종(생산자5·소비자16·분해자3), 기존22관계의 전체 필드와 ID를 보존했다. 신규5개를 추가해 **27관계: A5/B22**. 기존 A/B 등급을 변경하지 않았다. 과거 ID ladybird/field-mouse/aphid/hazel은 각각 홍단딱정벌레/고슴도치/청동풍뎅이/팽나무 그대로다. 새 생물·이미지·퀴즈·강제 대기시간은 없다.

최대30개체, 공통 RAF,0.5초 tick, 성장·번식·수명·자연 종료·분해·환경·관리 수치, schemaVersion16/ecologyRevision2/pacingRevision1, `eco-system:forest-save`, 정적 상대경로를 유지했다. 생물 카드는 실제로 배치된 개체의 권한이며 카드를 얻는 것만으로 먹이를 생성하지 않는다.

제품 수정은 다섯 파일이다.

|경로|수정 지점·목적|
|---|---|
|[data/food-relations.js](data/food-relations.js)|foodRelations 끝에5개 추가. 기존22개는 순서·필드까지 그대로.|
|[data/food-evidence.js](data/food-evidence.js)|F20~F24 출처·확인 위치·정확쌍 미확인 한계. 런타임 외부 요청 없음.|
|[data/organisms.js](data/organisms.js)|5종의 짧은 설명·직박구리 짧은 caption을 현재 식성과 맞춤. 이름·ID·역할·이미지·서식지 변경 없음.|
|[js/services/collection-migration.js](js/services/collection-migration.js)|restoreCollection의 누적 관계 복원 상한22를 현재 관계 정의 수로 변경. 새27기록이 잘리는 오류 방지.|
|[js/ui/collection-view.js](js/ui/collection-view.js)|renderWeb의 총관계 수를 데이터에서 계산. 분해 설명의 고정22 문구 제거. 기존 화면 구조 유지.|

feeding.js/food-resources.js와 생존·분해·보상·해금·목표·타이밍 설정은 변경하지 않았다. 모든 새 관계는 기존 searchFood→moveToFood→eat, 최근접 유효 대상·실제 자원·거리·장애물 검사와 실제 제거를 사용한다. 분해자3종은 일반 동물 포식자가 아니다.

## B. 후보9개 연구

A는 정확한 두 종의 직접 먹이 이용 기록, B는 해당 소비자의 믿을 만한 먹이군 근거에 따른 교육적 단순화, C는 근거 또는 현재 모델이 부족해 미채택이다. 이번 신규 관계는 모두 보수적인 B다. 조사로 직접 종 쌍 A를 새로 확보했다고 주장하지 않는다.

### 실제 열람 자료와 위치

|키|실제로 확인한 자료·URL·위치|확인 범위와 한계|
|---|---|---|
|R1/F20|[국립생물자원관 곤충 도감226쪽](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1484&callmode=admin&catimage=&eclang=ko&start=226&um=s), 생태 문단|진홍단딱정벌레 성충의 지렁이 먹이군. 학명은 Coptolabrus smaragdinus branickii로 제시. 자료 내 하위분류군 표기이며 현재 카드의 홍단딱정벌레와 정확히 같은 명칭·개체군으로 간주하지 않음. 참지렁이 종 동정도 없음.|
|R2/F21|[Law 2018 종 논문](https://academic.oup.com/mspecies/article/50/966/109/5102491), Ecology/Diet|족제비 종에서 지렁이와 애벌레 먹이군을 정리. 인용된 Tatara & Doi 1994 원 조사 본문은 접근 실패하여 이번에 직접 확인했다고 하지 않음.|
|R3/F22/F23|[鉄谷 외2018 원논문 PDF](https://www.jstage.jst.go.jp/article/jjwrs/43/0/43_19/_pdf/-char/ja),21쪽 결과·22쪽 표2|일본 이토의 E. amurensis 113개체 위 내용물. 지렁이류5/113, 풍뎅이과20/113, 풍뎅이 유충은 별도1/113 행. 정확한 먹이 종·크기는 미확인. 국내 현장 조사로 바꾸어 말하지 않음.|
|R4|[김찬영2023 공주대 논문 초록](https://www.dbpia.co.kr/journal/detail?nodeId=T16625730), 국문/영문 초록·분변 분석|멧토끼 분변에서 Rubus sp. 검출. 원문31쪽 표·정확 종·먹은 부위는 확인 못함. 열매나 잎을 특정하지 않음.|
|R5|[무당거미 DNA 원연구](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1177446/full), Discussion·Supplemental Table1 안내|메뚜기목 등 분류군 검출과 그물 잔해/실제 섭식의 차이를 확인. 방아깨비 성충의 정확쌍·크기·포획 과정은 미확인.|
|R6/F24|[한국학중앙연구원 송충이 항목](https://encykorea.aks.ac.kr/Article/E0031100), 임경빈 집필·내용의 방제법①|솔나방 유충의 천적에 직박구리가 명시됨. 전문가 종합 설명이고 원 야생 관찰·령별 섭식 자료를 열람한 것은 아니어서 A로 격상하지 않음.|
|R7|[Fennell1965 국내 조류 위 내용물 원논문](https://www.jstage.jst.go.jp/article/jyio1952/4/3-4/4_3-4_172/_pdf),179쪽 직박구리 행|해당 행은 벌목·씨앗이다. 인접 박새 행의 유충을 직박구리 근거로 잘못 읽지 않았다. 새 솔나방 관계의 직접 증거로 쓰지 않음.|

청주시 기존 F17은 웹 도구에서 열기 실패했다. 위키·사육 블로그·검색 요약만으로 관계를 채택하지 않았다. R1의 성충 먹이군은 유충 전용 먹이 습성을 성충으로 이전한 주장이 아니다. 홍단딱정벌레의 참지렁이 포식은 정확쌍이 아닌 분류군·먹이군 B로 한정한다.

### 각 후보 판정

|먹이→소비자·국명/학명|직접 두 종 증거|먹이군·단계·부위|국내 적용·모델 판단|판정·채택|
|---|---|---|---|---|
|참지렁이 Amynthas koreanus → 홍단딱정벌레 Carabus smaragdinus|미확인|R1의 smaragdinus 하위군 표기 성충→지렁이류. 먹이는 동물 개체.|숲 바닥 포식자·지렁이 조우를 단순화. 현재 지상 이동/거리/한 번 제거로 표현 가능. 분류군 차이·먹이 종·크기 불확실성 유지.|B·채택|
|참지렁이 A. koreanus → 족제비 Mustela sibirica|미확인|R2의 해당 족제비 종→지렁이 먹이군.|동아시아 식단 근거. 땅 위에 이용 가능한 지렁이를 현재 거리 모델로 표현; 국내 특정쌍이라고 하지 않음.|B·채택|
|참지렁이 A. koreanus → 고슴도치 Erinaceus amurensis|미확인|R3의 같은 고슴도치 종 위 내용물→지렁이류.|국내 자생종과 같은 종이나 일본 도입 개체군 자료. 현재 지상 포식으로 단순화 가능.|B·채택|
|솔나방 Dendrolimus spectabilis 유충 → 고슴도치 E. amurensis|미확인|R3의 주된 나방 유충은 Spodoptera depravata 등; 솔나방 특정 기록 아님.|현재 카드에 령·크기별 제한이 없다. 일반 유충을 모두 이 유충으로 옮기기에는 단계별 타당성이 부족.|C·보류|
|청동풍뎅이 Anomala albopilosa 성충 → 고슴도치 E. amurensis|미확인|R3의 풍뎅이과. 유충은 별도 행이므로 성충/유충을 섞지 않음.|현재 성충 카드·지상 조우로 표현. 정확 성충종·크기는 미확인. 모든 딱정벌레를 먹는다는 뜻 아님.|B·채택|
|솔나방 D. spectabilis 유충 → 족제비 M. sibirica|미확인|R2는 애벌레 먹이군만 확인.|유충 일반 식단 근거는 있으나 솔나방의 령·크기·지상 조우 조건까지 확보 못함. 현재 일괄 유충 카드에서 제한을 새로 만들어 채택하지 않음.|C·보류|
|산딸기 Rubus crataegifolius → 멧토끼 Lepus coreanus|미확인|R4는 Rubus 속 검출. 잎/줄기/열매 불명.|속 수준 이용은 인정하지만 구현에 필요한 먹이 부위가 미확인. 잎과 열매가 공용 재고라는 기존 한계도 있어 임의 연결 안 함.|C·보류|
|방아깨비 Acrida cinerea → 무당거미 Trichonephila clavata|미확인|R5의 메뚜기목 분류군 검출.|성충 크기·그물 포획·고도 조우가 미확인. 현재 근거리 매복 모델을 무제한 추격으로 바꾸지 않고 보류.|C·보류|
|솔나방 D. spectabilis 유충 → 직박구리 Hypsipetes amaurotis|원 관찰 미확인|R6의 송충이 천적 목록에 직박구리. 유충 이용.|국내 숲 관련 전문가 설명과 나무에서 조우 가능한 생활상을 B로 단순화. 정밀 령·포획 애니메이션은 미구현.|B·채택|

B는 신뢰할 수 있는 자료에서 확인한 범위와 게임 추론을 함께 표시한다. 다섯 관계가 모든 지역·크기·계절에서 항상 성립한다는 뜻은 아니다. 지렁이의 실제 매몰 깊이·노출 여부도 현재 좌표 모델에는 없으므로 실제 이용 가능한 가까운 개체로 단순화한다. 아홉 외의 새 관계는 구현하지 않았다.

## C. 실제 추가 관계·검사

|relationId|먹이 ID→소비자 ID|방식|등급·근거|실제 검사|
|---|---|---|---|---|
|v2_earthworm_to_ladybird|earthworm→ladybird|animal/predation|B F20|성공·부재·거리·장애물·도중 소멸·중복 보상·저장 통과|
|v2_earthworm_to_weasel|earthworm→weasel|animal/predation|B F21|동일 범위 통과|
|v2_earthworm_to_field_mouse|earthworm→field-mouse|animal/predation|B F22|동일 범위 통과|
|v2_aphid_to_field_mouse|aphid→field-mouse|animal/predation|B F23|동일 범위 통과|
|v2_caterpillar_to_bulbul|caterpillar→bulbul|animal/predation|B F24|동일 범위 통과|

새 반경·선호·확률·자동 섭식·무료 먹이 생성은 없다. 기존 먹잇감은 실제로 제거되고 population에 predation 기록이 생긴다. 같은 지렁이를 두 포식자가 노려도 실제 포식·신호는1회다. 포식은 별도 유기물 발생을 꾸며내지 않는다. 참지렁이의 과거 토양 기여는 되돌리지 않고, 개체 감소 뒤 앞으로의 낙엽 섭식량이 줄어든다.

홍단딱정벌레의 달팽이, 고슴도치의 방아깨비, 족제비의 기존3먹이, 참매의 기존3먹이를 보존했다. 박새·다람쥐·직박구리의 기존 관계도 그대로다. 새 식물 섭식 관계는 채택하지 않았고 식물 부위별 독립 재고 전면 개편도 하지 않았다.

## D. 먹이그물 비교

|항목|기존|확장|
|---|---|---|
|관계 수|22|27|
|참여 생물 수|20|21|
|24노드 전체의 무방향 연결 성분|5|4|
|복수 먹이 소비자|5|7|
|일반 관계에 고립된 노드|지렁이·분해자3|분해자3|

분해자3종은 wood/litter/remains 공유 자원을 통해 연결되므로 위 그래프의 고립이 생태 기능 부재를 뜻하지 않는다. 참지렁이의 낙엽 섭식도 별도 자원 경로이며 동물 포식 그래프에 새 낙엽 종 노드를 만들지 않았다.

|소비자|이전 먹이 종류 수|확장 먹이 종류 수|
|---|---|---|
|방아깨비 (grasshopper)|1|1|
|참개구리 (frog)|1|1|
|멧토끼 (rabbit)|1|1|
|다람쥐 (chipmunk)|2|2|
|고슴도치 (field-mouse)|1|3|
|솔나방 애벌레(송충이) (caterpillar)|1|1|
|청동풍뎅이 (aphid)|1|1|
|명주달팽이 (snail)|1|1|
|무당거미 (spider)|1|1|
|홍단딱정벌레 (ladybird)|1|2|
|박새 (tit)|2|2|
|직박구리 (bulbul)|2|3|
|유혈목이 (snake)|1|1|
|족제비 (weasel)|3|4|
|참매 (goshawk)|3|3|
|참지렁이 (earthworm)|0 + 낙엽 자원|0 + 낙엽 자원|

생산자별 소비자 연결은 강아지풀3, 상수리나무1, 소나무2, 산딸기1, 팽나무2로 같다. 솔나방은 솔잎 전문식성, 유혈목이는 개구리 먹이군, 거미는 현재 검증된 근거리 대상에 남겨 두었다. 단일 먹이종 의존을 무조건 실패로 처리하지 않았다.

새로 지렁이가 사라지면 홍단딱정벌레·족제비·고슴도치의 후보가 줄고 낙엽 섭식도 줄어든다. 지렁이만 추가하므로 지렁이에 위협이 집중될 수 있다. 솔나방 유충은 기존 박새와 새 직박구리에 공유되고, 청동풍뎅이는 거미와 고슴도치에 공유된다. 종별 직접 영향을 받는 소비자 목록은 [그래프 원본](tests/food-expansion.results.json)에 전24종을 기록했다.

홍단딱정벌레는 달팽이/지렁이를 각각 최근접으로 놓았을 때 모두 실제 섭식하고 달팽이 소멸 후 지렁이로 전환했다. 고슴도치는 기존 방아깨비와 새2먹이, 족제비는 기존 먹이와 지렁이, 직박구리는 기존 열매와 유충 사이에서 같은 검사를 통과했다. 관계 순서 역전으로 거리가 다른 최근접 결과가 바뀌지 않는다. 정확한 동률의 기존 나중 순회 선택은 보존했다.

## E. 균형·경제·진행 전후 비교

### 같은 시작·정책20분

[불변 원래22관계 기준](tests/food-expansion.baseline-results.json)에 현재 코드의22관계 대조군을 전체 저장까지 비교해 일치시킨 뒤,27관계로 같은 시작과 입력 정책을 실행했다. 단순히 예전 보고서 숫자를 옮기지 않았다. [비교 결과](tests/food-expansion.long-results.json).

|20분 숲|최종 개체 전→후|포식 전→후|굶주림 감소 전→후|포인트 전→후|
|---|---|---|---|---|
|student|7→7|8→8|0→0|72→72|
|established|10→10|8→8|0→0|31→31|
|mixed24|11→10|13→14|5→5|12→12|

신규/기존 학생 기본 숲은 새 포식자가 없어 전체 결과와 저장 스냅샷까지 같았다. 혼합 숲은 원래도 무관리에서 일부 종을 잃는 개발 fixture다. 확장 후 생산자5/분해자3은 최종 유지하지만 소비자가 줄고 안정도는86→69였다. 첫 숲 학급 평균 성공률로 해석하지 않는다.

혼합 숲의 포식13→14, 자연 종료8→8, 굶주림 감소5→5, 번식3→3, 보충4→4, 성장 전환8→8. 원래 풀·방아깨비·참개구리 핵심 섭식은 각각1회로 같았다. 분해 처리42.105→35.483, 지렁이 낙엽 섭식6.676→0.054. 이 배치에서 지렁이 기능은 약99.2% 감소했다. 새 먹이가 포식자 생존을 무한 연장하지 않으며 기존 수명 종료 상한을 검사했다. 총량·성장·번식 수치는 보정하지 않았다.

### 실제 배회 이동·배치 의존성

배회와 추격을30step/s로 실행하고3개 난수 seed에서22/27을 짝지어20분 비교했다. 실제 상태에서 먹힌 ID가 존재했는지, 같은 ID 중복 포식이 없는지, 수명·상한30·유일 보상 원장·먹이 부족 소비자 시간을 검사했다. [이동 결과](tests/food-expansion.motion-results.json).

|seed|최종 개체 전→후|포식 전→후|관찰 보상 포인트 전→후|지렁이 낙엽량 전→후|
|---|---|---|---|---|
|12345|11→11|9→11|192→228|6.522→0.057|
|51|11→10|13→11|192→216|6.522→0.042|
|777|11→10|10→11|192→204|6.522→0.072|

3seed에서 지렁이 한 마리는7~12초에 고슴도치에게 먹혔다. 지렁이를 하나 두고 포식자를 빽빽하게 함께 둔 상황의 **분명한 과포식 위험**이다. 모든 새 관계를 똑같은 빈도로 사용하게 하지 않았으며 무관리 숲의 기능을 자동 보장하지 않는다. 안정도/사망/분해 수치를 임시 상향하지 않았다.

기존 관리 기능으로5분 시점 살아 있는 고슴도치·족제비를 회수하고 참지렁이를 다시 배치한 별도 시나리오는20분 낙엽 섭식4.977, 안정도86, 지렁이1마리 유지였다. 회수는 실제 removeOrganism/release, 재배치는 기존 placeOrganism의 권한·대기·30상한을 통과했다. 관리 시나리오는 기존과 입력이 같다고 주장하지 않는다. 학생의 선택을 재현한 자동 fixture이며 실제 학생 검증은 아니다. 지렁이만 다시 두고 포식자를 남긴 비교 시도는 다시 포식돼 기능을 충분히 복구하지 못했다.

과밀 배치 위험은 유지·관리 학습과 연결되지만 다음 단계 현장 검증이 필요하다. 게임 전반 진행 불능은 재현되지 않았고 기본 학생·기존 학생 결과는 같아 검증된5관계를 유지했다. 과도한 손실이 수업에서도 재현되면 해당 B관계 채택을 재검토할 수 있으며, 숨은 무적 지렁이나 보상 보정으로 가리지 않는다.

### 포인트·해금·시간

기존 최초 발견12점 정책을 그대로 적용한다. 먹이 관계 보상만의 이론 상한은264→324, **최대+60점**. 실제로 먹고 학생이 확인해야 하며 반복·재로드·다음 숲은 같은 관계를 중복 지급하지 않는다. 환경 학습4×5=20, 일회 복구최대28, 새 학생0, 반복 숲 관리28·비환전 규칙 유지. 새 카드 활동 보상은 여전히0.

|모델|클리어 시각 전→후|누적 관계 전→후|포인트 전→후|획득 종 전→후|
|---|---|---|---|---|
|instant|99.5→99.5|3→3|72→72|7→7|
|normal|930→930|3→3|83→83|9→9|
|collector|99.5→99.5|9→10|143→155|24→24|

24종 탐색 모델에서 새 유충→직박구리1회가 관찰되어 보상+12점이었다. 다람쥐의 도토리 발견이320→601초로 늦어져, 이를 요구하는 족제비·참매도320→601초에 해금됐다. 모든24종은 여전히 획득했다. 열매/유충 및 공유 자원 이용 변화가 다른 발견·해금에 영향을 준 측정 결과이며, 단일 원인의 현장 검증이라고 주장하지 않는다. 해금 조건·정답·필수 퀴즈는 바꾸지 않았다.

즉시 응답99.5초는 여전히 가능하고 새 관계 때문에 더 빨라지지 않았다. 보통 읽기 모델930초(15분30초)는 실제4학년 평균이 아닌 결정 가정 모델이다. 새 관계 토픽의 반복 숲2/3회는 각38.5초에 목표를 달성했다. 반복 숲이 항상15~20분이라는 주장은 하지 않는다. 강제 타이머를 넣지 않고 관찰·관리·선택의 깊이를 이후 평가한다.

## F. 검사·저장·브라우저 결과

### 자동 검사 구분

최종 실행은 [run-tests](tests/run-tests.mjs)에 세 묶음으로 남겼다.

- 기존 과거시간314개: 원래22관계+과거 시간 로더.
- 기존 현재시간407개: 원래22관계 로더. 합계 **기존721개 회귀 통과**.
- 실제 제품27관계 설정 **181개 통과**. 이 안에 새 파일의51개 검사와 기존 선택/경제/저장 등 재사용 검사가 포함된다. 위721과 겹치는 항목이 있으므로 합쳐서902개 독립 신규 검사라고 하지 않는다.

원래22개를 정확히 전제하는 이전 수치 스냅샷은 [테스트 전용 로더](tests/original-food-web-loader.mjs)로 대조하고 실제27관계는 별도로 검증한다. 제품 플래그나 저장 스위치는 없다. [동일 조건 비교 helper](tests/food-expansion-fixtures.mjs)는 관계·색인·발견 정의·보상 정의를 일시 교체하고 반드시 원복한다. 기존 수치 스냅샷을 새 숫자로 덮어 통과시키지 않았다.

기존 point-economy 검사의 관계 수 단언은22 또는27 두 검증 설정을 허용하고, 새 검사에서27과 기존22전체를 엄격하게 검증한다. 금액·행동·원장·중복 지급 단언은 그대로다. 기존 replay 브라우저의 목록 수는 정의 수를 읽도록 바꾸었다. 검사 삭제 없음.

신규 파일의51개는 관계·도메인38개(27개 실제 관계·6개 대체 먹이 등), 진행·저장8개, 실제 이동·관리5개다. 각각의 정확한 실행 결과는 [관계](tests/food-expansion.results.json), [20분·진행](tests/food-expansion.long-results.json), [이동](tests/food-expansion.motion-results.json)에 있다.

### 저장

버전16 유지. 이전16 기준3프로필의 카드·관찰·포인트·클리어를 그대로 복원했다.7~15는 기존721의 이전 저장 검사와 확장 설정의 persistence 검사로 확인했다.27관계의 누적 도감과27개 보상·현재 관찰을 모두 저장/복원해,22 이후 기록이 잘리지 않는지 검증했다. 새 관계의 실제 발견 뒤 새로고침도 확인했다.

10분→저장→10분은 기본 숲에서 연속20분과 생태·경제·성취를 비교해 통과했다. 기존 일시적 event-N 출처와0카운터 정규화는 유지했다. 이동 포함 혼합 숲도10분 저장 후10분을 검증했다. 배회 난수/위상은 기존 저장 계약에 없으므로 이동 포함 분할/연속의 최종 개체가 완전히 같다고 주장하지 않는다.

### 브라우저와 현장 구분

시작 기준21묶음 전체 통과. 최종 확장 설정에서도 기존21묶음 전부 통과했으며 신규1묶음을 합하면22묶음이다. [최종 검증](tests/food-expansion.validation-results.json). 신규8장면은 실제 Edge1280×800·터치 context에서 통과했다. 새5관계 각각의 섭식·DOM 제거·접촉 표시·발견 확인12점·저장 복원·27관계 목록을 확인했고, 달팽이/방아깨비/개구리를 기존 회수 버튼으로 제거한 뒤 홍단딱정벌레/고슴도치/족제비가 지렁이로 전환하는3장면을 확인했다. 초기 상태와 배회 난수는 재현용 fixture다. 실제 학생 저장의 현장 관찰을 대신하지 않는다.

|소비자|먹이|기존 먹이 회수 뒤 전환|표시 기준점 거리|확인 후 포인트|재로드·목록|
|---|---|---|---|---|---|
|ladybird|earthworm|단독 먹이|21.18px|12|보존·27개|
|weasel|earthworm|단독 먹이|20.53px|12|보존·27개|
|field-mouse|earthworm|단독 먹이|19.56px|12|보존·27개|
|field-mouse|aphid|단독 먹이|20.28px|12|보존·27개|
|bulbul|caterpillar|단독 먹이|21.38px|12|보존·27개|
|ladybird|earthworm|예|20.45px|12|보존·27개|
|field-mouse|earthworm|예|21.18px|12|보존·27개|
|weasel|earthworm|예|21.45px|12|보존·27개|

표시 거리는 transform 기준점 거리이며 정밀 알파 픽셀 접촉은 아니다. 모두50px 미만이다. 먹는 중 표시·실제 개체 제거·안내 문구·44px 이상 관찰 터치를 확인했다. 함수 반환만으로 학생이 행동을 관찰했다고 하지 않는다. [신규 브라우저 원본](tests/food-expansion.browser-results.json), [기존 검사 전](tests/food-expansion.browser-before-results.json), [기존 검사 후](tests/food-expansion.browser-after-results.json).

S5e 실기기 FPS·발열·배터리·수업 중20분 터치, 실제 학생 이해·평균시간·관리 난이도, 배포된 Pages는 미확인이다. 실제 기기에서는 지렁이 과포식, 느린 재배치 선택, 먹는 중 표시와 이름 숨김, 발견 표시 우선 터치, 새로고침 권리 보존을 우선 확인한다.

## G. 교육적 의미·다음 단계

[교육부2022-33 고시](https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=141&boardSeq=93458&lev=0&search=)에서 과학과가 별책9임을 확인했다. 교과 세부 첨부 전체를 새로 분석했다고 하지 않는다. 사용자가 제시한4학년 생물과 환경 목표와 기존 프로젝트의 생산자/소비자/분해자·먹이사슬/그물·환경 관계 설명을 기준으로 연결했다.

지렁이는 낙엽을 먹는 소비자인 동시에 먹이가 된다. 한 먹이가 사라지면 다른 먹이를 이용할 수 있지만, 먹이 선택지가 늘면 다른 생물의 기능은 줄 수 있다. 역할·연결·변화의 영향을 기존 상태와 실제 행동으로 보여 준다. 분해자 기능과 생물 포식을 같은 관계로 섞지 않는다. 과학적 상세는 이 문서에 두고 학생 설명5종은 더 짧게 정리했다. 새 장문 창·필수 퀴즈·복잡한 해금은 없다.

다음 단계는 (1) 지렁이의 크기/노출과 포획 가능한 성장 단계 근거 보강, (2) 현장 관찰 후 필요할 때만 B관계 재검토, (3) 실제 발견/미발견을 읽기 쉬운 먹이그물 시각화, (4) 관찰·관리 선택을 돕는 짧은 문구, (5) 빠른 첫 클리어와 반복 숲의 학습 깊이 평가다. 단순 총관계 수나 강제 대기시간으로15~20분을 맞추지 않는다. 이번에 검토 중 발견한 외부 종 먹이 자료를24종 안의 다른 관계로 자동 확장하지 않았다.

## H. 변경 파일·GitHub Desktop

최종 확인한 전체 미커밋 파일 목록이다.

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [FOREST_FOOD_WEB_AUDIT.md](FOREST_FOOD_WEB_AUDIT.md)
- [FOREST_SPECIES.md](FOREST_SPECIES.md)
- [QA.md](QA.md)
- [README.md](README.md)
- [STAGE15_7_FOOD_WEB_EXPANSION.md](STAGE15_7_FOOD_WEB_EXPANSION.md)
- [data/food-evidence.js](data/food-evidence.js)
- [data/food-relations.js](data/food-relations.js)
- [data/organisms.js](data/organisms.js)
- [js/services/collection-migration.js](js/services/collection-migration.js)
- [js/ui/collection-view.js](js/ui/collection-view.js)
- [tests/food-expansion-fixtures.mjs](tests/food-expansion-fixtures.mjs)
- [tests/food-expansion.baseline-results.json](tests/food-expansion.baseline-results.json)
- [tests/food-expansion.browser-after-results.json](tests/food-expansion.browser-after-results.json)
- [tests/food-expansion.browser-before-results.json](tests/food-expansion.browser-before-results.json)
- [tests/food-expansion.browser-results.json](tests/food-expansion.browser-results.json)
- [tests/food-expansion.browser.test.cjs](tests/food-expansion.browser.test.cjs)
- [tests/food-expansion.long-results.json](tests/food-expansion.long-results.json)
- [tests/food-expansion.long.test.mjs](tests/food-expansion.long.test.mjs)
- [tests/food-expansion.motion-results.json](tests/food-expansion.motion-results.json)
- [tests/food-expansion.motion.test.mjs](tests/food-expansion.motion.test.mjs)
- [tests/food-expansion.results.json](tests/food-expansion.results.json)
- [tests/food-expansion.test.mjs](tests/food-expansion.test.mjs)
- [tests/food-expansion.validation-results.json](tests/food-expansion.validation-results.json)
- [tests/original-food-web-loader.mjs](tests/original-food-web-loader.mjs)
- [tests/original-food-web-register.mjs](tests/original-food-web-register.mjs)
- [tests/point-economy.test.mjs](tests/point-economy.test.mjs)
- [tests/replay.browser.test.cjs](tests/replay.browser.test.cjs)
- [tests/run-tests.mjs](tests/run-tests.mjs)

영문 Summary:

    Expand the forest food web with five researched feeding relations

영문 Description:

    Preserve all 24 species and 22 original relations, and add five evidence-level B feeding relationships.
    Keep nearest valid food selection and existing ecology, economy, unlocks, and schema 16.
    Make collection counts and saved relation limits follow the current definitions.
    Add paired balance, movement, save, reward, and browser checks; document earthworm predation risks and management responses.
