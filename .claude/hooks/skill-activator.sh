#!/bin/bash
# Skills Auto-Activator
# Usage: skill-activator.sh "<prompt>"   (또는 stdin 으로 UserPromptSubmit JSON 전달)
# 프롬프트 소싱: $1 인자 우선, 없으면 stdin JSON(.prompt). 실제 UserPromptSubmit 는 stdin JSON 계약.
# advisory 훅: 관련 스킬을 stdout 리마인더로 추천할 뿐 작업을 차단하지 않는다.

PROMPT="$1"

# 프롬프트 소싱: $1 인자 우선. 없으면 stdin(파이프)에서 UserPromptSubmit JSON 을 읽는다.
# 실제 Claude Code UserPromptSubmit 훅은 프롬프트를 stdin JSON({"prompt":"..."})으로 전달하며
# $PROMPT 환경변수를 보장하지 않는다 — 따라서 stdin 폴백이 반드시 필요하다.
# 파싱 우선순위: jq → node(JSON.parse, 포맷 무관) → sed(최후 best-effort).
if [ -z "$PROMPT" ] && [ ! -t 0 ]; then
  RAW="$(cat)"
  if command -v jq >/dev/null 2>&1; then
    PROMPT="$(printf '%s' "$RAW" | jq -r '.prompt // empty' 2>/dev/null)"
  fi
  if [ -z "$PROMPT" ] && command -v node >/dev/null 2>&1; then
    PROMPT="$(printf '%s' "$RAW" | node -e 'let d="";process.stdin.on("data",function(c){d+=c;}).on("end",function(){try{process.stdout.write(String(JSON.parse(d).prompt||""));}catch(e){}});' 2>/dev/null)"
  fi
  if [ -z "$PROMPT" ]; then
    # best-effort 셸 폴백: 한 줄 "prompt":"..." 만 대략 추출(정밀 파싱 아님).
    PROMPT="$(printf '%s' "$RAW" | sed -n 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/p')"
  fi
  if [ -z "$PROMPT" ]; then
    PROMPT="$RAW"
  fi
fi

# skill-rules.json 위치: CLAUDE_PROJECT_DIR/.claude(설치기 레이아웃) → 훅과 같은 폴더
# (문서 레이아웃) → 훅 상위 .claude/ 루트 순으로 존재하는 첫 파일을 사용.
HOOK_DIR="$(dirname "$0")"
RULES_FILE=""
for cand in \
  "${CLAUDE_PROJECT_DIR:-}/.claude/skill-rules.json" \
  "$HOOK_DIR/skill-rules.json" \
  "$HOOK_DIR/../skill-rules.json"; do
  if [ -f "$cand" ]; then RULES_FILE="$cand"; break; fi
done
if [ -z "$RULES_FILE" ]; then
  exit 0
fi

MATCHED=""

if command -v jq >/dev/null 2>&1; then
  # jq 경로: 짧은(≤3자) ASCII 키워드는 단어 경계, 그 외/한글은 substring (배열 포맷 무관).
  MATCHED=$(jq -r --arg prompt "$PROMPT" '
    ($prompt | ascii_downcase) as $p |
    .rules[] |
    select(
      any(.keywords[];
        (ascii_downcase) as $kw |
        if (($kw | length) <= 3) and ($kw | test("^[ -~]+$"))
        then ($p | test("(^|[^a-z0-9])" + $kw + "([^a-z0-9]|$)"))
        else ($p | contains($kw))
        end)
    ) |
    "\(.priority | ascii_upcase): \(.skillName)"
  ' "$RULES_FILE" 2>/dev/null | sort -u)
elif command -v node >/dev/null 2>&1; then
  # node 폴백: JSON.parse 로 포맷 무관하게 .rules[] 를 읽어 키워드 매칭.
  MATCHED=$(RULES_FILE="$RULES_FILE" PROMPT="$PROMPT" node -e '
    var fs=require("fs");
    try{
      var data=JSON.parse(fs.readFileSync(process.env.RULES_FILE,"utf8"));
      var rules=(data&&data.rules)||[];
      var p=String(process.env.PROMPT||"").toLowerCase();
      var out={};
      for(var i=0;i<rules.length;i++){
        var r=rules[i]||{};
        var kws=r.keywords||[];
        for(var j=0;j<kws.length;j++){
          var kw=String(kws[j]).toLowerCase();
          var hit;
          if(kw.length<=3 && /^[\x20-\x7e]+$/.test(kw)){
            var esc=kw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
            hit=new RegExp("(^|[^a-z0-9])"+esc+"([^a-z0-9]|$)").test(p);
          }else{
            hit=p.indexOf(kw)>=0;
          }
          if(hit){
            out[String(r.priority||"").toUpperCase()+": "+r.skillName]=1; break;
          }
        }
      }
      process.stdout.write(Object.keys(out).sort().join("\n"));
    }catch(e){}
  ' 2>/dev/null)
else
  # 최후 shell best-effort: jq·node 둘 다 없을 때만. keywords 가 한 줄 배열이라고
  # 가정하고 라인 단위로 훑는다(멀티라인 배열/콤마 포함 키워드는 매칭 못 할 수 있음).
  PROMPT_LC=$(printf '%s' "$PROMPT" | tr '[:upper:]' '[:lower:]')
  MATCHED=$(awk -v prompt="$PROMPT_LC" '
    /"skillName"/ { name=$0; sub(/.*"skillName"[^"]*"/,"",name); sub(/".*/,"",name) }
    /"priority"/  { prio=$0; sub(/.*"priority"[^"]*"/,"",prio);  sub(/".*/,"",prio) }
    /"keywords"/  {
      kw=$0; sub(/.*\[/,"",kw); sub(/\].*/,"",kw)
      n=split(kw, arr, ",")
      for (i=1;i<=n;i++) {
        k=arr[i]
        gsub(/^[ \t"]+/,"",k); gsub(/[ \t"]+$/,"",k)
        kl=tolower(k)
        if (kl == "") continue
        if (length(kl) <= 3 && kl !~ /[^ -~]/) {
          if (match(prompt, "(^|[^[:alnum:]])" kl "([^[:alnum:]]|$)")) { print toupper(prio) ": " name; break }
        } else {
          if (index(prompt, kl) > 0) { print toupper(prio) ": " name; break }
        }
      }
    }
  ' "$RULES_FILE" | sort -u)
fi

if [ -n "$MATCHED" ]; then
  echo "[SKILLS ACTIVATED]"
  echo "$MATCHED"
  echo "(advisory: 위 스킬 참조 권장 — 이 훅은 리마인더일 뿐 작업을 차단하지 않음)"
fi
