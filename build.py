import re,pathlib
root=pathlib.Path(__file__).parent
def mod(name):
    s=(root/'js'/name).read_text(encoding='utf-8')
    s=re.sub(r'^import .*?;\s*$','',s,flags=re.M)
    s=re.sub(r'^export (const|function|async function)',r'\1',s,flags=re.M)
    return s
js='\n'.join(mod(n) for n in ['config.js','api.js','posters.js','reviews.js','app.js'])
css=(root/'css'/'style.css').read_text(encoding='utf-8')
data=(root/'data'/'attractions.json').read_text(encoding='utf-8').replace('</','<\\/')
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="css/style.css">','<style>\n'+css+'\n</style>')
html=html.replace('<script type="module" src="js/app.js"></script>','<script type="application/json" id="app-data">'+data+'</script>\n<script>\n(function(){\n'+js+'\n})();\n</script>')
(root/'dist').mkdir(exist_ok=True)
(root/'dist'/'index.html').write_text(html,encoding='utf-8')
(root/'dist'/'bundle.check.js').write_text('(function(){\n'+js+'\n})();',encoding='utf-8')
print('built',len(html))
