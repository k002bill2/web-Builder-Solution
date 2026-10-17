import sys, re
from html.parser import HTMLParser
URLATTR={'src','href','xlink:href','srcset','poster','action','formaction','data','background','ping','cite','longdesc','manifest','icon'}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.refs=[]; s.tags={}; s.instyle=False; s.css=[]; s.comments=[]
    def handle_starttag(s,t,a):
        s.tags[t]=s.tags.get(t,0)+1
        for k,v in a:
            if k in URLATTR and v is not None: s.refs.append((t,k,v[:60]))
            if k=='style' and v: s.css.append(v)
            if k=='http-equiv': s.refs.append((t,k,v))
        s.instyle = t=='style'
    def handle_endtag(s,t): s.instyle=False
    def handle_data(s,d):
        if s.instyle: s.css.append(d)
    def handle_comment(s,d): s.comments.append(d)
for f in sys.argv[1:]:
    t=open(f,encoding='utf-8').read(); p=P(); p.feed(t)
    css=' '.join(p.css)
    urls=[m.group(2)[:50] for m in re.finditer(r'url\(\s*([\'"]?)([^\'")]*)\1\s*\)',css,re.I)]
    print('==',f, len(t),'chars')
    print(' tags link/script/iframe/base/meta/img/form:', {k:p.tags.get(k,0) for k in ['link','script','iframe','base','meta','img','form','object','embed']})
    print(' URL attrs:', sorted(set((a,b,(c if not c.startswith('data:') else c[:20])) for a,b,c in p.refs)))
    print(' CSS url():', sorted(set(u if not u.startswith('data:') else u[:24] for u in urls)), ' @import:', len(re.findall('@import',css,re.I)))
    ext=[r for r in p.refs if re.match(r'(?i)\s*(https?:|//|ftp:|ws)',r[2])]+[u for u in urls if re.match(r'(?i)\s*(https?:|//)',u)]
    print(' 외부 요청 후보(속성·CSS url):', len(ext), ext)
    print(' blob: 등장', t.count('blob:'), '· image: 마커', len(re.findall(r'src="image:',t)))
    allhttp=[(m.start(), t[max(0,m.start()-30):m.start()+45].replace('\n',' ')) for m in re.finditer(r'https?://',t)]
    incomment=sum(1 for i,_ in allhttp if any(i>=t.find(c) and i<t.find(c)+len(c) for c in p.comments if t.find(c)>=0))
    print(' 문자열 http(s):// 전체', len(allhttp), '· 그중 주석 안', incomment)
    for i,c in allhttp: print('   ', i, c)
