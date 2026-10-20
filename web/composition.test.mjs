import test from 'node:test';
import assert from 'node:assert/strict';
await import('./album/composition.js');
const { geometry, normalize, ratio } = globalThis.PageComposition;

test('cover crop never exposes an empty edge, including extreme offsets', () => {
  for (const [iw,ih] of [[3000,2000],[1000,4000],[2000,2000]]) {
    for (const zoom of [1,1.8,4]) for (const x of [-1,0,1]) for (const y of [-1,0,1]) {
      const g = geometry(iw,ih,480,640,{fit:'cover',zoom,x,y});
      assert.ok(g.left <= 1e-8 && g.top <= 1e-8);
      assert.ok(g.left+g.width >= 480-1e-8 && g.top+g.height >= 640-1e-8);
    }
  }
});
test('contain preserves complete artwork and zoom remains independent from camera zoom', () => {
  assert.deepEqual(geometry(3000,2000,480,640,{fit:'contain',zoom:1,x:0,y:0}), {width:480,height:320,left:0,top:160});
  assert.deepEqual(normalize({fit:'cover',zoom:.25,x:5,y:-9}),{fit:'cover',zoom:1,x:1,y:-1});
  assert.deepEqual(ratio({ratio:'4:3',landscape:false}),[3,4]);
  assert.deepEqual(ratio({ratio:'custom',customWidth:2,customHeight:5,landscape:true}),[5,2]);
});
