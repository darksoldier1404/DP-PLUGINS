const kr = fetch("lang.ko.json").then((res) => res.json());
const en = fetch("lang.en.json").then((res) => res.json());
let langData = { ko: kr, en: en };
let currentLang = localStorage.getItem("language") || "en";
let allPlugins = [];
let redirect = {};

async function fetchPluginData() {
  try {
    const jsonResponse = await fetch("pluginData.json");
    if (!jsonResponse.ok) throw new Error("Failed to load pluginData.json");
    const data = await jsonResponse.json();
    if (!data.plugins || !Array.isArray(data.plugins))
      throw new Error("Invalid plugin data format");
    const releasesResponse = await fetch(
      "https://raw.githubusercontent.com/darksoldier1404/DPP-Releases/main/releases.json"
    );
    const releases = releasesResponse.ok
      ? await releasesResponse.json()
      : { releases: {}, update_history: {} };
    const plugins = data.plugins
      .map((plugin) => {
        if (!plugin.name) return null;
        const release = releases.releases[plugin.name]?.[0] || {};
        return {
          name: plugin.name,
          version: release.tag || "???",
          updateHistory: releases.update_history[plugin.name] || "",
          description: plugin.description || {
            en: "No description available",
            ko: "설명 없음",
          },
          downloadUrl: `https://github.com/darksoldier1404/${plugin.name}/releases`,
          imageUrl: plugin.pluginIcon || "assets/img/default.png",
          supportVersion: plugin.supportVersion || "???",
          imglist: plugin.pluginImgList || [],
          dependencies: plugin.dependencies || {
            required: [],
            recommended: [],
          },
          releaseNotes: release.body || "No release notes available",
          releaseDate: release.published_at || "No release date available",
          repoUrl: `https://github.com/darksoldier1404/${plugin.name}`,
        };
      })
      .filter(Boolean);
    return { plugins, r: data.redirect || {} };
  } catch (error) {
    console.error("Failed to fetch plugin data:", error);
    return { plugins: [], r: {} };
  }
}

function createPluginCard(plugin) {
  const description =
    plugin.description[currentLang] || plugin.description.en || "";
  return `
        <a href="plugin.html?plugin=${encodeURIComponent(
          plugin.name
        )}" class="plugin-card group relative bg-gradient-to-br from-black/90 via-black/80 to-red-900/80 rounded-2xl p-6 shadow-2xl border border-red-700/30 hover:scale-[1.03] hover:shadow-red-700/40 transition-all duration-300 flex flex-col h-[200px] overflow-hidden backdrop-blur cursor-pointer">
            <div class="absolute right-4 top-4">
                <span class="inline-block bg-green-700/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">MC ${
                  plugin.supportVersion
                }</span>
                <span class="inline-block bg-blue-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">v${
                  plugin.version
                }</span>
            </div>
            <div class="flex items-center gap-4 mt-2 mb-2">
                <img src="${plugin.imageUrl}" alt="${
    plugin.name
  } icon" width="56" height="56" class="rounded-xl object-cover border border-white/10 shadow" style="min-width:56px;min-height:56px;max-width:56px;max-height:56px;" loading="lazy">
                <h3 class="text-xl font-extrabold text-white drop-shadow-lg m-0">${
                  plugin.name
                }</h3>
            </div>
            <p class="text-white/80 text-sm mb-4 line-clamp-3 min-h-[54px]">${description}</p>
            <div class="mt-auto text-right">
                <span class="text-red-400 text-sm font-medium inline-flex items-center" data-translate="view_details">${
                  langData[currentLang]?.view_details || "View Details"
                } <i class="fas fa-arrow-right ml-1 text-xs"></i></span>
            </div>
        </a>
    `;
}

async function updatePluginsSection(plugins, filterValue = "") {
  const pluginsContainer =
    document.querySelector(".plugins-section .grid") ||
    document.getElementById("plugins-grid");
  if (!pluginsContainer) return;
  const q = filterValue.trim().toLowerCase();
  const filtered = q
    ? plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description[currentLang] || p.description.en || "")
            .toLowerCase()
            .includes(q)
      )
    : plugins.filter(
        (p) =>
          p.name !== new URLSearchParams(window.location.search).get("plugin")
      );
  pluginsContainer.style.opacity = "0";
  requestAnimationFrame(() => {
    pluginsContainer.innerHTML = filtered.length
      ? filtered.map(createPluginCard).join("")
      : `<div class="col-span-full text-center text-white/70 py-12">${
          langData[currentLang]?.no_results || "No results found."
        }</div>`;
    pluginsContainer.style.opacity = "1";
  });
}

function openLightbox(images, startIndex = 0) {
  document.body.style.overflow = "hidden";
  const lightbox = document.createElement("div");
  lightbox.className =
    "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4";
  lightbox.innerHTML = `
        <div class="relative w-full max-w-4xl max-h-[90vh]" id="lightbox-content">
            <button class="absolute -top-12 right-0 text-white text-3xl z-10 hover:text-red-500 transition-colors" id="close-lightbox"><i class="fas fa-times"></i></button>
            <div class="relative w-full h-full">
                <img src="${
                  images[startIndex]
                }" alt="Screenshot" class="w-full h-full object-contain">
            </div>
            ${
              images.length > 1
                ? `
                <button class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-colors" id="prev-image"><i class="fas fa-chevron-left"></i></button>
                <button class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-colors" id="next-image"><i class="fas fa-chevron-right"></i></button>
            `
                : ""
            }
        </div>
    `;
  let currentIndex = startIndex;
  const img = lightbox.querySelector("img");
  const updateImage = (index) => {
    currentIndex = (index + images.length) % images.length;
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = images[currentIndex];
      img.style.opacity = "1";
    }, 150);
  };
  const closeLightbox = () => {
    document.body.removeChild(lightbox);
    document.body.style.overflow = "";
    window.removeEventListener("keydown", handleKeyDown);
  };
  lightbox
    .querySelector("#close-lightbox")
    .addEventListener("click", closeLightbox);
  if (images.length > 1) {
    lightbox.querySelector("#prev-image").addEventListener("click", (e) => {
      e.stopPropagation();
      updateImage(currentIndex - 1);
    });
    lightbox.querySelector("#next-image").addEventListener("click", (e) => {
      e.stopPropagation();
      updateImage(currentIndex + 1);
    });
  }
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") updateImage(currentIndex - 1);
    if (e.key === "ArrowRight") updateImage(currentIndex + 1);
    if (e.key === "Escape") closeLightbox();
  };
  lightbox.addEventListener(
    "click",
    (e) => e.target === lightbox && closeLightbox()
  );
  window.addEventListener("keydown", handleKeyDown);
  document.body.appendChild(lightbox);
}

async function loadPluginInfo(allPlugins) {
  const urlParams = new URLSearchParams(window.location.search);
  const pluginName = urlParams.get("plugin");
  if (!pluginName) return (window.location.href = "index.html");
  const plugin = allPlugins.find((p) => p.name === pluginName);
  if (!plugin) return (window.location.href = "index.html");

  document.title = `DP-PLUGINS - ${pluginName}`;
  document.getElementById("plugin-title").textContent = pluginName;
  document.getElementById("plugin-version").textContent = `v${plugin.version}`;
  document.getElementById(
    "plugin-mc-version"
  ).textContent = `MC ${plugin.supportVersion}`;
  document.getElementById("plugin-description").innerHTML =
    plugin.description[currentLang] || plugin.description.en || "";
  const pluginIcon = document.getElementById("plugin-icon");
  if (plugin.imageUrl) pluginIcon.src = plugin.imageUrl;
  pluginIcon.alt = `${pluginName} icon`;

  ["download", "spigot", "hanger", "github"].forEach((type) => {
    const button = document.getElementById(`${type}-btn`);
    if (button) {
      button.href = `https://${
        type === "download" || type === "github"
          ? "github.com/darksoldier1404"
          : type === "spigot"
          ? "www.spigotmc.org/resources/authors/deadpoolio.1326793"
          : `hangar.papermc.io/DEADPOOLIO`
      }/${pluginName}${type === "download" ? "/releases" : ""}`;
      button.target = "_blank";
      button.rel = "noopener noreferrer";
    }
  });

  const bstats = document.getElementById("bstats-container");
  if (bstats) {
    bstats.innerHTML = `<img src="https://bstats.org/signatures/bukkit/${pluginName}.svg" alt="${pluginName} Statistics" class="w-full h-auto rounded-xl" onerror="this.style.display='none'; this.parentElement.innerHTML+='<p class=\\'text-white/60 text-center\\' data-translate=\\'no_stats\\'>${
      langData[currentLang]?.no_stats || "Could not load statistics."
    }</p>';">`;
  }

  const hasDependencies =
    plugin.dependencies.required.length ||
    plugin.dependencies.recommended.length;
  const depsContainer = document.getElementById("dependencies");
  if (depsContainer) {
    depsContainer.innerHTML = hasDependencies
      ? `
            <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2"><i class="fas fa-link text-red-400"></i> <span data-translate="dependencies">${
              langData[currentLang]?.dependencies || "Dependencies"
            }</span></h2>
            <div id="dependencies-container">${displayDependencies(
              plugin.dependencies
            )}</div>
        `
      : `
            <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2"><i class="fas fa-link text-red-400"></i> <span data-translate="dependencies">${
              langData[currentLang]?.dependencies || "Dependencies"
            }</span></>h2>
            <div id="dependencies-container" class="text-center py-4 text-white/70"><i class="fas fa-check-circle text-green-400 mr-2"></i><span data-translate="no_dependencies">${
              langData[currentLang]?.no_dependencies || "No dependencies"
            }</span></div>
        `;
  }

  const updateNotesSection = document.getElementById("update-notes");
  if (updateNotesSection && plugin.releaseNotes !== "???") {
    const updateDate = document.getElementById("update-date");
    const updateVersion = document.getElementById("update-version");
    const releaseNotes = document.getElementById("release-notes");
    if (updateDate && plugin.releaseDate) {
      updateDate.textContent = new Date(plugin.releaseDate).toLocaleDateString(
        currentLang === "ko" ? "ko-KR" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
    }
    if (updateVersion) updateVersion.textContent = `v${plugin.version}`;
    if (releaseNotes) {
      releaseNotes.innerHTML = `<p class="text-white/60 text-center py-4">${
        currentLang === "ko"
          ? "릴리즈 노트를 불러오는 중..."
          : "Loading release notes..."
      }</p>`;
      try {
        const formattedReleaseNotes = plugin.releaseNotes.replace(/\\n/g, "\n");
        const parsedContent = DOMPurify.sanitize(
          marked.parse(formattedReleaseNotes, { breaks: true, gfm: true })
        );
        releaseNotes.innerHTML = `<div class="markdown-body rounded-xl p-6 prose prose-invert max-w-none">${parsedContent}</div>`;
      } catch (error) {
        console.error("Error parsing release notes:", error);
        releaseNotes.innerHTML = `<div class="text-center py-4 text-white/60"><i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i><span>${
          currentLang === "ko"
            ? "릴리즈 노트를 표시할 수 없습니다."
            : "Failed to display release notes."
        }</span></div>`;
      }
    }
  } else if (updateNotesSection) {
    updateNotesSection.style.display = "none";
  }

  const historyContainer = document.getElementById("history-container");
  if (historyContainer && plugin.updateHistory) {
    historyContainer.innerHTML = `<p class="text-white/60 text-center py-4">${
      currentLang === "ko"
        ? "업데이트 내역을 불러오는 중..."
        : "Loading update history..."
    }</p>`;
    try {
      const formattedUpdateHistory = plugin.updateHistory.replace(/\\n/g, "\n");
      const parsedContent = DOMPurify.sanitize(
        marked.parse(formattedUpdateHistory, { breaks: true, gfm: true })
      );
      historyContainer.innerHTML = `<div class="markdown-body p-6 rounded-lg prose prose-invert max-w-none">${parsedContent}</div>`;
    } catch (error) {
      console.error("Error loading update history:", error);
      historyContainer.innerHTML = `<div class="text-center py-4 text-white/60"><i class="fas fa-exclamation-triangle text-yellow-400 mr-2"></i><span>${
        currentLang === "ko"
          ? "업데이트 내역을 표시할 수 없습니다."
          : "Failed to display update history."
      }</span></div>`;
    }
  } else {
    const updateHistorySection = document.getElementById("update-history");
    if (updateHistorySection) updateHistorySection.style.display = "none";
  }

  loadScreenshots(pluginName, plugin.imglist);
  loadReadme(pluginName);
}

function displayDependencies(dependencies) {
  let html = "";
  if (dependencies.required?.length) {
    html += `<div class="col-span-full"><div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">${dependencies.required
      .map((dep) => createDependencyCard(dep, true))
      .join("")}</div></div>`;
  }
  if (dependencies.recommended?.length) {
    html += `<div class="col-span-full"><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${dependencies.recommended
      .map((dep) => createDependencyCard(dep, false))
      .join("")}</div></div>`;
  }
  return html;
}

function createDependencyCard(dep, isRequired) {
  const isCore = dep.startsWith("DPP-");
  const icon = isCore ? "cog" : "external-link-alt";
  const bgColor = isRequired
    ? "from-red-500 to-red-600"
    : "from-blue-500 to-blue-600";
  const typeText = isRequired
    ? isCore
      ? langData[currentLang]?.required_core_plugin || "Required Core Plugin"
      : langData[currentLang]?.required_plugin || "Required Plugin"
    : isCore
    ? langData[currentLang]?.recommended_core_plugin ||
      "Recommended Core Plugin"
    : langData[currentLang]?.recommended_plugin || "Recommended Plugin";
  const url = redirect[dep] || `plugin.html?plugin=${dep}`;
  return `
        <a href="${url}" target="${
    redirect[dep] ? "_blank" : "_self"
  }" class="bg-black/20 rounded-lg p-4 border border-white/10 hover:border-${
    isRequired ? "red" : "blue"
  }-500/50 transition-colors hover:scale-105 transition-transform duration-150 cursor-pointer">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-${icon} text-white text-xl"></i>
                </div>
                <div class="min-w-0">
                    <h3 class="font-semibold text-white truncate">${dep}</h3>
                    <p class="text-sm text-white/60">${typeText}</p>
                </div>
            </div>
        </a>
    `;
}

function loadScreenshots(pluginName, screenshots) {
  const screenshotsContainer = document.getElementById("screenshots-container");
  if (!screenshots?.length) {
    document.getElementById("screenshots")?.classList.add("hidden");
    return;
  }
  screenshotsContainer.innerHTML = screenshots
    .map(
      (img, index) => `
        <div class="relative group cursor-pointer overflow-hidden rounded-lg border border-white/10 hover:border-red-500/50 transition-all duration-300" data-index="${index}">
            <img src="${img}" alt="${pluginName} screenshot ${
        index + 1
      }" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" loading="lazy">
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <i class="fas fa-search-plus text-2xl text-white"></i>
            </div>
        </div>
    `
    )
    .join("");
  screenshotsContainer.querySelectorAll(".group").forEach((group) => {
    group.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(screenshots, parseInt(group.dataset.index));
    });
  });
}

async function loadReadme(pluginName) {
  const contentDiv = document.getElementById("plugin-content");
  if (!contentDiv) return;
  contentDiv.innerHTML = `<p class="text-white/60 text-center py-8">${
    currentLang === "ko"
      ? "플러그인 설명을 불러오는 중..."
      : "Loading plugin description..."
  }</p>`;
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/darksoldier1404/${pluginName}/master/README.md`
    );
    if (!response.ok) throw new Error("Failed to load README");
    let content = await response.text();
    const langTag = currentLang === "ko" ? "korean" : "english";
    const regex = new RegExp(
      `<details>\\s*<summary>${langTag}</summary>([\\s\\S]*?)</details>`,
      "i"
    );
    const match = content.match(regex);
    content = match ? match[1].trim() : content;
    contentDiv.innerHTML = DOMPurify.sanitize(
      marked.parse(content, { breaks: true, gfm: true })
    );
    const markdownContent = contentDiv.querySelector(".markdown-body");
    if (markdownContent)
      markdownContent.classList.add("prose", "prose-invert", "max-w-none");
  } catch (error) {
    console.error("Error loading README:", error);
    contentDiv.innerHTML = `<div class="text-center py-8 text-white/60"><i class="fas fa-exclamation-triangle text-yellow-400 text-2xl mb-2"></i><p>${
      currentLang === "ko"
        ? "플러그인 설명을 불러올 수 없습니다."
        : "Failed to load plugin description."
    }</p></div>`;
  }
}

async function loadLang(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  const langToggle = document.getElementById("lang-toggle-btn");
  if (langToggle) {
    langToggle.innerHTML =
      lang === "ko"
        ? '<i class="fas fa-globe"></i> English'
        : '<i class="fas fa-globe"></i> 한국어';
  }
  langData = { ko: await kr, en: await en };
  await applyLang();
  if (
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/"
  ) {
    updatePluginsSection(allPlugins);
  } else if (window.location.pathname.endsWith("plugin.html")) {
    const pluginName = new URLSearchParams(window.location.search).get(
      "plugin"
    );
    if (pluginName) {
      const plugin = allPlugins.find((p) => p.name === pluginName);
      if (plugin) loadPluginInfo([plugin]);
    }
  }
}

async function applyLang() {
  const data = await langData[currentLang];
  document.querySelectorAll("[data-translate]").forEach((el) => {
    const key = el.getAttribute("data-translate");
    if (data && data[key]) el.textContent = data[key];
  });
  if (window.location.pathname.endsWith("plugin.html")) {
    const pluginName = new URLSearchParams(window.location.search).get(
      "plugin"
    );
    if (pluginName) loadReadme(pluginName);
  }
}

class ServerListManager {
  constructor() {
    this.servers = [];
    this.serverListElement = document.getElementById("server-list");
    this.loadingElement = document.querySelector(".loading");
    this.pageInfoElement = document.getElementById("page-info");
    this.currentPage = 1;
    this.serversPerPage = 10;
    this.filteredServers = [];
    this.onlineServers = [];
    this.offlineServers = [];
    if (this.serverListElement) {
      this.init();
    }
  }

  init() {
    this.loadServers();
    this.serverListElement.parentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-address-btn");
      if (!btn) return;
      e.preventDefault();
      const address = btn.dataset.copyAddress;
      const successElement = btn.querySelector(".copy-success");
      navigator.clipboard
        .writeText(address)
        .then(() => {
          if (successElement) {
            successElement.classList.remove("opacity-0");
            successElement.classList.add("opacity-100");
            setTimeout(
              () =>
                successElement.classList.replace("opacity-100", "opacity-0"),
              2000
            );
          }
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          if (successElement) {
            successElement.innerHTML = `<i class="fas fa-times mr-1.5"></i><span data-translate="copy_failed">${
              langData[currentLang]?.copy_failed || "Failed to copy"
            }</span>`;
            successElement.classList.replace(
              "bg-green-600/90",
              "bg-red-600/90"
            );
            successElement.classList.remove("opacity-0");
            successElement.classList.add("opacity-100");
            setTimeout(
              () =>
                successElement.classList.replace("opacity-100", "opacity-0"),
              2000
            );
          }
        });
    });
  }

  async loadServers() {
    this.showLoading(true);
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/darksoldier1404/DPP-ServerStatus/refs/heads/main/data/output.json"
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      this.servers = (await response.json()).map((serverData) => ({
        domain: serverData.host,
        name: serverData.host,
        host: serverData.host,
        port: serverData.port || 25565,
        status: {
          online: serverData.online || false,
          players: {
            online: serverData.players?.online || 0,
            max: serverData.players?.max || 0,
            list: serverData.players?.list || [],
          },
          version: {
            name: serverData.version?.name_clean || "Unknown",
            name_clean: serverData.version?.name_clean || "Unknown",
            name_raw: serverData.version?.name_raw || "",
            protocol: serverData.version?.protocol || 0,
          },
          motd: {
            clean: serverData.motd?.clean || "",
            html: serverData.motd?.html || "",
          },
          icon: serverData.icon || null,
          host: serverData.host,
          port: serverData.port || 25565,
        },
        error: serverData.eula_blocked ? "EULA Blocked" : null,
        loading: false,
      }));
      this.onlineServers = this.servers.filter((s) => s.status.online);
      this.offlineServers = this.servers.filter((s) => !s.status.online);
      this.filteredServers = [...this.onlineServers, ...this.offlineServers];
      this.currentPage = 1;
      this.updateServerList();
    } catch (error) {
      console.error("Failed to load servers:", error);
      this.showError(
        currentLang === "ko"
          ? "서버 목록을 불러오는 중 오류가 발생했습니다."
          : "Failed to load server list."
      );
    } finally {
      this.showLoading(false);
    }
  }

  updateServerList() {
    if (!this.serverListElement) return;
    this.filteredServers = [...this.onlineServers, ...this.offlineServers];
    const totalPages = Math.max(
      1,
      Math.ceil(this.filteredServers.length / this.serversPerPage)
    );
    this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);
    const currentPageServers = this.getCurrentPageServers();
    this.serverListElement.innerHTML = currentPageServers.length
      ? currentPageServers
          .map((server) => this.createServerCard(server))
          .join("")
      : `
            <div class="col-span-full text-center py-12">
                <div class="bg-white/5 border border-white/10 rounded-lg p-6 max-w-2xl mx-auto">
                    <i class="fas fa-server text-white/50 text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">${
                      langData[currentLang]?.no_servers_found ||
                      "No servers found."
                    }</h3>
                </div>
            </div>
        `;
    this.updatePagination();
  }

  createServerCard(server) {
    const isOnline = server.status?.online;
    const playerCount = server.status?.players?.online || 0;
    const maxPlayers = server.status?.players?.max || 0;
    const version = server.status?.version?.name_clean || "Unknown";
    const motd = server.status?.motd?.html || "";
    const host = server.domain || server.host || "Unknown";
    const port = server.port || 25565;
    const address = port !== 25565 ? `${host}:${port}` : host;
    const favicon = server.status?.icon || "";
    return `
            <div class="server-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 overflow-hidden">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">${
                      favicon
                        ? `<img src="${favicon}" alt="${host}" class="w-12 h-12 rounded-lg bg-gray-800 object-cover" loading="lazy" onerror="this.src='https://via.placeholder.com/64/1F2937/6B7280?text=MC';">`
                        : `<div class="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center"><i class="fas fa-server text-2xl text-gray-600"></i></div>`
                    }</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-white truncate" title="${this.escapeHtml(
                              host
                            )}">${this.escapeHtml(host)}</h3>
                            <div class="flex items-center space-x-2">${
                              isOnline
                                ? `<div class="flex items-center"><span class="relative flex h-3 w-3 mr-1.5"><span class="server-online-indicator absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span><span class="text-green-400 text-sm font-medium">${
                                    langData[currentLang]?.online || "Online"
                                  }</span></div>`
                                : `<div class="flex items-center"><span class="relative flex h-3 w-3 mr-1.5"><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span><span class="text-red-400 text-sm font-medium">${
                                    langData[currentLang]?.offline || "Offline"
                                  }</span></div>`
                            }</div>
                        </div>
                        <div class="mt-1">
                            <p class="text-sm text-gray-400 truncate"><i class="fas fa-globe mr-1.5 text-blue-400"></i>${this.escapeHtml(
                              address
                            )}</p>
                        </div>
                        <div class="mt-2 grid grid-cols-2 gap-2">
                            <div class="flex items-center text-sm text-gray-400"><i class="fas fa-users mr-1.5 text-blue-400"></i><span class="${
                              isOnline
                                ? "text-white font-medium"
                                : "text-gray-400"
                            }">${playerCount}</span><span class="text-gray-400">/</span><span class="text-gray-400">${maxPlayers}</span></div>
                            <div class="flex items-center text-sm text-gray-400"><i class="fas fa-code-branch mr-1.5 text-purple-400"></i><span class="truncate group-hover:text-white transition-colors duration-200" title="${this.escapeHtml(
                              version
                            )}">${this.escapeHtml(
      version.length > 15 ? version.substring(0, 15) + "..." : version
    )}</span></div>
                        </div>
                        ${
                          motd
                            ? `<div class="mt-3"><div class="bg-black/30 border border-white/10 rounded-lg p-3 text-sm"><div class="text-white/80 whitespace-pre-wrap text-sm leading-relaxed" style="font-family: 'Minecraft', monospace;">${motd}</div></div></div>`
                            : ""
                        }
                    </div>
                </div>
                <div class="mt-4 relative">
                    <button data-copy-address="${this.escapeHtml(
                      address
                    )}" class="copy-address-btn w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 relative group">
                        <i class="far fa-copy mr-2"></i><span>${
                          langData[currentLang]?.copy_address || "Copy Address"
                        }</span>
                        <span class="copy-success absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-green-600/90 text-white px-2 py-1 rounded-md opacity-0 transition-opacity duration-300 flex items-center"><i class="fas fa-check mr-1.5"></i><span data-translate="copied">${
                          langData[currentLang]?.copied || "Copied!"
                        }</span></span>
                    </button>
                </div>
            </div>
        `;
  }

  getCurrentPageServers() {
    const start = (this.currentPage - 1) * this.serversPerPage;
    return this.filteredServers.slice(start, start + this.serversPerPage);
  }

  updatePagination() {
    const totalPages = Math.max(
      1,
      Math.ceil(this.filteredServers.length / this.serversPerPage)
    );
    this.currentPage = Math.min(Math.max(1, this.currentPage), totalPages);
    const firstPageBtn = document.getElementById("first-page");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const lastPageBtn = document.getElementById("last-page");
    const pageNumbers = document.getElementById("page-numbers");
    const isFirstPage = this.currentPage <= 1;
    const isLastPage = this.currentPage >= totalPages || totalPages === 0;
    if (firstPageBtn) firstPageBtn.disabled = isFirstPage;
    if (prevPageBtn) prevPageBtn.disabled = isFirstPage;
    if (nextPageBtn) nextPageBtn.disabled = isLastPage;
    if (lastPageBtn) lastPageBtn.disabled = isLastPage;
    if (pageNumbers)
      pageNumbers.textContent =
        totalPages > 0 ? `${this.currentPage} / ${totalPages}` : "0 / 0";
    if (this.pageInfoElement) {
      const totalServers = this.filteredServers.length;
      if (totalServers === 0) {
        this.pageInfoElement.textContent =
          langData[currentLang]?.no_servers_found || "No servers found";
        return;
      }
      const start = (this.currentPage - 1) * this.serversPerPage + 1;
      const end = Math.min(start + this.serversPerPage - 1, totalServers);
      this.pageInfoElement.innerHTML =
        currentLang === "ko"
          ? `<span class="font-medium">${start}</span> - <span class="font-medium">${end}</span> / <span class="font-medium">${totalServers}</span>개 서버`
          : `<span class="font-medium">${start}</span> - <span class="font-medium">${end}</span> of <span class="font-medium">${totalServers}</span> servers`;
      this.pageInfoElement.style.display = "block";
    }
  }

  handleSearch(term) {
    this.filteredServers = term.trim()
      ? this.servers.filter(
          (server) =>
            server.name.toLowerCase().includes(term.toLowerCase()) ||
            server.domain.toLowerCase().includes(term.toLowerCase()) ||
            (server.status?.motd?.clean || "")
              .toLowerCase()
              .includes(term.toLowerCase())
        )
      : [...this.onlineServers, ...this.offlineServers];
    this.currentPage = 1;
    this.updateServerList();
  }

  showLoading(show) {
    if (!this.loadingElement) return;
    this.loadingElement.style.display = show ? "block" : "none";
    if (show) {
      this.loadingElement.innerHTML = `<div class="flex items-center justify-center space-x-2"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>${
        langData[currentLang]?.loading || "Loading..."
      }</span></div>`;
    }
  }

  showError(message) {
    if (this.loadingElement) {
      this.loadingElement.style.display = "block";
      this.loadingElement.innerHTML = `<div class="text-red-400 text-center"><i class="fas fa-exclamation-circle mr-2"></i>${message}</div>`;
    }
  }

  escapeHtml(unsafe) {
    return unsafe
      ? unsafe
          .toString()
          .replace(
            /[&<>"']/g,
            (m) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
              }[m])
          )
      : "";
  }
}

async function main() {
  await loadLang(currentLang);
  if (window.location.pathname.endsWith("server-list.html")) {
    window.serverListManager = new ServerListManager();
    const searchInput = document.getElementById("server-search");
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(
          () => window.serverListManager.handleSearch(searchInput.value),
          300
        );
      });
    }
    return;
  }
  const { plugins, r } = await fetchPluginData();
  redirect = r;
  allPlugins = plugins;
  const isPluginPage = window.location.pathname.includes("plugin.html");
  if (isPluginPage) {
    await loadPluginInfo(allPlugins);
    await updatePluginsSection(allPlugins);
  } else {
    const searchInput = document.getElementById("search-input");
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(
          () => updatePluginsSection(allPlugins, searchInput.value),
          300
        );
      });
    }
    await updatePluginsSection(allPlugins);
    const overlay = document.getElementById("plugin-modal-overlay");
    const closeBtn = document.getElementById("plugin-modal-close");
    if (overlay && closeBtn) {
      overlay.addEventListener(
        "click",
        (e) =>
          e.target === overlay &&
          (overlay.classList.add("hidden"),
          overlay.classList.remove("flex"),
          document.body.classList.remove("overflow-hidden"))
      );
      closeBtn.addEventListener("click", () => {
        overlay.classList.add("hidden");
        overlay.classList.remove("flex");
        document.body.classList.remove("overflow-hidden");
      });
    }
  }
}

document.getElementById("lang-toggle-btn")?.addEventListener("click", () => {
  loadLang(currentLang === "ko" ? "en" : "ko").then(() => {
    if (
      window.location.pathname.includes("server-list.html") &&
      window.serverListManager
    ) {
      window.serverListManager.updateServerList();
    } else if (
      window.location.pathname.endsWith("index.html") ||
      window.location.pathname === "/"
    ) {
      updatePluginsSection(
        allPlugins,
        document.getElementById("search-input")?.value || ""
      );
    }
  });
});

document.addEventListener("DOMContentLoaded", main);
