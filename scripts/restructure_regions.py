# -*- coding: utf-8 -*-
"""
地区合理化改造脚本：
1. 将 cases/类型/欧美/ 拆分为具体国家目录
2. 将 cases/类型/其他/ 拆分为具体国家目录
3. 修改 JSON 中地区字段为具体国家，新增大洲字段
"""
import json
import os
import shutil

CASES_DIR = r"E:\Work\AIProjects\fun_detective\cases"

# 国家归属映射表：文件名(不含扩展名) -> (国家, 大洲)
# 基于作者国籍、制作公司、案发地等综合判断
COUNTRY_MAP = {
    # ===== 推理小说-欧美 =====
    "X的悲剧": ("美国", "北美"),
    "Y的悲剧": ("美国", "北美"),
    "三口棺材": ("美国", "北美"),  # 约翰·狄克森·卡尔，美国人
    "东方快车谋杀案": ("英国", "欧洲"),
    "双重赔偿": ("美国", "北美"),
    "啤酒谋杀案": ("英国", "欧洲"),
    "尼罗河上的惨案": ("英国", "欧洲"),
    "希腊棺材之谜": ("美国", "北美"),
    "无人生还": ("英国", "欧洲"),
    "歪曲的枢纽": ("美国", "北美"),
    "漫长的告别": ("美国", "北美"),
    "燃烧的法庭": ("美国", "北美"),
    "犹大之窗": ("美国", "北美"),
    "罗杰疑案": ("英国", "欧洲"),
    "荷兰鞋之谜": ("美国", "北美"),
    "血字的研究": ("英国", "欧洲"),
    "邮差总按两次铃": ("美国", "北美"),
    "阳光下的罪恶": ("英国", "欧洲"),
    "马耳他之鹰": ("美国", "北美"),

    # ===== 影视-欧美 =====
    "七宗罪": ("美国", "北美"),
    "恐怖游轮": ("英国", "欧洲"),
    "控方证人": ("美国", "北美"),  # 1957年比利·怀尔德版
    "消失的爱人": ("美国", "北美"),
    "禁闭岛": ("美国", "北美"),
    "穆赫兰道": ("美国", "北美"),
    "致命ID": ("美国", "北美"),
    "记忆碎片": ("美国", "北美"),
    "非常嫌疑犯": ("美国", "北美"),

    # ===== 游戏-欧美 =====
    "Among Us": ("美国", "北美"),  # InnerSloth
    "传送门2": ("美国", "北美"),  # Valve
    "底特律：变人": ("法国", "欧洲"),  # Quantic Dream
    "心灵杀手": ("芬兰", "欧洲"),  # Remedy
    "暴雨": ("法国", "欧洲"),  # Quantic Dream
    "极乐迪斯科": ("爱沙尼亚", "欧洲"),  # ZA/UM
    "逃生": ("加拿大", "北美"),  # Red Barrels
    "黑色洛城": ("美国", "北美"),  # Rockstar发行，Team Bondi开发但归为美国
    "黑镜：潘达斯奈基": ("英国", "欧洲"),  # 英国剧集

    # ===== 真实案件-欧美 =====
    "十二宫杀手": ("美国", "北美"),
    "山姆之子": ("美国", "北美"),
    "开膛手杰克": ("英国", "欧洲"),
    "杰夫瑞·达莫": ("美国", "北美"),
    "林德伯格绑架案": ("美国", "北美"),
    "泰德·邦迪": ("美国", "北美"),
    "玛德琳·麦卡恩失踪案": ("葡萄牙", "欧洲"),  # 案发地葡萄牙
    "约翰·韦恩·盖西": ("美国", "北美"),
    "莉齐·博登案": ("美国", "北美"),
    "蓝可儿事件": ("美国", "北美"),  # 案发地洛杉矶
    "辛普森杀妻案": ("美国", "北美"),
    "黑色大丽花": ("美国", "北美"),

    # ===== 真实案件-其他 =====
    "华城连环杀人案": ("韩国", "亚洲"),
    "李亨浩诱拐事件": ("韩国", "亚洲"),
    "迪亚特洛夫事件": ("俄罗斯", "欧洲"),  # 苏联，现俄罗斯
    "青蛙少年失踪案": ("韩国", "亚洲"),
}

# 已有明确国家的地区（不需要移动）
EXISTING_REGIONS = {"中国", "日本"}

# 大洲映射（已有地区）
CONTINENT_MAP = {
    "中国": "亚洲",
    "日本": "亚洲",
}


def process_all():
    moved_count = 0
    updated_count = 0

    for source_type in os.listdir(CASES_DIR):
        type_path = os.path.join(CASES_DIR, source_type)
        if not os.path.isdir(type_path):
            continue
        # 跳过空目录和非标准目录
        if source_type in ("影视综艺", "游戏案例", "虚构推理"):
            continue

        for region in os.listdir(type_path):
            region_path = os.path.join(type_path, region)
            if not os.path.isdir(region_path):
                continue

            # 处理需要拆分的地区
            if region in ("欧美", "其他"):
                for fn in os.listdir(region_path):
                    if not fn.endswith('.json'):
                        continue
                    case_name = fn.replace('.json', '')
                    if case_name not in COUNTRY_MAP:
                        print(f"  [警告] 未找到国家映射: {source_type}/{region}/{fn}")
                        continue

                    country, continent = COUNTRY_MAP[case_name]
                    # 创建目标国家目录
                    target_dir = os.path.join(type_path, country)
                    os.makedirs(target_dir, exist_ok=True)

                    # 移动文件
                    src = os.path.join(region_path, fn)
                    dst = os.path.join(target_dir, fn)
                    shutil.move(src, dst)
                    moved_count += 1

                    # 修改 JSON
                    with open(dst, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    data['基本信息']['地区'] = country
                    data['基本信息']['大洲'] = continent
                    with open(dst, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    updated_count += 1
                    print(f"  [移动] {source_type}/{region}/{fn} -> {source_type}/{country}/{fn} ({continent})")

                # 删除空的旧地区目录
                if not os.listdir(region_path):
                    os.rmdir(region_path)
                    print(f"  [删除空目录] {source_type}/{region}")

            # 已有明确国家的地区，补充大洲字段
            elif region in EXISTING_REGIONS:
                continent = CONTINENT_MAP[region]
                for fn in os.listdir(region_path):
                    if not fn.endswith('.json'):
                        continue
                    fp = os.path.join(region_path, fn)
                    with open(fp, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    # 确保地区字段正确
                    data['基本信息']['地区'] = region
                    data['基本信息']['大洲'] = continent
                    with open(fp, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    updated_count += 1

    print(f"\n完成：移动 {moved_count} 个文件，更新 {updated_count} 个 JSON")


if __name__ == "__main__":
    process_all()
