"""슬라이드 문구를 장 단위로 바꾸는 도우미. 리드, 읽는 법, 단계 목록을 통째로 교체한다."""
import re
D = __file__.rsplit('/_tools/', 1)[0] + '/_src/20261118/'
def rewrite(fn, sid, lead=None, nota=None, steps=None, extra=None):
    s = open(D + fn, encoding='utf-8').read()
    a = s.index('id="%s"' % sid); b = s.index('</section>', a); sec = s[a:b]
    if lead is not None:
        sec, n = re.subn(r'<p class="lead">.*?</p>', lambda m: '<p class="lead">' + lead + '</p>', sec, count=1, flags=re.S); assert n == 1, (sid, 'lead')
    if nota is not None:
        sec, n = re.subn(r'<p class="nota">.*?</p>', lambda m: '<p class="nota">' + nota + '</p>', sec, count=1, flags=re.S); assert n == 1, (sid, 'nota')
    if steps is not None:
        li = '\n'.join('      <li data-n="%02d">%s</li>' % (i + 1, t) for i, t in enumerate(steps))
        sec, n = re.subn(r'<ul class="steps">.*?</ul>', lambda m: '<ul class="steps">\n' + li + '\n    </ul>', sec, count=1, flags=re.S); assert n == 1, (sid, 'steps')
    for x, y in (extra or []):
        assert x in sec, (sid, x[:40]); sec = sec.replace(x, y)
    open(D + fn, 'w', encoding='utf-8').write(s[:a] + sec + s[b:])
V = lambda c: '<i class="v">%s</i>' % c
nw = lambda t: '<span class="nw">%s</span>' % t
kb = lambda t: '<span class="kb">%s</span>' % t
