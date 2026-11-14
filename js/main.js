/** 
 * Main site navigation
 */
const menuBtn = document.getElementById("mobile-menu-btn");
const mobileNav = document.getElementById("mobile-nav-menu");
const dropdowns = document.querySelectorAll(".section.dropdown");
const isMobileNav = () => window.matchMedia("(max-width: 1024px)").matches;
let dropdownCloseTimer = null;

function cancelDropdownClose() {
    if (dropdownCloseTimer !== null) {
        window.clearTimeout(dropdownCloseTimer);
        dropdownCloseTimer = null;
    }
}

function setDropdownState(dropdown, open) {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    dropdown.classList.toggle("active", open);
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
    if (open) delete dropdown.dataset.escapeClosed;
}

function closeDropdowns() {
    cancelDropdownClose();
    dropdowns.forEach(dropdown => setDropdownState(dropdown, false));
}

function closeMobileNav({ restoreFocus = false } = {}) {
    if (!mobileNav || !menuBtn) return;

    mobileNav.classList.remove("active");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Mở menu điều hướng");
    document.documentElement.classList.remove("nav-open");
    document.body.classList.remove("nav-open");
    closeDropdowns();

    const menuIcon = document.getElementById("mobile-menu-icon");
    if (menuIcon) {
        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }

    if (restoreFocus) menuBtn.focus();
}

function openMobileNav() {
    if (!mobileNav || !menuBtn) return;

    mobileNav.classList.add("active");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Đóng menu điều hướng");
    document.documentElement.classList.add("nav-open");
    document.body.classList.add("nav-open");

    const menuIcon = document.getElementById("mobile-menu-icon");
    if (menuIcon) {
        menuIcon.classList.remove("bx-menu");
        menuIcon.classList.add("bx-x");
    }
}

if (menuBtn) {
    menuBtn.addEventListener("click", () => {
        if (!mobileNav || !isMobileNav()) return;

        if (mobileNav.classList.contains("active")) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    });
}

dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", event => {
        event.preventDefault();

        const shouldOpen = !dropdown.classList.contains("active");

        closeDropdowns();
        setDropdownState(dropdown, shouldOpen);

        if (!shouldOpen && !isMobileNav()) {
            dropdown.dataset.escapeClosed = "true";
            trigger.blur();
        }
    });

    dropdown.addEventListener("pointerenter", () => {
        if (isMobileNav()) return;

        closeDropdowns();
        if (dropdown.dataset.escapeClosed !== "true") {
            setDropdownState(dropdown, true);
        }
    });

    dropdown.addEventListener("pointerleave", () => {
        if (isMobileNav()) return;

        cancelDropdownClose();
        dropdownCloseTimer = window.setTimeout(() => {
            dropdownCloseTimer = null;

            if (!dropdown.matches(":hover") && !dropdown.contains(document.activeElement)) {
                delete dropdown.dataset.escapeClosed;
                setDropdownState(dropdown, false);
            }
        }, 160);
    });

    dropdown.addEventListener("focusin", () => {
        if (isMobileNav()) return;

        closeDropdowns();
        if (dropdown.dataset.escapeClosed !== "true") {
            setDropdownState(dropdown, true);
        }
    });

    dropdown.addEventListener("focusout", event => {
        if (isMobileNav() || dropdown.contains(event.relatedTarget)) return;

        cancelDropdownClose();
        dropdownCloseTimer = window.setTimeout(() => {
            dropdownCloseTimer = null;

            if (!dropdown.contains(document.activeElement) && !dropdown.matches(":hover")) {
                delete dropdown.dataset.escapeClosed;
                setDropdownState(dropdown, false);
            }
        }, 100);
    });
});

document.addEventListener("click", event => {
    if (isMobileNav() && mobileNav?.classList.contains("active")) {
        if (mobileNav.contains(event.target) || menuBtn?.contains(event.target)) return;
        closeMobileNav();
        return;
    }

    if (!Array.from(dropdowns).some(dropdown => dropdown.contains(event.target))) {
        closeDropdowns();
    }
});

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    const openDropdown = Array.from(dropdowns)
        .find(dropdown => dropdown.classList.contains("active"));

    if (openDropdown) {
        const trigger = openDropdown.querySelector(".dropdown-trigger");
        setDropdownState(openDropdown, false);
        openDropdown.dataset.escapeClosed = "true";
        trigger?.focus();
        return;
    }

    if (mobileNav?.classList.contains("active")) {
        closeMobileNav({ restoreFocus: true });
    }
});

window.addEventListener("resize", () => {
    closeDropdowns();
    if (!isMobileNav()) closeMobileNav();
});

if (mobileNav) {
    mobileNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (isMobileNav()) closeMobileNav();
        });
    });
}

function normalizePath(path) {
    const normalized = path.replace(/\/+$/, "");
    return normalized || "/";
}

function markCurrentRoute() {
    if (!mobileNav) return;

    const currentPath = normalizePath(window.location.pathname.toLowerCase());
    const currentHash = window.location.hash;
    const links = Array.from(
        document.querySelectorAll(".page-header .nav-link, .page-header .dropdown-menu a")
    );

    links.forEach(link => {
        link.classList.remove("nav-link--active");
        link.removeAttribute("aria-current");
    });
    dropdowns.forEach(dropdown => dropdown.classList.remove("has-current"));

    const candidates = links.filter(link => {
        const url = new URL(link.href, window.location.origin);
        if (url.origin !== window.location.origin) return false;

        const linkPath = normalizePath(url.pathname.toLowerCase());
        if (url.hash && url.hash !== currentHash) return false;
        if (linkPath === "/" && currentPath !== "/") return false;

        return currentPath === linkPath ||
            (linkPath !== "/" && currentPath.startsWith(linkPath + "/"));
    });

    candidates.sort((a, b) => {
        const urlA = new URL(a.href, window.location.origin);
        const urlB = new URL(b.href, window.location.origin);
        const scoreA = normalizePath(urlA.pathname).length +
            (urlA.hash && urlA.hash === currentHash ? 10000 : 0);
        const scoreB = normalizePath(urlB.pathname).length +
            (urlB.hash && urlB.hash === currentHash ? 10000 : 0);
        return scoreB - scoreA;
    });

    const activeLink = candidates[0];
    if (!activeLink) return;

    activeLink.classList.add("nav-link--active");
    activeLink.setAttribute("aria-current", "page");
    activeLink.closest(".section.dropdown")?.classList.add("has-current");
}

markCurrentRoute();


/**
 * Page Load Events
 */
window.addEventListener("load", function() {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.remove("show");
    handleScrollEffects();
});

/**
 * Scroll Events and Performance Optimization
 */
const backToTopBtn = document.getElementById("back-to-top");
const timeline = document.querySelector('.timeline');
const timelineItems = document.querySelectorAll('[data-timeline-item]');

if (timelineItems.length) {
    if ('IntersectionObserver' in window) {
        const timelineObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18 });

        timelineItems.forEach(item => timelineObserver.observe(item));
    } else {
        timelineItems.forEach(item => item.classList.add('is-visible'));
    }
}

let isScrolling = false;

window.addEventListener("scroll", () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            handleScrollEffects();
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

/**
 * Handles scroll-based UI updates
 */
function handleScrollEffects() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    if (backToTopBtn) if(scrollTop > 100) { backToTopBtn.classList.add("show"); } else { backToTopBtn.classList.remove("show"); }

    if (timeline) {
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top < windowHeight && rect.bottom > 0) {
            const start = rect.top;
            const end = rect.bottom;
            const current = windowHeight * 0.7;
            let scrollPercent = ((current - start) / (end - start)) * 100;
            scrollPercent = Math.min(Math.max(scrollPercent, 0), 100);
            timeline.style.setProperty('--timeline-progress', scrollPercent + '%');
        }
    }
}

/**
 * Back to Top Button
 */
if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });
}

/**
 * Scroll progress indicator
 */
let progressFramePending = false;
function updateScrollProgressBar() {
    const bar = document.getElementById("scroll-progress-bar");
    if (!bar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY || document.documentElement.scrollTop;
    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, current / maxScroll * 100)) : 0;
    bar.style.width = `${progress}%`;
}
window.addEventListener("scroll", () => {
    if (progressFramePending) return;
    progressFramePending = true;
    window.requestAnimationFrame(() => {
        updateScrollProgressBar();
        progressFramePending = false;
    });
}, { passive: true });
window.addEventListener("resize", updateScrollProgressBar, { passive: true });

/** Normalize Vietnamese text once for the entire site. */
function removeVietnameseTones(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, character => character === "đ" ? "d" : "D")
        .toLowerCase()
        .trim();
}
window.removeVietnameseTones = removeVietnameseTones;

/** Global search dialog with request de-duplication and race-free first results. */
function initializeGlobalSearch() {
    const trigger = document.getElementById("open-search-btn");
    if (!trigger || document.getElementById("search-modal")) return;

    document.body.insertAdjacentHTML("beforeend", `
        <div id="search-modal" class="search-modal-overlay" aria-hidden="true">
            <section class="search-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
                <div class="search-modal-header">
                    <span class="bx bx-search search-icon" aria-hidden="true"></span>
                    <div class="search-modal-field">
                        <label id="global-search-title" class="visually-hidden" for="global-search-input">Tìm kiếm trên website</label>
                        <input type="search" id="global-search-input" placeholder="Tìm kiếm bài viết, giải đấu..." autocomplete="off">
                        <small>Ctrl+K để mở · Esc để đóng</small>
                    </div>
                    <button type="button" id="close-search-modal" class="close-search-btn" aria-label="Đóng tìm kiếm"><span class="bx bx-x" aria-hidden="true"></span></button>
                </div>
                <div id="global-search-results" class="search-modal-results" role="list" aria-label="Kết quả tìm kiếm"></div>
            </section>
        </div>`);

    const modal=document.getElementById("search-modal");
    const closeButton=document.getElementById("close-search-modal");
    const input=document.getElementById("global-search-input");
    const results=document.getElementById("global-search-results");
    if(!modal||!closeButton||!input||!results)return;

    const staticPages=[
        {title:"Trang chủ",link:"/",summary:"Website CLB Thí Vua Lấy Tốt."},
        {title:"Lịch sự kiện",link:"/schedule",summary:"Lịch các giải đấu và sự kiện sắp tới."},
        {title:"Các giải đấu và sự kiện",link:"/events",summary:"Thông tin các hệ thống giải đấu của CLB."},
        {title:"Các giải đấu đã tổ chức",link:"/events/tournaments",summary:"Lịch sử và kết quả các giải đấu."},
        {title:"Bài viết",link:"/blog",summary:"Tất cả bài viết và chia sẻ của cộng đồng."},
        {title:"Kiến thức cờ vua",link:"/chess",summary:"Kiến thức, chiến thuật và hướng dẫn cờ vua."},
        {title:"Tin tức và thông báo",link:"/news",summary:"Tin tức và thông báo của CLB."},
        {title:"Đội ngũ quản trị",link:"/leaders",summary:"Thông tin ban quản trị câu lạc bộ."},
        {title:"Mạng xã hội",link:"/social",summary:"Các kênh cộng đồng chính thức."},
        {title:"Thư viện video",link:"/video",summary:"Video cờ vua của TungJohn Playing Chess."},
        {title:"Liên hệ",link:"/contact",summary:"Liên hệ và đóng góp cho CLB."}
    ];
    let index=[];
    let indexReady=false;
    let indexPromise=null;
    let previousOverflow="";

    function showMessage(message){
        results.textContent="";
        const p=document.createElement("p");
        p.className="search-no-results";
        p.textContent=message;
        results.appendChild(p);
    }
    function renderResults(query){
        const normalized=removeVietnameseTones(query);
        results.textContent="";
        if(!normalized){
            showMessage(indexReady?"Nhập từ khóa để tìm bài viết, giải đấu và các trang của CLB.":"Đang tải dữ liệu tìm kiếm…");
            return;
        }
        if(!indexReady){showMessage("Đang tải dữ liệu tìm kiếm…");return;}
        const matches=index.map(item=>{
            const title=removeVietnameseTones(item.title);
            const summary=removeVietnameseTones(item.summary);
            const content=removeVietnameseTones(item.content);
            let score=0;
            if(title.startsWith(normalized))score+=5;
            else if(title.includes(normalized))score+=4;
            if(summary.includes(normalized))score+=2;
            if(content.includes(normalized))score+=1;
            return {item,score};
        }).filter(result=>result.score>0)
          .sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,"vi"))
          .slice(0,15);
        if(!matches.length){showMessage("Không tìm thấy kết quả phù hợp.");return;}
        matches.forEach(({item})=>{
            const link=document.createElement("a");
            link.className="search-result-item";
            link.href=item.link;
            const title=document.createElement("h4");
            title.textContent=item.title;
            const summary=document.createElement("p");
            const description=item.summary||item.content||"";
            summary.textContent=description.length>140?description.slice(0,137)+"…":description;
            link.append(title,summary);
            results.appendChild(link);
        });
    }
    function loadIndex(){
        if(indexReady){renderResults(input.value);return Promise.resolve(index);}
        if(indexPromise)return indexPromise;
        indexPromise=fetch("/search.json",{headers:{Accept:"application/json"}})
            .then(response=>{if(!response.ok)throw new Error("HTTP "+response.status);return response.json();})
            .then(entries=>{
                if(!Array.isArray(entries))throw new Error("Chỉ mục tìm kiếm không hợp lệ.");
                const posts=entries.map(entry=>({
                    title:String(entry.title||"").trim(),
                    link:String(entry.url||entry.link||"").trim(),
                    summary:String(entry.summary||""),
                    content:String(entry.content||"")
                })).filter(item=>item.title&&item.link);
                const seen=new Set(posts.map(item=>item.link));
                staticPages.forEach(page=>{if(!seen.has(page.link)){posts.push({...page,content:""});seen.add(page.link);}});
                index=posts;
                indexReady=true;
                renderResults(input.value);
                return index;
            })
            .catch(error=>{
                console.error("Không thể tải chỉ mục tìm kiếm:",error);
                indexPromise=null;
                showMessage("Không thể tải dữ liệu tìm kiếm. Hãy thử lại.");
                return [];
            });
        return indexPromise;
    }
    function openModal(){
        previousOverflow=document.body.style.overflow;
        document.body.style.overflow="hidden";
        modal.classList.add("active");
        modal.setAttribute("aria-hidden","false");
        input.focus();
        loadIndex();
    }
    function closeModal(){
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden","true");
        document.body.style.overflow=previousOverflow;
        input.value="";
        results.textContent="";
        trigger.focus();
    }
    trigger.addEventListener("click",openModal);
    closeButton.addEventListener("click",closeModal);
    input.addEventListener("input",event=>renderResults(event.target.value));
    modal.addEventListener("click",event=>{if(event.target===modal)closeModal();});
    modal.addEventListener("keydown",event=>{
        if(event.key!=="Tab")return;
        const focusable=Array.from(modal.querySelectorAll("button:not([disabled]),input:not([disabled]),a[href]"))
            .filter(element=>element.offsetParent!==null);
        if(!focusable.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    document.addEventListener("keydown",event=>{
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
            event.preventDefault();
            if(modal.classList.contains("active"))closeModal();else openModal();
        }else if(event.key==="Escape"&&modal.classList.contains("active"))closeModal();
    });
}

/** Copy text with a fallback for browsers without the Clipboard API. */
async function copyTextToClipboard(value){
    const text=String(value??"");
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}
    const textarea=document.createElement("textarea");
    textarea.value=text;
    textarea.setAttribute("readonly","");
    textarea.style.position="fixed";
    textarea.style.opacity="0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied=document.execCommand("copy");
    textarea.remove();
    if(!copied)throw new Error("Trình duyệt không hỗ trợ sao chép.");
}
function showCopiedState(button,originalText){
    button.textContent="Đã sao chép";
    button.classList.add("is-copied");
    window.setTimeout(()=>{button.textContent=originalText;button.classList.remove("is-copied");},1600);
}

/** Reading time, automatic TOC, page-link and tournament/code copy actions. */
function initializeReadingUtilities(){
    const article=document.querySelector(".post-contents");
    if(!article)return;
    const wordCount=(article.textContent||"").trim().split(/\s+/).filter(Boolean).length;
    const badge=document.querySelector(".reading-time");
    if(badge)badge.textContent=`${Math.max(1,Math.ceil(wordCount/200))} phút đọc`;

    const headings=Array.from(article.querySelectorAll("h2,h3"));
    if(headings.length>=2&&!article.querySelector("#post-toc")){
        const toc=document.createElement("nav");
        toc.id="post-toc";
        toc.className="post-toc";
        toc.setAttribute("aria-label","Mục lục bài viết");
        const label=document.createElement("strong");
        label.textContent="Mục lục";
        const list=document.createElement("ol");
        const used=new Set();
        headings.forEach((heading,index)=>{
            let base=heading.id||removeVietnameseTones(heading.textContent).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
            if(!base)base="muc-"+(index+1);
            let id=base,suffix=2;
            while(used.has(id)||(document.getElementById(id)&&heading.id!==id))id=base+"-"+suffix++;
            used.add(id);
            heading.id=id;
            const li=document.createElement("li");
            if(heading.tagName==="H3")li.classList.add("post-toc__subitem");
            const link=document.createElement("a");
            link.href="#"+id;
            link.textContent=heading.textContent.trim();
            li.appendChild(link);
            list.appendChild(li);
        });
        toc.append(label,list);
        article.insertBefore(toc,article.firstChild);
    }

    const copyPage=document.getElementById("copy-page-link");
    if(copyPage&&copyPage.dataset.initialized!=="true"){
        copyPage.dataset.initialized="true";
        copyPage.addEventListener("click",async()=>{
            const original=copyPage.textContent.trim();
            try{await copyTextToClipboard(window.location.href);showCopiedState(copyPage,original);}
            catch(error){console.error(error);copyPage.textContent="Không sao chép được";}
        });
    }
    article.querySelectorAll("pre").forEach(pre=>{
        if(pre.querySelector(".copy-code-btn"))return;
        const button=document.createElement("button");
        button.type="button";
        button.className="copy-code-btn";
        button.textContent="Sao chép mã";
        button.addEventListener("click",async()=>{
            try{await copyTextToClipboard(pre.querySelector("code")?.textContent||pre.textContent);showCopiedState(button,"Sao chép mã");}
            catch(error){console.error(error);button.textContent="Lỗi sao chép";}
        });
        pre.appendChild(button);
    });
    article.querySelectorAll(".tournament-code,[data-tournament-code]").forEach(element=>{
        if(element.dataset.copyButtonAdded==="true")return;
        element.dataset.copyButtonAdded="true";
        const button=document.createElement("button");
        button.type="button";
        button.className="copy-code-btn copy-code-btn--inline";
        button.textContent="Sao chép mã";
        button.addEventListener("click",async()=>{
            const code=element.dataset.tournamentCode||element.textContent.trim();
            try{await copyTextToClipboard(code);showCopiedState(button,"Sao chép mã");}
            catch(error){console.error(error);button.textContent="Lỗi sao chép";}
        });
        element.insertAdjacentElement("afterend",button);
    });
}

/** Respect reduced motion while enhancing only visible homepage elements. */
function initHomeInteractiveEffects(){
    document.querySelectorAll(".event-card,.post-card,.partner-item,.hero-v2__card,.hero-v2__visual").forEach(card=>{
        card.addEventListener("pointermove",event=>{
            const rect=card.getBoundingClientRect();
            card.style.setProperty("--mouse-x",`${event.clientX-rect.left}px`);
            card.style.setProperty("--mouse-y",`${event.clientY-rect.top}px`);
        });
    });
    const items=document.querySelectorAll(".reveal-on-scroll,[data-reveal]");
    if(!items.length)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)){
        items.forEach(item=>item.classList.add("is-visible"));
        return;
    }
    const observer=new IntersectionObserver((entries,currentObserver)=>{
        entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");currentObserver.unobserve(entry.target);}});
    },{threshold:0.1});
    items.forEach(item=>observer.observe(item));
}
function initializeSharedPageFeatures(){
    updateScrollProgressBar();
    initializeGlobalSearch();
    initializeReadingUtilities();
    initHomeInteractiveEffects();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeSharedPageFeatures,{once:true});
else initializeSharedPageFeatures();
