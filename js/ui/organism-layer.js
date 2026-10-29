import {createHabitatPresentation} from '../systems/habitat-presentation.js';
import {speciesHabitats} from '../../data/habitats.js';
import { organismById } from '../../data/organisms.js';
import { speciesProfiles } from '../../data/interaction-config.js';
import { DEBUG_MODE, foodResourceConfig, feedingConfig } from '../../data/ecology-config.js';
import {survivalStage} from '../systems/population.js';
import {developmentStage,stageLabel} from '../systems/development.js';
import {visualAsset,createVisualTracker} from './species-visuals.js';

// Short teaching labels fit the existing placeholder footprints.
const youngNames={grass:{sprout:'강아지풀 새싹',grown:'자란 강아지풀'},grasshopper:{nymph:'방아깨비 약충'},rabbit:{baby:'새끼 멧토끼',juvenile:'어린 멧토끼'},mushroom:{mycelium:'버섯 균사체','spore-ready':'버섯 포자 준비'}};

/** DOM adapter: creates each organism once and paints positions using transforms.
 * Geometry reads happen only on resize or input, never in the update loop.
 */
export function createOrganismLayer(forest, getOrganisms) {
  const layer = forest.querySelector('#organism-layer');
  const surface = forest.querySelector('#placement-surface');
  const cursor = forest.querySelector('#placement-cursor');
  const feedback = forest.querySelector('#placement-feedback');
  const namesToggle=forest.querySelector('#names-toggle');
  const nodes = new Map();
  const highlights=new Map();
  const visuals=createVisualTracker();
  let layout;
  const habitat=createHabitatPresentation();
  let membership='',inspectHandler=()=>{},focusedId=null,placingSpeciesId=null;
  let ambushTargets=new Set();
  function refreshHabitats(force=false){
    const items=getOrganisms(),signature=items.map(o=>o.instanceId).sort().join('|');
    if(force||signature!==membership){membership=signature;habitat.rebuild(items,layout);for(const o of items)paint(o);}
  }
  let feedbackTimer;
  let keyboardPosition = { x: 0.4, y: 0.72 };

  function paint(instance, direction) {
    const entry = nodes.get(instance.instanceId);
    if (!entry || !layout) return;
    const point=habitat.position(instance),descriptor=habitat.descriptor(instance.instanceId);
    entry.point=point;
    entry.anchor.style.transform = `translate(${point.x}px, ${point.y}px)`;
    entry.anchor.dataset.habitat=speciesHabitats[instance.speciesId].primary;
    entry.anchor.dataset.movement=speciesHabitats[instance.speciesId].movement;
    entry.anchor.dataset.anchorId=descriptor?.anchorId||'';
    entry.anchor.dataset.anchorFallback=String(descriptor?.fallback??false);
    entry.anchor.style.zIndex=String(2+Math.round(point.y/layout.height*12));
    if (direction) entry.image.style.setProperty('--facing',direction);
  }
  function measure() {
    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const footprints = {};
    const sizes = {};
    // Preserve normalized anchors on rotation; shrink only placeholder artwork
    // on narrow screens so even a left-edge tree remains within the scene.
    const scale = Math.min(1, rect.width / 560);
    for (const [id, profile] of Object.entries(speciesProfiles)) {
      sizes[id] = { width: profile.width * scale, height: profile.height * scale };
      footprints[id] = { halfWidth: sizes[id].width / 2 / rect.width, above: sizes[id].height / rect.height, below: profile.labelHeight / rect.height };
    }
    const blockedRects = [...forest.querySelectorAll('[data-scene-ui]')].filter(element => element.getClientRects().length).map(element => {
      const box = element.getBoundingClientRect();
      return { left: (box.left - rect.left) / rect.width, right: (box.right - rect.left) / rect.width, top: (box.top - rect.top) / rect.height, bottom: (box.bottom - rect.top) / rect.height };
    });
    // Keep ecological geometry unchanged. The new view-only control is only
    // an obstacle for drawing, never a new physical placement/feeding rule.
    const visualBlockedRects=[...blockedRects,...[...forest.querySelectorAll('[data-presentation-ui]')].map(element=>{const box=element.getBoundingClientRect();return {left:(box.left-rect.left)/rect.width,right:(box.right-rect.left)/rect.width,top:(box.top-rect.top)/rect.height,bottom:(box.bottom-rect.top)/rect.height};})];
    layout = { width: rect.width, height: rect.height, sizes, footprints, blockedRects,visualBlockedRects };
    refreshHabitats(true);
    for (const instance of getOrganisms()) {
      const entry = nodes.get(instance.instanceId);
      if (entry) sizeObject(entry.anchor, instance.speciesId);
      paint(instance);
    }
  }
  // View-only hop (adult grasshopper): the picture rises and falls above the
  // model's point and, on the ground, waits while the model point moves on,
  // then catches up in the air. The model position, the name and the touch
  // target never move; the offset is bounded and returns to zero on landing.
  function paintHop(entry,hop){
    const point=entry.point;if(!point)return;
    const last=entry.hopPoint||point,dx=point.x-last.x,dy=point.y-last.y;entry.hopPoint={x:point.x,y:point.y};
    let off=entry.hopOffset||{x:0,y:0};
    if(hop?.phase==='air'){entry.hopLaunch??={x:off.x-dx,y:off.y-dy};off={x:entry.hopLaunch.x*(1-hop.air),y:entry.hopLaunch.y*(1-hop.air)};}
    else{entry.hopLaunch=null;off=hop?{x:off.x-dx,y:off.y-dy}:{x:off.x*.5,y:off.y*.5};}
    const limit=(layout?.sizes[entry.anchor.dataset.speciesId]?.width||40)*.8,size=Math.hypot(off.x,off.y);
    if(size>limit)off={x:off.x*limit/size,y:off.y*limit/size};
    if(!hop&&size<.3)off=null;
    entry.hopOffset=off;
    const style=entry.image.style,x=(off?.x||0).toFixed(1)+'px',y=(off?.y||0).toFixed(1)+'px',lift=(hop?.lift||0).toFixed(3);
    if(style.getPropertyValue('--hop-x')!==x)style.setProperty('--hop-x',x);
    if(style.getPropertyValue('--hop-y')!==y)style.setProperty('--hop-y',y);
    if(style.getPropertyValue('--hop-lift')!==lift)style.setProperty('--hop-lift',lift);
    entry.anchor.classList.toggle('is-hopping',Boolean(hop&&hop.lift>0));
  }
  function sizeObject(anchor, speciesId) {
    const size = layout.sizes[speciesId];
    anchor.style.setProperty('--sprite-width', `${size.width}px`);
    anchor.style.setProperty('--sprite-height', `${size.height}px`);
  }
  function add(instance, animate = false) {
    if (nodes.has(instance.instanceId)) return;
    refreshHabitats();
    const definition = organismById[instance.speciesId];
    const anchor = document.createElement('div');
    anchor.className = 'organism-object';
    if(animate){anchor.classList.add('is-newly-placed');highlights.set(instance.instanceId,setTimeout(()=>{anchor.classList.remove('is-newly-placed');highlights.delete(instance.instanceId);},3500));}
    anchor.dataset.instanceId = instance.instanceId;
    anchor.dataset.speciesId = instance.speciesId;
    sizeObject(anchor, instance.speciesId);
    const visual = document.createElement('div');
    visual.className = `organism-visual${animate ? ' organism-enter' : ''}`;
    const image = document.createElement('img');
    image.className='organism-art';
    {
      image.src = visualAsset(instance.speciesId);
      image.alt = '';
      image.draggable = false;
    }
    const name = document.createElement('span');
    name.className = 'organism-name';
    name.setAttribute('aria-hidden','true');
    name.textContent = definition.name;
    visual.append(image, name);
    const hit=document.createElement('button');hit.type='button';hit.className='organism-hit';hit.dataset.inspectInstance=instance.instanceId;
    hit.setAttribute('aria-label',`${definition.name} ${getOrganisms().filter(o=>o.speciesId===instance.speciesId).findIndex(o=>o.instanceId===instance.instanceId)+1}번째 개체 살펴보기`);hit.setAttribute('aria-pressed','false');
    anchor.append(visual,hit);
    layer.append(anchor);
    let debug;
    if (DEBUG_MODE) {
      debug = document.createElement('span');
      debug.className = 'organism-debug';
      debug.append(document.createTextNode(''));
      visual.append(debug);
    }
    nodes.set(instance.instanceId, { anchor, image, name, debug, hit });
    paint(instance);
    showState(instance);
  }
  function showState(instance) {
    const entry = nodes.get(instance.instanceId);
    if (!entry) return;
    const stage=developmentStage(instance);
    if(entry.stage!==stage){
      entry.stage=stage;
      if(stage){entry.anchor.dataset.developmentStage=stage;entry.name.textContent=youngNames[instance.speciesId]?.[stage]||organismById[instance.speciesId].name;entry.name.title=`${organismById[instance.speciesId].name} · ${stageLabel(instance)}`;}
      else{delete entry.anchor.dataset.developmentStage;entry.name.textContent=organismById[instance.speciesId].name;entry.name.removeAttribute('title');}
    }
    if (instance.growth !== undefined && entry.growth !== instance.growth) {
      entry.image.style.setProperty('--growth',0.65 + instance.growth * 0.35);
      entry.image.style.transformOrigin = '50% 100%';
      entry.growth = instance.growth;
    }
    const eating = instance.behaviorState === 'eat';
    const survival=survivalStage(instance);if(entry.survival!==survival){entry.anchor.dataset.survival=survival;entry.survival=survival;}
    const depleted = foodResourceConfig[instance.speciesId] && instance.foodStock < foodResourceConfig[instance.speciesId].portion;
    if (entry.eating !== eating) { entry.anchor.classList.toggle('is-eating', eating); entry.eating = eating; }
    if (entry.depleted !== Boolean(depleted)) { entry.anchor.classList.toggle('is-depleted', Boolean(depleted)); entry.depleted = Boolean(depleted); }
    if (DEBUG_MODE) {
      const text = `${instance.instanceId} / ${instance.speciesId}\n${instance.behaviorState || 'static'} → ${instance.targetInstanceId || '-'}\nhunger:${instance.hunger?.toFixed(2) ?? '-'} stock:${instance.foodStock?.toFixed(2) ?? '-'}`;
      if (entry.debug.firstChild.data !== text) entry.debug.firstChild.data = text;
    }
  }
  function remove(instanceIds) {
    for (const id of instanceIds) { clearTimeout(highlights.get(id));highlights.delete(id);nodes.get(id)?.anchor.remove(); nodes.delete(id); }
    if(instanceIds.includes(focusedId))setFocused(null);
    if(layout)refreshHabitats();
  }
  function showSelection(speciesId) {
    placingSpeciesId=speciesId;
    const profile = speciesProfiles[speciesId];
    if(profile)setFocused(null);
    forest.classList.toggle('is-placing', Boolean(profile));
    if (!profile) {
      cursor.hidden = true;
      surface.setAttribute('aria-label', '숲 배치 영역. 먼저 아래에서 생물 카드를 선택하세요.');
      return;
    }
    surface.setAttribute('aria-label', `${organismById[speciesId].name} 놓기. 숲 어디든 누르면 가까운 알맞은 자리를 찾아요. 방향키와 Enter 키로도 배치할 수 있어요.`);
  }
  function showFeedback(message, ok) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.result = ok ? 'success' : 'error';
    feedback.hidden = false;
    feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 2800);
  }
  function readInput(event) {
    const rect = surface.getBoundingClientRect();
    const raw = event.detail === 0 ? { ...keyboardPosition } : { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
    const isUI=Boolean(event.target.closest('[data-scene-ui],[data-presentation-ui],[data-event-marker],button:not(#placement-surface),a,input,select,textarea,summary,[role="button"]'));
    return { position:raw, isPlayArea: forest.contains(event.target), isUI };
  }
  function moveCursor(event) {
    const steps = { ArrowLeft: [-0.025, 0], ArrowRight: [0.025, 0], ArrowUp: [0, -0.025], ArrowDown: [0, 0.025] };
    if (!steps[event.key]) return;
    event.preventDefault();
    const [dx, dy] = steps[event.key];
    keyboardPosition = { x: Math.max(0, Math.min(1, keyboardPosition.x + dx)), y: Math.max(0, Math.min(1, keyboardPosition.y + dy)) };
    cursor.hidden = false;
    cursor.style.left = `${keyboardPosition.x * 100}%`;
    cursor.style.top = `${keyboardPosition.y * 100}%`;
  }
  function setFocused(id){
    focusedId=nodes.has(id)?id:null;
    for(const [key,entry]of nodes){entry.anchor.classList.toggle('is-inspected',key===focusedId);entry.hit.setAttribute('aria-pressed',String(key===focusedId));}
  }
  function toggleNames(event){event.stopPropagation();const visible=namesToggle.getAttribute('aria-pressed')!=='true';namesToggle.setAttribute('aria-pressed',String(visible));layer.classList.toggle('show-names',visible);}
  namesToggle.addEventListener('click',toggleNames);
  function inspectInput(event){
    if(event.target.closest('[data-event-marker],[data-scene-ui],[data-presentation-ui]'))return false;
    const exact=event.target.closest('[data-inspect-instance]');
    if(forest.classList.contains('is-placing')&&!exact)return false;
    let ids;
    if(event.detail===0&&exact)ids=[exact.dataset.inspectInstance];
    else {
      const rect=surface.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
      ids=[...nodes.entries()].filter(([,e])=>{if(!e.point)return false;const size=layout.sizes[e.anchor.dataset.speciesId],w=Math.max(48,size.width),h=Math.max(48,size.height+20);return x>=e.point.x-w/2&&x<=e.point.x+w/2&&y>=e.point.y-size.height&&y<=e.point.y-size.height+h;}).sort(([a,ea],[b,eb])=>Math.hypot(ea.point.x-x,ea.point.y-y)-Math.hypot(eb.point.x-x,eb.point.y-y)||a.localeCompare(b,'en')).map(([id])=>id);
    }
    if(!ids.length){setFocused(null);return false;}
    event.preventDefault();event.stopImmediatePropagation();inspectHandler(ids);return true;
  }
  forest.addEventListener('click',inspectInput);
  surface.addEventListener('keydown', moveCursor);
  surface.addEventListener('pointerdown', () => { cursor.hidden = true; });
  const observer = new ResizeObserver(measure);
  observer.observe(forest);
  window.addEventListener('resize', measure);
  measure();
  return {
    add, remove, showSelection, showFeedback, readInput,
    setInspectHandler:handler=>{inspectHandler=handler;},setFocused,
    getPresentation:instance=>habitat.position(instance),getHabitatDiagnostics:()=>habitat.diagnostics(),
    reset() { visuals.reset();focusedId=null;membership='';remove([...nodes.keys()]); clearTimeout(feedbackTimer); feedback.hidden=true; keyboardPosition={x:0.4,y:0.72}; namesToggle.setAttribute('aria-pressed','false');layer.classList.remove('show-names');showSelection(null); },
    paintVisuals: (state,delta,work)=>{for(const frame of visuals.sample(state,delta,work)){const entry=nodes.get(frame.instanceId);if(!entry)continue;if(entry.facing!==frame.facing){entry.image.style.setProperty('--facing',frame.facing);entry.facing=frame.facing;}const key=frame.src+'|'+frame.motion+'|'+frame.frame;if(entry.visualKey!==key){entry.visualKey=key;entry.anchor.dataset.visualState=frame.motion;entry.anchor.dataset.visualFrame=frame.frame;if(entry.image.getAttribute('src')!==frame.src)entry.image.src=frame.src;}if(frame.hop||entry.hopOffset)paintHop(entry,frame.hop);}},
    showStates: instances => {
      const nextTargets=new Set(instances.filter(o=>feedingConfig[o.speciesId]?.huntMode==='ambush'&&['moveToFood','eat'].includes(o.behaviorState)).map(o=>o.targetInstanceId).filter(Boolean));
      for (const instance of instances) {
        showState(instance);
        // Stationary prey may have no movement delta to repaint. Entering or
        // leaving ambush contact still needs a view-only position update.
        if(nextTargets.has(instance.instanceId)||ambushTargets.has(instance.instanceId))paint(instance);
      }
      ambushTargets=nextTargets;
    },
    getLayout: () => layout,
    getEventAnchor: instanceId => nodes.get(instanceId)?.anchor,
    paintChanges: changed => { for (const { instance, direction } of changed) paint(instance, direction); },
    dispose() { forest.removeEventListener('click',inspectInput);namesToggle.removeEventListener('click',toggleNames);observer.disconnect(); window.removeEventListener('resize', measure); clearTimeout(feedbackTimer); },
  };
}
