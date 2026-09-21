import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]||path.join(root,'../literatures'));
const target=path.join(root,'learning/materials');
if(!fs.existsSync(source))throw Error(`원본 폴더가 없습니다: ${source}. 저장소만 복제한 환경에서는 npm run build를 사용하세요.`);
const weeks=fs.readdirSync(source).filter(n=>/^Week \d/.test(n));
if(weeks.length!==13)throw Error(`13개 주차가 필요합니다. 발견: ${weeks.length}`);
fs.mkdirSync(target,{recursive:true});
let count=0;
for(const week of weeks){
 fs.mkdirSync(path.join(target,week),{recursive:true});
 for(const file of fs.readdirSync(path.join(source,week)).filter(n=>/\.(md|pdf)$/.test(n))){fs.copyFileSync(path.join(source,week,file),path.join(target,week,file));count++;}
}
fs.copyFileSync(path.join(source,'README.md'),path.join(target,'README.md'));
console.log(`원본에서 ${count}개 파일을 learning/materials에 동기화했습니다.`);
