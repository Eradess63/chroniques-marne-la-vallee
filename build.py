"""
Construit dist/index.html : une page légère, et dist/assets/ : styles,
scripts et données minifiés, nommés d'après leur contenu pour être gardés
longtemps par le navigateur.

Au passage, date les liens de index.html. GitHub Pages sert css/ et js/ avec
dix minutes de cache : sans marqueur, un visiteur qui revient juste après une
publication reçoit l'ancien script avec la nouvelle feuille de style, ou
l'inverse. L'URL change à chaque construction, le cache est donc contourné
proprement plutôt qu'attendu.
"""
import re
import time
import pathlib

root = pathlib.Path(__file__).parent

# --- Outils communs avec le Carnet ---------------------------------------
# Le plan, « près de moi », l'itinéraire, l'historique des attentes et le
# journal sont écrits une seule fois, dans le dépôt du Carnet. Quand il est
# cloné à côté, ses versions remplacent les copies de js/ : une correction
# faite d'un côté ne peut plus manquer de l'autre.
COMMUNS = ['park-map.js', 'nearby.js', 'itinerary.js', 'wait-history.js', 'journal.js']
carnet = root.parent / 'carnet-parc-alexandre' / 'client'
if carnet.is_dir():
    for nom in COMMUNS:
        src = carnet / nom
        if src.is_file() and src.read_bytes() != (root / 'js' / nom).read_bytes():
            (root / 'js' / nom).write_bytes(src.read_bytes())
            print('repris du Carnet :', nom)

# --- Dater les liens de la page servie en ligne --------------------------
marque = time.strftime('%Y%m%d%H%M', time.gmtime())
html = (root / 'index.html').read_text(encoding='utf-8')
date = re.sub(r'(href="css/style\.css)(\?v=\d+)?"', rf'\1?v={marque}"', html)
date = re.sub(r'(src="js/app\.js)(\?v=\d+)?"', rf'\1?v={marque}"', date)
if date != html:
    (root / 'index.html').write_text(date, encoding='utf-8')
    print('liens datés :', marque)
html = date


# --- Replier les modules en un seul script -------------------------------
def mod(name):
    s = (root / 'js' / name).read_text(encoding='utf-8')
    s = re.sub(r'^import .*?;\s*$', '', s, flags=re.M)
    s = re.sub(r'^export (const|function|async function)', r'\1', s, flags=re.M)
    return s


js = '\n'.join(mod(n) for n in ['config.js', 'api.js', 'posters.js', 'parcours.js', 'plan.js', 'app.js'])
css = (root / 'css' / 'style.css').read_text(encoding='utf-8')
data = (root / 'data' / 'attractions.json').read_text(encoding='utf-8').replace('</', '<\\/')

# Les illustrations voyagent avec la page : une par attraction, repliées en un
# seul objet. Sans cela il faudrait 45 requêtes, et le fichier unique perdrait
# tout son intérêt.
import json as _json
art = {f.stem: f.read_text(encoding='utf-8').strip() for f in sorted((root / 'illustrations').glob('*.svg'))}
art_json = _json.dumps(art, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

# La racine du dépôt est servie telle quelle par d'autres hébergeurs (un Worker
# Cloudflare, un serveur local), qui ne voient pas dist/. Le même objet y est
# donc écrit en fichier, que la page va chercher quand elle n'est pas repliée.
(root / 'illustrations' / 'index.json').write_text(
    _json.dumps(art, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# --- Fichiers à part, nommés d'après leur contenu -------------------------
# La page ne garde que sa structure. Styles, scripts et données vont dans
# dist/assets/, sous un nom qui contient l'empreinte de leur contenu : le
# navigateur les garde un an sans redemander, et une publication ne fait
# retélécharger que ce qui a vraiment changé (en général, les données).
# La cohérence reste garantie : une nouvelle page pointe vers de nouveaux noms.
import hashlib, subprocess, shutil as _sh
ESBUILD = next((c for c in [_sh.which('esbuild'), '/opt/npm-tools/node_modules/.bin/esbuild'] if c and pathlib.Path(c).exists()), None)

def minifier(code, loader):
    """Minifie avec esbuild s'il est installé ; sinon le code part tel quel."""
    if not ESBUILD:
        return code
    r = subprocess.run([ESBUILD, '--minify', f'--loader={loader}', '--charset=utf8', '--legal-comments=none'],
                       input=code.encode('utf-8'), capture_output=True)
    if r.returncode != 0:
        raise SystemExit('esbuild : ' + r.stderr.decode('utf-8', 'replace'))
    return r.stdout.decode('utf-8')

assets = root / 'dist' / 'assets'
if assets.exists():
    _sh.rmtree(assets)
assets.mkdir(parents=True)

def ecrire(nom, ext, contenu):
    h = hashlib.sha256(contenu.encode('utf-8')).hexdigest()[:10]
    (assets / f'{nom}.{h}.{ext}').write_text(contenu, encoding='utf-8')
    return f'assets/{nom}.{h}.{ext}'

css_f = ecrire('style', 'css', minifier(css, 'css'))
communs_code = ';\n'.join((root / 'js' / n).read_text(encoding='utf-8') for n in COMMUNS)
communs_f = ecrire('communs', 'js', minifier(communs_code, 'js'))
donnees = _json.dumps(_json.loads(data.replace('<\\/', '</')), ensure_ascii=False, separators=(',', ':'))
data_f = ecrire('donnees', 'js', 'window.__CHRONIQUES_DATA__=' + donnees + ';')
app_f = ecrire('app', 'js', minifier('(function(){\n' + js + '\n})();', 'js'))

html = re.sub(r'<link rel="stylesheet" href="css/style\.css(?:\?v=\d+)?">',
              lambda _: f'<link rel="stylesheet" href="{css_f}">', html, count=1)
# Les cinq scripts communs avec le Carnet : un seul fichier, à la place du premier.
for i, nom in enumerate(COMMUNS):
    html, n = re.subn(r'<script src="js/' + re.escape(nom) + r'"></script>\n?',
                      (lambda _: f'<script src="{communs_f}"></script>\n') if i == 0 else '', html, count=1)
    assert n == 1, nom + ' introuvable dans index.html'
html = re.sub(r'<script type="module" src="js/app\.js(?:\?v=\d+)?"></script>',
              lambda _: f'<script src="{data_f}"></script>\n<script src="{app_f}"></script>', html, count=1)
assert css_f in html and data_f in html and app_f in html, 'le remplacement a manqué sa cible'
# Les premiers octets utiles : le navigateur commence à chercher les fichiers
# avant même d'avoir lu toute la page.
html = html.replace('</title>', '</title>\n' + ''.join(
    f'<link rel="preload" href="{f}" as="{a}">' for f, a in [(css_f, 'style'), (data_f, 'script'), (app_f, 'script')]), 1)

# Les anciennes illustrations SVG (180 Ko) ne servent qu'à la galerie d'une
# fiche : elles ne sont plus repliées dans la page, mais chargées après coup.
(root / 'dist' / 'illustrations').mkdir(parents=True, exist_ok=True)
(root / 'dist' / 'illustrations' / 'index.json').write_text(
    _json.dumps(art, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# --- Le service worker porte le marqueur comme clé de cache ---------------
# Changer ce nom suffit à périmer tout ce qu'un visiteur avait gardé en local,
# sans quoi une installation sur l'écran d'accueil servirait l'ancienne version
# indéfiniment.
import shutil
sw = (root / 'sw.js').read_text(encoding='utf-8')
sw_date = re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{marque}';", sw, count=1)
if sw_date != sw:
    (root / 'sw.js').write_text(sw_date, encoding='utf-8')

(root / 'dist').mkdir(exist_ok=True)

# Le fichier unique n'est unique que pour la page : le service worker, le
# manifeste et les icônes doivent rester des fichiers à part, c'est ainsi
# qu'iOS les réclame.
(root / 'dist' / 'sw.js').write_text(sw_date, encoding='utf-8')
shutil.copytree(root / 'app', root / 'dist' / 'app', dirs_exist_ok=True)
(root / 'dist' / 'index.html').write_text(html, encoding='utf-8')
(root / '.check').mkdir(exist_ok=True)
(root / '.check' / 'bundle.js').write_text('(function(){\n' + js + '\n})();', encoding='utf-8')
print('built', len(html))

# Secrets des attractions pour « Le saviez-vous ? » sur l'accueil du Carnet.
_attr = _json.loads((root / 'data' / 'attractions.json').read_text(encoding='utf-8'))['attractions']
_secrets = [{'id': a['id'], 'nom': a['name'], 's': s} for a in _attr for s in (a.get('secrets') or []) if len(s) <= 320]
(root / 'dist' / 'secrets.json').write_text(_json.dumps(_secrets, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('secrets', len(_secrets))

# Attractions pour l'Encyclopédie du Carnet : parc, land, ouverture et toutes les anecdotes.
_encyclo = [{'id': a['id'], 'nom': a['name'], 'parc': a['park'], 'land': a['land'], 'accroche': a.get('tagline') or '',
             'ouverture': ((a.get('fiche') or {}).get('opening') or {}).get('label') or '', 'secrets': a.get('secrets') or []} for a in _attr]
(root / 'dist' / 'encyclo.json').write_text(_json.dumps(_encyclo, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('encyclo', len(_encyclo))
