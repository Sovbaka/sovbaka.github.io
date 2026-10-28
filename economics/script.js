'use strict';
const {topics, olympiads, tasks, sources} = window.CATALOG;
const state = {olympiad:'all', year:'all', topic:'all', query:'', solution:false, qualitative:false};
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => String(s).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[–—-]/g,' ');
const plural = (n, forms) => `${n} ${forms[n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2]}`;
const taskCount = n => plural(n,['задача','задачи','задач']);
const sourceCount = n => plural(n,['сборник','сборника','сборников']);
const materialLabels = {solution:'решение',answer:'ответ',criteria:'критерии'};
const href = (file,page) => `pdfs/${encodeURIComponent(file)}#page=${page}`;
const searchable = new Map(tasks.map(t => [t.id, normalize([t.title,t.olympiad,t.season,t.year,t.kind,t.number,t.variant,topics.find(c=>c.id===t.topic).name,...t.tags].join(' '))]));

function visibleTasks(){
  const words = normalize(state.query).trim().split(/\s+/).filter(Boolean);
  return tasks.filter(t => (state.olympiad==='all'||t.olympiadId===state.olympiad) && (state.year==='all'||t.year===Number(state.year)) && (state.topic==='all'||t.topic===state.topic) && (!state.solution||t.solutionPage) && (!state.qualitative||t.qualitative) && words.every(w=>searchable.get(t.id).includes(w)));
}

function renderSchoolFilters(){
  $('olympiadFilters').innerHTML = [{id:'all',name:'Все олимпиады'},...olympiads].map(o=>`<button class="olympiad-tab${state.olympiad===o.id?' active':''}" data-school="${o.id}" aria-pressed="${state.olympiad===o.id}">${o.id==='fin'?'Финашка':escapeHTML(o.name)}</button>`).join('');
}

function renderYearFilters(){
  const schoolTasks = tasks.filter(t=>state.olympiad==='all'||t.olympiadId===state.olympiad);
  const years = [...new Set(schoolTasks.map(t=>t.year))].sort((a,b)=>a-b);
  if(state.year!=='all'&&!years.includes(Number(state.year))) state.year='all';
  $('yearFilters').innerHTML = `<button class="filter-btn${state.year==='all'?' active':''}" data-year="all" aria-pressed="${state.year==='all'}">Все годы</button>`+years.map(y=>`<button class="filter-btn${Number(state.year)===y?' active':''}" data-year="${y}" aria-pressed="${Number(state.year)===y}">${y-1}–${y}</button>`).join('');
}

function taskCard(t){
  const label = t.kind==='Творческое задание'?`Т${t.number}`:t.number;
  const variant = t.variant==='Единственный в файле'?'':t.variant;
  const qualitative = t.qualitative ? '<span class="qualitative-badge" title="Качественная задача: рассуждения без формул и расчётов" aria-label="Качественная задача">K</span>' : '';
  const materialLabel = materialLabels[t.solutionKind] || 'решение';
  const solution = t.solutionPage ? `<a class="solution-link" href="${href(t.solutionFile || t.file,t.solutionPage)}" target="_blank" rel="noopener" aria-label="${materialLabel}: ${escapeHTML(t.title)}">${materialLabel} →</a>` : '';
  return `<article class="task" data-task-id="${t.id}">
    <a class="task-main" href="${href(t.file,t.page)}" target="_blank" rel="noopener" aria-label="${escapeHTML(t.title)}${t.qualitative?', качественная задача':''}${t.qualitativeGraph?', нужен поясняющий график':''} — ${escapeHTML(t.olympiad)}, ${t.season}, ${t.kind.toLocaleLowerCase('ru')} ${t.number}${variant?', '+escapeHTML(variant):''}, страница PDF ${t.page}">
      <div class="task-number${t.kind==='Творческое задание'?' creative':''}" aria-hidden="true">${label}</div>
      <div class="task-body"><h3 class="task-title">${escapeHTML(t.title)} ${qualitative}</h3>
        <div class="task-meta"><span>${escapeHTML(t.olympiad)}</span><span>${t.season}</span><span>${t.kind==='Творческое задание'?'творческое':'задача'} ${t.number}</span></div>
        <div class="task-tags">${variant?escapeHTML(variant)+' · ':''}PDF, с. ${t.page}${t.qualitativeGraph?' · нужен график':''}</div>
        <div class="task-tags">${t.tags.slice(0,3).map(escapeHTML).join(' · ')}</div>
      </div><div class="arrow" aria-hidden="true">↗</div>
    </a>${solution}</article>`;
}

function renderResults(){
  const visible=visibleTasks();
  const grouped=topics.map(topic=>({...topic,tasks:visible.filter(t=>t.topic===topic.id).sort((a,b)=>a.year-b.year||olympiads.findIndex(o=>o.id===a.olympiadId)-olympiads.findIndex(o=>o.id===b.olympiadId)||a.kind.localeCompare(b.kind,'ru')||a.number-b.number)})).filter(g=>g.tasks.length);
  $('categoryNav').innerHTML=grouped.map(g=>`<a href="#topic-${g.id}">${escapeHTML(g.name)}<span>${g.tasks.length}</span></a>`).join('');
  $('sections').innerHTML=grouped.map(g=>`<section class="topic" id="topic-${g.id}" aria-labelledby="heading-${g.id}"><div class="topic-head"><h2 id="heading-${g.id}">${escapeHTML(g.name)}</h2><span class="count">${taskCount(g.tasks.length)}</span></div><p class="topic-description">${escapeHTML(g.description)}</p><div class="grid">${g.tasks.map(taskCard).join('')}</div></section>`).join('');
  $('emptyState').hidden=visible.length!==0;
  $('resultCount').textContent=`Показано: ${taskCount(visible.length)} из ${tasks.length} · ${plural(grouped.length,['тема','темы','тем'])}`;
  $('resetFilters').hidden=state.olympiad==='all'&&state.year==='all'&&state.topic==='all'&&!state.query&&!state.solution&&!state.qualitative;
}

function reset(){
  Object.assign(state,{olympiad:'all',year:'all',topic:'all',query:'',solution:false,qualitative:false});
  $('search').value='';$('topicFilter').value='all';$('withSolution').checked=false;$('onlyQualitative').checked=false;
  renderSchoolFilters();renderYearFilters();renderResults();
}

function renderSources(){
  $('sourceRows').innerHTML=sources.map(s=>`<tr><td><a href="${href(s.file,s.selectedPages[0])}" target="_blank" rel="noopener">${escapeHTML(s.olympiad)} · ${s.season} ↗</a></td><td>${escapeHTML(s.variant)}</td><td>${tasks.filter(t=>t.sourceId===s.id).length}</td><td>${s.selectedPages[0]}–${s.selectedPages[s.selectedPages.length-1]}</td><td>${s.solutionFile?`<a href="${href(s.solutionFile,s.selectedSolutionPages[0])}" target="_blank" rel="noopener" title="${escapeHTML(s.solutionOriginal)}">Открыть ↗</a><br>с. ${s.selectedSolutionPages[0]}–${s.selectedSolutionPages[s.selectedSolutionPages.length-1]}`:''}</td></tr>`).join('');
  $('sourceNotes').innerHTML=sources.filter(s=>s.note).map(s=>`<p class="source-note"><strong>${escapeHTML(s.olympiad)} · ${s.season}.</strong> ${escapeHTML(s.note)}</p>`).join('');
}

$('totalCount').textContent=`${taskCount(tasks.length)} · ${sourceCount(sources.length)}`;
$('sourceCount').textContent=sourceCount(sources.length);
$('topicFilter').innerHTML='<option value="all">Все темы</option>'+topics.map(t=>`<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('');
$('olympiadFilters').addEventListener('click',e=>{const btn=e.target.closest('[data-school]');if(!btn)return;state.olympiad=btn.dataset.school;renderSchoolFilters();renderYearFilters();renderResults();});
$('yearFilters').addEventListener('click',e=>{const btn=e.target.closest('[data-year]');if(!btn)return;state.year=btn.dataset.year;renderYearFilters();renderResults();});
$('search').addEventListener('input',e=>{state.query=e.target.value;renderResults();});
$('topicFilter').addEventListener('change',e=>{state.topic=e.target.value;renderResults();});
$('withSolution').addEventListener('change',e=>{state.solution=e.target.checked;renderResults();});
$('onlyQualitative').addEventListener('change',e=>{state.qualitative=e.target.checked;renderResults();});
$('resetFilters').addEventListener('click',reset);
$('resetEmpty').addEventListener('click',()=>{reset();$('search').focus();});
renderSchoolFilters();renderYearFilters();renderResults();renderSources();
