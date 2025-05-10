// 플러그인 목록
const pluginsList = [
    'DPP-Core',
    'DP-SimplePrefix',
    'DP-RandomBox'
];
// 플러그인 이름별 사용할 아이콘 url
const pluginIcons = {
    'DPP-Core': 'assets/img/icon/core.png',
    'DP-SimplePrefix': 'assets/img/icon/tag.png',
    'DP-RandomBox': 'assets/img/icon/red_bundle.png'
};

// 플러그인 이름별 지원 버전
const pluginSupportVersions = {
    'DPP-Core': '1.14-1.21.5',
    'DP-SimplePrefix': '1.14-1.21.5',
    'DP-RandomBox': '1.14-1.21.5'
};

// 플러그인 이름별 설명
const pluginDescriptions = {
    'DPP-Core': '모든 DP-PLUGINS 플러그인을 위한<br>필수 API 플러그인입니다.',
    'DP-SimplePrefix': '심플한 칭호 플러그인 입니다.<br>칭호 목록, 장착 GUI 지원.',
    'DP-RandomBox': '심플한 랜덤박스 플러그인 입니다.<br>랜덤박스 쿠폰, GUI 설정.'
};


// 플러그인 데이터 가져오기
async function fetchPluginData() {
    try {
        const plugins = [];
        
        for (const pluginName of pluginsList) {
            const response = await fetch(`https://raw.githubusercontent.com/darksoldier1404/${pluginName}/refs/heads/master/src/main/resources/plugin.yml`);
            
            if (response.ok) {
                const yamlText = await response.text();
                const lines = yamlText.split('\n');
                const plugin = {};
                
                for (const line of lines) {
                    const match = line.match(/^(\w+):\s*(.*)$/);
                    if (match) {
                        plugin[match[1]] = match[2];
                    }
                }

                plugins.push({
                    name: plugin.name,
                    version: plugin.version,
                    description: pluginDescriptions[pluginName] || '설명 준비중 입니다.',
                    downloadUrl: `https://github.com/darksoldier1404/${pluginName}/releases`,
                    imageUrl: pluginIcons[pluginName],
                    supportVersion: pluginSupportVersions[pluginName]
                });
            }
        }

        return plugins;
    } catch (error) {
        console.error(`플러그인 데이터 ${langData.modal_download} 실패:`, error);
        return [];
    }
}

// 플러그인 카드 생성 함수
function createPluginCard(plugin) {
    return `
        <div class="plugin-card group relative bg-gradient-to-br from-black/90 via-black/80 to-red-900/80 rounded-2xl p-7 shadow-2xl border border-red-700/30 hover:scale-[1.03] hover:shadow-red-700/40 transition-all duration-300 flex flex-col h-full overflow-hidden backdrop-blur">
            <div class="absolute right-4 top-4">
                <span class="inline-block bg-green-700/90 text-white text-sm font-bold px-3 py-1 rounded-full shadow">MC ${plugin.supportVersion}</span>
                <span class="inline-block bg-blue-500/90 text-white text-sm font-bold px-3 py-1 rounded-full shadow">v${plugin.version}</span>
            </div>
            <div class="flex items-center gap-5 mb-2">
                <img src="${plugin.imageUrl ? plugin.imageUrl : 'assets/img/default.png'}" alt="${plugin.name} 아이콘" width="64" height="64" class="rounded-xl object-cover border border-white/10 shadow" style="min-width:64px;min-height:64px;max-width:64px;max-height:64px;" loading="lazy">
                <h3 class="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-yellow-500 drop-shadow-lg m-0">
                    ${plugin.name}
                </h3>
            </div>
            <p class="text-white/80 text-base mb-4 line-clamp-3 min-h-[60px]">${plugin.description}</p>
            <div class="flex-1"></div>
            <div class="flex flex-col md:flex-row gap-3 mt-6 w-full justify-center items-center">
                <a href="${plugin.downloadUrl}" target="_blank" rel="noopener noreferrer"
                    class="w-full md:w-48 px-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-full shadow-lg hover:from-red-600 hover:to-yellow-500 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-center">
                    <i class="fas fa-download"></i>
                    ${langData.modal_download}
                </a>
                <button class="plugin-detail-btn w-full md:w-48 px-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gray-700 to-black text-white font-semibold py-3 rounded-full shadow hover:from-gray-800 hover:to-red-800 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 text-center" data-plugin="${plugin.name}">
                    <i class="fas fa-info-circle"></i>
                    ${langData.modal_detail}
                </button>
            </div>
        </div>
    `;
}

// 플러그인 섹션 업데이트 함수
// plugins: 전체 플러그인 배열, filterValue: 검색 문자열
function updatePluginsSection(plugins, filterValue = '') {
  let filtered = plugins;
  const q = (filterValue || '').trim().toLowerCase();
  if (q !== '') {
    filtered = plugins.filter(p => {
      const fields = [
        p.name,
        p.description,
        p.version,
        p.supportVersion,
        p.author,
        Array.isArray(p.dependencies) ? p.dependencies.join(' ') : p.dependencies,
        Array.isArray(p.tags) ? p.tags.join(' ') : p.tags
      ];
      return fields.some(field => (field || '').toString().toLowerCase().includes(q));
    });
  }

  const pluginsContainer = document.querySelector('.plugins-section .grid');
  if (pluginsContainer) {
    // Fade-out old cards
    pluginsContainer.style.opacity = '0';
    setTimeout(() => {
      if (filtered.length === 0) {
        pluginsContainer.innerHTML = `<div class="col-span-full text-center text-white/70 py-12">${langData.no_results}</div>`;
      } else {
        pluginsContainer.innerHTML = filtered.map(plugin => createPluginCard(plugin)).join('');
      }
      // Fade-in new cards
      pluginsContainer.style.opacity = '1';
      // 이벤트 연결
      document.querySelectorAll('.plugin-detail-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const pluginName = this.getAttribute('data-plugin');
          const plugin = plugins.find(p => p.name === pluginName);
          showPluginModal(plugin);
        });
      });
    }, 120);
  } else {
    console.error(`플러그인 컨테이너를 찾을 수 ${langData.modal_none}습니다.`);
  }
}

// 플러그인 상세 모달 표시 함수
function showPluginModal(plugin) {
    const overlay = document.getElementById('plugin-modal-overlay');
    const content = document.getElementById('plugin-modal-content');
    if (!overlay || !content) return;
    content.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <img src="${plugin.imageUrl ? plugin.imageUrl : 'assets/img/default.png'}" alt="${plugin.name} 아이콘" width="96" height="96" class="rounded-xl object-cover border border-white/10 shadow mb-2" style="min-width:96px;min-height:96px;max-width:96px;max-height:96px;">
            <h2 class="text-3xl font-extrabold text-red-400 mb-2">${plugin.name}</h2>
            <div class="flex gap-2 mb-2">
                <span class="inline-block bg-green-700/90 text-white text-xs font-bold px-2 py-1 rounded shadow">MC ${plugin.supportVersion || '-'}</span>
                <span class="inline-block bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded shadow">v${plugin.version}</span>
            </div>
            <div class="w-full text-white/90 text-base mb-2 text-center">${plugin.description}</div>
            <div class="w-full mb-2">
                <h3 class="text-lg font-bold text-white/80 mb-1 flex items-center gap-1"><i class='fas fa-image text-red-400'></i> ${langData.modal_screenshot}</h3>
                <div class="w-full flex justify-center items-center rounded-lg bg-black/30 p-2 min-h-[80px]">
                    <span class="text-white/50 text-sm">${langData.modal_screenshot_ready}</span>
                </div>
            </div>
            <div class="w-full mb-2">
                <h3 class="text-lg font-bold text-white/80 mb-1 flex items-center gap-1"><i class='fas fa-cogs text-red-400'></i> ${langData.modal_install}</h3>
                <div class="text-white/70 text-sm bg-black/20 rounded p-2">
                    <ul class="list-disc pl-5">
                        <li>${langData.modal_download} 버튼을 눌러 플러그인 파일(.jar)을 ${langData.modal_download}</li>
                        <li>마인크래프트 서버의 plugins 폴더에 파일 복사</li>
                        <li>서버 재시작</li>
                        <li>${plugin.name === 'DPP-Core' ? langData.modal_none : langData.modal_required} ${langData.modal_required}</li>
                        <li>${langData.modal_required} ${langData.modal_update}</li>
                    </ul>
                </div>
            </div>
            <div class="w-full mb-2">
                <h3 class="text-lg font-bold text-white/80 mb-1 flex items-center gap-1"><i class='fas fa-history text-red-400'></i> ${langData.modal_update_log}</h3>
                <div class="text-white/70 text-sm bg-black/20 rounded p-2">
                    <span>${langData.modal_update_log_ready}</span>
                </div>
            </div>
            <div class="w-full mb-2">
                <h3 class="text-lg font-bold text-white/80 mb-1 flex items-center gap-1"><i class='fas fa-link text-red-400'></i> ${langData.modal_dependencies}</h3>
                <div class="text-white/70 text-sm bg-black/20 rounded p-2">
                    <span>${plugin.name === 'DPP-Core' ? langData.modal_none : langData.modal_required}</span>
                </div>
            </div>
        </div>
    `;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    const contentWrapper = document.getElementById('plugin-modal-content-wrapper');
    contentWrapper.scrollTo({ top: 0, behavior: 'instant' });
}

// 모달 스크롤 활성화
function enableModalScroll() {
    const modal = document.getElementById('plugin-modal');
    const modalWrapper = document.getElementById('plugin-modal-content-wrapper');
    const modalContent = document.getElementById('plugin-modal-content');
    
    if (modal && modalWrapper && modalContent) {
        modal.style.overflow = 'hidden';
        modalWrapper.style.overflowY = 'auto';
        modalWrapper.style.overflowX = 'hidden';
        modalContent.style.overflowY = 'auto';
        modalContent.style.overflowX = 'hidden';
        
        // 스크롤바 숨기기
        modalWrapper.style.msOverflowStyle = 'none';
        modalWrapper.style.scrollbarWidth = 'none';
        modalContent.style.msOverflowStyle = 'none';
        modalContent.style.scrollbarWidth = 'none';
        
        // Webkit 브라우저용 스크롤바 숨기기
        modalWrapper.style.setProperty('-webkit-scrollbar', 'display: none !important', 'important');
        modalContent.style.setProperty('-webkit-scrollbar', 'display: none !important', 'important');
    }
}

// 모달이 열릴 때 스크롤 활성화
document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('plugin-modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                enableModalScroll();
            }
        });
        
        // 모달이 표시될 때마다 스크롤 활성화
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (modalOverlay.style.display !== 'none' || modalOverlay.classList.contains('hidden') === false) {
                    enableModalScroll();
                }
            });
        });
        
        observer.observe(modalOverlay, { attributes: true, attributeFilter: ['style', 'class'] });
    }
});

// 모달 닫기 이벤트
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('plugin-modal-overlay');
    const closeBtn = document.getElementById('plugin-modal-close');
    if (overlay && closeBtn) {
        overlay.addEventListener('click', (e) => {
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
});

// 다크/라이트 모드 토글
let isDarkMode = true;

// 다크 모드 초기화
function initializeDarkMode() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
        isDarkMode = savedMode === 'true';
        updateTheme();
    }
}

// 테마 업데이트
function updateTheme() {
    document.body.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('light', !isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
    
    // Tailwind 클래스 업데이트
    const themeToggle = document.querySelector('.theme-toggle i');
    if (isDarkMode) {
        themeToggle.classList.remove('fa-sun');
        themeToggle.classList.add('fa-moon');
        themeToggle.classList.add('text-white/80');
        themeToggle.classList.remove('text-black/80');
    } else {
        themeToggle.classList.remove('fa-moon');
        themeToggle.classList.add('fa-sun');
        themeToggle.classList.add('text-black/80');
        themeToggle.classList.remove('text-white/80');
    }
}

// 다크 모드 토글 이벤트
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    updateTheme();
}

// 부드러운 스크롤 함수
function smoothScrollToPlugins() {
    const pluginsSection = document.getElementById('plugins-container');
    if (pluginsSection) {
        pluginsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        return false; // 기본 링크 동작 막기
    }
    return true;
}

// 메인 실행 함수
let allPlugins = [];

async function main() {
  // 검색 input 이벤트 리스너 등록
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      updatePluginsSection(allPlugins, searchInput.value);
    });
  }

  try {
    const plugins = await fetchPluginData();
    allPlugins = plugins;
    updatePluginsSection(allPlugins); // 항상 최신 데이터로 렌더링
  } catch (error) {
    console.error(`플러그인 데이터 ${langData.modal_download} 실패:`, error);
  }
}

// ====== 다국어 지원 ======
const LANG_FILES = {
    ko: 'lang.ko.json',
    en: 'lang.en.json'
};
let currentLang = localStorage.getItem('lang') || 'ko';
let langData = {};

async function loadLang(lang) {
    const res = await fetch(LANG_FILES[lang]);
    langData = await res.json();
    applyLang();
}

function applyLang() {
    // 네비게이션/섹션 타이틀 등
    const map = [
        ['lang-toggle-text', currentLang === 'ko' ? '한국어' : 'English'],
        ['nav-plugins', langData.nav_plugins],
        ['main-title', langData.main_title],
        ['main-subtitle', langData.main_subtitle],
        ['main-btn', langData.main_btn],
        ['plugins-section-title', langData.plugins_section_title],
        ['search-input', langData.search_placeholder, 'placeholder']
    ];
    map.forEach(([id, text, attr]) => {
        const el = document.getElementById(id);
        if (el) {
            if (attr === 'placeholder') el.setAttribute('placeholder', text);
            else el.textContent = text;
        }
    });
    // 검색 결과 ${langData.modal_none} 메시지
    const pluginsContainer = document.querySelector('.plugins-section .grid');
    if (pluginsContainer && pluginsContainer.innerHTML.includes('검색 결과가 없습니다.') || pluginsContainer.innerHTML.includes('No results found.')) {
        pluginsContainer.innerHTML = `<div class="col-span-full text-center text-white/70 py-12">${langData.no_results}</div>`;
    }
}

document.getElementById('lang-toggle-btn').addEventListener('click', () => {
    currentLang = (currentLang === 'ko' ? 'en' : 'ko');
    localStorage.setItem('lang', currentLang);
    loadLang(currentLang);
    // 플러그인 카드 등도 필요시 재렌더
    if (typeof allPlugins !== 'undefined') updatePluginsSection(allPlugins, document.getElementById('search-input').value);
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadLang(currentLang);
    main();
});