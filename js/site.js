(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let projects = [];
  let filter = 'all';
  let toastTimer;
  const escape = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = (s) => { try { const url = new URL(s); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
  const external = (link, cls = 'text-link') => { const url = safeUrl(link.url); return url ? `<a class="${cls}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(link.label)} <span aria-hidden="true">↗</span></a>` : ''; };
  const toast = (message) => { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000); };

  function theme(dark) {
    document.body.dataset.theme = dark ? 'dark' : 'light';
    $('#theme-toggle').setAttribute('aria-pressed', String(dark));
    $('#theme-toggle').setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
    $('meta[name="theme-color"]').content = dark ? '#162a38' : '#e9eef3';
  }
  try { theme(localStorage.getItem('hanxu-theme') === 'dark'); } catch { theme(false); }
  $('#theme-toggle').addEventListener('click', () => {
    const dark = document.body.dataset.theme !== 'dark'; theme(dark);
    try { localStorage.setItem('hanxu-theme', dark ? 'dark' : 'light'); } catch { /* Storage is optional. */ }
  });
  function clock() { $('#local-time').textContent = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Shanghai', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date()); }
  clock(); setInterval(clock, 60000); $('#year').textContent = new Date().getFullYear();

  const artwork = (p) => p.id === 'dramashift' ? `<div class="drama-orbit"></div><span class="drama-kicker">DramaShift / 开发中</span><span class="drama-title">剧变</span><span class="drama-line">剧本既定，世事剧变。</span><div class="drama-path"><span>对话</span><i></i><span>选择</span><i></i><span>另一种可能</span></div><span class="art-label">互动叙事概念演绎</span>` : p.id === 'cards' ? `<div class="paper-card back"><div class="paper-photo"></div></div><div class="paper-card front"><div class="paper-photo"></div><span class="paper-caption">Our little forever.</span><span class="paper-sub">MEMORIES TO KEEP</span></div><span class="art-label">卡册概念演绎</span>` : `<div class="code-window"><div class="code-top"><i class="code-dot"></i><i class="code-dot"></i><i class="code-dot"></i><span>dev-ai-kit</span></div><div class="code-body"><strong>$</strong> idea → plan → build<br><span class="done">✓</span> 记录一个好想法<br><span class="done">✓</span> 拆成清晰的步骤<br><span class="done">✓</span> 一步一步，让它发生<br><strong>ready to create</strong> <span class="code-cursor"></span></div></div><span class="art-label">开发流程概念演绎</span>`;
  function renderProjects() {
    const selected = projects.filter(p => filter === 'all' || p.category === filter);
    $('#projects').innerHTML = selected.length ? selected.map(p => `<article class="project" id="project-${escape(p.id)}"><button class="project-art ${p.id === 'dramashift' ? 'preview-drama' : p.id === 'cards' ? 'preview-cards' : 'preview-code'}" data-detail="${escape(p.id)}" aria-label="了解${escape(p.name)}"><span aria-hidden="true">${artwork(p)}<span class="art-open">↗</span></span></button><div class="project-meta"><h3>${escape(p.name)}</h3><span class="project-status" data-status="${escape(p.status)}">${escape(p.status)}</span></div><p>${escape(p.one_liner)}</p><div class="project-footer"><div class="tags">${p.stack.map(t => `<span>${escape(t)}</span>`).join('')}</div>${p.links.length ? p.links.map(l => external(l)).join('') : `<button class="text-link detail-button" data-detail="${escape(p.id)}">了解项目 <span>↗</span></button>`}</div></article>`).join('') : '<p class="empty">这个分类还没有公开作品。试试「全部作品」。</p>';
    $('#project-count').textContent = projects.length;
    $('#projects').classList.toggle('single-project', selected.length === 1);
  }
  function openProject(id) {
    const p = projects.find(p => p.id === id); if (!p) return;
    $('#project-detail').innerHTML = `<p class="eyebrow">${escape(p.category)} / ${escape(p.status)}</p><h2 id="detail-title">${escape(p.name)}</h2><p>${escape(p.description || p.one_liner)}</p><ul>${(p.highlights || []).map(h => `<li>${escape(h)}</li>`).join('')}</ul><div class="tags">${p.stack.map(s => `<span>${escape(s)}</span>`).join('')}</div>${p.links.map(l => external(l,'button primary')).join('')}${p.status === '开发中' ? '<p class="development-note">开发中 · 暂未开放公开体验</p>' : ''}`;
    $('#project-dialog').showModal();
  }
  document.addEventListener('click', e => { const button = e.target.closest('[data-detail]'); if (button) openProject(button.dataset.detail); });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => { const active = b === button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
    renderProjects();
  }));
  fetch('projects.json').then(r => { if (!r.ok) throw new Error('load'); return r.json(); }).then(data => {
    if (!Array.isArray(data.projects)) throw new Error('format');
    projects = data.projects.map(p => ({...p, category:p.category || (p.stack?.includes('AI') ? '开源' : '产品'), stack:Array.isArray(p.stack) ? p.stack : [], links:Array.isArray(p.links) ? p.links : []}));
    renderProjects();
    if (location.hash.startsWith('#project-')) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView({block:'start', behavior:'auto'}));
    }
    $('#update-list').innerHTML = [...projects].filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.updated)).sort((a,b) => b.updated.localeCompare(a.updated)).map(p => `<article class="update-row"><time datetime="${escape(p.updated)}">${escape(p.updated.replaceAll('-','.'))}</time><div><h3>${escape(p.name)}</h3><p>${escape(p.one_liner)}</p></div><button data-detail="${escape(p.id)}" aria-label="查看${escape(p.name)}详情">↗</button></article>`).join('') || '<p class="empty">暂时没有公开更新记录。</p>';
    renderSearch();
  }).catch(() => {
    $('#projects').innerHTML = '<p class="empty">作品暂时没有加载成功。<button id="retry-projects" class="text-link">重新加载</button>，或前往 <a href="https://github.com/hanxuzz">GitHub 主页</a>。</p>';
    $('#retry-projects').addEventListener('click', () => location.reload());
    $('#update-list').textContent = '更新记录暂时不可用。';
  });
  const pages = [{title:'AWS 四项认证与 Credly 主页',url:'#certifications',keywords:'证书 云 架构 Solutions Architect DevOps Professional AI Practitioner Security Credly 安全'},{title:'用 AI 改变生活',url:'#vision',keywords:'人工智能 AI 目的 方向 个人项目'},{title:'作品集',url:'#works',keywords:'产品 工具 开源'},{title:'关于寒煦',url:'#about',keywords:'个人 介绍 Hanxu 大连'},{title:'最近的更新',url:'#updates',keywords:'近况 动态'},{title:'联系寒煦',url:'#contact',keywords:'GitHub 合作 联系'}];
  function renderSearch() {
    const query = $('#search-input').value.trim().toLowerCase();
    const entries = [...pages, ...projects.map(p => ({title:p.name,url:`#project-${p.id}`,keywords:`${p.one_liner} ${p.stack.join(' ')} ${p.category} ${p.status}`,id:p.id}))].filter(p => `${p.title} ${p.keywords}`.toLowerCase().includes(query));
    $('#search-results').innerHTML = entries.length ? entries.map(p => `<a href="${escape(p.url)}" ${p.id ? `data-search-project="${escape(p.id)}"` : ''}>${escape(p.title)}<span aria-hidden="true">↗</span></a>`).join('') : '<p class="empty">没有找到相关内容，试试「AI」「卡册」或「关于」。</p>';
  }
  function search() { if ($('#project-dialog').open) $('#project-dialog').close(); if (!$('#search-dialog').open) $('#search-dialog').showModal(); $('#search-input').value=''; renderSearch(); $('#search-input').focus(); }
  $('#search-open').addEventListener('click',search);
  $('#search-input').addEventListener('input',renderSearch);
  $('#search-results').addEventListener('click', e => { const link = e.target.closest('a'); if (!link) return; $('#search-dialog').close(); if (link.dataset.searchProject) { e.preventDefault(); openProject(link.dataset.searchProject); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const openDialog = document.querySelector('dialog[open]'); if (openDialog) { e.preventDefault(); openDialog.close(); return; } } if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search(); } });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close(); } });
  });
  $('#copy-profile').addEventListener('click', async () => { try { await navigator.clipboard.writeText('https://github.com/hanxuzz'); toast('GitHub 地址已复制'); } catch { toast('复制失败，请使用上方的 GitHub 链接'); } });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  if (matchMedia('(hover: hover)').matches) {
    $('.hero').addEventListener('pointermove', e => { if (reducedMotion.matches) return; const r=$('.hero').getBoundingClientRect(); $('.sunscape').style.setProperty('--px', `${(e.clientX/r.width-.5)*25}px`); $('.sunscape').style.setProperty('--py', `${((e.clientY-r.top)/r.height-.5)*18}px`); });
    $('.hero').addEventListener('pointerleave', () => { $('.sunscape').style.setProperty('--px','0px'); $('.sunscape').style.setProperty('--py','0px'); });
  }
})();
