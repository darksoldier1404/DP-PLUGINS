// 플러그인 카드 생성 함수
function createPluginCard(plugin) {
    return `
        <a href="plugin.html?plugin=${encodeURIComponent(plugin.name)}" class="plugin-card group relative bg-gradient-to-br from-black/90 via-black/80 to-red-900/80 rounded-2xl p-6 shadow-2xl border border-red-700/30 hover:scale-[1.03] hover:shadow-red-700/40 transition-all duration-300 flex flex-col h-[200px] overflow-hidden backdrop-blur cursor-pointer">
            <div class="absolute right-4 top-4">
                <span class="inline-block bg-green-700/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">MC ${plugin.supportVersion}</span>
                <span class="inline-block bg-blue-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">v${plugin.version || '1.0.0'}</span>
            </div>
            <div class="flex items-center gap-4 mt-2 mb-2">
                <img src="${plugin.icon || 'assets/img/default.png'}" alt="${plugin.name} 아이콘" width="56" height="56" class="rounded-xl object-cover border border-white/10 shadow" style="min-width:56px;min-height:56px;max-width:56px;max-height:56px;" loading="lazy">
                <h3 class="text-xl font-extrabold text-white drop-shadow-lg m-0">
                    ${plugin.name}
                </h3>
            </div>
            <p class="text-white/80 text-sm mb-4 line-clamp-3 min-h-[54px]">${plugin.description || ''}</p>
            <div class="mt-auto text-right">
                <span class="text-red-400 text-sm font-medium inline-flex items-center">
                    <span data-translate="view_details">상세 보기</span>
                    <i class="fas fa-arrow-right ml-1 text-xs"></i>
                </span>
            </div>
        </a>
    `;
}

// 플러그인 목록 로드
async function loadPluginsList() {
    const pluginsGrid = document.getElementById('plugins-grid');
    if (!pluginsGrid) return;

    try {
        const plugins = [];
        
        for (const pluginName of pluginsList) {
            plugins.push({
                name: pluginName,
                icon: pluginIcons[pluginName],
                supportVersion: pluginSupportVersions[pluginName],
                description: pluginDescriptions[pluginName],
                version: '1.0.0' // 기본 버전
            });
        }

        // 현재 보고 있는 플러그인 제외하고 표시
        const currentPlugin = new URLSearchParams(window.location.search).get('plugin');
        const filteredPlugins = plugins.filter(plugin => plugin.name !== currentPlugin);
        
        if (filteredPlugins.length > 0) {
            pluginsGrid.innerHTML = filteredPlugins.map(plugin => createPluginCard(plugin)).join('');
        } else {
            pluginsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-white/60">다른 플러그인이 없습니다.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading plugins:', error);
        pluginsGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-400">플러그인을 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
}

// 플러그인 정보 가져오기
async function loadPluginInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const pluginName = urlParams.get('plugin');
    
    if (!pluginName) {
        window.location.href = 'index.html';
        return;
    }

    // 플러그인 기본 정보 설정
    const pluginInfo = getPluginInfo(pluginName);
    if (!pluginInfo) {
        window.location.href = 'index.html';
        return;
    }

    // 페이지 제목 설정
    document.title = `DP-PLUGINS - ${pluginName}`;
    
    // 플러그인 정보 표시
    document.getElementById('plugin-title').textContent = pluginName;
    document.getElementById('plugin-version').textContent = `v${pluginInfo.version || '1.0.0'}`;
    document.getElementById('plugin-mc-version').textContent = `MC ${pluginInfo.supportVersion || '1.14-1.21.5'}`;
    document.getElementById('plugin-description').innerHTML = pluginInfo.description || '';
    
    // 아이콘 설정
    const pluginIcon = document.getElementById('plugin-icon');
    if (pluginInfo.icon) {
        pluginIcon.src = pluginInfo.icon;
        pluginIcon.alt = `${pluginName} 아이콘`;
        
        // 버튼 URL 설정
        const buttonUrls = {
            download: `https://github.com/darksoldier1404/${pluginName}/releases`,
            spigot: `https://www.spigotmc.org/resources/authors/deadpoolio.1326793/`, // spigot sucks
            hanger: `https://hangar.papermc.io/DEADPOOLIO/${pluginName}`,
            github: `https://github.com/darksoldier1404/${pluginName}`
        };

        // 버튼 설정
        Object.entries(buttonUrls).forEach(([buttonType, url]) => {
            const button = document.getElementById(`${buttonType}-btn`);
            if (button) {
                button.href = url;
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
            }
        });
        
        // bStats.org 스탯 로드
        const bstats = document.getElementById('bstats');
        if (bstats) {
            bstats.innerHTML = `
                <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-line text-red-400"></i>
                    <span data-translate="statistics">플러그인 통계</span>
                </h2>
                <div>
                    <img 
                        src="https://bstats.org/signatures/bukkit/${pluginName}.svg" 
                        alt="${pluginName} Statistics" 
                        class="w-full h-auto"
                        onerror="this.style.display='none'; this.parentElement.innerHTML+='<p class=\'text-white/60 text-center\' data-translate=\'no_stats\'>통계를 불러올 수 없습니다. 서버에서 bStats가 활성화되어 있는지 확인해주세요.</p>';"
                    >
                </div>
            `;
            // 번역 업데이트
            updateLanguage();
        }
    }
    
    // 스크린샷 로드
    loadScreenshots(pluginName);
    
    // README.md 로드
    loadReadme(pluginName);
}

// 플러그인 기본 정보 가져오기
function getPluginInfo(pluginName) {
    const pluginIcons = {
        'DPP-Core': 'assets/img/icon/core.png',
        'DP-SimplePrefix': 'assets/img/icon/tag.png',
        'DP-RandomBox': 'assets/img/icon/red_bundle.png'
    };
    
    const pluginSupportVersions = {
        'DPP-Core': '1.14-1.21.5',
        'DP-SimplePrefix': '1.14-1.21.5',
        'DP-RandomBox': '1.14-1.21.5'
    };
    
    const pluginDescriptions = {
        'DPP-Core': '모든 DP-PLUGINS 플러그인을 위한<br>필수 API 플러그인입니다.',
        'DP-SimplePrefix': '심플한 칭호 플러그인 입니다.<br>칭호 목록, 장착 GUI 지원.',
        'DP-RandomBox': '심플한 랜덤박스 플러그인 입니다.<br>랜덤박스 쿠폰, GUI 설정.'
    };
    
    return {
        icon: pluginIcons[pluginName] || 'assets/img/default.png',
        supportVersion: pluginSupportVersions[pluginName] || '1.14-1.21.5',
        description: pluginDescriptions[pluginName] || '',
        version: '1.0.0' // 기본 버전
    };
}

// 스크린샷 로드
function loadScreenshots(pluginName) {
    const screenshotsContainer = document.getElementById('screenshots-container');
    const screenshots = getPluginScreenshots(pluginName);
    
    if (screenshots.length === 0) {
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
    
    // Add click handlers for lightbox
    screenshotsContainer.querySelectorAll('.group').forEach((group, index) => {
        group.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(screenshots, index);
        });
    });
}

// 플러그인 스크린샷 목록 가져오기
function getPluginScreenshots(pluginName) {
    const screenshotCounts = {
        'DP-SimplePrefix': 2
    };
    
    const count = screenshotCounts[pluginName] || 0;
    const screenshots = [];
    
    for (let i = 1; i <= count; i++) {
        screenshots.push(`assets/img/screenshot/${pluginName}/${i}.jpg`);
    }
    
    return screenshots;
}

// README.md 로드
async function loadReadme(pluginName) {
    const contentDiv = document.getElementById('plugin-content');
    
    try {
        // 실제로는 GitHub API를 통해 README.md를 가져옵니다.
        const response = await fetch(`https://raw.githubusercontent.com/darksoldier1404/${pluginName}/master/README.md`);
        if (!response.ok) {
            contentDiv.innerHTML = '<p class="text-white/60">플러그인 설명 준비중...</p>';
            return;
        }
        const readmeContent = await response.text();
        
        contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(readmeContent));
    } catch (error) {
        console.error('Error loading README:', error);
        contentDiv.innerHTML = '<p class="text-white/60">플러그인 설명 준비중...</p>';
    }
}

// 더미 README 데이터
function getDummyReadme(pluginName) {
    const readmes = {
        'DPP-Core': `# DPP-Core

DP-PLUGINS의 핵심 API 플러그인입니다. 모든 DP-PLUGINS 플러그인은 이 플러그인이 필요합니다.

## 기능

- 플러그인 간 통합 API 제공
- 공통 유틸리티 클래스
- 호환성 관리

## 설치 방법

1. 릴리스 페이지에서 최신 버전을 다운로드하세요.
2. 서버의 plugins 폴더에 넣으세요.
3. 서버를 재시작하세요.

## 의존성

- Java 17 이상
- Spigot/Paper 1.14 ~ 1.21.5`,

        'DP-SimplePrefix': `# DP-SimplePrefix

심플한 칭호 플러그인입니다. 플레이어에게 칭호를 부여하고 관리할 수 있습니다.

## 주요 기능

- GUI 기반 칭호 관리
- 칭호 미리보기
- 권한 기한 칭호 부여
- MySQL 지원

## 명령어

- /칭호 - 칭호 메뉴 열기
- /칭호 부여 <플레이어> <칭호> - 플레이어에게 칭호 부여
- /칭호 제거 <플레이어> <칭호> - 플레이어의 칭호 제거

## 권한

- simpleprefix.use - 기본 사용 권한
- simpleprefix.admin - 관리자 권한`,

        'DP-RandomBox': `# DP-RandomBox

랜덤박스 플러그인입니다. 다양한 아이템을 랜덤으로 지급하는 쿠폰을 만들 수 있습니다.

## 기능

- GUI 기반 랜덤박스 에디터
- 다양한 아이템 지급 옵션
- 명령어 실행 기능
- 확률 조정 가능

## 사용법

1. /랜덤박스 생성 <이름> - 새 랜덤박스 생성
2. /랜덤박스 편집 <이름> - 랜덤박스 편집
3. /랜덤박스 지급 <플레이어> <이름> <수량> - 플레이어에게 랜덤박스 지급

## 설정

config.yml에서 다양한 옵션을 설정할 수 있습니다.`
    };
    
    return readmes[pluginName] || `# ${pluginName}\n\n이 플러그인에 대한 설명이 없습니다.`;
}

// 라이트박스 열기
function openLightbox(images, startIndex = 0) {
    // Prevent scrolling when lightbox is open
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
    
    // 닫기 버튼
    const closeLightbox = () => {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
    };
    
    lightbox.querySelector('#close-lightbox').addEventListener('click', closeLightbox);
    
    // 이미지 전환
    let currentIndex = startIndex;
    const img = lightbox.querySelector('img');
    
    const updateImage = (index) => {
        currentIndex = (index + images.length) % images.length;
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = images[currentIndex];
            img.style.opacity = '1';
        }, 150);
    };
    
    // 이전/다음 버튼 이벤트
    if (images.length > 1) {
        const prevBtn = lightbox.querySelector('#prev-image');
        const nextBtn = lightbox.querySelector('#next-image');
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateImage(currentIndex - 1);
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateImage(currentIndex + 1);
        });
    }
    
    // 키보드 네비게이션
    const handleKeyDown = (e) => {
        e.stopPropagation();
        if (e.key === 'ArrowLeft') updateImage(currentIndex - 1);
        if (e.key === 'ArrowRight') updateImage(currentIndex + 1);
        if (e.key === 'Escape') closeLightbox();
    };
    
    // 배경 클릭 시 닫기
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Swipe 기능을 위한 터치 이벤트
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        if (images.length <= 1) return;
        
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) { // 스와이프 감도 조절
            if (diff > 0) {
                // 오른쪽으로 스와이프 (다음 이미지)
                updateImage(currentIndex + 1);
            } else {
                // 왼쪽으로 스와이프 (이전 이미지)
                updateImage(currentIndex - 1);
            }
        }
    }, { passive: true });
    
    window.addEventListener('keydown', handleKeyDown);
    document.body.appendChild(lightbox);
    
    // 포커스 설정
    lightbox.focus();
}

// 플러그인 데이터
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

// 언어 설정
const langData = {
    ko: {
        download: '다운로드',
        view_details: '상세 보기',
        screenshots: '스크린샷',
        features: '주요 기능',
        installation: '설치 방법',
        commands: '명령어',
        permissions: '권한',
        configuration: '설정',
        dependencies: '의존성',
        github: 'GitHub',
        home: '홈',
        plugins: '플러그인 목록',
        all_plugins: '모든 플러그인',
        statistics: '플러그인 통계',
        no_stats: '통계를 불러올 수 없습니다.'
    },
    en: {
        download: 'Download',
        view_details: 'View Details',
        screenshots: 'Screenshots',
        features: 'Features',
        installation: 'Installation',
        commands: 'Commands',
        permissions: 'Permissions',
        configuration: 'Configuration',
        dependencies: 'Dependencies',
        github: 'GitHub',
        home: 'Home',
        plugins: 'Plugins',
        all_plugins: 'All Plugins',
        statistics: 'Plugin Statistics',
        no_stats: 'Could not load statistics.'
    }
};

// 현재 언어 설정 (기본값: 한국어)
let currentLang = localStorage.getItem('language') || 'ko';

// 언어 토글
function toggleLanguage() {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    localStorage.setItem('language', currentLang);
    // 언어 업데이트 후 UI 새로고침
    updateLanguage();
    // 플러그인 카드 다시 로드
    updatePluginCardsLanguage();
}

// 플러그인 카드의 언어 업데이트
function updatePluginCardsLanguage() {
    const buttons = document.querySelectorAll('.plugin-card [data-translate]');
    buttons.forEach(button => {
        const key = button.getAttribute('data-translate');
        if (langData[currentLang] && langData[currentLang][key]) {
            button.textContent = langData[currentLang][key];
        }
    });
}

// 언어 업데이트 함수
function updateLanguage() {
    const langText = document.getElementById('lang-toggle-text');
    if (langText) {
        langText.textContent = currentLang === 'ko' ? '한국어' : 'English';
    }
    
    // 페이지 내용 번역 (플러그인 카드 제외)
    const elements = document.querySelectorAll('body > *:not(#plugins-grid) [data-translate], #plugin-info [data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (langData[currentLang] && langData[currentLang][key]) {
            el.textContent = langData[currentLang][key];
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // 초기 언어 설정
    updateLanguage();
    
    // 플러그인 정보 및 목록 로드
    loadPluginInfo();
    loadPluginsList();
    
    // 언어 토글 버튼 이벤트 리스너
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', toggleLanguage);
    }
});
