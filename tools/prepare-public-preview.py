"""Build an auditable static candidate preview outside the source repository.
Reads a pinned Git commit only. Never executes repository scripts or publishes.
The resulting URL is for direct testing in Dot's cloud browser, without a local executor.
"""
import argparse
import difflib
import hashlib
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--repo', type=Path, default=Path.home()/'Dev/projects/erin')
parser.add_argument('--sha', required=True)
parser.add_argument('--pr', type=int, required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--adapter-version', type=int, default=1)
args = parser.parse_args()
if not re.fullmatch('[0-9a-f]{40}', args.sha) or args.pr <= 0 or args.adapter_version <= 0:
    raise SystemExit('A positive PR number and full commit SHA are required')
repo = args.repo.resolve()
out = args.output.resolve()
if out == repo or repo in out.parents:
    raise SystemExit('Output must be outside the source repository')
if out.exists() and any(p.is_symlink() or '.git' in p.parts for p in out.rglob('*')):
    raise SystemExit('Output may not contain symlinks or a Git checkout')

def git(*words):
    return subprocess.check_output(['git', *words], cwd=repo)

def read(path):
    return git('show', args.sha + ':' + path)

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

if git('cat-file', '-t', args.sha).strip() != b'commit':
    raise SystemExit('Source must be a commit')
tracked = git('ls-tree', '-r', '--name-only', args.sha).decode().splitlines()
allowed = {'.js', '.css', '.html', '.json', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.mp3', '.ogg', '.wav', '.txt'}
paths = sorted(path for path in tracked if path.startswith('games/survivor/')
               and not any(part in {'tests', 'tools', 'coord', 'docs', '.git', '.github', 'screenshots', 'logs'} for part in Path(path).parts)
               and (Path(path).suffix in allowed or path == 'games/survivor/assets/CREDITS.md'))
originals = {path: read(path) for path in paths}
version = json.loads(originals['games/survivor/version.json'])['version']
if not re.fullmatch('[A-Za-z0-9-]+', version):
    raise SystemExit('Invalid source version')
candidate = f'pr-{args.pr}/{args.sha}' + ('' if args.adapter_version == 1 else f'/adapter-{args.adapter_version}')
base = f'/erin-preview/{candidate}/'
prefix = f'erin-preview:pr-{args.pr}:{args.sha}:' + ('' if args.adapter_version == 1 else f'adapter-{args.adapter_version}:')
url = 'https://stasischen.github.io' + base + 'games/survivor/'

# Five audited literal keys; the legacy settings and both record variants must also isolate.
key_files = {
    'games/survivor/data/schema.js': ["erin-survivor-maker-v1"],
    'games/survivor/engine/state.js': ["erin-survivor-settings-v3", "erin-survivor-player-settings-v1", "erin-survivor-maker-best-seconds-v1", "erin-survivor-best-seconds-v1"]
}
storage_uses = []
for path, raw in originals.items():
    if Path(path).suffix not in {'.js', '.html'}:
        continue
    for number, line in enumerate(raw.decode().splitlines(), 1):
        if re.search(r'\b(?:localStorage|sessionStorage)\b', line):
            storage_uses.append({'source_path': path, 'line': number, 'source': line.strip()})
if {x['source_path'] for x in storage_uses} != {
        'games/survivor/data/schema.js', 'games/survivor/engine/state.js', 'games/survivor/engine/loop.js'}:
    raise SystemExit('Storage surface changed; audit required')
contracts = {
    'games/survivor/data/schema.js': [('getItem','KEY'),('setItem','KEY')],
    'games/survivor/engine/loop.js': [('setItem','RECORD_KEY')],
    'games/survivor/engine/state.js': [('getItem','SETTINGS_KEY'),('getItem','PLAYER_SETTINGS_KEY'),('getItem','key'),('setItem','PLAYER_SETTINGS_KEY'),('setItem','PLAYER_SETTINGS_KEY'),('getItem','RECORD_KEY')]
}
for path, expected in contracts.items():
    text = originals[path].decode()
    found = re.findall(r'\blocalStorage\.(\w+)\(\s*([A-Za-z_$][A-Za-z0-9_$.]*)', text)
    if sorted(found) != sorted(expected) or len(found) != len(re.findall(r'\blocalStorage\b', text)):
        raise SystemExit('Storage call/key contract changed; audit required: ' + path)
state = originals['games/survivor/engine/state.js'].decode()
if sorted(re.findall(r'\breadLegacy\(([^)]*)\)', state)) != ['SETTINGS_KEY','SurvivorData.KEY']:
    raise SystemExit('Legacy storage migration surface changed; audit required')
for expected in ['localStorage.getItem(SETTINGS_KEY)', 'localStorage.getItem(PLAYER_SETTINGS_KEY)',
                 'localStorage.getItem(RECORD_KEY)', "readLegacy(SETTINGS_KEY)", 'readLegacy(SurvivorData.KEY)',
                 'localStorage.setItem(PLAYER_SETTINGS_KEY,']:
    if expected not in state:
        raise SystemExit('Storage call contract changed: ' + expected)
if re.search(r'\bsessionStorage\b', state):
    raise SystemExit('Unexpected sessionStorage')

payload = {}
entries = []
transforms = []
diffs = []

def record(rel, deployed, original=None, source_path=None, changes=()):
    payload[rel] = deployed
    entries.append({'path': rel, 'source_path': source_path,
                    'original_bytes': None if original is None else len(original),
                    'original_sha256': None if original is None else digest(original),
                    'deployed_bytes': len(deployed), 'deployed_sha256': digest(deployed),
                    'transformations': list(changes)})
    if changes:
        transforms.append({'path': rel, 'source_path': source_path, 'changes': list(changes)})
        before = '' if original is None else original.decode()
        after = deployed.decode()
        diffs.append(''.join(difflib.unified_diff(before.splitlines(True), after.splitlines(True),
                     fromfile='generated/no-source' if source_path is None else 'source/' + source_path,
                     tofile='deployed/' + rel)))

favicon = '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Crect width=%2716%27 height=%2716%27 fill=%27%232389b5%27/%3E%3C/svg%3E">'
for path, raw in originals.items():
    deployed = raw
    changes = []
    if path in key_files:
        text = raw.decode()
        for old in key_files[path]:
            literal = ("'" + old + "'") if path.endswith('schema.js') else ('"' + old + '"')
            if text.count(literal) != 1:
                raise SystemExit('Storage literal not unique: ' + old)
            text = text.replace(literal, literal[0] + prefix + old + literal[-1])
            changes.append('storage-key-literal: ' + old + ' -> ' + prefix + old)
        deployed = text.encode()
    if path == 'games/survivor/index.html':
        text = raw.decode()
        patterns = [r'^\s*<link rel="manifest"[^\n]*\n', r'^\s*<link rel="apple-touch-icon"[^\n]*\n',
                    r'^\s*<meta name="apple-mobile-web-app-capable"[^\n]*\n',
                    r'^\s*<meta name="apple-mobile-web-app-title"[^\n]*\n']
        for pattern in patterns:
            text, count = re.subn(pattern, '', text, flags=re.M)
            if count != 1:
                raise SystemExit('PWA head changed; audit required: ' + pattern)
        if text.count('<head>\n') != 1:
            raise SystemExit('Unexpected HTML head')
        text = text.replace('<head>\n', '<head>\n  ' + favicon + '\n', 1)
        deployed = text.encode()
        changes += ['remove four PWA/install head references', 'add inline preview favicon to avoid origin-root favicon request']
    record(candidate + '/' + path, deployed, raw, path, changes)

record(candidate + '/register-sw.js', b'// Static candidate preview: service worker registration intentionally disabled.\n',
       read('register-sw.js'), 'register-sw.js', ['disable registration only; no unregister or cache deletion'])

def landing(game_href, manifest_href):
    return f'''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Erin 測試版 PR {args.pr}</title>{favicon}
<style>body{{font:18px system-ui;max-width:56rem;margin:3rem auto;padding:0 1rem;color:#142331}}code{{overflow-wrap:anywhere}}a{{color:#075d9b}}li{{margin:.8rem 0}}.test{{padding:1rem;background:#fff0cc;border:2px solid #b67a15}}</style></head><body>
<h1>Erin 公開測試版</h1><p class="test">未合併測試版：此快照供審查與試玩，不代表正式版本。</p>
<ul><li>PR：<a href="https://github.com/stasischen/erin/pull/{args.pr}">#{args.pr}</a></li><li>版本：<code>{version}</code></li><li>來源 SHA：<code>{args.sha}</code></li><li><a href="{game_href}">開始試玩此候選版本</a></li><li><a href="{manifest_href}">來源與部署檔案 hash／變換清單</a></li></ul>
<p>設定、Maker 作品與紀錄依 PR／SHA 隔離；此測試版不註冊 Service Worker，不提供安裝或離線功能。</p>
<p><a href="https://stasischen.github.io/erin/" target="_blank" rel="noopener noreferrer">正式站（外部連結，另開分頁）</a></p></body></html>\n'''.encode()

record('index.html', landing('./'+candidate+'/games/survivor/', './'+candidate+'/preview-manifest.json'), changes=['generate public preview index'])
record(candidate+'/index.html', landing('./games/survivor/', './preview-manifest.json'), read('index.html'), 'index.html', ['replace source homepage with candidate-only landing; production is explicit external link'])
record('.nojekyll', b'', changes=['serve static files without Jekyll'])
readme = f'''# Erin public preview

This directory is a prepared static Pages payload for PR #{args.pr}, source `{args.sha}`, version `{version}`.

Candidate URL: {url}

Publish these prepared files as the Pages branch contents for `stasischen/erin-preview`; do not run source scripts or add CI workflows. The source game repository and its main branch are unchanged by this payload.

The landing pages identify the candidate and link explicitly to the production site. Game viewport and HUD are unchanged. Five storage key literals use a PR-and-full-SHA prefix. Service worker registration and PWA installation references are disabled only in this snapshot; no production worker is unregistered and no cache is deleted. Source `sw.js` and `manifest.webmanifest` are intentionally omitted.

The candidate `preview-manifest.json` lists original and deployed SHA-256 values, allowed transforms, omitted PWA files, and the source storage audit. Its detached `.sha256` covers the manifest itself. `adapter-diff.patch` uses only logical source/deployed paths. No private coordination data, screenshots, logs, tests, tools, Git metadata or workflow files belong in this publication.
'''.encode()
record('README.md', readme, changes=['generate public deployment notes'])

# Fail closed on accidental site-root navigation, private text or non-allowlisted transforms.
private_markers = ['/Users/', '/.local/share/', '/agent-inbox/', str(repo), str(Path.home())]
if Path.home().name not in {'root','user','runner'}:
    private_markers.append(Path.home().name)
for rel, raw in payload.items():
    if any(part in {'coord','docs','tests','tools','.git','.github','screenshots','logs'} for part in Path(rel).parts):
        raise SystemExit('Forbidden publication path: ' + rel)
    if Path(rel).suffix in {'.js','.css','.html','.json','.md','.txt'}:
        text = raw.decode()
        if any(marker in text for marker in private_markers):
            raise SystemExit('Private marker in publication: ' + rel)
        if rel.startswith(candidate+'/games/survivor/') and '/erin/' in text:
            raise SystemExit('Unexpected production-root reference: ' + rel)
        if re.search(r'(?:Storage\.prototype|serviceWorker\.(?:register|unregister)|caches\.(?:delete|open))', text):
            raise SystemExit('Unexpected storage/worker/cache mutation: ' + rel)

omitted = [{'source_path': path, 'original_sha256': digest(read(path)), 'deployed_sha256': None,
            'reason': 'PWA/offline disabled for isolated candidate preview'} for path in ['sw.js','manifest.webmanifest']]
diff_rel = candidate+'/adapter-diff.patch'
payload[diff_rel] = '\n'.join(diffs).encode()
entries.append({'path':diff_rel,'source_path':None,'original_bytes':None,'original_sha256':None,
                'deployed_bytes':len(payload[diff_rel]),'deployed_sha256':digest(payload[diff_rel]),'transformations':['generated logical adapter diff']})
manifest = {'schema_version':1,'adapter_version':args.adapter_version,'project_repo':'stasischen/erin','pr':args.pr,
            'source_commit':args.sha,'version':version,'candidate_path':base,'game_url':url,
            'storage_prefix':prefix,'storage_keys':{old:prefix+old for values in key_files.values() for old in values},
            'storage_audit':storage_uses,'transformations':transforms,'omitted_files':omitted,
            'files':sorted(entries,key=lambda row:row['path']),
            'coverage':'all deployed payload files except this manifest and its detached digest',
            'review_scope':'static deployment adaptation only; not gameplay or PR approval'}
manifest_rel = candidate+'/preview-manifest.json'
manifest_raw = (json.dumps(manifest,ensure_ascii=False,sort_keys=True,indent=2)+'\n').encode()
payload[manifest_rel] = manifest_raw
payload[manifest_rel.replace('.json','.sha256')] = (digest(manifest_raw)+'  preview-manifest.json\n').encode()
for rel, raw in payload.items():
    if Path(rel).suffix in {'.js','.css','.html','.json','.md','.txt','.patch','.sha256'}:
        text = raw.decode()
        if any(marker in text for marker in private_markers):
            raise SystemExit('Private marker in final publication: ' + rel)
        if re.search(r'\b01[a-f0-9]{6}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b', text):
            raise SystemExit('Possible private thread identity: ' + rel)
expected = set(payload)
if out.exists():
    extra = {str(p.relative_to(out)) for p in out.rglob('*') if p.is_file()} - expected
    if extra:
        raise SystemExit('Unexpected existing publication files: ' + ', '.join(sorted(extra)))
for rel, raw in payload.items():
    dest = out/rel
    if rel.startswith(candidate+'/') and dest.exists() and dest.read_bytes()!=raw:
        raise SystemExit('Immutable candidate differs; choose a new adapter version and output: ' + rel)
for rel, raw in sorted(payload.items()):
    dest = out/rel
    dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(raw)
assert all((out/rel).read_bytes()==raw for rel,raw in payload.items())
print(json.dumps({'source_commit':args.sha,'version':version,'files':len(payload),
                  'bytes':sum(map(len,payload.values())),'manifest_sha256':digest(manifest_raw),
                  'unchanged_source_files':sum(row['original_sha256']==row['deployed_sha256'] for row in entries if row['original_sha256']),
                  'source_transforms':[row['source_path'] for row in transforms if row['source_path']],
                  'game_url':url,'output':str(out)},ensure_ascii=False))
