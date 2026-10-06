# 2단계 완료 보고

## 1. 수정/추가한 파일 목록

수정: `index.html`, `data/organisms.js`, `data/forest.js`, `js/main.js`, `js/ui/render.js`, `README.md`, `ARCHITECTURE.md`, `QA.md`.

추가: `data/interaction-config.js`, `js/systems/placement.js`, `js/systems/wander.js`, `js/systems/update-loop.js`, `js/ui/organism-layer.js`, `css/placement.css`, `tests/logic.test.mjs`, `tests/browser.test.cjs`, `STAGE2_REPORT.md`.

기존 `js/state/game-state.js`, `css/base.css`, `css/game.css`, SVG 6개, 오디오 공간, `.nojekyll`은 유지했습니다. 전달용 `forest-ecosystem.zip`을 갱신했습니다.

## 2. 기존 파일 변경 이유

- index: 별도 입력 면·생물 레이어·배치 영역·피드백 추가. 정적 나무/풀 라벨은 실제 개체 이름표로 대체.
- organisms: 참나무 표시 이름을 상수리나무로 변경. 내부 ID oak와 이미지 경로 유지.
- forest: 초기 나무 좌표를 지면 영역에 맞춤. 배경은 장식, 실제 인스턴스는 별도 레이어라는 책임 명시.
- main: 카드 선택/배치/루프/렌더러 연결. UI가 배치 규칙을 계산하지 않음.
- render: 선택 유지와 명확한 강조, 배치 안내로 문구 갱신.
- 문서: 1단계 설명을 실제 2단계 동작과 검증 결과에 맞게 갱신.

## 3. 카드 선택 흐름

획득 카드 표시 → 터치로 speciesId 선택 → 굵은 테두리와 ‘✓ 선택’ → 숲 위치 터치. 선택은 배치 후에도 유지되고 카드는 소모되지 않습니다. 작은 배치 버튼이나 드래그를 추가하지 않았습니다.

## 4. 배치 검증 방식

placement.validatePlacement가 선택·획득 권한·플레이 영역·UI 대상·0~1 유한 좌표·유형별 지면/활동 영역·이미지 전체 경계·UI 겹침·큰 식물 간격·30개 상한을 확인합니다. 서식 조건이나 물리 엔진은 없습니다.

## 5. organisms 인스턴스 생성

placement.placeOrganism 성공 시 `{ instanceId, speciesId, position: { x, y } }`를 한 개 추가합니다. 기존 ID와 중복하지 않는 ID를 생성하며, 같은 종을 여러 번 배치할 수 있습니다. schemaVersion=1과 상태 계약은 유지합니다.

## 6. 생물 렌더링

organism-layer.add에서 카드와 독립적인 개체 DOM을 생성합니다. 기존 이미지와 이름표를 조합하며, instanceId로 노드를 기억합니다. 좌표는 표시할 때만 픽셀로 변환합니다. 회전 시 상태 좌표를 유지하고 화면 측정치와 임시 이미지 크기만 갱신합니다.

## 7. 동물 wander

토끼만 랜덤한 방향으로 천천히 걷기/멈추기를 반복합니다. 경계를 만나면 방향을 바꾸고 이미지에만 좌우 반전을 적용합니다. 식물과 버섯은 고정입니다. 이동 타이밍은 wander 내부 Map에 두며, 생태 AI·먹이·포식·도망·번식·사망은 없습니다.

## 8. 성능 고려

공통 requestAnimationFrame 하나와 최대 30회/초 갱신, 최대 dt 제한, 숨김/움직임 줄이기 중단, 변경된 개체 transform만 갱신합니다. 배치 때만 DOM을 추가하고 프레임 안에서 레이아웃을 측정하지 않습니다. 30개 검사에서 자식 DOM 변경 0회·이동 중 크기 측정 0회·동시 프레임 예약 최대 1개를 확인했습니다.

## 9. 현재 placeholder

기존 forest.svg와 oak/grass/rabbit/mushroom.svg를 그대로 재사용합니다. 모든 생물 이미지는 임시이며 이름표로 구별합니다. 배경의 나무/풀은 장식으로 남아 실제 개체에 포함되지 않습니다. 신규 이미지 생성·파일 제작·스타일 통일·배경 리디자인은 하지 않았습니다.

## 10. Galaxy Tab S5e 직접 확인

실기기 터치, 카드 글자 크기, 브라우저 주소창/화면 회전, 30개 상태의 움직임·발열, 앱 전환 후 복귀를 확인해야 합니다. 데스크톱 브라우저 검사만 완료했으며 실기기 FPS는 확인하지 않았습니다. QA.md에 상세 확인표를 남겼습니다.

## 11. 다음 단계의 정확한 연결 지점

`js/main.js`의 `createUpdateLoop`에 전달하는 **update 콜백**입니다. 다음 단계의 상호작용 system을 wander.update 다음, paintChanges 이전에 연결합니다. 생물 관계 정의는 data, 규칙 계산은 system, 상태 변경은 gameState, 표시 변경은 organism-layer에 맡깁니다. 승인되지 않은 상호작용 모듈이나 빈 모듈은 만들지 않았습니다.
