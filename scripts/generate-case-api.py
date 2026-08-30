import json
import os

# 读取所有案例
cases = []
cases_dir = 'cases'

for root, dirs, files in os.walk(cases_dir):
    for f in files:
        if f.endswith('.json'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
            
            # 计算slug
            rel_path = os.path.relpath(filepath, cases_dir).replace('\\', '/')
            parts = rel_path.replace('.json', '').split('/')
            source_type = parts[0] if len(parts) > 0 else '未分类'
            region = parts[1] if len(parts) > 1 else '未分类'
            name = parts[2] if len(parts) > 2 else f
            
            slug = f"{source_type}/{region}/{name}"
            
            # 添加slug和sourceType、region
            data['slug'] = slug
            data['sourceType'] = source_type
            data['region'] = region
            
            cases.append(data)

# 按录入日期排序
cases.sort(key=lambda x: x.get('元数据', {}).get('录入日期', ''), reverse=True)

# 输出到public/api/case-data.json
output_path = 'public/api/case-data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(cases, f, ensure_ascii=False, indent=2)

print(f'已生成 {len(cases)} 个案例数据到 {output_path}')
print(f'文件大小: {os.path.getsize(output_path) / 1024:.1f} KB')
