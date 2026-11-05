// Keep every browser module import aligned with the published source version.
import './scripts-holidays.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {icon} from './dist/icons.js';
const digest=name=>createHash('sha256').update(readFileSync('dist/'+name)).digest('hex').slice(0,12);
const iconsVersion=digest('icons.js');
for(const name of ['app.js','settings.js','timer.js','date-picker.js','time-picker.js']){
  const source=readFileSync('dist/'+name,'utf8').replace(/from '\.\/icons\.js(?:\?[^']*)?'/,"from './icons.js?v="+iconsVersion+"'");
  writeFileSync('dist/'+name,source);
}
const nativeVersion=digest('native.js');
for(const name of ['app.js','settings.js','timer.js']){
  const source=readFileSync('dist/'+name,'utf8').replace(/from '\.\/native\.js(?:\?[^']*)?'/,"from './native.js?v="+nativeVersion+"'");
  writeFileSync('dist/'+name,source);
}
const holidaysVersion=digest('holidays.js');
let rest=readFileSync('dist/rest-days.js','utf8').replace(/from '\.\/holidays\.js(?:\?[^']*)?'/,"from './holidays.js?v="+holidaysVersion+"'");writeFileSync('dist/rest-days.js',rest);
const restVersion=digest('rest-days.js');
for(const name of ['engine.js','backup.js','settings.js','app.js']){const source=readFileSync('dist/'+name,'utf8').replace(/from '\.\/rest-days\.js(?:\?[^']*)?'/,"from './rest-days.js?v="+restVersion+"'");writeFileSync('dist/'+name,source);}
const picker=readFileSync('dist/date-picker.js','utf8').replace(/from '\.\/holidays\.js(?:\?[^']*)?'/,"from './holidays.js?v="+holidaysVersion+"'");writeFileSync('dist/date-picker.js',picker);
const datePickerVersion=digest('date-picker.js'),timePickerVersion=digest('time-picker.js');
const engineVersion=digest('engine.js');
let backup=readFileSync('dist/backup.js','utf8').replace(/from '\.\/engine\.js(?:\?[^']*)?'/,"from './engine.js?v="+engineVersion+"'");writeFileSync('dist/backup.js',backup);
const backupVersion=digest('backup.js');
const settingsVersion=digest('settings.js'),paletteVersion=digest('palette.js');
const colorPickerVersion=digest('color-picker.js');
const timerColorPicker=readFileSync('dist/timer-color-picker.js','utf8').replace(/from '\.\/color-picker\.js(?:\?[^']*)?'/,"from './color-picker.js?v="+colorPickerVersion+"'");
writeFileSync('dist/timer-color-picker.js',timerColorPicker);
const timerColorVersion=digest('timer-color-picker.js');
const timer=readFileSync('dist/timer.js','utf8').replace(/from '\.\/settings\.js(?:\?[^']*)?'/,"from './settings.js?v="+settingsVersion+"'").replace(/from '\.\/timer-color-picker\.js(?:\?[^']*)?'/,"from './timer-color-picker.js?v="+timerColorVersion+"'");
writeFileSync('dist/timer.js',timer);
const timerVersion=digest('timer.js');
const progressCheckVersion=digest('progress-check.js');
let app=readFileSync('dist/app.js','utf8').replace(/from '\.\/engine\.js(?:\?[^']*)?'/,"from './engine.js?v="+engineVersion+"'").replace(/from '\.\/backup\.js(?:\?[^']*)?'/,"from './backup.js?v="+backupVersion+"'");writeFileSync('dist/app.js',app);
app=app.replace(/from '\.\/settings\.js(?:\?[^']*)?'/,"from './settings.js?v="+settingsVersion+"'").replace(/from '\.\/palette\.js(?:\?[^']*)?'/,"from './palette.js?v="+paletteVersion+"'").replace(/from '\.\/color-picker\.js(?:\?[^']*)?'/,"from './color-picker.js?v="+colorPickerVersion+"'");writeFileSync('dist/app.js',app);
app=app.replace(/from '\.\/progress-check\.js(?:\?[^']*)?'/,"from './progress-check.js?v="+progressCheckVersion+"'");
app=app.replace(/from '\.\/time-picker\.js(?:\?[^']*)?'/,"from './time-picker.js?v="+timePickerVersion+"'");
app=app.replace(/from '\.\/date-picker\.js(?:\?[^']*)?'/,"from './date-picker.js?v="+datePickerVersion+"'");
app=app.replace(/from '\.\/timer\.js(?:\?[^']*)?'/,"from './timer.js?v="+timerVersion+"'");
app=app.replace(/from '\.\/holidays\.js(?:\?[^']*)?'/,"from './holidays.js?v="+holidaysVersion+"'");writeFileSync('dist/app.js',app);
let html=readFileSync('dist/index.html','utf8').replace(/src="app\.js(?:\?[^\"]*)?"/,'src="app.js?v='+digest('app.js')+'"').replace(/href="style\.css(?:\?[^\"]*)?"/,'href="style.css?v='+digest('style.css')+'"');
html=html.replace(/<svg\b[^>]*data-icon="([\w-]+)"[^>]*>[\s\S]*?<\/svg>/g,(_,name)=>icon(name));
writeFileSync('dist/index.html',html);
