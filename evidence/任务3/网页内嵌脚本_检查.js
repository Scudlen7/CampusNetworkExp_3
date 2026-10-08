
'use strict';
const maintenance = {"date": "2026 年 10 月 13 日", "time": "22:00—23:30", "area": "教学楼 A、教学楼 B", "access": "无线网络", "dorm": "学生宿舍不在本次维护范围内", "note": "原定 10 月 12 日的维护已取消；有线网络与学生宿舍不在本次维护范围内。", "source": "04，U1「替代关系」、U2「最终维护安排」、U3「影响范围」", "old": "原通知：2026 年 10 月 12 日 22:00—23:00（已由后续调整通知替代）"};
const qas = [{"q": "① 最终安排在什么日期、什么时段？", "a": "2026 年 10 月 13 日 22:00—23:30。原定 10 月 12 日的维护已取消。", "source": "04，U1「替代关系」、U2「最终维护安排」"}, {"q": "② 影响哪些区域、接入方式？学生宿舍在范围内吗？", "a": "仅教学楼 A、教学楼 B 的无线网络可能短时中断。有线网络与学生宿舍不在本次维护范围内。", "source": "03，第1页，M2「原影响范围」；04，U3「影响范围」"}, {"q": "③ 报修至少填什么？要提供账号或密码吗？", "a": "至少填写：故障发生时间、故障地点、问题现象。\n尽可能补充：设备、接入方式、影响人数、报错提示与已尝试的操作；说明是全部网站无法访问，还是仅某个网站无法访问。\n账号、密码均无需提供。工单不得填写账号密码、动态验证码或访问令牌；截图含有这些内容时，应先遮盖再提交。", "source": "02，第1页，R1「必填信息」、R2「不收集的信息」；01，S2「有线与无线」、S4「信息保护」"}, {"q": "④ 校园网每月收费多少？", "a": "材料未提供。现有已读材料均未说明每月收费金额。", "source": "01，S1—S4；02，第1页，R1—R3；03，第1页，M1—M3；04，U1—U3；06，T01—T06（均未说明金额）"}, {"q": "⑤ T04 在 10 月 12 日断网，能认定由维护导致吗？", "a": "【材料明确】T04 记录：2026-10-12 22:10，教学楼 B，无线连接无法访问网页；报修者称「看过旧通知，应该就是维护」，未提供其他证据。调整通知已取消原定 10 月 12 日的维护。\n【判断】不能据此确定，材料未提供足够证据。时间与旧通知吻合不能证明原因；实际原因仍待核验。", "source": "06，T04；04，U1；01，S3「故障处理原则」；02，第1页，R3"}];
const records = [{"原始记录号": 1, "原工作表行号": 6, "资产编号": "A001", "设备类型": "无线接入点", "地点": "教学楼A", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 2, "原工作表行号": 7, "资产编号": "A002", "设备类型": "无线接入点", "地点": "教学楼A", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 3, "原工作表行号": 8, "资产编号": "A003", "设备类型": "交换机", "地点": "教学楼A", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 4, "原工作表行号": 9, "资产编号": "A004", "设备类型": "无线接入点", "地点": "教学楼B", "状态": "维修", "原始状态": "维修", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 5, "原工作表行号": 10, "资产编号": "A005", "设备类型": "交换机", "地点": "教学楼B", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 6, "原工作表行号": 11, "资产编号": "A006", "设备类型": "无线接入点", "地点": "图书馆D", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 7, "原工作表行号": 12, "资产编号": "A007", "设备类型": "无线接入点", "地点": "图书馆D", "状态": "备用", "原始状态": "备用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": "8、9", "原工作表行号": "13、14", "资产编号": "A008", "设备类型": "交换机", "地点": "图书馆D", "状态": "在用", "原始状态": "在用", "是否经过合并": "是", "备注": "原始资产字段完全相同，合并并保留全部来源"}, {"原始记录号": 10, "原工作表行号": 15, "资产编号": "A010", "设备类型": "无线接入点", "地点": "学生宿舍C", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 11, "原工作表行号": 16, "资产编号": "A011", "设备类型": "无线接入点", "地点": "未登记", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "原地点为空，按规则填未登记"}, {"原始记录号": 12, "原工作表行号": 17, "资产编号": "A012", "设备类型": "交换机", "地点": "学生宿舍C", "状态": "维修", "原始状态": "维修", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 13, "原工作表行号": 18, "资产编号": "A013", "设备类型": "无线接入点", "地点": "教学楼A", "状态": "备用", "原始状态": "备用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 14, "原工作表行号": 19, "资产编号": "A014", "设备类型": "交换机", "地点": "教学楼B", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 15, "原工作表行号": 20, "资产编号": "A015", "设备类型": "无线接入点", "地点": "图书馆D", "状态": "待核验", "原始状态": "正常", "是否经过合并": "否", "备注": "原状态“正常”非标准，待核验"}, {"原始记录号": 16, "原工作表行号": 21, "资产编号": "A016", "设备类型": "无线接入点", "地点": "学生宿舍C", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 17, "原工作表行号": 22, "资产编号": "A017", "设备类型": "交换机", "地点": "教学楼A", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 18, "原工作表行号": 23, "资产编号": "A018", "设备类型": "无线接入点", "地点": "教学楼B", "状态": "备用", "原始状态": "备用", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 19, "原工作表行号": 24, "资产编号": "A019", "设备类型": "交换机", "地点": "图书馆D", "状态": "维修", "原始状态": "维修", "是否经过合并": "否", "备注": "—"}, {"原始记录号": 20, "原工作表行号": 25, "资产编号": "A020", "设备类型": "无线接入点", "地点": "学生宿舍C", "状态": "在用", "原始状态": "在用", "是否经过合并": "否", "备注": "—"}];
const locationStats = [{"location": "教学楼A", "count": 5}, {"location": "图书馆D", "count": 5}, {"location": "教学楼B", "count": 4}, {"location": "学生宿舍C", "count": 4}, {"location": "未登记", "count": 1}];
const stateStats = [{"status": "在用", "count": 12}, {"status": "维修", "count": 3}, {"status": "备用", "count": 3}, {"status": "待核验", "count": 1}];
const deviceTotal = 19;
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[ch]));
const normalize = (value) => String(value ?? '').toLocaleLowerCase('zh-CN').replace(/\s+/g,'');
function renderMaintenance() {
  $('maintenance-date').textContent = maintenance.date;
  $('maintenance-time').textContent = maintenance.time;
  $('maintenance-area').textContent = maintenance.area;
  $('maintenance-access').textContent = maintenance.access;
  $('maintenance-dorm').textContent = maintenance.dorm;
  $('maintenance-note').textContent = maintenance.note;
  $('old-notice').textContent = maintenance.old;
}
function renderQa() {
  const query = normalize($('qa-search').value);
  const filtered = qas.filter(item => !query || normalize(item.q + item.a).includes(query));
  $('clear-search').disabled = $('qa-search').value.length === 0;
  $('qa-count').textContent = query ? `找到 ${filtered.length} / ${qas.length} 条` : `共 ${qas.length} 条`;
  $('qa-list').innerHTML = filtered.length ? filtered.map(item => `<article class="qa-card"><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p><div class="source">【来源：${escapeHtml(item.source)}】</div></article>`).join('') : '<div class="no-result" role="status">无匹配结果。请换一个关键词，或点击“清空搜索”恢复全部 5 条问答。</div>';
}
function renderStateStats() {
  $('device-total').textContent = `${deviceTotal} 台`;
  $('state-stats').innerHTML = stateStats.map(item => `<div class="stat-row"><span class="stat-name">${escapeHtml(item.status)}</span><span class="stat-value">${item.count} 台</span></div>`).join('');
}
function renderChart() {
  const svg=$('location-chart'), W=640,H=310,left=66,right=18,top=22,bottom=58,plotW=W-left-right,plotH=H-top-bottom;
  const max=Math.max(...locationStats.map(x=>x.count),1), tickMax=Math.max(5,Math.ceil(max));
  let out='';
  for(let t=0;t<=tickMax;t++) { const y=top+plotH-(t/tickMax)*plotH; out+=`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${y}" y2="${y}"></line><text class="chart-label" x="${left-13}" y="${y+4}" text-anchor="end">${t}</text>`; }
  out+=`<line class="chart-axis" x1="${left}" x2="${W-right}" y1="${top+plotH}" y2="${top+plotH}"></line><line class="chart-axis" x1="${left}" x2="${left}" y1="${top}" y2="${top+plotH}"></line>`;
  const slot=plotW/locationStats.length, barW=Math.min(65,slot*.58);
  locationStats.forEach((item,i)=>{ const x=left+slot*i+(slot-barW)/2, h=item.count/tickMax*plotH, y=top+plotH-h; out+=`<rect class="chart-bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="7"><title>${escapeHtml(item.location)}：${item.count} 台</title></rect><text class="chart-number" x="${x+barW/2}" y="${y-8}" text-anchor="middle">${item.count}</text><text class="chart-label" x="${x+barW/2}" y="${H-25}" text-anchor="middle">${escapeHtml(item.location)}</text>`; });
  out+=`<text class="chart-label" x="${W/2}" y="${H-3}" text-anchor="middle">地点</text><text class="chart-label" transform="translate(16 ${H/2}) rotate(-90)" text-anchor="middle">设备数量（台）</text>`;
  svg.innerHTML=out;
}
function renderFilterOptions() {
  $('location-filter').insertAdjacentHTML('beforeend', locationStats.map(item=>`<option value="${escapeHtml(item.location)}">${escapeHtml(item.location)}</option>`).join(''));
}
function renderDevices() {
  const selected=$('location-filter').value;
  const filtered=selected==='__all__'?records:records.filter(item=>item['地点']===selected);
  $('device-count').textContent=`当前设备数量：${filtered.length}`;
  $('device-body').innerHTML=filtered.map(item=>{
    const stateClass=item['状态']==='待核验'?'badge badge-warn':'badge badge-ok';
    const locationText=item['地点']==='未登记' ? `<span class="badge badge-warn">未登记</span>` : escapeHtml(item['地点']);
    return `<tr><td>${escapeHtml(item['原始记录号'])}</td><td>${escapeHtml(item['原工作表行号'])}</td><td><strong>${escapeHtml(item['资产编号'])}</strong></td><td>${escapeHtml(item['设备类型'])}</td><td>${locationText}</td><td><span class="${stateClass}">${escapeHtml(item['状态'])}</span></td><td>${escapeHtml(item['原始状态'])}</td><td>${escapeHtml(item['备注'])}</td></tr>`;
  }).join('');
}
function init() {
  renderMaintenance(); renderQa(); renderStateStats(); renderChart(); renderFilterOptions(); renderDevices();
  $('qa-search').addEventListener('input',renderQa);
  $('clear-search').addEventListener('click',()=>{ $('qa-search').value=''; renderQa(); $('qa-search').focus(); });
  $('location-filter').addEventListener('change',renderDevices);
}
init();
