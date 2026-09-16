import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('worker exports statistics and explicit units without transferring detached arrays',async()=>{
  const messages=[];globalThis.self={postMessage:message=>messages.push(message)};
  await import('../web/worker.mjs');
  const text=await readFile(new URL('../examples/synthetic_plane.xyz',import.meta.url),'utf8');
  const send=(type,payload)=>self.onmessage({data:{type,payload}});
  await send('load',{text,name:'synthetic_plane.xyz'});
  await send('analyze',{manualPitchMm:null,coeffX:1,coeffY:1,sigmaPx:0,correctionOrder:2});
  assert.equal(messages.at(-1).type,'analysis');
  await send('export-summary');assert.equal(messages.at(-1).type,'summary');
  assert.equal(messages.at(-1).payload.statistics.z.count,28);
  assert.match(messages.at(-1).payload.ipdUnit,/not nm/);
  await send('export-csv');assert.equal(messages.at(-1).type,'csv');
  assert.match(messages.at(-1).payload.csv,/ipd_radial,ipd_tangential/);
  delete globalThis.self;
});
