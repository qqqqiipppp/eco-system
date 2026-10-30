# 생물 모션 이미지 규격 (24종)

지금 게임은 생물마다 **기본 자세 이미지 1장**(`assets/images/species-raster/<id>.webp`)을 모든 상태와 프레임에 씁니다. 움직임은 아직 CSS로 흉내만 냅니다. 걸을 때 살짝 튀고, 먹을 때 끄덕이고, 분해할 때 은은하게 빛나요. **모션 프레임은 방아깨비 성체 move 4장만 들어가 있습니다(2026-10-30).** 방아깨비는 프레임을 0.22초마다 번갈아 쓰지 않고, 0.8초 도약 한 번에 맞춰 씁니다: 웅크림 move-0(0~0.16초) → 박차기 move-1(~0.26초) → 공중 다리 회수 move-2(~0.48초) → 착지 준비 move-3(~0.56초) → 착지·쉬기 move-0(~0.8초). 공중으로 오르는 높이와 착지는 화면 표시만 바꿉니다(`js/ui/species-visuals.js`의 `hopTiming`, `js/ui/organism-layer.js`의 `paintHop`).

이 문서는 게임이 실제로 쓰는 상태만 기준으로, 꼭 필요한 프레임만 정리한 것입니다.

## 1. 게임이 상태를 고르는 방식 (코드 위치)

| 하는 일 | 파일 |
| --- | --- |
| 종별 상태 이름 | `js/ui/species-visuals.js`의 `visualStates` |
| 상태 고르기, 프레임 넘기는 간격 | `js/ui/species-visuals.js`의 `createVisualTracker()` |
| 움직이지 않는 종 (frame 0만 사용) | `js/ui/species-visuals.js`의 `stillSpecies` |
| 화면 적용 | `js/ui/organism-layer.js`의 `paintVisuals` (`data-visual-state`, `data-visual-frame`) |
| 그림 파일 연결 | `js/ui/species-raster.js` |
| 임시 CSS 움직임, 참지렁이 흙 가림 | `css/species-visuals.css` |
| 새끼 크기 (멧토끼 .68/.84배, 번식 새끼 .72배) | `css/species-visuals.css`, `css/chapter.css`: CSS가 줄이므로 따로 그리지 않음 |

상태마다 프레임은 0과 1 두 장이고, 상태가 이어지는 동안 반복합니다. 프레임 간격은 다음과 같아요.

| 상태 | 프레임 간격 | 언제 |
| --- | --- | --- |
| `move` | 0.22초 | 실제로 위치가 바뀐 틱 |
| `eat` | 0.22초 | 먹이 활동 중 (`behaviorState==='eat'`) |
| `idle` (동물) | 0.32초 | 서 있을 때 |
| `covered`, `surface` (참지렁이) | 1.2초 | 흙 속 / 땅 위 |
| `covered-eat` (참지렁이) | 0.22초 | 흙 속에서 낙엽 먹기 |
| 식물 `idle`, `leaf-turn` | 1.2초 (9초마다 바뀜) | 강아지풀만 |
| 식물 `growth`, 분해자 `active` | 프레임 0 고정 | 실제로 자라거나 분해할 때 |

## 2. 종별 규격표

- **표시 상자**는 게임 화면에서 그림이 들어가는 크기(CSS px, `data/interaction-config.js`)입니다. 이 크기는 바꾸지 않습니다.
- **반전:** 동물은 오른쪽을 보는 그림 한 방향만 그리면 게임이 좌우를 뒤집어 씁니다.
- **필요 프레임**은 기본 이미지 외에 새로 그릴 장수입니다. `idle`은 기본 이미지를 그대로 씁니다.

| id | 생물 | 게임 속 단계 | 게임이 쓰는 상태 | 필요 프레임 | 표시 상자 | 반전 | 판단 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| grasshopper | 방아깨비 | 약충 → 성체 | idle·move·eat | 성체 move 2, eat 2 / **약충 기본 1**, move 2, eat 2 | 52×40 | 예 | 약충 기본 1장이 가장 급함 (지금은 성체 그림으로 대신 보임) |
| frog | 참개구리 | 성체 | idle·move·eat | move 2, eat 2 | 52×40 | 예 | 필요 |
| rabbit | 멧토끼 | 새끼·어린 개체·성체 | idle·move·eat | move 2, eat 2 | 56×49 | 예 | 새끼는 CSS 축소로 충분 |
| chipmunk | 다람쥐 | 성체 | idle·move·eat | move 2, eat 2 | 46×38 | 예 | 필요 |
| field-mouse | 고슴도치 | 성체 | idle·move·eat | move 2, eat 2 | 42×34 | 예 | 필요 |
| caterpillar | 솔나방 애벌레 | 유충 | idle·move·eat | move 2, eat 2 | 36×28 | 예 | 필요 (작아서 동작은 크게) |
| aphid | 청동풍뎅이 | 성충 | idle·move·eat | move 2, eat 2 | 32×25 | 예 | 필요 (작아서 동작은 크게) |
| snail | 명주달팽이 | 성체 | idle·move·eat | move 2, eat 2 | 40×32 | 예 | move는 느려서 CSS로도 충분할 수 있음 |
| spider | 무당거미 | 성체 | idle·move·eat | eat 2, move 2(선택) | 40×32 | 예 | 기다렸다 잡는 거미라 move는 먹이에 다가갈 때만 나옴 |
| ladybird | 홍단딱정벌레 | 성충 | idle·move·eat | move 2, eat 2 | 36×28 | 예 | 필요 |
| tit | 박새 | 성체 | idle·move·eat | move 2(날갯짓), eat 2 | 44×36 | 예 | 필요 |
| bulbul | 직박구리 | 성체 | idle·move·eat | move 2(날갯짓), eat 2 | 48×40 | 예 | 필요 |
| snake | 유혈목이 | 성체 | idle·move·eat | move 2, eat 2 | 48×34 | 예 | 필요 |
| weasel | 족제비 | 성체 | idle·move·eat | move 2, eat 2 | 48×38 | 예 | 필요 |
| goshawk | 참매 | 성체 | idle·move·eat | move 2(날갯짓), eat 2 | 54×43 | 예 | 필요 |
| earthworm | 참지렁이 | 성체 | covered·surface·covered-eat·eat | eat 2 | 38×24 | 예 | 흙 속 상태는 CSS로 가림. 땅 위 먹기만 그림 |
| grass | 강아지풀 | 새싹 → 자람 → 씨앗 | idle·growth·leaf-turn | **새싹 기본 1**, leaf-turn 1(선택) | 52×43 | 아니요 | 새싹 1장 필요 (지금은 옛 SVG) |
| mushroom | 구름송편버섯 | 균사체 → 자실체 → 포자 | idle·active | **균사체 기본 1** | 52×43 | 아니요 | 균사체 1장 필요 (지금은 옛 SVG). 움직임 없음 |
| oak | 상수리나무 | 성목 | idle·growth | 0 | 80×76 | 아니요 | 정지. 모션 불필요 |
| pine | 소나무 | 성목 | idle·growth | 0 | 66×70 | 아니요 | 정지. 모션 불필요 |
| hazel | 팽나무 | 성목 | idle·growth | 0 | 60×60 | 아니요 | 정지. 모션 불필요 |
| raspberry | 산딸기 | 성숙한 관목 | idle·growth | 0 | 52×43 | 아니요 | 정지. 모션 불필요 |
| litter-mold | 낙엽 분해 곰팡이 군집 | 군집 | idle·active | 0 | 48×32 | 아니요 | 정지. 분해 중 표시는 CSS 빛으로 충분 |
| soil-bacteria | 고초균 | 확대 군집 도식 | idle·active | 0 | 48×32 | 아니요 | 정지. 분해 중 표시는 CSS 빛으로 충분 |

**합계:** 꼭 필요한 것은 약 69장이에요.
- 동물 15종 × 4장
- 참지렁이 2장
- 방아깨비 약충 5장
- 강아지풀 새싹 1장
- 버섯 균사체 1장
- 선택: 강아지풀 leaf-turn 1장

**권장 순서:**
1. 정지 그림 3장: 약충, 새싹, 균사체. 지금 화풍이 다르게 보이는 곳이에요.
2. `eat` 프레임: 먹이 관계가 학습의 중심이라서요.
3. `move` 프레임

## 3. 제작 기준 (모든 프레임 공통)

- **같은 캔버스:** 1448×1086 투명 PNG(4:3)로, 기본 이미지와 같은 크기입니다.
- **같은 크기·같은 위치:** 기본 이미지 위에 겹쳐 그리듯, 몸 크기와 몸통 위치를 바꾸지 않습니다. 게임은 **기본 이미지의 잘라낸 영역과 확대율을 그 종의 모든 프레임에 똑같이** 적용합니다. 프레임마다 몸이 커지거나 옮겨지면 화면에서 튀어 보여요.
- **기준점:** 발·밑동·배 아래가 기본 이미지와 같은 높이여야 합니다. 게임에서는 256×192 안에서 y=174, 가로 가운데에 놓입니다.
- **방향:** 오른쪽을 봅니다.
- **두 장의 차이:** 다리, 날개, 머리처럼 움직이는 부분만 바꿉니다. 색, 선 굵기, 명암, 눈 표현은 같게 유지해요.
- **작은 곤충** (청동풍뎅이·애벌레·홍단딱정벌레는 화면에서 32~36px): 다리나 머리의 움직임을 조금 크게 그려야 보입니다.
- **넣지 않는 것:** 글자, 배경, 바닥판, 그림자판.
- **동물만 그립니다.** 나무·버섯·곰팡이·고초균은 흔들리는 프레임을 만들지 않습니다.

## 4. Claude에게 넘길 때의 파일 이름과 폴더

```
artwork/<날짜>/forest-sprites-motion-<차수>/
  asset-manifest.json            ← 최종 승인 파일 목록 (이전 시안 구분)
  grasshopper/
    grasshopper-move-0.png
    grasshopper-move-1.png
    grasshopper-eat-0.png
    grasshopper-eat-1.png
    grasshopper-nymph.png        ← 성장 단계 기본 이미지
    grasshopper-nymph-move-0.png
    ...
  grass/grass-sprout.png
  mushroom/mushroom-mycelium.png
  earthworm/earthworm-eat-0.png, earthworm-eat-1.png
```

- 파일 이름 규칙: `<id>-<state>-<frame>.png`, 성장 단계는 `<id>-<단계>.png`와 `<id>-<단계>-<state>-<frame>.png`입니다.
- `id`, `state`, 단계 이름은 위 표의 영어 이름을 그대로 씁니다(`nymph`, `sprout`, `mycelium`).
- 일부만 그려도 됩니다. 등록되지 않은 상태는 계속 기본 이미지를 씁니다.

## 5. 넘긴 뒤 Claude가 하는 일

1. `tools/build_species_raster.py`를 실행해 256×192 WebP로 바꿉니다. 이때 종마다 기본 이미지의 잘라낸 영역과 확대율을 공유합니다. 원본 해시는 `manifest.json`에 기록합니다.
2. `js/ui/species-raster.js`에 상태별 파일을 등록하고, 그 종의 임시 CSS 움직임을 끕니다.
3. 숲, 카드, 도감, 먹이그물 화면에서 프레임이 튀지 않는지 확인합니다.

**용량 목표:** 한 장에 30KB 이하. 지금 기본 이미지 24장은 저장소 기준 약 420KB이고, 69장이 추가되면 전체 약 1.5MB를 예상합니다.
