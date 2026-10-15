# 생태계 게임13.7단계 완료 보고

검증 날짜:2026-10-15. 기존 생태·시간·경제·저장을 보존하며 서식지 표현과 실제 개체 선택을 개선했다. 학생 실측/최종 그래픽과 구분해 보고한다.

## 1. 실제 작업 저장소

C:/Users/User/Documents/GitHub/eco-system 실제 Git 저장소에서 직접 구현했다. 별도 구현 복사본/ZIP/저장소 생성 없음.

## 2. 작업 전 Git HEAD

b915891d0d1385247f3abd28d4819ad97537681a. 시작 시 미커밋 변경0. 사용자13.6단계 커밋을 기준으로 진행했다.

## 3. 13.6단계 완료 확인

STAGE13_6_REPORT.md와 실제24종·22관계·저장15/생태2/시간1·초기5/학습후7/잠금17·최대30/.5tick·환경4/10/16·경제계약을 검사했다. 변경 전314개 역사시간+172개 현재정책 검사 모두PASS. 기존JSON을 덮어쓰지 않고13.6 실제화면의동일24종/30개체5해상도 bbox를 새 habitat.baseline-results.json으로 보존했다.

## 4. 실제 최신 schemaVersion

schema15/pacingRevision1/ecologyRevision2, key eco-system:forest-save 유지. 저장 형식·마이그레이션·instance.position·life·권한/보상/원장·시간은 수정하지 않았다. 새영구필드0/절대CSS픽셀저장0.

## 5. 수정·추가 파일 목록

수정14·추가17,총31개.38번 전체목록에 GitHub Desktop Changes와 일치하는 경로를 기록한다.

## 6. 기존 화면 문제 조사 결과

24종/30개체의 생태 position y=.72가 화면에도 그대로 사용되어 하단30/30집중·세로 분산0px,5해상도에서 심한 이미지bbox겹침39~52쌍이었다. 이미지/이름표/투명 타깃을 분리해 조사했으며 종별 상태창은 있었지만 실제 instanceID 직접 선택은 없었다.

## 7. 기존 배경 구조

index.html .forest-art→forest.svg 한 장(1200×470,preserveAspectRatio=none,object-fit:fill). 나무/풀/뿌리/흙은SVG내부그림,별도식물/가지/목재/돌객체DOM이 아니다. 실제학생생산자는별도 .organism-object. 숲은가로 flex/세로고정420px; 배경은영역에늘어나고모서리overflow가있다. 신규그림/가지/거미줄/목재/배경0.

## 8. 생태 좌표와 시각 좌표 분석

|사용처|파일/함수|현재좌표|
|---|---|---|
|이동|wander.update/feeding.move|기존 instance.position|
|먹이/포식|feeding.findFood/availableTarget/handlers.eat·population.usableFood|기존 정규화거리|
|유기물/근접분해자|lifecycle.removeOrganism·organic-notices.record/candidates|기존 생태원점/position|
|카드입력|organism-layer.readInput→placement.validate/place|원래surface 정규화좌표|
|화면|habitat-presentation.position→organism-layer.paint|메모리전용표시px/원본불변|
|선택/이름표|organism-layer.inspectInput→populationView.inspect|표시48pxbbox/실제ID|
|느낌표|event-view.render/getEventAnchor|해당실제개체DOM의동일view transform|
|저장|save-format snapshot/restore|원래position/나이/먹이상태;view저장안함|


## 9. 최종 디자인 이전 구현 범위

대표서식지24·이동7유형·교체가능한공급경계·작은view오프셋·중첩완화·정확한개체선택을구현했다. 현재없는진짜가지/통나무/거미줄을만들거나새가허공에서정밀착지한다고설명하지않는다. 실제착지/등반·전후가림은16단계다.

## 10. 서식지 유형 목록

canopy/branch/trunk/understory/ground/moist_ground/leaf_litter/dead_wood/organic_matter/web_space. 대표적인 생활 공간이며 항상 한 곳에만 사는 의미가 아니다. 실제 생존 조건/식성/먹이 발생 규칙과 분리했다.

## 11. 전체24종 서식지 매핑

|생물 / 기존ID|대표 공간|추가 공간|이동 유형|
|---|---|---|---|
|상수리나무 / oak|수관|나무줄기 주변|stationary|
|강아지풀 / grass|풀숲·관목|숲 바닥|stationary|
|방아깨비 / grasshopper|풀숲·관목|숲 바닥|short-hop|
|참개구리 / frog|습한 지상|풀숲·관목·숲 바닥|short-hop|
|멧토끼 / rabbit|숲 바닥|풀숲·관목|ground|
|구름송편버섯 / mushroom|죽은 목재|숲 바닥|stationary|
|소나무 / pine|수관|나무줄기 주변|stationary|
|산딸기 / raspberry|풀숲·관목|숲 바닥|stationary|
|팽나무 / hazel|수관|나무줄기 주변|stationary|
|다람쥐 / chipmunk|나무줄기 주변|가지 주변·숲 바닥|tree-affinity|
|고슴도치 / field-mouse|숲 바닥|낙엽층·토양|ground|
|솔나방 애벌레(송충이) / caterpillar|가지 주변|수관|plant-surface|
|청동풍뎅이 / aphid|풀숲·관목|가지 주변|plant-surface|
|명주달팽이 / snail|습한 지상|풀숲·관목·낙엽층·토양|slow-litter|
|무당거미 / spider|가지 사이 정착 공간|가지 주변|stationary|
|홍단딱정벌레 / ladybird|낙엽층·토양|숲 바닥|ground|
|박새 / tit|가지 주변|수관|perching|
|직박구리 / bulbul|가지 주변|수관·풀숲·관목|perching|
|유혈목이 / snake|숲 바닥|풀숲·관목|ground|
|족제비 / weasel|숲 바닥|나무줄기 주변|ground|
|참매 / goshawk|수관|가지 주변|perching|
|낙엽 분해 곰팡이 군집 / litter-mold|낙엽층·토양|숲 바닥|stationary|
|고초균 / soil-bacteria|유기물 주변|숲 바닥|stationary|
|참지렁이 / earthworm|낙엽층·토양|숲 바닥|slow-litter|


## 12. 전체24종 이동 유형

위 표의stationary/ground/short-hop/tree-affinity/plant-surface/perching/slow-litter. 기존생태wander/추적속도/난수는그대로,표현선호/정착/낮은도약최대3px/표시높이를구분했다. 실제가지가없는새는현재이동을유지한안전대체이며가짜등반/착지는없다.

## 13. habitat anchor 구조

data/habitats.js의종별선호→provideHabitatAnchors→createHabitatPresentation→organism-layer. id/zone/kind/sourceInstanceId 또는 실제sourceObjectId/정규화position·range/capacity/priority/temporary·precise를검증한다. 현재source가사라진anchor는거부하고재구성한다. 미래의정확한branch는명시적source와precise가있어야한다.

## 14. 현재 임시 anchor 사용 방식

실제살아있는생산자영역(priority3/수용2) 우선,현재식별가능한일반지상영역(priority0/수용30) 대체. 나무주변/식물표면을연결하되배경에가짜가지/wood/연못/거미줄anchor를추가하지않았다. 공유유기물숫자로가짜위치별통나무를만들지않는다. 공급함수/생물선호/픽셀계산을분리했다.

## 15. 적절한 anchor가 없을 때

원래터치/생태좌표에가까운안전한view대체구역으로표현한다. anchor가없거나가득차도기존카드를잠그거나생태개체를먼곳으로생성하지않는다. 보통오프셋상한72px/축별정규화.16. 구버전이화면끝을저장해그림이잘리는경우표시만안으로복구하며원래position은보존한다. 생태좌표가UI/화면밖에있는과거상태는표시안전을우선하며제한적보정이추가될수있다.

## 16. 생산자 정착

5생산자의기존생태position·그림base정착을유지했다.동물처럼이동시키지않고실제개체의그림크기에서식물영역anchor를계산한다. 기존성장·stock·수명은그대로다.

## 17. 나무 이용 생물

다람쥐는가까운실제oak/pine/hazel영역을선호한다. 박새/직박구리/참매의대표branch/canopy및perching유형을구분했다. 현재정확한가지공급이없어낮은안전구역을사용하고완성형공중착지로표시하지않는다. 실제branch 공급교체/수용량1을단위검사했으며새식성/자동먹이없음.

## 18. 식물 이용 생물

솔나방애벌레는실제pine,청동풍뎅이(id aphid)는실제팽나무(id hazel),방아깨비는실제grass영역을선호한다. 적합한실제생산자가가깝지않으면기존위치주변대체. 먹이stock/거리/기존22관계를우회하지않으며식물주변표현이실제섭식을대신하지않는다.

## 19. 지상 생물의 이동

멧토끼/고슴도치/족제비/유혈목이/홍단딱정벌레의기존생태이동을유지했다.표시순서/근접후보분산만적용하고기존wander에같은시드난수를주어전체상태가같음을확인했다.먹이에접근/먹는중은실제타깃의표시위치를따라view차이를줄인다.프레임별anchor전수검색없음.

## 20. 참지렁이·분해자 표현

참지렁이는소비자/낙엽층·토양의느린이동,명주달팽이는습한낮은느린이동. 버섯/곰팡이/세균·거미는정착표현. 실제litter섭식·제한적토양기여·wood/litter/remains/양분·군집갱신과예산을변경하지않았다. 목재그림이없어실제통나무붙이기/토양단면제작은하지않았다.

## 21. 먹이 관계22개 보존

species/food-relations/taxonomy/feeding/population/생존/분해/환경/경제데이터와코드변경0. 기존ID·A5/B17·먹히는쪽→먹는쪽·식성/자원부분·반경·상한·섭식/포식조건그대로. 서식지로식성을추가하거나거리무한확대/자동먹이/무료생물/포인트지급없음.

## 22. 섭식·포식 결과 비교

신규0점20분·대표숲·24종혼합/30개체는보존된13.6 JSON의모든생태·재정측정값과정확히일치했다(측정메타플래그는제외하고모든data필드비교). 나무/지상/식물/낙엽/분해자/포식각숲도view미적용실행과개체·stock·먹이·포식·굶주림·수명/성장·번식·자원/양분·지렁이·환경·포인트·학습·해금·클리어가같았다.

## 23. 분해자 느낌표 보존

기존생태position으로가장가까운적합한실제개체를선택한다. 현재DOM에붙은marker가view변환을함께따르고선택과배치로이벤트를전파하지않는다. 기존실제종료3건 wood→버섯/litter→지렁이/remains→고초균의정확한부모DOM·44px터치·0점확인·유료옵션0·저장후반복0을실제브라우저에서확인했다. 곰팡이litter연결도기존단위회귀에서유지했다.

## 24. 중첩 감소 전후 수치

|화면|이미지 겹침쌍 전→후|심한 겹침쌍 전→후|이름표 겹침쌍 전→후|하단 개체 전→후|화면 이탈|확정 선택/오류|
|---|---|---|---|---|---|---|
|1280×800|57→27|42→4|57→12|30→22|0|30/0|
|1138×712|60→39|45→4|60→20|30→20|0|30/0|
|960×600|68→48|50→4|68→27|30→20|0|30/0|
|1366×768|57→28|39→4|57→12|30→22|0|30/0|
|412×915|99→36|52→6|99→32|30→21|0|30/0|

|화면|세로 분산 px 전→후|95% bbox포함 전→후(추정)|투명 hitbox 겹침쌍|직접 타깃 수|
|---|---|---|---|---|
|1280×800|0→67.786|8→1|36|30|
|1138×712|0→63.626|8→1|54|30|
|960×600|0→57.263|8→1|61|30|
|1366×768|0→65.225|8→1|35|30|
|412×915|0→75.24|8→1|103|30|

같은초기조건·같은기기크기의실제DOM bbox비교다. 심한겹침은교차면적/작은그림면적≥.65. 하단은그림base가숲높이.68이상인개체수.95% bbox포함은실제투명픽셀완전가림이아닌기하추정이며그림그림/이름표/투명hitbox쌍을구분했다. 현재도심한겹침4~6쌍과bbox포함추정1개가남지만모든30개체를목록으로선택할수있다.

## 25. 실제 터치 선택 정확도

5화면×30개체=150회의실제touchscreen탭과필요한후보목록확정을통해선택된instanceId를검사했다. 확정후잘못된ID0/선택불가0/화면밖0. 모든개체가한번의탭으로선택된다는뜻은아니다. 겹침은목록에서선택해모호함을해소한다. 개체별48px타깃30개/이동중지렁이선택/같은종마지막개체만회수·다른개체유지·가짜유기물0/기존카드배치및학습도통과했다. 키보드 activation은해당button ID를직접선택하도록구현했다.

## 26. z-index·레이어 변경

배경-1/배치0/가이드1/생물레이어2/장면UI3이상/피드백5/상단비생물6. 생물내표시높이기반depth→선택60→marker부모80으로강조하며native dialog는top layer다. transform의stacking context를고려해느낌표부모자체를올리고중요장면UI위로생물레이어를올리지않는다. 캐시UI사각형으로표시경계를검사하며매프레임DOM읽기는없다. 정밀잎사귀가림은미구현.

## 27. 15~20분 진행 정책 유지

pacingRevision1/생태2배·실제simulationTime·수명/성장/번식/회복/포만·환경4/10/16·관리대기8/8/45/75·관심120·안정30을변경하지않았다. 생태.5tick/사건1초/RAF1/30fps유지. 기존정답을즉시아는모형은여전히99.5초클리어이며강제15분대기를추가하지않았다. 실제시간/학습밀도검증은15단계및학생수업에남긴다.

## 28. 포인트 경제 보존

시작0,기존최초발견·학습·조사·관리결과보상,환경학습4×최대5/20,지원1회최대28/잔여예산·중복가드·관리6/6/5/8그대로. 개체선택/서식지연결/화면분산/느낌표확인자체의새수입없음. 기존포인트·지원·원장JS/JSON변경0. 실제경제UI검사도통과했다.

## 29. 저장·복원 정책

영구필드추가가필요없어schema15유지. anchor/픽셀/선택id/정착표시cache는저장하지않는다. 같은개체집합/생태위치/화면이면ID순서에서결정적으로재구성한다. 실제브라우저에서저장·리로드의개체ID/position/life와모든그림bbox가같았다. 레이아웃/개체추가·제거시표시재배치가있을수있으나프레임마다난수위치가바뀌지않는다.

## 30. 기존 저장 호환

기존decode/save서비스를수정하지않았고7~15·미래16/미지ecology·pacing차단검사를그대로통과했다. 구버전position/생물나이/feedingClock·카드/학습/포인트/legacy원장/지원/클리어는보존한다. 13.6시간압축을다시적용하지않고hidden/offline시간도누적하지않는다.

## 31. 테스트A~Z 결과

|항목|검증 내용|근거|
|---|---|---|
|A|선행314/172 통과·schema15/pacing1/ecology2|작업 전 로그/실제코드/정상새저장|
|B|24종 speciesId 그대로|24종 데이터 검사/보존 Git diff|
|C|생산자5/소비자16/분해자3|단위검사/참지렁이 소비자 유지|
|D|22관계/A5·B17 그대로|원본 코드 변경0/전체 회귀|
|E|24종 대표/추가 공간|종별24개 검사/매핑표|
|F|24종 이동유형|7유형/실제 DOM data-movement|
|G|생산자 base 정착|5화면 단위검사/기존wander 보존|
|H|새3종/다람쥐 구분|자료/실제anchor·fallback/브라우저2|
|I|솔나방/청동풍뎅이 실제식물|pine/hazel sourceInstanceId/브라우저3|
|J|지상 이동 유지|기존wander 동등 seed/브라우저4|
|K|느린 낙엽층|지렁이/달팽이 데이터/브라우저5|
|L|정착 분해자/거미|기존wanders=false/새표현데이터|
|M|실제유효 anchor/수용량|단위 actualsource·stage16 provider cap1|
|N|부재/제거/구버전끝점|safe nearby fallback/화면밖0|
|O|초기카드/배치/해금 유지|실제초기5+무료분해자배치2/기존학습|
|P|먹이 탐색 유지|기존 feeding/원본20분 exact 비교|
|Q|포식 거리 유지|원본생태좌표/실제포식·표현추적|
|R|분해/양분/예산 보존|원본decomposition diff0/현재및장시간 검사|
|S|정확한개체의!|기존detritus3실제종료/anchor parent/tap/0점|
|T|정확한instanceID|150회 실제터치+후보목록 확정/정확한개체 회수|
|U|최소44 CSSpx|새투명타깃48px/기존설명창44px|
|V|동일30개체 겹침 감소|5화면 bbox/선택/캐시UI충돌검사|
|W|저장/회전 안정|schema15 유지/같은 view복원/20분동등|
|X|13.6시간/경제/학습 유지|생태핵심diff0/225+314 회귀|
|Y|RAF1/30fps/.5tick/30개체|실제30DOM/동일노드/read0/interval0|
|Z|기존전체+신규|314 역사/225현재/17브라우저/15서식지 장시간 모두PASS|

실행:node tests/run-tests.mjs. 기존고정시간314와실제현재정책225(기존172+새단위38+서식지장시간15)를분리한다. 역사시간검사는기존Node전용loader만사용하고현재/브라우저에는설치하지않았다. 현재검사모두PASS이며중복검사를539개의서로다른사례라고합산하지않는다.

## 32. 장시간15개 시나리오

|번호|시나리오|종/개체|실제 섭식/포식|굶주림/수명 종료|번식/성장변화|분해/지렁이 섭식|잔액/안정도|검증|
|---|---|---|---|---|---|---|---|---|
|1|신규0점 기본 숲20분|5/7|130/8|0/8|5/10|12.279/0|72/84|기존 결과 또는 view미적용 대조와 일치|
|2|기존 핵심 먹이 관계20분|5/10|402/8|0/9|7/15|13.833/0|31/85|기존 결과 또는 view미적용 대조와 일치|
|3|나무 이용 생물20분|3/4|20/2|2/0|0/0|6.601/0|12/52|기존 결과 또는 view미적용 대조와 일치|
|4|지상 생물20분|2/5|88/0|4/7|5/10|4.621/0|12/78|기존 결과 또는 view미적용 대조와 일치|
|5|식물 이용 생물20분|5/9|413/0|0/10|6/10|6.3/0|12/87|기존 결과 또는 view미적용 대조와 일치|
|6|낙엽층20분|3/7|44/0|0/6|6/12|16.051/13.351|12/83|기존 결과 또는 view미적용 대조와 일치|
|7|분해자3종+참지렁이20분|6/9|0/0|0/6|6/12|27.527/6.676|12/95|기존 결과 또는 view미적용 대조와 일치|
|8|실제 포식/표현20분|2/4|222/8|0/10|7/12|4.277/0|12/53|기존 결과 또는 view미적용 대조와 일치|
|9|환경 사건 중 이동20분|5/7|130/8|0/8|5/10|12.279/0|72/84|기존 결과 또는 view미적용 대조와 일치|
|10|자연 종료/유기물!20분|3/3|0/0|0/3|0/2|5.81/1.131|12/62|기존 결과 또는 view미적용 대조와 일치|
|11|24종 혼합20분|10/11|50/13|5/8|3/8|42.105/6.676|12/86|기존 결과 또는 view미적용 대조와 일치|
|12|최대30개체20분|10/11|50/13|5/8|3/8|42.105/6.676|12/86|기존 결과 또는 view미적용 대조와 일치|
|13|연속20/저장10+10|5/7|130/8|0/8|5/10|12.279/0|72/84|기존 결과 또는 view미적용 대조와 일치|
|14|기존15 위치 복원|복원검사|—|—|—|—|—|실제 ID/position/life/권한 유지|
|15|20분 중20회 화면 회전|5/7|130/8|0/8|5/10|12.279/0|72/84|기존 결과 또는 view미적용 대조와 일치|

[전체측정](tests/habitat.long-results.json). 번호14는실제15저장의복원검사이며새20분숲실행을했다고설명하지않는다. 번호13은연속20/10+10의생물·자원·사건·재정의미를비교하며기존정책에따른표시eventID재생성은구분한다. 실제seededwander가view 난수/호출과섞이지않는검사도별도로통과했다.

## 33. 실제 브라우저 결과

기존16묶음+새서식지1=17묶음모두PASS. 새6시나리오:실제초기5카드/무료분해자배치와학습·나무·식물·지상·낙엽/분해자·최대30.5개화면의실제터치/회전/선택/창·정확한개체회수·저장·movingtouch를검사했다. [새서식지](tests/habitat.browser-results.json)·[분해자/창/성능](tests/habitat.detritus-browser-results.json)·[경제](tests/habitat.point-economy-browser-results.json)·[15저장/hidden](tests/habitat.pacing-browser-results.json). 기존측정은그대로두고새파일에만기록했다.

## 34. Galaxy Tab S5e 관련 검증

1280×800/1138×712/960×600/1366×768/412×915 통과.30DOM/동일노드·interval0·프레임layout read0·동시RAF1. 새서식지성능측정={"maxPending":1,"reads":0,"intervals":0,"domCount":30,"sameNodes":true}. 기존hidden/reduced-motion/offline중단도회귀통과. 실제S5e FPS/발열/배터리/수업체감은미측정이다. 실제기기에서는48px작은생물/움직이는개체/목록확정·가로주소창·회전/확대축소·20분발열·앱전환복귀를확인해야한다.

## 35. 14단계 카드 해금·반복 플레이 연결

STAGE14_REPLAY_HANDOFF.md에새획득speciesId의서식규칙자동연결·UIcache재생성·실제카드권한/도감/영구원장과회차상태분리를추가했다. 현재초기5/학습후7/잠금17·기존획득권한은그대로. 새해금/도감/반복플레이초기화/회차예산/미리보기UI를선행구현하지않았다.

## 36. 16단계 최종 디자인에서 할 일

실제가지/줄기/소나무잎·풀숲/낙엽·죽은목재·거미정착공간/앞뒤레이어·생물크기/선택hitbox·안전경로·비율별좌표변환/sourceObjectId/정규화정착점·범위를공급해야한다. 현재공급모듈/중앙표현제한값을교체해24종규칙을재사용한다. 높은가지와생태좌표의분리가커지는경우표현좌표·먹이접근연출을함께검증하고현재임시72px를최종기준으로확정하지않는다.

## 37. 그래픽 없이 해결하지 못한 사항

진짜가지착지/줄기등반/거미줄/로그부착/잎사귀앞뒤가림·토양단면을완성하지않았다. 가짜공중배치대신안전대체를사용하며지상집중은30/30→20~22/30으로줄었지만남아있다.5화면에서심한겹침4~6쌍·투명타깃겹침이남아후보목록확정이필요하다. 완전불투명픽셀가림이나실제학생탐색시간은측정하지않았다. 화면구조/개체집합변경때제한적표시재배치가있다. 실제S5e/학생평가는후속검증이다.

## 38. GitHub Desktop Changes 전체 목록

수정14·추가17·합계31개. 스테이징/커밋/푸시0·HEAD동일·.git/Git설정/Pages·assets변경0. 사용자검토를위해실제저장소의미커밋변경으로남겼다.

|상태|파일|
|---|---|
|수정|ARCHITECTURE.md|
|수정|FOREST_DETRITUS.md|
|수정|FOREST_PACING.md|
|수정|FOREST_SPECIES.md|
|수정|QA.md|
|수정|README.md|
|수정|STAGE14_REPLAY_HANDOFF.md|
|수정|index.html|
|수정|js/main.js|
|수정|js/ui/event-view.js|
|수정|js/ui/organism-layer.js|
|수정|js/ui/population-view.js|
|수정|tests/pacing.browser.test.cjs|
|수정|tests/run-tests.mjs|
|추가|FOREST_HABITAT_SYSTEM.md|
|추가|STAGE13_7_REPORT.md|
|추가|css/habitats.css|
|추가|data/habitats.js|
|추가|js/systems/habitat-anchors.js|
|추가|js/systems/habitat-presentation.js|
|추가|tests/habitat.baseline-results.json|
|추가|tests/habitat.browser-fixtures.cjs|
|추가|tests/habitat.browser-results.json|
|추가|tests/habitat.browser.test.cjs|
|추가|tests/habitat.detritus-browser-results.json|
|추가|tests/habitat.long-results.json|
|추가|tests/habitat.long.test.mjs|
|추가|tests/habitat.pacing-browser-results.json|
|추가|tests/habitat.point-economy-browser-results.json|
|추가|tests/habitat.test.mjs|
|추가|tests/habitat.visibility-results.json|

