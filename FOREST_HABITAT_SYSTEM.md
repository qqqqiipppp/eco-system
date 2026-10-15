# 서식지·정확한 선택 — 15단계 보존

habitats/anchor/presentation/organism-layer와 실제 좌표·이동·먹이 범위는 수정하지 않았습니다. 생물48px선택 영역·겹친 후보의 정확한 ID선택·30개체 상한을 유지합니다. 새카드·도감의 놓기 버튼은기존 선택 동작만 호출합니다. 실제 숲의 개체 선택이도감 누적 근거이며, 안내는카드 선택 해제→실제 개체 터치를 명시합니다.

다섯 viewport에서학습·도감·먹이그물·클리어·주제 선택의44px버튼과내부 스크롤·가로 넘침을검증했습니다.30개체 기존 브라우저 회귀도통과했습니다. 공통RAF최대1·timer0추가·정적 도감 재렌더0을 유지합니다. 실제 S5e 터치/발열/FPS는별도 확인합니다. 새 이미지·배경·스프라이트·애니메이션은 만들지 않았습니다.16단계에서는표현만 교체하고생태/서식지 계산과정확한 ID계약을 유지합니다.

---

아래는14단계 이전 설계·검증 이력입니다. 현재 동작·수치는 위15단계 안내를 우선합니다.

# 14단계 현재 계약

14단계에서도 data/habitats.js·habitat-anchors.js·habitat-presentation.js·organism-layer.js와 실제 이동 계산을 그대로 사용합니다. 새 숲에서 실제 배치 후 기존 anchor/표시 캐시를 다시 만들고 개체 선택을 연결합니다. 정확한 개체를 선택할 때만 도감에 실제 관찰을 남기며, 겹친 후보 전체를 관찰 처리하지 않습니다. 새 도감/먹이그물용 RAF·timer·그림은 없습니다. 실제 가지/목재 착지와 최종 외형은16단계 범위입니다.

[카드 해금](FOREST_CARD_UNLOCKS.md) · [도감·먹이그물](FOREST_FIELD_GUIDE.md) · [반복 숲·경제·저장](FOREST_REPLAY_SYSTEM.md) · [완료 보고](STAGE14_REPORT.md)

---

아래는 이전 단계의 설계·검증 이력입니다. 현재 기능은 위 14단계 계약을 우선합니다.

# 숲 서식지·이동 표현 시스템 — 13.7단계

검증 날짜:2026-10-15. 최종 그래픽 전의 임시 표현 정책이며 생태/시간/경제 규칙과 분리한다.

## 1. 기존 화면의 가시성 문제

기존24종/30개체 fixture는 거의 같은 지상 y=.72에서 그림/이름표가 겹쳤고 개체별 직접 터치 선택이 없었다. 실제 변경 전5화면을 habitat.baseline-results.json에 보존했다. 이미지 bbox65% 겹침을 심한 겹침으로 정의하며 실제 투명 픽셀의 완전 가림과는 구분한다.

## 2. 이번 단계와16단계 책임

이번은 데이터/교체 가능한 anchor 공급/제한적 view 투영/가시성·선택이다. 그림·배경·SVG·스프라이트·새 물리엔진·정교한 착지/등반을 만들지 않았다. 정확한 가지/목재/거미줄/앞뒤 가림과 최종 크기·경로는16단계다.

## 3. 실제 배경 구조

index.html의 .forest-art 한 장 forest.svg(viewBox1200×470,preserveAspectRatio=none)와 object-fit:fill을 가로·세로로 늘린다. 배경의 나무/풀/뿌리/흙은 SVG 내부 도형이고 독립 생태 객체가 아니다. 실제 학생 생산자는 organism-layer의 별도 DOM이다. 기존 독립 배경 branch/log/rock 데이터는 없다. 배경 tree에 먹이 stock을 만들지 않는다.

## 4. 생태 좌표와 시각 좌표

instance.position은 기존 정규화 생태 좌표 그대로이며 이동/feeding distance·pursuit/포식/usableFood/자연 종료 origin/가장 가까운 분해자에 쓰인다. habitat-presentation.position은 실제 px를 메모리에만 계산한다. organism-layer.paint가 이 값을 DOM transform에 사용한다. 입력은 surface bbox에서 원래 생태 좌표를 계산해 placement로 전달한다. 선택은 표시 좌표의48px hitbox로 검사하며 model 좌표를 쓰지 않는다. 저장은 원래 position만 유지한다.

## 5. 서식지 유형

canopy/branch/trunk/understory/ground/moist_ground/leaf_litter/dead_wood/organic_matter/web_space. 이는 대표 생활 공간이며 모든 상황에서 해당 장소에만 존재한다는 뜻이 아니다. 서식지 데이터는 새 생존/먹이 조건이 아니다.

## 6. 전체24종 서식지 매핑

|생물/기존 ID|대표 공간|추가 공간|이동 유형|우선 실제 생산자|
|---|---|---|---|---|
|상수리나무 / oak|수관|나무줄기 주변|stationary / 자리를 지켜요|없음|
|강아지풀 / grass|풀숲·관목|숲 바닥|stationary / 자리를 지켜요|없음|
|방아깨비 / grasshopper|풀숲·관목|숲 바닥|short-hop / 낮게 이동하고 짧게 뛰어요|강아지풀|
|참개구리 / frog|습한 지상|풀숲·관목·숲 바닥|short-hop / 낮게 이동하고 짧게 뛰어요|없음|
|멧토끼 / rabbit|숲 바닥|풀숲·관목|ground / 지상에서 이동해요|없음|
|구름송편버섯 / mushroom|죽은 목재|숲 바닥|stationary / 자리를 지켜요|없음|
|소나무 / pine|수관|나무줄기 주변|stationary / 자리를 지켜요|없음|
|산딸기 / raspberry|풀숲·관목|숲 바닥|stationary / 자리를 지켜요|없음|
|팽나무 / hazel|수관|나무줄기 주변|stationary / 자리를 지켜요|없음|
|다람쥐 / chipmunk|나무줄기 주변|가지 주변·숲 바닥|tree-affinity / 나무 주변과 지상을 이용해요|상수리나무·소나무·팽나무|
|고슴도치 / field-mouse|숲 바닥|낙엽층·토양|ground / 지상에서 이동해요|없음|
|솔나방 애벌레(송충이) / caterpillar|가지 주변|수관|plant-surface / 식물 주변에서 천천히 움직여요|소나무|
|청동풍뎅이 / aphid|풀숲·관목|가지 주변|plant-surface / 식물 주변에서 천천히 움직여요|팽나무|
|명주달팽이 / snail|습한 지상|풀숲·관목·낙엽층·토양|slow-litter / 낮은 곳에서 느리게 움직여요|없음|
|무당거미 / spider|가지 사이 정착 공간|가지 주변|stationary / 자리를 지켜요|없음|
|홍단딱정벌레 / ladybird|낙엽층·토양|숲 바닥|ground / 지상에서 이동해요|없음|
|박새 / tit|가지 주변|수관|perching / 가지에 머무르며 제한적으로 이동해요|없음|
|직박구리 / bulbul|가지 주변|수관·풀숲·관목|perching / 가지에 머무르며 제한적으로 이동해요|없음|
|유혈목이 / snake|숲 바닥|풀숲·관목|ground / 지상에서 이동해요|없음|
|족제비 / weasel|숲 바닥|나무줄기 주변|ground / 지상에서 이동해요|없음|
|참매 / goshawk|수관|가지 주변|perching / 가지에 머무르며 제한적으로 이동해요|없음|
|낙엽 분해 곰팡이 군집 / litter-mold|낙엽층·토양|숲 바닥|stationary / 자리를 지켜요|없음|
|고초균 / soil-bacteria|유기물 주변|숲 바닥|stationary / 자리를 지켜요|없음|
|참지렁이 / earthworm|낙엽층·토양|숲 바닥|slow-litter / 낮은 곳에서 느리게 움직여요|없음|


## 7. 전체24종 이동 특성

동일 표의7유형. 생산자/거미/균류·세균은 정착, 지상5종은 기존 이동, 풀/개구리는 기존 좌표 이동 위에 최대3px 낮은 도약 표현, 다람쥐는 실제 나무 주변, 식물 이용2종은 실제 pine/hazel 영역 선호, 새3종은 precise branch가 있을 때 우선하고 없으면 낮은 안전 대체, 지렁이/달팽이는 낮은 느린 이동 표현이다. 생태 wander/먹이 추적 속도·난수·의사결정·13.6 배율은 바꾸지 않는다. 현재 가짜 가지 착지/등반은 없다.

## 8. habitat anchor 데이터 계약

id(120자 이내),zone,kind(producer-area/activity-area/attachment),sourceInstanceId/sourceSpeciesId 또는 실제sourceObjectId,정규화position/range,capacity1~30,priority,temporary/precise를 둔다. 좌표/범위0~1·정수 수용량·유효 zone/실제 개체 참조·명시한 branch 근거를 검증한다. 존재하지 않는 실제 개체의 anchor는 사용하지 않는다. 정규화 범위는 그림 전체 bbox의 정확한 가지 착지를 보장하지 않는다.

## 9. 현재 임시 anchor 공급

provideHabitatAnchors가 실제 살아있는 생산자 인스턴스별 식물 영역(capacity2,priority3)을 먼저 제공하고, 기존 forest.svg의 일반 지상 활동 대체 영역(capacity30,priority0)을 제공한다. 실제 나무줄기/식물 주변으로만 명명하며 branch/log/pond/web 오브젝트를 만들지 않는다. wood/litter/remains의 공유 자원 값은 위치별 새 anchor의 존재 근거가 아니다. 나무/분해 대상 그림이 없으면 안전한 가까운 활동 구역을 사용한다.

## 10. 최종 배경의 anchor 교체

공급 함수 모듈 또는 createHabitatPresentation({provider}) 경계에 실제 배경 객체/생산자의 정규화 attachment를 공급한다. precise branch는 실제 sourceInstanceId 또는 sourceObjectId가 있어야 한다. 24종 선호/이동 유형은 그대로 재사용한다. 위치 오프셋 제한은 data/habitats.js에 있으며 현재 임시값을 최종 위치로 저장하지 않는다. 높은 가지가 생태 좌표에서 멀다면16단계에서 좌표 변환/허용 범위·먹이 접근 연출을 함께 검증해야 한다.

## 11. 실제 생산자와 배경 식물

솔나방 애벌레는 가까운 실제pine 영역을 선호하며 배경의 나무에서는 먹이/권한/섭식이 생기지 않는다. 청동풍뎅이의 기존 id=aphid는 실제hazel(팽나무) 영역을 선호한다. 다람쥐의 나무 이용은 해당 나무의 새로운 열매 섭식 연결이 아니다. 방아깨비는 실제grass를 선호하지만 기존 stock/거리 조건을 우회하지 않는다.

## 12. 카드 배치 UX

기존 카드→터치→원래 생태 position/권한/거리/상한 검사 그대로다. 배치가 성공하면 가까운 적합한 실제 anchor 또는 안전한 view 대체를 택한다. 일반적인 최대 표시 조정72px/축별정규화.16, 없다고 카드를 잠그거나 배치를 금지하지 않는다. 카드 선택 중 개체 hitbox는 pointer-events:none으로 배치 입력을 가로채지 않는다. 먼 나무로 생태 개체를 순간이동시키지 않는다.

## 13. 개체 중첩 감소

생산자 base는 고정하고 다른 개체는 안정된ID순서·anchor 수용량/주변 표시 bbox로 후보를 점수화한다. 그림/이름표·48px 타깃과 scene UI를 고려하며 원래 가까운 위치를 선호한다. 재계산은 최초/개체 추가·제거/생산자 제거/레이아웃·화면 변화/복원 때다. 각 프레임에는 이미 선택된 오프셋만 사용하며 anchor 전수 검색을 하지 않는다. 구조 변경 때 근처 표시가 재배치될 수 있으나 무작위 프레임 흔들림이나 생태 순간이동은 없다. 작은 화면30개체의 모든 겹침을 없애지는 못했다.

## 14. 선택과 터치

각 기존 DOM에 그림과 별도인 투명48×48px 이상 button을 둔다. 이름표를 포함한 타깃/키보드 Enter/ordinal aria-label을 제공한다. 실제 pointer는 표시 bbox를 기준으로 후보를 찾고 하나면 정확한 instanceId, 둘 이상이면 기존 생물 상태 dialog에서 개체 목록을 고른다. 자동으로 인접 다른 개체를 골라 버리지 않는다. 클릭 위치 후보만 나열하며 키보드 activation은 해당 button ID를 정확히 선택한다. 실제 선택 개체의 상태·성장·대표 서식지/강조를 보여 준다. 기존 종별 상태 창도 유지한다. 회수 확인은 선택한 ID만 제거한다.

## 15. 레이어 정책

기존 배경(-1)/배치면0/안내1/organism-layer2/scene UI3 이상을 유지한다. 생물 내부에서는 표시 높이 기반 순서, 선택60,이벤트 개체80(!important)로 강조한다. transform stacking context를 고려해 marker가 다른 생물 뒤로 숨지 않게 한다. top-layer native dialog가 모든 장면 위에 표시된다. 중요한 버튼과 겹치지 않도록 캐시된 scene UI 사각형을 사용하며 이동 중에도 DOM 측정 없이 검사한다. 실제 나뭇잎의 전후 가림은16단계다.

## 16. 분해자 느낌표

기존 organic-notices가 생태 position으로 고른 실제 targetInstanceId를 유지한다. event-view는 기존 해당 .organism-object에 marker를 붙여 바뀐 view transform을 함께 따른다. marker 클릭/포인터는 개체 선택·배치로 전파하지 않는다. 기존 우선순위·표시상한4·이력/중복·관심120·확인0점/유료 관리없음·실제 처리와 관심의 구분 그대로다. 사라진 개체/종료 marker는 정리한다.

## 17. 먹이·포식 보존

먹이관계22와A5/B17·feeding/pursuit의 Math.hypot(instance.position)·속도·반경·실제 stock 차감/포식 삭제·born/life/알·씨앗/양분/지렁이 예산/환경·포인트·학습·클리어 코드는 변경하지 않았다. 실제 먹이에 접근/먹는 중이면 타깃 표시 위치를 따라 view 오프셋을 줄여 원격 식사처럼 보이지 않게 한다. 화면 접근만으로 실제 섭식/보상은 발생하지 않는다.

## 18. 저장·복원

schema15/pacing1/ecology2/key 유지. 새 영구 필드0/절대px0/학생 저장 삭제0. 원래 개체ID·position·life·feedingClock·카드/학습/포인트/지원·원장·시간을 그대로 읽는다. 현재 개체와 화면 크기에서 표시 anchor를 결정적으로 재계산한다. 같은 화면/같은 상태에서 같은 표시 위치를 복원한다. 회전은 표시만 바꾸고 원래 좌표/시간은 바꾸지 않는다. 기존7~15·미래16/미지 revision 보호는 이전 서비스 그대로다.

## 19. 성능·측정

공통RAF1/최대30fps/.5생태tick/1초event·30개체·hidden/offline 중단 유지. 새 setInterval/RAF/물리엔진/blur/filter/입자 없음. 프레임별 DOM geometry read0/노드재생성0. geometry는 resize/입력 시 측정하고 anchor는 구조/레이아웃 경계에서 재계산한다. steady position 호출은 anchorChecks/rebuilds를 늘리지 않는다. 모델/뷰 난수는 섞지 않고 view는ID hash를 쓴다. 움직이는 view가 UI에 진입할 때 캐시 사각형만 검사한다. bbox65%는 심한 겹침 지표이고95% bbox 포함은 완전 픽셀 가림의 추정일 뿐이다. 투명 hitbox끼리의 겹침과 실제 이미지 겹침을 따로 기록한다.

## 20. 14단계 반복 플레이 연계

새 카드가 획득/배치될 때 speciesId로 같은24종 설정이 자동 적용된다. inventory/도감/영구 성취와 회차 개체·표시 cache를 구분한다. 새 회차에서는 cache를 초기화하지만 카드 권한/보상 가드는 보존해야 한다. 새 숲 만들기·도감·잠금미리보기·해금조건·회차 경제는 추가하지 않았다.

## 21. 16단계 최종 그래픽 인수

실제 branch/trunk 연결·정착점/정규화범위·stableObjectId·sourceAsset 좌표계·가로세로 변환·생물 크기·hitbox·레이어·정확한 이동 경로·occlusion mask·죽은 목재/낙엽/거미줄 공간을 제공해야 한다. 현재 forest.svg 내 장식 나무를 실제 자원 개체로 바꾸지 않는다. 실제 anchor 부재/수용량/먹이 접근·화면 밖/48px 선택/구버전 저장을 최종 그림에서 다시 검증한다. 완성형 착지/등반/잠행 애니메이션은 이번에 구현하지 않았다.
