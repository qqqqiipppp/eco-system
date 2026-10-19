# 15.8단계 생존·세대교체 검증

24종의 자연 수명·군집 갱신·번식/보충 대기 수치는 유지했다. 배고픔과 포만 조정, 실제 식사 기준의 준비 판정으로 기존 방아깨비·멧토끼의 세대교체를 검증했다. 수명 연장·새 자동 번식 종·마지막 개체 면역은 없다.

참지렁이는 일반 hunger가 없는 실제 litter 소비자이며 피복 상태와 지표 접근을 구별한다. 생존과 실제 litter/토양 기능은 별도 측정한다. [24종 표·제거 원인·세대 시험](STAGE15_8_BIODIVERSITY_BALANCE.md) · [측정 JSON](tests/biodiversity.results.json).

---

이하 이전 단계 수명 근거/설정 이력. 수명 표는 유지하고 배고픔·포만 설명은 위15.8을 우선한다.

## 13.6단계 현재 기준

24종 상대 수명 비율을 유지하며 게임 개체 수명/군집 갱신·나쁜 환경 누적을 절반으로 압축했습니다. 아래 과거 표는 원래 기준값입니다. 현재 실효 수명표와 구버전 상대 나이 이전은 FOREST_PACING.md에 있습니다. 현실 수명이나 실제 종별 활동율 측정값을 변경한 것이 아닙니다.

[시간 정책](FOREST_PACING.md) · [완료 보고](STAGE13_6_REPORT.md) · [14단계 인수 설계](STAGE14_REPLAY_HANDOFF.md)

# 숲23종류의 실제 생애와 게임 수명 — 11.6단계

수명 검토 기준일: 2026-10-12. 대표5종 성장 연결 확인일: 2026-10-13. 생산자5종·소비자15종·분해자3종류와11.55 수명값을 유지한다. 낙엽 분해 곰팡이 군집은 교육용 기능군이며 단일 학명이 없다. 학명·이명·국명 대응의 한계는 [FOREST_SPECIES.md](FOREST_SPECIES.md)에 기록한다. 슬롯 ID 유지가 생물학적으로 동일 종이라는 뜻은 아니다.

**활성 분, 초기 나이, 유기물량, 번식·보충·갱신 시간은 모두 게임 시험값이다. 실제 수명·성장률·산란수의 측정값이나 선형 환산값이 아니다.** 야생 관찰 연령·사육 장수·평균 생존·성체/유충 기간·나무 수령을 구분한다. 정확한 종별 수명을 확인하지 못한 항목에는 실제 수명 숫자를 만들지 않았다. 기존 억새·등줄쥐·진딧물·사냥 거미·무당벌레 자료를 새 종의 수명 근거로 쓰지 않는다.

## 압축 기준과 저장

생물군·생애 단계별 구간 압축이다. 한해살이/계절 곤충은 한 수업 중 교체를 관찰할 분 단위로, 다년 척추동물·목본은 더 긴 구간으로 조정한다. 범위는 겹치며 실제 수명 순위가 아니다. 팽나무는 개암 관목90~120분에서 장수 교목180~240분, 고슴도치는 등줄쥐32~46분에서55~80분으로 바뀌었다. 청동풍뎅이는 성충22~32분, 홍단딱정벌레는 성충35~50분이며 이전 진딧물/무당벌레의 생애가 아니다.

기간은 생성 시 duration=min+(max-min)×u로 한 번 정한다. 종+유일 ID의 혼합 해시 u는 생물학적 확률 분포가 아니다. 직접 도입은 기간의5~18%를 초기 상대 나이로, 번식 자식·새 유충·알 부화는0으로 둔다. 실제 성숙 연령 비율이 아니다. 기간·초기 나이·시작 활성 시각을 저장하며 새로고침·관리·성체 전환으로 재추첨하지 않는다. 탭 비활성/일시정지의 현실 시간은 나이에 더하지 않는다.

수명이 없는7·8 저장은 안전하게 초기화한다. 수명이 있는 이전 저장은 변경된 grass, hazel, field-mouse, caterpillar, aphid, spider, ladybird의 상대 나이와 범위 내 수명 위치를 새 구간으로 이전한다. 상대 나이는 최대90%로 제한해 이전 직후 연쇄 종료를 피한다. 바뀌기 전 수명/생존은 legacyEcology에 보존하며 변경하지 않은 수명은 유지한다. 이 저장 이전은 실제 생물의 종 변환을 의미하지 않는다.

군집의5~18분은 내부 갱신을 확인하는 게임 주기다. 자실체 생존 일수나 한 세포의 분열 시간을 전체 군집 수명으로 쓰지 않는다. 자원/환경이 맞으면 같은 화면 군집을 유지하며 세대 기록이 늘고, 자원이 적으면 활력이 낮아져 쉬며, 나쁜 물·토양·공기가 지속되면 게임 스트레스 시간 뒤 군집이 줄 수 있다. 고초균 휴면/활성의 단순화이며 포자 AI를 추가하지 않는다. 구름송편버섯의 11.6 자실체 기능 상태와 이 갱신 주기는 서로 다른 값이다.

### 11.6 성장과 수명의 분리

11.55의23종 수명 범위·초기 나이·종료 원인·군집 갱신값을 유지한다. 11.6은 대표5종의 성장 계약을 별도로 추가했다. [FOREST_GROWTH_STAGES.md](FOREST_GROWTH_STAGES.md)에 정확종/근연종 출처, 단계별 시간·조건·먹이·번식·저장 한계를 기록한다.

개체의 `life = { startedAt, initialAge, duration }`와 생존 적응용 `bornAt`은 유지한다. `development = { origin, progressSeconds, stage }`는 성장 상태이며 초기 상대 나이로부터 추측하지 않는다. 씨앗/알 대기에는 실제 organism이나 body lifespan이 없으며 새싹/약충 생성 성공 시 initialAge0의 life가 시작된다. 성장 완료는 같은 개체이고 수명 종료 시각을 연장하거나 다시 추첨하지 않는다. 조건이 나빠 발달이 지연되어도 활성 수명은 계속 진행한다. 자연 수명 종료 처리를 먼저 하므로 종료된 개체가 같은 tick에서 번식하지 않는다.

|대표종|별도 성장 기준(게임 유효 발달초)|기존 수명과의 관계|
|---|---|---|
|강아지풀|씨앗 대기60 → 새싹0~180 → 자란 풀180~300 → 씨앗 형성300|새 포기 발생부터24~32분. 씨앗 형성 뒤 제한 확산 가능, 옛 포기는 별도 종료|
|방아깨비|알 대기60 → 약충0~180 → 성체180|부화 개체 발생부터14~20분. 약충 기간도 같은 duration에 포함; 성체만 번식|
|멧토끼|새끼0~90 → 어린 개체90~360 → 성체360|출생부터55~80분. 초기 수유 생략·어린 개체 실제 풀 섭식·성체만 번식. 환경 지연에도 기존120초 적응 이후 굶주림 적용|
|참개구리|알→올챙이→어린 개구리→성체 학습만|현재는 성체55~75분 유지. 수생 개체/변태 시간 없음|
|구름송편버섯|균사체0~180 → 자실체180~300 → 포자 형성 상태300|군집 내부 갱신12~18분 유지. 같은 군집 기능 상태이며 새 포자/군집·수명 재설정 없음|

조건이 맞을 때만 유효 발달초를 쌓으므로 실제 활성 대기시간은 더 길 수 있다. 표의 분/초는 실제 생물학적 생애의 선형 환산값이 아니다. 학생 배치·재도입과 version7~10 개체는 성숙/자리 잡은 상태로 보존한다. 기존 군집은 발달0에서 시작하지만 life의 활력·갱신·세대 이력은 유지한다. 과거 자실체 관찰을 만들어내지 않는다. schemaVersion11에서 기존 life와 함께 누적 발달·남은 대기·실제 성장 이력을 보존하며 ecologyRevision2와 legacyEcology 계약은 유지한다.

## 실제 자료와 게임 범위

자료는 한국 모든 개체의 평균/최대 수명을 보장하지 않는다. 게임 범위는 전체 duration이고 직접 도입의 남은 시간은 초기 상대 나이만큼 짧다.

|번호 · speciesId|speciesId · 이름|현재 학명/생애 단위|실제 자료와 불확실성|근거|게임 범위(활성 분)·이유|
|---|---|---|---|---|---|
|1 oak|oak · 상수리나무|Quercus acutissima / 교목|최대 연령 미확정. 대학의 참나무류 장수 설명은 모든 상수리의 수백 년 보장이 아니다.|[L01 SUNY 수목원](https://arboretum.buffalostate.edu/quercus-acutissima)|180~240; 장수목 압축|
|2 grass|grass · 강아지풀|Setaria viridis / 한해살이|한해살이 벼과·씨앗 번식 확인. 억새의 다년생 뿌리 근거 제거. 지역별 발아→종료 일수 미확정.|[L02 NC State](https://plants.ces.ncsu.edu/plants/setaria-viridis/common-name/bottle-grass/)|24~32; 한해살이 종료/다음 씨앗 세대|
|3 pine|pine · 소나무|Pinus densiflora / 교목|보호수 추정 수령300·350·400년 사례. 평균/최대 수명이 아니다.|[L03 강원도보5100호95쪽](https://state.gwd.go.kr/upload/report/kw_nws_data/kw_mgr_5100_20241115095939.pdf)|150~210; 장수목, 상수리와 순위 단정 없음|
|4 raspberry|raspberry · 산딸기|Rubus crataegifolius / 뿌리 포함 포기|재배 Rubus류의 다년 뿌리·두 여름 가지를 구분. 한국 산딸기 포기 최대 수명은 미확정.|[L04 UMN Extension](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-raspberries-in-the-home-garden)|70~100; 가지와 전체 개체 종료 구분|
|5 hazel|hazel · 팽나무|Celtis sinensis / 교목|낙엽 교목·적절한 조건의 장수 확인. 정확한 평균/최대 연령 미확정. 개암 관목 근거 제거.|[L05 NC State](https://plants.ces.ncsu.edu/plants/celtis-sinensis/)|180~240; 큰 장수 교목|
|6 grasshopper|grasshopper · 방아깨비|Acrida cinerea / 계절 곤충|농촌진흥청 출현7~10월은 한 성충의 수명이 아니다. 성충 평균/최대 및 국내 알 월동 기간 미확정.|[L06 농촌진흥청](https://genebank.rda.go.kr/PB/st/cyberView.bo?ord_gb=0&species_id=ZE1AA0027&viewMenuList=0)|14~20; 계절 교체, 제한 번식/알 보충은 교육용 생략|
|7 frog|frog · 참개구리|Pelophylax nigromaculatus / 성체|연령 비교 논문이 지역별 참개구리 관찰 연령 차이를 인용. 수년 생애이나 평균 자연 수명/사인과 다르다.|[L07 Animals10~11쪽](https://kpfu.ru/staff_files/F_861741570/animals_15_01273.pdf)|55~75; 성체 다년 생활|
|8 rabbit|rabbit · 멧토끼|Lepus coreanus / 포유류|국립생물자원관 생활 형태 확인. 정확한 수명 미확정. 11.5 ADW 사육약5년은 이번 본문 재접속 실패로 확정 수치에서 제외.|[L08 국립생물자원관50쪽](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1324&callmode=admin&catimage=&eclang=ko&start=50&um=s)|55~80; 다년 포유류 게임 구간 유지|
|9 chipmunk|chipmunk · 다람쥐|Eutamias sibiricus / 자료의 Tamias sibiricus|야생약3년·사육약8년 추정을 구분. 지역/조건별 차이, 보장 수명 아님.|[L09 OFB](https://ofb.gouv.fr/especes/tamia-de-siberie-tamias-sibiricus)|50~70; 작은 다년 포유류|
|10 field-mouse|field-mouse · 고슴도치|Erinaceus amurensis / 포유류|사육 추정8년은 단일 장수 기록·매우 작은 표본. 야생 평균/한국 집단 미확정. 등줄쥐4년·다산 근거 제거.|[L10 AnAge](https://genomics.senescence.info/species/entry.php?species=Erinaceus_amurensis)|55~80; 등줄쥐의 짧은 세대에서 연장|
|11 caterpillar|caterpillar · 솔나방 애벌레(송충이)|Dendrolimus spectabilis / 유충|솔잎 이용·연1~2세대·유충 월동 확인. 유충 단계는 성충 포함 전체 수명 아님. 지역/온도별 차이 있음.|[L11 EFSA](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2022.7622), [L11b 일본산림학회445쪽](https://www.jstage.jst.go.jp/article/jjfs1953/59/12/59_12_442/_pdf)|유충18~26; 월동 유충, life_stage_exit|
|12 aphid|aphid · 청동풍뎅이|Anomala albopilosa / 성충|일본 A. a. albopilosa 사육 성충 수컷평균62.5일(42~83), 암컷69.6일(23~131). 출현 계절은 개체 수명이 아니며 한국 집단 보장 아님. 유충 뿌리 먹이 제외.|[L12 Nakano2015](https://www.jstage.jst.go.jp/article/jjeez/26/2/26_55/_pdf)|성충22~32; 진딧물12~16분/단위생식과 분리|
|13 snail|snail · 명주달팽이|Acusta despecta / 분류 대응 추가 확인|노지 발생·산란 계절·동면 설명 확인. 연1회 발생/부화12일은 수명이 아님. 정확 수명 미확정. 다른 정원 달팽이 성숙2년 제거.|[L13 농사로](https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10)|45~65; 기존 구간 유지의 게임 시험값|
|14 spider|spider · 무당거미|Trichonephila clavata / 자료의 Nephila clavata|국립생물자원관 검색 자료는 알 월동→초여름 부화→가을 성체/산란→겨울 성체 감소. 정확 수명 미확정, 본문 재접속 실패 기록. 사냥 거미 근거 제거.|[L14 국립생물자원관157쪽](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1216&callmode=admin&catimage=&eclang=ko&start=157&um=s)|24~36; 계절 개체, 자동 유입 없음|
|15 ladybird|ladybird · 홍단딱정벌레|Carabus smaragdinus / 성충|종/이명 확인. 정확 성충 수명·한국 월동률 미확정, 숫자 추정 안 함. 무당벌레 월동/진딧물 근거 제거. 식성 사육 지침은 수명 실험 아님.|[L15 NCBI 종/이명](https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=120930&mode=Info)|성충35~50; 임시 게임 구간|
|16 tit|tit · 박새|Parus minor / 조류|관련 Parus major 야생 장수15.4년은 참고군. 한국 P. minor의 정확 수명/평균으로 옮기지 않음.|[L16 AnAge 관련 종](https://genomics.senescence.info/species/entry.php?species=Parus_major)|65~90; 다년 조류|
|17 bulbul|bulbul · 직박구리|Hypsipetes amaurotis / 조류|현재 종 확인. 정확 수명 미확정. 11.5 표지 재관찰10년4개월은 본문 재열람 실패로 확정 수치에서 제외. 재관찰은 출생부터 수명 아님.|[L17 국립생물자원관168쪽](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1403&callmode=admin&catimage=&eclang=ko&start=168&um=s)|65~95; 다년 조류 구간 유지|
|18 snake|snake · 유혈목이|Rhabdophis tigrinus / 파충류|성장선 연구 사육 표본 추정약4년. 출생/사인 불완전, 야생 평균/최대 아님.|[L18 PeerJ 표1](https://pmc.ncbi.nlm.nih.gov/articles/PMC5971835/)|75~100; 다년 파충류 게임값|
|19 weasel|weasel · 족제비|Mustela sibirica / 포유류|한 야생 연구 평균2.1년·최고5~6년과 사육8.8년 구분. 집단/조건별 값.|[L19 AnAge](https://genomics.senescence.info/species/entry.php?species=Mustela_sibirica)|50~75; 작은 다년 포식 포유류|
|20 goshawk|goshawk · 참매|Astur gentilis / 자료의 Accipiter gentilis|당시 넓은 분류의 야생 장수22년 기록. 현재 한국/아시아 집단 평균·최대 아님, 북미 분류와 구분.|[L20 AnAge 당시 분류](https://genomics.senescence.info/species/entry.php?species=Accipiter_gentilis)|90~120; 긴 맹금류 생애 압축|
|21 mushroom|mushroom · 구름송편버섯|Trametes versicolor / 균류 군집|죽은 목재 백색부후·자실체 계절성 확인. 자실체의 연간성/잔존은 균사체 포함 군집 수명이 아님. 군집 최대 지속 미확정.|[L21 NC State 균류 표본관](https://ncslg.cals.ncsu.edu/trametes-versicolor-l-lloyd/)|갱신기회12~18; wood/환경, 나쁜 환경 스트레스30분|
|22 litter-mold|litter-mold · 낙엽 분해 곰팡이 군집|교육용 기능군; 단일 학명 없음|유기물 분해 균류·환경별 군집 활동. 여러 종을 한 종의 수명 숫자로 처리하지 않음.|[L22 USDA NRCS](https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community)|갱신기회8~12; litter/환경, 스트레스20분|
|23 soil-bacteria|soil-bacteria · 고초균|Bacillus subtilis / 군집|포자 연구의 영양 제한 휴면·조건 회복 활성. 한 세포/포자 생존과 군집 유지 기간 구분. 본문 재접속 한계는 아래 기록.|[L23 고초균 포자 리뷰](https://academic.oup.com/femsre/article/36/1/131/534503?searchresult=1), [L22 토양 군집](https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community)|갱신기회5~9; remains/환경, 스트레스25분|

## 종료·번식·보충과35~40분 예상

아래는 새 도입·적절한 먹이/환경을 전제로 한 수명 요인의 예상이다. 포식·굶주림·관리·배치 수가 실제 결과를 바꾼다. 전체30개체·종별 상한을 유지한다. 카드 재도입은 획득 권한·종별60초 대기·배치 위치/상한을 확인하며 수명 종료로 잠긴 카드를 자동 해금하지 않는다.

|speciesId · 이름|직접 도입 초기 상대 나이|종료 원인/유기물|현재 번식·보충·회복|35~40분 예상/후속 조정|
|---|---|---|---|---|
|oak · 상수리나무|12%|natural_lifespan / wood3|자동 성목 없음; 획득 카드 재도입|수명 감소 없음; 묘목 후속|
|grass · 강아지풀|5%|natural_lifespan / litter1|씨앗 형성300발달초부터 확산 건강180초/대기240초/최대8. 씨앗 대기60초 뒤 새싹; 전멸 시 카드 재도입|한해살이 종료·새 포기 세대 구분; 실제 씨앗 휴면/계절 미구현|
|pine · 소나무|15%|natural_lifespan / wood3|자동 성목 없음; 카드 재도입|수명 감소 없음; 솔잎 회복 별도|
|raspberry · 산딸기|10%|natural_lifespan / litter2|뿌리 포함 포기; 카드 재도입|대체로 유지; 가지/뿌리 갱신 후속|
|hazel · 팽나무|12%|natural_lifespan / wood2|자동 성목 없음; 카드 재도입|수명 감소 없음; 개암 관목 유입 없음|
|grasshopper · 방아깨비|8%|natural_lifespan / remains1|성체2마리 번식 건강240초/대기360초/최대8. 알 대기60초 첫 부화가 공통 예산6에서1소모; 이후 보충 건강300초/대기180초/목표2; 카드 재도입|약충180발달초 뒤 성체; pending 중 별도 부화 금지. 예산6은 실제 산란수 아님|
|frog · 참개구리|12%|natural_lifespan / remains1|성체 자동 번식 없음; 곤충 마련 뒤 카드 재도입; 생애주기 학습|수명은 한 판보다 길다; 포식/굶주림 별도. 올챙이는 정보만, 실제 수생 AI 없음|
|rabbit · 멧토끼|15%|natural_lifespan / remains1|성체2마리 번식 건강360초/대기480초/최대4; 카드 재도입은 성숙 상태|새끼90/성체360발달초; 수유·성별·임신·계절 미구현|
|chipmunk · 다람쥐|15%|natural_lifespan / remains1|자동 번식 없음; 도토리/소나무 씨앗과 카드 재도입|최단 도입도 수명상42.5분; 포식 별도|
|field-mouse · 고슴도치|12%|natural_lifespan / remains1|등줄쥐 유입 비활성; 자동 번식/보충 없음, 카드 재도입|수명 한 판 이상; 제한 곤충 먹이망의 굶주림 별도|
|caterpillar · 솔나방 애벌레(송충이)|10%|life_stage_exit / 없음|소나무 솔잎/환경 건강420초/대기600초/목표2에서 새 유충; 카드 재도입|유충 교체 가능; 종료 개체를 성충으로 유지 안 함, 화면 밖 산란 생략|
|aphid · 청동풍뎅이|8%|natural_lifespan / remains1|진딧물 번식 비활성; 성충 자동 번식/유충 보충 없음, 카드 재도입|성충 종료 가능; 팽나무 잎 공급/경쟁·포식 확인, 유충 뿌리 AI 없음|
|snail · 명주달팽이|15%|natural_lifespan / remains1|자동 번식 없음; 잎/환경 확보와 카드 재도입|최단38.25분부터 종료 가능; 정확 수명/휴면 후속|
|spider · 무당거미|10%|natural_lifespan / remains1|사냥 거미 유입 비활성; 고정 위치 대기 포획, 자동 번식/보충 없음|계절 종료 가능; 카드 재도입, 알/거미줄 발달 미구현|
|ladybird · 홍단딱정벌레|10%|natural_lifespan / remains1|무당벌레 유입 비활성; 달팽이류 지상 포식, 자동 번식/보충 없음|최단31.5분부터 종료 가능; 카드 재도입, 실제 수명/먹이량 조정 후속|
|tit · 박새|12%|natural_lifespan / remains1|자동 번식 없음; 솔나방 유충/거미 마련과 카드 재도입|수명 유지; 한국 종 연령 후속|
|bulbul · 직박구리|12%|natural_lifespan / remains1|자동 번식 없음; 산딸기/팽나무 열매와 카드 재도입|수명 유지; 대체 열매/자원량 별도|
|snake · 유혈목이|15%|natural_lifespan / remains1|자동 번식 없음; 참개구리와 카드 재도입|수명 유지; 야생 연령/먹이량 후속|
|weasel · 족제비|12%|natural_lifespan / remains1|자동 번식 없음; 허용 먹이와 카드 재도입|수명 유지; 지역 생존·대체 먹이 별도|
|goshawk · 참매|18%|natural_lifespan / remains1|자동 번식 없음; 허용 먹이와 카드 재도입|수명 유지; 아시아 자료/성장 후속|
|mushroom · 구름송편버섯|나이 대신 활력1|colony_renewal / 없음; 쇠퇴도 추가 유기물 없음|wood/환경 맞으면12~18분 내부 갱신; 자원 부족 휴면·카드 재도입; 별도 균사체/자실체 기능 상태|군집 자동 증가 없음. 자실체180/포자 형성300발달초에 개체·양분 보너스 없음|
|litter-mold · 낙엽 분해 곰팡이 군집|나이 대신 활력1|colony_renewal / 없음; 쇠퇴도 추가 유기물 없음|litter/환경 맞으면8~12분 내부 갱신; 휴면·카드 재도입|유지/갱신/휴면 가능; 혼합종 정밀 생애는 범위 밖|
|soil-bacteria · 고초균|나이 대신 활력1|colony_renewal / 없음; 쇠퇴도 추가 유기물 없음|remains/환경 맞으면5~9분 내부 갱신; 휴면·조건 회복 시 활력 회복|세포 소멸≠군집 소멸; 카드 재도입, 포자 AI 없음|

자연 종료는 기존 lifespan → lifecycle → decomposition 경로를 사용한다. 군집 갱신에 유기물이나 soilNutrients 보너스를 추가하지 않는다. 양분 회복은 실제 유기물 소비에 따른 decomposition 한 경로로 계산한다. 포식된 먹이·유충 단계 종료·돌려보낸 개체에도 유기물을 별도 추가하지 않는다. 유기물의 재이용 모델이며 에너지 순환 설명이 아니다.

번식은 강아지풀·방아깨비·멧토끼3개, 자연 보충은 방아깨비·솔나방 유충2개다. 삭제한 진딧물 번식과 등줄쥐·거미·무당벌레 유입 상태는 과거 저장에 보존하며 새 종 자동 발생에 쓰지 않는다. 11.6 대표3종 실제 성장과 참개구리 학습·구름송편 군집 기능 상태만 추가했다. 나머지18종 정밀 성장·성별·짝짓기·실제 수생/포자 AI는 이번 범위가 아니다.

## 자료 확인의 한계와 밸런스 검증

L01~L13 공개 본문(제외한 ADW는 별도), L15 분류 본문, L16 및 L18~L22 본문을 열어 확인했다. **L15는 수명 자료가 아니다.** L14 보고서와 L23 리뷰는 해당 출처의 검색 자료를 확인했으나 본문 재접속이 실패/차단되었다. 이를 직접 본문 검증이 끝난 정확 수명 연구라고 주장하지 않는다. 계절 생애와 휴면/활성의 질적 설명만 쓰며 실제 수명 숫자는 기입하지 않았다. 멧토끼 사육값·직박구리 표지기간은 이번 재열람 실패로 확정 수치에서 제외했다. 홍단딱정벌레·명주달팽이 정확 수명, 한국 박새·직박구리 연령은 후속 조사 항목이다.

L12 표5(인쇄60쪽)는2002~2014년 도쿄에서 실제 성충 섭식을 확인한 식물로 Celtis sinensis를 명시한다. 사육 수명 표와 현장 먹이 식물 표는 별개다. 팽나무가 위 생존 실험의 사육 먹이였다고 주장하지 않는다. 한국 집단의 동일 생존일/잎 회복량을 확정하는 근거도 아니다. 관계 근거는 [FOREST_FOOD_WEB_AUDIT.md](FOREST_FOOD_WEB_AUDIT.md)에 기록한다.

35~40분은 활성 게임 시간이다. 11.55 기준 tests/ecology.long.test.mjs의8개 시나리오는 핵심 먹이망, 소나무/솔나방, 팽나무/직박구리, 달팽이/홍단딱정벌레, 변경 소비자, 분해자,23종30개체, 저장 후 재개를 검증했다. 해당 기준의 상세 수치와11.5 비교는 [STAGE11_55_REPORT.md](STAGE11_55_REPORT.md)에 기록한다. 11.6은 같은 초기 상태에서 실제 성장·성숙 대기·번식·포식·굶주림·수명 종료를 함께 비교하며 결과는 [STAGE11_6_REPORT.md](STAGE11_6_REPORT.md)를 따른다. 수명표만으로 모든 소비자 유지가 보장되지 않으며 개발 시계 시험은 Galaxy Tab S5e 실기기 수업 밸런스 확정이 아니다.

획득 카드·포인트·학습 완료·클리어를 유지하며 허위 먹이 관계로 생존시키지 않는다. 학생 재도입으로 운영을 회복할 수 있지만 모든23종의 무개입 영구 유지를 보장하지 않는다. 초기 나이·수명·번식·먹이 공급·포식·공간·관리 비용을 후속 밸런스 단계에서 함께 조정한다.
# 13.5단계 추가 생물의 생애

earthworm · 참지렁이 **Amynthas koreanus**는 토양동물의 개체 생애를 사용하며45~65 활성 게임분·초기 상대 나이.1을 설정했다. 정확종의 실제 수명 자료를 환산한 값이 아니라 기존 수업 모형에 맞춘 시험값이다. 실제 litter를 먹고 느리게 움직이며 이번에는 번식·새끼 성장·별도의 굶주림 단계/임시 먹이 지원을 추가하지 않는다. 끝난 생애에는 기존 개체 감소 경로로 동물 유래 유기물을 한 번 남긴다. 아래 기존23종의 수명·군집·번식·보충 정책은 유지한다.

|슬롯|개체 정책|게임 시간·한계|
|---|---|---|
| earthworm|참지렁이 토양동물 개체|45~65분·초기.1·정확종 수명 환산 아님; 후속 수업 검증|
