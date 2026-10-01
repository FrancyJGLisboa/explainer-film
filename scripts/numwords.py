"""numwords.py: numbers <-> words for PT-BR and EN, shared by listen.py and align.py.
Whisper writes '1963' or '300'; a narration script may spell them out ('mil novecentos e sessenta e três').
spell(n, lang) turns digits into the spoken words; to_digits(tokens, lang) turns a run of number words back into digits."""
PT_UN = "zero um dois três quatro cinco seis sete oito nove dez onze doze treze catorze quinze dezesseis dezessete dezoito dezenove".split()
PT_DEZ = "_ _ vinte trinta quarenta cinquenta sessenta setenta oitenta noventa".split()
PT_CEM = "_ cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos".split()
EN_UN = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
EN_DEZ = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()

def spell(n, lang="en"):
    if lang.startswith("pt"):
        if n < 20: return PT_UN[n]
        if n < 100: return PT_DEZ[n // 10] + ("" if n % 10 == 0 else " e " + PT_UN[n % 10])
        if n == 100: return "cem"
        if n < 1000: return PT_CEM[n // 100] + ("" if n % 100 == 0 else " e " + spell(n % 100, lang))
        if n < 1000000:
            m, r = divmod(n, 1000); head = "mil" if m == 1 else spell(m, lang) + " mil"
            return head + ("" if r == 0 else (" e " if r < 100 or r % 100 == 0 else " ") + spell(r, lang))
        return str(n)
    if n < 20: return EN_UN[n]
    if n < 100: return EN_DEZ[n // 10] + ("" if n % 10 == 0 else " " + EN_UN[n % 10])
    if n < 1000: return EN_UN[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + spell(n % 100, lang))
    if n < 1000000:
        m, r = divmod(n, 1000); return spell(m, lang) + " thousand" + ("" if r == 0 else " " + spell(r, lang))
    return str(n)

def _value(w, lang):
    if lang.startswith("pt"):
        extra = {"uma": 1, "duas": 2, "quatorze": 14, "cem": 100}
        if w in extra: return extra[w]
        for tab, mul in ((PT_UN, 1), (PT_DEZ, 10), (PT_CEM, 100)):
            if w in tab and w != "_": return tab.index(w) * mul
        return None
    for tab, mul in ((EN_UN, 1), (EN_DEZ, 10)):
        if w in tab and w != "_": return tab.index(w) * mul
    return None

def to_digits(tokens, lang="en"):
    """Collapse runs of number words ('mil novecentos e sessenta e três', 'three hundred') into digit strings."""
    pt = lang.startswith("pt"); joiner = "e" if pt else "and"; big = "mil" if pt else "thousand"; hund = None if pt else "hundred"
    out, total, cur, have, i = [], 0, 0, False, 0
    def flush():
        nonlocal total, cur, have
        if have: out.append(str(total + cur))
        total, cur, have = 0, 0, False
    while i < len(tokens):
        w = tokens[i]; v = _value(w, lang)
        if v is not None: cur += v; have = True
        elif w == hund and have: cur *= 100
        elif w == big: total += (cur or 1) * 1000; cur = 0; have = True
        elif w == joiner and have and i + 1 < len(tokens) and (_value(tokens[i + 1], lang) is not None): pass
        else: flush(); out.append(w)
        i += 1
    flush(); return out
