async function fetchPluginData() {
    try {
        const jsonResponse = await fetch('pluginData.json');
        if (!jsonResponse.ok) throw new Error('pluginData.json 로드 실패');
        const { plugins: jsonPlugins } = await jsonResponse.json();

        const plugins = [];
        const releasesResponse = await fetch('https://raw.githubusercontent.com/darksoldier1404/DPP-Releases/main/releases.json');
        const releases = await releasesResponse.json();
        for (const jsonPlugin of jsonPlugins) {
            let version = '0.0.0.0';
            if (releasesResponse.ok) {
                const release = releases.find(r => r.repo.includes(jsonPlugin.name));
                if (release) {
                    version = release.tag;
                }
            }
            plugins.push({
                name: jsonPlugin.name,
                version,
                description: jsonPlugin.description,
                downloadUrl: `https://github.com/darksoldier1404/${jsonPlugin.name}/releases`,
                imageUrl: jsonPlugin.pluginIcon,
                supportVersion: jsonPlugin.supportVersion,
                imglist: jsonPlugin.pluginImgList,
                dependencies: jsonPlugin.dependencies
            });
        }
        return plugins;
    } catch (error) {
        console.error(`플러그인 데이터 가져오기 실패:`, error);
        return [];
    }
}

function createPluginCard(plugin) {
    const description = typeof plugin.description === 'object' 
        ? (plugin.description[currentLang] || plugin.description.en || '')
        : (plugin.description || '');
        
    return `
        <a href="plugin.html?plugin=${encodeURIComponent(plugin.name)}" class="plugin-card group relative bg-gradient-to-br from-black/90 via-black/80 to-red-900/80 rounded-2xl p-6 shadow-2xl border border-red-700/30 hover:scale-[1.03] hover:shadow-red-700/40 transition-all duration-300 flex flex-col h-[200px] overflow-hidden backdrop-blur cursor-pointer">
            <div class="absolute right-4 top-4">
                <span class="inline-block bg-green-700/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">MC ${plugin.supportVersion}</span>
                <span class="inline-block bg-blue-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">v${plugin.version}</span>
            </div>
            <div class="flex items-center gap-4 mt-2 mb-2">
                <img src="${plugin.imageUrl || 'assets/img/default.png'}" alt="${plugin.name} 아이콘" width="56" height="56" class="rounded-xl object-cover border border-white/10 shadow" style="min-width:56px;min-height:56px;max-width:56px;max-height:56px;" loading="lazy">
                <h3 class="text-xl font-extrabold text-white drop-shadow-lg m-0">${plugin.name}</h3>
            </div>
            <p class="text-white/80 text-sm mb-4 line-clamp-3 min-h-[54px]">${description}</p>
            <div class="mt-auto text-right">
                <span class="text-red-400 text-sm font-medium inline-flex items-center" data-translate="view_details">
                    ${langData[currentLang]?.view_details || 'View Details'}
                    <i class="fas fa-arrow-right ml-1 text-xs"></i>
                </span>
            </div>
        </a>
    `;
}

async function updatePluginsSection(plugins, filterValue = '') {
    const pluginsContainer = document.querySelector('.plugins-section .grid') || document.getElementById('plugins-grid');
    if (!pluginsContainer) return;

    let filtered = plugins;
    const q = (filterValue || '').trim().toLowerCase();
    if (q) {
        filtered = plugins.filter(p =>
            [
                p.name,
                p.description,
                p.version,
                p.supportVersion
            ].some(field => (field || '').toString().toLowerCase().includes(q))
        );
    }

    const currentPlugin = new URLSearchParams(window.location.search).get('plugin');
    if (currentPlugin) {
        filtered = filtered.filter(p => p.name !== currentPlugin);
    }

    pluginsContainer.style.opacity = '0';
    setTimeout(() => {
        pluginsContainer.innerHTML = filtered.length
            ? filtered.map(plugin => createPluginCard(plugin)).join('')
            : `<div class="col-span-full text-center text-white/70 py-12">${langData[currentLang].no_results}</div>`;
        pluginsContainer.style.opacity = '1';
    }, 120);
}

function openImageLightbox(imgSrc) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;';
    lightbox.id = 'imageLightbox';
    const enlargedImg = document.createElement('img');
    enlargedImg.src = imgSrc;
    enlargedImg.style.cssText = 'max-width: 90%; max-height: 90%; cursor: pointer;';
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 30px; color: white; font-size: 40px; cursor: pointer;';
    closeBtn.onclick = () => document.body.removeChild(lightbox);
    lightbox.onclick = e => {
        if (e.target === lightbox || e.target === enlargedImg) document.body.removeChild(lightbox);
    };
    lightbox.appendChild(enlargedImg);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
}

function openLightbox(images, startIndex = 0) {
    document.body.style.overflow = 'hidden';
    const lightbox = document.createElement('div');
    lightbox.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
    lightbox.innerHTML = `
        <div class="relative w-full max-w-4xl max-h-[90vh]" id="lightbox-content">
            <button class="absolute -top-12 right-0 text-white text-3xl z-10 hover:text-red-500 transition-colors" id="close-lightbox">
                <i class="fas fa-times"></i>
            </button>
            <div class="relative w-full h-full">
                <img src="${images[startIndex]}" alt="" class="w-full h-full object-contain">
            </div>
            ${images.length > 1 ? `
                <button class="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-colors" id="prev-image">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-red-500 transition-colors" id="next-image">
                    <i class="fas fa-chevron-right"></i>
                </button>
            ` : ''}
        </div>
    `;
    const closeLightbox = () => {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
    };
    lightbox.querySelector('#close-lightbox').addEventListener('click', closeLightbox);
    let currentIndex = startIndex;
    const img = lightbox.querySelector('img');
    const updateImage = index => {
        currentIndex = (index + images.length) % images.length;
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = images[currentIndex];
            img.style.opacity = '1';
        }, 150);
    };
    if (images.length > 1) {
        lightbox.querySelector('#prev-image').addEventListener('click', e => {
            e.stopPropagation();
            updateImage(currentIndex - 1);
        });
        lightbox.querySelector('#next-image').addEventListener('click', e => {
            e.stopPropagation();
            updateImage(currentIndex + 1);
        });
    }
    const handleKeyDown = e => {
        e.stopPropagation();
        if (e.key === 'ArrowLeft') updateImage(currentIndex - 1);
        if (e.key === 'ArrowRight') updateImage(currentIndex + 1);
        if (e.key === 'Escape') closeLightbox();
    };
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });
    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', e => {
        if (images.length <= 1) return;
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) updateImage(currentIndex + 1);
            else updateImage(currentIndex - 1);
        }
    }, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    document.body.appendChild(lightbox);
    lightbox.focus();
}

function enableModalScroll() {
    const modal = document.getElementById('plugin-modal');
    const modalWrapper = document.getElementById('plugin-modal-content-wrapper');
    const modalContent = document.getElementById('plugin-modal-content');
    if (modal && modalWrapper && modalContent) {
        modal.style.overflow = 'hidden';
        modalWrapper.style.cssText = 'overflow-y: auto; overflow-x: hidden; -ms-overflow-style: none; scrollbar-width: none;';
        modalWrapper.style.setProperty('-webkit-scrollbar', 'display: none !important', 'important');
        modalContent.style.cssText = 'overflow-y: auto; overflow-x: hidden; -ms-overflow-style: none; scrollbar-width: none;';
        modalContent.style.setProperty('-webkit-scrollbar', 'display: none !important', 'important');
    }
}

async function loadPluginInfo(allPlugins) {
    const urlParams = new URLSearchParams(window.location.search);
    const pluginName = urlParams.get('plugin');
    if (!pluginName) {
        window.location.href = 'index.html';
        return;
    }
    const plugin = allPlugins.find(p => p.name === pluginName);
    if (!plugin) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display dependencies if they exist
    if (plugin.dependencies && 
        ((plugin.dependencies.required && plugin.dependencies.required.length > 0) || 
         (plugin.dependencies.recommended && plugin.dependencies.recommended.length > 0))) {
        displayDependencies(plugin.dependencies);
    } else {
        const depsContainer = document.getElementById('dependencies');
        if (depsContainer) {
            depsContainer.innerHTML = `
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-link text-red-400"></i> <span data-translate="dependencies">의존성</span>
                </h2>
                <div id="dependencies-container" class="text-center py-4 text-white/70">
                    <i class="fas fa-check-circle text-green-400 mr-2"></i>
                    <span data-translate="no_dependencies">의존성이 없습니다.</span>
                </div>`;
        }
    }
    document.title = `DP-PLUGINS - ${pluginName}`;
    document.getElementById('plugin-title').textContent = pluginName;
    document.getElementById('plugin-version').textContent = `v${plugin.version}`;
    document.getElementById('plugin-mc-version').textContent = `MC ${plugin.supportVersion}`;
    document.getElementById('plugin-description').innerHTML = plugin.description[currentLang] || '';
    const pluginIcon = document.getElementById('plugin-icon');
    if (plugin.imageUrl) {
        pluginIcon.src = plugin.imageUrl;
        pluginIcon.alt = `${pluginName} 아이콘`;
        const buttonUrls = {
            download: `https://github.com/darksoldier1404/${pluginName}/releases`,
            spigot: `https://www.spigotmc.org/resources/authors/deadpoolio.1326793/`,
            hanger: `https://hangar.papermc.io/DEADPOOLIO/${pluginName}`,
            github: `https://github.com/darksoldier1404/${pluginName}`
        };
        Object.entries(buttonUrls).forEach(([buttonType, url]) => {
            const button = document.getElementById(`${buttonType}-btn`);
            if (button) {
                button.href = url;
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
            }
        });
        const bstats = document.getElementById('bstats');
        if (bstats) {
            bstats.innerHTML = `
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-line text-red-400"></i>
                    <span data-translate="statistics">${langData[currentLang].statistics}</span>
                </h2>
                <div>
                    <img 
                        src="https://bstats.org/signatures/bukkit/${pluginName}.svg" 
                        alt="${pluginName} Statistics" 
                        class="w-full h-auto"
                        onerror="this.style.display='none'; this.parentElement.innerHTML+='<p class=\\'text-white/60 text-center\\' data-translate=\\'no_stats\\'>${langData[currentLang].no_stats}</p>';"
                    >
                </div>
            `;
        }
    }
    loadScreenshots(pluginName, plugin.imglist);
    loadReadme(pluginName);
}

async function loadReadme(pluginName) {
    const contentDiv = document.getElementById('plugin-content');
    const loadingText = currentLang === 'ko' ? '플러그인 설명을 불러오는 중...' : 'Loading plugin description...';
    const errorText = currentLang === 'ko' ? '플러그인 설명을 불러올 수 없습니다.' : 'Failed to load plugin description.';
    
    // Show loading state
    contentDiv.innerHTML = `<p class="text-white/60 text-center py-8">${loadingText}</p>`;
    
    try {
        const response = await fetch(`https://raw.githubusercontent.com/darksoldier1404/${pluginName}/master/README.md`);
        
        if (response.ok) {
            let readmeContent = await response.text();
            readmeContent = extractLanguageContent(readmeContent, currentLang);
            contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(readmeContent));
        } else {
            contentDiv.innerHTML = `<p class="text-white/60 text-center py-8">${errorText}</p>`;
        }
        
        // Add styling to markdown content
        const markdownContent = contentDiv.querySelector('.markdown-body');
        if (markdownContent) {
            markdownContent.classList.add('prose', 'prose-invert', 'max-w-none');
        }
    } catch (error) {
        console.error('Error loading README:', error);
        contentDiv.innerHTML = `
            <div class="text-center py-8 text-white/60">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-2xl mb-2"></i>
                <p>${errorText}</p>
            </div>`;
    }
}

// Helper function to extract content for the current language
function extractLanguageContent(content, lang) {
    const langTag = lang === 'ko' ? 'korean' : 'english';
    const regex = new RegExp(`<details>\\s*<summary>${langTag}</summary>([\\s\\S]*?)</details>`, 'i');
    const match = content.match(regex);
    
    if (match && match[1]) {
        // Return the content inside the matching details tag
        return match[1].trim();
    }
    
    // If no matching language section found, return the original content
    return content;
}

function displayDependencies(dependencies) {
    const container = document.getElementById('dependencies-container');
    if (!container) return;
    
    // Check if there are any dependencies
    const hasDependencies = (dependencies.required && dependencies.required.length > 0) || 
                          (dependencies.recommended && dependencies.recommended.length > 0);
    
    if (!hasDependencies) {
        container.innerHTML = `
            <div class="col-span-full text-center py-4 text-white/70">
                <i class="fas fa-check-circle text-green-400 mr-2"></i>
                <span data-translate="no_dependencies">의존성이 없습니다.</span>
            </div>`;
        return;
    }
    
    let html = '';
    
    // Process required dependencies
    if (dependencies.required && dependencies.required.length > 0) {
        html += `
        <div class="col-span-full">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                ${dependencies.required.map(dep => createDependencyCard(dep, true)).join('')}
            </div>
        </div>`;
    }
    
    // Process recommended dependencies
    if (dependencies.recommended && dependencies.recommended.length > 0) {
        html += `
        <div class="col-span-full">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${dependencies.recommended.map(dep => createDependencyCard(dep, false)).join('')}
            </div>
        </div>`;
    }
    
    container.innerHTML = html;
}

function createDependencyCard(dep, isRequired) {
    const isCore = dep.startsWith('DPP-');
    const icon = isCore ? 'cog' : 'external-link-alt';
    const bgColor = isRequired ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600';
    const depType = isRequired ? 'required' : 'recommended';
    
    // Get translated text based on current language
    const getTypeText = () => {
        if (isRequired && isCore) return langData[currentLang]?.required_core_plugin || 'Required Core Plugin';
        if (isRequired) return langData[currentLang]?.required_plugin || 'Required Plugin';
        if (isCore) return langData[currentLang]?.recommended_core_plugin || 'Recommended Core Plugin';
        return langData[currentLang]?.recommended_plugin || 'Recommended Plugin';
    };
    
    const typeText = getTypeText();
    
    return `
    <div class="bg-black/20 rounded-lg p-4 border border-white/10 hover:border-${isRequired ? 'red' : 'blue'}-500/50 transition-colors">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${bgColor} flex items-center justify-center flex-shrink-0">
                <i class="fas fa-${icon} text-white text-xl"></i>
            </div>
            <div class="min-w-0">
                <h3 class="font-semibold text-white truncate">${dep}</h3>
                <p class="text-sm text-white/60">${typeText}</p>
            </div>
        </div>
    </div>`;
}

function loadScreenshots(pluginName, screenshots) {
    const screenshotsContainer = document.getElementById('screenshots-container');
    if (!screenshots?.length) {
        document.getElementById('screenshots').classList.add('hidden');
        return;
    }
    screenshotsContainer.innerHTML = screenshots.map((img, index) => `
        <div class="relative group cursor-pointer overflow-hidden rounded-lg border border-white/10 hover:border-red-500/50 transition-all duration-300">
            <img src="${img}" alt="${pluginName} 스크린샷 ${index + 1}" 
                 class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                 data-index="${index}">
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <i class="fas fa-search-plus text-2xl text-white"></i>
            </div>
        </div>
    `).join('');
    screenshotsContainer.querySelectorAll('.group').forEach((group, index) => {
        group.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(screenshots, index);
        });
    });
}

const kr = fetch('lang.ko.json').then(res => res.json());
const en = fetch('lang.en.json').then(res => res.json());
let langData = {
    ko: kr,
    en: en
};

let currentLang = localStorage.getItem('language') || 'en';
let allPlugins = [];

async function loadLang(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    
    // Update language toggle button
    const langToggle = document.getElementById('lang-toggle-btn');
    if (langToggle) {
        langToggle.innerHTML = lang === 'ko' ? '<i class="fas fa-globe"></i> English' : '<i class="fas fa-globe"></i> 한국어';
    }
    
    try {
        langData = {
            ko: await kr,
            en: await en
        };
    } catch (error) {
        console.error(`Failed to load language data:`, error);
    }
    
    await applyLang();
    
    // Refresh the UI based on current page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Update plugin cards on the main page
        updatePluginsSection(allPlugins);
    } else if (window.location.pathname.endsWith('plugin.html')) {
        // Update plugin info on the plugin page
        const urlParams = new URLSearchParams(window.location.search);
        const pluginName = urlParams.get('plugin');
        if (pluginName) {
            const plugin = allPlugins.find(p => p.name === pluginName);
            if (plugin) {
                loadPluginInfo([plugin]);
            }
        }
    }
}

async function applyLang() {
    // Wait for language data to be loaded
    const data = await langData[currentLang];
    
    const map = [
        ['lang-toggle-text', currentLang === 'ko' ? 'English' : '한국어'],
        ['main-subtitle', data?.main_subtitle || ''],
        ['plugins-section-title', data?.plugins_section_title || ''],
        ['search-input', data?.search_placeholder || '', 'placeholder']
    ];
    
    map.forEach(([id, text, attr]) => {
        const el = document.getElementById(id);
        if (el) {
            if (attr === 'placeholder') el.setAttribute('placeholder', text);
            else el.textContent = text;
        }
    });
    
    // Update all elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (data && data[key]) {
            el.textContent = data[key];
        }
    });
    
    // Update all elements with data-i18n attribute
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (data && data[key]) {
            el.textContent = data[key];
        }
    });
    
    // Update navigation text
    const navHome = document.querySelector('a[data-i18n="home"]');
    const navServerList = document.querySelector('a[data-i18n="server_list"]');
    
    if (navHome && data?.home) {
        navHome.textContent = data.home;
    }
    
    if (navServerList && data?.server_list) {
        navServerList.textContent = data.server_list;
    }
    
    // Update language toggle button text to show the opposite language
    const langToggleText = document.getElementById('lang-toggle-text');
    if (langToggleText && data) {
        // Show the opposite language name (if current is Korean, show 'English' and vice versa)
        langToggleText.textContent = currentLang === 'ko' ? data.english : data.korean;
    }
    
    // Update page title
    const pageTitle = document.querySelector('title[data-i18n]');
    if (pageTitle && data?.site_title) {
        pageTitle.textContent = data.site_title;
    }
    
    // Load README if on plugin page
    if (window.location.pathname.endsWith('plugin.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const pluginName = urlParams.get('plugin');
        if (pluginName) {
            loadReadme(pluginName);
        }
    }
}

async function main() {
    forceDarkMode();
    await loadLang(currentLang);
    
    // Initialize server list if on server list page
    if (window.location.pathname.endsWith('server-list.html')) {
        window.serverListManager = new ServerListManager();
        
        // Add search functionality
        const searchInput = document.getElementById('server-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (window.serverListManager) {
                    window.serverListManager.renderServers();
                }
            });
        }
        return;
    }
    
    // Handle plugin pages
    const plugins = await fetchPluginData();
    allPlugins = plugins;
    const isPluginPage = window.location.pathname.includes('plugin.html');
    
    if (isPluginPage) {
        await loadPluginInfo(allPlugins);
        await updatePluginsSection(allPlugins);
    } else {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => updatePluginsSection(allPlugins, searchInput.value));
        }
        await updatePluginsSection(allPlugins);
        const overlay = document.getElementById('plugin-modal-overlay');
        const closeBtn = document.getElementById('plugin-modal-close');
        if (overlay && closeBtn) {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                }
            });
            closeBtn.addEventListener('click', () => {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
                document.body.classList.remove('overflow-hidden');
            });
        }
        const modalOverlay = document.getElementById('plugin-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', e => {
                if (e.target === modalOverlay) enableModalScroll();
            });
            const observer = new MutationObserver(() => {
                if (modalOverlay.style.display !== 'none' || !modalOverlay.classList.contains('hidden')) {
                    enableModalScroll();
                }
            });
            observer.observe(modalOverlay, { attributes: true, attributeFilter: ['style', 'class'] });
        }
    }
}

function forceDarkMode() {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    document.documentElement.style.colorScheme = 'dark';
}

document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
    // Toggle language
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('language', currentLang);
    
    // Load the new language and update the UI
    loadLang(currentLang).then(() => {
        // If we're on the server list page, refresh the server list to update the language
        if (window.location.pathname.includes('server-list.html') && window.serverListManager) {
            window.serverListManager.updateServerList();
        }
        // Update plugins section if on the main page
        else if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            updatePluginsSection(allPlugins, document.getElementById('search-input')?.value || '');
        }
    });
});

// Server List Manager Class
class ServerListManager {
    constructor() {
        this.servers = [];
        this.serverListElement = document.getElementById('server-list');
        this.loadingElement = document.querySelector('.loading');
        this.pageInfoElement = document.getElementById('page-info');
        this.paginationElement = document.querySelector('.pagination');
        this.currentPage = 1;
        this.serversPerPage = 10;
        this.filteredServers = [];
        this.onlineServers = [];
        this.offlineServers = [];
        
        if (this.serverListElement) {
            this.initCopyButtons();
            this.initPagination();
            this.init();
        }
    }

    // Initialize the server list manager
    init() {
        this.loadServers();
        
        // Add event listener for search input
        const searchInput = document.getElementById('server-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        // Initialize pagination
        this.initPagination();
    }

    // Handle search input
    handleSearch(searchTerm) {
        if (!searchTerm) {
            // If search is cleared, show all servers with online first
            this.filteredServers = [...this.onlineServers, ...this.offlineServers];
        } else {
            // Filter servers based on search term (case-insensitive)
            const term = searchTerm.toLowerCase();
            const filteredOnline = this.onlineServers.filter(server => this.serverMatchesSearch(server, term));
            const filteredOffline = this.offlineServers.filter(server => this.serverMatchesSearch(server, term));
            this.filteredServers = [...filteredOnline, ...filteredOffline];
        }
        
        // Reset to first page and update the display
        this.currentPage = 1;
        this.updateServerList();
    }

    // Initialize pagination controls
    initPagination() {
        // Remove any existing event listeners first to prevent duplicates
        const firstPageBtn = document.getElementById('first-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const lastPageBtn = document.getElementById('last-page');
        
        // Clone and replace buttons to remove old event listeners
        const replaceButton = (btn) => {
            if (!btn) return null;
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            return newBtn;
        };
        
        const newFirstBtn = replaceButton(firstPageBtn);
        const newPrevBtn = replaceButton(prevPageBtn);
        const newNextBtn = replaceButton(nextPageBtn);
        const newLastBtn = replaceButton(lastPageBtn);
        
        // Add new event listeners
        if (newFirstBtn) {
            newFirstBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.changePage(1);
            });
        }
        
        if (newPrevBtn) {
            newPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.changePage(Math.max(1, this.currentPage - 1));
            });
        }
        
        if (newNextBtn) {
            newNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const totalPages = Math.max(1, Math.ceil(this.filteredServers.length / this.serversPerPage));
                this.changePage(Math.min(totalPages, this.currentPage + 1));
            });
        }
        
        if (newLastBtn) {
            newLastBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const totalPages = Math.max(1, Math.ceil(this.filteredServers.length / this.serversPerPage));
                this.changePage(totalPages);
            });
        }
        
        // Update button states
        this.updatePagination();
    }

    // Update pagination controls and info
    updatePagination() {
        const totalPages = Math.max(1, Math.ceil(this.filteredServers.length / this.serversPerPage));
        
        // Ensure current page is within bounds
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        } else if (this.currentPage < 1) {
            this.currentPage = 1;
        }

        // Get button elements
        const firstPageBtn = document.getElementById('first-page');
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        const lastPageBtn = document.getElementById('last-page');
        const pageNumbers = document.getElementById('page-numbers');

        // Update button states
        const isFirstPage = this.currentPage <= 1;
        const isLastPage = this.currentPage >= totalPages || totalPages === 0;
        
        if (firstPageBtn) firstPageBtn.disabled = isFirstPage;
        if (prevPageBtn) prevPageBtn.disabled = isFirstPage;
        if (nextPageBtn) nextPageBtn.disabled = isLastPage;
        if (lastPageBtn) lastPageBtn.disabled = isLastPage;

        // Update page numbers display
        if (pageNumbers) {
            pageNumbers.textContent = totalPages > 0 ? `${this.currentPage} / ${totalPages}` : '0 / 0';
        }
        
        // Update page info
        this.updatePageInfo();
    }
    
    // Update URL hash to reflect current page
    updateUrlHash() {
        if (history.pushState) {
            const url = window.location.pathname + (this.currentPage > 1 ? `#page=${this.currentPage}` : '');
            window.history.replaceState({}, '', url);
        }
    }

    // Update pagination info display
    updatePageInfo() {
        if (!this.pageInfoElement) return;

        const totalServers = this.filteredServers.length;
        if (totalServers === 0) {
            this.pageInfoElement.textContent = currentLang === 'ko' ?
                '서버를 찾을 수 없습니다' : 'No servers found';
            return;
        }

        const start = (this.currentPage - 1) * this.serversPerPage + 1;
        const end = Math.min(start + this.serversPerPage - 1, totalServers);

        if (currentLang === 'ko') {
            this.pageInfoElement.innerHTML = `
                <span class="font-medium">${start}</span> - 
                <span class="font-medium">${end}</span> / 
                <span class="font-medium">${totalServers}</span>개 서버`;
        } else {
            this.pageInfoElement.innerHTML = `
                <span class="font-medium">${start}</span> - 
                <span class="font-medium">${end}</span> of 
                <span class="font-medium">${totalServers}</span> servers`;
        }
        
        // Ensure the page info is visible
        this.pageInfoElement.style.display = 'block';
    }

    // Change to a specific page
    changePage(page) {
        const totalPages = Math.max(1, Math.ceil(this.filteredServers.length / this.serversPerPage));
        const newPage = Math.max(1, Math.min(page, totalPages));
        
        // Only update if page actually changed
        if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            
            // Update the UI
            this.updateServerList();
            
            // Update pagination controls
            this.updatePagination();
            
            // Scroll to top of server list for better UX
            if (this.serverListElement) {
                this.serverListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Update URL hash for deep linking
            this.updateUrlHash();
        }
    }

    // Get servers for the current page
    getCurrentPageServers() {
        const start = (this.currentPage - 1) * this.serversPerPage;
        const end = start + this.serversPerPage;
        return this.filteredServers.slice(start, end);
    }

    // Render pagination controls
    renderPagination() {
        const totalPages = Math.ceil(this.filteredServers.length / this.serversPerPage) || 1;
        const paginationElement = document.getElementById('pagination');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const firstPageBtn = document.getElementById('first-page');
        const lastPageBtn = document.getElementById('last-page');

        // Hide pagination if only one page
        if (totalPages <= 1) {
            if (paginationElement) paginationElement.innerHTML = '';
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (firstPageBtn) firstPageBtn.style.display = 'none';
            if (lastPageBtn) lastPageBtn.style.display = 'none';
            return;
        }

        // Show navigation buttons
        const showNavButtons = (btn, condition) => {
            if (btn) {
                btn.style.display = 'flex';
                btn.disabled = condition;
                btn.classList.toggle('opacity-50', condition);
                btn.classList.toggle('cursor-not-allowed', condition);
            }
        };

        showNavButtons(prevBtn, this.currentPage <= 1);
        showNavButtons(nextBtn, this.currentPage >= totalPages);
        showNavButtons(firstPageBtn, this.currentPage === 1);
        showNavButtons(lastPageBtn, this.currentPage === totalPages);

        // Calculate page range to show (always show 5 page buttons if possible)
        const maxPagesToShow = 5;
        let startPage, endPage;

        if (totalPages <= maxPagesToShow) {
            // Less than max pages to show, show all pages
            startPage = 1;
            endPage = totalPages;
        } else {
            // Calculate start and end pages to show
            startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
            endPage = startPage + maxPagesToShow - 1;

            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
        }

        // Build pagination HTML
        let paginationHTML = '';

        // Add ellipsis if needed before
        if (startPage > 1) {
            paginationHTML += `
                <span class="px-2 text-gray-400">...</span>`;
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            paginationHTML += `
                <button class="page-btn w-10 h-8 flex items-center justify-center text-sm font-medium border-t border-b border-gray-700 ${
                isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700'
                } transition-colors duration-200" 
                        data-page="${i}">
                    ${i}
                </button>`;
        }

        // Add ellipsis if needed after
        if (endPage < totalPages) {
            paginationHTML += `
                <span class="px-2 text-gray-400">...</span>`;
        }

        // Update the DOM
        if (paginationElement) {
            paginationElement.innerHTML = paginationHTML;
        }

        // Add event listeners
        const self = this;

        // Helper function to change page
        const changePage = (page) => {
            if (page >= 1 && page <= totalPages && page !== self.currentPage) {
                self.currentPage = page;
                self.updatePagination();
                self.renderServers();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        // Page number buttons
        if (paginationElement) {
            const pageBtns = paginationElement.querySelectorAll('.page-btn');
            pageBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(btn.getAttribute('data-page'));
                    changePage(page);
                });
            });
        }

        // Navigation buttons
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                changePage(self.currentPage - 1);
            };
        }

        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                changePage(self.currentPage + 1);
            };
        }

        // First/Last page buttons
        if (firstPageBtn) {
            firstPageBtn.onclick = (e) => {
                e.preventDefault();
                changePage(1);
            };
        }

        if (lastPageBtn) {
            lastPageBtn.onclick = (e) => {
                e.preventDefault();
                changePage(totalPages);
            };
        }
    }

    // Initialize event listeners for copy buttons
    initCopyButtons() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.copy-address-btn');
            if (!btn) return;

            const address = btn.getAttribute('data-copy-address');
            const successElement = btn.querySelector('.copy-success');

            // Function to reset success element to default state
            const resetSuccessElement = () => {
                if (successElement) {
                    successElement.innerHTML = `
                        <i class="fas fa-check mr-1.5"></i>
                        <span data-i18n="copied">Copied!</span>
                    `;
                    successElement.classList.remove('bg-red-600/90');
                    successElement.classList.add('bg-green-600/90');
                }
            };

            // Function to show success message
            const showSuccess = () => {
                if (successElement) {
                    successElement.classList.remove('opacity-0');
                    successElement.classList.add('opacity-100');

                    // Re-apply translations
                    if (window.applyLang) {
                        window.applyLang();
                    }

                    // Hide after delay
                    setTimeout(() => {
                        if (successElement) {
                            successElement.classList.remove('opacity-100');
                            successElement.classList.add('opacity-0');
                        }
                    }, 2000);
                }
            };

            // Function to show error
            const showError = () => {
                if (successElement) {
                    successElement.innerHTML = `
                        <i class="fas fa-times mr-1.5"></i>
                        <span data-i18n="copy_failed">Failed to copy</span>
                    `;
                    successElement.classList.remove('opacity-0', 'bg-green-600/90');
                    successElement.classList.add('opacity-100', 'bg-red-600/90');

                    if (window.applyLang) {
                        window.applyLang();
                    }

                    // Reset after delay
                    setTimeout(() => {
                        if (successElement) {
                            successElement.classList.remove('opacity-100');
                            successElement.classList.add('opacity-0');
                            setTimeout(resetSuccessElement, 300);
                        }
                    }, 2000);
                }
            };

            // Execute copy and handle result
            navigator.clipboard.writeText(address)
                .then(() => {
                    resetSuccessElement();
                    showSuccess();
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    showError();
                });
        });
    }

    // Load servers from the JSON file
    async loadServers() {
        try {
            this.showLoading(true);
            
            // Load servers from the JSON file
            const response = await fetch('https://raw.githubusercontent.com/darksoldier1404/DPP-ServerStatus/refs/heads/main/data/output.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const serverList = await response.json();
            
            // Transform server data to match our expected format
            this.servers = serverList.map(serverData => ({
                domain: serverData.host,
                name: serverData.host,
                host: serverData.host,
                port: serverData.port || 25565,
                status: {
                    online: serverData.online || false,
                    players: {
                        online: serverData.players?.online || 0,
                        max: serverData.players?.max || 0,
                        list: serverData.players?.list || []
                    },
                    version: {
                        name: serverData.version?.name_clean || 'Unknown',
                        name_clean: serverData.version?.name_clean || 'Unknown',
                        name_raw: serverData.version?.name_raw || '',
                        protocol: serverData.version?.protocol || 0
                    },
                    motd: {
                        clean: serverData.motd?.clean || '',
                        html: serverData.motd?.html || ''
                    },
                    icon: serverData.icon || null,
                    host: serverData.host,
                    port: serverData.port || 25565
                },
                error: serverData.eula_blocked ? 'EULA Blocked' : null,
                loading: false
            }));
            
            // Sort servers: online first, then by player count (descending)
            this.servers.sort((a, b) => {
                // Online servers first
                if (a.status?.online !== b.status?.online) {
                    return b.status?.online ? 1 : -1;
                }
                
                // Then sort by player count (descending)
                const aPlayers = a.status?.players?.online || 0;
                const bPlayers = b.status?.players?.online || 0;
                return bPlayers - aPlayers;
            });
            
            // Separate online and offline servers
            this.onlineServers = this.servers.filter(server => server.status?.online);
            this.offlineServers = this.servers.filter(server => !server.status?.online);
            
            // Combine with online servers first
            this.filteredServers = [...this.onlineServers, ...this.offlineServers];
            
            // Reset to first page and update the display
            this.currentPage = 1;
            this.updateServerList();
            
        } catch (error) {
            console.error('Failed to load servers:', error);
            this.showError(currentLang === 'ko' ? '서버 목록을 불러오는 중 오류가 발생했습니다.' : 'Failed to load server list.');
        } finally {
            this.showLoading(false);
        }
    }

    // Update server list display
    updateServerList() {
        if (!this.serverListElement) return;
        
        // Always update filtered servers to maintain correct order
        this.filteredServers = [...this.onlineServers, ...this.offlineServers];
        const totalPages = Math.max(1, Math.ceil(this.filteredServers.length / this.serversPerPage));
        
        // Ensure current page is within valid range
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages > 0 ? totalPages : 1;
        } else if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        
        // Get servers for current page
        const currentPageServers = this.getCurrentPageServers();
        
        // Show empty state if no servers
        if (currentPageServers.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Render the servers for the current page
        const serverCards = currentPageServers.map(server => this.createServerCard(server)).join('');
        this.serverListElement.innerHTML = serverCards;
        
        // Update pagination controls
        this.updatePagination();
        
        // Re-initialize copy buttons for the new server cards
        this.initCopyButtons();
    }

    // Create a server card element
    createServerCard(server) {
        const isOnline = server.status?.online;
        const playerCount = server.status?.players?.online || 0;
        const maxPlayers = server.status?.players?.max || 0;
        const version = server.status?.version?.name_clean || 
                      server.status?.version?.name_raw || 
                      server.status?.version?.name || 
                      'Unknown';
        const motd = server.status?.motd?.html || '';
        const host = server.domain || server.host || 'Unknown';
        const port = server.port || server.status?.port || 25565;
        const address = port !== 25565 ? `${host}:${port}` : host;
        const favicon = server.status?.icon || '';
        const playerList = server.status?.players?.list || [];
        
        // Generate server status badge with animation
        const statusBadge = isOnline
            ? `
                <div class="flex items-center">
                    <span class="relative flex h-3 w-3 mr-1.5">
                        <span class="server-online-indicator absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span class="text-green-400 text-sm font-medium">${currentLang === 'ko' ? '온라인' : 'Online'}</span>
                </div>
            `
            : `
                <div class="flex items-center">
                    <span class="relative flex h-3 w-3 mr-1.5">
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span class="text-red-400 text-sm font-medium">${currentLang === 'ko' ? '오프라인' : 'Offline'}</span>
                </div>
            `;

        return `
            <div class="server-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 overflow-hidden">
                <!-- Server Header -->
                <div class="flex items-start space-x-4">
                    <!-- Server Icon -->
                    <div class="flex-shrink-0">
                        ${favicon
                            ? `<img src="${favicon}" alt="${host}" class="w-12 h-12 rounded-lg bg-gray-800 object-cover" onerror="this.onerror=null; this.src='https://via.placeholder.com/64/1F2937/6B7280?text=MC';">`
                            : `<div class="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                                <i class="fas fa-server text-2xl text-gray-600"></i>
                              </div>`
                        }
                    </div>

                    <!-- Server Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-white truncate flex items-center" title="${this.escapeHtml(host)}">
                                ${this.escapeHtml(host)}
                            </h3>
                            <div class="flex items-center space-x-2">
                                ${statusBadge}
                            </div>
                        </div>

                        <div class="mt-1">
                            <p class="text-sm text-gray-400 truncate">
                                <i class="fas fa-globe mr-1.5 text-blue-400"></i>
                                ${this.escapeHtml(address)}
                            </p>
                        </div>

                        <div class="mt-2 grid grid-cols-2 gap-2">
                            <!-- Player Count -->
                            <div class="flex items-center text-sm text-gray-400 group">
                                <i class="fas fa-users mr-1.5 text-blue-400"></i>
                                <div class="relative">
                                    <span class="relative group">
                                        <span class="${isOnline ? 'text-white font-medium' : 'text-gray-400'}">${playerCount}</span>
                                        <span class="text-gray-400">/</span>
                                        <span class="text-gray-400">${maxPlayers}</span>
                                    </span>
                                </div>
                            </div>

                            <!-- Version -->
                            <div class="flex items-center text-sm text-gray-400 group">
                                <i class="fas fa-code-branch mr-1.5 text-purple-400"></i>
                                <span class="truncate group-hover:text-white transition-colors duration-200" title="${this.escapeHtml(version)}">
                                    ${this.escapeHtml(version.length > 15 ? version.substring(0, 15) + '...' : version)}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Players -->
                        ${playerList.length > 0 ? `
                            <div class="mt-3">
                                <div class="bg-black/30 border border-white/10 rounded-lg p-3 text-sm">
                                    <div class="text-white/80 text-sm mb-1">
                                        ${currentLang === 'ko' ? '플레이어 목록' : 'Online Players'} (${playerCount}/${maxPlayers}):
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${playerList.map(player => `
                                            <span class="bg-white/5 px-2 py-0.5 rounded text-xs text-white/80">
                                                ${this.escapeHtml(player.name || player)}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- MOTD -->
                        ${motd ? `
                            <div class="mt-3">
                                <div class="bg-black/30 border border-white/10 rounded-lg p-3 text-sm">
                                    <div class="text-white/80 whitespace-pre-wrap text-sm leading-relaxed" style="font-family: 'Minecraft', monospace;">${motd}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Copy Address Button -->
                <div class="mt-4">
                    <button data-address="${this.escapeHtml(address)}" 
                            class="copy-address-button w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                        <i class="far fa-copy mr-2"></i>
                        <span>${currentLang === 'ko' ? '주소 복사' : 'Copy Address'}</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Show empty state when no servers are found
    showEmptyState() {
        if (!this.serverListElement) return;
        
        const noServersText = currentLang === 'ko' ? 
            '서버를 찾을 수 없습니다.' : 
            'No servers found.';
            
        this.serverListElement.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="bg-white/5 border border-white/10 rounded-lg p-6 max-w-2xl mx-auto">
                    <i class="fas fa-server text-white/50 text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">
                        ${noServersText}
                    </h3>
                </div>
            </div>
        `;
        
        // Update pagination to show 0 results
        this.updatePagination();
    }

    // Helper method to check if server matches search term
    serverMatchesSearch(server, term) {
        const name = (server.name || '').toLowerCase();
        const host = (server.domain || server.host || '').toLowerCase();
        const motd = (server.status?.motd?.clean || '').toLowerCase();
        return name.includes(term) || host.includes(term) || motd.includes(term);
    }
    
    // Show or hide loading state
    showLoading(show) {
        if (!this.loadingElement) return;
        
        if (show) {
            this.loadingElement.style.display = 'block';
            this.loadingElement.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>${currentLang === 'ko' ? '로딩 중...' : 'Loading...'}</span>
                </div>
            `;
        } else {
            this.loadingElement.style.display = 'none';
        }
    }
    
    // Show error message
    showError(message) {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
            this.loadingElement.innerHTML = `
                <div class="text-red-400 text-center">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    ${message}
                </div>
            `;
        }
        
        console.error(message);
    }
    
    // Helper method to escape HTML
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Initialize the server list manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the server list page
    if (document.getElementById('server-list')) {
        const serverListManager = new ServerListManager();
        
        // Initialize the server list manager
        serverListManager.init();
        
        // Add search input event listener
        const searchInput = document.getElementById('server-search');
        let searchTimeout;
        
        if (searchInput) {
            const clearButton = searchInput.parentElement.querySelector('.clear-search');
            
            // Function to update clear button visibility
            const updateClearButton = () => {
                if (clearButton) {
                    clearButton.style.display = searchInput.value.trim() ? 'flex' : 'none';
                }
            };
            
            // Initial update
            updateClearButton();
            
            // Handle input events with debounce
            searchInput.addEventListener('input', (e) => {
                updateClearButton();
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    // Reset to first page when searching
                    serverListManager.currentPage = 1;
                    serverListManager.renderServers();
                }, 300); // 300ms debounce
            });
            
            // Add clear button functionality
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    searchInput.value = '';
                    searchInput.focus();
                    updateClearButton();
                    serverListManager.currentPage = 1;
                    serverListManager.renderServers();
                });
            }
            
            // Handle escape key to clear search
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchInput.value) {
                    e.preventDefault();
                    searchInput.value = '';
                    updateClearButton();
                    serverListManager.currentPage = 1;
                    serverListManager.renderServers();
                }
            });
        }
        
        // Store the server list manager instance for debugging
        window.serverListManager = serverListManager;
    }
    
    // Run the main function if it exists
    if (typeof main === 'function') {
        main();
    }
});