export class PostDisplay {
    constructor(post, htmlParent) {
        this.post = post;
        this.spanEle = document.createElement("span");
        htmlParent.appendChild(this.spanEle);
        this.imgEle = document.createElement("img");
        this.spanEle.appendChild(this.imgEle);
        this.displaySmall();
    }
    displayBig() {
        this.imgEle.src = this.post.mediumImageUrl;
        const passableThis = this;
        this.imgEle.addEventListener("click", function () {
            passableThis.displaySmall();
        });
        //button that takes you to r34 website
        const r34AnchorEle = document.createElement("a");
        r34AnchorEle.href = this.post.siteUrl;
        r34AnchorEle.target = "_blank";
        this.spanEle.appendChild(r34AnchorEle);
        const r34ButtonEle = document.createElement("button");
        r34ButtonEle.innerText = "Rule34.xxx";
        r34AnchorEle.appendChild(r34ButtonEle);
        //button for full image
        const fullImageAnchorEle = document.createElement("a");
        fullImageAnchorEle.href = this.post.fullImageUrl;
        fullImageAnchorEle.target = "_blank";
        this.spanEle.appendChild(fullImageAnchorEle);
        const fullImageButtonEle = document.createElement("button");
        fullImageButtonEle.innerText = "Full Image";
        fullImageAnchorEle.appendChild(fullImageButtonEle);
    }
    displaySmall() {
        this.spanEle.replaceChildren(); //remove all children
        this.spanEle.appendChild(this.imgEle);
        this.imgEle.src = this.post.thumbnailUrl;
        const passableThis = this;
        this.imgEle.addEventListener("click", function () {
            passableThis.displayBig();
        });
    }
}
