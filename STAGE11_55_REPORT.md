# 생태계 게임11.55단계 완료 보고

2026-10-12. 최종 확정23종류 적용과 실제 생태 관계 정비. 신규 이미지·11.6 상세 성장·신규17종 정식 해금은 추가하지 않았다. 낙엽 분해 곰팡이는 단일 종이 아닌 기능군이다. 종별 직접 자료와 교육용 먹이군 단순화를 구분한다.

## 1. 실제 작업 저장소

`C:\Users\User\Documents\GitHub\eco-system` 실제 Git 저장소에서 기존 구현과 문서를 검사하고 직접 수정했다. ZIP/별도 구현 복사본은 만들지 않았다. data → state → systems → ui와 main.js 연결, 기존 생존/수명/환경/관리/학습/목표/저장 구조를 재사용했다.

## 2. 수정·추가 파일

총52파일: 수정43, 추가9. 정확한 GitHub Desktop Changes 목록은35번에 있다. 핵심 추가는 종 분류·먹이 근거·과거 생태 정의 데이터3개, 생태 이전 서비스1개, 결정적 fixture/검사3개, 관계 감사/이번 보고2개다.

## 3. 최종23종의 국명

- 생산자5종류: 상수리나무·강아지풀·소나무·산딸기·팽나무
- 소비자15종류: 방아깨비·참개구리·멧토끼·다람쥐·고슴도치·솔나방 애벌레(송충이)·청동풍뎅이·명주달팽이·무당거미·홍단딱정벌레·박새·직박구리·유혈목이·족제비·참매
- 분해자3종류: 구름송편버섯·낙엽 분해 곰팡이 군집·고초균

## 4. 학명과 검증 결과

|speciesId|최종 국명|역할|현재 데이터 학명|
|---|---|---|---|
|oak|상수리나무|생산자|Quercus acutissima|
|grass|강아지풀|생산자|Setaria viridis|
|grasshopper|방아깨비|소비자|Acrida cinerea|
|frog|참개구리|소비자|Pelophylax nigromaculatus|
|rabbit|멧토끼|소비자|Lepus coreanus|
|mushroom|구름송편버섯|분해자|Trametes versicolor|
|pine|소나무|생산자|Pinus densiflora|
|raspberry|산딸기|생산자|Rubus crataegifolius|
|hazel|팽나무|생산자|Celtis sinensis|
|chipmunk|다람쥐|소비자|Eutamias sibiricus|
|field-mouse|고슴도치|소비자|Erinaceus amurensis|
|caterpillar|솔나방 애벌레(송충이)|소비자|Dendrolimus spectabilis|
|aphid|청동풍뎅이|소비자|Anomala albopilosa|
|snail|명주달팽이|소비자|Acusta despecta|
|spider|무당거미|소비자|Trichonephila clavata|
|ladybird|홍단딱정벌레|소비자|Carabus smaragdinus|
|tit|박새|소비자|Parus minor|
|bulbul|직박구리|소비자|Hypsipetes amaurotis|
|snake|유혈목이|소비자|Rhabdophis tigrinus|
|weasel|족제비|소비자|Mustela sibirica|
|goshawk|참매|소비자|Astur gentilis|
|litter-mold|낙엽 분해 곰팡이 군집|분해자|없음: 교육용 기능군|
|soil-bacteria|고초균|분해자|Bacillus subtilis|

국명/학명·이명·자료·각 항목의 한계는 [FOREST_SPECIES.md](FOREST_SPECIES.md)의23행과 실제 열람한 출처에 기록했다. 국내 국명은2019 국가목록과 기관 자료, 속 변경은 현행 MDD·World Spider Catalog·IOC 등을 비교했다. 최신 국가목록 전체를 확인했다고 주장하지 않는다.

명주달팽이는 농사로의 `Acusta despecta`를 유지하되 국내 아종·국제 `Acusta sieboldtiana` 분리와 국명 대응을 미해결로 보고한다. 무당거미의 `Nephila clavata`, 다람쥐의 `Tamias sibiricus`, 참매의 `Accipiter gentilis`, 구름송편버섯의 `Coriolus versicolor`는 현재 이름과 과거 조합을 구분한다. 홍단딱정벌레의 Carabus/Coptolabrus/Damaster 속 처리도 문헌 차이를 남겼다. 기능군에 단일 학명을 붙이지 않았다.

## 5. 기존13종 교체

|유지한 카드 슬롯|이전 표시|현재 표시|
|---|---|---|
|grass|풀|강아지풀|
|grasshopper|메뚜기|방아깨비|
|frog|개구리|참개구리|
|rabbit|토끼|멧토끼|
|mushroom|버섯|구름송편버섯|
|hazel|개암나무|팽나무|
|field-mouse|등줄쥐|고슴도치|
|caterpillar|나방 애벌레|솔나방 애벌레(송충이)|
|aphid|진딧물|청동풍뎅이|
|snail|달팽이|명주달팽이|
|spider|거미|무당거미|
|ladybird|무당벌레|홍단딱정벌레|
|soil-bacteria|토양 분해 세균|고초균|

이름과 함께 식성·자원·수명·생애 단계·서식 설명·행동·번식/보충을 정비했다. 기존6핵심 카드와 저장 참조를 보호했다.

## 6. 유지한 생물

상수리나무·소나무·산딸기·다람쥐·박새·직박구리·유혈목이·족제비·참매9종을 유지했다. 낙엽 분해 곰팡이 기능군도 유지하되 표시를 ‘군집’으로 명확히 했다. 사용자 확정23종을 다른 후보로 바꾸거나 늘리지 않았다.

## 7. speciesId와 이전 정책

23개 ID를 모두 유지한다. ID는 카드 슬롯이고 분류학적 동일성 보증이 아니다. 현재 ecologyRevision2와 과거 정의1을 분리한다. 개체ID/수/위치·획득 권한을 그대로 유지하며 과거 사건은 기존 이름으로 보관한다.

현재 관계는 `v2_` ID를 사용한다. 예전 진딧물 관찰을 청동풍뎅이 관찰로 이름만 바꾸지 않는다. 과거 활동 완료·클리어는 성취로 보호한다. 미완료 클리어의 새 현재 관찰은 실제 새 섭식과 학생 확인이 필요하다.

## 8. 기존27관계 전수 검토

[FOREST_FOOD_WEB_AUDIT.md](FOREST_FOOD_WEB_AUDIT.md)에 작업 전23슬롯/27관계 표를 보존하고 각 관계의 이전/새 종·부위·방법·근거·판정을 추가했다. 의미 유지6·수정11·제외10·신설5로 **27−10+5=22**다. 모든 런타임 관계ID는 현재 버전으로 구분한다.

## 9. 제외한 기존 관계10개

- `hazel_to_chipmunk`
- `oak_to_field_mouse`
- `grass_to_field_mouse`
- `caterpillar_to_field_mouse`
- `oak_to_caterpillar`
- `hazel_to_aphid`
- `aphid_to_ladybird`
- `caterpillar_to_spider`
- `spider_to_frog`
- `field_mouse_to_weasel`

개암 견과/수액, 쥐의 씨앗·애벌레 먹이, 참나무 애벌레, 무당벌레의 진딧물, 이동형 거미와 개구리, 쥐→족제비를 새 생물에 그대로 적용하지 않았다. `hazel_to_aphid`의 옛 수액/진딧물 의미는 제외했고 같은 슬롯 쌍의 새 팽나무/성충 잎 관계를 별도로 신설했다.

## 10. 수정한 관계11개

강아지풀→방아깨비/멧토끼/명주달팽이, 방아깨비→참개구리/족제비, 청동풍뎅이→무당거미, 솔나방 애벌레→박새, 무당거미→박새, 참개구리→유혈목이/족제비, 멧토끼→참매를 현재 종과 생애 단계의 자료/먹이군으로 재검토했다. 대부분 B로 정확한 종 쌍의 직접 관찰을 확인한 관계처럼 설명하지 않는다.

## 11. 신설한 관계5개

- `v2_pine_to_caterpillar`: 소나무 → 솔나방 애벌레(송충이) / needles / A
- `v2_hazel_to_bulbul`: 팽나무 → 직박구리 / fruit / B
- `v2_hazel_to_aphid`: 팽나무 → 청동풍뎅이 / leaves / A
- `v2_snail_to_ladybird`: 명주달팽이 → 홍단딱정벌레 / animal / B
- `v2_grasshopper_to_field_mouse`: 방아깨비 → 고슴도치 / animal / B

## 12. 최종 관계 수

**22개: A5·B17·C0.** 분해자3종의 유기물 이용은 일반 동물 포식 관계 수에 포함하지 않는다. 소비자15종 모두 하나 이상의 허용 먹이가 있고 생산자/소비자20슬롯은 하나의 연결 성분이다. 실제 생존은 자원·배치 거리·환경·경쟁·수명에도 달려 있다.

## 13. 과학적 근거와 한계

A는 소나무→솔나방 유충, 솔나방 유충→박새, 산딸기→직박구리, 직박구리→참매, 팽나무→청동풍뎅이 성충5관계다. 일본 조사 자료를 국내 현장 조사로 확대하지 않는다. 먹이 부위·재고·회복·탐색·소비량·포만 시간도 실제 측정값이 아닌 게임 단순화다.

B17관계는 먹이군 자료를 현재23종으로 단순화했다. 핵심 강아지풀/방아깨비/참개구리와 명주달팽이/홍단딱정벌레 정확쌍은 직접 확인 미완료다. 실제 출처19개와 relationId별 한계는 감사 문서에 있고 학생 이벤트와 학습에도 단순화 안내를 표시한다.

## 14. 핵심 진행

강아지풀 잎의 실제 자원 감소 → 방아깨비 섭식 → 💡 기록 → 관찰 활동 → 참개구리 획득/배치 → 방아깨비 포식/기록을 유지했다. 두 관계는 B다. 클리어의70점·4환경 보통·핵심3생물·2관찰·3활동·30초는 유지한다.

## 15. 소나무와 솔나방

솔잎 `needles` 자원을 연결했다. 유충은 기존 `life_stage_exit`로 실제 제거되며 번데기·성충 단계는 화면에서 생략한다. 포식/자연 수명 종료와 구분하고 유기물을 중복 발생시키지 않는다. 소나무 먹이가 있는 조건에서 기존 유충 보충 경로를 제한적으로 사용한다.

## 16. 청동풍뎅이

카드는 성충이다. 진딧물 수액·빠른 번식·자동 보충을 제거하고 성충 수명을22–32활성분으로 정비했다. 유충의 뿌리 먹이를 성충에게 주지 않는다.

초기 조사에서는 먹이 연결이 없었으나 [Nakano2015 원문](https://www.jstage.jst.go.jp/article/jjeez/26/2/26_55/_pdf)의성충 조사 방법과표5에서 `Celtis sinensis` 실제 식물 이용을 확인했다. 팽나무 잎 자원으로 연결해 근거 없는 먹이/재도입 예외 없이 기존 usableFood·섭식·도입 검사를 재사용한다. 팽나무 없이 재도입은 거절되고 먹이가 있으면 가능하다. 새로운 청동풍뎅이 번식AI는 추가하지 않았다.

## 17. 명주달팽이와 포식자

강아지풀 잎과 홍단딱정벌레의 연체동물 식성에 B 근거를 적용한다. 정확한 두 종의 포식은 미확인이다. 청주시 성충 먹이군 자료를 사용하며 ZIN 유충의 달팽이 사육 지침을 성충 직접 확인 자료로 쓰지 않는다. 국명/학명 대응도 추가 확인이 필요하다.

## 18. 무당거미

wander=false, ambush, 속도0·탐색 반경0.025로 기존 경로의 제자리 대기를 표현한다. 가까운 성충 먹이만 이용하며 원거리 추격·원격 섭식은 차단한다. 실제 그물·포획·먹이 크기/고도·이미지 애니메이션은 아직 없다. 딱정벌레목 먹이군 B이며 특정 청동풍뎅이 포식 확정으로 설명하지 않는다.

## 19. 홍단딱정벌레

숲 바닥을 돌아다니는 포식자로 수정했다. 명주달팽이 먹이군 관계를 채택하고 진딧물 포식·무당벌레 수명/자동 유입을 제거했다. 실제 달팽이 배열/DOM 제거와 발견을 검사했다. 성충 정확 수명은 미확정이라 게임35–50분을 실측값으로 설명하지 않는다.

## 20. 고슴도치

절지동물 먹이군에 근거한 방아깨비 B 관계를 사용한다. 등줄쥐의 도토리/씨앗/애벌레·자동 유입을 제거했다. 기존 바닥 이동·굶주림·먹이 필요 재도입을 유지하고 수명55–80분으로 정비했다. 사육 장수 자료는 야생 평균과 구분한다.

## 21. 팽나무

개암 관목을 잎·열매를 가진 교목으로 정비했다. 견과/nut·수액/sap 자원을 없애고 직박구리의 열매 B, 청동풍뎅이 성충의 잎 A 관계를 연결했다. 수명180–240분으로 늘리고 이전 거의 수명을 다한 관목이 새 팽나무로 즉시 종료되지 않도록 상대 나이 이전을 적용했다.

## 22. 분해자3종

구름송편버섯은 목재를 분해하는 자실체/균사체 군집, 낙엽 분해 곰팡이는 여러 균류 기능군, 고초균은 동일 세균종 군집이다. wood/litter/remains의 기초 분해·군집 갱신·휴면/활력 회복·장기 나쁜 환경의 쇠퇴를 유지한다. 고초균의 다른 유기물 이용과 내생포자 특성도 설명하되 상세 포자AI는 없다. 양분은 실제 분해에서만 나오며 군집 갱신 보너스로 중복 지급하지 않는다.

## 23. 수명 데이터

아래 기간·초기 나이는 모두 교육용 게임 시험값이다. 실제 생애 자료·불확실성·정책·35–40분 예상은 [FOREST_LIFESPANS.md](FOREST_LIFESPANS.md)에23종별 기록했다.

|슬롯·생물|게임 활성분 범위|처음 배치|종료/갱신 원인|
|---|---|---|---|
|oak · 상수리나무|180–240|12%|natural_lifespan|
|grass · 강아지풀|24–32|5%|natural_lifespan|
|grasshopper · 방아깨비|14–20|8%|natural_lifespan|
|frog · 참개구리|55–75|12%|natural_lifespan|
|rabbit · 멧토끼|55–80|15%|natural_lifespan|
|mushroom · 구름송편버섯|12–18|활력1, 내부 갱신|군집 갱신/장기 환경 쇠퇴|
|pine · 소나무|150–210|15%|natural_lifespan|
|raspberry · 산딸기|70–100|10%|natural_lifespan|
|hazel · 팽나무|180–240|12%|natural_lifespan|
|chipmunk · 다람쥐|50–70|15%|natural_lifespan|
|field-mouse · 고슴도치|55–80|12%|natural_lifespan|
|caterpillar · 솔나방 애벌레(송충이)|18–26|10%|life_stage_exit|
|aphid · 청동풍뎅이|22–32|8%|natural_lifespan|
|snail · 명주달팽이|45–65|15%|natural_lifespan|
|spider · 무당거미|24–36|10%|natural_lifespan|
|ladybird · 홍단딱정벌레|35–50|10%|natural_lifespan|
|tit · 박새|65–90|12%|natural_lifespan|
|bulbul · 직박구리|65–95|12%|natural_lifespan|
|snake · 유혈목이|75–100|15%|natural_lifespan|
|weasel · 족제비|50–75|12%|natural_lifespan|
|goshawk · 참매|90–120|18%|natural_lifespan|
|litter-mold · 낙엽 분해 곰팡이 군집|8–12|활력1, 내부 갱신|군집 갱신/장기 환경 쇠퇴|
|soil-bacteria · 고초균|5–9|활력1, 내부 갱신|군집 갱신/장기 환경 쇠퇴|

version9의 수명 변환 대상은 grass, hazel, field-mouse, caterpillar, aphid, spider, ladybird 7슬롯이다. 기존 상대 나이를 새 수명에 적용하고 최대90%로 제한해 대응 시간을 확보하며 기존 기간의 분포상 위치도 보존한다. 기존 수명/생리 원값은 archive에 남긴다. 나머지 유효life·군집 상태는 보존한다. 반복 저장/복원으로 변환을 다시 적용하거나 수명을 다시 추첨하지 않는다.

## 24. 학습·해금·클리어

기존 학습4종·초기3권한·진행 획득3종·신규17잠금·핵심목표 조건을 유지했다. 과거 완료 활동에는 이전 구성 표시를 남긴다. 아직 클리어하지 않은 이전 저장의 새 관찰 요구는 실제 확인으로 갖춰야 하며 이미 달성한 클리어는 지우지 않는다.

## 25. 학생 UI

카드·상태·목표·다음 행동·활동·이벤트·분해 설명을 새 국명으로 갱신했다. B 관계는 ‘단순화’ 안내를 표시한다. 과거 개체 변화는 옛 이름·‘이전 구성 기록’으로 구분한다. 내부 계산값 대신 기존 질적 환경/생존/생애 표시를 유지한다. 그림은 placeholder임을 표시하며 새 이미지를 만들지 않았다.

## 26. 저장 schemaVersion

key `eco-system:forest-save`, **schemaVersion10 / ecologyRevision2**. 현재 관계·과거 생태 의미·활동의 역사 표식이 추가돼 저장 의미도 변경했다. 미래 스키마/알 수 없는 생태 버전의 덮어쓰기는 차단한다.

## 27. version7·8·9 호환

진짜 이전 의미의 fixture를 사용한다. 현재 저장에 버전 숫자만 바꾼 자료로 이전 검증을 대체하지 않았다. 카드·개체 수·좌표·포인트·보상·관리·활동·클리어·최고 안정도·활성 시계·분해/양분·번식/보충/재도입 대기를 보존한다. 변경 종의 부적합 먹이 상태는 과거에 보관하고 현재 최근섭식/쇠약 누적/포만 상태만 안전하게 조정한다. hunger와 적응 정책은 유지한다.

추가 읽기 검토에서7·8·9 각각100회 재저장/재복원으로 life/종료 시점·권한·포인트·과거 관찰/후보가 유지됨을 확인했다. 닫힌 시간/hidden 시간은 계산에 더하지 않는다.

## 28. 과거 관찰 분리

`legacyEcology`는 원본27관찰·미확인 후보·교체종의 이전 life/생리·옛 번식/보충 대기·누적 변화를 보존한다. 미확인 후보는 현재💡로 재발송하지 않는다. 현재관찰은 빈 상태에서 실제새섭식/학생확인으로 쌓는다. 진행 요약은 current/historical 관찰·개체 변화를 분리한다. reward helper를 안내와 실제 지급이 공유해 같은슬롯 옛 보상은 반복하지 않는다.

## 29. TEST A~Z

|검사|결과와 근거|
|---|---|
|A 확정23카드·역할5/15/3|통과 — ecology A / food-web|
|B 변경13슬롯|통과 — ecology B / 카드·상태 표시|
|C 유지9종·곰팡이 기능군|통과 — ecology C|
|D 국명·학명·이명·불확실성 문서|통과 — ecology D / FOREST_SPECIES|
|E 곰팡이 기능군의 학명null|통과 — ecology E|
|F 22관계의 A5/B17·출처·설명|통과 — ecology F / 관계 전수 문서|
|G 옛 수액/견과/쥐/무당벌레/추적거미 관계 배제|통과 — ecology G / food-web F|
|H 핵심 실제 섭식→발견→학습→해금|통과 — ecology H / activities·guidance 브라우저|
|I 고갈 후 허용 대체 먹이|통과 — ecology I / food-web D|
|J 청동풍뎅이 성충의 팽나무·유충 구분·진딧물 번식 제거|통과 — ecology J / food-web 브라우저|
|K 홍단딱정벌레의 실제 달팽이 포식|통과 — ecology K / food-web 브라우저|
|L 고슴도치 곤충 먹이·옛 자동 유입 제거|통과 — ecology L|
|M 무당거미 제자리 매복·원거리 섭식 차단|통과 — ecology M / food-web 브라우저|
|N 팽나무 잎/열매·솔잎 자원|통과 — ecology N|
|O 솔나방 솔잎 섭식·유충단계 종료1회|통과 — ecology O / lifespan|
|P 구름송편버섯 목재 분해·군집 갱신|통과 — ecology P|
|Q 고초균 분해·휴면·회복|통과 — ecology Q|
|R 교체종 수명·팽나무 안전 상대나이 이전|통과 — ecology R / lifespan|
|S 3번식·2보충·옛 대기 archive|통과 — ecology S|
|T 초기 상수리/강아지풀/방아깨비|통과 — ecology T|
|U 신규17종 잠금·과거 획득 권한|통과 — ecology U / 일반 학생 브라우저|
|V 과거 클리어/학습·새 관찰·중복 보상 차단|통과 — ecology V / guidance·persistence|
|W 진짜 version7·8·9 저장 이전|통과 — ecology W / persistence|
|X 과거 관찰·이름·누적 통계 분리·반복 왕복|통과 — ecology X / 후보archive 추가검사|
|Y 30상한·종별 색인·공통loop·타이머 없음|통과 — ecology Y / 30DOM 브라우저|
|Z 현재life/food/관찰 왕복·미래 생태버전 차단·기존 회귀|통과 — ecology Z / 전체 순수·11브라우저|

순수 검사 **151/151 통과**. 옛 미확인 후보 보존과 청동풍뎅이 일반 재도입, 이전 보상 안내 회귀도 포함한다.

## 30. 장시간8개 시나리오

모두40활성분의 결정적 시험이다. 실제 학생 조작/실시간40분 기기 테스트가 아니다.0.1초 입력으로 기존0.5초 ecology tick을 처리하며 wandering의 무작위 이동은 사용하지 않는다.8번은 시험 도구가 실제 관찰💡를 확인하고 활동을 한 번 완료한다.

|시나리오|초기→종료/최고 개체|실제 변화|안정도|탐색/후보 검사|저장 bytes|오류|
|---|---|---|---|---|---|---|
|1 핵심 먹이그물|15→10 /16|포식8·번식9·자연종료10·보충4·군집갱신2|96|380/2137|10685|0|
|2 소나무/솔나방|5→4 /5|유충단계종료3·보충2|79|150/300|4559|0|
|3 팽나무/직박구리|4→4 /4|개체변화없음·열매섭식150|79|150/300|3649|0|
|4 달팽이/홍단딱정벌레|6→8 /8|포식3·번식10·굶주림1·자연종료4|28|160/23|7226|0|
|5 변경곤충/포식자|18→12 /18|포식6·번식9·굶주림3·유충종료2·자연종료6·보충2|88|672/500|10349|0|
|6 분해자3종|6→11 /12|번식9·군집갱신9·자연종료4|62|0/0|8596|0|
|7 23종30개체 혼합|30→12 /30|포식16·번식7·보충4·굶주림5·자연종료8·군집갱신9|69|1854/315|14370|0|
|8 연속/20분저장+20분|각15→10 /연속16|1번과같은변화·관찰2·필수활동3·클리어일치|각96|연속380/2137;재개구간63/363|11396/12092|0|

1번 종료는 상수리2·강아지풀5·방아깨비1·참개구리1·버섯군집1. 강아지풀 섭식336·참개구리 포식8이다.2번 솔잎147회.5번 팽나무/청동풍뎅이 잎33회·솔잎113·근거리거미 포식1.6번 누적 분해41.6, 양분0.476275.7번 남은9종류는 상수리·강아지풀·소나무·산딸기·팽나무·박새·분해자3이며 강아지풀4개와 나머지 각1개다. 누적분해37.4998275, 양분0.0323614; wood0.0001725/litter29.9965/remains0. 각유기물 풀0–30·이력80·최대개체30 유지.

8번 실제 개체/life·분해량·활동·관찰·포인트·클리어가 일치한다. 저장에서 누적 원인0항목을 명시해 복원하므로 JSON 크기/표현이 완전히 같은 것은 아니다. 재개탐색 수는 뒤20분 구간만의 값이다. 모든시나리오4,800 ecology tick(재개단독2,400)이다.

11.5의 같은23종/30개체·ID·위치·40분 혼합은13종류16개체·안정도92, 포식19·굶주림3·자연종료8·번식8·보충8·군집갱신7, 탐색2094/후보3511·저장약16.7KB였다. 현재9종류12개체·안정도69로 감소한다. 잘못된자동번식/유입 제거와새먹이관계가이유이며 무개입전체소비자유지가완성됐다고주장하지 않는다. 최종35–40분 밸런스는후속조정이다.

## 31. 기존1~11.5 회귀

브라우저11묶음 **모두 통과**: browser/feeding/environment/events/management/activities/guidance/persistence/food-web/population/lifespan. 배치·30상한·섭식·포식/DOM·환경/안정도·이벤트·관리/보상·학습/해금·목표/클리어·저장/오류·수명/분해/숨김을 유지했다. 옛검사문구·관계·스키마기대는새계약으로수정후재실행했다. 이벤트44px실패는변환경계의소수점오차라 실제44px레이아웃을검사하면서경계만0.001px허용했다.

JavaScript와 검사 파일83개의 구문 검사 및 git diff --check도 통과했다. [QA.md](QA.md)에 현재 결과와 당시 이전 결과를 구분한다.

## 32. Galaxy Tab S5e 검토

공통 RAF1개, 30fps 상한, ecology0.5초, events1초, 종별 색인, 기존 DOM 이동, 최대4개 알림을 유지한다. 개체별 타이머와 새 이미지·무거운 효과는 없다. hidden 상태에서는 중단하고 오프라인 시간을 누적하지 않는다. 기존30개 DOM 검사에서 생존 노드 유지·레이아웃 읽기0·동시 예약 RAF 최대1을 확인했다.

1280×800/1138×712/960×600/1366×768 가로와412×915 세로 화면에서 카드·상태 패널·터치 크기·화면 넘침을 검사했다. 1366×768에서는 최종23종 이름/역할·17종 잠금·일반 학생 터치 배치·오류0을 추가 확인했다. **실제 S5e 측정은 하지 않았다.**

실기기에서는 Android 글꼴/이모지·밀집 이름·가로 카드 스크롤·창 내부 스크롤·배치/관리 터치, 30개체40분 FPS/발열/배터리, 앱 전환 시 시계 중단/복귀, 새로고침/완전 종료 저장을 확인해야 한다. 실제 푸시 후 Pages 하위 경로도 별도 확인한다.

## 33. 미해결 생태 관계

핵심2쌍과 명주달팽이/홍단딱정벌레 등 B17개 관계의 정확한 종 쌍·국내 섭식/먹이 크기 근거는 후속 조사다. 명주달팽이 국명·학명 대응, 홍단딱정벌레 속 배치/정확한 성충 수명, 종별 야생 평균 연령도 미확정이다. 식물 부위별 독립 재고·계절 결실·거미줄/먹이 크기·성체/유충 공간·분해 물질 수지는 단순화했다. 청동풍뎅이의 먹이 고립은 실제 자료 F19로 해소했다.

모든 종의 무개입 지속이나 기존 포인트 소진 저장의 환경 회복을 보장하지 않는다. 수명은 실제 단순 환산이 아닌 시험값이며 최종 수업 밸런스와 제한적 경제 회복은 후속 범위다.

## 34. 다음11.6 연결

대표5종은 강아지풀·방아깨비·참개구리·멧토끼·구름송편버섯이다. 한해살이 씨앗 세대, 알·약충·성체, 올챙이와 물 서식지, 새끼, 자실체와 균사체를 종 특성에 맞게 연결한다. 현재 life·군집·foodStock·먹이 자료·환경 적합도·공통 lifecycle·번식 조건·저장 버전을 재사용한다. 이번에는 상세 성장·새 연못·새 이미지·복잡한 교배·신규17종 정식 해금·도감·날씨·강/바다·관리자·로그인·원격 저장·멀티플레이를 구현하지 않았다.

## 35. GitHub Desktop Changes

아래 파일을 실제 저장소에 미커밋 상태로 남긴다. 스테이징·커밋·푸시·.git/Git 설정·Pages 설정은 변경하지 않았다.

|유형|파일|
|---|---|
|수정|`ARCHITECTURE.md`|
|수정|`data/activities.js`|
|수정|`data/ecology-config.js`|
|수정|`data/environment-config.js`|
|수정|`data/event-config.js`|
|추가|`data/food-evidence.js`|
|수정|`data/food-relations.js`|
|수정|`data/forest-goal.js`|
|수정|`data/interaction-config.js`|
|추가|`data/legacy-ecology.js`|
|수정|`data/lifespan-config.js`|
|수정|`data/organisms.js`|
|수정|`data/population-config.js`|
|추가|`data/species-taxonomy.js`|
|추가|`FOREST_FOOD_WEB_AUDIT.md`|
|수정|`FOREST_LIFESPANS.md`|
|수정|`FOREST_SPECIES.md`|
|수정|`index.html`|
|추가|`js/services/ecology-migration.js`|
|수정|`js/services/progress-summary.js`|
|수정|`js/services/save-format.js`|
|수정|`js/state/game-state.js`|
|수정|`js/systems/activities.js`|
|수정|`js/systems/activity-rules.js`|
|수정|`js/systems/decomposition.js`|
|수정|`js/systems/feeding.js`|
|수정|`js/systems/forest-progress.js`|
|수정|`js/systems/goal-guidance.js`|
|수정|`js/systems/population.js`|
|수정|`js/systems/rewards.js`|
|수정|`js/ui/activity-view.js`|
|수정|`js/ui/event-view.js`|
|수정|`js/ui/forest-view.js`|
|수정|`QA.md`|
|수정|`README.md`|
|추가|`STAGE11_55_REPORT.md`|
|수정|`tests/activities.browser.test.cjs`|
|수정|`tests/activities.test.mjs`|
|추가|`tests/ecology-fixtures.mjs`|
|추가|`tests/ecology.long.test.mjs`|
|추가|`tests/ecology.test.mjs`|
|수정|`tests/events.browser.test.cjs`|
|수정|`tests/events.test.mjs`|
|수정|`tests/food-web.browser.test.cjs`|
|수정|`tests/food-web.test.mjs`|
|수정|`tests/guidance.browser.test.cjs`|
|수정|`tests/guidance.test.mjs`|
|수정|`tests/lifespan.browser.test.cjs`|
|수정|`tests/lifespan.long.test.mjs`|
|수정|`tests/lifespan.test.mjs`|
|수정|`tests/persistence.browser.test.cjs`|
|수정|`tests/population.test.mjs`|
