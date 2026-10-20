# E0 임시: 정적 zip index.html charset 다음에 CSP-SPEC 1.2 STATIC_CSP_ZIP meta 삽입 (소스 변경 0)
import sys
p = sys.argv[1]
csp = "default-src 'none'; script-src 'sha256-xjxofTFd/IqBuzOkEPYsAa9W0LrdyNf+WbGn8wE5EAg='; style-src 'unsafe-inline'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'"
s = open(p, encoding="utf-8").read()
a = '<meta charset="utf-8">'
assert s.count(a) == 1 and "http-equiv" not in s
s = s.replace(a, a + '<meta http-equiv="Content-Security-Policy" content="' + csp + '">')
open(p, "w", encoding="utf-8").write(s)
print("inserted")
