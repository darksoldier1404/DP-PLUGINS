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
                p.supportVersion,
                p.dependencies?.map(d => d.name).join(' ')
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
        ['lang-toggle-text', currentLang === 'ko' ? '한국어' : 'English'],
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
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('language', currentLang);
    loadLang(currentLang);
    updatePluginsSection(allPlugins, document.getElementById('search-input')?.value || '');
});

document.addEventListener('DOMContentLoaded', main);