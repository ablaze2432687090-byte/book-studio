'use strict';
// No logs, paths, artwork names, free-form errors or credentials enter diagnostics.
function diagnostics({version,platform,arch,language,ready,packaged,status={}}) {
  const number=value=>Number.isSafeInteger(value)&&value>=0?value:0;
  return {schema:2,createdAt:new Date().toISOString(),app:{version,platform,arch,language,packaged:!!packaged},service:{ready:!!ready},counts:Object.fromEntries(['books','galleries','assets','bytes'].map(key=>[key,number(status[key])])),redacted:true};
}
function links(config={}) {
  if(!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(config.owner||'')||! /^[\w.-]{1,100}$/.test(config.repo||'')||['.','..'].includes(config.repo))return null;
  const repository=`https://github.com/${config.owner}/${config.repo}`;
  return {repository,releases:repository+'/releases',issues:repository+'/issues',security:repository+'/security/advisories/new'};
}
function parts(version){return /^v?(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/.exec(version||'')?.slice(1).map(Number);}
function compare(a,b){const aa=parts(a),bb=parts(b);if(!aa||!bb)return 0;for(let i=0;i<3;i++)if(aa[i]!==bb[i])return aa[i]-bb[i];return 0;}
function assertReleasePolicy(config,version){const parsed=parts(version);if(!parsed)throw Error('Invalid application version');if(config.stableReleaseApproved!==true&&(parsed[0]>=1||config.channel!=='preview'||config.stage!=='beta'))throw Error('Stable/1.0 release requires explicit owner approval; keep beta and preview until then');}
async function checkUpdates(config,version,fetcher=fetch){
  if(!links(config))return {status:'unconfigured',currentVersion:version};
  try{
    const response=await fetcher(`https://api.github.com/repos/${config.owner}/${config.repo}/releases?per_page=20`,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
    if(response.status===404)return {status:'no_release',currentVersion:version};
    if([403,429].includes(response.status))return {status:'rate_limited',currentVersion:version};
    if(!response.ok||!response.body)throw Error('response');
    const reader=response.body.getReader(),chunks=[];let bytes=0;
    try{for(;;){const item=await reader.read();if(item.done)break;bytes+=item.value.byteLength;if(bytes>512*1024)throw Error('limit');chunks.push(Buffer.from(item.value));}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    const releases=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!Array.isArray(releases))throw Error('format');
    const release=releases.filter(item=>!item.draft&&parts(item.tag_name)&&(config.channel==='preview'||!item.prerelease)).sort((a,b)=>compare(b.tag_name,a.tag_name))[0];
    if(!release)return {status:'no_release',currentVersion:version};
    return {status:compare(release.tag_name,version)>0?'available':'current',currentVersion:version,version:release.tag_name.replace(/^v/,''),notes:typeof release.body==='string'?release.body.slice(0,12000):''};
  }catch{return {status:'error',currentVersion:version};}
}
module.exports={diagnostics,links,checkUpdates,compare,assertReleasePolicy};
