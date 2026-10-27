"""Exact, fail-closed storage profiles for the static preview adapter."""
import re


def audit_storage(originals):
    key_files = {
        'games/survivor/data/schema.js': ['erin-survivor-maker-v1'],
        'games/survivor/engine/state.js': [
            'erin-survivor-settings-v3', 'erin-survivor-player-settings-v1',
            'erin-survivor-maker-best-seconds-v1', 'erin-survivor-best-seconds-v1'],
    }
    state = originals['games/survivor/engine/state.js'].decode()
    trial_keys = {
        'TRIAL_RECORD_KEY': 'erin-survivor-trial-best-seconds-v1',
        'MAKER_TRIAL_RECORD_KEY': 'erin-survivor-maker-trial-best-seconds-v1',
    }
    declarations = [bool(re.search(r'\bconst\s+' + name + r'\s*=\s*"' + key + r'"\s*;', state))
                    for name, key in trial_keys.items()]
    if any(declarations) != all(declarations):
        raise ValueError('Partial trial storage profile; audit required')
    profile = 'trial-records-7' if all(declarations) else 'legacy-5'
    contracts = {
        'games/survivor/data/schema.js': [('getItem', 'KEY'), ('setItem', 'KEY')],
        'games/survivor/engine/loop.js': [('setItem', 'RECORD_KEY')],
        'games/survivor/engine/state.js': [
            ('getItem', 'SETTINGS_KEY'), ('getItem', 'PLAYER_SETTINGS_KEY'),
            ('getItem', 'key'), ('setItem', 'PLAYER_SETTINGS_KEY'),
            ('setItem', 'PLAYER_SETTINGS_KEY'), ('getItem', 'RECORD_KEY')],
    }
    if profile == 'trial-records-7':
        key_files['games/survivor/engine/state.js'].extend(trial_keys.values())
        exact_choice = 'custom?MAKER_TRIAL_RECORD_KEY:TRIAL_RECORD_KEY'
        contracts['games/survivor/engine/state.js'].extend([
            ('getItem', exact_choice), ('setItem', exact_choice)])
    uses = []
    for path, raw in originals.items():
        if not path.endswith(('.js', '.html')):
            continue
        for number, line in enumerate(raw.decode().splitlines(), 1):
            if re.search(r'\b(?:localStorage|sessionStorage)\b', line):
                uses.append({'source_path': path, 'line': number, 'source': line.strip()})
    if {row['source_path'] for row in uses} != set(contracts):
        raise ValueError('Storage surface changed; audit required')
    for path, expected in contracts.items():
        text = originals[path].decode()
        # Capture the complete first argument: accepting just "custom" would
        # also accept an unaudited ternary branch or a different expression.
        found = [(method, re.sub(r'\s+', '', arg)) for method, arg in
                 re.findall(r'\blocalStorage\.(\w+)\(\s*([^,()]*)', text)]
        if (sorted(found) != sorted(expected)
                or len(found) != len(re.findall(r'\blocalStorage\b', text))):
            raise ValueError('Storage call/key contract changed; audit required: ' + path)
        if re.search(r'\bsessionStorage\b', text):
            raise ValueError('Unexpected sessionStorage: ' + path)
    if sorted(re.findall(r'\breadLegacy\(([^)]*)\)', state)) != ['SETTINGS_KEY', 'SurvivorData.KEY']:
        raise ValueError('Legacy storage migration surface changed; audit required')
    for path, keys in key_files.items():
        text = originals[path].decode()
        quote = "'" if path.endswith('schema.js') else '"'
        for key in keys:
            if text.count(quote + key + quote) != 1:
                raise ValueError('Storage literal not unique: ' + key)
    return key_files, uses, profile
