import { eventConfig, discoveryEvents } from '../../data/event-config.js';
const symbols = { alert:'!', question:'?', insight:'💡' };

/** Markers follow existing organism anchors. Rules and mutations stay in systems. */
export function createEventView(state, scene, onAcknowledge, management = {options:()=>[]}) {
  const markers = new Map();
  const dialog = document.querySelector('#event-dialog');
  const title = document.querySelector('#event-title');
  const message = document.querySelector('#event-message');
  const detail = document.querySelector('#event-detail');
  const actions = document.querySelector('#event-actions');
  const result = document.querySelector('#event-result');
  const managementArea = document.createElement('div');
  managementArea.id = 'management-actions';
  actions.after(managementArea);
  let inspected = false, managementSignature = '';
  const fields = ['sunlight','water','air','soil'];
  const environmentAnchors = new Map([...document.querySelectorAll('.abiotic-status>span')].map((node,index)=>[fields[index],node]));
  environmentAnchors.set('forest',document.querySelector('.forest-heading'));
  let openId = null, shownStatus = null;
  function setText(node,text) { if(node.textContent !== text) node.textContent=text; }
  function close() { dialog.close(); openId=null; }
  document.querySelector('#event-close').addEventListener('click',close);
  dialog.addEventListener('close',()=>{openId=null;});
  function button(text, action) {
    const element=document.createElement('button'); element.type='button'; element.textContent=text;
    element.addEventListener('click',action); return element;
  }
  function acknowledge(event, answer) {
    const response=onAcknowledge(event.eventId, answer);
    setText(result,response.message);
    if(response.ok) { shownStatus=event.status; actions.replaceChildren(); detail.hidden=false; }
    render();
  }
  function open(event) {
    inspected=false; managementArea.replaceChildren(); managementSignature='';
    openId=event.eventId; shownStatus=event.status;
    setText(title,`${symbols[event.kind]} ${event.title}`); setText(message,event.message);
    setText(detail,event.explanation); detail.hidden=true; result.textContent=''; actions.replaceChildren();
    actions.append(button(event.kind==='question'?'원인 생각하기':'살펴보기',()=>{
      actions.replaceChildren();
      if(event.kind==='question') {
        for(const choice of event.payload.choices) actions.append(button(choice.label,()=>{const response=onAcknowledge(event.eventId,choice.id);setText(result,response.message);if(response.ok){detail.hidden=false;shownStatus=event.status;actions.replaceChildren();render();}}));
      } else {
        detail.hidden=false;
        inspected=true;
        actions.append(button(event.kind==='insight'?'발견 기록하기':'확인했어요',()=>acknowledge(event)));
        renderManagement(event);
      }
    }));
    dialog.showModal();
  }
  function renderManagement(event) {
    const options = inspected && event?.status==='active' && event.kind==='alert' ? management.options(event.eventId) : [];
    const signature = JSON.stringify([options,state.metrics.points]);
    if (signature===managementSignature) return;
    managementSignature=signature; managementArea.replaceChildren();
    if (options.length) {
      const balance=document.createElement('p');
      balance.textContent=`사용할 수 있는 생태계 포인트: ${state.metrics.points}`;
      managementArea.append(balance);
    }
    for (const action of options) {
      const row=document.createElement('div');
      const control=button(`${action.name} · ${action.cost} 생태계 포인트`,()=>{
        const response=management.execute(action.actionId,event.eventId);
        render();
        setText(result,response.message);
      });
      control.dataset.managementAction=action.actionId;
      // Keep unavailable options readable/tappable so their reason is announced.
      control.setAttribute('aria-disabled',String(!action.available));
      const explanation=document.createElement('p');
      explanation.textContent=action.available?action.description:action.reason;
      row.append(control,explanation); managementArea.append(row);
    }
  }
  function render() {
    const selected=[]; const sources=new Set(); const positions=[];
    const layout=scene.getLayout();
    const active=state.events.filter(event=>event.status==='active').sort((a,b)=>eventConfig.priority[b.kind]-eventConfig.priority[a.kind] || a.createdAt-b.createdAt);
    for(const event of active) {
      if(selected.length>=eventConfig.maxVisible) break;
      const source=`${event.sourceType}:${event.sourceId}`;
      if(sources.has(source))continue;
      const anchor=event.sourceType==='organism'?scene.getEventAnchor(event.sourceId):environmentAnchors.get(event.sourceId);
      if(!anchor)continue;
      if(event.sourceType==='organism') {
        const instance=state.organisms.find(item=>item.instanceId===event.sourceId);
        if(!instance)continue;
        const position={x:instance.position.x*layout.width,y:instance.position.y*layout.height-layout.sizes[instance.speciesId].height-22};
        if(positions.some(point=>Math.abs(point.x-position.x)<48&&Math.abs(point.y-position.y)<48))continue;
        positions.push(position);
      }
      selected.push({event,anchor}); sources.add(source);
    }
    const visibleIds=new Set(selected.map(item=>item.event.eventId));
    for(const [id,entry] of markers) if(!visibleIds.has(id)){entry.node.remove();markers.delete(id);}
    for(const {event,anchor} of selected) {
      let entry=markers.get(event.eventId);
      if(!entry) {
        const node=button(symbols[event.kind],()=>open(event));
        node.className=`event-marker event-${event.kind}`; node.dataset.eventMarker=event.eventId;
        node.setAttribute('aria-label',`${event.kind==='insight'?'발견':event.kind==='question'?'조사':'알림'}: ${event.title}`);
        node.addEventListener('click',e=>e.stopPropagation());
        node.addEventListener('pointerdown',e=>e.stopPropagation());
        entry={node}; markers.set(event.eventId,entry);
      }
      if(entry.node.parentElement!==anchor)anchor.append(entry.node);
    }
    if(openId) {
      const event=state.events.find(item=>item.eventId===openId);
      if(!event||event.status!==shownStatus){shownStatus=event?.status;actions.replaceChildren();setText(result,'상황이 달라졌어요. 문제가 해결되었거나 생물이 숲에서 사라졌어요.');}
      renderManagement(event);
    }
    const records=state.observations.map(item=>discoveryEvents[item.relationId]?.title).filter(Boolean);
    setText(document.querySelector('#observation-count'),String(records.length));
    const list=document.querySelector('#observation-records');
    const signature=records.join('|');
    if(list.dataset.signature!==signature){list.dataset.signature=signature;list.replaceChildren();for(const text of records){const item=document.createElement('li');item.textContent=text;list.append(item);}if(!records.length){const item=document.createElement('li');item.textContent='💡를 눌러 발견을 기록해 보세요.';list.append(item);}}
  }
  document.querySelector('#observations-open').addEventListener('click',()=>document.querySelector('#observations-dialog').showModal());
  document.querySelector('#observations-close').addEventListener('click',()=>document.querySelector('#observations-dialog').close());
  window.addEventListener('resize',render);
  return {render,reset() { if(dialog.open)dialog.close();openId=null;shownStatus=null;inspected=false;managementSignature='';managementArea.replaceChildren();for(const entry of markers.values())entry.node.remove();markers.clear();render(); }};
}
