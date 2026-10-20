import {readdir,readFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const machinePath=new RegExp(String.raw`(?:[A-Z]:[\\/](?:Users[\\/][^\\/\s"']+|CUBID)|`+'/'+'Users/'+String.raw`[^/\s"']+)`,'i');
export async function audit(directory,{packaged=false}={}){
 const violations=[],manifest=[];
 async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const absolute=path.join(folder,entry.name),relative=path.relative(directory,absolute).split(path.sep).join('/');
  if((await lstat(absolute)).isSymbolicLink()){violations.push({file:relative,rule:'symbolic-link'});continue;}
  if(entry.isDirectory()){
   if(/(^|\/)(?:data|\.git|\.private|backups|logs|node_modules|output|ai-jobs|project-trash)(?:\/|$)/i.test(relative))violations.push({file:relative,rule:'private-directory'});
   await walk(absolute);continue;
  }
  const raw=await readFile(absolute);manifest.push({file:relative,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
  if(/(?:\.env(?:\.|$)|studio-settings\.json|window-state\.json|分享信息|api[-_]?key\.txt)/i.test(entry.name))violations.push({file:relative,rule:'private-file'});
  if(/\.(?:js|cjs|mjs|py|html|css|md|json|txt|yaml|yml|ps1)$/i.test(relative)){
   const text=raw.toString('utf8');
   // Report only rule names, never echo credentials into logs.
   if(machinePath.test(text))violations.push({file:relative,rule:'machine-specific-path'});
   if(/\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}|\bgh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))violations.push({file:relative,rule:'credential-pattern'});
  }
 }}
 await walk(directory);
 return {schemaVersion:1,kind:packaged?'packaged-resources':'public-source',createdAt:new Date().toISOString(),ok:violations.length===0,fileCount:manifest.length,violations,manifest,independentCleanMachineAcceptance:'pending',signed:false,automaticUpdates:false};
}
