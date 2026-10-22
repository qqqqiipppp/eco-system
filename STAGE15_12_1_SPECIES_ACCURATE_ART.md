# 작은 숲 연구소 15.12.1 — 학명·사진 기반 생물 그림 정밀화

작성일: 2026-10-22. 실제 작업 원본: C:\Users\User\Documents\GitHub\eco-system. 시작 HEAD: `3b28ecb04c75345628954e08310471faaaee40bb`, 시작 미커밋 변경 0개.

24개 SVG를 직접 그린 독립 외형으로 개선했다. 이전 156개 프레임 이름·크롭, 상태 연결, 숲 배경과 게임 규칙을 보존했다. 분류·사진 대조와 그림 생성·화면 정상 검증은 별개의 결과다. 명주달팽이와 참지렁이는 **일부 개선**이며 정확종 외형 검증을 완료했다고 보고하지 않는다. 실제 초등학생의 종 인식이나 Galaxy Tab S5e 성능은 측정하지 않았다.

비교 자료: [24종 이전/개선 그림과 실제 사진 출처](docs/species-art-qa.html), [학명·특징·촬영자·권리 원장](docs/species-art-references.json). 외부 사진은 출처 링크만 제공한다. QA 페이지의 이전 그림은 시작 HEAD의 직접 제작 SVG이고 개선 그림은 현재 자산이다.

## A. 기존 그래픽의 한계와 수정 범위

기존 생성기는 곤충·포유류·새에 공통된 몸 형태를 많이 사용했다. 색·줄무늬가 달라도 홍단딱정벌레와 청동풍뎅이의 몸 비율, 박새와 직박구리의 꼬리·부리·몸 길이, 토끼와 다람쥐의 체형 차이가 약했다. 생산자는 단순한 수관과 보통 잎에 의존했고, 낙엽 분해 곰팡이는 버섯처럼 읽히는 구조였다.

홍단딱정벌레를 먼저 수정했다. 기존 둥근 뒷몸과 짧은 앞부분을 긴 타원형 딱지날개·분리된 앞가슴·길게 나온 머리와 큰턱으로 재구성했다. 등 쪽이 읽히는 사선 자세에서 가늘고 긴 6다리와 더듬이, 점각과 구릿빛/녹색 가장자리를 표현했다. 이는 관찰 사진에서 선택한 한 색형의 교육용 표현이며 모든 아종·개체의 표준색을 뜻하지 않는다. 애벌레 사진은 성충 외형 기준에서 제외했다.

동물별 몸 도형을 새로 작성하고 선·타원·잎 등 단순 그리기 도구만 공유했다. 다른 생물의 몸을 색만 바꿔 재사용하지 않았다. 화풍·기존 표시 크기를 유지하고 종별 외곽과 대표 특징을 우선했다. 실제 사진 복사·자동 추적·래스터 이미지 생성은 하지 않았다.

## B. 24종 학명·국명 대조

내부 ID를 이름으로 해석하지 않았다. ladybird=홍단딱정벌레, aphid=청동풍뎅이, field-mouse=고슴도치, hazel=팽나무를 기존 taxonomy 데이터와 대조했다. 아래 학명은 프로젝트에서 유지한 표기다. 자료별 분류 차이는 별도 설명한다. ‘추가 채택 없음’은 전 세계의 이명이 없다는 뜻이 아니다. 기존 별칭 및 이번 그림에 영향을 주는 분류 충돌을 검토했으며 완전한 이명 목록을 편찬한 것은 아니다.

| speciesId | 국명 | 유지한 학명 | 기존 이명/조합 | 분류·형태 대조 출처 |
|---|---|---|---|---|
| oak | 상수리나무 | *Quercus acutissima* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://powo.science.kew.org/taxon/295743-1) · [자료 3](https://www.bris.go.kr/portal/book/childIlustbkDetailPopup.do?ilustbkNo=1497&menuId=114) · [자료 4](https://www.inaturalist.org/taxa/167634) |
| grass | 강아지풀 | *Setaria viridis* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://powo.science.kew.org/taxon/1171009-2) · [자료 3](https://www.inaturalist.org/taxa/79070) |
| grasshopper | 방아깨비 | *Acrida cinerea* | 기존 별칭 추가 채택 없음 | [자료 1](https://species.nibr.go.kr/kiiks/social/grasshopper.do) · [자료 2](https://www.inaturalist.org/taxa/358062) |
| frog | 참개구리 | *Pelophylax nigromaculatus* | *Rana nigromaculata* | [자료 1](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf) · [자료 2](https://www.inaturalist.org/taxa/66330) |
| rabbit | 멧토끼 | *Lepus coreanus* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf) · [자료 2](https://www.inaturalist.org/taxa/43144) |
| mushroom | 구름송편버섯 | *Trametes versicolor* | *Coriolus versicolor* | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://www.inaturalist.org/taxa/54134) |
| pine | 소나무 | *Pinus densiflora* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A262894-1) · [자료 3](https://www.inaturalist.org/taxa/135811) |
| raspberry | 산딸기 | *Rubus crataegifolius* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://powo.science.kew.org/taxon/736083-1) · [자료 3](https://www.inaturalist.org/taxa/448109) |
| hazel | 팽나무 | *Celtis sinensis* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf) · [자료 2](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A851171-1/general-information) · [자료 3](https://www.inaturalist.org/taxa/76204) |
| chipmunk | 다람쥐 | *Eutamias sibiricus* | *Tamias sibiricus* | [자료 1](https://www.mammaldiversity.org/taxon/1001719/) · [자료 2](https://www.inaturalist.org/taxa/520585) |
| field-mouse | 고슴도치 | *Erinaceus amurensis* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=64&um=s) · [자료 2](https://www.inaturalist.org/taxa/43047) |
| caterpillar | 솔나방 애벌레(송충이) | *Dendrolimus spectabilis* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=admin&catimage=&eclang=ko&start=506&um=s) · [자료 2](https://www.forest.go.kr/kfsweb/mer/fip/dbhis/selectInsectDetail.do?dbhisIdno=57&dbhisTpcd=20&mn=AR04_02_02_05&viewType=time) · [자료 3](https://www.inaturalist.org/taxa/896395) |
| aphid | 청동풍뎅이 | *Anomala albopilosa* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=normal&catimage=&eclang=ko&start=272&um=s) · [자료 2](https://www.inaturalist.org/taxa/360299) |
| snail | 명주달팽이 | *Acusta despecta* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10) · [자료 2](https://grandpark.seoul.go.kr/animal/animalView.do?idx=2082&lang=ko&menu_id=S001002002003&pageIndex=1) · [자료 3](https://molluscabase.org/aphia.php?p=taxlist&tName=Acusta+despecta) · [자료 4](https://www.inaturalist.org/taxa/446746) |
| spider | 무당거미 | *Trichonephila clavata* | *Nephila clavata* | [자료 1](https://wsc.nmbe.ch/spec-data/29057) · [자료 2](https://www.inaturalist.org/taxa/904334) |
| ladybird | 홍단딱정벌레 | *Carabus smaragdinus* | *Coptolabrus smaragdinus*; *Damaster smaragdinus* | [자료 1](https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=120930&mode=Info) · [자료 2](https://www.inaturalist.org/taxa/508583) |
| tit | 박새 | *Parus minor* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html) · [자료 2](https://www.birds.cornell.edu/clementschecklist/updates-and-corrections-october-2024/) · [자료 3](https://www.inaturalist.org/taxa/1583985) |
| bulbul | 직박구리 | *Hypsipetes amaurotis* | *Microscelis amaurotis* | [자료 1](https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1403&callmode=admin&catimage=&eclang=ko&start=168&um=s) · [자료 2](https://www.inaturalist.org/taxa/144910) |
| snake | 유혈목이 | *Rhabdophis tigrinus* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf) · [자료 2](https://www.inaturalist.org/taxa/28829) |
| weasel | 족제비 | *Mustela sibirica* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf) · [자료 2](https://www.inaturalist.org/taxa/41813) |
| goshawk | 참매 | *Astur gentilis* | *Accipiter gentilis* | [자료 1](https://www.worldbirdnames.org/updates/taxonomy/) · [자료 2](https://www.inaturalist.org/taxa/1579015) |
| litter-mold | 낙엽 분해 곰팡이 군집 | 학명 없음 — 기능군 | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community) · [자료 2](https://www.nrcs.usda.gov/sites/default/files/2025-06/Tech%20Note%20Cropland%20In-Field%20Soil%20Health%20Assessment%20Guide-508.pdf#page=13) |
| soil-bacteria | 고초균 | *Bacillus subtilis* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nongsaro.go.kr/portal/ps/psq/psqb/farmTermSimpleDicLst.ps?menuId=PS00064&sWordNm=%EA%B3%A0%EC%B4%88%EA%B7%A0&searchTagWord=%EA%B3%A0%EC%B4%88%EA%B7%A0) · [자료 2](https://lpsn.dsmz.de/species/bacillus-subtilis) · [자료 3](https://wwwn.cdc.gov/phil/Details.aspx?pid=19261) · [자료 4](https://www.inaturalist.org/taxa/245605) |
| earthworm | 참지렁이 | *Amynthas koreanus* | 기존 별칭 추가 채택 없음 | [자료 1](https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf) · [자료 2](https://itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=975168) · [자료 3](https://nomenclatura-oligochaetologica.inhs.illinois.edu/nomenclator-specierum/nomenclator-specierum-k/) |

주요 판단:

- 홍단딱정벌레: [NCBI Taxonomy](https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=120930&mode=Info)는 Carabus smaragdinus에 Coptolabrus/Damaster 조합을 열거한다. 자료의 조합 차이를 기록하고 ID·현재 게임 학명은 유지했다. NCBI 자체도 최종 명명법 권위가 아님을 밝히므로 그 목록만으로 모든 아종의 외형을 확정하지 않았다.
- 박새: 국내/일본 산림 자료의 Parus minor와 [Clements 2024의 Asian Tit 통합](https://www.birds.cornell.edu/clementschecklist/updates-and-corrections-october-2024/)에 따른 Parus cinereus minor 표기가 다르다. iNaturalist에서도 Parus minor 검색이 Parus cinereus로 연결되어, 광범위한 Asian Tit 전체가 아닌 minor 아종 사진을 선택했다. 기존 게임의 학명을 자동 변경하지 않았다.
- 명주달팽이: [서울대공원](https://grandpark.seoul.go.kr/animal/animalView.do?idx=2082&lang=ko&menu_id=S001002002003&pageIndex=1)의 Acusta despecta 국명 대응과 [MolluscaBase](https://molluscabase.org/aphia.php?p=taxlist&tName=Acusta+despecta)의 A. despecta sieboldtiana → A. sieboldtiana 분리는 동일한 문제가 아니다. 후자를 A. despecta의 단순 이명으로 합치지 않았다. 한국 명주달팽이 카드가 어느 현대 분류 개념을 가리키는지 미해결로 남겼다.
- 참지렁이: 국가생물종목록과 [ITIS TSN 975168](https://itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=975168)에서 Amynthas koreanus 이름을 대조했지만 믿을 만한 정확종 사진을 확보하지 못했다. 다른 Amynthas 종 사진을 대체하지 않았고 일반적인 지렁이 구조만 개선했다.
- 참매는 Astur gentilis/과거 Accipiter gentilis 조합을 대조했다. 북미 A. atricapillus를 같은 종 사진으로 대체하지 않았다. 구름송편버섯·무당거미·다람쥐 등은 현재 카드와 기존 별칭을 함께 대조했다. 멧토끼의 과거 국가 목록 표기 Lepus sinensis coreanus도 확인했으나 현재 Lepus coreanus 카드를 바꾸지 않았다.
- 낙엽 분해 곰팡이는 기능군이므로 학명 null을 유지했다. 고초균의 역사적 명칭은 [LPSN](https://lpsn.dsmz.de/species/bacillus-subtilis)을 확인했으며, 막대 모양만으로 고초균을 동정할 수 있다는 주장을 하지 않는다.

## C. 실제 사진과의 비교 및 이용 조건

22개 카드 대상에 각각 3장, 총 66장의 사진/현미경 자료를 검토했다. 이 중 명주달팽이 사진은 플랫폼의 Acusta despecta 라벨과 대응하지만 위의 국명·현대 분류 불확실성까지 해결한 것은 아니다. 낙엽 곰팡이는 일반 균사 참고 1장만 확인했으며 사진만으로 분해 기능을 동정하지 않았다. 참지렁이는 정확종 사진 0장이다. 따라서 총 67개 참고 이미지 기록을 모든 24종에 대한 정확종 3장씩 검증으로 바꿔 말하지 않는다.

관찰 플랫폼의 동정명·학명·생애 단계를 대조하고, 여러 자세·무늬를 확인했다. 각 종의 모든 사진이 상면·측면·자연 활동·근접의 네 시점을 모두 제공하지는 않는다. 사진의 관찰자 동정이 독립 전문가 재동정을 대신하지 않는다. 솔나방은 애벌레 사진만 외형 기준으로 선택했고 홍단딱정벌레의 애벌레와 고초균의 배양 접시는 성충/세포 형태 기준에서 제외했다. 고초균에는 [CDC 현미경 사진 19261](https://wwwn.cdc.gov/phil/Details.aspx?pid=19261)을 포함했다.

CC BY/NC/SA/ND, 권리 유보 및 이용 조건 미확인 사진이 섞여 있다. 확인 당시의 촬영자·라이선스를 각각 기록했다. 사진을 저장소·게임·QA 페이지에 삽입하지 않았고 벡터 추적이나 픽셀 복제를 하지 않았다. .gov 자료의 모든 그림이 자동으로 공개 영역이라는 가정도 하지 않았다. 아래는 원본 출처 링크이며, 그림을 다시 이용하려면 해당 원본의 조건을 따로 확인해야 한다.

### 상수리나무 — oak

*Quercus acutissima*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 139952358](https://www.inaturalist.org/photos/139952358) — Quercus acutissima; (c) Bruce Kirchoff, some rights reserved (CC BY); 이용 조건: cc-by.
- [사진 454306081](https://www.inaturalist.org/photos/454306081) — Quercus acutissima; (c) G. Gerben, some rights reserved (CC BY-ND), uploaded by G. Gerben; 이용 조건: cc-by-nd.
- [사진 64073143](https://www.inaturalist.org/photos/64073143) — Quercus acutissima; (c) Yanghoon Cho, all rights reserved, uploaded by Yanghoon Cho; 이용 조건: 미확인/재사용하지 않음.

### 강아지풀 — grass

*Setaria viridis*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 453056490](https://www.inaturalist.org/photos/453056490) — Setaria viridis; (c) eugenezakharov, some rights reserved (CC BY-NC), uploaded by eugenezakharov; 이용 조건: cc-by-nc.
- [사진 9580146](https://www.inaturalist.org/photos/9580146) — Setaria viridis; (c) Don Sutherland, some rights reserved (CC BY-NC), uploaded by Don Sutherland; 이용 조건: cc-by-nc.
- [사진 422593113](https://www.inaturalist.org/photos/422593113) — Setaria viridis; (c) Thomas Gyselinck, some rights reserved (CC BY), uploaded by Thomas Gyselinck; 이용 조건: cc-by.

### 방아깨비 — grasshopper

*Acrida cinerea*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 1111215](https://www.inaturalist.org/photos/1111215) — Acrida cinerea; (c) harum.koh, some rights reserved (CC BY-SA), uploaded by harum.koh; 이용 조건: cc-by-sa.
- [사진 542188675](https://www.inaturalist.org/photos/542188675) — Acrida cinerea; (c) 褄黒ハル, some rights reserved (CC BY-NC), uploaded by 褄黒ハル; 이용 조건: cc-by-nc.
- [사진 54690995](https://www.inaturalist.org/photos/54690995) — Acrida cinerea; (c) Wonwoong Kim, all rights reserved, uploaded by Wonwoong Kim; 이용 조건: 미확인/재사용하지 않음.

### 참개구리 — frog

*Pelophylax nigromaculatus*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 600214579](https://www.inaturalist.org/photos/600214579) — Pelophylax nigromaculatus; (c) Elena_Sherehora, some rights reserved (CC BY-NC), uploaded by Elena_Sherehora; 이용 조건: cc-by-nc.
- [사진 296401866](https://www.inaturalist.org/photos/296401866) — Pelophylax nigromaculatus; (c) sarah laurino, all rights reserved, uploaded by sarah laurino; 이용 조건: 미확인/재사용하지 않음.
- [사진 526141742](https://www.inaturalist.org/photos/526141742) — Pelophylax nigromaculatus; (c) Herpeto-Ichthyo Ecosystems and Lifeforms International Observation Society (HELIOS), all rights reserved, uploaded by Herpeto-Ichthyo Ecosystems and Lifeforms International Observation Society (HELIOS); 이용 조건: 미확인/재사용하지 않음.

### 멧토끼 — rabbit

*Lepus coreanus*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 24269600](https://www.inaturalist.org/photos/24269600) — Lepus coreanus; (c) Kim, Hyun-tae, some rights reserved (CC BY-NC), uploaded by Kim, Hyun-tae; 이용 조건: cc-by-nc.
- [사진 58736656](https://www.inaturalist.org/photos/58736656) — Lepus coreanus; (c) onidiras-iNaturalist, some rights reserved (CC BY-NC), uploaded by onidiras-iNaturalist; 이용 조건: cc-by-nc.
- [사진 10766514](https://www.inaturalist.org/photos/10766514) — Lepus coreanus; (c) Alexander Ganse, some rights reserved (CC BY-NC), uploaded by Alexander Ganse; 이용 조건: cc-by-nc.

### 구름송편버섯 — mushroom

*Trametes versicolor*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 160331738](https://www.inaturalist.org/photos/160331738) — Trametes versicolor; (c) Christine Young, some rights reserved (CC BY), uploaded by Christine Young; 이용 조건: cc-by.
- [사진 27005174](https://www.inaturalist.org/photos/27005174) — Trametes versicolor; no rights reserved, uploaded by Ken Kneidel; 이용 조건: cc0.
- [사진 160332042](https://www.inaturalist.org/photos/160332042) — Trametes versicolor; (c) Christine Young, some rights reserved (CC BY), uploaded by Christine Young; 이용 조건: cc-by.

### 소나무 — pine

*Pinus densiflora*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 1586915](https://www.inaturalist.org/photos/1586915) — Pinus densiflora; (c) harum.koh, some rights reserved (CC BY-SA), uploaded by harum.koh; 이용 조건: cc-by-sa.
- [사진 1586917](https://www.inaturalist.org/photos/1586917) — Pinus densiflora; (c) harum.koh, some rights reserved (CC BY-SA), uploaded by harum.koh; 이용 조건: cc-by-sa.
- [사진 196995](https://www.inaturalist.org/photos/196995) — Pinus densiflora; (c) Kok Leng Yeo, some rights reserved (CC BY); 이용 조건: cc-by.

### 산딸기 — raspberry

*Rubus crataegifolius*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 8845762](https://www.inaturalist.org/photos/8845762) — Rubus crataegifolius; (c) Paul B., some rights reserved (CC BY-NC-ND), uploaded by Paul B.; 이용 조건: cc-by-nc-nd.
- [사진 73738600](https://www.inaturalist.org/photos/73738600) — Rubus crataegifolius; (c) Yanghoon Cho, all rights reserved, uploaded by Yanghoon Cho; 이용 조건: 미확인/재사용하지 않음.
- [사진 28166057](https://www.inaturalist.org/photos/28166057) — Rubus crataegifolius; (c) snv2, all rights reserved, uploaded by snv2; 이용 조건: 미확인/재사용하지 않음.

### 팽나무 — hazel

*Celtis sinensis*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 368486454](https://www.inaturalist.org/photos/368486454) — Celtis sinensis; no rights reserved, uploaded by 葉子; 이용 조건: cc0.
- [사진 368486430](https://www.inaturalist.org/photos/368486430) — Celtis sinensis; no rights reserved, uploaded by 葉子; 이용 조건: cc0.
- [사진 13654956](https://www.inaturalist.org/photos/13654956) — Celtis sinensis; (c) Young Chan, some rights reserved (CC BY-NC), uploaded by Young Chan; 이용 조건: cc-by-nc.

### 다람쥐 — chipmunk

*Eutamias sibiricus*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 553742110](https://www.inaturalist.org/photos/553742110) — Eutamias sibiricus; (c) Дмитрий, some rights reserved (CC BY-NC), uploaded by Дмитрий; 이용 조건: cc-by-nc.
- [사진 213995998](https://www.inaturalist.org/photos/213995998) — Eutamias sibiricus; (c) Dmitry Dubikovskiy, some rights reserved (CC BY-NC), uploaded by Dmitry Dubikovskiy; 이용 조건: cc-by-nc.
- [사진 1958303](https://www.inaturalist.org/photos/1958303) — Eutamias sibiricus; (c) Paul Cools, some rights reserved (CC BY-NC), uploaded by Paul Cools; 이용 조건: cc-by-nc.

### 고슴도치 — field-mouse

*Erinaceus amurensis*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 675339045](https://www.inaturalist.org/photos/675339045) — Erinaceus amurensis; (c) 藜梓柠, some rights reserved (CC BY-NC), uploaded by 藜梓柠; 이용 조건: cc-by-nc.
- [사진 675339193](https://www.inaturalist.org/photos/675339193) — Erinaceus amurensis; (c) 藜梓柠, some rights reserved (CC BY-NC), uploaded by 藜梓柠; 이용 조건: cc-by-nc.
- [사진 263522592](https://www.inaturalist.org/photos/263522592) — Erinaceus amurensis; (c) Li Jianong, some rights reserved (CC BY-NC), uploaded by Li Jianong; 이용 조건: cc-by-nc.

### 솔나방 애벌레(송충이) — caterpillar

*Dendrolimus spectabilis*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 235663744](https://www.inaturalist.org/observations/137934194) — Dendrolimus spectabilis; (c) Leslie Hurteau, some rights reserved (CC BY-NC); 이용 조건: cc-by-nc.
- [사진 130224824](https://www.inaturalist.org/observations/79503159) — Dendrolimus spectabilis; (c) onidiras-iNaturalist, some rights reserved (CC BY-NC); 이용 조건: cc-by-nc.
- [사진 116069413](https://www.inaturalist.org/observations/71309189) — Dendrolimus spectabilis; no rights reserved; 이용 조건: cc0.

### 청동풍뎅이 — aphid

*Anomala albopilosa*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 571765073](https://www.inaturalist.org/photos/571765073) — Anomala albopilosa; (c) Dhugal Lindsay, some rights reserved (CC BY-NC), uploaded by Dhugal Lindsay; 이용 조건: cc-by-nc.
- [사진 541034298](https://www.inaturalist.org/photos/541034298) — Anomala albopilosa; (c) SAI A.D.A, all rights reserved, uploaded by SAI A.D.A; 이용 조건: 미확인/재사용하지 않음.
- [사진 46358986](https://www.inaturalist.org/photos/46358986) — Anomala albopilosa; (c) mieko w, all rights reserved, uploaded by mieko w; 이용 조건: 미확인/재사용하지 않음.

### 명주달팽이 — snail

*Acusta despecta*. 농사로/서울대공원의 Acusta despecta 국명은 확인. MolluscaBase의 A.despecta sieboldtiana→A.sieboldtiana 처리는 별도의 분류이다. 두 종을 동일하다고 확정하지 않고 기존 카드 학명을 유지.

- [사진 169087841](https://www.inaturalist.org/photos/169087841) — Acusta despecta; (c) Carol Kwok, all rights reserved, uploaded by Carol Kwok; 이용 조건: 미확인/재사용하지 않음.
- [사진 1568647](https://www.inaturalist.org/photos/1568647) — Acusta despecta; (c) ふうけ, some rights reserved (CC BY-SA); 이용 조건: cc-by-sa.
- [사진 91074228](https://www.inaturalist.org/photos/91074228) — Acusta despecta; (c) Takaaki Hattori, some rights reserved (CC BY), uploaded by Takaaki Hattori; 이용 조건: cc-by.

### 무당거미 — spider

*Trichonephila clavata*. 성숙 암컷 대표 그림. 수컷/어린 거미의 크기·색은 이 그림으로 대표하지 않음.

- [사진 240469491](https://www.inaturalist.org/photos/240469491) — Trichonephila clavata; (c) Trey Wardlaw, some rights reserved (CC BY-NC), uploaded by Trey Wardlaw; 이용 조건: cc-by-nc.
- [사진 240469503](https://www.inaturalist.org/photos/240469503) — Trichonephila clavata; (c) Trey Wardlaw, some rights reserved (CC BY-NC), uploaded by Trey Wardlaw; 이용 조건: cc-by-nc.
- [사진 53251434](https://www.inaturalist.org/photos/53251434) — Trichonephila clavata; (c) Observações Naturalistas | Bruno Uehara, some rights reserved (CC BY-NC), uploaded by Observações Naturalistas | Bruno Uehara; 이용 조건: cc-by-nc.

### 홍단딱정벌레 — ladybird

*Carabus smaragdinus*. NCBI는 Carabus smaragdinus를 쓰며 Coptolabrus/Damaster 조합을 동형이명으로 열거. 아종과 체색 변이를 단일 표준색으로 확정하지 않음.

- [사진 378861842](https://www.inaturalist.org/photos/378861842) — Carabus smaragdinus; (c) Junyoung Lee, some rights reserved (CC BY-NC), uploaded by Junyoung Lee; 이용 조건: cc-by-nc.
- [사진 311502693](https://www.inaturalist.org/photos/311502693) — Carabus smaragdinus; (c) georgming, some rights reserved (CC BY-NC), uploaded by georgming; 이용 조건: cc-by-nc.
- [사진 13128702](https://www.inaturalist.org/photos/13128702) — Carabus smaragdinus; (c) Taewoo Kim, all rights reserved, uploaded by Taewoo Kim; 이용 조건: 미확인/재사용하지 않음.

채택하지 않은 사진: {"photoId":170197107,"url":"https://inaturalist-open-data.s3.amazonaws.com/photos/170197107/medium.jpeg","license":"cc-by-nc","attribution":"(c) Leslie Hurteau, some rights reserved (CC BY-NC), uploaded by Leslie Hurteau","source":"https://www.inaturalist.org/photos/170197107","label":"Carabus smaragdinus","reason":"Larva; excluded from adult shape reference"}

### 박새 — tit

*Parus minor*. 국내/일본 산림 자료는 Parus minor. Clements2024/AviList1.0 및 iNaturalist는 Parus cinereus에 통합. 사진은 minor 아종만 골랐으며 게임의 이름/ID를 변경하지 않음.

- [사진 2743774](https://www.inaturalist.org/photos/2743774) — Parus cinereus minor; (c) Kim, Hyun-tae, some rights reserved (CC BY), uploaded by Kim, Hyun-tae; 이용 조건: cc-by.
- [사진 105265339](https://www.inaturalist.org/photos/105265339) — Parus cinereus minor; (c) WATANABE Hitoshi 渡辺仁, some rights reserved (CC BY), uploaded by WATANABE Hitoshi 渡辺仁; 이용 조건: cc-by.
- [사진 220332462](https://www.inaturalist.org/photos/220332462) — Parus cinereus minor; (c) yah_japan, some rights reserved (CC BY-NC), uploaded by yah_japan; 이용 조건: cc-by-nc.

### 직박구리 — bulbul

*Hypsipetes amaurotis*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 20566056](https://www.inaturalist.org/photos/20566056) — Hypsipetes amaurotis; (c) Toshihiro Gamo, some rights reserved (CC BY); 이용 조건: cc-by.
- [사진 388249265](https://www.inaturalist.org/photos/388249265) — Hypsipetes amaurotis; (c) Conor McMahon, some rights reserved (CC BY-NC), uploaded by Conor McMahon; 이용 조건: cc-by-nc.
- [사진 389293348](https://www.inaturalist.org/photos/389293348) — Hypsipetes amaurotis; (c) Chen Alice, all rights reserved, uploaded by Chen Alice; 이용 조건: 미확인/재사용하지 않음.

### 유혈목이 — snake

*Rhabdophis tigrinus*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 398143272](https://www.inaturalist.org/photos/398143272) — Rhabdophis tigrinus; (c) ak_s, some rights reserved (CC BY-NC); 이용 조건: cc-by-nc.
- [사진 2813397](https://www.inaturalist.org/photos/2813397) — Rhabdophis tigrinus; (c) Kim, Hyun-tae, some rights reserved (CC BY), uploaded by Kim, Hyun-tae; 이용 조건: cc-by.
- [사진 137108344](https://www.inaturalist.org/photos/137108344) — Rhabdophis tigrinus; (c) rachelandjun, some rights reserved (CC BY), uploaded by rachelandjun; 이용 조건: cc-by.

### 족제비 — weasel

*Mustela sibirica*. 사진의 동정명과 기존 분류 출처를 대조. 게임용 대표 자세이며 종 전체의 변이·동정 형질을 모두 재현하지 않음.

- [사진 420576](https://www.inaturalist.org/photos/420576) — Mustela sibirica; (c) Kim, Hyun-tae, all rights reserved, uploaded by Kim, Hyun-tae; 이용 조건: 미확인/재사용하지 않음.
- [사진 353278821](https://www.inaturalist.org/photos/353278821) — Mustela sibirica; (c) hangnamori, some rights reserved (CC BY-NC), uploaded by hangnamori; 이용 조건: cc-by-nc.
- [사진 679544409](https://www.inaturalist.org/photos/679544409) — Mustela sibirica; (c) Поляков Александр, some rights reserved (CC BY), uploaded by Поляков Александр; 이용 조건: cc-by.

### 참매 — goshawk

*Astur gentilis*. Astur gentilis는 북미 A.atricapillus와 구분. 성체 대표 그림이며 유조의 무늬/색이 다름.

- [사진 61773674](https://www.inaturalist.org/photos/61773674) — Astur gentilis; (c) Luigi Andena, some rights reserved (CC BY-NC), uploaded by Luigi Andena; 이용 조건: cc-by-nc.
- [사진 148266689](https://www.inaturalist.org/photos/148266689) — Astur gentilis; (c) Александр, some rights reserved (CC BY-NC-SA), uploaded by Александр; 이용 조건: cc-by-nc-sa.
- [사진 114910385](https://www.inaturalist.org/photos/114910385) — Astur gentilis; (c) Stanislav Cherepushkin, some rights reserved (CC BY-NC), uploaded by Stanislav Cherepushkin; 이용 조건: cc-by-nc.

### 낙엽 분해 곰팡이 군집 — litter-mold

학명 없음 — 기능군. 기능군이므로 학명 null. 사진은 일반 균사 형태 참고일 뿐 특정 종/기능의 동정 자료가 아님.

- [사진 generic-mycelium](https://frankies.jimdofree.com/pilze/) — 일반 균사 형태 — 종·분해 기능은 사진만으로 미확정; Rights/photographer not verified; reference only; no reuse; 이용 조건: 미확인/재사용하지 않음. General hyphal form only; not evidence that the photographed fungus is this game functional group

### 고초균 — soil-bacteria

*Bacillus subtilis*. 막대 형태만으로 종 동정 불가. 확대·도식색이며 현미경 염색 사진의 색과 자연 상태의 색은 다름.

- [사진 304497](https://www.inaturalist.org/photos/304497) — Bacillus subtilis; (c) Y tambe (original uploader), some rights reserved (CC BY-SA); 이용 조건: cc-by-sa.
- [사진 329776973](https://www.inaturalist.org/observations/188422517) — Bacillus subtilis; (c) Róbert Ívar, some rights reserved (CC BY-NC); 이용 조건: cc-by-nc.
- [사진 CDC19261](https://wwwn.cdc.gov/phil/Details.aspx?pid=19261) — Bacillus subtilis, Gram-stained cells; CDC/Dr. W.A. Clark,1977; 이용 조건: Public domain; credit CDC and Dr. W.A. Clark; see PHIL terms.

채택하지 않은 사진: {"photoId":105398441,"url":"https://inaturalist-open-data.s3.amazonaws.com/photos/105398441/medium.jpg","license":"cc-by-nc","attribution":"(c) Alexander Iosipenko, some rights reserved (CC BY-NC)","source":"https://www.inaturalist.org/observations/65477802","label":"Bacillus subtilis","place":"Строителей переулок, Луховицы, Московская область, RU","annotations":[],"reason":"Culture colony; not used to infer cell shape"}

### 참지렁이 — earthworm

*Amynthas koreanus*. NIBR/ITIS의 이름을 대조했으나 확실한 정확종 사진3장을 확보하지 못함. 동정에는 전문가와 종 특유 표지가 필요.

- 정확한 종으로 확인된 사진 확보 미완료. 다른 지렁이 사진을 참지렁이 사진으로 대체하지 않았다.

## D. 24종 이미지 수정·검증표

‘제작 완료’는 참고 특징을 그림에 반영하고 화면·모션 검사를 통과했다는 의미다. 종 동정 도해 수준의 완전성이나 교실 인식 검사를 의미하지 않는다. 각 항목의 학명·이명은 B, 실제 사진·권리는 C와 연결된다.

| speciesId / 국명 | 확인·선택한 특징 3~5개 | 기존 문제 | 반영한 수정 | 이미지 상태 | 모션 검사 |
|---|---|---|---|---|---|
| oak / 상수리나무 | 긴 타원/피침형의 단순 잎; 끝이 뾰족한 톱니; 깊게 갈라진 회갈색 줄기; 퍼진 수관; 거친 비늘의 도토리 깍정이 | 둥근 수관과 보통 잎, 작은 도토리만 있음 | 길고 톱니진 잎·줄기 결·도토리의 깍정이를 강조. 잎 자세 모션에서도 잘리지 않도록 그림 안 여백 조정 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / growth / leaf-turn, 각 2프레임 / 정상 |
| grass / 강아지풀 | 원통형 꽃이삭; 꽃이삭의 긴 까락; 좁고 긴 잎; 마디 있는 가는 줄기 | 굵고 매끈한 타원3개가 이삭처럼 보임 | 작은 이삭과 까락이 모인 긴 원통형 머리·좁은 잎·줄기 마디. 새싹에는 이삭 없음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / growth / leaf-turn + 새싹, 12뷰 / 정상 |
| grasshopper / 방아깨비 | 길게 기운 원뿔형 머리; 가늘고 긴 몸과 긴 앞날개; 눈이 머리 옆에 길쭉하게 위치; 길고 접힌 뒷다리; 짧은 칼 모양 더듬이 | 둥근 머리·넓적한 몸의 일반 메뚜기 | 뾰족하고 긴 머리·경사진 눈·긴 날개·두꺼운 뒷넓적다리와 가는 종아리,6다리. 약충은 짧은 날개싹 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat + 약충, 12뷰 / 정상 |
| frog / 참개구리 | 황갈색·회녹색의 몸; 등과 다리의 검은 반점; 밝은 중앙 등줄과 등옆선; 돌출된 눈과 고막; 접힌 굵은 뒷다리 | 균일한 연두색, 등 반점과 등줄이 부족 | 회녹색/황갈색 바탕·검은 반점·밝은 줄·고막·긴 접힌 뒷다리·가느다란 앞다리 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| rabbit / 멧토끼 | 회갈색 거친 털; 검은 끝의 긴 귀; 큰 뒷다리와 긴 뒷발; 짧고 밝은 꼬리; 길쭉한 야생 토끼 머리 | 반려 토끼 같은 둥근 몸과 균일한 갈색 | 회갈색 털 결, 검은 귀 끝, 굵은 뒷넓적다리·긴 뒷발, 작은 꼬리와 머리 비율을 새로 그림 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| mushroom / 구름송편버섯 | 목재에 붙는 얇은 부채형 자실체; 겹쳐 자라는 선반 모양; 여러 색의 동심원 띠; 밝고 얇은 가장자리; 흰색 계열의 미세한 구멍 밑면 | 두껍고 둥근 반원으로 잘린 나무 단면처럼 보임 | 얇고 물결진 부채형 자실체를 겹치고 회색·갈색·크림색 띠와 밝은 가장자리, 드러난 밑면의 작은 구멍을 표시. 균사체 단계는 자실체 없음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / active + 균사체, 8뷰 / 정상 |
| pine / 소나무 | 두 잎씩 묶여 나는 바늘잎; 붉은빛의 위쪽 줄기; 비교적 열린 가지/수관; 작은 난형 솔방울 | 삼각형 크리스마스트리 같은 외곽과 가로선 | 굽은 적갈색 줄기·열린 가지·솔잎 쌍·작은 솔방울. 단일 삼각형을 없앰 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / growth / leaf-turn, 각 2프레임 / 정상 |
| raspberry / 산딸기 | 3~5갈래로 갈라진 단순 잎; 톱니 있는 잎 가장자리; 여러 갈래로 뻗는 관목 줄기; 작은 열매 알갱이가 모인 붉은 열매 | 매끈한 타원 잎과 둥근 열매3점 | 손바닥처럼 갈라진 단순 잎과 잎맥, 관목 줄기와 작은 가시, 알갱이 모인 열매 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / growth / leaf-turn, 각 2프레임 / 정상 |
| hazel / 팽나무 | 넓게 퍼지는 큰 나무; 회색의 비교적 매끈한 줄기; 비대칭 잎 밑부분; 잎 윗부분의 톱니와 기부3맥; 자루에 매달린 둥근 작은 열매 | 개암나무처럼도 읽히는 보통 잎, 다른 나무와 비슷한 수관 | 회색 줄기·넓은 가지·비대칭 잎과 기부 맥·가는 자루의 작은 갈색 열매. 개암 견과류나 상수리 도토리를 쓰지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / growth / leaf-turn, 각 2프레임 / 정상 |
| chipmunk / 다람쥐 | 몸 등 쪽의 여러 어두운 세로줄; 눈 위아래 얼굴 줄무늬; 작고 둥근 귀; 가는 긴 꼬리; 청설모보다 작고 가는 몸 | 줄무늬만 더한 토끼 같은 몸, 꼬리가 두껍고 크게 말림 | 낮고 긴 몸·얼굴 줄·등의 진한 줄과 밝은 사이 줄·가늘고 긴 꼬리로 구분. 사선 측면에서는 등 줄 일부가 가려짐 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| field-mouse / 고슴도치 | 몸통 등/옆의 촘촘한 가시; 털 난 얼굴과 뾰족한 주둥이; 작은 둥근 귀; 짧은 다리; 가시가 없는 배와 얼굴 | 가시가 굵은 톱니 윤곽뿐이고 얼굴은 다른 포유류와 같음 | 몸통에만 겹친 가시, 작은 귀와 긴 주둥이·검은 코·낮은4다리. 가시의 미세한 색띠는 축소 화면에서 생략 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| caterpillar / 솔나방 애벌레(송충이) | 잘 구분되는 긴 몸마디; 회갈색·검정·황갈색 무늬; 몸마디의 긴 털; 앞부분의 밝은 털 띠; 머리 가까운 가슴다리와 배다리 | 구슬 모양 마디와 짧은 털, 무늬 없는 일반 애벌레 | 짙은 마디·황갈색 등무늬·긴 털과 밝은 앞 띠,3쌍 가슴다리와5쌍 배다리의 측면 겹침. 나방 성충을 쓰지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| aphid / 청동풍뎅이 | 작은 머리와 넓은 앞가슴; 통통하고 볼록한 타원형 딱지날개; 녹색·청동빛 표면; 짧은 끝 부채꼴 더듬이; 가슴 부분에 붙은6다리 | 홍단딱정벌레와 같은 둥근 곤충 틀, 길고 가는 더듬이 | 볼록한 녹색 몸·넓은 앞가슴·작은 머리·짧은 더듬이 끝·6다리를 독립 구성 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| snail / 명주달팽이 | 낮은 원뿔 모양 껍데기 꼭대기; 부푼 마지막 나층과 큰 입구; 황갈색의 얇아 보이는 껍데기; 긴 눈자루2개와 짧은 더듬이2개; 넓은 배발 | 평평한 원반형 나선 껍데기와2더듬이 | 낮은 첨탑·겹친 나층·큰 껍데기 입구와4더듬이. 국명/학명 대응이 미해결이므로 특정 한국 개체의 표준 외형이라고 확정하지 않음 | 일부 개선 — 정확종 형태 검증 미완료 | idle / move / eat, 각 2프레임 / 정상 |
| spider / 무당거미 | 성숙 암컷의 길쭉한 복부; 복부의 노랑·녹회색 띠; 작은 머리가슴; 머리가슴에 붙은 긴8다리; 다리의 밝은 띠 | 짧고 굵은 다리가 복부 쪽에 붙은 둥근 거미 | 작은 머리가슴에8다리를 붙이고 복부를 길게, 노랑·회녹색 띠와 다리 띠를 반영. 작은 수컷 외형은 대표하지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| ladybird / 홍단딱정벌레 | 길게 나온 머리와 큰턱; 잘록하고 별도인 앞가슴; 길고 넓은 타원형 딱지날개; 딱지날개 점각·굴곡; 가늘고 긴6다리·실 모양 더듬이 | 둥근 풍뎅이 몸통에 색만 바뀌고 앞부분이 짧았음 | 앞가슴·머리·딱지날개를 분리하고 후방을 길게, 점각3줄·턱·긴6다리·더듬이를 그림. 구릿빛과 녹색 가장자리는 한 색형의 예이며 아종 판별을 뜻하지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| tit / 박새 | 검은 머리·목; 크고 흰 볼; 밝은 배의 검은 가슴선; 올리브색 등과 흰 날개선; 작고 짧은 부리 | 직박구리와 같은 새 몸통을 색만 바꿈 | 작고 둥근 몸·짧은 부리·흰 볼·검은 가슴선·올리브 등·흰 날개선을 독립 외형으로 그림 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| bulbul / 직박구리 | 길고 뾰족한 부리; 회색 머리와 약한 뾰족 깃; 갈색 귀/뺨 부분; 길쭉한 회갈색 몸과 긴 꼬리; 가슴의 옅은 줄무늬 | 박새와 같은 짧은 몸/꼬리와 큰 머리 | 더 긴 몸과 꼬리·가느다란 부리·갈색 귀 부분·회색 가슴 무늬. 박새의 흰 볼/검은 가슴선은 없음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| snake / 유혈목이 | 길고 가는 몸; 목 뒤 붉은빛/주황색 부분; 검은 사각 반점 줄; 삼각형 독사형과 다른 길쭉한 머리; 머리 옆 검은 무늬 | 일반 초록색 뱀에 목 띠만 있음 | 더 가는 회녹색 몸·목 뒤 주황색과 검은 반점·밝은 아랫면·얼굴 검은 무늬. 체색은 개체차가 있어 유일한 색으로 확정하지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| weasel / 족제비 | 매우 긴 몸통과 목; 짧은4다리; 작은 둥근 귀; 담갈색/황갈색 털; 어두운 얼굴과 밝은 입 주변 | 다른 포유류와 같은 둥근 몸·큰 귀 | 길고 낮은 몸과 목, 짧은 다리·긴 꼬리·작은 귀·얼굴 색 배치를 독립 그림으로 구성 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| goshawk / 참매 | 성체의 회색 등; 뚜렷한 흰 눈썹; 가슴/배의 촘촘한 가로무늬; 띠가 있는 긴 꼬리; 굽은 부리·넓고 둥근 날개 | 직박구리 틀에 부리만 굽힌 맹금류 | 성체 회색 몸·흰 눈썹·가로 배무늬·꼬리 띠와 굽은 부리, 비행 프레임은 넓은 날개. 유조의 세로무늬를 성체 표준으로 쓰지 않음 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / move / eat, 각 2프레임 / 정상 |
| litter-mold / 낙엽 분해 곰팡이 군집 | 낙엽 표면의 가는 밝은 균사; 여러 갈래로 뻗는 실 같은 망; 분해되는 낙엽과 함께 보임; 단일 종/자실체 모양을 확정할 수 없음 | 막대 끝 둥근 머리가 나란히 서 있어 일반 버섯처럼 보임 | 낙엽 위 흰빛/크림빛 균사망 중심으로 교체. 특정 종 포자낭·갓·학명을 부여하지 않음 | 제작 완료 — 기능군 도식 | idle / active, 각 2프레임 / 정상 |
| soil-bacteria / 고초균 | 막대 모양 세포; 단독 또는 짧은 사슬; 일부 세포의 내생포자; 현미경에서 보이는 매우 작은 크기 | 굵고 짧은 캡슐과 긴 꼬리 모양 선 | 가늘고 긴 막대·짧은 사슬·일부 내생포자 표시. 분지 균사/버섯처럼 표현하지 않음. 색은 구별을 위한 도식색이며 토양에서 실제로 보이는 녹색이 아님 | 제작 완료 — 참고 사진의 대표 특징 반영 | idle / active, 각 2프레임 / 정상 |
| earthworm / 참지렁이 | 가늘고 긴 마디진 몸; 앞쪽에 가까운 환대; 끝이 가늘어지는 꼬리; 다리·눈·얼굴이 없음 | 두껍고 짧은 몸과 몸 한가운데 큰 띠 | 몸을 가늘게 하고 많은 마디·앞쪽 환대를 표시. 정확종 사진이 없어 지렁이류 수준 도식으로만 개선하며 종 특유 색·생식표지·정확한 환대 마디 번호는 확정하지 않음 | 일부 개선 — 정확종 형태 검증 미완료 | covered / surface / covered-eat / eat, 각 2프레임 / 정상 |

개미·다른 딱정벌레·청설모 같은 새 종을 그림 기준으로 도입하지 않았다. 무당거미는 성숙 암컷, 참매는 성체, 솔나방은 애벌레의 대표 그림이다. 기존 생애 단계 자산(강아지풀 새싹·방아깨비 약충·구름송편버섯 균사체)도 각각 어울리는 외형으로 유지했다.

## E. 모션과 재생성 일치

기존 기본 70상태 × 2프레임 = 140뷰, 새싹 6 + 약충 6 + 균사체 4 = 16뷰, 합계 **156뷰/78프레임 쌍**을 유지했다. 이전 HEAD와 모든 view ID·viewBox를 일치 검사했다. 일반 소비자 15종 idle/move/eat, 참지렁이 4상태, 생산자 3상태, 분해자 2상태의 연결은 그대로다.

몸·머리·다리·날개를 SVG defs에 두고 use로 각 자세를 조립한다. 프레임마다 기본 해부 구조를 새로 만들지 않아 다리 수·몸 비율이 바뀌는 문제를 줄였다. 머리 각도·다리 자세·날개·잎 자세 등 기존 상태 차이는 유지했다. 78쌍 모두 실제 래스터 결과가 다르고, 156뷰 모두 비어 있지 않다. 이 픽셀 차이 검사는 생물학적으로 자연스러운 운동을 자동 입증하는 검사는 아니다. 2프레임 교육용 모션이며 정밀 보행 분석을 재현하지 않는다.

실제 엔진에서 15소비자의 먹기 0/1, 세 분해자의 실제 할당 후 active 0/1, 참지렁이의 covered-eat/eat, 성체 풀의 leaf-turn을 확인했다. 자원이 없을 때 active를 꾸미지 않고, 실제 성장과 성체 잎 자세를 구분한다. 참지렁이 120초/3초 접근과 피복은 기존 상태를 읽는다. 모달 정지 중 프레임 고정, 저장·복원 후 상태·방향도 통과했다.

외형 원본은 [species-art-shapes.mjs](tools/species-art-shapes.mjs), 상태·뷰 조립은 [build-species-art.mjs](tools/build-species-art.mjs)로 분리했다. 전체 재생성 `node tools/build-species-art.mjs`, 홍단딱정벌레만 `--species=ladybird`, 덮어쓰기 없는 원본 일치 검사는 `--check`다. 최종 변경 뒤 직접 일치 검사 1개를 다시 통과했다.

## F. 실제 숲 화면과 선택 영역

Windows Edge/Chromium 실제 렌더러에서 아래 크기를 검사했다. 이는 기기 에뮬레이션이 아니라 브라우저 viewport 검사다.

| 화면 | 실제 밀집 개체 | 동물 종 수 | 개체 선택 성공 | 그림 영역 이탈 | 수평 넘침 | 심한 사각형 겹침 쌍 |
|---|---:|---:|---:|---:|---|---:|
| 1280×800 | 30 | 16 | 30/30 | 0 | 없음 | 2 |
| 1138×712 | 30 | 16 | 30/30 | 0 | 없음 | 4 |
| 960×600 | 30 | 16 | 30/30 | 0 | 없음 | 2 |
| 1366×768 | 30 | 16 | 30/30 | 0 | 없음 | 3 |
| 412×915 | 30 | 16 | 30/30 | 0 | 없음 | 4 |

5종 숲(상수리나무·강아지풀·방아깨비·구름송편버섯·고초균), 동물 16종이 포함된 30개체 숲, 오른쪽 숲, 홍단딱정벌레 상세, 24종 도감을 캡처했다. 기존 전체 숲 검사에서는 24종 × 좌/중/우 72개 실제 배치를 확인했다. 실제 모델 좌표와 배치 검증을 사용했다. 비교를 위해 모든 카드를 열어 둔 화면 fixture는 검사용이며 학생 해금 경로를 바꾼 구현이 아니다.

기존 48px 이상 선택 영역을 유지했고 5크기에서 총 150회의 개별 선택이 맞았다. 기본 이름표 0개·선택 때 1개·전체 표시 30개 전환도 통과했다. 밀집 숲에 겹침이 전혀 없다는 결과는 아니다. 위 심한 겹침은 이미지의 사각형 경계 기준이며 실제 불투명 픽셀의 겹침률과 다르다. 작은 화면은 기존 세로 페이지 스크롤을 사용하며 숲 내부 스크롤이나 수평 넘침은 없었다.

잎 자세·먹기 때 일부 그림 끝이 경계를 넘는 것을 발견해 SVG 내부 그림 여백을 보정했다. 최종 156뷰의 getBBox 도형 경계가 모두 128×96 안에 있다. 선 두께까지 getBBox가 완전히 포함하는 것은 아니므로, 방아깨비·달팽이의 머리에는 추가 2px 안쪽 여백을 두고 최종 래스터·화면을 다시 확인했다. 모든 확대율·브라우저에서 픽셀 잘림이 절대 없다는 보증은 아니다.

숲 배경·anchor·CSS 크기·터치·projection·먹이 반경·배치 간격 코드는 바꾸지 않았다. 색과 선 굵기는 기존 숲에 맞추었으며 작은 곤충의 점각 등은 축소 화면에서 일부 읽히지 않는다. 선택·도감 확대에서 특징을 확인할 수 있다.

## G. 카드·도감·먹이그물·상태창

공통 자산 경로를 그대로 사용하여 숲·카드 24·도감 24·먹이그물 24·상태창 24가 같은 SVG를 읽는 것을 확인했다. 숲에서만 기존 RAF 모션이 적용되고 정적 표본은 대표 프레임을 사용한다. 홍단딱정벌레의 작은 먹이그물 노드·상세 화면을 실제로 열었다. 고초균의 확대 표현·실제 미세한 크기 안내는 기존 학생 도감에 이미 있어 유지했다. 세포 색은 구별용 도식색이며 토양에서 녹색으로 보인다는 뜻이 아니다.

다섯 비교 묶음(홍단딱정벌레/청동풍뎅이, 박새/직박구리, 멧토끼/다람쥐, 세 나무, 세 분해자)은 QA 페이지와 브라우저 캡처로 확인했다. 사진은 각각 원본 링크에서 비교한다. QA 페이지는 외부 사진 다운로드 없이 48개 이전/현재 SVG와 특징·분류·권리를 보여 주며 412px에서 수평 넘침이 없었다.

보조 분석으로 같은 위치의 불투명 실루엣 IoU를 계산했다. 값이 작으면 겹침이 적다는 뜻일 뿐 과학적 정확성 점수가 아니다.

| 비교 | 이전 IoU | 개선 IoU |
|---|---:|---:|
| ladybird / aphid | 1.000 | 0.626 |
| tit / bulbul | 0.971 | 0.767 |
| rabbit / chipmunk | 0.692 | 0.589 |
| oak / pine | 0.534 | 0.590 |
| oak / hazel | 0.482 | 0.798 |
| pine / hazel | 0.330 | 0.579 |
| mushroom / litter-mold | 0.669 | 0.650 |
| mushroom / soil-bacteria | 0.750 | 0.765 |

두 딱정벌레·두 새·토끼/다람쥐의 외곽 유사도는 감소했다. 나무와 일부 분해자 조합은 증가했으므로 모든 조합의 실루엣 지표가 개선됐다고 주장하지 않는다. 넓은 수관의 공통 외곽만으로 세 나무를 판별하기 어려워 잎·수피·솔잎·열매의 차이를 함께 반영했다. 실제 학생의 종 구별 성공률은 후속 수업 검증 항목이다.

## H. 자산 용량과 성능

24 SVG 합계가 **192,190 → 142,545 bytes**, **25.83% 감소**했다. 전달 전 gzip 수치가 아닌 실제 UTF-8 파일 크기다. 도형 설명은 늘었지만 defs/use로 프레임별 동일 도형 복제를 줄였다. 그림 원본은 코드 모듈로 분리했고 게임 실행 시 생성 스크립트나 사진 자료를 읽지 않는다.

새 필터·blur·이미지 요청·CSS 반복 모션·개별 RAF·타이머가 없다. 30개체 관찰 검사: pending RAF 최대 1, 반복 layout 읽기 0, interval 0, 개체 DOM 30, 동일 DOM 유지 true. 이 값은 해당 검사 구간의 도구 계측이다. 실제 S5e FPS·GPU 부하·장시간 발열·전력 또는 메모리 상한을 측정한 결과로 해석하면 안 된다.

## I. 회귀 검사와 보존 계약

| 검사 | 결과 | 근거 |
|---|---|---|
| 기존 전체 단위/생태 검사 | **1528 통과, 실패 0**; 10묶음 36/315/407/181/247/44/58/111/76/53 | 새 파일 생성 검사 1개 자동 발견 포함 |
| 기존 브라우저 | 변경 전 31/31, 변경 후 31/31 | 기존 fixture·legacy loader 유지; 현재 목표/전체 숲 검사 별도 포함 |
| 최종 상세 자산 브라우저 | 24자산·156뷰·78쌍·경계 실패 0·동물 16종/30개체·5크기 | species-art.browser.cjs |
| 최종 기존 모션 브라우저 | 15실제 먹기 FSM·분해/지렁이·5화면·4정적 화면·정지/저장 | visual-assets.browser.cjs |
| 20분 생태 비교 | 9쌍 모두 변경 전과 정확히 같음 | 즉시/일반/10분 저장+10분 및 관리/무관리 3시드 |
| 문서 화면 | 24행·48이미지·오류 0·412px 수평 넘침 없음 | 출처 링크 포함 이전/현재 QA |
| 기존 파일 보호 | 245개 기준 해시 동일 | data/js/css/index 121, 기타 자산 7, 기존 JSON 117 |
| Git | 시작 HEAD 유지·스테이징 없음 | commit/push/branch/config/Pages 변경 없음 |

원시 결과는 새 이름으로만 저장했다. [브라우저·프레임 결과](tests/species-art.browser-results.json), [장시간 생태 비교](tests/species-art.ecology-results.json), [회귀·용량·보호 해시·파일 목록](tests/species-art.regression-results.json). 기존 117개 JSON은 바이트 해시가 같다. 과거 검사 도구의 고정 stage/schema 표시는 nested 결과에 보존하며 이번 작업 실행 단계와 혼동하지 않도록 바깥 stage=15.12.1을 명시했다.

24종/27먹이 관계, 30개체, 포식·먹이·성장·수명·번식·분해 수치, 참지렁이 120/3초, 카드·보상·미션 조건, 처음 0점·포인트 원장·환경 학습 사건당 4점/최대5회·일회성 복구 최대28점, 기존 분해자 느낌표의 무보상 계약을 유지했다. 관련 구현 파일은 전부 기준 해시와 같으며 경제·활동·이벤트·복원 중복 지급 검사도 기존 전체 회귀에 포함된다. schemaVersion17 / ecologyRevision2 / pacingRevision1 / goalRevision1·2 / eco-system:forest-save, 공통 RAF·0.5초 tick, 전체 숲과 오른쪽 배치 범위도 변경하지 않았다.

재실행 예(기존 결과를 덮어쓰지 않도록 새 경로 지정):

`node tools/build-species-art.mjs --check`
`node tests/run-tests.mjs` — TEST_RESULTS_DIR를 새 폴더로 설정.
`node tests/species-art.browser.cjs` 및 `node tests/visual-assets.browser.cjs` — 실행 중인 정적 BASE_URL, PLAYWRIGHT_MODULE, 새 RESULTS_PATH/SCREENSHOT_DIR 지정.
`node tests/student-ux.ecology.mjs` — BASELINE_HEAD=3b28ecb04c75345628954e08310471faaaee40bb, 새 RESULTS_PATH 지정.

QA는 `http://127.0.0.1:8093/eco-system/docs/species-art-qa.html`에서 볼 수 있다(로컬 서버 실행 중인 경우). 실행 로그·화면 캡처는 작업 공간 work/stage15_12_1-*에 보관했고 별도 게임 구현본·ZIP·외부 사진 배포물을 만들지 않았다.

## J. 남은 문제와 실제 기기 확인

- **명주달팽이 일부 개선**: 기존 카드의 Acusta despecta와 한국 국명·현대 분류의 관계를 국내 전문가/최근 표본 자료로 확인해야 한다. 참고 플랫폼의 라벨만으로 확정하지 않았다.
- **참지렁이 일부 개선**: Amynthas koreanus로 신뢰할 수 있게 동정된 사진 3장 이상 및 종 진단 형질 확보가 필요하다. 현재는 일반 지렁이의 마디·환대·가느다란 몸 도식이다. 정확한 환대 마디 번호나 종 특유 색을 확정하지 않는다.
- 박새의 분류 체계 차이는 문서에 남겼고 학명 데이터는 보존했다. 차후 프로젝트가 채택할 목록을 정할 때 별도로 일관되게 갱신해야 한다.
- 대표 성별·성숙 단계·색형을 단순화했다. 어린 생물이나 수컷 거미, 모든 홍단딱정벌레 아종, 세균 종 동정과 같은 사용 범위를 대표하지 않는다. 낙엽 곰팡이도 특정 종 그림이 아니다.
- 모든 자산의 프레임·상태·픽셀 검사 통과가 생물학적 정확성의 최종 인증은 아니다. 전문가 도해 검토와 초등학생 사진 매칭 관찰을 추가해야 한다. 특히 작은 화면의 세 나무 구분과 곤충 앞가슴·더듬이 축소 가독성을 확인한다.
- Galaxy Tab S5e에서 1138×712 안팎 실제 브라우저 가로 화면·주소창 변화·확대율·30개체 터치·겹친 선택·모션·회전·저장 복원·20분 발열/프레임 유지와 오프라인/Pages 경로 로딩을 확인해야 한다. 세로 412px 결과는 보조 대응이며 가로 우선 방침을 바꾸지 않았다. 실기기 검증은 미실시다.

## 전체 변경 파일

총 **37개**: 수정 28, 추가 9, 삭제 0. 사용자 기존 미커밋 변경은 시작 시 없었다. 게임 런타임 코드·수치 데이터·배경·설정과 .git은 수정하지 않았다.

수정 28개:

- `ARCHITECTURE.md`
- `README.md`
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
- `tools/build-species-art.mjs`

추가 9개:

- `STAGE15_12_1_SPECIES_ACCURATE_ART.md`
- `docs/species-art-qa.html`
- `docs/species-art-references.json`
- `tests/species-art.browser-results.json`
- `tests/species-art.browser.cjs`
- `tests/species-art.ecology-results.json`
- `tests/species-art.regression-results.json`
- `tests/species-art.test.mjs`
- `tools/species-art-shapes.mjs`

## GitHub Desktop 추천 문구

Summary:

`Refine 24 species illustrations using biological references`

Description:

`Redraw species-specific silhouettes, anatomy, markings, foliage and decomposers using documented taxonomy and photo references. Keep all 156 frame views, live motion bindings, forest layout and ecology/economy/save contracts unchanged.`

`Split original shape definitions from the reproducible SVG builder, reduce the 24 SVG files by 25.83%, and add a before/after QA page with source attribution and licensing records. Mark Acusta and Amynthas species-level verification as incomplete rather than claiming full scientific validation.`

`Validation: 1,528 unit/ecology assertions; 31 browser suites before and after; final 156-view raster/geometry checks, five viewport sizes and live FSM/save tests; nine exact paired ecology profiles. Real Galaxy Tab S5e and classroom recognition testing remain pending.`

commit・push・stage는 실행하지 않았다.
