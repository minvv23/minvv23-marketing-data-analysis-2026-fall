# 지정한 git 커밋 이후 새로 들어갔거나 바뀐 줄만 골라 AI식 한국어 표현 후보를 센다(사용자 매뉴얼 §6-12 ⑦과 이 가이드용 항목).
# 사용: web 폴더에서  python3 presentation/_guide/tools/stylediff.py <기준 커밋> [--show 유형]
#   예: python3 presentation/_guide/tools/stylediff.py 28fc0df --show "완곡 종결"
# 걸린 것은 후보일 뿐이다. 하나씩 읽고 판단한다(실제 가능성을 말하는 "~할 수 있다", 대수 조작의 "더하고 빼면"은 유지).
import difflib, glob, os, re, subprocess, sys
ref = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'HEAD'
show = sys.argv[sys.argv.index('--show') + 1] if '--show' in sys.argv else None
G = 'presentation/_guide'
FILES = sorted(glob.glob(f'{G}/parts/*.html')) + sorted(glob.glob(f'{G}/viz-*.js'))
CHECKS = {
  '대시': r'[—―–]', '가운뎃점 나열': r'[가-힣A-Za-z]·[가-힣A-Za-z]', '아니라 대조': r'아니라|이 아니다\.|을 넘어|를 넘어', '화살표': r'[→⇒]',
  '비유어': r'(무게|몫|그릇|온도|덩어리)',
  '구어 동사': r'(쏠|꼽|매긴|매겨|거치|드러|치우|곱해|훑|뽑|골라|고르|빼고|빼면|뺀 |살짝|훨씬|섞이|섞어|합쳐|한꺼번에|곧바로|애초에|넘었|넘는|넘으면|내려가|올라가|꺾|쓴 |쓰면|쓰는 |뜻이다|뜻한다|어느 쪽)',
  '거의': r'거의', '즉': r'(^|[.!?]\s)즉[ ,]', '문두 접속어': r'(^|[.!?]\s)(또한|따라서|그래서|그러므로|이처럼|이를 통해|이러한|한편|결국|나아가)[ ,]',
  '연결어미+쉼표': r'(며|고|면|지만|는데|므로|어서|아서|으며|으나|되),\s', '완곡 종결': r'(수 있다\.|셈이다|것으로 보인다|라고 할 수 있다)',
  '당위 결말': r'(해야 한다|할 필요가 있다)\.\s*$', '과장': r'(핵심은|가장 중요한|주목할 만|매우 |정말 |완벽하게|결정적)', '에 대해': r'에 대(해|한)',
  '그리고 C': r', 그리고 ', '뿐만 아니라': r'뿐만 아니라', '예고형': r'(살펴본다|살펴보자|알아본다)', '지시어': r'(어떤 )',
}
def plain(line, js):
    if js: return ' '.join(a or b for a, b in re.findall(r"'([^']*[가-힣][^']*)'|`([^`]*[가-힣][^`]*)`", line))
    t = re.sub(r'<tex[^>]*>.*?</tex>', '', line); t = re.sub(r'<[^>]+>', ' ', t); return re.sub(r'\s+', ' ', t).strip()
tot = {}
for f in FILES:
    cur = open(f, encoding='utf8').read().split('\n')
    try: old = subprocess.run(['git', 'show', f'{ref}:{f}'], capture_output=True, text=True, check=True).stdout.split('\n')
    except subprocess.CalledProcessError: old = []
    sm = difflib.SequenceMatcher(None, old, cur, autojunk=False)
    idx = [j for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag in ('replace', 'insert') for j in range(j1, j2)]
    cnt = {}
    for j in idx:
        t = plain(cur[j], f.endswith('.js'))
        if not re.search('[가-힣]', t): continue
        for k, p in CHECKS.items():
            for m in re.finditer(p, t):
                cnt[k] = cnt.get(k, 0) + 1; tot[k] = tot.get(k, 0) + 1
                if show == k: print(f'  {os.path.basename(f)}:{j+1}  …{t[max(0, m.start()-35):m.end()+35]}…')
    if not show and idx: print(f'{os.path.basename(f):16} 새 줄 {len(idx):4}  ' + ' '.join(f'{k}={v}' for k, v in cnt.items()))
if not show: print('합계', ' '.join(f'{k}={v}' for k, v in tot.items()) or '0')
