(function () {
  var root = document.getElementById("projects");
  if (!root) return;

  setNote("正在读取作品…");

  fetch("projects.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) throw new Error("load");
      return response.json();
    })
    .then(function (data) {
      var projects = data && Array.isArray(data.projects) ? data.projects : [];
      if (!projects.length) {
        setNote("还没有公开作品。");
        return;
      }
      root.replaceChildren.apply(root, projects.map(renderCard));
    })
    .catch(function () {
      setNote("作品列表没有加载出来。");
    });

  function setNote(text) {
    var note = document.createElement("p");
    note.className = "note";
    note.textContent = text;
    root.replaceChildren(note);
  }

  function renderCard(project, index) {
    var card = document.createElement("article");
    card.className = "card";
    card.id = domId(project && project.id);

    var ordinal = document.createElement("p");
    ordinal.className = "index";
    ordinal.textContent = String(index + 1).padStart(2, "0");

    var head = document.createElement("div");
    head.className = "card-head";

    var title = document.createElement("h3");
    title.textContent = text(project && project.name);

    var status = document.createElement("p");
    status.className = "pill";
    var statusText = text(project && project.status);
    if (statusText) status.dataset.status = statusText;
    status.textContent = statusText;

    head.append(title, status);

    var line = document.createElement("p");
    line.className = "one-liner";
    line.textContent = text(project && project.one_liner);

    var meta = document.createElement("div");
    meta.className = "card-meta";

    var stack = document.createElement("ul");
    stack.className = "stack";
    tags(project && project.stack).forEach(function (tag) {
      var item = document.createElement("li");
      item.textContent = tag;
      stack.append(item);
    });

    var links = document.createElement("div");
    links.className = "links";
    (Array.isArray(project && project.links) ? project.links : []).forEach(function (link) {
      var href = safeUrl(link && link.url);
      if (!href) return;
      var anchor = document.createElement("a");
      var label = text(link && link.label) || "链接";
      anchor.href = href;
      anchor.textContent = label;
      if (isExternal(href)) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.setAttribute("aria-label", label + "，新窗口打开");
      }
      links.append(anchor);
    });

    meta.append(stack, links);
    card.append(ordinal, head, line, meta);

    var updated = text(project && project.updated);
    if (/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
      var time = document.createElement("time");
      time.className = "updated";
      time.dateTime = updated;
      time.textContent = "更新 " + updated;
      card.append(time);
    }

    return card;
  }

  function tags(value) {
    if (!Array.isArray(value)) return [];
    return value.map(text).filter(Boolean);
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      var url = new URL(value, document.baseURI);
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      var authored = value.trim();
      if (/^https?:\/\//i.test(authored)) return authored;
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function isExternal(href) {
    try {
      return new URL(href).origin !== window.location.origin;
    } catch (error) {
      return true;
    }
  }

  function domId(id) {
    var safe = text(id).replace(/[^A-Za-z0-9_-]/g, "");
    return "project-" + (safe || "item");
  }
})();
