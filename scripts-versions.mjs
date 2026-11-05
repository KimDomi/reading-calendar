// Keep every browser module import aligned with the published source version.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const digest=name=>createHash('sha256').update(readFileSync('dist/'+name)).digest('hex').slice(0,12);
const engineVersion=digest('engine.js');
let backup=readFileSync('dist/backup.js','utf8').replace(/from '\.\/engine\.js(?:\?[^']*)?'/,"from './engine.js?v="+engineVersion+"'");writeFileSync('dist/backup.js',backup);
const backupVersion=digest('backup.js');
const settingsVersion=digest('settings.js'),paletteVersion=digest('palette.js');
let app=readFileSync('dist/app.js','utf8').replace(/from '\.\/engine\.js(?:\?[^']*)?'/,"from './engine.js?v="+engineVersion+"'").replace(/from '\.\/backup\.js(?:\?[^']*)?'/,"from './backup.js?v="+backupVersion+"'");writeFileSync('dist/app.js',app);
app=app.replace(/from '\.\/settings\.js(?:\?[^']*)?'/,"from './settings.js?v="+settingsVersion+"'").replace(/from '\.\/palette\.js(?:\?[^']*)?'/,"from './palette.js?v="+paletteVersion+"'");writeFileSync('dist/app.js',app);
let html=readFileSync('dist/index.html','utf8').replace(/src="app\.js(?:\?[^\"]*)?"/,'src="app.js?v='+digest('app.js')+'"').replace(/href="style\.css(?:\?[^\"]*)?"/,'href="style.css?v='+digest('style.css')+'"');writeFileSync('dist/index.html',html);
