import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const context=vm.createContext({});
vm.runInContext(await readFile(new URL('./album-change-state.js',import.meta.url),'utf8'),context);
const {snapshot}=context.AlbumChangeState;
const album={title:'Book',ratio:'4:3',landscape:false,material:'none',texture:0,pages:[{id:'a',src:'/a.jpg',crop:{x:0,y:0,zoom:1}},{id:'b',src:'/b.jpg'}]};
test('ignores delivery metadata and key ordering, not content',()=>{
 assert.equal(snapshot(album),snapshot({...album,status:'needs_update',updatedAt:'later',shareUrl:'new'}));
 assert.notEqual(snapshot(album),snapshot({...album,title:'Changed'}));
 assert.notEqual(snapshot(album),snapshot({...album,pages:[...album.pages].reverse()}));
 assert.notEqual(snapshot(album),snapshot({...album,pages:[{...album.pages[0],crop:{x:10,y:0,zoom:1}},album.pages[1]]}));
});
test('restored settings and inactive effect values are not effective edits',()=>{
 const changed={...album,material:'linen',texture:8};
 assert.notEqual(snapshot(album,true),snapshot(changed,true));
 assert.equal(snapshot(album,true),snapshot({...changed,material:'none'},true));
 assert.notEqual(snapshot(album),snapshot({...changed,material:'none'}));
});
test('inactive new presentation controls do not cause leave prompts',()=>{
 const base={...album,aging:0,agingStyle:'natural',materialScope:'all',gloss:45,lighting:'none',lightIntensity:50,lightDirection:0,lightTemperature:5500};
 assert.equal(snapshot(base,true),snapshot({...base,agingStyle:'damaged',materialScope:'cover',gloss:90,lightDirection:60,lightTemperature:3000},true));
 assert.equal(snapshot(base,true),snapshot({...base,aging:25},true));
 assert.notEqual(snapshot(base,true),snapshot({...base,shadowSoftness:80},true));
});
