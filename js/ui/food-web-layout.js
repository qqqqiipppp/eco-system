// A local view of a directed graph, not a trophic hierarchy or food preference.
export function focusLayout(relations,focus){
 const foods=[...new Set(relations.filter(r=>r.targetSpeciesId===focus).map(r=>r.sourceSpeciesId))];
 const predators=[...new Set(relations.filter(r=>r.sourceSpeciesId===focus).map(r=>r.targetSpeciesId))];
 const height=Math.max(320,Math.max(foods.length,predators.length)*132+60),width=780;
 const node=(id,x,y,side)=>({id,x,y,side,width:156,height:116});
 const nodes=[node(focus,390,height/2,'focus'),...foods.map((id,i)=>node(id,94,(i+.5)*height/foods.length,'food')),...predators.map((id,i)=>node(id,686,(i+.5)*height/predators.length,'predator'))];
 const byId=new Map(nodes.map(n=>[n.id,n]));
 // Separate attachment points keep converging arrowheads distinguishable.
 const port=(ids,id)=>ids.length<2?0:(ids.indexOf(id)/(ids.length-1)-.5)*64;
 const edges=relations.filter(r=>r.sourceSpeciesId===focus||r.targetSpeciesId===focus).map(r=>{
  const from=byId.get(r.sourceSpeciesId),to=byId.get(r.targetSpeciesId),x1=from.x+from.width/2+5,x2=to.x-to.width/2-11,middle=(x1+x2)/2;
  const y1=from.y+(from.id===focus?port(predators,to.id):0),y2=to.y+(to.id===focus?port(foods,from.id):0);
  return {id:r.relationId,source:r.sourceSpeciesId,target:r.targetSpeciesId,path:`M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`};
 });
 return {width,height,nodes,edges};
}
export function followChain(path,from,to,relations){
 if(!relations.some(r=>r.sourceSpeciesId===from&&r.targetSpeciesId===to))return [...path];
 if(path.at(-1)===from&&!path.includes(to))return [...path,to];
 if(path[0]===to&&!path.includes(from))return [from,...path];
 return [from,to];
}
