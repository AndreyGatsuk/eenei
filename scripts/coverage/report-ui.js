const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

function reportHtml(report) {
  const data = JSON.stringify(report).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Eenei — отчёт покрытия</title><style>
:root{color-scheme:dark;--bg:#0a0e14;--surface:#101720;--border:#273442;--text:#e0ded8;--muted:#a0aab7;--accent:#83b8d6;--ok:#9daf95;--warn:#d8be70;--bad:#e39383}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,sans-serif}main{max-width:1420px;margin:auto;padding:40px 28px 80px}h1{font-size:34px;line-height:1.2;margin:8px 0 20px}h2{font-size:22px;margin:0 0 10px}h3{font-size:17px}p{max-width:95ch}a{color:var(--accent)}code{font:12px/1.6 ui-monospace,Consolas,monospace;overflow-wrap:anywhere}.muted,small{color:var(--muted)}.eyebrow{color:var(--accent);font-size:12px;letter-spacing:.15em;text-transform:uppercase}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}.card{border:1px solid var(--border);border-radius:12px;padding:18px;background:var(--surface)}.number{font-size:28px;line-height:1.2;margin-bottom:8px}.controls{display:flex;flex-wrap:wrap;align-items:center;gap:16px;position:sticky;top:0;background:var(--bg);padding:16px 0;border-block:1px solid var(--border);z-index:2}label{display:flex;align-items:center;gap:8px}input,select{font:inherit;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:8px}input[type=search]{min-width:240px}input[type=checkbox]{accent-color:var(--accent)}section{margin-top:38px}.table-wrap{overflow:auto;border:1px solid var(--border);border-radius:10px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px 14px;vertical-align:top;border-bottom:1px solid var(--border)}td small{display:block;margin-top:3px}th{font-size:12px;color:var(--muted);background:var(--surface)}tr:last-child td{border-bottom:0}.pill{display:inline-block;border-radius:5px;padding:2px 7px;font-size:12px;white-space:nowrap}.verified{color:var(--ok);background:#9daf9515}.observed,.partial{color:var(--warn);background:#d8be7012}.unobserved,.skipped{color:var(--muted);background:#949ca810}.failed{color:var(--bad);background:#e3938312}.notice{border-left:3px solid var(--accent);padding:8px 16px;background:var(--surface);margin:20px 0}.notice.bad{border-color:var(--bad)}.rule{border:1px solid var(--border);border-radius:8px;margin:10px 0;overflow:hidden}.rule summary{cursor:pointer;padding:14px;display:flex;gap:12px;align-items:center;justify-content:space-between}.rule table{font-size:13px}.rule td:first-child{min-width:260px}.rule small{display:block}.swatch{display:inline-block;width:13px;height:13px;border:1px solid #8888;border-radius:3px;vertical-align:middle;margin-right:5px}.palette{display:flex;flex-wrap:wrap;gap:16px;padding:10px 0}.bar{height:6px;background:var(--border);border-radius:6px;overflow:hidden;margin-top:12px}.bar>span{display:block;height:100%;background:var(--ok)}.error{white-space:pre-wrap;color:var(--bad)}footer{border-top:1px solid var(--border);margin-top:40px;padding-top:20px}.catalog-controls{display:flex;flex-wrap:wrap;gap:16px}.binding-list{max-height:240px;overflow:auto}.binding-list code{display:inline-block;margin:3px 10px 3px 0}.empty{padding:20px;color:var(--muted)}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(max-width:800px){.catalog-controls label{flex-wrap:wrap;max-width:100%}.catalog-controls select{max-width:100%}main{padding:24px 16px}.cards{grid-template-columns:repeat(2,1fr)}.controls{position:static}.rule summary{align-items:flex-start;flex-direction:column}th,td{padding:10px}h1{font-size:28px}}
@media(prefers-color-scheme:light){:root{color-scheme:light;--bg:#fafafa;--surface:#f0f2f4;--border:#d8dde3;--text:#292720;--muted:#59616c;--accent:#326d8a;--ok:#496641;--warn:#846715;--bad:#a34234}}
</style></head><body><main>
<header><div class="eyebrow">Eenei / measured coverage</div><h1>Что действительно проверено</h1>
<p>Зелёная отметка означает выполненную проверку. «Встречался» означает только наличие в примерах. Число успешных тестов не равно полноте покрытия всех конструкций.</p>
<p class="muted">Снимок: ${escape(report.generatedAt)} · Node ${escape(report.environment.node)} · VS Code ${escape(report.native?.editorVersion || 'не запускался')}</p>
<p><a href="coverage.json">Данные JSON</a> · <a href="checks.log">Журнал проверок</a></p></header>
<div id="global-status"></div><div class="cards" id="cards"></div>
<div class="controls"><label for="variant">Палитра <select id="variant"></select></label>
<label for="search"><span class="sr">Найти файл или правило</span><input id="search" type="search" placeholder="Найти файл, scope или правило"></label>
<label for="gaps"><input id="gaps" type="checkbox">Только пробелы покрытия</label></div>
<section id="language-catalog" aria-labelledby="catalog-title" ${report.languageMatrix ? '' : 'hidden'}>
<h2 id="catalog-title">Что ещё не проверено</h2>
<p>Синтаксис и распознавание имён файлов проверяются независимо. Выберите нужный раздел ниже. Каталоги показывают языки и типы файлов за пределами наших примеров. «Пример проверен» относится к имеющимся примерам и явным утверждениям; это не проверка всех конструкций языка. Общая грамматика сама по себе не подтверждает другой диалект.</p>
<p id="catalog-sources" class="muted"></p><div id="catalog-totals" class="notice"></div>
<div class="catalog-controls"><label>Раздел <select id="catalog-view"><option value="syntax">Синтаксис</option><option value="bindings">Имена файлов</option></select></label>
<label>Источник <select id="catalog-source"><option value="vscode">VS Code</option><option value="bundled">Наше расширение</option><option value="linguist">GitHub Linguist</option><option value="all">Все источники</option></select></label>
<label>Статус <select id="catalog-status"></select></label></div>
<p id="catalog-help" class="muted"></p>
<p id="catalog-summary" class="muted" aria-live="polite"></p>
<div class="table-wrap"><table><caption class="sr">Каталоги языков, доступность грамматик и отсутствующие проверки</caption><thead id="catalog-head"></thead><tbody id="catalog-rows"></tbody></table></div>
<p class="muted">В разделе «Имена файлов» показаны отдельные расширения, точные имена и шаблоны. Наличие примера ещё не означает, что его имя распознано редактором. Непроверенный вариант имени не создаёт новый пробел синтаксиса. Для шаблонов требуется отдельная проверка; по имени похожего файла они автоматически не засчитываются. Каталоги закреплены на ревизиях выше. Их пробелы служат планом расширения; строгий режим CI проверяет обязательный набор <code>samples/</code> и <code>tests/fixtures/</code>.</p>
</section>
<section aria-labelledby="matrix-title"><h2 id="matrix-title">Файлы и грамматики</h2>
<p class="muted">Цвета и стили: явные проверки для грамматики в выбранной палитре. Они могут использовать отдельные небольшие фрагменты, а не каждую строку показанного файла. Одинаковая грамматика делит проверки между своими файлами.</p>
<div id="palette" class="palette"></div><div class="table-wrap"><table><caption class="sr">Распознавание, грамматики и проверки цветов для каждого примера</caption><thead><tr><th>Пример</th><th>Чистый VS Code</th><th>Грамматика и токены</th><th>Проверки цветов</th><th>Проверки стилей</th><th>Наблюдения</th></tr></thead><tbody id="files"></tbody></table></div></section>
<section aria-labelledby="rules-title"><h2 id="rules-title">Правила подсветки</h2>
<p class="muted">Для каждого селектора движок TextMate отдельно определяет победившее правило цвета и начертания. Селектор считается проверенным только для заданных свойств, которые явно подтверждены тестом. Группа целиком проверена, когда это верно для всех её селекторов.</p>
<div id="rule-summary"></div><div id="rules"></div></section>
<section aria-labelledby="variants-title"><h2 id="variants-title">Все палитры</h2><div class="table-wrap"><table><thead><tr><th>Вариант</th><th>Грамматики файлов</th><th>Цветовые проверки</th><th>Проверенные свойства селекторов</th></tr></thead><tbody id="variants"></tbody></table></div></section>
${report.reference ? `<section aria-labelledby="reference-title"><h2 id="reference-title">Сравнение с каталогом Pustota</h2>
<p>Для ${report.reference.files.filter((entry) => entry.covered).length}/${report.reference.files.length} файлов из <a href="${escape(report.reference.repository)}/tree/${escape(report.reference.revision)}/test">закреплённого каталога Pustota</a> есть собственные примеры того же языка или формата. Это сопоставление языков, а не проверка всех конструкций из исходных файлов.</p>
<div class="table-wrap"><table><thead><tr><th>Файл Pustota</th><th>Наш пример</th><th>Грамматика</th></tr></thead><tbody>${report.reference.files.map((entry) => `<tr><td><code>${escape(entry.upstream)}</code></td><td><code>${escape(entry.sample)}</code></td><td><code>${escape(entry.scope || 'Не зарегистрирована')}</code></td></tr>`).join('')}</tbody></table></div></section>` : ''}
<section aria-labelledby="limits-title"><h2 id="limits-title">Границы отчёта</h2><ul>
<li>Отчёт охватывает найденные текстовые примеры в <code>samples/</code> и <code>tests/fixtures/</code>, зарегистрированные правила и явные утверждения тестов. Это конечный набор, а не все возможные программы.</li>
<li>Распознавание и native-токены проверяются в отдельном VS Code без сторонних расширений. Цвета всех палитр проверяются движком TextMate; native-проверка не оценивает каждый цвет или каждый элемент интерфейса.</li>
<li>Селектор мог не выбираться, потому что нужного примера нет либо более точное правило всегда побеждает. Это повод для проверки, а не автоматическое доказательство ошибки.</li>
<li>Если запущено <code>--no-editor</code>, колонка редактора остаётся непроверенной. Результаты прежних запусков не подставляются.</li>
<li>Ограничение MDX: upstream-грамматика не размечает подпись ссылки; акцент проверяется на URL, подпись остаётся обычным текстом.</li>
<li>Источник стандартных грамматик: <code>${escape(report.environment.grammars)}</code>. Добавленные грамматики читаются из расширения. IntelliSense и возможности серверов языков здесь не измеряются; TSX отдельно проверяется компилятором и в редакторе.</li>
</ul></section><footer class="muted">Сгенерировано командой <code>npm run report</code>. Откройте группы правил, чтобы увидеть конкретные непроверенные селекторы.</footer>
</main><script id="report-data" type="application/json">${data}</script><script>
const report=JSON.parse(document.getElementById('report-data').textContent);
const labels={verified:'Проверен',observed:'Только встречался',partial:'Частично',unobserved:'Не выбирался',skipped:'Не запускался',failed:'Ошибка',internal:'Внутренний режим'};
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pill=(status,text)=>'<span class="pill '+status+'">'+h(text||labels[status]||status)+'</span>';
const select=document.getElementById('variant');
for(const v of report.variants){const option=document.createElement('option');option.value=v.id;option.textContent=v.label;select.append(option)}
const global=document.getElementById('global-status');
if(!report.checks.passed||report.errors.length)global.innerHTML='<div class="notice bad"><strong>Есть ошибки выполнения.</strong><div class="error">'+h(report.errors.join('\\n')||'См. журнал проверок.')+'</div></div>';
else global.innerHTML='<div class="notice">Проверки завершились успешно. Непроверенные селекторы и форматы перечислены отдельно.</div>';
const nativeByFile=new Map((report.native.files||[]).map(row=>[row.file,row]));
function nativeCell(file){const row=nativeByFile.get(file.sample);return !row?pill('skipped'):(row.passed?pill('verified',row.language):pill('failed',row.language||'не распознан'))+(row.error?'<small>'+h(row.error)+'</small>':'')}
function facet(f){if(!f)return '<span class="muted">—</span>';return pill(f.status)+(f.assertions?'<small>'+f.assertions+' явных проверок</small>':'')+'<small>'+h(f.value)+'</small>'}
const catalogLabels={'no-sample':'Нет примера','needs-assertions':'Нет полных проверок','needs-editor':'Не проверен редактор','sample-tested':'Пример проверен',failed:'Ошибка',internal:'Внутренний режим'};
const bindingLabels={verified:'Имя распознано',failed:'Распознан другой язык','missing-example':'Нет файла для проверки',skipped:'Редактор не запускался',unobserved:'Нет результата редактора'};
function renderCatalog(v,q,gaps){
 const catalog=report.languageMatrix;if(!catalog)return;
 const view=document.getElementById('catalog-view').value;
 const filter=document.getElementById('catalog-status');
 if(filter.dataset.view!==view){
  const options=view==='syntax'?[['all','Все статусы'],['no-sample','Нет примера'],['needs-assertions','Нет полных проверок'],['sample-tested','Пример синтаксиса проверен'],['missing-grammar','Нет грамматики'],['untested-scopes','Есть грамматики без примера'],['internal','Внутренний режим'],['failed','Ошибка']]:[['all','Все статусы'],['pending','Распознавание не проверено'],['verified','Имя распознано'],['missing-example','Нет файла для проверки'],['skipped','Редактор не запускался'],['failed','Распознан другой язык']];
  filter.innerHTML=options.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('');filter.dataset.view=view;
 }
 const source=document.getElementById('catalog-source').value;const status=filter.value;
 const selected=catalog.rows.filter(row=>source==='all'||row.source===source);
 const matches=(row,extra=[])=>[row.name,row.id,...row.languageIds,...row.scopes,...extra].join(' ').toLowerCase().includes(q);
 document.getElementById('catalog-sources').innerHTML=catalog.sources.map(source=>source.url?'<a href="'+h(source.url)+'">'+h(source.name)+'</a> <code>'+h(source.revision.slice(0,12))+'</code>':h(source.name)).join(' · ');
 document.getElementById('catalog-totals').innerHTML=catalog.summary.map(summary=>{
  const title='<strong>'+h(catalog.sources.find(source=>source.id===summary.source).name)+'</strong>: ';
  return '<span>'+title+(view==='syntax'?'примеры с проверками цвета и начертания '+summary.syntaxTested+'; без примера '+summary.missingSamples+(summary.internal?'; внутренних режимов '+summary.internal:''):'привязок '+summary.recognition.total+'; распознано '+summary.recognition.verified+'; не проверено '+summary.recognition.pending+'; ошибок распознавания '+summary.recognition.failed)+'.</span>';
 }).join('<br>');
 const head=document.getElementById('catalog-head');const body=document.getElementById('catalog-rows');
 if(view==='syntax'){
  document.getElementById('catalog-help').textContent='Здесь учитываются грамматики, цвета и начертание. Дополнительные окончания с той же грамматикой не добавляют пробелов синтаксиса. Проверка имён находится в соседнем разделе.';
  head.innerHTML='<tr><th>Язык / формат</th><th>Грамматика</th><th>Наши примеры</th><th>Цвет</th><th>Начертание</th><th>Дополнительные грамматики</th></tr>';
  const rows=selected.filter(row=>status==='missing-grammar'?!row.grammars.length&&!row.sharedGrammars.length:status==='untested-scopes'?row.untestedScopes.length>0:status==='all'||row.syntax.status===status)
   .filter(row=>!gaps||row.syntax.gap).filter(row=>matches(row,[...row.samples,...row.bindings.map(binding=>binding.value)]));
  document.getElementById('catalog-summary').textContent='Языков / режимов: '+rows.length+'. Фильтр пробелов учитывает только синтаксис и грамматики.';
  body.innerHTML=rows.map(row=>{
   const measurement=row.measured.find(measurement=>measurement.variant===v.id);
   const grammar=row.grammars.length?pill('observed','Зарегистрирована'):row.sharedGrammars.length?pill('partial','Общая грамматика'):pill('unobserved','Не зарегистрирована');
   const scopes=[...new Set([...row.grammars,...row.sharedGrammars].map(grammar=>grammar.scope))];
   return '<tr><td><strong>'+h(row.name)+'</strong><small>'+h(row.source)+' · '+h(row.id)+'</small>'+pill(row.syntax.tested?'verified':row.syntax.status==='failed'?'failed':'unobserved',row.syntax.tested?'Пример синтаксиса проверен':catalogLabels[row.syntax.status])+'</td><td>'+grammar+'<small><code>'+h(scopes.join(', ')||row.scopes.join(', ')||'Scope не указан')+'</code></small>'+(row.sharedGrammars.length?'<small>Общий scope не подтверждает другой диалект.</small>':'')+'</td><td>'+h(row.samples.join(', ')||row.note?.reason||'Нет примера')+(row.embedded?'<small>Проверяется внутри документа</small>':'')+'</td><td>'+pill(measurement?.colorsPassed&&!measurement.failed?'verified':'unobserved',String(measurement?.colors||0))+'</td><td>'+pill(measurement?.stylesPassed&&!measurement.failed?'verified':'unobserved',String(measurement?.styles||0))+'</td><td>'+h(row.untestedScopes.length?'Нет отдельного примера: '+row.untestedScopes.join(', '):'Нет дополнительных пробелов по scopes')+'</td></tr>';
  }).join('');
 }else{
  document.getElementById('catalog-help').textContent='Здесь проверяется только автоматическое распознавание имени в VS Code. Синтаксис может быть уже проверен другим файлом с той же грамматикой. Шаблоны имён требуют отдельной проверки. Источники пересекаются: их числа не следует складывать как уникальные типы файлов.';
  head.innerHTML='<tr><th>Язык / формат</th><th>Имя или окончание</th><th>Тип привязки</th><th>Распознавание в VS Code</th><th>Файлы для проверки</th><th>Проверка синтаксиса</th></tr>';
  const rows=selected.flatMap(row=>row.bindings.map(binding=>({row,binding}))).filter(({binding})=>status==='all'||(status==='pending'?!['verified','failed'].includes(binding.status):binding.status===status))
   .filter(({binding})=>!gaps||binding.status!=='verified').filter(({row,binding})=>matches(row,[binding.value,...binding.samples]));
  document.getElementById('catalog-summary').textContent='Привязок файлов: '+rows.length+'. Это проверки имён, а не новые проверки синтаксиса.';
  body.innerHTML=rows.map(({row,binding})=>'<tr><td><strong>'+h(row.name)+'</strong><small>'+h(row.source)+' · '+h(row.id)+'</small></td><td><code>'+h(binding.value)+'</code></td><td>'+h({extension:'Окончание',filename:'Точное имя',pattern:'Шаблон'}[binding.type])+'</td><td>'+pill(binding.status==='verified'?'verified':binding.status==='failed'?'failed':'unobserved',bindingLabels[binding.status])+'</td><td>'+h(binding.samples.join(', ')||'Нет файла для проверки')+'</td><td>'+pill(row.syntax.tested?'verified':'unobserved',row.syntax.tested?'Пример синтаксиса проверен':'Нет проверенного примера')+(row.syntax.tested&&binding.status!=='verified'?'<small>Повторять проверки цветов для этого окончания не требуется.</small>':'')+'</td></tr>').join('');
 }
 if(!body.innerHTML)body.innerHTML='<tr><td colspan="6" class="empty">Совпадений нет.</td></tr>';
}

function render(){const v=report.variants.find(v=>v.id===select.value)||report.variants[0];if(!v)return;
 const q=document.getElementById('search').value.toLowerCase();const gaps=document.getElementById('gaps').checked;
 renderCatalog(v,q,gaps);
 const nativePassed=(report.native.files||[]).filter(f=>f.passed).length;
 const assertions=v.assertions;
 const cards=[
  [report.native.skipped?'—':nativePassed+'/'+v.files.length,'Распознано в чистом VS Code',report.native.skipped?'Проверка редактора не запускалась':(report.native.editorVersion||'')],
  [v.files.filter(f=>f.grammar==='passed').length+'/'+v.files.length,'Грамматики примеров','В выбранной палитре'],
  [assertions.passed+'/'+assertions.total,'Явные цветовые проверки','Проверок стилей: '+assertions.styles],
  [v.summary.facetsVerified+'/'+v.summary.facets,'Свойства селекторов с доказательствами','Цвет и начертание считаются отдельно'],
 ];
 document.getElementById('cards').innerHTML=cards.map(([n,title,note])=>'<div class="card"><div class="number">'+h(n)+'</div><strong>'+h(title)+'</strong><div class="muted">'+h(note)+'</div></div>').join('');
 document.getElementById('palette').innerHTML=['important','string','comment','regular','insignificant'].map(role=>'<span><span class="swatch" style="background:'+h(v.colors[role])+'"></span>'+h(role)+' <code>'+h(v.colors[role])+'</code></span>').join('');
 const files=v.files.filter(f=>(f.sample+' '+f.scope+' '+f.languageId).toLowerCase().includes(q)).filter(f=>!gaps||!f.colorAssertions||!f.styleAssertions||f.failedAssertions||f.grammar!=='passed'||!nativeByFile.get(f.sample)?.passed);
 document.getElementById('files').innerHTML=files.map(f=>'<tr><td><code>'+h(f.sample)+'</code><small class="muted">'+h(f.format)+(f.inferred?' · найден автоматически':'')+'</small></td><td>'+nativeCell(f)+'</td><td>'+pill(f.grammar==='passed'?'verified':'failed',f.grammar==='passed'?'Загружена':f.grammar)+'<small><code>'+h(f.scope||'нет в каталоге')+'</code></small>'+(f.error?'<small>'+h(f.error)+'</small>':'')+'</td><td>'+pill(f.failedAssertions?'failed':f.colorAssertions?'verified':'unobserved',f.colorAssertions?f.colorAssertions+' проверок':'Нет утверждений')+'</td><td>'+pill(f.failedAssertions?'failed':f.styleAssertions?'verified':'unobserved',f.styleAssertions?f.styleAssertions+' проверок':'Нет утверждений')+'</td><td><small>'+f.observedScopes+' scopes · '+f.tokens+' токенов</small><small>'+f.colors.length+' цветов · '+f.selectorsObserved.length+' селекторов</small>'+(f.colors.length===1?pill('observed','Один цвет: проверить вручную'):'')+'</td></tr>').join('')||'<tr><td colspan="6" class="empty">Совпадений нет.</td></tr>';
 document.getElementById('rule-summary').innerHTML='<p>'+v.summary.rulesVerified+' / '+v.summary.rules+' групп целиком проверены; '+v.summary.selectorsVerified+' / '+v.summary.selectors+' селекторов полностью подтверждены.</p><div class="bar"><span style="width:'+100*v.summary.facetsVerified/v.summary.facets+'%"></span></div>';
 const rules=v.rules.filter(r=>(r.name+' '+r.selectors.map(s=>s.scope).join(' ')).toLowerCase().includes(q)).filter(r=>!gaps||r.status!=='verified');
 document.getElementById('rules').innerHTML=rules.map(r=>'<details class="rule"><summary><span>'+h(r.name)+' <small>'+r.selectors.length+' селекторов</small></span>'+pill(r.status)+'</summary><div class="table-wrap"><table><thead><tr><th>Селектор</th><th>Цвет</th><th>Начертание</th><th>Где выбирался в примерах</th></tr></thead><tbody>'+r.selectors.filter(s=>!gaps||s.status!=='verified').map(s=>'<tr><td><code>'+h(s.scope)+'</code></td><td>'+facet(s.foreground)+'</td><td>'+facet(s.fontStyle)+'</td><td><small>'+h([...new Set([...(s.foreground?.observedSamples||[]),...(s.fontStyle?.observedSamples||[])])].join(', ')||'Нет наблюдений')+'</small></td></tr>').join('')+'</tbody></table></div></details>').join('')||'<p class="empty">Совпадений нет.</p>';
 document.getElementById('variants').innerHTML=report.variants.map(v=>'<tr><td>'+h(v.label)+'</td><td>'+v.files.filter(f=>f.grammar==='passed').length+'/'+v.files.length+'</td><td>'+v.assertions.passed+'/'+v.assertions.total+'</td><td>'+v.summary.facetsVerified+'/'+v.summary.facets+'</td></tr>').join('');
}
document.getElementById('catalog-view').addEventListener('change',render);document.getElementById('catalog-source').addEventListener('change',render);document.getElementById('catalog-status').addEventListener('change',render);
select.addEventListener('change',render);document.getElementById('search').addEventListener('input',render);document.getElementById('gaps').addEventListener('change',render);render();
</script></body></html>`;
}
module.exports = { reportHtml };
