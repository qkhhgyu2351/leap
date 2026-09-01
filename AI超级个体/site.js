/* 超级个体社区 — 渲染逻辑（纯前端，无后端）
   同时驱动 index.html（流 + 筛选 + 搜索）与 article.html（详情 + 点赞）。 */
(function () {
  "use strict";
  var POSTS = window.POSTS || [];
  var CATS = window.CATEGORIES || [];
  var AUTHOR = window.AUTHOR || { name: "匿名", initial: "匿" };

  function catBySlug(slug) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].slug === slug) return CATS[i];
    return { name: slug, slug: slug, color: "#94a3b8" };
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtDate(d) {
    try { return new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }); }
    catch (e) { return d; }
  }
  // 极简 markdown：## 小标题， - 列表，空行分段
  function miniMarkdown(txt) {
    var blocks = String(txt || "").split(/\n\n+/);
    return blocks.map(function (b) {
      var line = b.trim();
      if (line.indexOf("## ") === 0) return "<h3>" + esc(line.slice(3)) + "</h3>";
      if (/^[-*] /.test(line)) {
        var items = line.split(/\n/).filter(function (x) { return /^[-*] /.test(x); })
          .map(function (x) { return "<li>" + esc(x.replace(/^[-*] /, "")) + "</li>"; }).join("");
        return "<ul>" + items + "</ul>";
      }
      if (/^\d+\.\s/.test(line)) {
        var ol = line.split(/\n/).filter(function (x) { return /^\d+\.\s/.test(x); })
          .map(function (x) { return "<li>" + esc(x.replace(/^\d+\.\s/, "")) + "</li>"; }).join("");
        return "<ol>" + ol + "</ol>";
      }
      return "<p>" + esc(line).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var stream = document.getElementById("stream");
    if (!stream) return;
    var filters = document.getElementById("filters");
    var chips = [{ name: "全部", slug: "__all", color: "#2563eb" }].concat(CATS);
    filters.innerHTML = chips.map(function (c) {
      var on = c.slug === "__all" ? " on" : "";
      // 「全部」初始为选中态，同样要上色，否则 .chip.on 的白字落在白底上不可见
      var styleAttr = ' style="background:' + c.color + ';border-color:' + c.color + '"';
      var dot = c.slug === "__all" ? "" : '<span class="dot" style="background:#fff"></span>';
      return '<span class="chip' + on + '" data-slug="' + c.slug + '"' + styleAttr + '>' + dot + esc(c.name) + "</span>";
    }).join("");

    var state = { slug: "__all", q: "" };

    function draw() {
      var list = POSTS.filter(function (p) {
        if (state.slug !== "__all" && p.category.slug !== state.slug) return false;
        if (state.q) {
          var hay = (p.title + " " + p.summary + " " + p.content).toLowerCase();
          if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
        }
        return true;
      });
      if (!list.length) {
        stream.innerHTML = '<div class="empty">没有匹配的内容。</div>';
        return;
      }
      stream.innerHTML = list.map(function (p) {
        var c = p.category;
        return '' +
          '<article class="post" data-id="' + p.id + '">' +
            '<div class="post-top">' +
              '<span class="tag" style="color:' + c.color + ';background:' + c.color + '1a">' +
                '<span class="dot" style="background:' + c.color + '"></span>' + esc(c.name) + '</span>' +
              '<span class="post-date">' + fmtDate(p.date) + '</span>' +
            '</div>' +
            '<h2>' + esc(p.title) + '</h2>' +
            '<p class="summary">' + esc(p.summary) + '</p>' +
            '<div class="post-meta">' +
              '<span class="author"><span class="avatar">' + esc((p.author && p.author.initial) || AUTHOR.initial) + '</span>' + esc((p.author && p.author.name) || AUTHOR.name) + '</span>' +
            '</div>' +
          '</article>';
      }).join("");
      Array.prototype.forEach.call(stream.querySelectorAll(".post"), function (el) {
        el.addEventListener("click", function () {
          location.href = "article.html?id=" + encodeURIComponent(el.getAttribute("data-id"));
        });
      });
    }

    filters.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      state.slug = chip.getAttribute("data-slug");
      Array.prototype.forEach.call(filters.children, function (c) { c.classList.remove("on"); });
      // 重算高亮：全部用蓝，分类用自身色
      Array.prototype.forEach.call(filters.children, function (c) {
        var slug = c.getAttribute("data-slug");
        if (slug === state.slug) {
          c.classList.add("on");
          if (slug === "__all") { c.style.background = "#2563eb"; c.style.borderColor = "#2563eb"; }
          else { var cc = catBySlug(slug); c.style.background = cc.color; c.style.borderColor = cc.color; }
        } else {
          c.classList.remove("on");
          if (slug === "__all") { c.style.background = ""; c.style.borderColor = ""; }
          else { var c2 = catBySlug(slug); c.style.background = ""; c.style.borderColor = ""; }
        }
      });
      draw();
    });

    draw();
  }

  /* ---------- 详情页 ---------- */
  function renderArticle() {
    var root = document.getElementById("article");
    if (!root) return;
    var id = new URLSearchParams(location.search).get("id");
    var p = null;
    for (var i = 0; i < POSTS.length; i++) if (POSTS[i].id === id) { p = POSTS[i]; break; }
    if (!p) {
      root.innerHTML = '<a class="back" href="index.html">← 返回首页</a><h1>内容不存在</h1><p style="color:var(--muted)">该文章可能已被移除。</p>';
      return;
    }
    var c = p.category;
    var liked = getLikes()[p.id] === true;
    var likeCount = (p.likes || 0) + (liked ? 1 : 0);
    root.innerHTML =
      '<a class="back" href="index.html">← 返回首页</a>' +
      '<span class="tag" style="color:' + c.color + ';background:' + c.color + '1a"><span class="dot" style="background:' + c.color + '"></span>' + esc(c.name) + '</span>' +
      '<h1>' + esc(p.title) + '</h1>' +
      (p.cover ? '<img class="cover" src="' + esc(p.cover) + '" alt="">' : "") +
      '<div class="meta">' +
        '<span class="author"><span class="avatar">' + esc((p.author && p.author.initial) || AUTHOR.initial) + '</span>' + esc((p.author && p.author.name) || AUTHOR.name) + '</span>' +
        '<span>' + fmtDate(p.date) + '</span>' +
      '</div>' +
      '<div class="body">' + miniMarkdown(p.content) + '</div>' +
      '<div class="like-row">' +
        '<button class="like-btn' + (liked ? " liked" : "") + '" id="likeBtn">♥ <span id="likeCount">' + likeCount + '</span></button>' +
        '<span style="color:var(--muted);font-size:13px">本地收藏，仅存于当前浏览器</span>' +
      '</div>';

    var btn = document.getElementById("likeBtn");
    btn.addEventListener("click", function () {
      var map = getLikes();
      var nowLiked = !map[p.id];
      map[p.id] = nowLiked;
      setLikes(map);
      btn.classList.toggle("liked", nowLiked);
      document.getElementById("likeCount").textContent = (p.likes || 0) + (nowLiked ? 1 : 0);
    });
  }

  function getLikes() {
    try { return JSON.parse(localStorage.getItem("aiclew_likes") || "{}"); } catch (e) { return {}; }
  }
  function setLikes(m) {
    try { localStorage.setItem("aiclew_likes", JSON.stringify(m)); } catch (e) {}
  }

  /* ---------- 搜索弹窗（⌘K / Ctrl+K） ---------- */
  function setupSearch(onQuery) {
    var mask = document.getElementById("searchMask");
    var input = document.getElementById("searchInput");
    var results = document.getElementById("searchResults");
    if (!mask || !input) return;

    function open() { mask.classList.add("open"); input.value = ""; results.innerHTML = ""; input.focus(); }
    function close() { mask.classList.remove("open"); }
    function run(q) {
      if (!q) { results.innerHTML = ""; return; }
      var hits = POSTS.filter(function (p) {
        return (p.title + " " + p.summary + " " + p.content).toLowerCase().indexOf(q.toLowerCase()) > -1;
      }).slice(0, 8);
      results.innerHTML = hits.length
        ? hits.map(function (p) {
            return '<a href="article.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.title) +
              '<div class="r-meta">' + esc(p.category.name) + ' · ' + fmtDate(p.date) + '</div></a>';
          }).join("")
        : '<div class="r-meta" style="padding:14px 20px">没有匹配。</div>';
    }

    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      if (e.key === "Escape") close();
    });
    var triggers = document.querySelectorAll("[data-search-open]");
    Array.prototype.forEach.call(triggers, function (t) { t.addEventListener("click", open); });
    mask.addEventListener("click", function (e) { if (e.target === mask) close(); });
    input.addEventListener("input", function () { run(input.value.trim()); });
    results.addEventListener("click", close);
  }

  /* ---------- 启动 ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { renderHome(); renderArticle(); setupSearch(); });
  } else {
    renderHome(); renderArticle(); setupSearch();
  }
})();
