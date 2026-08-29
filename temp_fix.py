with open('scripts/data_transformer.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''        if isinstance(linked_cases, list):
            for case_link in linked_cases:
                case_id = case_link if isinstance(case_link, str) else case_link.get("id", "") or case_link.get("record_id", "")
                if case_id:
                    if case_id not in grouped:
                        grouped[case_id] = []
                    grouped[case_id].append(transform_clue_record(record))'''

new = '''        if isinstance(linked_cases, list):
            for case_link in linked_cases:
                if isinstance(case_link, str):
                    case_ids = [case_link]
                elif isinstance(case_link, dict):
                    case_ids = case_link.get("record_ids", [])
                    if not case_ids and case_link.get("id"):
                        case_ids = [case_link.get("id")]
                    if not case_ids and case_link.get("record_id"):
                        case_ids = [case_link.get("record_id")]
                else:
                    case_ids = []
                for case_id in case_ids:
                    if case_id:
                        if case_id not in grouped:
                            grouped[case_id] = []
                        grouped[case_id].append(transform_clue_record(record))'''

if old in content:
    content = content.replace(old, new)
    with open('scripts/data_transformer.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('修改成功')
else:
    print('未找到目标字符串')
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'case_link' in line:
            print(f'  行{i+1}: {line}')
