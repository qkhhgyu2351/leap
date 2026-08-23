/* ============================================================
   「你好，丽萍」 —— 三个页面共用这一份脚本
   一律用 textContent 建节点、不拼 HTML。
   ============================================================ */
(function (global) {
'use strict';

var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/* 手动拆日期，不用 new Date("2026-08-01")：
   那样按 UTC 解析，东八区会被拽回前一天。 */
function pd(s) {
  var p = String(s || '').split('-');
  return new Date(+p[0] || 1970, (+p[1] || 1) - 1, +p[2] || 1);
}
/* 时间按中文说法走：凌晨 / 上午 / 中午 / 下午 / 晚上 + 12 小时
   —— 比 09:49 或 9:49 AM 都更说明白那是一天里的什么时候。 */
function cnTime(t) {
  if (!t) return '';
  var p = String(t).split(':'), h = +p[0], m = p[1] || '00';
  var period = h < 6 ? '凌晨' : h < 12 ? '上午' : h < 13 ? '中午' : h < 18 ? '下午' : '晚上';
  var h12 = h % 12; if (h12 === 0) h12 = 12;
  return period + ' ' + h12 + ':' + m;
}
function fmtEN(d) { return MON[d.getMonth()] + ' ' + d.getDate() + ' · ' + d.getFullYear(); }
function fmtCN(d, t) { return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日' + (t ? ' ' + cnTime(t) : ''); }
function daysAgo(d) {
  var a = new Date(); a.setHours(0,0,0,0);
  var b = new Date(d); b.setHours(0,0,0,0);
  return Math.round((a - b) / 86400000);
}
/* 多久之前 —— 不管多久都照实说。隔了 217 天就写 217 天前，那是事实。 */
function agoText(n) {
  if (n <= 0) return '今天';
  if (n === 1) return '昨天';
  return n + ' 天前';
}
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function idOf(it) { return it.id || it.date; }

/* 每条自己的链接。回访的人就是照着日期点进来的 */
function linkOf(it, feed) {
  return 'entry.html?feed=' + encodeURIComponent(feed) + '&id=' + encodeURIComponent(idOf(it));
}

/* 日期 + 时间 合成一个可比较的时间戳；没写 time 的退回当天 00:00 */
function tsOf(it) {
  var d = pd(it.posted || it.date); if (!d) return 0;
  var t = (it.time || "00:00").split(":");
  var h = parseInt(t[0], 10) || 0, m = parseInt(t[1], 10) || 0;
  return d.getTime() + h * 3600000 + m * 60000;
}
function sorted(list) {
  return (list || []).filter(function (x) { return x && x.date; })
    .sort(function (a, b) { return tsOf(b) - tsOf(a); });
}

/* ---- 抬头上的「最近更新」 ----
   看的是整站，不是当前这一页。
   在 memories 里写了新的，首页这行也要跟着变 ——
   这句话说的是「这个站」什么时候更新的，
   只看本页数据的话，改了 memories 首页却纹丝不动。 */
function showUpdated() {
  var box = document.getElementById('updated');
  if (!box) return;
  var list = [].concat(global.ENTRIES || [], global.MEMORIES || [])
               .filter(function (x) { return x && (x.posted || x.date); });
  if (!list.length) { box.hidden = true; return; }
  /* 用 posted（哪天写上去的），没填才退回 date（内容是哪天的事）。
     不然写一篇 2015 年的旧事，这里就会显示 2015 年，站看着像荒废了。 */
  var newest = list.sort(function (a, b) {
    return pd(b.posted || b.date) - pd(a.posted || a.date);
  })[0];
  var d = pd(newest.posted || newest.date);
  box.textContent = '';
  box.appendChild(el('span', 'dot'));
  box.appendChild(el('span', 'lbl', '最近更新：'));
  box.appendChild(el('span', 'when', fmtCN(d)));
  box.appendChild(el('span', 'sep', '·'));
  box.appendChild(el('span', 'ago', agoText(daysAgo(d))));
  box.hidden = false;
}

/* ---- 穿插的话：没有日期，也没有链接 ---- */
function interludeNode(it) {
  var w = el('div', 'interlude');
  w.appendChild(el('div', 'mark', '“'));
  String(it.quote || it.body || '').split('\n').forEach(function (ln) {
    if (ln.trim()) w.appendChild(el('p', null, ln.trim()));
  });
  if (it.source) w.appendChild(el('div', 'src', it.source));
  return w;
}

/* ---- 时间分隔：轻量「萍」印章，穿插在不同日子之间 ---- */
function daySealNode() {
  var w = el('div', 'day-seal');
  var img = el('img'); img.src = 'assets/img/logo-ping-watercolor.png'; img.alt = '萍';
  w.appendChild(img);
  return w;
}

/* ---- 区隔语：固定顺序；同一次连续阅读中不重复，也不会随刷新随机跳换 ---- */
var EPIGRAPHS = [
  '有些日子不是过去，是慢慢沉到心里。',
  '写下来的，不一定要有人看见。',
  '风吹过的时候，旧事也会轻轻动一下。',
  '人总是要独自走过一些路，才能和自己和解。',
  '那些没有说完的话，还在原来的地方。',
  '时间不替人回答，只把答案留在后来。',
  '有些想念，不必叫出名字。',
  '日子往前走，心里总有一处还停在原地。',
  '真正留下来的，往往是当时没有在意的小事。',
  '不必每句话都有回音，写下来本身，就是一种回答。',
  '有些人不在身边，仍然在生活里。',
  '后来才明白，安静不是没有话说。',
  '能被记住的，从来不是时间，而是某一瞬的心动。',
  '往事不急着解释，留在这里就好。',
  '有些路走远了，回头看才知道自己曾经那么认真。',
  '生活继续发生，思念也有自己的位置。',
  '人这一生，真正能说给谁听的话，其实没几句。',
  '那些忽然想起的，都是没有真正离开的。',
  '夜深以后，很多事情才肯慢慢安静下来。',
  '不是所有离开，都有一句完整的告别。',
  '有些温柔，后来只能从记忆里拿出来。',
  '日子很长，某一个瞬间却会一直亮着。',
  '不必急着放下，先把今天过完。',
  '这一页翻过去，心里那一页还在。'
];
var quoteIndex = 0;
function nextQuote() {
  var quote = EPIGRAPHS[quoteIndex];
  quoteIndex += 1;
  return quote || '';
}

/* 指定日期交界的区隔语：来自「你好想法」的现有想法，只作用于对应的前后两天。 */
var DATE_BOUNDARY_PHRASES = {
  '2026-08-16|2026-08-15': '总要允许有些人短暂的出现在生活里，也要坦然接受任何人的离开。',
  '2026-08-19|2026-08-16': '安逸是一种牢笼，会把人困住，逆境是成长的阶梯。'
};
/* 按文章长短、密度和主题转折挑选，不按固定条数插入。 */
var DATE_BOUNDARY_KINDS = {
  '2026-08-22|2026-08-19': 'seal',
  '2026-08-19|2026-08-16': 'zhi',
  '2026-08-16|2026-08-15': 'zhi',
  '2026-08-13|2026-08-08': 'seal',
  '2026-08-07|2026-08-06': 'seal',
  '2026-08-06|2026-08-03': 'seal',
  '2026-08-03|2026-08-02': 'seal'
};
/* ---- 分隔符：多种形式轮换，不再有「独立体系」的特殊大块 ----
   kind:
     'seal' 萍图 + 波浪线（图形式）
     'quote' 金句（文字呼吸点，绝不重复）
     'zhi'  只在明确挑选的日期交界使用主题句 */
function dividerNode(kind, newerDate, olderDate) {
  if (kind === 'quote') {
    var q = el('div', 'divider divider-quote');
    q.appendChild(el('span', 'd-line'));
    q.appendChild(el('p', 'quote', nextQuote()));
    q.appendChild(el('span', 'd-line'));
    return q;
  }
  if (kind === 'zhi') {
    var z = el('div', 'divider divider-zhi');
    var key = String(newerDate || '') + '|' + String(olderDate || '');
    var zhiText = DATE_BOUNDARY_PHRASES[key];
    if (!zhiText) return daySealNode();
    z.appendChild(el('span', 'd-line'));
    z.appendChild(el('p', 'zhi', zhiText));
    z.appendChild(el('span', 'd-line'));
    return z;
  }
  return daySealNode(); /* 'seal' */
}

function bodyInto(box, text) {
  String(text || '').split('\n').forEach(function (line) {
    if (line.trim()) box.appendChild(el('p', null, line.trim()));
  });
}

/* ---- 首页/回忆页里的一条 ---- */
function entryNode(it, feed) {
  var w = el('article', 'entry');
  if (idOf(it) === '2026-08-22-小区别墅门前的小碎花') w.classList.add('entry-villa-tree');
  var href = linkOf(it, feed);

  var date = el('a', 'date');
  date.href = href;
  date.appendChild(document.createTextNode(fmtEN(pd(it.date))));
  if (it.time) date.appendChild(el('span', 'hm', cnTime(it.time)));
  w.appendChild(date);

  if (it.title) {
    var h = el('h2', 't');
    var a = el('a', null, it.title); a.href = href;
    h.appendChild(a); w.appendChild(h);
  }

  var body = el('div', 'body');
  bodyInto(body, it.body);
  w.appendChild(body);

  /* bg：图片当淡淡的底纹铺在文字后面（不占版面）
     image：图片作为照片放在正文下面
     两者独立，可同时存在 */
  if (it.bg) {
    w.classList.add('has-bg');
    lazyBg(w, it.bg);
    if (it.caption && !it.image) w.appendChild(el('div', 'photo-caption', it.caption));
    if (it.caption && it.caption.indexOf('底图') === 0) w.classList.add('tif-cap');
  }
  if (it.image) {
    var img = el('img', 'photo'); img.src = it.image; img.alt = it.imageCaption || it.caption || '';
    img.loading = 'lazy'; img.decoding = 'async';
    w.appendChild(img);
    var ic = it.imageCaption || (it.caption ? it.caption : '');
    if (ic) w.appendChild(el('div', 'photo-caption', ic));
  }

  /* 首页/详情页都平铺全文，不设限高、不给「阅读全文」——
     单流就该一口气读完；落款随全文一起出现。 */
  if (it.sign) w.appendChild(el('div', 'sign', it.sign));
  return w;
}

/* ============================================================
   渲染内容流
   ------------------------------------------------------------
   三层分工，各管各的，不重复：
     首页 index.html   今时 —— 一条连续往下滚的单流，所有条目都在里面，
                       不截断、不丢失；滚到最末，一个固定的「阅读更多 → 往日」
                       收口，去往日页（全量文字清单）。
     往日页 archive.html  全部条目，按年月列成纯文字链接，负责「找得到」；
                       顶部有一个极简过滤框，输入即筛，无后端。
     单条页 entry.html    底部有「上一条 / 下一条」，负责「顺着一直读」。

   内容永不丢：首页把全部条目都画出来（不写死条数），第 N 条永远点得出来；
   「阅读更多」是常驻出口，不是按条数飘移的按钮。
   ============================================================ */
function renderFeed(opt) {
  var into = document.querySelector(opt.into);
  if (!into) return;
  /* 数据直接来自 entries.js / memories.js 里的全局数组，不用 fetch。
     fetch 读本地文件会被浏览器拦掉 —— 双击打开 HTML 就会整页空白。 */
  var raw = opt.data || [];
  try {
    var list = sorted(raw);
    showUpdated();

    /* limit 传 0 / 不传 / 负数 = 不截断，把全部条目画出来；
       传正整数才截断（目前首页用 0，也就是一条不漏）。 */
    var LIMIT = (typeof opt.limit === 'number' && opt.limit > 0) ? opt.limit : list.length;
    var frag = document.createDocumentFragment();
    var shown = 0, i = 0, lastDate = null;

    for (; i < list.length && shown < LIMIT; i++) {
      var it = list[i];
      /* 穿插语不计数 —— 它不是一条内容，只是喘口气 */
      if (it.interlude) { frag.appendChild(interludeNode(it)); continue; }
      if (lastDate !== null && it.date !== lastDate) {
        /* 只在明确需要的主题转折处换气；同一天不自动插入区隔。 */
        var key = String(lastDate) + '|' + String(it.date);
        var boundaryKind = DATE_BOUNDARY_KINDS[key];
        if (boundaryKind) {
          frag.appendChild(dividerNode(boundaryKind, lastDate, it.date));
        }
      }
      frag.appendChild(entryNode(it, opt.feed));
      lastDate = it.date;
      shown++;
    }
    /* 正好卡在穿插语前面的话，把它一并铺完 ——
       不然它会孤零零吊在「更早的日子」上方，像话没说完 */
    while (i < list.length && list[i].interlude) frag.appendChild(interludeNode(list[i++]));

    into.appendChild(frag);
    var renderedEntries = into.querySelectorAll(".entry");
    if (renderedEntries.length) renderedEntries[renderedEntries.length - 1].id = "earliest";

    /* 今时流已铺完全部内容；末尾这个「阅读更多」是去往日（全量文字清单）的常驻入口，
       不随条数飘移 —— 写 14 条它钉在第 14 条之后，写 200 条也钉在最末。 */
    var more = document.getElementById('moreDays');
    if (more) more.hidden = false;

    initReveal();
  } catch (err) {
    into.appendChild(el('div', 'entry visible', '内容没读出来：' + err.message));
  }
}

/* ---- 归档页：按年月列全，一条都不少 ----
   纯文字链接，一万条也就一万个 <a>，机器毫无压力。
   首页负责「顺着读」，这里负责「找得到」。 */
function renderArchive() {
  var into = document.getElementById('archive');
  if (!into) return;
  var list = sorted(global.ENTRIES || []).filter(function (x) { return !x.interlude; });

  var cnt = document.getElementById('archiveCount');
  if (cnt) cnt.textContent = '共 ' + list.length + ' 幕';

  var groups = [], seen = {};
  list.forEach(function (it) {
    var d = pd(it.date), key = d.getFullYear() + '-' + (d.getMonth() + 1);
    if (!seen[key]) { seen[key] = { y: d.getFullYear(), m: d.getMonth() + 1, items: [] }; groups.push(seen[key]); }
    seen[key].items.push(it);
  });

  var frag = document.createDocumentFragment();
  var ul = el('ul', 'ar-list');           /* 整条时间线只有一个 ul，线才连得起来 */
  var lastYear = null;
  var pad = function (n) { return ('0' + n).slice(-2); };
  groups.forEach(function (g) {
    /* 年份变化：在时间线上插一个实心大节点，当作分章 */
    if (g.y !== lastYear) {
      var yl = el('li', 'ar-year-item');
      yl.appendChild(el('span', 'ar-year-label', g.y + ''));
      ul.appendChild(yl);
      lastYear = g.y;
    }
    g.items.forEach(function (it) {
      var d = pd(it.date);
      var li = el('li', 'ar-item');
      var a = el('a'); a.href = linkOf(it, 'memories');
      a.appendChild(el('span', 'ar-date', d.getFullYear() + ' · ' + pad(d.getMonth() + 1) + ' · ' + pad(d.getDate())));
      /* 没写标题的，拿正文头一句顶上，超过 22 字带个省略号 */
      var t = it.title;
      if (!t) {
        var first = String(it.body || '').split('\n').filter(function (s) { return s.trim(); })[0] || '';
        first = first.trim();
        t = first.length > 22 ? first.slice(0, 22) + '…' : first;
      }
      a.appendChild(el('span', 'ar-title', t));
      /* 卡片里再带一句正文，扫一眼就知道这天写了什么 */
      var body = String(it.body || '').split('\n').filter(function (s) { return s.trim(); })[0] || '';
      body = body.trim();
      if (body) a.appendChild(el('span', 'ar-excerpt', body.length > 44 ? body.slice(0, 44) + '…' : body));
      li.appendChild(a); ul.appendChild(li);
    });
  });
  frag.appendChild(ul);
  into.appendChild(frag);

  /* 极简过滤：输入即筛，纯客户端，无后端。只按标题/日期文字匹配；空着就显示全部。 */
  var filter = document.getElementById('arFilter');
  if (filter) {
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      var lis = into.querySelectorAll('li');
      Array.prototype.forEach.call(lis, function (li) {
        var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.style.display = hit ? '' : 'none';
      });
    });
  }
}

/* ---- 分享卡片 ----
   微信/朋友圈读的是 <head> 里的 og 标签，不是 document.title。
   单条页原先 og 写死成「你好，丽萍」、description 空 ——
   任何一条分享出去都是同一张空白卡片。这里按当前这条改掉。 */
function setMeta(prop, val) {
  if (!val) return;
  var m = document.querySelector('meta[property="' + prop + '"]');
  if (!m) {
    m = document.createElement('meta');
    m.setAttribute('property', prop);
    document.head.appendChild(m);
  }
  m.setAttribute('content', val);
}
function setShare(it, d) {
  var title = (it.title || fmtCN(d)) + ' · 你好，丽萍';
  /* 摘要取正文头一段，去掉换行，留 80 字 */
  var desc = String(it.body || '').split('\n').filter(function (s) { return s.trim(); })[0] || '';
  desc = desc.trim().slice(0, 80);
  document.title = title;
  setMeta('og:title', title);
  setMeta('og:description', desc);
  setMeta('og:url', location.href);
  var img = it.image || it.bg;
  if (img) setMeta('og:image', new URL(img, location.href).href);
  var dm = document.querySelector('meta[name="description"]');
  if (dm) dm.setAttribute('content', desc);
}

/* ---- 单条页面 ---- */
function renderEntry() {
  var q = new URLSearchParams(location.search);
  var feed = q.get('feed') || 'home';
  var id = q.get('id') || '';
  var raw = feed === 'memories' ? (global.MEMORIES || []) : (global.ENTRIES || []);
  var backHref = 'index.html';
  var backText = '← 回到首页';

  var box = document.getElementById('article');
  if (id === '2026-08-22-小区别墅门前的小碎花') box.classList.add('entry-villa-tree');
  {
    var list = sorted(raw).filter(function (x) { return !x.interlude; });
    var i = -1;
    for (var k = 0; k < list.length; k++) if (idOf(list[k]) === id) { i = k; break; }
    if (i < 0) {
      box.appendChild(el('h1', null, '没有找到这一条'));
      box.appendChild(el('p', null, '它可能已经被改掉了。'));
    } else {
      var it = list[i];
      var d = pd(it.date);
      setShare(it, d);
      var dateEl = el('div', 'date');
      dateEl.appendChild(document.createTextNode(fmtEN(d)));
      if (it.time) dateEl.appendChild(el('span', 'hm', cnTime(it.time)));
      box.appendChild(dateEl);
      box.appendChild(el('h1', null, it.title || fmtCN(d)));
      var body = el('div', 'body');
      bodyInto(body, it.body);
      box.appendChild(body);
      if (it.bg) {
        box.classList.add('has-bg');
        lazyBg(box, it.bg);
        if (it.caption) box.appendChild(el('div', 'photo-caption', it.caption));
        if (it.caption && it.caption.indexOf('底图') === 0) box.classList.add('tif-cap');
      }
      if (it.image) {
        var img = el('img', 'photo'); img.src = it.image; img.alt = it.imageCaption || it.caption || '';
        img.loading = 'lazy'; img.decoding = 'async';
        box.appendChild(img);
        var ic = it.imageCaption || '';
        if (ic) box.appendChild(el('div', 'photo-caption', ic));
      }
      if (it.sign) box.appendChild(el('div', 'sign', it.sign));

      /* 上一条 / 下一条：常来的人会顺着往下读 */
      var around = el('div', 'around');
      if (list[i + 1]) {                      // 上一条（更早）
        var p = el('a', 'prv'); p.href = linkOf(list[i + 1], feed);
        p.appendChild(el('span', 'lbl', '上一条'));
        p.appendChild(document.createTextNode(list[i + 1].title || fmtCN(pd(list[i + 1].date))));
        around.appendChild(p);
      }
      if (list[i - 1]) {                      // 下一条（更新）
        var n = el('a', 'nxt'); n.href = linkOf(list[i - 1], feed);
        n.appendChild(el('span', 'lbl', '下一条'));
        n.appendChild(document.createTextNode(list[i - 1].title || fmtCN(pd(list[i - 1].date))));
        around.appendChild(n);
      }
      if (around.children.length) box.appendChild(around);
    }
    var back = document.getElementById('backHome');
    if (back) { back.href = backHref; back.textContent = backText; }
    initReveal();
  }
}

/* ---- 滚动淡入 ---- */
function initReveal() {
  var els = document.querySelectorAll('.entry:not(.visible), .interlude:not(.visible)');
  var reduce = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in global) || reduce) {
    Array.prototype.forEach.call(els, function (e) { e.classList.add('visible'); });
    return;
  }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: .06, rootMargin: '0px 0px -40px 0px' });
  Array.prototype.forEach.call(els, function (e) { io.observe(e); });
}


/* ============================================================
   底纹图的懒加载
   bg 是用 CSS 变量当背景图铺的，而 CSS 背景图**没有** loading="lazy"
   可用 —— 只要元素在渲染树里，浏览器就会去下载，哪怕它在几千像素之外。
   所以只能自己看：滚到跟前 300px 才把 url 塞进去。
   不支持 IntersectionObserver 的老浏览器直接给上，不影响功能。
   ============================================================ */
var bgIO = null;
function lazyBg(elm, url) {
  if (!('IntersectionObserver' in global)) {
    elm.style.setProperty('--entry-bg', 'url("' + url + '")');
    adaptTextColor(elm, url);
    return;
  }
  elm.setAttribute('data-bg', url);
  if (!bgIO) {
    bgIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target, u = t.getAttribute('data-bg');
        if (u) {
          t.style.setProperty('--entry-bg', 'url("' + u + '")');
          adaptTextColor(t, u);
          t.removeAttribute('data-bg');
        }
        bgIO.unobserve(t);
      });
    }, { rootMargin: '300px 0px' });
  }
  bgIO.observe(elm);
}

/* RGB → CSS hsl 串（保留，别处可能用到） */
function hslStr(h, s, l) {
  return 'hsl(' + Math.round(h) + ',' + Math.round(s) + '%,' + Math.round(l) + '%)';
}
/* hsl → rgb 数组（0..255） */
function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360; s /= 100; l /= 100;
  if (s === 0) { var g = Math.round(l * 255); return [g, g, g]; }
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  var p = 2 * l - q;
  function ch(t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  return [Math.round(ch(h + 1 / 3) * 255), Math.round(ch(h) * 255), Math.round(ch(h - 1 / 3) * 255)];
}
/* WCAG 相对亮度 */
function relLum(rgb) {
  var a = rgb.map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
/* WCAG 对比度（c1/c2 为 [r,g,b]） */
function contrast(c1, c2) {
  var L1 = relLum(c1), L2 = relLum(c2);
  var hi = Math.max(L1, L2), lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}
function rgbCss(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

/* 按底图给文字配色：既「协调」又「一定读得清」。
   协调 —— 取底图最有代表性的色调（跳过接近灰的雾气，只 average 有颜色的像素，
           向量求平均），用它的补色当墨色相：冷图→暖墨、暖图→冷墨，
           正好呼应站点「金=当下 / 雾蓝=旧日」的叙事；
   可读 —— 底图在网页里是 .26 透明度叠在米色纸面(--bg)上，先合成出
           「文字实际坐着的底色」，据此选深墨或浅墨，再扫描明度直到
           WCAG 对比 ≥4.5，所以换哪张图、底图是亮是暗都不会糊。
   读不到像素（如本地双击打开被跨域拦）一律回退深雾蓝，安全默认。 */
var PAPER = [244, 241, 235];   // --bg #F4F1EB 矿物档案·石灰纸白
function adaptTextColor(elm, url, opts) {
  opts = opts || {};
  var alpha = opts.alpha != null ? opts.alpha : 0.26;
  if (!url) return;
  var img = new Image();
  img.onload = function () {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 32;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 32, 32);
      var px = ctx.getImageData(0, 0, 32, 32).data, n = px.length / 4;
      /* 平均色（算有效底色）+ 有代表性的色调（只统计有饱和度的像素，向量求平均） */
      var sr = 0, sg = 0, sb = 0, sx = 0, sy = 0, satSum = 0, satCnt = 0;
      for (var i = 0; i < n; i++) {
        var r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
        sr += r; sg += g; sb += b;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        var sat = mx > 0 ? d / mx : 0;
        if (sat > 0.12) {                       // 雾气偏灰、饱和度低，跳过，免得墨色发脏
          var h = rgbHue(r, g, b) * Math.PI / 180;
          sx += Math.cos(h); sy += Math.sin(h); satSum += sat; satCnt++;
        }
      }
      var ar = sr / n, ag = sg / n, ab = sb / n;
      var hue, satAvg;
      if (satCnt > 0) {
        hue = Math.atan2(sy / satCnt, sx / satCnt) * 180 / Math.PI;
        if (hue < 0) hue += 360;
        satAvg = satSum / satCnt;
      } else { hue = rgbHue(ar, ag, ab); satAvg = 0; }
      var comp = (hue + 180) % 360;             // 补色相：冷暖对调，最协调
      /* 文字实际坐的底色 = 底图(.alpha) 叠在纸面(1-alpha) */
      var ef = [ar * alpha + PAPER[0] * (1 - alpha),
                ag * alpha + PAPER[1] * (1 - alpha),
                ab * alpha + PAPER[2] * (1 - alpha)];
      var Lbg = relLum(ef);
      var dark = Lbg > 0.42;                     // 纸面浅，通常走深墨
      var sat = Math.min(58, 16 + satAvg * 60);  // 讨喜但不刺眼的饱和
      var chosen = null;
      for (var L = dark ? 24 : 90; dark ? L <= 64 : L >= 18; dark ? L += 2 : L -= 2) {
        var rgb = hslToRgb(comp, sat, L);
        if (contrast(rgb, ef) >= 4.5) { chosen = rgb; break; }
      }
      elm.style.setProperty('--text-on-bg',
        chosen ? rgbCss(chosen) : (dark ? 'rgb(38,35,31)' : 'rgb(247,244,238)'));
    } catch (e) {
      elm.style.setProperty('--text-on-bg', '#2F4554');
    }
  };
  img.onerror = function () { elm.style.setProperty('--text-on-bg', '#2F4554'); };
  img.src = url;
}

/* RGB 求色相 0..360 */
function rgbHue(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
  if (d === 0) return 0;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return h;
}

/* ============================================================
   背景音乐
   带声音的自动播放会被所有浏览器拦截，「静音自动播放」一律放行。
   所以：先试一次带声音播；不成就等用户任意一次触碰再补上，
   声音瞬间就出（已经缓冲好了）。微信里可以直接带声音自动播。
   ============================================================ */
function initBGM() {
  var audio = document.getElementById('bgm');
  var btn   = document.getElementById('bgmToggle');
  if (!audio || !btn) return;

  /* 轻柔默认音量（0.3）——「安静角落」的基调，不轰人。
     首次起播时再从 0 淡入，避免声音突然炸出来。 */
  audio.volume = 0.3;
  var fadedIn = false;
  function fadeIn() {
    if (fadedIn) return; fadedIn = true;
    var target = 0.3, v = 0, step = target / 30;
    audio.volume = 0;
    var t = setInterval(function () {
      v = Math.min(target, v + step);
      audio.volume = v;
      if (v >= target) { clearInterval(t); audio.volume = target; }
    }, 50);
  }

  var KEY_TIME = 'liping-bgm-time';
  var KEY_PLAY = 'liping-bgm-playing';
  /* 上一页离开时音乐在播吗？整页跳转后（本地 file:// 预览就是这样）
     据此在新页面续播，而不是等用户再点一下。 */
  var wasPlaying = sessionStorage.getItem(KEY_PLAY) === '1';
  /* 「用户手动关掉了」只放在内存里。绝不写进 sessionStorage —— 那会导致
     关过一次之后，整个浏览器会话再也不自动播，刷新都救不回来。 */
  var userOff = false;

  /* 音频文件不存在就别显示按钮 */
  audio.addEventListener('error', function () { btn.hidden = true; });
  audio.addEventListener('canplay', function () { btn.hidden = false; }, { once: true });

  /* 翻页后接着上一页的进度 —— 这几页是真跳转，
     不接进度的话每翻一页音乐都从头开始。 */
  var at = parseFloat(sessionStorage.getItem(KEY_TIME) || '0');
  if (at > 0) {
    audio.addEventListener('loadedmetadata', function () {
      if (at < audio.duration) audio.currentTime = at;
    }, { once: true });
  }

  function sync() {
    var on = !audio.paused && !audio.muted;
    btn.classList.toggle('playing', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? '关掉背景音乐' : '播放背景音乐');
  }
  ['play','pause','volumechange'].forEach(function (e) { audio.addEventListener(e, sync); });

  /* 先试一次带声音播。失败也不退回「静音播放」——
     元素一旦以静音豁免的身份跑起来，浏览器会给它打标记，之后解不了静音。 */
  audio.muted = false;
  audio.play().catch(function () {});

  /* 延迟预热：页面上的 preload 是 none，一开始一个字节都不下，
     首屏不用跟 3MB 的音频抢带宽。等首屏画完再过 1.5 秒，
     后台悄悄开始缓冲 —— 人从看到页面到伸手去碰通常要 3~5 秒，
     那时候早缓冲好了，触碰即出声，和以前没有区别。
     注意：这里只管「什么时候开始下载」，不碰任何播放逻辑。 */
  var warmed = false;
  function prewarm() {
    if (warmed || userOff) return;
    warmed = true;
    try { audio.preload = 'auto'; audio.load(); } catch (err) {}
  }
  if (wasPlaying) setTimeout(prewarm, 200);   /* 上一页在播：尽快续上，别等那 1.5 秒 */
  else if (document.readyState === 'complete') setTimeout(prewarm, 1500);
  else global.addEventListener('load', function () { setTimeout(prewarm, 1500); });
  /* 万一用户比预热还快：任何一次触碰都立刻开始缓冲，不必等那 1.5 秒 */
  ['pointerdown','touchstart','keydown','wheel','scroll'].forEach(function (e) {
    global.addEventListener(e, prewarm, { passive: true, once: true });
  });

  /* 任何一次交互都再试一次，而且监听器永不卸载：
     卸载之后如果音频再被暂停（切后台、浏览器策略），就再也唤不醒了。 */
  function start() {
    if (userOff || !audio.paused) return;
    try {
      audio.muted = false;
      var p = audio.play();
      if (p && p.then) p.then(sync).catch(function () {});
    } catch (err) {}
    fadeIn();   /* 首次起播从 0 淡入到 0.4，不突兀 */
    sync();
  }
  ['pointerdown','touchstart','click','keydown','wheel','scroll'].forEach(function (e) {
    global.addEventListener(e, start, { passive: true });
  });
  audio.addEventListener('canplay', start);
  audio.addEventListener('loadeddata', start);

  /* 微信内置浏览器允许直接带声音自动播 */
  function wechatGo() { if (!userOff) { audio.muted = false; audio.play().catch(function () {}); sync(); } }
  document.addEventListener('WeixinJSBridgeReady', wechatGo, false);
  if (global.WeixinJSBridge) wechatGo();

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !userOff && audio.paused) audio.play().catch(function () {});
  });

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (audio.paused || audio.muted) {
      userOff = false;
      var p = audio.play();
      if (p && p.then) p.then(function () { audio.muted = false; sync(); }).catch(function () {});
      else audio.muted = false;
    } else {
      userOff = true;
      audio.pause();
    }
    sync();
  });

  /* 记住进度 + 是否在播，翻页接着放 */
  var save = function () {
    sessionStorage.setItem(KEY_TIME, String(audio.currentTime || 0));
    sessionStorage.setItem(KEY_PLAY, (audio.paused || audio.muted) ? '0' : '1');
  };
  setInterval(save, 2000);
  global.addEventListener('pagehide', save);
  /* 用户主动暂停后立刻记「不在播」，避免续播又把它拉起来 */
  audio.addEventListener('pause', function () { sessionStorage.setItem(KEY_PLAY, '0'); });
  sync();
}


/* ============================================================
   每页内容就绪后跑这个。软导航换完内容也会再跑一次，
   所以渲染要看 DOM 上的标记，而不是写在页面里的 inline script
   —— inline script 在软导航时是不会被重新执行的。
   ============================================================ */
function initPage() {
  var stream = document.getElementById('stream');
  if (stream) {
    var which = stream.getAttribute('data-feed');
    renderFeed({
      data: which === 'memories' ? (global.MEMORIES || []) : (global.ENTRIES || []),
      into: '#stream', feed: which, limit: 0, fullFirst: which === 'home' || which === 'memories'
    });
  }
  if (document.getElementById('archive')) renderArchive();
  if (document.getElementById('article')) renderEntry();
  /* 凡是文字压在底图上的地方，都按底图配色（不止 entry 的 bg 字段）：
     归档页抬头压 lake-dusk、收尾带压 dusk、首页 hero 压雪野湖。
     这些图的 url 写死在 CSS 里，这里照着配，换图要两处一起改。 */
  var ph = document.querySelector('body.pg-archive .page-head');
  if (ph) adaptTextColor(ph, 'assets/img/lake-dusk.jpg');
  var cl = document.querySelector('.closing');
  if (cl) adaptTextColor(cl, 'assets/img/dusk.jpg');
  var hero = document.querySelector('.hero');
  if (hero) adaptTextColor(hero, 'assets/img/莱芜雪野湖清晨雾气中的湖心树木群.jpg');
  initReveal();
}

/* ============================================================
   软导航：站内跳转用 JS 换内容，不整页重载。
   这样 <audio> 元素一直活着 —— 音乐不断、不重来。
   关键：不依赖 fetch —— 三个页面的结构由数据 + 模板生成，
   所以本地 file:// 双击打开也一样生效（file:// 下 fetch 被
   浏览器禁掉，旧版在本地会退回整页跳转、音乐必断）。
   ============================================================ */
/* 首页 hero（含书法 SVG）模板：软导航去 archive/entry 再回来时用它重建 */
var HERO_HTML = "<section class=\"hero\" id=\"latest\"><h1 class=\"sr-only\">你好，丽萍</h1>\n  <div class=\"hero-bg\" aria-hidden=\"true\"></div>\n  <svg class=\"title\" viewBox=\"6 -922 4427 1050\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"你好，丽萍\"><g transform=\"scale(1 -1)\"><g class=\"t-hi\"><path d=\"M707 305H731Q756 306 770.5 292.5Q785 279 790 279Q798 279 826.0 250.0Q854 221 854 214Q854 205 838 195Q825 186 773.0 168.0Q721 150 697.5 145.5Q674 141 665.5 134.0Q657 127 649.0 129.5Q641 132 696 182Q745 226 751.0 245.0Q757 264 729 287ZM531 654Q511 593 513.0 590.5Q515 588 593 627Q650 655 668.5 660.0Q687 665 729 665Q766 665 778.0 663.0Q790 661 797 652Q823 616 777.0 538.0Q731 460 651 406L622 387L620 273Q618 178 610.5 108.0Q603 38 593.5 27.5Q584 17 571.5 19.5Q559 22 534 40Q503 60 475.0 67.0Q447 74 435 95Q428 109 422.0 111.5Q416 114 404 111Q377 105 362.0 121.0Q347 137 317 205Q290 268 276 164Q271 134 263.5 127.0Q256 120 237 127Q221 134 211.0 163.0Q201 192 195.0 201.0Q189 210 199 238Q215 284 214.5 332.5Q214 381 197 381Q191 381 141.5 346.0Q92 311 89 305Q87 301 77 288Q62 267 52 293Q46 306 46 329Q46 352 50.0 361.5Q54 371 67 385Q98 414 151.5 496.0Q205 578 248 659Q270 701 274.5 714.5Q279 728 274 738Q263 755 275 754Q284 753 302 740Q325 725 323.5 711.5Q322 698 291 649Q263 604 241.0 562.5Q219 521 194.5 480.5Q170 440 170.0 436.0Q170 432 204.5 426.5Q239 421 252.5 408.0Q266 395 275.0 395.0Q284 395 309 447Q317 463 322.5 472.0Q328 481 332.5 486.0Q337 491 339.5 491.0Q342 491 345 489Q354 482 368 494Q394 518 437.0 615.5Q480 713 480 749Q480 774 485.5 776.5Q491 779 518.0 765.0Q545 751 547.5 730.5Q550 710 531 654ZM698 606Q673 606 603.5 567.5Q534 529 528 513Q527 510 532.5 505.0Q538 500 547 496Q570 486 583.0 471.5Q596 457 605 457Q618 457 651.0 500.5Q684 544 699 581Q707 600 707.0 604.0Q707 608 698 606ZM340 380Q337 383 336 394Q334 409 324.5 409.0Q315 409 304 352Q292 293 292.5 275.5Q293 258 308 258Q323 258 345.5 245.0Q368 232 388 237Q430 249 483 290Q518 316 523.5 333.0Q529 350 512 367Q497 381 494.5 426.5Q492 472 490.0 474.5Q488 477 423 425Q353 370 340 380ZM521 272Q509 272 472.0 218.5Q435 165 439 156Q444 150 474 140Q504 129 510.0 139.5Q516 150 522 212Q527 272 521 272Z\" transform=\"translate(0 0)\"/><path d=\"M263 756Q271 756 286 749Q321 733 330.0 685.0Q339 637 317 590L302 557L319 540L337 521L362 536Q386 551 399.5 568.5Q413 586 439.0 596.0Q465 606 479 613Q580 660 627.0 666.0Q674 672 686 638Q691 623 687.5 611.5Q684 600 660 561Q625 506 601 474L577 441L608 412Q640 382 640 374Q640 367 669.0 366.5Q698 366 724 374Q750 381 797 366Q833 356 843.0 346.0Q853 336 848 315Q845 304 833.5 301.0Q822 298 768 296Q691 291 669 287Q653 284 650.0 279.0Q647 274 647 251Q647 222 630.5 157.5Q614 93 602 75Q576 34 501 39Q451 43 420.5 60.5Q390 78 371 114Q353 151 353 166Q353 177 350 177Q349 178 337 163Q326 152 319.5 149.5Q313 147 302 150Q283 154 279 166Q275 183 265.0 197.5Q255 212 249 212Q241 212 223 184Q193 140 159.0 130.0Q125 120 103 149Q85 174 66.5 236.0Q48 298 51 324Q54 338 62.5 344.0Q71 350 114 368Q154 385 154.0 392.5Q154 400 170.0 426.0Q186 452 191.0 468.5Q196 485 226.0 554.0Q256 623 268 666Q275 694 275.5 704.0Q276 714 270 727L258 751Q255 756 263 756ZM577 586Q576 587 569.0 584.5Q562 582 550.5 576.5Q539 571 525 564Q490 544 480.0 542.0Q470 540 455 548Q432 559 420.5 555.0Q409 551 380 522Q346 487 338.5 456.0Q331 425 311.0 372.5Q291 320 291.0 309.0Q291 298 316 249Q337 207 340 206Q342 206 347 219Q353 239 350 277L349 315L410 319Q472 323 492 330Q515 337 516 347Q516 352 508 352Q498 352 490.0 368.5Q482 385 478.0 406.0Q474 427 476.0 445.5Q478 464 487 466Q534 481 568 558Q578 581 577 586ZM270 475Q277 475 277.0 482.0Q277 489 270.0 489.0Q263 489 263.0 482.0Q263 475 270 475ZM80 306Q65 297 92.0 252.5Q119 208 140 208Q155 208 185.5 248.5Q216 289 210 301Q207 311 186 318Q168 324 162.5 324.0Q157 324 143.5 318.0Q130 312 109.0 312.0Q88 312 80 306ZM574 270H539Q505 270 501.5 266.0Q498 262 454 258L410 253L408 219Q407 196 410.5 184.5Q414 173 430 153Q446 132 454.0 127.5Q462 123 484 123Q510 124 530.5 135.0Q551 146 557 165Q564 181 569 226Z\" transform=\"translate(900 0)\"/><path d=\"M419 236Q419 242 424 242Q458 242 481.0 201.5Q504 161 504.0 137.5Q504 114 499.5 93.0Q495 72 468.5 6.5Q442 -59 427.5 -59.0Q413 -59 405.0 -25.5Q397 8 397.0 41.5Q397 75 403.5 107.5Q410 140 414 160Q423 196 423 209Z\" transform=\"translate(1800 0)\"/></g><g class=\"t-name\"><path d=\"M641 756Q687 741 687 718Q687 710 640 707Q547 699 436 611Q369 560 347.0 535.5Q325 511 318 486Q309 450 318 450Q321 449 330 455Q352 466 382.5 461.0Q413 456 413 441Q413 428 417.0 428.0Q421 428 456.0 462.5Q491 497 505 494Q521 489 559.5 513.5Q598 538 639 577Q650 588 658.0 589.5Q666 591 700.0 584.5Q734 578 740.5 573.5Q747 569 750 551Q783 385 783 156V31H765Q750 31 729.5 41.0Q709 51 703 60Q697 71 657 95Q621 116 602.0 134.0Q583 152 588 160Q593 169 601 162Q608 156 644.5 145.0Q681 134 693 134Q700 134 701.0 146.0Q702 158 700 198Q696 264 688.5 273.0Q681 282 648.5 293.5Q616 305 604 311Q590 319 582.5 306.5Q575 294 571 256Q555 112 544 93Q528 64 498 94Q489 102 485.0 113.0Q481 124 482.5 132.5Q484 141 491 141Q519 141 519 305Q520 385 518.0 405.5Q516 426 505 439Q491 458 481.5 458.0Q472 458 451 416Q436 387 432.0 366.5Q428 346 425 282Q419 149 394 143Q383 141 366 154Q348 169 325.5 178.0Q303 187 294 185Q283 180 283 164Q283 127 260 127Q244 127 232.0 153.0Q220 179 225 203Q229 226 235 267Q261 432 269 457Q276 478 309.5 515.5Q343 553 383 585Q430 623 455 645Q480 668 467 666Q450 665 352 616Q250 563 222 560Q200 557 169.5 568.5Q139 580 123 599Q113 610 120 611Q126 612 153 612Q205 612 270.0 632.0Q335 652 437 698Q472 714 519.5 732.0Q567 750 588 758Q599 764 609.5 763.5Q620 763 641 756ZM640 496Q622 482 589.5 465.0Q557 448 557.0 443.0Q557 438 568 405Q576 382 581.5 377.5Q587 373 604 374Q629 376 659 370L689 364L685 418Q680 471 675 491Q672 508 664.5 509.0Q657 510 640 496ZM325 418Q318 409 308.5 339.5Q299 270 305 266Q307 265 317.0 276.0Q327 287 338 304Q359 335 364.0 359.5Q369 384 359 410Q353 425 344.0 427.5Q335 430 325 418ZM341 254Q330 242 332.0 235.5Q334 229 345 229Q359 229 359 247Q359 274 341 254Z\" transform=\"translate(2700 0)\"/><path d=\"M220 485Q236 470 235.5 457.0Q235 444 218 437Q198 429 187 424Q179 419 179 422Q178 425 182 439Q190 458 186 479Q183 491 187.0 496.5Q191 502 200.0 498.5Q209 495 220 485ZM540 637Q585 632 585.0 614.0Q585 596 538 550Q463 476 501 474Q516 473 544 485Q582 499 602 499Q620 499 638.0 490.5Q656 482 659.0 473.0Q662 464 619.5 423.0Q577 382 580 379Q586 374 628.5 375.0Q671 376 678 383Q686 390 711.5 387.0Q737 384 737 376Q737 371 763 359Q786 349 791.5 335.5Q797 322 784 314Q771 307 722 307Q700 307 672.5 303.0Q645 299 620.0 293.0Q595 287 574.5 279.5Q554 272 542.5 264.0Q531 256 533 250Q536 241 539 138Q539 74 536.5 44.5Q534 15 524 -21Q509 -79 503.0 -84.5Q497 -90 478 -87L458 -82L457 53Q455 157 452.0 184.5Q449 212 441 212Q434 212 387.5 188.5Q341 165 287 150Q236 136 224.0 129.5Q212 123 205 111Q196 90 180.5 96.0Q165 102 152 130Q144 146 143.5 157.0Q143 168 148 191Q156 227 153.0 267.0Q150 307 156.5 307.0Q163 307 187 283Q204 265 209.0 264.0Q214 263 224 273Q236 287 273.5 365.5Q311 444 311.0 475.0Q311 506 329.5 523.0Q348 540 354 540Q362 540 426.0 579.5Q490 619 500 629Q511 641 540 637ZM332 486Q332 459 321.5 433.0Q311 407 317 402Q321 398 345.5 420.5Q370 443 392.5 470.5Q415 498 415.0 506.0Q415 514 408.5 516.5Q402 519 381 519Q348 519 340.0 513.5Q332 508 332 486ZM549 441Q546 442 538 437Q528 432 533.0 426.5Q538 421 546 429Q555 439 549 441ZM275 334Q271 320 265 302Q256 263 252 237Q250 220 252.0 216.0Q254 212 263 212Q280 212 321.5 234.0Q363 256 396 283Q421 304 428.0 314.0Q435 324 435 338Q435 361 427.5 366.0Q420 371 375 336Q337 307 325.5 307.0Q314 307 309 338Q297 397 275 334ZM544 352Q535 342 540 337Q544 332 565.0 338.5Q586 345 586 352Q586 359 578.0 361.5Q570 364 559.5 361.0Q549 358 544 352ZM247 865Q263 847 279 817Q297 781 307.5 776.0Q318 771 350 782Q377 792 426 800Q467 807 478.0 817.0Q489 827 489 858Q489 882 495 882Q501 882 522.5 865.5Q544 849 556 836Q569 823 601 810Q627 801 644.5 787.0Q662 773 658 764Q656 756 604 758L553 761L524 729Q494 697 468.0 682.0Q442 667 442.0 662.0Q442 657 400.5 629.0Q359 601 350.5 587.5Q342 574 335.5 574.0Q329 574 351 597Q385 633 421.0 695.0Q457 757 452 770Q448 781 410.5 779.5Q373 778 347 766Q321 755 318.5 740.5Q316 726 333 698Q344 679 345.5 657.5Q347 636 335.5 631.5Q324 627 304.5 636.5Q285 646 281 657Q274 678 261.5 680.0Q249 682 219 667Q178 647 158.5 645.0Q139 643 124 657Q113 666 108.5 677.5Q104 689 107.5 696.5Q111 704 120 704Q134 704 187.0 722.5Q240 741 243 747Q252 759 229 834Q222 858 222 871Q222 892 247 865Z\" transform=\"translate(3600 0)\"/></g></g></svg>\n  <div class=\"eyebrow\">A QUIET CORNER FOR MISSING</div>\n  <p class=\"sub\">有些话不论说给谁听，<br>写下来，它就有了去处。</p>\n  <div class=\"updated\" id=\"updated\" hidden></div>\n  <div class=\"reading-starts\">\n    <div class=\"scroll-hint\">↓ 往下慢慢读</div>\n    <a class=\"reading-jump-start\" href=\"#earliest\">或从最早读起 ↓</a>\n  </div>\n</section>";

function viewHTML(view) {
  if (view === 'archive') {
    return '<section class="page-head">' +
      '<img class="zh-seal" src="assets/img/logo-ping-watercolor.png" alt="萍">' +
      '<p class="lead">经历过的事，从不会消失。<br>' +
      '<span class="lead-2">真正让你懂得爱的人，都是用离开来教的。</span></p>' +
      '<div class="ar-count" id="archiveCount"></div></section>' +
      '<div class="archive-filter">' +
      '<input id="arFilter" type="search" placeholder="查找关键词" autocomplete="off" aria-label="查找关键词">' +
      '</div>' +
      '<div class="archive" id="archive"></div>' +
      '<div class="back-home"><a href="index.html">← 回到首页</a></div>';
  }
  if (view === 'entry') {
    return '<article class="article" id="article"></article>' +
      '<div class="back-home"><a id="backHome" href="index.html">← 回到首页</a></div>';
  }
  return HERO_HTML +
    '<div class="stream" id="stream" data-feed="memories"></div>' +
    '<nav class="reading-jumps" aria-label="阅读位置"><a href="#latest">↑ 回到最新</a></nav>' +
    '<div class="more-days" id="moreDays"><a href="archive.html">进入到阅读清单，我的巨蟹 →</a></div>';
}

(function () {
  if (!global.history || !global.history.pushState) return;

  var TITLES = { feed: '你好，丽萍', archive: '往日 · 你好，丽萍', entry: '你好，丽萍' };

  function targetView(url) {
    var base = String(url || '').split('/').pop();
    if (/^archive\.html/.test(base)) return 'archive';
    if (/^entry\.html/.test(base)) return 'entry';
    return 'feed';
  }

  function setMenu(v) {
    var now = document.querySelector('.topbar .m-now');
    var more = document.querySelector('.topbar .m-more');
    if (!now || !more) return;
    if (v === 'archive') { more.classList.add('on'); now.classList.remove('on'); }
    else if (v === 'feed') { now.classList.add('on'); more.classList.remove('on'); }
    else { now.classList.remove('on'); more.classList.remove('on'); }
  }

  function go(url, push) {
    var app = document.getElementById('view');
    if (!app) { location.href = url; return; }
    var v = targetView(url);
    app.innerHTML = viewHTML(v);
    document.body.className = v === 'archive' ? 'pg-archive' : '';
    setMenu(v);
    /* Safari 在 file:// 下 pushState 会抛 SecurityError —— 不能让它打断渲染 */
    if (push) { try { history.pushState({ soft: 1 }, '', url); } catch (err) {} }
    global.scrollTo(0, 0);
    initPage();
    if (v !== 'entry') document.title = TITLES[v];
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^[a-z]+:/i.test(href)) return;
    if (!/\.html(\?|$)/i.test(href)) return;
    e.preventDefault();
    go(href, true);
  });

  global.addEventListener('popstate', function () {
    go(location.pathname + location.search, false);
  });
})();


/* 音乐只初始化一次。软导航不重载页面，重复初始化会挂上第二套监听。
   音乐初始化万一抛错也不能挡住正文渲染 —— 各自 try/catch 兜底。 */
if (!global.__bgmReady) {
  global.__bgmReady = true;
  try { initBGM(); } catch (err) {}
}

try { initPage(); } catch (err) {}

global.SITE = { renderFeed: renderFeed, renderEntry: renderEntry,
                renderArchive: renderArchive, initReveal: initReveal, initPage: initPage };
})(window);
