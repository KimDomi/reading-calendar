import {readFileSync,copyFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const gradle=readFileSync(path.join(root,'android/app/build.gradle'),'utf8');
const version=process.env.ANDROID_VERSION_NAME||gradle.match(/versionName\s+[^\n"]*"([\d.]+)"/)?.[1]||'0.0.0';
const versionCode=Number(process.env.ANDROID_VERSION_CODE||gradle.match(/versionCode\s+[^\n]*?(\d+)\s*\)/)?.[1]||gradle.match(/versionCode\s+(\d+)/)?.[1]||1);
const releaseMode=process.argv.includes('--release')||process.env.ANDROID_BUILD_TYPE==='release';
const releaseApk=path.join(root,'android/app/build/outputs/apk/release/app-release.apk');
const debugApk=path.join(root,'android/app/build/outputs/apk/debug/app-debug.apk');
const buildType=releaseMode&&existsSync(releaseApk)?'release':'debug';
const sourceApk=buildType==='release'?releaseApk:debugApk;
const dir=path.join(root,'artifacts'),name=`reading-calendar-${version}-${buildType}.apk`;
mkdirSync(dir,{recursive:true});
copyFileSync(sourceApk,path.join(dir,name));
const digest=createHash('sha256').update(readFileSync(path.join(dir,name))).digest('hex');
writeFileSync(path.join(dir,name+'.sha256'),digest+'  '+name+'\n');
const repo=process.env.GITHUB_REPOSITORY||'KimDomi/reading-calendar';
const tagName=`v${version}`;
const manifest={
  versionName:version,
  versionCode,
  buildType,
  tagName,
  apkName:name,
  downloadUrl:`https://github.com/${repo}/releases/download/${tagName}/${name}`,
  releaseUrl:`https://github.com/${repo}/releases/tag/${tagName}`,
  sha256:digest,
  publishedAt:new Date().toISOString()
};
writeFileSync(path.join(dir,'latest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Android ${buildType} APK: ${path.join(dir,name)}`);
