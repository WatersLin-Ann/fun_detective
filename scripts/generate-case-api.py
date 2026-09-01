import json
import os

# 读取所有案例，仅保留生成器所需字段以控制文件体积
cases = []
cases_dir = 'cases'

for root, dirs, files in os.walk(cases_dir):
    for f in files:
        if f.endswith('.json'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as fp:
                data = json.load(fp)

            # 计算slug：与站点 caseLoader 口径一致
            rel_path = os.path.relpath(filepath, cases_dir).replace('\\', '/')
            parts = rel_path.replace('.json', '').split('/')
            source_type = parts[0] if len(parts) > 0 else '未分类'
            region = parts[1] if len(parts) > 1 else '未分类'
            case_name = data.get('基本信息', {}).get('案件名称') or (parts[2] if len(parts) > 2 else f)

            slug = f"{source_type}/{region}/{case_name}"

            # 仅提取生成器需要的字段
            basic = data.get('基本信息', {})
            design = data.get('设计视图', {})
            story = data.get('故事视图', {})

            slim = {
                'slug': slug,
                'sourceType': source_type,
                'region': region,
                '基本信息': {
                    '案件名称': basic.get('案件名称', ''),
                    '一句话简介': basic.get('一句话简介', ''),
                    '案件类型': basic.get('案件类型', ''),
                },
                '故事视图': {
                    '故事摘要': story.get('故事摘要', ''),
                    '结局': story.get('结局/真相', story.get('结局', '')),
                },
                '设计视图': {
                    '核心诡计简述': design.get('核心诡计简述', ''),
                    '诡计类型': design.get('诡计类型', []),
                    '线索链': design.get('线索链', []),
                    '难度评分': design.get('难度评分', {}),
                    '可复用机制': design.get('可复用机制', []),
                    '红鲱鱼/误导': design.get('红鲱鱼/误导', []),
                },
            }

            cases.append(slim)

# 按录入日期排序（元数据已被精简，用案件名称排序兜底）
cases.sort(key=lambda x: x.get('基本信息', {}).get('案件名称', ''))

# 输出到public/api/case-data.json
output_path = 'public/api/case-data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(cases, f, ensure_ascii=False, separators=(',', ':'))

print(f'已生成 {len(cases)} 个案例数据到 {output_path}')
print(f'文件大小: {os.path.getsize(output_path) / 1024:.1f} KB')
