'use strict';
// Guard against Netlify's SPA rewrite returning index.html for a missing module.
// Validate every same-origin static ES-module dependency reachable from index.html.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');

const root=path.resolve('site');
const page=path.join(root,'index.html');
const html=fs.readFileSync(page,'utf8');
const moduleScripts=[...html.matchAll(/<script\b(?=[^>]*\btype=["']module["'])[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1]);
assert(moduleScripts.length>=3,'Expected HuntSmart auth, billing and partners module entrypoints');

const seen=new Set();
function check(spec,parent='/index.html') {
  if(/^(?:https?:)?\/\//i.test(spec))return;
  if(!/^(?:\.{1,2}\/|\/)/.test(spec))return; // CDN/bare-package imports
  const resolved=new URL(spec,new URL(parent,'https://huntsmartcanada.ca'));
  assert.equal(resolved.origin,'https://huntsmartcanada.ca','Unexpected module origin');
  const relative=decodeURIComponent(resolved.pathname).replace(/^\/+/,'');
  const file=path.resolve(root,relative);
  assert(file.startsWith(root+path.sep),'Module import escapes the output site: '+spec);
  assert(fs.existsSync(file),'Missing published module: '+resolved.pathname+' imported from '+parent);
  assert(fs.statSync(file).isFile(),'Module target is not a file: '+file);
  if(seen.has(resolved.pathname))return;
  seen.add(resolved.pathname);
  const source=fs.readFileSync(file,'utf8');
  assert(!/^\s*(?:<!doctype|<html)\b/i.test(source),'HTML served instead of a JavaScript module: '+relative);
  const syntax=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});
  assert.equal(syntax.status,0,'Invalid JavaScript module '+relative+': '+syntax.stderr);
  // Static import and re-export statements (including multiline named imports).
  const staticImports=/^\s*(?:import|export)\s+(?:[^;]*?\s+from\s*)?["']([^"']+)["']/gm;
  for(const match of source.matchAll(staticImports))check(match[1],resolved.pathname);
}
for(const entry of moduleScripts)check(entry);
assert(seen.has('/billing-config.js'),'Billing module is absent from the public import graph');
console.log('Public ES modules valid:',[...seen].sort().join(', '));