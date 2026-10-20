import {spawnSync} from 'node:child_process';
const python=process.env.BOOK_STUDIO_PYTHON||'python';
// Isolate globals and fake-provider services for each test module.
for(const name of ['test_studio_store.py','test_tool_stores.py','test_collection_rules.py','test_project_tools.py','test_ai_studio.py']){
 const result=spawnSync(python,['scripts/'+name],{stdio:'inherit',windowsHide:true,timeout:120000,env:{...process.env,PYTHONPATH:process.cwd()}});
 if(result.error||result.status!==0){console.error(name,result.error?.message||'failed');process.exit(result.status||1);}
}
