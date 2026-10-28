// Coordinates describe the forest picture (assets/images/backgrounds/forest-b.webp,
// 2400 x 940, drawn at the same 1200 x 470 logical size as the old forest.svg),
// not food, living trees or newly drawn branches. They only place pictures;
// model.position, food distances and habitat rules are untouched.
export const forestArtwork={width:1200,height:470,source:'assets/images/backgrounds/forest-b.webp'};
// Planting baseline: on the light earth band of the picture (y 292-350),
// above the dark soil. Unchanged from the old art; checked against the new one.
const groundContour=[[0,340],[.275,321],[.532,306],[.788,318],[1,325]];
export function forestGroundHeight(x){
 for(let i=1;i<groundContour.length;i++)if(x<=groundContour[i][0]){const [ax,ay]=groundContour[i-1],[bx,by]=groundContour[i];return (ay+(by-ay)*(x-ax)/(bx-ax))/forestArtwork.height;}
 return groundContour.at(-1)[1]/forestArtwork.height;
}
export const backgroundHabitatSpaces=[
 // The three foreground trees of the picture: a forked crown and the visible
 // trunk below the fork, measured on the 1200 x 470 grid.
 {id:'left-crown',object:'tree-b-left',zone:'canopy',x:300,y:172,rx:50,ry:22,capacity:2,priority:5},
 {id:'middle-crown',object:'tree-b-middle',zone:'canopy',x:690,y:200,rx:36,ry:18,capacity:2,priority:5},
 {id:'right-crown',object:'tree-b-right',zone:'canopy',x:1135,y:168,rx:28,ry:22,capacity:2,priority:5},
 {id:'left-trunk',object:'tree-b-left',zone:'trunk',x:318,y:222,rx:10,ry:14,capacity:2,priority:5},
 {id:'middle-trunk',object:'tree-b-middle',zone:'trunk',x:690,y:232,rx:9,ry:14,capacity:2,priority:5},
 {id:'right-trunk',object:'tree-b-right',zone:'trunk',x:1148,y:220,rx:9,ry:14,capacity:2,priority:5},
 // The picture has earth, soil and roots, but no dead log, visible web or pond.
 {id:'grass-band',object:'grass-484-521-551-1075',zone:'understory',x:600,y:329,rx:550,ry:18,capacity:8,priority:1},
 {id:'ground-band',object:'soil-surface',zone:'ground',x:600,y:344,rx:550,ry:23,capacity:30,priority:0},
 {id:'surface-litter',object:'soil-surface',zone:'leaf_litter',x:600,y:347,rx:550,ry:12,capacity:8,priority:2},
 {id:'low-ground',object:'soil-cutaway',zone:'leaf_litter',x:600,y:387,rx:550,ry:20,capacity:10,priority:2},
];
// Objects drawn on the earth band in chapter mode from chapter 3 (나무 아래) on.
// The fallen log is dead wood: cloud mushrooms rest on it (display only; their
// shared decomposition work is not tied to a place).
export const logSpace={id:'fallen-log',object:'log-b',zone:'dead_wood',x:880,y:322,rx:40,ry:4,capacity:3,priority:6};
export const sceneSpaces={log:false};
