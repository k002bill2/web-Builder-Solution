set -u
M=$1; MODE=$2
echo "uname=$(uname -sm) node=$(node -v) npm=$(npm -v) M=$M mode=$MODE"
cp -r /w/$M /tmp/s && cd /tmp/s
if [ "$MODE" = ci ]; then npm ci --no-audit --no-fund > /tmp/i.log 2>&1; i=$?; else npm install --no-audit --no-fund > /tmp/i.log 2>&1; i=$?; fi
tail -3 /tmp/i.log
npm run build > /tmp/b.log 2>&1; b=$?
tail -8 /tmp/b.log
echo "install_exit=$i build_exit=$b"
echo "--- dist/index.html"; cat dist/index.html
node -e '
const h=require("fs").readFileSync("dist/index.html","utf8");
const head=h.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
const first=head.trim().match(/^<[^>]+>/)[0];
const cspFirst=/^<meta\s+http-equiv="Content-Security-Policy"/i.test(first);
const scripts=[...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const inline=scripts.filter(s=>!/\bsrc=/.test(s[1])||s[2].trim()!=="").length;
console.log("csp_meta_head_first_child="+cspFirst+" inline_script_count="+inline+" script_total="+scripts.length);
'
echo "RESULT exit=$([ $i -eq 0 ] && [ $b -eq 0 ] && echo 0 || echo 1)"
