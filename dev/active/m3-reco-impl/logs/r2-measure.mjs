import { readFileSync } from "node:fs"; import { gzipSync } from "node:zlib";
const s = readFileSync(process.argv[2], "utf8");
const g = (x) => gzipSync(x).length;
const base = g(s);
const cuts = {
  mapDeps: [/^const __vite__mapDeps[^\n]*\n/, ""],
  loaderVar: [/var _e=\(\)=>o\(\(\)=>import\(`\.\/RecoView-[^`]*`\),__vite__mapDeps\(\[0,1\]\)\);/, ""],
  effect: [/,\[j,M\]=\(0,P\.useState\)\(\{\}\);\(0,P\.useEffect\)\(\(\)=>\{if\(!k\|\|j\.View\|\|j\.failed\)return;let e=!0;return _e\(\)\.then\(t=>e&&M\(\{View:t\.default\}\),\(\)=>e&&M\(\{failed:!0\}\)\),\(\)=>\{e=!1\}\},\[k,j\]\);let /, ";let "],
  failedAlert: [/j\.failed\?\(0,N\.jsxs\)\(`div`,\{role:`alert`.*?children:`다시 시도`\}\)\]\}\):/, ""],
  skeleton: [/\(0,N\.jsx\)\(`div`,\{"aria-busy":`true`.*?\},e\)\)\}\)/, "null"],
};
console.log("base", base);
let all = s;
for (const [k, [re, rep]] of Object.entries(cuts)) { if (!re.test(s)) { console.log(k, "NOMATCH"); continue; } console.log(k, base - g(s.replace(re, rep))); all = all.replace(re, rep); }
console.log("all", base - g(all));
const noticeRe = /,b=\(0,P\.useRef\)\(0\),x=\(0,P\.useCallback\)\([^]*?key:b\.current\+=1\}\),\[\]\)/;
console.log("noticeKey", noticeRe.test(s) ? base - g(s.replace(noticeRe, ",x=y")) : "NOMATCH");
