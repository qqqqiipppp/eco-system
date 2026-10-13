# 숲 생물 카드와 먹이그물 — 11.6단계

종·먹이 검토 기준일: 2026-10-12. 대표5종 성장 추가 확인일: 2026-10-13. 실행 데이터는 `data/organisms.js`, 분류 정보는 `data/species-taxonomy.js`, 먹이 관계는 `data/food-relations.js`와 `data/food-evidence.js`가 기준이다. **23종류의 카드 = 생산자 5, 소비자 15, 분해자 3**이다. 낙엽 분해 곰팡이 군집은 여러 균류를 묶은 기능군이므로 정확한 분류학적 종 23개라는 뜻은 아니다. 11.55에서 정한 종·22관계·근거 등급은 11.6에서도 유지한다.

사용자가 확정한 국명과 기존 카드 슬롯 ID를 유지했다. `hazel`, `field-mouse`, `aphid`, `ladybird`라는 내부 ID는 각각 현재 팽나무·고슴도치·청동풍뎅이·홍단딱정벌레를 가리킨다. 예전 종과 같은 종이라는 뜻은 아니다. 이전 저장의 관찰은 별도 역사 기록으로 보존한다.

## 종명·학명 검토

국내 국명은 실제 열어 본 국립생물자원관 국가생물종목록과 기관 자료를 대조했다. 국가생물종목록 PDF 1·2·3권은 **2019판**이며 2026 최신 목록을 전부 재검증했다는 뜻은 아니다. 속 이름이 바뀐 종은 현재 MDD·World Spider Catalog·IOC 자료와 대조했다. 학명은 저자명을 생략한 게임 표기다.

|번호|speciesId · 최종 국명|역할|게임 학명|검증 결과·이명·국명 차이|실제 확인 자료|
|---|---|---|---|---|---|
|1|oak · 상수리나무|생산자|Quercus acutissima|국내 국명·학명 일치|T1 p.79|
|2|grass · 강아지풀|생산자|Setaria viridis|국내 목록은 기본변종 `S. viridis var. viride`. 게임은 종 수준 표기. 한해살이 벼과 식물|T1 p.192|
|3|pine · 소나무|생산자|Pinus densiflora|국내 국명·학명 일치. 잣나무·시베리아소나무와 구분|T1 p.64|
|4|raspberry · 산딸기|생산자|Rubus crataegifolius|국내 국명·학명 일치. 산딸기속 전체를 대표하는 카드 아님|T1 p.110|
|5|hazel · 팽나무|생산자|Celtis sinensis|국내 국명·학명 일치. 개암나무 견과류·수액 식성 제거|T1 p.76|
|6|grasshopper · 방아깨비|소비자|Acrida cinerea|국립생물자원관·농촌진흥청 국명·학명 일치|T3, F1|
|7|frog · 참개구리|소비자|Pelophylax nigromaculatus|국내 목록 일치. 예전 조합 `Rana nigromaculata`도 기록|T2 p.155, F2|
|8|rabbit · 멧토끼|소비자|Lepus coreanus|국내 목록·포유류 가이드 일치. 굴토끼와 다른 종|T2 p.183, F3|
|9|chipmunk · 다람쥐|소비자|Eutamias sibiricus|MDD 현행 속 사용. 국내·옛 생태 문헌의 `Tamias sibiricus`는 과거 조합|T4, F4·F5|
|10|field-mouse · 고슴도치|소비자|Erinaceus amurensis|국내 목록·적색자료집 일치. 한국 개체의 아종 처리는 상세 연구 부족|T2 p.183, T5|
|11|caterpillar · 솔나방 애벌레(송충이)|소비자|Dendrolimus spectabilis|공식 종명은 솔나방. 카드 이름은 그 종의 **유충 단계**이며 송충이는 부연 호칭|T6, F6|
|12|aphid · 청동풍뎅이|소비자|Anomala albopilosa|국내 곤충 목록 일치. 카드는 **성충**; 유충의 뿌리 먹이와 분리|T7, F19|
|13|snail · 명주달팽이|소비자|Acusta despecta|농사로는 명주달팽이·Acusta·despecta. 국내 목록의 `Acusta despecta sieboldiana` 국명은 달팽이. MolluscaBase는 `A. despecta sieboldtiana`를 `Acusta sieboldtiana`로 분리. **국명·분류 대응 미해결**; 확정 국명은 임의 변경하지 않음|F7, T2 p.340, T8|
|14|spider · 무당거미|소비자|Trichonephila clavata|국내 2019 목록의 `Nephila clavata` 국명 확인. WSC 현행 속 변경 반영|T2 p.416, T9|
|15|ladybird · 홍단딱정벌레|소비자|Carabus smaragdinus|NCBI 표기 사용; `Coptolabrus smaragdinus`, `Damaster smaragdinus`도 사용. 속 처리 차이가 있어 분류학적 최종 합의라 주장하지 않음. 국내 아종명과 구분|T10·T11, F17 보완자료|
|16|tit · 박새|소비자|Parus minor|현행 산림기관·국내 조류 조사 일치. 넓은 과거 `Parus major` 분류와 구분|T12·T13|
|17|bulbul · 직박구리|소비자|Hypsipetes amaurotis|2024–2025 국내 조류 조사 일치. 예전 `Microscelis amaurotis` 조합도 기록|T13, F10·F15|
|18|snake · 유혈목이|소비자|Rhabdophis tigrinus|국내 국명·학명 일치|T2 p.157|
|19|weasel · 족제비|소비자|Mustela sibirica|국내 국명·학명 일치|T2 p.185, F12·F13|
|20|goshawk · 참매|소비자|Astur gentilis|IOC 현행 속. 국내 기관의 `Accipiter gentilis`는 예전 조합. 북미 참매 `Astur atricapillus`와 구분|T14, F14·F15|
|21|mushroom · 구름송편버섯|분해자|Trametes versicolor|국내 목록 일치. 예전 `Coriolus versicolor` 조합. 자실체·균사체를 포함한 군집|T1 p.351|
|22|litter-mold · 낙엽 분해 곰팡이 군집|분해자|학명 없음 (`null`)|단일 종 아님. 낙엽 분해 기능군에 가짜 학명 부여하지 않음|T15|
|23|soil-bacteria · 고초균|분해자|Bacillus subtilis|농사로 국명·학명 일치. 한 세포가 아니라 같은 종의 군집|T16|

### 분류 출처

- T1: [국립생물자원관 국가생물종목록 Ⅰ, 2019](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf). 식물·균류·조류·원핵생물 목록.
- T2: [국립생물자원관 국가생물종목록 Ⅱ, 2019](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf). 척추동물·무척추동물·원생동물 목록.
- T3: [국립생물자원관 메뚜기목 동정 개요](https://species.nibr.go.kr/kiiks/social/grasshopper.do).
- T4: [American Society of Mammalogists, MDD: Eutamias sibiricus](https://www.mammaldiversity.org/taxon/1001719/).
- T5: [국가생물적색자료집 포유류: 고슴도치](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=64&um=s). 생태 특성은 이어지는 65페이지 확인.
- T6: [국가생물종목록 곤충: 솔나방](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=admin&catimage=&eclang=ko&start=506&um=s).
- T7: [국가생물종목록 곤충: 청동풍뎅이](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=normal&catimage=&eclang=ko&start=272&um=s).
- T8: [MolluscaBase의 Acusta 목록](https://www.molluscabase.org/aphia.php?p=taxlist&pid=994782&rComp=%3E%3D&tRank=220). 국제 분류 처리만 확인; 한국 국명 확정 근거로 쓰지 않음.
- T9: [World Spider Catalog: Trichonephila clavata](https://wsc.nmbe.ch/spec-data/29057). 2019 속 변경 및 이후 문헌 확인.
- T10: [NCBI Taxonomy: Carabus smaragdinus](https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=120930&mode=Info). 이름·이명 대조 자료이며 NCBI 자체도 명명법 최종 권위 자료가 아니라고 밝힘.
- T11: [국가생물종목록 Ⅲ, 곤충, 2019](https://www.nibr.go.kr/aiibook/catImage/22/National%20Species%203.pdf). Coptolabrus 분류·아종 표기와 비교.
- T12: [일본 중부산림관리국: Parus minor](https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html).
- T13: [국립생물자원관 2024–2025 겨울철 조류 동시 센서스](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1403&callmode=admin&catimage=&eclang=ko&start=168&um=s). 이어지는 169페이지 박새·직박구리 확인.
- T14: [IOC World Bird List 분류 변경](https://www.worldbirdnames.org/updates/taxonomy/). Accipiter gentilis → Astur gentilis.
- T15: [USDA NRCS, Biological Underground Community](https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community). 여러 분해 균류·세균 기능.
- T16: [농사로 농업용어사전: 고초균](https://www.nongsaro.go.kr/portal/ps/psq/psqb/farmTermSimpleDicLst.ps?menuId=PS00064&sWordNm=%EA%B3%A0%EC%B4%88%EA%B7%A0&searchTagWord=%EA%B3%A0%EC%B4%88%EA%B7%A0). 호기성·포자 형성·토양 분포 확인.

## 현재 카드의 생태와 구현 범위

아래 식단은 게임의 등록 범위이며 실제 식단 전체가 아니다. 서식 환경은 설명용이며 새 지형이나 주야간 AI를 구현하지 않았다. 기존 그림·CSS·이모지는 임시 표시로, 새 종의 정확한 사진·종별 그래픽이 아니다.

|speciesId · 이름|현재 먹이·자원·분해 대상|설명용 서식 환경|현재 행동·유지 방식|후속 정비|
|---|---|---|---|---|
|oak · 상수리나무|도토리·잎 자원|낙엽수 숲·산기슭|고정·환경 성장·유한 자원 회복·wood 공급|계절 결실|
|grass · 강아지풀|잎·씨앗 자원|숲 가장자리 풀밭|씨앗 대기·새싹·자란 풀·씨앗 형성; 단계별 유한 재고·한해살이 종료·litter 공급|실제 종자 휴면·개화·계절|
|pine · 소나무|솔잎·씨앗 자원|산지 소나무 숲|고정·유한 자원 회복·wood 공급|계절 결실|
|raspberry · 산딸기|잎·열매 자원|햇빛 드는 가장자리|고정·유한 열매 회복|개화·결실|
|hazel · 팽나무|잎·열매; 견과·수액 제거|산지 숲 가장자리|교목 생애·유한 자원 회복·wood 공급|열매 시기|
|grasshopper · 방아깨비|강아지풀 잎 B|해가 드는 풀밭|알 대기→약충→성체; 이동 차이·실제 식사 기반 성장·성체 제한 번식·유한 알 보충|약충령별 탈피·실제 산란 AI|
|frog · 참개구리|방아깨비 B|습한 가장자리·물가 주변|성체 이동·포식·굶주림·재도입; 알→올챙이→어린 개구리→성체는 학습 정보만 제공|실제 수생 서식지·올챙이 AI|
|rabbit · 멧토끼|강아지풀 잎 B|가장자리·풀밭|새끼→어린 개체→성체; 초기 수유 생략·어린 개체 실제 식사 기반 성장·성체 제한 번식|멧토끼 정확종 발육자료·수유·성별|
|chipmunk · 다람쥐|도토리·소나무 씨앗 B|낙엽수·침엽수 숲|복수 자원 선택·섭식·굶주림|나무 타기·저장|
|field-mouse · 고슴도치|방아깨비 B|가장자리·풀밭|지상 포식·굶주림; 옛 씨앗 식단·자동 유입 제거|야행성·추가 식성|
|caterpillar · 솔나방 애벌레(송충이)|소나무 솔잎 A|솔잎 주변|느린 이동·섭식·유충 단계 종료·소나무 조건의 제한 보충|번데기·성충 보류|
|aphid · 청동풍뎅이|팽나무 잎 A|숲 가장자리 잎 주변|성충 잎 섭식; 진딧물 수액·빠른 번식 제거; 유충 뿌리 먹이 미구현|성충·유충 생애 구분|
|snail · 명주달팽이|강아지풀 잎 B|습한 풀밭·낙엽층|느린 이동·섭식·굶주림|국명·분류 대응·휴면|
|spider · 무당거미|청동풍뎅이 B|풀·낮은 식물 사이|고정 지점·가까운 먹이 대기·굶주림; 추격·자동 유입 제거|그물·먹이 크기|
|ladybird · 홍단딱정벌레|명주달팽이 B|숲 바닥·낙엽층|지상 포식·굶주림; 진딧물 포식·옛 자동 유입 제거|종별 먹이 쌍|
|tit · 박새|솔나방 유충 A·무당거미 B|나무 있는 숲·가장자리|복수 먹이·이동·포식·굶주림|고도·계절 식단|
|bulbul · 직박구리|산딸기 A·팽나무 열매 B|숲·관목 가장자리|복수 자원·이동·섭식·굶주림|고도·씨앗 확산|
|snake · 유혈목이|참개구리 B|습한 가장자리·풀밭|지상 이동·포식·굶주림|동면·탈피|
|weasel · 족제비|방아깨비·다람쥐·참개구리 B|가장자리·농경지 주변|복수 먹이·이동·포식·굶주림|영역·번식|
|goshawk · 참매|멧토끼·다람쥐 B·직박구리 A|큰 나무 있는 산림|복수 먹이·이동·포식·굶주림|입체 비행·번식|
|mushroom · 구름송편버섯|wood|죽은 나무 주변|분해·군집 갱신·휴면/쇠퇴; wood/활력/환경에 따른 균사체·자실체·포자 형성 기능 상태 표시|실제 포자·신규 군집·자실체 그래픽|
|litter-mold · 낙엽 분해 곰팡이 군집|litter|습한 낙엽층|고정·분해·군집 갱신·휴면/쇠퇴|균류별 분해 특성|
|soil-bacteria · 고초균|remains 우선|유기물 있는 토양|고정·분해·군집 갱신·포자 휴식 단순화|균주·기질 범위|

foodStock은 **식물 1개체의 공통 유한 재고**다. `parts`는 제공 가능한 부위 목록이며 잎과 열매의 독립 재고·이중 생성 모델이 아니다. 햇빛·물·공기·흙은 기존 성장·회복 계산에 연결된다. 강아지풀 새싹은 재고 상한/회복에 단계계수0.4, 자란 풀/씨앗 형성은1을 적용한다. 단계 전환은 재고를 무한 지급하지 않는다. 이 계수는 정확종 단계별 섭식량 측정값이 아닌 게임 시험값이다.

동물에는 굶주림·쇠약·회복·수명 종료가 있다. 자동 새 개체 발생은 강아지풀·방아깨비·멧토끼의 제한 번식 3개와 방아깨비·솔나방 유충의 제한 보충 2개만 유지한다. 번식에는 성숙 개체 자격을 추가하며 강아지풀은 씨앗 형성 단계부터 참여한다. 나머지는 카드 획득 권한·대기·먹이·환경·상한 내에서 기존 재도입을 이용한다. 최대30개체, 실제 개체1개=화면1개를 유지한다. 씨앗/알 대기는 실제 개체가 아니며 발생 성공 시 상한을 다시 확인한다. 생애값·이전 나이 변환은 [FOREST_LIFESPANS.md](FOREST_LIFESPANS.md), 성장 계약/출처/한계는 [FOREST_GROWTH_STAGES.md](FOREST_GROWTH_STAGES.md)를 따른다.

## 먹이 근거 수준

화살표는 **먹히는 생물 또는 자원 제공 종 → 먹는 생물**이다. 식물 섭식은 개체를 삭제하지 않고 재고를 줄이며 동물 포식은 해당 개체를 한 번 제거한다. 분해자 3종은 동물 포식자로 넣지 않고 기존 decomposition을 이용한다.

- **A**: 자료에서 해당 두 종 또는 명확한 같은 종 조합의 섭식 확인. 모든 지역·개체·계절에 항상 가능한 식단이라는 뜻은 아님.
- **B**: 믿을 만한 해당 소비자의 식성·먹이군 자료는 있지만 이 두 종의 정확한 쌍은 직접 확인하지 못함. 게임에 채택한 **교육적 단순화**이며 학생 설명·관찰 이벤트에도 한계를 표시.
- **C**: 자료가 현재 종·단계를 뒷받침하지 못하거나 미확인. 실행 관계로 채택하지 않음.

최종 **22개 관계: A 5, B 17, C 0**. 기존 27개 전수 판정과 모든 현재 relationId·부위·방식·실제 출처·한계는 [FOREST_FOOD_WEB_AUDIT.md](FOREST_FOOD_WEB_AUDIT.md)에 기록했다. 관계 개수를 맞추려고 근거를 만들지 않았다.

### 실행 관계 전체

모두 실제 게임에 구현했다. 출처에서 확인한 범위와 정확쌍 미확인 한계는 감사 문서의 F1–F19 확인 기록을 함께 읽는다. B 행은 두 종의 직접 관찰을 확인한 관계가 아니다. ‘유지’는 의미 유지이며 relationId는 모두 새 `v2_`로 분리했다.

|relationId|먹이 제공 종 → 이용 종|부위|방식|근거·출처|구현|기존 대비|
|---|---|---|---|---|---|---|
|v2_grass_to_grasshopper|강아지풀 → 방아깨비|잎|resource|B [F1](https://genebank.rda.go.kr/PB/st/cyberView.bo?ord_gb=0&species_id=ZE1AA0027&viewMenuList=0)|예|수정|
|v2_grasshopper_to_frog|방아깨비 → 참개구리|동물|predation|B [F2](https://www.jstage.jst.go.jp/article/izu/19/0/19_85/_pdf/-char/en)|예|수정|
|v2_grass_to_rabbit|강아지풀 → 멧토끼|잎|resource|B [F3](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1324&callmode=admin&catimage=&eclang=ko&start=50&um=s)|예|수정|
|v2_oak_to_chipmunk|상수리나무 → 다람쥐|도토리|resource|B [F4](https://ofb.gouv.fr/especes/tamia-de-siberie-tamias-sibiricus)|예|의미 유지|
|v2_pine_to_chipmunk|소나무 → 다람쥐|씨앗|resource|B [F5](https://zenodo.org/records/6818934)|예|의미 유지|
|v2_pine_to_caterpillar|소나무 → 솔나방 애벌레(송충이)|솔잎|resource|A [F6](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_01&viewType=detail)|예|신설|
|v2_grass_to_snail|강아지풀 → 명주달팽이|잎|resource|B [F7](https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10)|예|수정|
|v2_aphid_to_spider|청동풍뎅이 → 무당거미|성충 동물|predation|B [F8](https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2023.1177446/full)|예|수정|
|v2_caterpillar_to_tit|솔나방 애벌레(송충이) → 박새|유충 동물|predation|A [F6](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_01&viewType=detail)|예|수정|
|v2_spider_to_tit|무당거미 → 박새|동물|predation|B [F9](https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html)|예|수정|
|v2_raspberry_to_bulbul|산딸기 → 직박구리|열매|resource|A [F10](https://www.jstage.jst.go.jp/article/birdresearch/18/0/18_A1/_article/-char/en)|예|의미 유지|
|v2_hazel_to_bulbul|팽나무 → 직박구리|열매|resource|B [F16](https://www.jstage.jst.go.jp/article/jjo/61/1/61_1_100/_pdf)|예|신설|
|v2_frog_to_snake|참개구리 → 유혈목이|성체 동물|predation|B [F11](https://www.cheongju.go.kr/nongjeong/contents.do?key=17378)|예|수정|
|v2_grasshopper_to_weasel|방아깨비 → 족제비|동물|predation|B [F12](https://academic.oup.com/mspecies/article/50/966/109/5102491)|예|수정|
|v2_chipmunk_to_weasel|다람쥐 → 족제비|동물|predation|B [F12](https://academic.oup.com/mspecies/article/50/966/109/5102491)|예|의미 유지|
|v2_frog_to_weasel|참개구리 → 족제비|성체 동물|predation|B [F13](https://pmc.ncbi.nlm.nih.gov/articles/PMC9738120/)|예|수정|
|v2_rabbit_to_goshawk|멧토끼 → 참매|동물|predation|B [F14](https://www.nie.re.kr/nie/pgm/edSpecies/view.do?menuNo=200121&speciesSn=71)|예|수정|
|v2_chipmunk_to_goshawk|다람쥐 → 참매|동물|predation|B [F14](https://www.nie.re.kr/nie/pgm/edSpecies/view.do?menuNo=200121&speciesSn=71)|예|의미 유지|
|v2_bulbul_to_goshawk|직박구리 → 참매|동물|predation|A [F15](https://www.jstage.jst.go.jp/article/osj/17/2/17_229/_pdf/-char/en)|예|의미 유지|
|v2_snail_to_ladybird|명주달팽이 → 홍단딱정벌레|동물|predation|B [F17 성충](https://www.cheongju.go.kr/nongjeong/contents.do?key=17364)·[유충 보완](https://www.zin.ru/Animalia/coleoptera/rus/worldc2.htm)|예|신설|
|v2_grasshopper_to_field_mouse|방아깨비 → 고슴도치|동물|predation|B [F18](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=65&um=s)|예|신설|
|v2_hazel_to_aphid|팽나무 → 청동풍뎅이|성충의 잎|resource|A [F19](https://www.jstage.jst.go.jp/article/jjeez/26/2/26_55/_pdf)|예|신설; 옛 수액 관계와 별개|

청동풍뎅이 성충의 팽나무 이용은 일본 도쿄에서 수행한 실제 섭식 조사 목록으로 확인했다(F19). 이전 진딧물의 팽나무 슬롯 수액 관계를 되살린 것이 아니다. 국내 숲의 같은 종 쌍을 조사했다고 주장하지 않으며 재고량·회복량은 게임값이다. 현재 소비자 15종 모두 하나 이상의 먹이가 등록되지만 먹이 개체·자원의 배치, 거리, 환경이 적합하지 않으면 여전히 굶주릴 수 있다.

## 학습·저장과 대표5종 성장

핵심 진행은 강아지풀 잎 섭식 → 방아깨비 포식 관찰 → 참개구리 관련 활동·해금에 연결한다. 두 핵심 쌍은 B이므로 게임 관찰과 문헌의 종별 직접 관찰을 구분한다. 가까운 실제 개체의 섭식 성공 뒤에만 현재 관계 발견·보상이 생긴다.

초기 카드는 상수리나무·강아지풀·방아깨비. 참개구리·멧토끼·구름송편버섯은 기존 학습 진행으로 획득하며 신규 17종 잠금은 유지한다. 23종 전체 배치는 개발 fixture에서만 가능하다.

저장은 key `eco-system:forest-save`, **schemaVersion11**, ecologyRevision2이다. version7·8·9·10은 카드 권한·개체 수·학습·포인트·관리·클리어와 기존 수명/군집 상태를 보존한다. 과거 종의 이름·관찰·부적합 생존 상태는 기존 경로로 `legacyEcology` 역사에 보관한다. 예전 진딧물 관찰이 청동풍뎅이 직접 관찰로 바뀌지 않는다. 현재 관계는 `v2_` ID이며 이전 보상과 중복 지급하지 않는다. 성장/남은 발아·부화 대기/실제 단계 전환 이력은 별도 저장한다.

대표5종 중 강아지풀·방아깨비·멧토끼는 실제 어린 개체의 성장과 성숙을 계산한다. 학생 최초 배치/재도입과 version7~10 기존 개체는 이미 자리 잡은 식물/성숙한 동물로 처리해 첫 먹이그물 관찰을 보호한다. `life.initialAge`의5~18%를 어린 나이 판정에 사용하지 않는다. 성장 자체는 같은 instance의 변화이며 개체 수·수명을 새로 만들지 않는다.

참개구리의 알·올챙이·어린 개구리는 **학습 정보만** 제공한다. 실제 연못이 없으므로 현재 숲에 수생 개체를 만들지 않는다. 구름송편버섯은 같은 군집의 wood·활력·환경에 연결한 균사체/자실체/포자 형성 기능 상태다. 새 자실체 그림·실제 포자나 신규 군집은 생성하지 않으며 상태 전환으로 개체 수/양분을 추가하지 않는다.

멧토끼의 출생 설명은 정확종 상세자료 부족을 밝힌 **근연 산토끼류 Lepus europaeus 참고**다. 털·열린 눈·초기 움직임과 젖먹는 생활을 구분하며, 다른 속의 집토끼 Oryctolagus cuniculus의 무모·닫힌 눈을 복사하지 않는다. 게임은 초기 수유 자원/어미 행동을 생략한다. 실제 발육일·이유일·성숙일과 게임 초를 혼동하지 않는다. 직접 확인한 공식/원연구와 구현 조건은 [성장 설정표](FOREST_GROWTH_STAGES.md)에 기록한다.

실제 단계 전환 이력은 기존22관계 발견·학습·포인트와 별개다. 학습 설명을 읽거나 성체를 직접 도입했다고 성장 관찰 보상을 지급하지 않는다. 기존18종의 수명·생존·보충 의미도 유지한다.

12단계는 기존 환경 값에 따라 발아/부화 대기·성장·먹이 재고·소비자 성숙을 바꾸는 연결을 사용할 수 있다. 이번에는 날씨·계절·온도·오염 사건을 추가하지 않는다. 명주달팽이 분류 대응, B의 정확종 쌍/크기, 국내 발육 기간·미소서식지, 수생 AI와 전체23종 상세 성장, 최종35~40분 밸런스는 후속 과제다.
