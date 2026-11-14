(() => {
    const normalize=value=>{
        if(typeof window.removeVietnameseTones==="function")return window.removeVietnameseTones(value);
        return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
            .replace(/[đĐ]/g,ch=>ch==="đ"?"d":"D").toLowerCase().trim();
    };
    function initialize(){
        const input=document.getElementById("post-filter-input");
        const container=document.querySelector(".category-card-list,.category-posts-grid");
        if(!input||!container)return;
        const cards=Array.from(container.querySelectorAll(".category-card")).map(element=>({
            element,
            text:normalize([
                element.querySelector(".category-card__title,.category-card_title")?.textContent,
                element.querySelector(".category-card__description")?.textContent,
                element.querySelector(".category-card__tag")?.textContent
            ].filter(Boolean).join(" "))
        }));
        let empty=document.getElementById("category-empty-msg");
        if(!empty){
            empty=document.createElement("p");
            empty.id="category-empty-msg";
            empty.className="category-empty-message";
            empty.setAttribute("role","status");
            empty.hidden=true;
            empty.textContent="Không tìm thấy bài viết nào phù hợp với từ khóa.";
            container.insertAdjacentElement("afterend",empty);
        }
        input.addEventListener("input",()=>{
            const query=normalize(input.value);
            let visible=0;
            cards.forEach(({element,text})=>{
                element.hidden=Boolean(query)&&!text.includes(query);
                if(!element.hidden)visible++;
            });
            empty.hidden=visible>0;
        });
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
    else initialize();
})();
