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

상태마다 프레임은 0과 1 두 장이고, 상태가 이어지는 동안 반복합니다. 예외는 두 가지예요.
- **도약하는 동물**(방아깨비 성체·참개구리·멧토끼): `move` 4장. 0 웅크리기 → 1 박차기 → 2 공중(다리 접기) → 3 착지 준비(다리 뻗기)
- **새**(박새·직박구리·참매): `move`는 날갯짓 2장. 이동하는 동안 살짝 떠올라 날고, 멈추면 내려앉아요.

두 경우 모두 **그림은 땅에 선 자세 그대로 그리고**, 뜨는 높이는 게임이 정해요(`js/ui/species-visuals.js`의 `moveStyles`, `hopTiming`, `flyTiming`). 그림이 덜 들어오면(도약 4장 미만, 날갯짓 2장 미만) 그 종은 들어온 장수만큼 제자리 반복으로 보여요.

프레임 간격은 다음과 같아요.

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
| grasshopper | 방아깨비 | 약충 → 성체 | idle·move·eat | 성체 move 4(도약, 완료), eat 2 / **약충 기본 1**, move 2, eat 2 | 52×40 | 예 | 약충 기본 1장이 가장 급함 (지금은 성체 그림으로 대신 보임) |
| frog | 참개구리 | 성체 | idle·move·eat | move 4(도약), eat 2 | 52×40 | 예 | 필요 |
| rabbit | 멧토끼 | 새끼·어린 개체·성체 | idle·move·eat | move 4(도약), eat 2 | 56×49 | 예 | 새끼는 CSS 축소로 충분 |
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

**합계:** 꼭 필요한 것은 약 71장이에요.
- 동물 15종 × 4장, 참개구리·멧토끼 도약 +2장씩 (방아깨비 성체 도약 4장은 이미 있음)
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

## 5. 넘긴 뒤 하는 일 (명령 한 번)

```
python tools/build_species_raster.py --import artwork/<날짜>/forest-sprites-motion-<차수>
```

1. 폴더 안의 PNG를 이름 규칙대로 모두 256×192 WebP로 바꿉니다. `asset-manifest.json`에 파일 이름이 적혀 있으면 그 파일만 넣어요(시안 제외).
   - 프레임은 기본 그림의 잘라낸 영역과 확대율을 그대로 씁니다.
   - 성장 단계 기본 그림(`<id>-<단계>.png`)은 먼저 넣고, 그 단계의 프레임은 그 그림을 기준으로 맞춥니다.
   - 원본 해시와 검사 결과는 `manifest.json`에 기록합니다.
2. **자동 검사:** 프레임마다 기본 그림과 비교해서 다음 경우에 `확인 필요`를 출력합니다.
   - 발 높이가 4px 넘게 다를 때 (도약·날기 `move`는 제외)
   - 몸 크기가 75~133% 밖일 때
   - 색이 달라 보일 때
   이름이 규칙에 맞지 않거나 캔버스 크기가 다른 파일은 `건너뜀`으로 알려요.
3. 게임 등록 파일 `js/ui/species-frames.js`를 다시 만듭니다. 손으로 고치지 않아요. 그림이 있는 상태는 임시 CSS 움직임이 자동으로 꺼집니다.
4. **눈으로 확인:** `docs/motion-qa.html`에서 프레임을 게임 크기·속도로 돌려 보고, 기본 그림과 겹쳐 봅니다.
5. 실제 게임에서 확인합니다: `tests/motion-ready.browser.cjs`, `tests/grasshopper-hop.browser.cjs`

**용량 목표:** 한 장에 30KB 이하. 지금 기본 이미지 24장은 저장소 기준 약 420KB이고, 71장이 추가되면 전체 약 1.5MB를 예상합니다.
