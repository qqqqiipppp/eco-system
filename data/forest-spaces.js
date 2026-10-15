// Coordinates describe existing forest.svg (viewBox 1200 x 470), not food,
// living trees or newly drawn branches. Stage16 may replace this provider data.
export const forestArtwork={width:1200,height:470,source:'assets/images/forest.svg'};
// Approximate contact points sampled from the existing green soil-surface path.
// This bends the view's planting baseline only; model.position is untouched.
const groundContour=[[0,340],[.275,321],[.532,306],[.788,318],[1,325]];
export function forestGroundHeight(x){
 for(let i=1;i<groundContour.length;i++)if(x<=groundContour[i][0]){const [ax,ay]=groundContour[i-1],[bx,by]=groundContour[i];return (ay+(by-ay)*(x-ax)/(bx-ax))/forestArtwork.height;}
 return groundContour.at(-1)[1]/forestArtwork.height;
}
export const backgroundHabitatSpaces=[
 {id:'left-crown',object:'tree-292-325',zone:'canopy',x:292,y:190,rx:64,ry:36,capacity:2,priority:5},
 {id:'middle-crown',object:'tree-673-310',zone:'canopy',x:673,y:215,rx:52,ry:30,capacity:2,priority:5},
 {id:'left-trunk',object:'tree-292-325',zone:'trunk',x:292,y:282,rx:19,ry:30,capacity:2,priority:5},
 {id:'middle-trunk',object:'tree-673-310',zone:'trunk',x:673,y:278,rx:17,ry:23,capacity:2,priority:5},
 // The SVG has soil and roots, but no dead log, visible web or pond.
 {id:'grass-band',object:'grass-484-521-551',zone:'understory',x:510,y:321,rx:420,ry:18,capacity:8,priority:1},
 {id:'ground-band',object:'soil-surface',zone:'ground',x:540,y:344,rx:440,ry:23,capacity:30,priority:0},
 {id:'surface-litter',object:'soil-surface',zone:'leaf_litter',x:535,y:347,rx:420,ry:12,capacity:8,priority:2},
 {id:'low-ground',object:'soil-cutaway',zone:'leaf_litter',x:535,y:387,rx:420,ry:20,capacity:10,priority:2},
];
