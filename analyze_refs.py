import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base = r'E:\Work\AIProjects\fun_detective\cases'

# 收集所有有参考链接的案件，展示格式样本
samples = []
for root, dirs, files in os.walk(base):
    for fname in files:
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(root, fname)
        try:
            with open(fpath, encoding='utf-8') as f:
                d = json.load(f)
        except:
            continue
        ref = d.get('基本信息', {}).get('参考链接')
        if ref and len(ref) > 0:
            rel = os.path.relpath(fpath, base)
            samples.append((rel, ref))

# 输出前15个样本
out = []
out.append(f'Total cases with ref links: {len(samples)}')
out.append('')
out.append('=== SAMPLES (first 15) ===')
for rel, ref in samples[:15]:
    out.append(f'--- {rel} ---')
    for link in ref:
        out.append(f"  [{link.get('类型','?')}] {link.get('标题','?')} -> {link.get('URL','?')}")
    out.append('')

# 统计链接类型分布
type_count = {}
for rel, ref in samples:
    for link in ref:
        t = link.get('类型', '未标注')
        type_count[t] = type_count.get(t, 0) + 1

out.append('=== LINK TYPE DISTRIBUTION ===')
for t, c in sorted(type_count.items(), key=lambda x: -x[1]):
    out.append(f'  {t}: {c}')

# 统计URL域名分布
out.append('')
out.append('=== URL DOMAIN SAMPLES ===')
domains = set()
for rel, ref in samples:
    for link in ref:
        url = link.get('URL', '')
        if url:
            try:
                domain = url.split('/')[2]
                domains.add(domain)
            except:
                pass
for d in sorted(domains):
    out.append(f'  {d}')

with open(r'E:\Work\AIProjects\fun_detective\ref_analysis.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print('Analysis done. Samples:', len(samples))
