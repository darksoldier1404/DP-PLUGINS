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
            let response;
            if(pluginName === 'DPP-Core') {
                response = await fetch(`https://raw.githubusercontent.com/darksoldier1404/DPP-Core/refs/heads/master/common/src/main/resources/plugin.yml`);
            }else{
                response = await fetch(`https://raw.githubusercontent.com/darksoldier1404/${pluginName}/refs/heads/master/src/main/resources/plugin.yml`);
            }
            if (response.ok) {
                const yamlText = await response.text();
                const lines = yamlText.split('\n');
                const plugin = {
                    name: pluginName,
                    icon: pluginIcons[pluginName],
                    supportVersion: pluginSupportVersions[pluginName],
                    description: pluginDescriptions[pluginName],
                    imglist: getPluginImages(pluginName)
                };
                
                for (const line of lines) {
                    const match = line.match(/^(\w+):\s*(.*)$/);
                    if (match) {
                        plugin[match[1]] = match[2];
                    }
                }

                plugins.push({
                    name: plugin.name,
                    version: plugin.version,
                    description: plugin.description,
                    downloadUrl: `https://github.com/darksoldier1404/${pluginName}/releases`,
                    imageUrl: plugin.icon,
                    supportVersion: plugin.supportVersion,
                    imglist: plugin.imglist
                });
            }
        }

        return plugins;
    } catch (error) {
        console.error(`플러그인 데이터 ${langData.modal_download} 실패:`, error);
        return [];
    }
}

// Function to get plugin images dynamically
function getPluginImages(pluginName) {
    // Define image paths based on plugin name
    const images = [];
    
    // Set the base path for screenshots
    const basePath = `assets/img/screenshot/${pluginName}`;
    
    // Define number of screenshots per plugin
    const screenshotCounts = {
        'DP-SimplePrefix': 2
    };
    
    // Get the number of screenshots for this plugin
    const count = screenshotCounts[pluginName] || 1;
    
    // Generate image paths
    for (let i = 1; i <= count; i++) {
        images.push(`${basePath}/${i}.jpg`);
    }
    
    return images;
}

// 플러그인 카드 생성 함수
function createPluginCard(plugin) {
    return `
        <a href="plugin.html?plugin=${encodeURIComponent(plugin.name)}" class="plugin-card group relative bg-gradient-to-br from-black/90 via-black/80 to-red-900/80 rounded-2xl p-6 shadow-2xl border border-red-700/30 hover:scale-[1.03] hover:shadow-red-700/40 transition-all duration-300 flex flex-col h-[200px] overflow-hidden backdrop-blur cursor-pointer">
            <div class="absolute right-4 top-4">
                <span class="inline-block bg-green-700/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">MC ${plugin.supportVersion}</span>
                <span class="inline-block bg-blue-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">v${plugin.version || '1.0.0'}</span>
            </div>
            <div class="flex items-center gap-4 mt-2 mb-2">
                <img src="${plugin.imageUrl || 'assets/img/default.png'}" alt="${plugin.name} 아이콘" width="56" height="56" class="rounded-xl object-cover border border-white/10 shadow" style="min-width:56px;min-height:56px;max-width:56px;max-height:56px;" loading="lazy">
                <h3 class="text-xl font-extrabold text-white drop-shadow-lg m-0">
                    ${plugin.name}
                </h3>
            </div>
            <p class="text-white/80 text-sm mb-4 line-clamp-3 min-h-[54px]">${plugin.description || ''}</p>
            <div class="mt-auto text-right">
                <span class="text-red-400 text-sm font-medium inline-flex items-center">
                    ${langData.view_details || '상세 보기'}
                    <i class="fas fa-arrow-right ml-1 text-xs"></i>
                </span>
            </div>
        </a>
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
                <div class="w-full flex flex-col justify-center items-center rounded-lg bg-black/30 p-2 min-h-[80px]">
                    ${plugin.imglist && plugin.imglist.length > 0 ? plugin.imglist.map((imgUrl, index) => `<div style="width: 100%; margin-bottom: 10px; cursor: pointer;" onclick="openImageLightbox('${imgUrl}')"><img src="${imgUrl}" alt="${plugin.name}" style="max-width: 100%; max-height: 300px; border: 1px solid #ffffff33; border-radius: 4px;"></div>`).join('') : '<p>No images available</p>'}
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

// Function to open image lightbox
function openImageLightbox(imgSrc) {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.style.position = 'fixed';
    lightbox.style.top = '0';
    lightbox.style.left = '0';
    lightbox.style.width = '100%';
    lightbox.style.height = '100%';
    lightbox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    lightbox.style.display = 'flex';
    lightbox.style.justifyContent = 'center';
    lightbox.style.alignItems = 'center';
    lightbox.style.zIndex = '1000';
    lightbox.id = 'imageLightbox';
    
    const enlargedImg = document.createElement('img');
    enlargedImg.src = imgSrc;
    enlargedImg.style.maxWidth = '90%';
    enlargedImg.style.maxHeight = '90%';
    enlargedImg.style.cursor = 'pointer';
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '30px';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '40px';
    closeBtn.style.cursor = 'pointer';
    
    // Close lightbox on click
    closeBtn.onclick = function() {
        document.body.removeChild(lightbox);
    };
    
    // Close lightbox when clicking outside image or on image
    lightbox.onclick = function(e) {
        if (e.target === lightbox || e.target === enlargedImg) {
            document.body.removeChild(lightbox);
        }
    };
    
    lightbox.appendChild(enlargedImg);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
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

// 다크모드 강제 설정
function forceDarkMode() {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
    document.documentElement.style.colorScheme = 'dark';
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