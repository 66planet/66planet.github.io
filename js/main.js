/* ============================================================
   Southbound — renderer. You should not need to edit this file
   to add content; edit js/data.js instead.
   ============================================================ */
(function () {
  "use strict";

  var pad = function (n) {
    return String(n).padStart(2, "0");
  };
  // HTML 輸出編碼：所有動態值都必須經過此函式，避免 XSS。
  // 除了 & < > " 之外，額外轉義 ' 與 ` 以涵蓋各種屬性引號情境（縱深防禦）。
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"'`]/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
      }[c];
    });
  };
  var qs = function (k) {
    return new URLSearchParams(location.search).get(k);
  };
  var byId = function (id) {
    return document.getElementById(id);
  };

  var SERIES = window.SERIES || {};
  var ARTICLES = window.ARTICLES || [];
  var SITE = window.SITE || {};

  function seriesName(key) {
    return (SERIES[key] || {}).name || key;
  }

  /* Brand mark — a side-profile locomotive pulling one carriage, drawn with
     hairline strokes to match the editorial rules. Inherits currentColor. */
  var TRAIN_SVG =
    '<svg class="brand__icon" viewBox="0 0 70 32" width="52" height="24" fill="none"' +
    ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
    ' role="img" aria-label="Overland, Again — home">' +
    // locomotive
    '<rect x="4" y="5" width="30" height="19" rx="5"/>' +
    '<line x1="4" y1="15" x2="34" y2="15"/>' +
    '<rect x="8" y="8.5" width="7" height="4.5" rx="1"/>' +
    '<rect x="19" y="8.5" width="7" height="4.5" rx="1"/>' +
    '<circle cx="11.5" cy="27" r="2.6"/>' +
    '<circle cx="26.5" cy="27" r="2.6"/>' +
    // coupling
    '<line x1="34" y1="20" x2="39" y2="20"/>' +
    // carriage
    '<rect x="39" y="8" width="27" height="16" rx="3"/>' +
    '<rect x="43" y="11" width="6" height="5" rx="1"/>' +
    '<rect x="52" y="11" width="6" height="5" rx="1"/>' +
    '<circle cx="46" cy="27" r="2.6"/>' +
    '<circle cx="59" cy="27" r="2.6"/>' +
    // rail
    '<path d="M1 31h68"/>' +
    "</svg>";

  /* ---------- shared chrome: top nav + footer ---------- */
  function renderChrome(active) {
    var bar = byId("topbar");
    if (bar) {
      var tabs =
        '<a class="tab' +
        (active === "all" ? " is-active" : "") +
        '" href="index.html">All</a>';
      Object.keys(SERIES).forEach(function (key) {
        var s = SERIES[key];
        tabs +=
          '<a class="tab' +
          (active === key ? " is-active" : "") +
          '" href="' +
          key +
          '.html"><span class="no">' +
          esc(s.no) +
          "</span>" +
          esc(s.name) +
          "</a>";
      });
      bar.innerHTML =
        '<a class="brand" href="index.html" aria-label="' +
        esc(SITE.title || "Home") +
        ' — home">' +
        TRAIN_SVG +
        '<span class="brand__mark">23&deg; South</span></a>' +
        '<nav class="tabs">' +
        tabs +
        "</nav>";
    }
    var foot = byId("footer");
    if (foot) {
      foot.className = "site-foot";
      foot.innerHTML =
        '<span class="brand">' +
        esc(SITE.title || "") +
        "</span>" +
        "<span>Written &amp; photographed on the road</span>";
    }
  }

  /* ---------- card markup ---------- */
  function cardHTML(a) {
    var cls = "card" + (a.size === "feature" ? " card--feature" : "") + " card--" + a.series;
    var media = a.image
      ? '<div class="card__media"><img src="' +
        esc(a.image) +
        '" alt="' +
        esc(a.title) +
        '" loading="lazy"></div>'
      : "";
    if (!a.image) cls += " card--noimg";
    var feat = a.size === "feature" ? '<span class="muted">Feature</span>' : "";
    return (
      '<article class="' +
      cls +
      '">' +
      '<a class="card__link" href="article.html?slug=' +
      encodeURIComponent(a.slug) +
      '">' +
      media +
      '<div class="card__topline"><span class="kicker">' +
      esc(seriesName(a.series)) +
      " · No. " +
      pad(a.no) +
      "</span>" +
      feat +
      "</div>" +
      '<h2 class="card__title">' +
      esc(a.title) +
      "</h2>" +
      '<p class="card__dek">' +
      esc(a.dek) +
      "</p>" +
      '<span class="readmore">Read the piece <i>&rarr;</i></span>' +
      "</a>" +
      "</article>"
    );
  }

  function quoteCardHTML(q) {
    return (
      '<article class="card card--accent">' +
      '<span class="lbl">' +
      esc(q.label) +
      "</span>" +
      "<blockquote>&ldquo;" +
      esc(q.text) +
      "&rdquo;</blockquote>" +
      '<span class="src">' +
      esc(q.source) +
      "</span>" +
      "</article>"
    );
  }

  /* ---------- grid pages (index + series) ---------- */
  function renderGrid() {
    var grid = byId("grid");
    if (!grid) return;
    var active = document.body.dataset.series || "all";
    renderChrome(active);

    var list = ARTICLES.filter(function (a) {
      return active === "all" || a.series === active;
    });
    list.sort(function (a, b) {
      if (a.series === b.series) return a.no - b.no;
      return (
        Object.keys(SERIES).indexOf(a.series) -
        Object.keys(SERIES).indexOf(b.series)
      );
    });

    if (!list.length) {
      grid.innerHTML = '<p class="empty">No stories in this series yet.</p>';
      return;
    }

     var html = [];
    var lastSeries = null;
    list.forEach(function (a) {
      if (active === "all" && lastSeries !== null && a.series !== lastSeries) {
        html.push('<div class="series-divider"></div>');
      }
      lastSeries = a.series;
      html.push(cardHTML(a));
    });
    // drop the accent quote card into the middle of the full index
    if (active === "all" && window.FEATURE_QUOTE && html.length > 4) {
      html.splice(4, 0, quoteCardHTML(window.FEATURE_QUOTE));
    }
    grid.innerHTML = html.join("");

    // fill series map / header if present
    var map = byId("seriesMap");
    if (map) {
      map.innerHTML = Object.keys(SERIES)
        .map(function (key) {
          var s = SERIES[key];
          var tag = s.tag
            ? ' <span class="series-tag">' + esc(s.tag) + "</span>"
            : "";
          return (
            '<a href="' +
            key +
            '.html"><span class="kicker">SERIES ' +
            esc(s.no) +
            '</span><div class="name">' +
            esc(s.name) +
            tag +
            "</div></a>"
          );
        })
        .join("");
    }

    var head = byId("seriesHead");
    if (head && SERIES[active]) {
      var s = SERIES[active];
      head.innerHTML =
        '<span class="no">Series ' +
        esc(s.no) +
        " · " +
        list.length +
        " " +
        (list.length === 1 ? "story" : "stories") +
        "</span>" +
        "<h2>" +
        esc(s.name) +
        "</h2><p>" +
        esc(s.blurb) +
        "</p>";
    }
    document.title =
      (active === "all"
        ? SITE.title
        : seriesName(active) + " · " + SITE.title) || document.title;
  }

  /* ---------- article page ---------- */
  function renderArticle() {
    var root = byId("article");
    if (!root) return;
    renderChrome(null);

    var slug = qs("slug");
    var a = ARTICLES.filter(function (x) {
      return x.slug === slug;
    })[0];
    if (!a) {
      root.innerHTML =
        '<p class="empty">Story not found. <a class="link-accent" href="index.html">Back to the index &rarr;</a></p>';
      return;
    }
    document.title = a.title + " · " + (SITE.title || "");
    root.classList.toggle("has-portrait", !!a.inlinePortrait);

    // prev / next within the same series
    var sib = ARTICLES.filter(function (x) {
      return x.series === a.series;
    }).sort(function (p, q) {
      return p.no - q.no;
    });
    var idx = sib.indexOf(a);
    var next = sib[idx + 1] || null;

    // body with drop-cap on first para + pullquote after 2nd
    var paras = (a.body || []).map(function (p, i) {
      return "<p" + (i === 0 ? ' class="lead"' : "") + ">" + esc(p) + "</p>";
    });
    if (a.pullquote && paras.length > 2) {
      paras.splice(
        2,
        0,
        "<blockquote><p>&ldquo;" +
          esc(a.pullquote) +
          "&rdquo;</p></blockquote>",
      );
    } else if (a.pullquote) {
      paras.push(
        "<blockquote><p>&ldquo;" +
          esc(a.pullquote) +
          "&rdquo;</p></blockquote>",
      );
    }

    var heroMedia = a.heroVideo
      ? '<video autoplay muted loop playsinline' +
        (a.hero ? ' poster="' + esc(a.hero) + '"' : "") +
        '><source src="' + esc(a.heroVideo) + '" type="video/mp4"></video>'
      : (a.hero ? '<img src="' + esc(a.hero) + '" alt="' + esc(a.title) + '">' : "");
    var hero = (a.hero || a.heroVideo)
      ? '<figure class="hero' + (a.heroPortrait ? " hero--portrait" : "") + '">' + heroMedia + "</figure>" +
        (a.heroCaption ? '<p class="caption">' + esc(a.heroCaption) + "</p>" : "")
      : "";

    var inlineList = Array.isArray(a.inline)
      ? a.inline
      : a.inline
        ? [a.inline]
        : [];
    var inlineCaptions = Array.isArray(a.inlineCaption)
      ? a.inlineCaption
      : a.inlineCaption
        ? [a.inlineCaption]
        : [];
       var inlineFigures = inlineList.map(function (src, i) {
      // 註：不再使用 inline onload（違反安全規格 14.2 且 Checkmarx 會標記內聯事件）。
      // 改為在下方以 addEventListener 綁定，依原圖長寬比切換橫式版面。
      return '<figure class="inline-figure' + (a.inlinePortrait ? " inline-figure--portrait" : "") +
        '"><img src="' + esc(src) + '" alt="' + esc(a.title) + '">' +
        (inlineCaptions[i] ? '<figcaption class="caption">' + esc(inlineCaptions[i]) + "</figcaption>" : "") +
        "</figure>";
    });
    var inline =
      inlineFigures.length === 0
        ? ""
        : inlineFigures.length > 1
          ? '<div class="inline-row">' + inlineFigures.join("") + "</div>"
          : inlineFigures.join("");

    root.innerHTML =
      '<header class="article-head">' +
      '<span class="kicker">' +
      esc(seriesName(a.series)) +
      " · No. " +
      pad(a.no) +
      (a.size === "feature" ? " · Feature" : "") +
      "</span>" +
      "<h1>" +
      esc(a.title) +
      "</h1>" +
      '<div class="byline"><span>' +
      esc(SITE.title || "") +
      "</span><span>·</span><span>" +
      esc(a.date) +
      "</span><span>·</span><span>" +
      esc(a.readTime) +
      "</span></div>" +
      "</header>" +
      hero +
      '<div class="article-body">' +
      paras.join("") +
      "</div>" +
      inline +
      '<footer class="article-foot">' +
      '<a href="' +
      esc(a.series) +
      '.html"><span class="arrow">&larr;</span> Back to ' +
      esc(seriesName(a.series)) +
      "</a>" +
      (next
        ? '<a class="next" href="article.html?slug=' +
          encodeURIComponent(next.slug) +
          '">Next in this series<br><b>' +
          esc(next.title) +
          "</b></a>"
        : '<span class="next muted">End of the series</span>') +
      "</footer>";

    // 依原圖長寬比為橫式插圖加上 landscape 版面類別。
    // 以 addEventListener 綁定（非內聯事件），並處理已快取（complete）的圖片。
    var inlineImgs = root.querySelectorAll(".inline-figure img");
    Array.prototype.forEach.call(inlineImgs, function (img) {
      var applyRatio = function () {
        var fig = img.closest("figure");
        if (fig) {
          fig.classList.toggle(
            "inline-figure--landscape",
            img.naturalWidth >= img.naturalHeight,
          );
        }
      };
      if (img.complete && img.naturalWidth) {
        applyRatio();
      } else {
        img.addEventListener("load", applyRatio);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGrid();
    renderArticle();
  });
})();
