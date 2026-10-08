from pathlib import Path
from docx import Document
from hashlib import sha256
import json, re

root = Path(__file__).resolve().parents[2]
target = root/'output'/'任务3'/'校园网服务页.html'
evidence = root/'evidence'/'任务3'
guide = root/'output'/'任务1'/'校园网办事指南.docx'
workbook = root/'output'/'任务2'/'设备台账分析.xlsx'
paragraphs = [p.text.strip() for p in Document(guide).paragraphs if p.text.strip()]
text = target.read_text(encoding='utf-8')
qas = json.loads(re.search(r'const qas = (.*?);\n', text).group(1))

def para(start):
    return next(t for t in paragraphs if t.startswith(start))

qas[2]['a'] = para('至少填写：') + '\n' + para('账号、密码均无需提供。')
qas[3]['source'] = para('【来源：01，S1—S4；02，第1页，R1—R3；03').removeprefix('【来源：').removesuffix('】')
qas[4]['a'] = para('【材料明确】T04 记录：') + '\n' + para('【判断】不能据此确定')
for qa in qas:
    assert qa['q'] in paragraphs, qa['q']
    assert all(piece in '\n'.join(paragraphs) for piece in qa['a'].split('\n')), qa['q']
text = re.sub(r'const qas = .*?;\n', lambda _: 'const qas = '+json.dumps(qas,ensure_ascii=False)+';\n', text, count=1)

text = text.replace('.qa-card p { margin:0 0 12px; font-size:.95rem; }', '.qa-card p { margin:0 0 12px; font-size:.95rem; white-space:pre-line; }')
text = text.replace('.no-result { grid-column:', '''.clear-search { padding:10px 15px; border:1px solid #b9d5df; background:#e7f3f7; color:#15566b; border-radius:11px; font-weight:700; white-space:nowrap; }
.clear-search:disabled { color:#84939e; border-color:#dde5eb; background:#f1f5f7; cursor:default; }
.table-hint { display:none; color:var(--muted); font-size:.83rem; margin:0 0 10px; }
.source-key { margin-top:13px; padding-top:9px; border-top:1px dashed var(--line); }
.source-key p { margin:5px 0; }
.no-result { grid-column:''')
text = text.replace('.analytics-grid { grid-template-columns:1fr; } .qa-list { grid-template-columns:1fr; }', '.analytics-grid { grid-template-columns:1fr; } .qa-list { grid-template-columns:1fr; } .table-hint { display:block; }')
text = text.replace('.qa-tools { display:block; } .result-count { display:block; margin-top:7px; }', '.qa-tools { display:flex; flex-wrap:wrap; gap:9px; } .search-wrap { flex-basis:100%; } .result-count { margin-left:auto; }')
text = text.replace('<div class="result-count" id="qa-count"></div>', '<button type="button" class="clear-search" id="clear-search" disabled>清空搜索</button><div class="result-count" id="qa-count" role="status" aria-live="polite"></div>')
text = text.replace('<div class="qa-list" id="qa-list"></div>', '<div class="qa-list" id="qa-list" aria-label="办事问答搜索结果"></div>')
text = text.replace('<span class="current-count" id="device-count"></span>', '<span class="current-count" id="device-count" role="status" aria-live="polite"></span>')
text = text.replace('<div class="table-card"><table>', '<p class="table-hint">设备表可左右滑动，查看状态、原始状态和备注。</p><div class="table-card" tabindex="0" aria-label="设备明细，可横向滚动"><table>')
text = text.replace('  </div>\n</section>\n<section id="qa"', '  </div>\n  <p class="source">【来源：04，U1「替代关系」、U2「最终维护安排」、U3「影响范围」；03，第1页，M3「变更说明」】</p>\n</section>\n<section id="qa"', 1)
old_footer = '<p>任务一来源保留原指南中的 03/04 维护通知、01/02 报修材料和 06 报修记录定位；任务二统计按合并重复后的整理记录计算。</p>'
source_lines = [s for s in paragraphs if re.match(r'^(01|02|03|04|06)：',s)]
new_footer = '<p>网页内容取自 output/任务1/校园网办事指南.docx；设备数据与统计取自 output/任务2/设备台账分析.xlsx 的“整理后台账”“地点统计”“状态统计”。所有数据均已内嵌在本页。</p><div class="source-key"><strong>问答中的来源编号（沿用任务一最终指南）</strong>'+''.join('<p>'+s+'</p>' for s in source_lines)+'</div>'
assert old_footer in text
text = text.replace(old_footer, new_footer)
text = text.replace("  $('qa-count').textContent = query ?", "  $('clear-search').disabled = $('qa-search').value.length === 0;\n  $('qa-count').textContent = query ?")
text = text.replace("'<div class=\"no-result\">无匹配结果，请换一个关键词。</div>'", "'<div class=\"no-result\" role=\"status\">无匹配结果。请换一个关键词，或点击“清空搜索”恢复全部 5 条问答。</div>'")
text = text.replace("    const merged=item['是否经过合并']==='是' ? `<span class=\"badge badge-warn\">${escapeHtml(item['是否经过合并'])}</span>` : escapeHtml(item['是否经过合并']);", "    const locationText=item['地点']==='未登记' ? `<span class=\"badge badge-warn\">未登记</span>` : escapeHtml(item['地点']);")
text = text.replace("<td>${escapeHtml(item['地点'])}</td>", "<td>${locationText}</td>")
text = text.replace("  $('qa-search').addEventListener('input',renderQa); $('location-filter').addEventListener('change',renderDevices);", "  $('qa-search').addEventListener('input',renderQa);\n  $('clear-search').addEventListener('click',()=>{ $('qa-search').value=''; renderQa(); $('qa-search').focus(); });\n  $('location-filter').addEventListener('change',renderDevices);")
target.write_text(text, encoding='utf-8')
(evidence/'最终成果引用核对.json').write_text(json.dumps({
    'guide': {'path':str(guide),'sha256':sha256(guide.read_bytes()).hexdigest()},
    'workbook': {'path':str(workbook),'sha256':sha256(workbook.read_bytes()).hexdigest()},
    'qaExactTextMatched': True, 'questions': qas,
    'improvements':['新增清空搜索按钮及无结果恢复说明','维护区标注来源和页底真实文件编号对照','未登记地点醒目标记与手机横向表格提示'],
}, ensure_ascii=False, indent=2), encoding='utf-8')
script = re.search(r'<script>([\s\S]*?)</script>',text).group(1)
(evidence/'网页内嵌脚本_检查.js').write_text(script, encoding='utf-8')
print('已完成优化，5条问答答案逐段与任务一最终正文一致。')
print('single HTML bytes:',target.stat().st_size)
