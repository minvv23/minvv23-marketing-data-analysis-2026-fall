"""AI식 한국어 표현 점검 (사용자 매뉴얼 AI식-한국어-표현.md §0, §1, §5, §6-3, §6-6-1, §6-9, §6-10, §6-11, §6-12 기준).
사용: python3 stylecheck2.py <파일...> [--summary] [--only 이름,이름]
HTML 조각은 태그와 수식(<tex>)을 지운 본문으로, JS는 따옴표 안 한국어 문자열만 검사한다.
검색어는 후보를 찾는 도구다. 걸린 것을 읽고 판단한다(용어, 인용, 수식 설명 등은 유지할 수 있다)."""
import re, sys, html, collections

def text_of(path):
    raw = open(path, encoding='utf-8').read()
    if path.endswith('.js'):
        lits = re.findall(r"'((?:[^'\\\n]|\\.)*[가-힣](?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*[가-힣](?:[^`\\]|\\.)*)`|\"((?:[^\"\\\n]|\\.)*[가-힣](?:[^\"\\\n]|\\.)*)\"", raw)
        t = '\n'.join(a or b or c for a, b, c in lits)
        t = re.sub(r'\$\{[^}]*\}', ' ', t)
        return [], html.unescape(re.sub(r'<[^>]+>', ' ', t)), []
    heads = [re.sub(r'<[^>]+>', '', h) for h in re.findall(r'<h[1-4][^>]*>([\s\S]*?)</h[1-4]>', raw)]
    body = re.sub(r'<tex[^>]*>[\s\S]*?</tex>', ' ', raw)
    paras = [html.unescape(re.sub(r'<[^>]+>', ' ', p)) for p in re.findall(r'<(?:p|li|summary|td)[^>]*>([\s\S]*?)</(?:p|li|summary|td)>', body)]
    t = html.unescape(re.sub(r'<[^>]+>', ' ', body))
    return heads, t, paras

CHECKS = [
  # 문장부호, 기호
  ('em/en대시', r'[—―–]'),
  ('가운뎃점 나열', r'[가-힣A-Za-z]·[가-힣A-Za-z]'),
  ('화살표', r'[→⇒←]'),
  ('물결표', r'[~∼]'),
  # 대조, 재정의
  ('아니라 대조', r'(?<!뿐 )아니라'),
  ('부정 후 재정의', r'(이|가) 아니다\.\s*[가-힣]'),
  ('넘어/에서~로 변환', r'(을|를) 넘어 |에서 [^ ]+(으로|로)\s*(옮겨|바뀌|전환)'),
  ('단순한/단순히', r'단순한 |단순히 '),
  # 접속어
  ('문두 접속어', r'(?:(?<=\. )|(?<=^)|(?<=\n))(또한|따라서|즉|나아가|한편|이를 통해|이러한|이처럼|이 점에서|결국|그래서|하지만|그리고|게다가|요컨대|다시 말해)[ ,]'),
  ('즉', r'(?<![가-힣])즉[ ,]'),
  ('결국', r'결국'),
  # 완곡, 당위, 중요성
  ('완곡 종결', r'(할|볼|될|있을|없을) 수 있다\.|셈이다|것으로 보인다|경향이 있다|라고 할 수 있다|수 있을 것이다'),
  ('당위', r'해야 한다|할 필요가 있다|필요가 있다|하는 것이 좋다|편이 (좋|낫|안전)'),
  ('중요성 부풀리기', r'핵심적|핵심은|가장 중요한|중요한 (점|것)|주목할|의미 있는|본질|시사(한다|점|하는 바)|결정적'),
  ('과장 수식', r'강력한|매우 |정말|완벽하게|극적으로|획기적|놀랍'),
  ('예고형/요약형', r'살펴보(겠|자)|알아보(겠|자)|앞에서 (본|살펴본|설명한) (것처럼|바와 같이)|위에서 (본|살펴본)'),
  ('수사 질문+즉답', r'\?\s*(바로|답은|그것은|이유는)'),
  # 번역투
  ('를 통해', r'(을|를) 통해'),
  ('에 대해', r'에 대해|에 대한'),
  ('에 있어', r'에 있어'),
  ('가지고 있다', r'(을|를) 가지고 있다|(을|를) 갖는다'),
  ('이중 조사', r'에서의|으로의|로의|에의'),
  ('대명사 그것', r'그것은|그것이|그것을'),
  # 구어 (§6-6, §6-6-1, §6-11 ④, §6-12 ④)
  ('구어 동사(절차)', r'쓴 |쓰면|쓰는|골라|고르|뽑|남겼|빼[고면서]|뺀|한 개씩|한 건씩|섞이|섞어|합쳐|나누어 보|한꺼번에|곧바로|애초에|알기에|바꾸었|보이게|점잖|넘었|훨씬|뜻이다|뜻임|뜻한다|어느 쪽|쪽이|쪽을'),
  ('구어 동사(수치)', r'내려가|내려앉|올라가|꺾|밀려|몰려|굳은|얇아|식은|시들|멀쩡|살짝|홀로|쏠|훑|매긴|매겨|치우|드러|거치|꼽|곱해'),
  ('거의', r'거의'),
  ('구어 종결', r'거든|인데요|잖아|더라고|같아요|해요[.,]'),
  ('갈리다 계열', r'(?<!헷)(?<!엇)갈리|(?<!헷)(?<!엇)갈렸|(?<!헷)(?<!엇)갈린|가른|가를|가르는|갈라'),
  # 내부 매뉴얼 말투 (§6-12 ①)
  ('작업 규칙 종결', r'(보고함|표기함|명시함|사용하지 않음|쓰지 않음|배정함|해석함|고정함)'),
  # 비유어
  ('일상 비유', r'무게|몫|그릇|온도'),
]

def run(paths, summary, only):
    total = collections.Counter()
    for p in paths:
        heads, t, paras = text_of(p)
        chars = len(re.sub(r'\s', '', t))
        cnt = collections.Counter()
        out = []
        for name, pat in CHECKS:
            if only and name not in only: continue
            for m in re.finditer(pat, t, flags=re.M):
                cnt[name] += 1
                a, b = max(0, m.start() - 40), m.end() + 40
                out.append(f'  [{name}] ' + re.sub(r'\s+', ' ', t[a:b]))
        # 문단 끝 당위
        end_must = [p_ for p_ in paras if re.search(r'(해야 한다|필요가 있다|하는 것이 좋다)\.\s*$', p_.strip())]
        if not only or '문단 끝 당위' in only:
            cnt['문단 끝 당위'] = len(end_must)
            out += ['  [문단 끝 당위] ' + re.sub(r'\s+', ' ', x.strip())[-90:] for x in end_must]
        # 콜론 제목
        ch = [h for h in heads if ':' in h]
        cnt['콜론 제목'] = len(ch); out += ['  [콜론 제목] ' + h for h in ch]
        # 영어 병기는 점검하지 않는다 (사용자 지시 2026-11-16: 전문 학술 용어 병기는 문제없음)
        # 연결어미 뒤 쉼표
        cnt['연결어미+쉼표'] = len(re.findall(r'[가-힣](며|고|서|면|나|지만|는데),\s', t))
        # 따옴표 강조
        cnt['따옴표'] = len(re.findall(r'"[^"]{1,25}"', t))
        print(f'## {p}  ({chars}자, 1000자당 대조 {1000*cnt["아니라 대조"]/max(chars,1):.2f})')
        for k, v in sorted(cnt.items(), key=lambda x: -x[1]):
            if v: print(f'   {k}: {v}')
        if not summary: print('\n'.join(out))
        total += cnt
    if len(paths) > 1:
        print('## 합계'); [print(f'   {k}: {v}') for k, v in sorted(total.items(), key=lambda x: -x[1]) if v]

if __name__ == '__main__':
    args = sys.argv[1:]; summary = '--summary' in args; only = None
    if '--only' in args: i = args.index('--only'); only = set(args[i + 1].split(',')); args = args[:i] + args[i + 2:]
    run([a for a in args if not a.startswith('--')], summary, only)
