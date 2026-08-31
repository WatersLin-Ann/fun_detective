import os, json
cases_dir = r'E:\Work\AIProjects\fun_detective\cases'
case_ids = []
other_ids = []
for r, d, fs in os.walk(cases_dir):
    for f in fs:
        if f.endswith('.json'):
            fp = os.path.join(r, f)
            try:
                data = json.load(open(fp, 'r', encoding='utf-8'))
                cid = data.get('id', '')
                if cid.startswith('case-'):
                    case_ids.append(cid)
                else:
                    other_ids.append(cid)
            except:
                pass

print(f'case-XXX格式的案件: {len(case_ids)} 个')
if case_ids:
    print(f'  范围: {min(case_ids)} ~ {max(case_ids)}')
print(f'其他格式的文件: {len(other_ids)} 个')
print(f'  示例: {other_ids[:5]}')

new_cases = [cid for cid in case_ids if int(cid.split('-')[1]) >= 58]
print(f'case-058及以上的新案件: {len(new_cases)} 个')
print(f'  列表: {sorted(new_cases)}')

missing = [f'case-{i:03d}' for i in range(58, 158) if f'case-{i:03d}' not in case_ids]
print(f'缺失的ID(case-058~157): {len(missing)} 个')
print(f'  列表: {missing}')
