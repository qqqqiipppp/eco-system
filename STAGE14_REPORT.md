# 생태계 게임14단계 완료 보고서

2026-10-15 · 실제 저장소 직접 구현 · 정적 싱글플레이 숲

17종 학습 해금, 누적24종 도감, 기존22먹이그물, 클리어 후 새 숲과 제한적 관리 지원을 연결했습니다. 기존 생태/서식지/시간 계약과 최초 보상 가드를 보존했습니다. 역사314/314·현재275/275(신규 기능25+장시간25 포함), 브라우저18/18묶음이 통과했습니다. 두 시간 프로필 사이에는 일부 검사가 중복됩니다.

## 1. 실제 작업 경로

C:/Users/User/Documents/GitHub/eco-system 실제 Git 저장소에서 직접 구현·검사했습니다. 별도 프로젝트/ZIP/배포 복사본을 만들지 않았습니다. 테스트 로그·화면 캡처만 기존 Codex 작업 폴더 work/stage14-*에 보관했습니다.

## 2. 기준 Git HEAD

시작/완료 기준 HEAD: bd222e21a2387878dcd2f487989ddfb3fd9e7197. 시작 시 미커밋 변경은 없었습니다. .git/설정/스테이징/커밋/푸시/Pages 설정은 변경하지 않았습니다. 구현 변경은 미커밋 상태입니다.

## 3. 13.7단계 완료 상태 검사

AGENTS.md와 지정된7개 인수 문서, data→state→systems→services→ui 및 main 연결을 조사했습니다. 실제24종(생산자5/소비자16/분해자3),22관계(A5/B17),schema15/생태2/시간1,처음5·기존 학습7,30실제 개체/RAF1/최대30fps/.5초 tick을 확인했습니다. 작업 전 역사314/314·현재225/225가 통과했습니다. 단일 숲의 observations와 activities/원장이 함께 저장되는 점을 확인하고 새 회차에서는 관찰만 비우도록 분리했습니다.

## 4. 생성·수정 파일 목록

핵심 추가: data/card-unlocks.js, js/state/collection-state.js, js/systems/replay.js·round-care.js, js/services/collection-migration.js, js/ui/collection-view.js, css/collection.css. 기존 main/활동/저장/경제/목표/UI는 연결 부분을 수정했습니다. 신규 기능/장시간/브라우저 검사와 결과 JSON, 필수 문서12종 및 이 보고서를 작성했습니다. 정확한 전체 경로와 M/A 구분은47절 manifest에 있습니다.

## 5. 저장 계약

schemaVersion16 / ecologyRevision2 / pacingRevision1 / key eco-system:forest-save. 영구 프로필·회차 정보가 추가되어15에서16으로 이전합니다.7~15 호환,미래17/미지 생태·시간 보호를 유지합니다. 시간 압축 경계15·분해 관심 경계14·경제 경계13 등 과거 변환 기준을 최신 버전 숫자로 바꾸지 않았습니다.

## 6. 기존24종 ID 보존

|ID|학생 생물명|역할|
|---|---|---|
|oak|상수리나무|생산자|
|grass|강아지풀|생산자|
|grasshopper|방아깨비|소비자|
|frog|참개구리|소비자|
|rabbit|멧토끼|소비자|
|mushroom|구름송편버섯|분해자|
|pine|소나무|생산자|
|raspberry|산딸기|생산자|
|hazel|팽나무|생산자|
|chipmunk|다람쥐|소비자|
|field-mouse|고슴도치|소비자|
|caterpillar|솔나방 애벌레(송충이)|소비자|
|aphid|청동풍뎅이|소비자|
|snail|명주달팽이|소비자|
|spider|무당거미|소비자|
|ladybird|홍단딱정벌레|소비자|
|tit|박새|소비자|
|bulbul|직박구리|소비자|
|snake|유혈목이|소비자|
|weasel|족제비|소비자|
|goshawk|참매|소비자|
|litter-mold|낙엽 분해 곰팡이 군집|분해자|
|soil-bacteria|고초균|분해자|
|earthworm|참지렁이|소비자|

hazel=팽나무, field-mouse=고슴도치, aphid=청동풍뎅이, ladybird=홍단딱정벌레의 기존 ID를 보존했습니다. 종 데이터/학명/그림은 수정하지 않았습니다.

## 7. 기존22개 먹이 관계

|기존 ID|먹이 → 먹는 생물|부분|등급|
|---|---|---|---|
|v2_grass_to_grasshopper|강아지풀 → 방아깨비|잎|B|
|v2_grasshopper_to_frog|방아깨비 → 참개구리|동물|B|
|v2_grass_to_rabbit|강아지풀 → 멧토끼|잎|B|
|v2_oak_to_chipmunk|상수리나무 → 다람쥐|도토리|B|
|v2_pine_to_chipmunk|소나무 → 다람쥐|씨앗|B|
|v2_pine_to_caterpillar|소나무 → 솔나방 애벌레(송충이)|솔잎|A|
|v2_grass_to_snail|강아지풀 → 명주달팽이|잎|B|
|v2_aphid_to_spider|청동풍뎅이 → 무당거미|동물|B|
|v2_caterpillar_to_tit|솔나방 애벌레(송충이) → 박새|동물|A|
|v2_spider_to_tit|무당거미 → 박새|동물|B|
|v2_raspberry_to_bulbul|산딸기 → 직박구리|열매|A|
|v2_hazel_to_bulbul|팽나무 → 직박구리|열매|B|
|v2_hazel_to_aphid|팽나무 → 청동풍뎅이|잎|A|
|v2_frog_to_snake|참개구리 → 유혈목이|동물|B|
|v2_grasshopper_to_weasel|방아깨비 → 족제비|동물|B|
|v2_chipmunk_to_weasel|다람쥐 → 족제비|동물|B|
|v2_frog_to_weasel|참개구리 → 족제비|동물|B|
|v2_rabbit_to_goshawk|멧토끼 → 참매|동물|B|
|v2_chipmunk_to_goshawk|다람쥐 → 참매|동물|B|
|v2_bulbul_to_goshawk|직박구리 → 참매|동물|A|
|v2_snail_to_ladybird|명주달팽이 → 홍단딱정벌레|동물|B|
|v2_grasshopper_to_field_mouse|방아깨비 → 고슴도치|동물|B|

food-relations.js의 방향·개수·근거 ID를 그대로 사용합니다. 참지렁이 잔해 섭식/균류·세균 분해는22에 추가하지 않았습니다.

## 8. 초기5카드

상수리나무·강아지풀·방아깨비·구름송편버섯·고초균을0점으로 시작합니다. 실제 초기 숲은 나무2/풀1입니다. 카드 획득을 실제 배치/관찰로 취급하지 않습니다.

## 9. 기존 학습 후7카드

참개구리는 강아지풀→방아깨비 실제 발견 후 기존 활동, 멧토끼는 기존 생산자2·풀·환경·안정 조건을 확인해 획득합니다. 기존 네 활동 보상3/4/4/4와 완료 기록·구름송편버섯 활동을 유지했습니다.

## 10. 17종 해금 설계표

|카드|활동|사전 조건·근거|힌트|중복 방지|
|---|---|---|---|---|
|소나무|소나무와 생산자|oak; producer_quiz|상수리나무 실제 개체를 눌러 살펴봐요. 배움에서 양분을 만드는 생물을 완료해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|산딸기|숲 가장자리 식물|grass; producer_quiz|강아지풀 실제 개체를 눌러 살펴봐요. 배움에서 양분을 만드는 생물을 완료해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|팽나무|나무의 잎과 열매|pine|소나무 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|다람쥐|나무와 다람쥐|oak|상수리나무 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|고슴도치|풀밭의 곤충 먹이|grasshopper; v2_grass_to_grasshopper|방아깨비 실제 개체를 눌러 살펴봐요. 강아지풀 → 방아깨비를 실제로 관찰하고 💡에 기록해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|솔나방 애벌레(송충이)|솔잎과 애벌레|pine|소나무 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|청동풍뎅이|팽나무 잎 탐구|hazel|팽나무 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|명주달팽이|습한 풀밭 탐구|grass|강아지풀 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|무당거미|기다리는 소비자|aphid|청동풍뎅이 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|홍단딱정벌레|낙엽층의 사냥꾼|snail|명주달팽이 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|박새|곤충에서 새로|caterpillar; v2_pine_to_caterpillar|솔나방 애벌레(송충이) 실제 개체를 눌러 살펴봐요. 소나무 → 솔나방 애벌레(송충이)를 실제로 관찰하고 💡에 기록해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|직박구리|열매와 새|raspberry|산딸기 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|유혈목이|개구리와 뱀|frog; v2_grasshopper_to_frog|참개구리 실제 개체를 눌러 살펴봐요. 방아깨비 → 참개구리를 실제로 관찰하고 💡에 기록해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|족제비|여러 먹이를 이용하는 동물|chipmunk|다람쥐 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|참매|숲의 상위 소비자|chipmunk; v2_oak_to_chipmunk|다람쥐 실제 개체를 눌러 살펴봐요. 상수리나무 → 다람쥐를 실제로 관찰하고 💡에 기록해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|참지렁이|낙엽과 토양동물|mushroom, soil-bacteria; decomposer_classify|구름송편버섯·고초균 실제 개체를 눌러 살펴봐요. 배움에서 구름송편버섯의 역할을 완료해요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|
|낙엽 분해 곰팡이 군집|낙엽을 분해하는 균류|earthworm|참지렁이 실제 개체를 눌러 살펴봐요. 그 뒤 이 질문에 답해요.|completed + acquired; 지급 0점|

시작 카드만으로 소나무·산딸기·다람쥐·명주달팽이·참지렁이에 접근. 소나무→팽나무/애벌레, 팽나무→청동풍뎅이→무당거미, 달팽이→홍단딱정벌레, 실제 솔잎 섭식 발견→박새로 이어집니다. 기존 acquired 권한은 새 조건과 무관하게 보호합니다.

## 11. 실제17종 해금 결과

신규0점/초기5에서 실제 배치·정확한 개체 관찰·섭식 신호의 발견 확인·정답 제출을 사용해17종 모두 획득했습니다. acquired 배열 강제 수정이나 개발 카드 지급을 사용하지 않았습니다.

|생물 ID|실제 획득 활성 시점(초)|회차|
|---|---|---|
|pine|0.5|1|
|raspberry|0.5|1|
|hazel|0.5|1|
|chipmunk|0.5|1|
|caterpillar|0.5|1|
|aphid|0.5|1|
|snail|0.5|1|
|spider|0.5|1|
|ladybird|0.5|1|
|bulbul|0.5|1|
|weasel|0.5|1|
|earthworm|0.5|1|
|litter-mold|0.5|1|
|field-mouse|5|1|
|tit|9|1|
|snake|10|1|
|goshawk|320|1|

정답을 미리 아는 자동 검증이므로 위 시각은 실제 학생의 학습 시간/수업 평균이 아닙니다. 신규17활동 보상은 모두 카드이며 포인트0점입니다. 기존 모든 카드 개발 fixture는 별도 생태/성능 검사에만 사용했습니다.

## 12. 기존 획득 카드 보호

이전 inventory.acquired를 우선 보존하고 유효한 활동 완료와 acquisition 기록으로 부분 권한 복구를 돕습니다. 예전에24카드를 가진 학생은 새 선행 조건을 완료하지 않았어도 계속24카드를 사용합니다. 잠금 해제 규칙 변경으로 카드를 회수하지 않습니다.

## 13. 도감 상태 계약

미획득=acquired 거짓, 획득=카드 사용 권한, 실제 관찰=살아 있는 개체를 정확히 선택하거나 실제 먹이 발견을 확인한 기록입니다. 영구 profile.speciesObservations와 이번 숲 round.inspected를 구분합니다. 잠긴 카드 클릭/도감 열기만으로 관찰·포인트를 만들지 않습니다.

## 14. 획득과 실제 관찰 분리

새 소나무 카드를 실제 관찰/답변으로 획득한 직후 도감에는 소나무 관찰 전으로 표시했습니다. 이후 실제 소나무 개체를 눌렀을 때 관찰로 남습니다. 겹친 후보 전체를 관찰 처리하지 않습니다. 구생태 legacy 기록을 현재 v2 사실로 만들지 않습니다.

## 15. 24종 도감 UI

생물 도감에서24종 목록과 상세 정보를 확인합니다. 기존 그림/이모지를 재사용하고 역할·서식지·기존 설명·먹이 관계·관련 누적 발견·최초 획득/관찰 회차를 보여 줍니다. 이미지를 새로 만들지 않았습니다. 세부 내용은 FOREST_FIELD_GUIDE.md에 있습니다.

## 16. 미해금 카드와 힌트

모든 잠긴 카드를 볼 수 있고 실제 조건에 맞는 힌트와 탐구 활동으로 이동합니다. 하단 카드에는 짧은 활동명, 탐구/도감에는 필요한 개체/선행 학습/실제 관계를 자세히 표시합니다. 잠금 클릭 자체는 해금하지 않습니다.

## 17. 획득 X/24 진행률

현재24개 ID의 실제 acquired에서 계산합니다. 현재 살아 있는 개체 수/종 수나 관찰한 종 수와 다릅니다. 기존7권한은7/24, 실제 모든 경로 후24/24, 잠금0개를 저장 왕복/새 숲에서도 확인했습니다.

## 18. 먹이그물 화면

22개 기존 연결을 먹이→소비자 목록으로 보여 주고 화살표 의미를 설명합니다. 전체/누적 발견/획득 카드로 가능한 관계 필터를 제공합니다. 실제 발견한 관계를 먼저 표시하고 잠긴 끝점/미발견/이번 숲 여부를 구분합니다. 물리 그래프 라이브러리와 새 RAF는 없습니다.

## 19. 실제 관계 관찰 기록

이번 숲 observations는 실제 feeding 신호를 💡에서 확인한 기록입니다. profile.relations는 누적 발견입니다. 새 회차는 이번 관찰을 비우고 누적 기록을 남깁니다. 이전 기록만으로 새 회차 목표를 자동 달성하지 않습니다.

## 20. 최초 발견 포인트

같은 의미의 기존/현재 observation ID·rewardHistory·legacyClaimed를 보존합니다. 둘째 숲에서 처음 본 산딸기→직박구리는 실제12점, 셋째 숲의 같은 재관찰은0점을 확인했습니다. 이미 아는 관계 재발견·도감 클릭에는0점입니다.

## 21. 영구 학생 프로필

획득 카드·활동 완료/정답·최초 획득·누적 종/관계 관찰·최초/누적 클리어·기존 원장/지원·legacy를 유지합니다. 기존 카드/경제/학습 필드는 호환성을 위해 원래 위치를 유지하고 createNextForest의 명시적 이월 목록으로 책임을 구분했습니다. 중복 원장을 만들지 않습니다.

## 22. 회차별 숲 상태

실제 개체/위치/수명/성장/stock/배고픔, 환경/유기물/토양 기여 예산, 사건/유한 알·씨앗/번식, 현재 관찰/현재 개체 선택, 안정도/현재 클리어/시간/관리 효과·대기는 초기화합니다. 회차 번호·주제·현재 관찰·관리 지원을 round로 관리합니다.

## 23. 새로운 숲 생성

클리어→확인/주제 선택→후보 생성→저장 계약 검증→동일 키에 원자적 쓰기→현재 상태/시스템/DOM 교체 순서입니다. 기존 전체 reset이나 저장 키 삭제를 호출하지 않습니다. 최대30과 기존 habitat 공급 경계를 재사용합니다.

## 24. 클리어 화면

숲 생태계 완성 제목과 도감 진행/실제 잠금 미리보기를 목표 상세보다 먼저 배치했습니다. 도감 살펴보기/새로운 숲/지금 숲 계속 보기를 제공합니다. 기존 숲 관찰도 계속 가능하며 새 숲 시작을 강요하지 않습니다. 선택 버튼은 짧은 화면에서 접근할 수 있도록 유지했습니다.

## 25. 잠금 카드3~6 미리보기

acquired를 제외한 실제 목록에서 수행 가능한 활동, 선행 조건 충족 비율, 안정적인 기존 순서로 최대6개를 표시합니다. 일반7보유 학생은6개를 미리 보고, 나머지는 도감에서 봅니다. 남은 잠금이1~2개면 실제 남은 개수만 표시합니다. 잠금0개는24종 완성/새 관찰 안내로 바뀝니다. 재로드 때 무작위로 달라지지 않습니다.

## 26. 새 숲에서도 카드 유지

새 숲/저장 재접속에서 기존 카드·도감·학습·처음 보상 원장·잔액을 유지했습니다. 확인 취소는 현재 상태를 변경하지 않습니다. 새 회차라서 카드를 자동 지급하거나 이미 가진 카드를 다시 잠그지 않습니다.

## 27. 다른 생물 조합 탐구

실제 해금한24카드로 둘째 숲의 소나무→솔나방 애벌레를 관찰하고 새 목표를 달성했습니다. 브라우저에서도 새 숲에 소나무를 실제 배치하고 기존 habitat/이동·개체 선택을 연결했습니다. 낙엽/토양 주제도 실제 참지렁이 섭식이 있어야 달성됩니다.

## 28. 반복 회차 탐구 목표

첫 숲의 기존 핵심 조건은 그대로입니다. 둘째부터 보유 끝점의22개 중 관계1개, 생산자2종 관찰+현재 먹이 발견, 참지렁이·버섯·고초균 관찰+현재 실제 litter 섭식 중 가능한 주제를 고릅니다. 공통으로 현존 생산자/소비자/분해자·네 환경 보통·안정70·30초가 필요합니다. 기본 관계도 선택 가능하고 모든24종/잠긴 생물/15분 강제 대기는 요구하지 않습니다.

## 29. 일회성 보상 원장

기존 pointEconomy의 잔액/ledger/totals/legacyClaimed/studyClaims/지원 사용 플래그를 이월합니다. 새 episode ID는 전체 기록에서 단조 증가하며 회차 시간은0으로 새로 시작합니다. 환경 학습 전체5회20점, 조건부 복구 전체1회 최대28점입니다. 기존7~13 저장의 이미 지급한 보상·사용한 지원100왕복 회귀도 통과했습니다.

## 30. 회차별 관리 지원

첫 숲은 기존0점/지원0입니다. 둘째부터28점: 물6+토양6+햇빛8+공기8 각 한 번을 돌보는 제한량입니다. 실제20분 정상 관리14점/자연 회복을 근거로 잡았습니다. 지원부터 사용하고 초과만 영구 포인트에서 차감합니다. 지원7+영구1로8점 행동을 정확히 지불하는 저장 검사를 포함합니다. 행동 화면에 잔액·지원·비용을 표시합니다.

## 31. 무한 포인트 방지

지원은 현재 관리에만 사용하고 영구 수입으로 기록하지 않습니다. 미사용분은 이월/합산/환전할 수 없고 미완료 숲을 반복 생성할 수 없습니다. 새17활동/회차 시작/클리어는 영구 포인트0점입니다. 동일 발견/학습/조사/관리 해결은 기존 지급 가드로1회, 환경 학습도 전체 최대20점입니다. 신규 학생의 현재 영구 지급 이론상 상한373점은 실제 동시 달성 보장이 아니며 이전 잔액과는 구분합니다.

## 32. 버전7~15 안전 이전

기존 숲을1회차로 인식하며 개체를 지우거나 새 숲으로 강제 이동하지 않습니다. acquired·활동·관찰·살아 있는 life/성장/stock·환경/사건·잔액/원장/지원·분해자 관심/토양 예산·시간/legacy를 보호했습니다. 오래된 생태/시간 변환은 기존 버전별 경계를 그대로 사용합니다.15 시간은 재압축하지 않습니다.

## 33. 저장16 복원

profile/round를 단일 snapshot에 추가하고 현재 숲과 영구 성취의 시각을 구분했습니다. 첫 클리어·원장·새 카드·현재 목표·관리 지원·2회차 중간 상태를 왕복 검증했습니다. 미래17·미지 생태/시간 버전 덮어쓰기 차단과 오프라인 시간 미진행을 유지합니다. 부분 손상 회차는 지원을 새로 채우지 않고 유효한 성취를 보존합니다.

## 34. 실패·취소·연속 클릭

브라우저 저장 공간 실패를 주입해 디스크/메모리/프로필/현재 숲이 그대로임을 확인했습니다. 확인 취소는 전 상태 동등, 이중 클릭은 정확히 한 회차, 미래 저장은 쓰기 차단입니다. 기존 전체 삭제 버튼은 별도 확인 흐름이며 새 숲과 구분됩니다.

## 35. 시간 압축 정책 보존

생태 속도2·.5초 tick·사건4/10/16분·공통 RAF1/최대30fps·안정30초·기존 관리 대기/효과를 바꾸지 않았습니다. 신규 즉답 모형 첫 클리어는99.5초, 느린 읽기 가정930초/빠른 가정780초입니다.15~20분은 설계 목표이며 실제 학생 평균이나15분 대기 장치가 아닙니다.

## 36. 서식지 시스템 보존

data/habitats.js, habitat-anchors.js, habitat-presentation.js, organism-layer.js와 물리 이동/먹이 계산은 변경0입니다. 새 숲에서 표시 캐시를 재구성하고 기존 정확한 개체 선택/48px hit/후보 선택을 유지합니다. 새 그래픽/정교한 가지 착지는16단계로 남깁니다.

## 37. 필수A~Z 검사

|항목|검사 결과|
|---|---|
|A 24종 ID·역할|통과: 기존 회귀+replay 기능/장시간/브라우저|
|B 22관계 A5/B17|통과: 기존 회귀+replay 기능/장시간/브라우저|
|C 초기5카드|통과: 기존 회귀+replay 기능/장시간/브라우저|
|D 기존 학습 후7|통과: 기존 회귀+replay 기능/장시간/브라우저|
|E 기존 acquired 권한|통과: 기존 회귀+replay 기능/장시간/브라우저|
|F 17종 실제 해금|통과: 기존 회귀+replay 기능/장시간/브라우저|
|G 모든 경로 도달|통과: 기존 회귀+replay 기능/장시간/브라우저|
|H 해금 중복 방지|통과: 기존 회귀+replay 기능/장시간/브라우저|
|I 24종 도감|통과: 기존 회귀+replay 기능/장시간/브라우저|
|J 획득 X/24|통과: 기존 회귀+replay 기능/장시간/브라우저|
|K 획득과 관찰 구분|통과: 기존 회귀+replay 기능/장시간/브라우저|
|L 실제 먹이 발견|통과: 기존 회귀+replay 기능/장시간/브라우저|
|M 기존 데이터 먹이그물|통과: 기존 회귀+replay 기능/장시간/브라우저|
|N 미발견 표시|통과: 기존 회귀+replay 기능/장시간/브라우저|
|O 기존 포인트 보존|통과: 기존 회귀+replay 기능/장시간/브라우저|
|P 클리어 화면|통과: 기존 회귀+replay 기능/장시간/브라우저|
|Q 실제 미해금 목록|통과: 기존 회귀+replay 기능/장시간/브라우저|
|R 새 숲 생성|통과: 기존 회귀+replay 기능/장시간/브라우저|
|S 새 숲 카드 유지|통과: 기존 회귀+replay 기능/장시간/브라우저|
|T 회차 생태 초기화|통과: 기존 회귀+replay 기능/장시간/브라우저|
|U 누적 성취 유지|통과: 기존 회귀+replay 기능/장시간/브라우저|
|V 반복 경제|통과: 기존 회귀+replay 기능/장시간/브라우저|
|W 저장7~16/미래17|통과: 기존 회귀+replay 기능/장시간/브라우저|
|X 13.6 시간 정책|통과: 기존 회귀+replay 기능/장시간/브라우저|
|Y 13.7 서식지/선택|통과: 기존 회귀+replay 기능/장시간/브라우저|
|Z 전체 회귀|통과: 기존 회귀+replay 기능/장시간/브라우저|

## 38. 반복 플레이 추가20항목

|번호|시나리오|결과|
|---|---|---|
|1|신규0점/초기5카드|통과|
|2|기존 개구리·토끼 학습7|통과|
|3|시작 카드 실제 관찰→새 카드|통과|
|4|이전24 권한 유지|통과|
|5|기존 첫 숲 클리어|통과|
|6|실제6잠금 미리보기와7/24|통과|
|7|취소/후보 생성 무변경|통과|
|8|새 회차 실제 숲 초기화|통과|
|9|기존 카드/도감/원장 보존|통과|
|10|현재 숲 재관찰/재보상0|통과|
|11|학습 재완료/재접속 보상0|통과|
|12|지원28 소모 후 정확한 영구 차감|통과|
|13|둘째 클리어→셋째|통과|
|14|5회차 영구 기록 유지|통과|
|15|둘째 중간 저장 생존/시간 동등|통과|
|16|17종 일반 경로→24종|통과|
|17|24/24·잠금0|통과|
|18|잘못된 회차/개체 목록 복구|통과|
|19|저장 실패/미래 버전/원자 전환|통과|
|20|30개체·기존 시간/별도 브라우저 성능|통과|

기능 검사25개에는 위20개에 더해7~15 이전, 잘못된 관찰/주제, 지원7+영구1 차감, 둘째 최초12/셋째0, 상속 키 위조 방어를 포함합니다. 연속 클릭의 실제 UI 경로와30개체 화면은 별도 브라우저 검사로 보강했습니다.

## 39. 장시간25시나리오

|번호|시나리오|관찰 결과|
|---|---|---|
|1|신규 학생 첫 숲20분|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 14|
|2|첫 신규 소나무|통과 · 클리어 성공 · 카드 8 · 끝 포인트 71 · 최고 개체 14|
|3|기존 참개구리·멧토끼|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 14|
|4|시작 카드→새2종|통과 · 클리어 성공 · 카드 9 · 끝 포인트 71 · 최고 개체 14|
|5|실제17경로 전체24종|통과 · 클리어 성공 · 카드 24 · 끝 포인트 131 · 최고 개체 24|
|6|첫 숲 클리어|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 14|
|7|실제 잠금6미리보기|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 14|
|8|첫 숲→둘째|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|9|소나무·애벌레 다른 조합|통과 · 클리어 성공 · 카드 24 · 끝 포인트 146 · 최고 개체 12|
|10|둘째 실제 먹이 관찰|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 10|
|11|둘째 새2카드|통과 · 클리어 성공 · 카드 9 · 끝 포인트 80 · 최고 개체 11|
|12|반복 최초 발견 수입0|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|13|환경 학습 전체5회20점|통과 · {"globalStudyCount":5,"globalStudyIncome":20,"rounds":5}|
|14|사용한 복구 지원 재지급0|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|15|0잔액/관리 지원28전부 소모|통과 · 클리어 성공 · 카드 7 · 끝 포인트 0 · 최고 개체 5|
|16|둘째 클리어|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|17|셋째 다른 주제|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|18|5회차 생존/성취|통과 · {"rounds":5,"clears":5,"guide":{"acquired":7,"total":24,"observed":6},"points":80}|
|19|24카드로 토양 주제|통과 · 클리어 성공 · 카드 24 · 끝 포인트 146 · 최고 개체 12|
|20|15저장→반복 숲|통과 · 클리어 성공 · 카드 7 · 끝 포인트 80 · 최고 개체 11|
|21|20분=10저장10분|통과 · 클리어 성공 · 카드 7 · 끝 포인트 72 · 최고 개체 10|
|22|13.7동일 생태3프로필|통과 · 신규/기성/개발24종30개체의 모든 측정 필드 일치. 원시 수치는 JSON 참조|
|23|개발30개체+도감 읽기1000회|통과 · 클리어 미완료 · 카드 24 · 끝 포인트 0 · 최고 개체 30|
|24|느린 읽기 가정|통과 · 클리어 성공 · 카드 9 · 끝 포인트 71 · 최고 개체 15|
|25|빠른 읽기 가정|통과 · 클리어 성공 · 카드 9 · 끝 포인트 71 · 최고 개체 15|

각 숲은20분 활성 생태를 실행했고 다회차는 최대5회차까지 진행했습니다. 일부 항목은 같은20분 결과에서 서로 다른 계약을 확인합니다.0잔액 소모는 명시적 고갈 fixture,30개체/모든 생태 프로필은 개발 fixture입니다. 실제17해금은 이 fixture와 분리했습니다. 원시 수치/실제 해금 추적/종별 섭식/원장은 tests/replay.long-results.json에 있습니다. 연속/저장 비교는0값 합계와 도입0기록만 같은 빈 상태로 정규화했습니다.

## 40. 1·2·3·5회차 경제 수지

|회차|시작 영구|관리 지원|새 첫 먹이 보상|기타 첫 학습/해결|사건 학습|재발견 보상|실제 관리|끝 영구|새 카드/누적|클리어|
|---|---|---|---|---|---|---|---|---|---|---|
|1|0|0|36|38|12|0|14|72|2/7|성공|
|2|72|28|0|0|8|0|14|80|0/7|성공|
|3|80|28|0|0|0|0|14|80|0/7|성공|
|4|80|28|0|0|0|0|14|80|0/7|성공|
|5|80|28|0|0|0|0|14|80|0/7|성공|

첫 숲72점 종점은13.7과 동일, 둘째 새 사건 학습8점 뒤80점,3~5는80점입니다. 지원28은 매 숲14점을 쓰고 남은14를 버립니다. 별도 영구0/지원 전액28 지출 숲도 추가 현금 지급 없이 자연 회복과 실제 탐구로 클리어했습니다. 지원 없는0잔액은 즉시 유료 대응이 불가하므로 제한적 지원을 채택했습니다.

## 41. 브라우저 검사

Windows Edge/Playwright, 실제 저장소 하위 경로 http://127.0.0.1:8093/eco-system/ 에서 기존17+신규1, 총18묶음 통과. 새 묶음은 일반 소나무 해금/관찰 구분·22그물·6잠금·취소·quota 실패·연타·2회차 재접속·24카드/다른 조합·5크기/30개체를 검증했습니다. 기존 미래 카드 클릭 검사는 실제 활동 열기로, 개체 선택 불변 검사는 새 관찰 기록을 제외한 기존 생태 불변으로 갱신했습니다. 클리어 자동 안내는 닫은 뒤 기존 후속 환경 검사를 계속합니다. 기능을 건너뛰지 않았습니다. 브라우저 오류0, 별도 interval0/최대 pending RAF1/안정 구간 layout read0/도감 목록 불필요 변경0입니다.

## 42. Galaxy Tab S5e 화면

1280×800·1138×712·960×600·1366×768·412×915, 도감/그물/클리어·새 숲15개 화면 조합을 확인했습니다. 가로 넘침0, 대화창 화면 안 배치, 내부 스크롤, 최소44 CSS px를 확인했습니다. 기존 개체 hit48px/150정확 선택도 회귀 통과했습니다. 캡처를 직접 검토했습니다. 긴 힌트가 하단 카드 높이를 늘리던 문제를 짧은 카드 안내로 수정했습니다.

## 43. 실제 수업/실기기에서 확인할 사항

S5e 실제 터치 정확도·스크롤 관성·화면 회전·접근성 글자 확대·Chrome 저장 공간·20분 발열/배터리/FPS는 실기기에서 확인해야 합니다. 정답을 모르는 학생의 읽기/추론 시간·17활동 난도·여러 숲의 실제 선택·지원28점 충분성·2회차 진입 비율은 실제 수업에서 측정해야 합니다. 이번 결과를 하드웨어/학생 실측으로 보고하지 않습니다.

## 44. 남은 문제·범위

차단된 기능/미구현17카드는 없습니다. 그래픽은 기존 임시 자산/이모지이며 종 외형을 보장하지 않습니다. 생물 겹침은 기존 후보 선택으로 해결하며 정교한 가지 착지/새 배경은 없습니다. 도감은 리스트/관계 표현으로, 대형 그래프는 없습니다. 읽기 모형은 정답을 알고 조건에 맞게 조작하므로 실제 수업 난도의 대체가 아닙니다. 단일 로컬 저장 키이고 여러 탭의 동시 학생 진행 병합/클라우드/교사 전송은 구현 범위 밖입니다. 전체 JSON이 파싱 불가하면 기존 복구 한계가 있습니다.

## 45. 15단계 밸런스 인수

첫 숲 안정 운영과 수집 동기의 균형,17문항 설명 이해/정답 위치 편향,다회차 주제별 생존 난도,28점 지원과 자연 회복 선택을 실제 수업에서 검토합니다. 카드24수집은 숲 클리어의 필수가 아닙니다. 가장 빨리 전 카드 해금한 자동 모형의 시각을 수업 목표로 쓰지 않습니다. 이전 생태 설정을 바꾸지 않은 현재 결과를 다음 조정의 비교 기준으로 사용합니다.

## 46. 16단계 그래픽 인수

기존 종 이미지/이모지를 최종 자산으로 교체하고 habitat anchor 공급 경계에 실제 가지·목재 표현을 연결할 수 있습니다. 이번 data/state/systems/services/ui 경계를 유지하고 생태 좌표와 표시 좌표를 섞지 않습니다. 도감·먹이그물·클리어는 기능을 유지한 채 외형을 개선합니다.

## 47. 최종 변경 manifest

GitHub Desktop Changes에 나타나는 79개 파일입니다. A는 추가, M은 수정이며 모두 미커밋입니다.

|구분|경로|
|---|---|
|M|[ARCHITECTURE.md](ARCHITECTURE.md)|
|M|[FOREST_FOOD_WEB_AUDIT.md](FOREST_FOOD_WEB_AUDIT.md)|
|M|[FOREST_HABITAT_SYSTEM.md](FOREST_HABITAT_SYSTEM.md)|
|M|[FOREST_PACING.md](FOREST_PACING.md)|
|M|[FOREST_POINT_ECONOMY.md](FOREST_POINT_ECONOMY.md)|
|M|[FOREST_SPECIES.md](FOREST_SPECIES.md)|
|M|[QA.md](QA.md)|
|M|[README.md](README.md)|
|M|[STAGE14_REPLAY_HANDOFF.md](STAGE14_REPLAY_HANDOFF.md)|
|M|[css/activities.css](css/activities.css)|
|M|[data/activities.js](data/activities.js)|
|M|[index.html](index.html)|
|M|[js/main.js](js/main.js)|
|M|[js/services/point-economy-migration.js](js/services/point-economy-migration.js)|
|M|[js/services/progress-summary.js](js/services/progress-summary.js)|
|M|[js/services/save-format.js](js/services/save-format.js)|
|M|[js/services/save-service.js](js/services/save-service.js)|
|M|[js/state/game-state.js](js/state/game-state.js)|
|M|[js/state/point-economy-state.js](js/state/point-economy-state.js)|
|M|[js/systems/activities.js](js/systems/activities.js)|
|M|[js/systems/activity-rules.js](js/systems/activity-rules.js)|
|M|[js/systems/events.js](js/systems/events.js)|
|M|[js/systems/forest-progress.js](js/systems/forest-progress.js)|
|M|[js/systems/goal-guidance.js](js/systems/goal-guidance.js)|
|M|[js/systems/management.js](js/systems/management.js)|
|M|[js/systems/point-economy.js](js/systems/point-economy.js)|
|M|[js/ui/activity-view.js](js/ui/activity-view.js)|
|M|[js/ui/event-view.js](js/ui/event-view.js)|
|M|[js/ui/forest-view.js](js/ui/forest-view.js)|
|M|[js/ui/point-economy-view.js](js/ui/point-economy-view.js)|
|M|[js/ui/population-view.js](js/ui/population-view.js)|
|M|[js/ui/render.js](js/ui/render.js)|
|M|[tests/detritus-save.test.mjs](tests/detritus-save.test.mjs)|
|M|[tests/detritus.browser.test.cjs](tests/detritus.browser.test.cjs)|
|M|[tests/development-save.test.mjs](tests/development-save.test.mjs)|
|M|[tests/ecology-fixtures.mjs](tests/ecology-fixtures.mjs)|
|M|[tests/ecology.test.mjs](tests/ecology.test.mjs)|
|M|[tests/environment-events-save.test.mjs](tests/environment-events-save.test.mjs)|
|M|[tests/environment-events.browser.test.cjs](tests/environment-events.browser.test.cjs)|
|M|[tests/environment-events.long.test.mjs](tests/environment-events.long.test.mjs)|
|M|[tests/environment-events.test.mjs](tests/environment-events.test.mjs)|
|M|[tests/food-web.browser.test.cjs](tests/food-web.browser.test.cjs)|
|M|[tests/food-web.test.mjs](tests/food-web.test.mjs)|
|M|[tests/guidance.browser.test.cjs](tests/guidance.browser.test.cjs)|
|M|[tests/guidance.test.mjs](tests/guidance.test.mjs)|
|M|[tests/habitat.browser.test.cjs](tests/habitat.browser.test.cjs)|
|M|[tests/habitat.long.test.mjs](tests/habitat.long.test.mjs)|
|M|[tests/habitat.test.mjs](tests/habitat.test.mjs)|
|M|[tests/lifespan.test.mjs](tests/lifespan.test.mjs)|
|M|[tests/pacing.browser.test.cjs](tests/pacing.browser.test.cjs)|
|M|[tests/pacing.test.mjs](tests/pacing.test.mjs)|
|M|[tests/persistence.browser.test.cjs](tests/persistence.browser.test.cjs)|
|M|[tests/point-economy-fixtures.mjs](tests/point-economy-fixtures.mjs)|
|M|[tests/point-economy-save.test.mjs](tests/point-economy-save.test.mjs)|
|M|[tests/point-economy.long.test.mjs](tests/point-economy.long.test.mjs)|
|M|[tests/population.test.mjs](tests/population.test.mjs)|
|M|[tests/run-tests.mjs](tests/run-tests.mjs)|
|A|[FOREST_CARD_UNLOCKS.md](FOREST_CARD_UNLOCKS.md)|
|A|[FOREST_FIELD_GUIDE.md](FOREST_FIELD_GUIDE.md)|
|A|[FOREST_REPLAY_SYSTEM.md](FOREST_REPLAY_SYSTEM.md)|
|A|[STAGE14_REPORT.md](STAGE14_REPORT.md)|
|A|[css/collection.css](css/collection.css)|
|A|[data/card-unlocks.js](data/card-unlocks.js)|
|A|[js/services/collection-migration.js](js/services/collection-migration.js)|
|A|[js/state/collection-state.js](js/state/collection-state.js)|
|A|[js/systems/replay.js](js/systems/replay.js)|
|A|[js/systems/round-care.js](js/systems/round-care.js)|
|A|[js/ui/collection-view.js](js/ui/collection-view.js)|
|A|[tests/replay-fixtures.mjs](tests/replay-fixtures.mjs)|
|A|[tests/replay.browser-results.json](tests/replay.browser-results.json)|
|A|[tests/replay.browser.test.cjs](tests/replay.browser.test.cjs)|
|A|[tests/replay.detritus-browser-results.json](tests/replay.detritus-browser-results.json)|
|A|[tests/replay.habitat-browser-results.json](tests/replay.habitat-browser-results.json)|
|A|[tests/replay.long-results.json](tests/replay.long-results.json)|
|A|[tests/replay.long.test.mjs](tests/replay.long.test.mjs)|
|A|[tests/replay.pacing-browser-results.json](tests/replay.pacing-browser-results.json)|
|A|[tests/replay.point-economy-browser-results.json](tests/replay.point-economy-browser-results.json)|
|A|[tests/replay.test.mjs](tests/replay.test.mjs)|
|A|[tests/replay.validation-results.json](tests/replay.validation-results.json)|

검증 명령: node tests/run-tests.mjs (역사314/현재275), node --test tests/replay.test.mjs tests/replay.long.test.mjs (신규50), 기존 브라우저17개와 tests/replay.browser.test.cjs (전체18). Edge와 Playwright는 기존 로컬 런타임을 사용했습니다. 새25장시간 결과를 갱신할 때만 WRITE_REPLAY_RESULTS=1을 사용하며 기존 WRITE_*_RESULTS를 켜지 않습니다. 브라우저 RESULTS_PATH는 tests/replay.*-results.json으로 지정해 옛 결과를 보존합니다.

문법143파일/로컬 문서 링크 검사와 Git 공백 검사를 수행했습니다. 기존 생태·서식지·이미지 및 이전 결과 JSON의 Git diff는0입니다. [검증 요약](tests/replay.validation-results.json) · [장시간 원시 결과](tests/replay.long-results.json) · [브라우저 화면/성능](tests/replay.browser-results.json).

실제 S5e,배포 GitHub Pages와 실제 학급 수업은 측정하지 않았습니다. Git Commit/Stage/Push·Git/Pages 설정 변경은 하지 않았습니다.
