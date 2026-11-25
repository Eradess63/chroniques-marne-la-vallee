"""
Construit dist/index.html : un seul fichier, sans module ni requête, qui
s'ouvre aussi bien depuis une clé USB que depuis un disque dur.

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

# Les liens datés ne doivent pas gêner le repli : on vise le motif, pas la chaîne exacte.
# Le remplacement passe par une fonction : sinon re.sub interpréterait les
# antislashs du CSS et du JS comme des références de groupe.
html = re.sub(r'<link rel="stylesheet" href="css/style\.css(?:\?v=\d+)?">',
              lambda _: '<style>\n' + css + '\n</style>', html, count=1)
html = re.sub(r'<script type="module" src="js/app\.js(?:\?v=\d+)?"></script>',
              lambda _: '<script type="application/json" id="app-data">' + data + '</script>\n'
                        '<script>\n(function(){\n' + js + '\n})();\n</script>', html, count=1)

# Le plan et « Près de moi » sont des scripts ordinaires (partagés avec le
# Carnet de parc) : repliés tels quels, avant le script principal.
for nom in ['park-map.js', 'nearby.js', 'itinerary.js', 'wait-history.js', 'journal.js']:
    code = (root / 'js' / nom).read_text(encoding='utf-8').replace('</', '<\\/')
    html, n = re.subn(r'<script src="js/' + re.escape(nom) + r'"></script>',
                      lambda _: '<script>\n' + code + '\n</script>', html, count=1)
    assert n == 1, nom + ' introuvable dans index.html'

assert '<style>' in html and 'app-data' in html, 'le repli a manqué sa cible'

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
