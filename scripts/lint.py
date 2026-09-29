"""lint.py <scenes.js>: claim tests must test the picture.
Each shows(label, condition) needs a condition that is not a constant and that uses at least one name
the film's world(t) also uses (the function or data it draws from). Line breaks and comments don't matter."""
import re, sys
src = open(sys.argv[1]).read()
code = re.sub(r"//[^\n]*", "", src)                      # drop line comments
code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)

def balanced(s, i, o="(", c=")"):
    d = 0
    for j in range(i, len(s)):
        if s[j] == o: d += 1
        elif s[j] == c:
            d -= 1
            if d == 0: return s[i + 1:j]
    return ""

def top_args(a):
    out, d, cur, q = [], 0, "", None
    for ch in a:
        if q: cur += ch; q = None if ch == q else q; continue
        if ch in "'\"`": q = ch; cur += ch; continue
        if ch in "([{": d += 1
        if ch in ")]}": d -= 1
        if ch == "," and d == 0: out.append(cur.strip()); cur = ""
        else: cur += ch
    out.append(cur.strip()); return out

m = re.search(r"function\s+world\s*\(", code)
world = balanced(code, code.index("{", m.end()), "{", "}") if m else ""
# follow the helper functions world() calls (and those they call), so drawing through a helper counts
fn_bodies = {}
for fm in re.finditer(r"function\s+([A-Za-z_]\w*)\s*\(", code):
    j = code.find("{", fm.end())
    if j > 0: fn_bodies[fm.group(1)] = balanced(code, j, "{", "}")
for fm in re.finditer(r"(?:const|let)\s+([A-Za-z_]\w*)\s*=\s*(?:\([^)]*\)|[A-Za-z_]\w*)\s*=>", code):
    rest = code[fm.end():]; fn_bodies.setdefault(fm.group(1), rest[:rest.find(";\n") if ";\n" in rest else 400])
seen, todo, body = set(), ["world"], world
while todo:
    f = todo.pop()
    if f in seen: continue
    seen.add(f); txt = world if f == "world" else fn_bodies.get(f, "")
    body += "\n" + txt
    todo += [c for c in re.findall(r"([A-Za-z_]\w*)\s*\(", txt) if c in fn_bodies and c not in seen]
world_ids = set(re.findall(r"[A-Za-z_]\w*", body))
GENERIC = set("Math true false null undefined SC DUR BEAT BPM b bend prog lerp ease easeOut back clamp abs min max pow exp log sqrt every some length map filter reduce from to at t W H i k u v x y".split())
bad = []
for mm in re.finditer(r"\bshows\s*\(", code):
    args = top_args(balanced(code, mm.end() - 1))
    if len(args) < 2: continue
    label, cond = args[0], args[1]
    bare = re.sub(r"(['\"`]).*?\1", "", cond)
    bare = re.sub(r"\bSC\.\w+(\.\w+)?", "", bare)      # scene timings are not the picture
    ids = set(re.findall(r"[A-Za-z_]\w*", bare)) - GENERIC
    if re.fullmatch(r"!*\s*(true|false|\d+(\.\d+)?)", cond.strip()) or not ids:
        bad.append(f"{label}: condition `{cond}` is a constant (or only scene timings, which say nothing about the picture)")
    elif not ids & world_ids:
        bad.append(f"{label}: condition `{cond}` uses nothing that world() draws ({', '.join(sorted(ids))})")
if bad:
    print("fake claim test: each shows() must compute its condition from the numbers the picture is drawn from:")
    print("\n".join("  " + x for x in bad)); sys.exit(1)
