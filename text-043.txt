import {mkdir,mkdtemp,cp,lstat,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {directories,files,allowed} from './public_policy.mjs';
import {audit} from './audit_public.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
const parent=path.join(root,'work','public-release');await mkdir(parent,{recursive:true});
const stage=await mkdtemp(path.join(parent,`source-${version}-`)),payload=path.join(stage,'source');await mkdir(payload);
for(const relative of [...directories,...files]){
 const source=path.join(root,relative);
 if((await lstat(source)).isSymbolicLink())throw Error('Source links are not allowed: '+relative);
 await cp(source,path.join(payload,relative),{recursive:true,errorOnExist:true,force:false,filter:async candidate=>allowed(path.relative(root,candidate).split(path.sep).join('/'))&&!(await lstat(candidate)).isSymbolicLink()});
}
const report=await audit(payload);await writeFile(path.join(stage,'source-audit.json'),JSON.stringify(report,null,2)+'\n');
if(!report.ok)throw Error('Source audit failed. Inspect source-audit.json; nothing was published.');
console.log(JSON.stringify({ok:true,version,stage,fileCount:report.fileCount,published:false},null,2));
