import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const evidence = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidence, '../..');
const output = path.join(root, 'output/任务2/设备台账分析.xlsx');
const source = JSON.parse(await fs.readFile(path.join(evidence, '原始数据与核验依据.json'), 'utf8'));
const rows = source.rows;
const standard = new Set(source.standardStatuses);
const groups = new Map();
for (const row of rows) {
  if (!groups.has(row.asset)) groups.set(row.asset, []);
  groups.get(row.asset).push(row);
}

const cleaned = [], issues = [], conflicts = [];
const rawFields = row => JSON.stringify([row.type, row.location, row.status]);
for (const [asset, group] of groups) {
  const distinct = new Set(group.map(rawFields));
  const conflict = distinct.size > 1;
  if (conflict) conflicts.push(asset);
  const units = group.length > 1 && !conflict ? [group] : group.map(row => [row]);
  for (const unit of units) {
    const first = unit[0], merged = unit.length > 1;
    const missingLocation = first.location === null || first.location === '';
    const nonstandard = !standard.has(first.status);
    const notes = [];
    if (merged) notes.push('原始资产字段完全相同，合并并保留全部来源');
    if (conflict) notes.push('同编号字段冲突，暂不合并，待核验');
    if (missingLocation) notes.push('原地点为空，按规则填未登记');
    if (nonstandard) notes.push(`原状态“${first.status ?? '空值'}”非标准，待核验`);
    cleaned.push({
      records: unit.map(row => row.record), sourceRows: unit.map(row => row.row),
      asset, type: first.type, location: missingLocation ? '未登记' : first.location,
      status: nonstandard ? '待核验' : first.status, rawStatus: first.status,
      merged, note: notes.join('；') || '—',
    });
  }
  for (const row of group) {
    if (group.length > 1) {
      issues.push([
        row.row, row.record, asset, conflict ? '同编号字段冲突' : '完全相同重复资产',
        `设备类型=${row.type}；地点=${row.location ?? '（空单元格）'}；状态=${row.status ?? '（空单元格）'}`,
        conflict ? '保留独立记录，暂不合并' : `与记录${group.filter(x => x !== row).map(x => x.record).join('、')}合并；保留记录号${group.map(x => x.record).join('、')}和原行${group.map(x => x.row).join('、')}`,
        conflict ? '同编号存在字段冲突，材料不能判断哪条真实' : '同一资产编号，其余三个资产字段原值完全一致',
      ]);
    }
    if (row.location === null || row.location === '') issues.push([
      row.row, row.record, asset, '地点缺失', '地点=（Excel空单元格）',
      '地点填“未登记”；保留原空值说明', '按规则3处理，不猜测缺失地点',
    ]);
    if (!standard.has(row.status)) issues.push([
      row.row, row.record, asset, '非标准状态', `状态=${row.status ?? '（空单元格）'}`,
      `状态填“待核验”；原始状态保留“${row.status ?? '空值'}”`,
      '原表第3行标准状态为在用、维修、备用；不能把“正常”推断为“在用”',
    ]);
  }
}
cleaned.sort((a,b) => a.sourceRows[0] - b.sourceRows[0]);
issues.sort((a,b) => a[0]-b[0]);
const countBy = key => {
  const counts = new Map();
  for (const row of cleaned) counts.set(row[key], (counts.get(row[key]) ?? 0)+1);
  return counts;
};
const locationCounts = countBy('location');
const locations = [...locationCounts.keys()].sort((a,b) => locationCounts.get(b)-locationCounts.get(a));
const states = [...source.standardStatuses, '待核验'];
const stateCounts = countBy('status');
const flattened = cleaned.flatMap(row => row.records).sort((a,b)=>a-b);
if (JSON.stringify(flattened) !== JSON.stringify(rows.map(row=>row.record).sort((a,b)=>a-b))) throw Error('原始记录号覆盖不完整');
if (cleaned.length !== 19 || issues.length !== 4 || conflicts.length !== 0) throw Error('本次数据与已确认的问题清单不符');

const wb = Workbook.create();
const ledger = wb.worksheets.add('整理后台账');
const exception = wb.worksheets.add('异常处理清单');
const location = wb.worksheets.add('地点统计');
const status = wb.worksheets.add('状态统计');
const font = 'Microsoft YaHei', ink = '#20344C', headerFill = '#2E4C6D';
function base(sheet, range, title, widths) {
  sheet.showGridLines = false;
  sheet.getRange(range).format.font = {name:font,size:10,color:ink};
  sheet.getRange(range).format.verticalAlignment = 'center';
  sheet.getRange(range).format.rowHeight = 27;
  sheet.getRange('A2').values = [[title]];
  sheet.getRange('A2').format.font = {name:font,size:14,bold:true,color:ink};
  sheet.getRange('A2').format.rowHeight = 32;
  for (const [col,width] of Object.entries(widths)) sheet.getRange(`${col}1:${col}40`).format.columnWidth = width;
}
function table(sheet, range, name) {
  const tb=sheet.tables.add(range,true,name); tb.style='TableStyleLight9';
  const head=tb.getHeaderRowRange();
  head.format.fill=headerFill;
  head.format.font={name:font,size:10,bold:true,color:'#FFFFFF'};
  head.format.horizontalAlignment='center';
  head.format.rowHeight=30;
  head.format.borders={insideVertical:{style:'thin',color:'#FFFFFF'}};
}
function note(sheet, cell, text) {
  sheet.getRange(cell).values=[[text]];
  sheet.getRange(cell).format.font={name:font,size:10,color:'#63758A',italic:true};
}

const ledgerEnd=5+cleaned.length;
base(ledger,`A1:I${ledgerEnd}`,'整理后台账',{A:19,B:18,C:14,D:18,E:18,F:14,G:14,H:18,I:49});
note(ledger,'A3','来源：05_校园设备台账.xlsx，“资产原始记录”第6—25行；标准状态见原表第3行。');
note(ledger,'A4','保留全部原始记录号和行号。合并判断使用整理前原值；本次原始20条，整理后19条。');
ledger.getRange('A5:I5').values=[['原始记录号','原工作表行号','资产编号','设备类型','地点','状态','原始状态','是否经过合并','备注']];
ledger.getRange(`A6:I${ledgerEnd}`).values=cleaned.map(r=>[
  r.records.length===1?r.records[0]:r.records.join('、'),
  r.sourceRows.length===1?r.sourceRows[0]:r.sourceRows.join('、'),
  r.asset,r.type,r.location,r.status,r.rawStatus,r.merged?'是':'否',r.note,
]);
ledger.getRange(`I6:I${ledgerEnd}`).format.wrapText=true;
ledger.getRange(`A6:B${ledgerEnd}`).setNumberFormat('0');
ledger.getRange(`A6:B${ledgerEnd}`).format.horizontalAlignment='right';
table(ledger,`A5:I${ledgerEnd}`,'CleanedAssets');
ledger.freezePanes.freezeRows(5); ledger.freezePanes.freezeColumns(3);
for (let i=0;i<cleaned.length;i++) if(cleaned[i].note!=='—') ledger.getRange(`A${i+6}:I${i+6}`).format.rowHeight=44;
ledger.getRange(`E6:E${ledgerEnd}`).conditionalFormats.add('containsText',{text:'未登记',format:{fill:'#FFF1CF',font:{color:'#865F13',bold:true}}});
ledger.getRange(`F6:F${ledgerEnd}`).conditionalFormats.add('containsText',{text:'待核验',format:{fill:'#FFF1CF',font:{color:'#865F13',bold:true}}});

base(exception,'A1:G27','异常处理清单',{A:18,B:18,C:14,D:23,E:37,F:45,G:41});
note(exception,'A3','异常逐条对应原始记录与Excel行号。原值保留，缺失和非标准状态均不推断。');
exception.getRange('A5:G5').values=[['原工作表行号','原始记录号','资产编号','问题类型','原始内容','采取的处理','处理理由']];
exception.getRange(`A6:G${5+issues.length}`).values=issues;
exception.getRange(`A6:G${5+issues.length}`).format.wrapText=true;
exception.getRange(`A6:G${5+issues.length}`).format.rowHeight=58;
exception.getRange(`A6:B${5+issues.length}`).format.horizontalAlignment='right';
exception.getRange(`A6:B${5+issues.length}`).setNumberFormat('0');
table(exception,`A5:G${5+issues.length}`,'AssetExceptions'); exception.freezePanes.freezeRows(5);
exception.getRange('A12').values=[['检查结果']]; exception.getRange('A12').format.font={name:font,size:12,bold:true};
exception.getRange('A13:C18').values=[
  ['问题类型','受影响原始记录数','说明'],
  ['完全相同重复',2,'1组，2条合并为1条，减少1条'],
  ['字段冲突',0,'未发现；无冲突记录被合并'],
  ['地点缺失',1,'记录11，原表第16行'],
  ['非标准状态',1,'记录15，原表第20行，原值“正常”'],
  ['其他明显问题',0,'未发现编号/类型/状态缺失、记录号重复或首尾空白'],
];
exception.getRange('C13:G18').format.wrapText=false;
exception.getRange('A13:C13').format.font={name:font,size:10,bold:true};
exception.getRange('B14:B18').setNumberFormat('0');
exception.getRange('B14:B18').format.horizontalAlignment='right';
exception.getRange('A20').values=[['处理规则']]; exception.getRange('A20').format.font={name:font,size:12,bold:true};
const rules=[
  '1. 同一资产编号且类型、地点、状态原值全部完全相同才合并，保留全部记录号与原行号。',
  '2. 同一资产编号存在任一字段冲突，整组暂不合并，逐条保留并登记异常，不判断哪条真实。',
  '3. 地点缺失填“未登记”；原始空单元格情况保留在异常清单。',
  '4. 状态仅“在用、维修、备用”为标准；其他值填“待核验”，保留原始状态。',
  '5. 地点、状态统计均按合并重复后的整理记录统计，每条整理记录计1台。',
  '原始记录号为数字1—20，未改造为R编号。资料为教学模拟资产，不代表真实学校。',
];
exception.getRange('A21:A26').values=rules.map(text=>[text]);

base(location,'A1:M27','地点设备数量统计',{A:20,B:18,C:4,D:12,E:12,F:12,G:12,H:12,I:12,J:12,K:12,L:12,M:12});
note(location,'A3','按合并重复后的整理记录统计。单位：台，每条整理记录计1台。');
location.getRange('A5:B5').values=[['地点','设备数量（台）']];
location.getRange(`A6:A${5+locations.length}`).values=locations.map(x=>[x]);
location.getRange(`B6:B${5+locations.length}`).formulas=locations.map((_,i)=>[`=COUNTIFS('整理后台账'!$E$6:$E$${ledgerEnd},A${i+6})`]);
table(location,`A5:B${5+locations.length}`,'LocationCounts');
location.getRange('A12').values=[['合计']]; location.getRange('B12').formulas=[['=SUM(B6:B10)']];
location.getRange('A14').values=[['原始记录数']]; location.getRange('B14').values=[[rows.length]];
location.getRange('A15').values=[['整理记录数']]; location.getRange('B15').formulas=[[`=COUNTA('整理后台账'!$C$6:$C$${ledgerEnd})`]];
location.getRange('A16').values=[['合并后减少']]; location.getRange('B16').formulas=[['=B14-B15']];
location.getRange('A18').values=[['合计与台账差值']]; location.getRange('B18').formulas=[['=B12-B15']];
location.getRange('B6:B18').setNumberFormat('0'); location.getRange('B6:B18').format.horizontalAlignment='right';
location.getRange('A12:B12').format.font={name:font,size:10,bold:true};
location.getRange('A12:B12').format.borders={top:{style:'thin',color:'#B6C5D5'}};
note(location,'A22','本次地点分布：教学楼A与图书馆D各5台，并列最多；教学楼B与学生宿舍C各4台；另1台未登记地点。');
note(location,'A24','20条原始记录中仅A008重复1次，因此合并后为19条。不存在冲突资产。');
const chart=location.charts.add('bar',location.getRange('A5:B10'));
chart.title='合并重复资产后的设备数量'; chart.titleTextStyle.typeface=font; chart.titleTextStyle.fontSize=16;
chart.barOptions.direction='column'; chart.barOptions.grouping='clustered'; chart.barOptions.gapWidth=110;
chart.hasLegend=false;
chart.xAxis={axisType:'textAxis',textStyle:{typeface:font,fontSize:12}};
chart.yAxis={numberFormatCode:'0',numberFormatSourceLinked:false,textStyle:{typeface:font,fontSize:12}};
chart.xAxis.title.text='地点'; chart.yAxis.title.text='设备数量（台）';
chart.dataLabels={showValue:true}; chart.series.items[0].fill='#4472A6'; chart.setPosition('D5','M20');

base(status,'A1:F20','状态设备数量统计',{A:21,B:19,C:4,D:23,E:23,F:23});
note(status,'A3','按合并重复后的整理记录统计。标准状态：在用、维修、备用；非标准状态归入待核验。');
status.getRange('A5:B5').values=[['整理后状态','设备数量（台）']];
status.getRange('A6:A9').values=states.map(x=>[x]);
status.getRange('B6:B9').formulas=states.map((_,i)=>[`=COUNTIFS('整理后台账'!$F$6:$F$${ledgerEnd},A${i+6})`]);
table(status,'A5:B9','StatusCounts');
status.getRange('A11').values=[['合计']]; status.getRange('B11').formulas=[['=SUM(B6:B9)']];
status.getRange('A13').values=[['整理记录数']]; status.getRange('B13').formulas=[[`=COUNTA('整理后台账'!$C$6:$C$${ledgerEnd})`]];
status.getRange('A14').values=[['合计与台账差值']]; status.getRange('B14').formulas=[['=B11-B13']];
status.getRange('B6:B14').setNumberFormat('0'); status.getRange('B6:B14').format.horizontalAlignment='right';
status.getRange('A11:B11').format.font={name:font,size:10,bold:true};
status.getRange('A11:B11').format.borders={top:{style:'thin',color:'#B6C5D5'}};
note(status,'A17','待核验1台：A015，原记录15、原表第20行，原始状态“正常”保留在台账中。');

wb.recalculate();
if (location.getRange('B12').values[0][0]!==cleaned.length || status.getRange('B11').values[0][0]!==cleaned.length) throw Error('统计合计与台账不一致');
console.log((await wb.inspect({kind:'table',range:'地点统计!A5:B18',include:'values,formulas',tableMaxRows:14,tableMaxCols:2,maxChars:3000})).ndjson);
console.log((await wb.inspect({kind:'table',range:'状态统计!A5:B14',include:'values,formulas',tableMaxRows:10,tableMaxCols:2,maxChars:2000})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:1500,summary:'公式错误检查'})).ndjson);
await fs.mkdir(path.dirname(output),{recursive:true});
await (await SpreadsheetFile.exportXlsx(wb)).save(output);
await fs.writeFile(path.join(evidence,'整理与统计结果.json'),JSON.stringify({sourceHash:source.hash,cleaned,issues,conflicts,locations:Object.fromEntries(locationCounts),states:Object.fromEntries(stateCounts),chartBindings:chart.series.items.map(s=>({values:s.formula,categories:s.categoryFormula}))},null,2));
for (const [sheetName,range] of [['整理后台账',`A1:I${ledgerEnd}`],['异常处理清单','A1:G26'],['地点统计','A1:M25'],['状态统计','A1:F19']]) {
  try {
    const image=await wb.render({sheetName,range,scale:1.4,format:'png'});
    await fs.writeFile(path.join(evidence,`${sheetName}_预览.png`),new Uint8Array(await image.arrayBuffer()));
    console.log(`已渲染 ${sheetName}`);
  } catch(err) { console.error(`渲染失败 ${sheetName}: ${err.message}`); throw err; }
}
console.log(`已生成 ${output}`);
