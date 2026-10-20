'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
function inside(parent,target){const relative=path.relative(parent,target);return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));}
async function writableDirectory(directory,{data,application}={}) {
  const target=path.resolve(directory);
  if(target===path.parse(target).root||data&&(inside(data,target)||inside(target,data))||application&&inside(application,target))throw Error('请选择仓库和程序目录以外的独立文件夹。');
  await fs.mkdir(target,{recursive:true});
  if((await fs.lstat(target)).isSymbolicLink())throw Error('不能使用链接目录。');
  const real=await fs.realpath(target);
  if(real.toLowerCase()!==target.toLowerCase())throw Error('不能使用重定向目录。');
  const probe=path.join(target,'.book-studio-probe-'+crypto.randomBytes(6).toString('hex'));
  await fs.writeFile(probe,'',{flag:'wx'});await fs.unlink(probe);
  return target;
}
module.exports={inside,writableDirectory};
