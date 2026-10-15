# 14단계 현재 계약

14단계는 시간 설정을 바꾸지 않았습니다. 한 숲15~20분은 설계 목표이며 강제 대기가 없습니다. 기존 실제4/10/16분 사건·0.5초 tick·30초 안정 유지·생태2배·화면 이동 속도를 보존합니다. 이번 느린 읽기 모형은930초, 빠른 모형은780초에 클리어했으며 실제 학생 측정이 아닙니다. 새 숲은 회차 활성 시간을0으로 시작하고 이전 영구 성취의 시간은 별도로 보존합니다. schema15를 다시 시간 압축하지 않습니다.

[카드 해금](FOREST_CARD_UNLOCKS.md) · [도감·먹이그물](FOREST_FIELD_GUIDE.md) · [반복 숲·경제·저장](FOREST_REPLAY_SYSTEM.md) · [완료 보고](STAGE14_REPORT.md)

---

아래는 이전 단계의 설계·검증 이력입니다. 현재 기능은 위 14단계 계약을 우선합니다.

## 13.7단계 기록

생태계2배·실제 simulationTime/.5tick/30fps·환경4/10/16·읽기/관리 대기·안정30초는 변경하지 않았습니다. habitat 표시가 시간 배율을 다시 적용하지 않으며 화면이동/표시를 생태 시간과 구분합니다. 핵심20분 결정 결과를13.6 JSON과 대조했습니다.

[서식지 구조](FOREST_HABITAT_SYSTEM.md) · [완료 보고](STAGE13_7_REPORT.md)

# 숲 진행 시간 — 13.6단계

## 목표와 시간의 의미

권장 한 회차15~20분, 빠른 탐구12~15분은 수업 설계 목표다. 제한 시간이나 15분 전 클리어 차단은 없다. 실제 학급 평균을 측정하지 않았다. 기존 환경 사건8·20·32분, 한해살이풀24~32분, 대표 성장/번식/회복이40분 안팎 기준이어서 20분 수업 탐구에서는 생태 변화 대기가 길었다. 기존 숲/카드/학습 UI를 유지한다.

simulationTime은 실제 화면이 활성인 초이며 2배로 증가시키지 않는다. data/pacing-config.js의 ecologySeconds/ecologyRate로 생태 설정만 절반/두 배 적용한다. ecology tick .5초, event tick1초, 화면30fps/공통RAF1은 그대로다. 설정에 이미 적용된 배율을 시스템 update에서 또 곱하지 않는다.

화면 배회·먹이 추적 속도·검색2초·먹기1초·추적18초는 실제 접근/조작 리듬으로 유지한다. 식물 자원 회복/배고픔 증가/분해는2배, 포만·심각한 부족·수명·성장·번식·유한 보충은 절반이다. 이를 완전한40분 궤적 재생으로 간주하지 않고 실제 결과를 비교했다.

## 전체 시간 조사와 변경

아래 값은 실행 중 export 값을 직접 추출했다. 단위는 초 또는 초당 변화량; 개체/자원 상한은 무차원이다. min/max 수명은 초다. 설정 소스의 원래 기준값에 중앙 변환이 한 번 적용된다.

|시스템/설정|기존13.5|현재13.6|시간 의미·근거|저장 영향|
|---|---|---|---|---|
|lifespanRules.earthworm.min|2700|1350|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.earthworm.max|3900|1950|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.oak.min|10800|5400|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.oak.max|14400|7200|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.grass.min|1440|720|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.grass.max|1920|960|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.grasshopper.min|840|420|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.grasshopper.max|1200|600|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.frog.min|3300|1650|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.frog.max|4500|2250|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.rabbit.min|3300|1650|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.rabbit.max|4800|2400|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.mushroom.min|720|360|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.mushroom.max|1080|540|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.mushroom.stressSeconds|1800|900|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.pine.min|9000|4500|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.pine.max|12600|6300|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.raspberry.min|4200|2100|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.raspberry.max|6000|3000|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.hazel.min|10800|5400|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.hazel.max|14400|7200|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.chipmunk.min|3000|1500|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.chipmunk.max|4200|2100|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.field-mouse.min|3300|1650|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.field-mouse.max|4800|2400|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.caterpillar.min|1080|540|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.caterpillar.max|1560|780|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.aphid.min|1320|660|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.aphid.max|1920|960|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.snail.min|2700|1350|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.snail.max|3900|1950|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.spider.min|1440|720|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.spider.max|2160|1080|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.ladybird.min|2100|1050|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.ladybird.max|3000|1500|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.tit.min|3900|1950|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.tit.max|5400|2700|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.bulbul.min|3900|1950|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.bulbul.max|5700|2850|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.snake.min|4500|2250|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.snake.max|6000|3000|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.weasel.min|3000|1500|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.weasel.max|4500|2250|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.goshawk.min|5400|2700|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.goshawk.max|7200|3600|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.litter-mold.min|480|240|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.litter-mold.max|720|360|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.litter-mold.stressSeconds|1200|600|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.soil-bacteria.min|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.soil-bacteria.max|540|270|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|lifespanRules.soil-bacteria.stressSeconds|1500|750|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|replenishmentRules.grasshopper.healthySeconds|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|replenishmentRules.grasshopper.cooldown|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|replenishmentRules.caterpillar.healthySeconds|420|210|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|replenishmentRules.caterpillar.cooldown|600|300|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|colonyConfig.recoverySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grass.maxSeconds|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grass.maturitySeconds|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grass.breedingSeconds|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grass.pendingSeconds|60|30|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grasshopper.maxSeconds|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grasshopper.maturitySeconds|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grasshopper.breedingSeconds|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.grasshopper.pendingSeconds|60|30|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.rabbit.maxSeconds|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.rabbit.maturitySeconds|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.rabbit.breedingSeconds|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|developmentRules.mushroom.maxSeconds|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|ecologyConfig.tickSeconds|0.5|0.5|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|ecologyConfig.searchRetrySeconds|2|2|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|ecologyConfig.eatSeconds|1|1|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|ecologyConfig.maxPursuitSeconds|18|18|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|foodResourceConfig.grass.recoveryPerSecond|0.06|0.12|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|foodResourceConfig.oak.recoveryPerSecond|0.045|0.09|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|foodResourceConfig.pine.recoveryPerSecond|0.035|0.07|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|foodResourceConfig.raspberry.recoveryPerSecond|0.05|0.1|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|foodResourceConfig.hazel.recoveryPerSecond|0.04|0.08|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.grasshopper.hungerPerSecond|0.035|0.07|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.grasshopper.speed|0.037|0.037|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.frog.hungerPerSecond|0.025|0.05|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.frog.speed|0.056|0.056|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.rabbit.hungerPerSecond|0.012|0.024|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.rabbit.speed|0.045|0.045|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.chipmunk.hungerPerSecond|0.022|0.044|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.chipmunk.speed|0.065|0.065|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.field-mouse.hungerPerSecond|0.025|0.05|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.field-mouse.speed|0.035|0.035|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.caterpillar.hungerPerSecond|0.02|0.04|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.caterpillar.speed|0.018|0.018|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.aphid.hungerPerSecond|0.012|0.024|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.aphid.speed|0.026|0.026|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.snail.hungerPerSecond|0.012|0.024|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.snail.speed|0.014|0.014|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.spider.hungerPerSecond|0.02|0.04|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.spider.speed|0|0|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.spider.maxPursuitSeconds|2|2|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|feedingConfig.ladybird.hungerPerSecond|0.022|0.044|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.ladybird.speed|0.038|0.038|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.tit.hungerPerSecond|0.024|0.048|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.tit.speed|0.085|0.085|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.bulbul.hungerPerSecond|0.02|0.04|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.bulbul.speed|0.075|0.075|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.snake.hungerPerSecond|0.014|0.028|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.snake.speed|0.048|0.048|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.weasel.hungerPerSecond|0.018|0.036|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.weasel.speed|0.072|0.072|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|feedingConfig.goshawk.hungerPerSecond|0.014|0.028|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|feedingConfig.goshawk.speed|0.09|0.09|유지: 조작/읽기/접근/평가 또는 상한|기존 위치/이동 유지|
|populationConfig.graceSeconds|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|populationConfig.restoreGraceSeconds|30|15|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|populationConfig.supportReliefSeconds|60|30|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|populationConfig.recentMealSeconds|45|22.5|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.grass.healthySeconds|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.grass.cooldown|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.grasshopper.healthySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.grasshopper.cooldown|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.rabbit.healthySeconds|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|reproductionRules.rabbit.cooldown|480|240|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|decompositionConfig.litterPerProducer|0.004|0.008|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|decompositionConfig.woodPerTree|0.002|0.004|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|decompositionConfig.backgroundRate|0.001|0.002|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|decompositionConfig.rates.mushroom.wood|0.006|0.012|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|decompositionConfig.rates.litter-mold.litter|0.006|0.012|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|decompositionConfig.rates.soil-bacteria.remains|0.006|0.012|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|decompositionConfig.nutrientUsePerProducer|0.00005|0.0001|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|satietySeconds.frog|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.field-mouse|90|45|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.spider|90|45|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.ladybird|90|45|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.tit|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.snake|360|180|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.weasel|300|150|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|satietySeconds.goshawk|420|210|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|growthConfig.recoveryPerSecond|0.015|0.03|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|growthConfig.declinePerSecond|0.025|0.05|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|environmentEventConfig.initialDelay|480|240|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventConfig.interval|720|360|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventConfig.postpone|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventConfig.repeatCooldown|1800|900|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.drought.duration|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.drought.recoverySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.rain.duration|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.rain.recoverySeconds|0|0|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.cloudy.duration|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.cloudy.recoverySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.air-pollution.duration|120|60|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.air-pollution.recoverySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.soil-damage.duration|180|90|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|environmentEventDefinitions.soil-damage.recoverySeconds|240|120|생태 진행 압축|구버전 관련 진행률/남은 생태 대기 변환|
|earthwormConfig.rate|0.003|0.006|생태 진행 압축|저장된 자원량 유지; 이후 처리율만 변경|
|organicNoticeConfig.lifetimeSeconds|120|120|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|
|forestGoal.stableSeconds|30|30|유지: 조작/읽기/접근/평가 또는 상한|구버전 관련 진행률/남은 생태 대기 변환|

읽기/조작 설정은 eventConfig tick1초·shortage8초·slowGrowth3초·cooldown30초, organic 관심120초, 안정도 이력30초/표본5초, 클리어 안정 유지30초, 자동저장 예약1200ms/정기체크15활성초 그대로다. 학습 정답/터치/배치에는 자동 완료 타이머가 없다. hidden은 공통 루프를 중단하고 재개 시 frame 시각을 초기화한다. savedAt과 오프라인 날짜는 생태 시간을 늘리지 않는다. 개체별 타이머/추가 RAF는 없다.

## 24종 수명

교육용 게임 시간이며 현실 생물 수명 측정값이 아니다. 군집 열은 전체 군집 사망 시간이 아니라 세대 갱신 주기이며 나쁜 환경 누적 제한은 별도다. 기존 종별 비율·해당 생활 단계 표현·ID·유기물 유형을 유지한다.

|생물|의미|기존 분|압축 분|나쁜 환경 누적 분|
|---|---|---|---|---|
|참지렁이 (earthworm)|개체/해당 생활 단계|45~65|22.5~32.5|—|
|상수리나무 (oak)|개체/해당 생활 단계|180~240|90~120|—|
|강아지풀 (grass)|개체/해당 생활 단계|24~32|12~16|—|
|방아깨비 (grasshopper)|개체/해당 생활 단계|14~20|7~10|—|
|참개구리 (frog)|개체/해당 생활 단계|55~75|27.5~37.5|—|
|멧토끼 (rabbit)|개체/해당 생활 단계|55~80|27.5~40|—|
|구름송편버섯 (mushroom)|군집 갱신|12~18|6~9|30→15|
|소나무 (pine)|개체/해당 생활 단계|150~210|75~105|—|
|산딸기 (raspberry)|개체/해당 생활 단계|70~100|35~50|—|
|팽나무 (hazel)|개체/해당 생활 단계|180~240|90~120|—|
|다람쥐 (chipmunk)|개체/해당 생활 단계|50~70|25~35|—|
|고슴도치 (field-mouse)|개체/해당 생활 단계|55~80|27.5~40|—|
|솔나방 애벌레(송충이) (caterpillar)|개체/해당 생활 단계|18~26|9~13|—|
|청동풍뎅이 (aphid)|개체/해당 생활 단계|22~32|11~16|—|
|명주달팽이 (snail)|개체/해당 생활 단계|45~65|22.5~32.5|—|
|무당거미 (spider)|개체/해당 생활 단계|24~36|12~18|—|
|홍단딱정벌레 (ladybird)|개체/해당 생활 단계|35~50|17.5~25|—|
|박새 (tit)|개체/해당 생활 단계|65~90|32.5~45|—|
|직박구리 (bulbul)|개체/해당 생활 단계|65~95|32.5~47.5|—|
|유혈목이 (snake)|개체/해당 생활 단계|75~100|37.5~50|—|
|족제비 (weasel)|개체/해당 생활 단계|50~75|25~37.5|—|
|참매 (goshawk)|개체/해당 생활 단계|90~120|45~60|—|
|낙엽 분해 곰팡이 군집 (litter-mold)|군집 갱신|8~12|4~6|20→10|
|고초균 (soil-bacteria)|군집 갱신|5~9|2.5~4.5|25→12.5|

## 대표 성장과 번식

|생물|기존 단계 초|압축 단계 초|현재 씨앗/알 대기 초|
|---|---|---|---|
|강아지풀|sprout:0 · grown:180 · seeding:300|sprout:0 · grown:90 · seeding:150|30|
|방아깨비|nymph:0 · adult:180|nymph:0 · adult:90|30|
|멧토끼|baby:0 · juvenile:90 · adult:360|baby:0 · juvenile:45 · adult:180|없음|
|참개구리|adult:0|adult:0|없음|
|구름송편버섯|mycelium:0 · fruiting:180 · spore-ready:300|mycelium:0 · fruiting:90 · spore-ready:150|없음|

번식 건강 누적/재사용은 강아지풀180/240→90/120초, 방아깨비240/360→120/180초, 멧토끼360/480→180/240초. 방아깨비 유한 알 보충300/180→150/90초·예산6, 솔나방 애벌레 보충420/600→210/300초다. 생물 ID를 복제하거나 성장에 포인트를 주지 않는다. 참개구리는 성체/생애주기 학습만; 가짜 올챙이 없음. 참지렁이의 새 번식/성장/굶주림 모델도 없음.

## 자원·분해·참지렁이

식물 먹이 상한/한 번 섭식량은 그대로, 회복율과 배고픔 증가를 함께2배로 조정했다. 포만 대기와 굶주림 누적 제한은 절반이며 최초 적응120→60초, 구버전 복원 유예30→15초다. 이미 저장된 hunger/foodStock은 보존한다. 이동과 검색은 그대로여서 섭식 총합/번식 경계는 정확히 같지 않을 수 있다.

wood/litter/remains 실재 공유 자원만 차감한다. 균류·세균·background·지렁이율을 같은2배로 조정해 같은 풀의 처리 몫을 유지하며 총 차감과 soilNutrients yield는 각각 한 번이다. 참지렁이율.003→.006, 최대3개체·실제 섭식당 토양.02·숲 누적예산.12·토양상한.6은 그대로. 예산과 이미 먹은 기록은 재시작/불러오기로 갱신하지 않는다.

실제 발생 관심!는 처리 완료와 구분하고 가장 가까운 적합한 개체에 연결한다. 최대 관심120활성초/이력20/후보6/표시4/이벤트 큐36을 유지한다. 실제 자원이0이 되면 관심 후보도 사라지는 기존 정책이다. 포식/회수/단계 퇴장은 가짜 유기물을 생성하지 않는다.

## 환경과 경제

첫480→240초, 간격720→360초, 연기120→60초, 같은 종류 재사용1800→900초. 가뭄/토양훼손 지속180→90초; 비/흐림/공기오염120→60초; 자연 회복240→120초(비는0). 자동 정상 시작4·10·16분, 불리한 숲에서는 기존 상태 조건에 따라 연기한다. 사건 중첩 금지/회복 한 번/실제 과학 설명/강도·바닥값 그대로다.

시작0점, 최초 발견/학습 보상 그대로, 환경 학습4점·최대5/20, 조건부 지원1회·최대28을 유지한다. 관리 비용6/6/5/8, 클릭 연타 방지 대기8/8/45/75는 실제 초 그대로; 서식지 회복 생태 효과60→30초(효과 강도1.35). 관리 비용을 또 절반으로 바꾸거나 무료 관리·새 수입을 만들지 않는다.

## 저장15와 시간 이전

같은 key eco-system:forest-save, schema15/pacingRevision1/ecologyRevision2. version7~14를 지금 압축 정책으로 변환한다. 다음 회차를 기다리지 않는다. 절대 simulationTime·학습/해금/돈/원장/지원/legacyEcology/유기물/토양 예산·관심 발생 at은 그대로다. 개체의 duration/initialAge와 현재 시각 기준 지난 생애를 절반으로 줄여 상대 나이를 보존한다. 군집 갱신/스트레스, 성장 진행, 번식 건강 누적, pending 남은 초, 생태 nextAt, 포만/최근 섭식/적응 기준, 진행 중 환경 사건의 duration/경과/타임라인, 서식지 효과 잔여를 변환한다.

환경 이력의 내부 처리 시각/evidence/response at도 현재 시각을 중심으로 변환해 단계 일관성 검증과 한 번 적용을 유지한다. 원래 pointEconomy 지급 시각/관리 거래 시각은 변경하지 않는다. 관리 버튼 cooldown·배치 cooldown·이벤트 cooldown·관심120초는 변환하지 않는다. 구버전 미완료 안정 유지시간은 기존처럼 다시 시작하고 이미 클리어는 보존한다. v15는 실제 안정 유지 진척을 저장한다.

v15는 먹이 행동/타깃/재탐색 대기/먹기 잔여/추적 누적과 acclimationUntil을 좁은 whitelist로 저장해 연속 실행을 재현한다. 실제 먹이 관계/존재하는 대상/유한 시간 범위를 검증하고 잘못된 상태는 wander로 복구한다. DOM/레이아웃/학생 선택/이벤트 객체는 저장하지 않는다. 현재15는 재압축하지 않으며 미래16·미지 생태/시간 정책은 덮어쓰기를 막는다.

## 40분과20분 비교

동일 대표 개발 fixture(학습된 카드/기존 잔액30) 비교이며 신규 학생 경제와 구분한다. 기존 기준 데이터는 수정 전 실제 실행으로 보존했다.

|항목|기존40분|현재20분|분석|
|---|---|---|---|
|개체 수|7|10|새 tick에서 생애/번식/섭식 경계 순서 차이|
|종 수|5|5|대표 숲의 종류 유지|
|실제 섭식 합계|395|402|행동 결정 .5초와 이동은 실제 시간 유지|
|포식|8|8|먹힌 개체 한 번 제거; 가짜 유기물 없음|
|자연적 감소|10|9|같은 상대 수명; 개체별 세대 경계 차이|
|굶주림 감소|0|0|정상 대표 숲 급감 없음|
|번식|4|7|실제 환경/먹이/공간/성숙 조건|
|유한 보충|4|3|예산6 유지|
|성장 변화|8|15|같은 ID에서 실제 단계 변화|
|유기물 처리|13.899479|13.832703|공유 풀 실제 처리 한 번|
|참지렁이 섭식|0|0|대표 숲에는 지렁이 없음; 별도 13/15 검사|
|분해자 관심 표시|0|0|표현 가능한 유기물/분해자 조합이 있어야 표시|
|환경 사건|8·20·32|4·10·16|8·20·32 → 4·10·16분|
|획득 포인트|15|15|동일 기존 보상|
|사용 포인트|14|14|비용 유지|
|남은 포인트|31|31|원장/잔액 보존|
|숲 안정도|76|85|일시 개체 구성에 따른 차이|
|클리어 기록|true|true|두 핵심 관찰·필수 학습·현존 종·30초 유지 동일|


별도 신규0점 시나리오3의20분 수지는 획득86·사용14·잔액72, 굶주림 감소0; 초반 과소 배치/지출 모형8은 실제2개체 부족 감소 후 복구/클리어했다. 개발용24종/30숲은5개 굶주림 감소로 기존40분과 동일한 정도이며 안정86; 모든종 무한 존속/무관리 영구 균형을 뜻하지 않는다.

## 클리어와 남은 대기

빠른 읽기/계획 가정은 마지막 필수 분류720초·30초 간격 관찰 선택·실제 먹이 관계/현재 생물/유지조건 후13분 완료. 일반 가정은 마지막 필수 분류900초 이후15.5분 완료. 의도적으로 학생 조작에 시간을 준 모형이며 게임에 해당 시각 잠금을 만들지 않았다. 답을 모두 알고 즉시 처리하는 모형3은99.5초에 완료한다. 따라서 실제12~20분 평균이나 최소 플레이 시간을 입증했다고 주장하지 않는다.

기존 nextAction/숲 목표는 실제 부족한 관찰·학습·배치·환경을 안내한다. 첫 실제 먹이 발견은초 단위, 성장90~180초·씨앗/알30초, 첫 환경4분·후속10/16분, 자연 감소/토양 동물은 종별 수명으로 이어진다. 설명 읽기/학습을 자동 처리하지 않고 무작위 알림으로 빈 시간을 채우지 않는다. 모든 사건/성장/분해 경험이 현재 클리어 필수 조건은 아니므로 아주 빠른 정답 학생은 환경 사건 전에도 완료할 수 있다. 14단계 탐구/도감 안내와 실제 학생 관찰로 추천 흐름을 다듬을 필요가 있다.

## 검증 실행

node tests/run-tests.mjs: 기존 시간 fixture314와 실제 압축 정책172(신규 단위50·장시간18 포함)를 분리 실행한다. 원래 생애/성장 초를 고정한 테스트는 Node 전용 historical loader로 이전 배율만 사용하며 생산 코드/브라우저에는 설치하지 않는다. 새172는 해당 loader 없이 실제2배 정책으로 검사한다. 수정 전13.5 원본314도 통과했다. 이것을486개의 서로 다른 검증으로 합쳐 설명하지 않는다.

[18개 측정](tests/pacing.long-results.json) · [기존40분/설정](tests/pacing.baseline-results.json) · [실제 이전 저장](tests/pacing.legacy-fixtures.json). 연속20/10+10은3숲에서 실제 생물/수명/성장/먹이/분해/사건/학습/카드/클리어·포인트 수지가 같다. 표시용 event sourceId 재생성 및0인 통계 항목은 정규화하고 기존 지급 원장은 보존한다.

S5e 실기기 FPS/발열/배터리/학생 체감 미검증. 가로1280×800·1138×712·960×600·1366×768/세로412×915 터치/창/스크롤·30개체와 hidden/오프라인을 브라우저로 검증한다. 실제 수업에서는 읽기 시간, 카드 재배치 빈도, 환경4/10/16 경험, 알림44px 선택, 앱 전환 복원,20분 발열을 확인해야 한다.
