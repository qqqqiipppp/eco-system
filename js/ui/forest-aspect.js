// The forest picture is drawn stretched to fill the scene box (object-fit:
// fill), and every organism and habitat anchor is placed by fractions of that
// box, so picture and organisms always line up. On wide, short screens that
// stretch flattens the forest; capping the box at 3x its height (the art is
// 2.55:1) keeps the stretch under 18%. The box shrinks as a whole and stays
// centred, so nothing moves relative to the picture. Chapter mode only: the
// regular forest holds up to 30 organisms and needs the full width.
export const maxForestAspect=3;
export function capForestAspect(forest,ratio=maxForestAspect){
 const apply=()=>{const h=forest.getBoundingClientRect().height;if(!h)return;const max=`${Math.round(h*ratio)}px`;if(forest.style.maxWidth!==max)forest.style.maxWidth=max;};
 new ResizeObserver(apply).observe(forest);apply();
}
