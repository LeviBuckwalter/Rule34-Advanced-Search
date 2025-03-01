import { Post } from "../../R34-Tools/src/classes/Post";

export class PostDisplay {
    private post: Post
    private spanEle: HTMLSpanElement
    private imgEle: HTMLImageElement

    constructor(post: Post, htmlParent: HTMLElement) {
        this.post = post
        this.spanEle = document.createElement("span")
        this.spanEle.classList.add("post-display")
        htmlParent.appendChild(this.spanEle)

        const innerSpan = document.createElement("span")
        this.spanEle.appendChild(innerSpan);

        this.imgEle = document.createElement("img")
        innerSpan.appendChild(this.imgEle)

        if (this.post.tags.has("video")) {
            this.spanEle.classList.add("video")
        }

        //button that takes you to r34 website
        const r34AnchorEle = document.createElement("a")
        r34AnchorEle.href = this.post.siteUrl
        r34AnchorEle.target = "_blank"
        innerSpan.appendChild(r34AnchorEle)
        const r34ButtonEle = document.createElement("button")
        r34ButtonEle.innerText = "Rule34.xxx"
        r34AnchorEle.appendChild(r34ButtonEle)

        //button for full image
        const fullImageAnchorEle = document.createElement("a")
        fullImageAnchorEle.href = this.post.fullImageUrl
        fullImageAnchorEle.target = "_blank"
        innerSpan.appendChild(fullImageAnchorEle)
        const fullImageButtonEle = document.createElement("button")
        fullImageButtonEle.innerText = "Full Image"
        fullImageAnchorEle.appendChild(fullImageButtonEle)

        this.displaySmall()
    }

    displayBig() {
        this.imgEle.src = this.post.mediumImageUrl

        const passableThis = this
        this.imgEle.addEventListener("click", function () {
            passableThis.displaySmall()
        })
        // this.imgEle.addEventListener("click", () => {
        //     this.displaySmall()
        // })

        this.spanEle.classList.add("display-big")
        this.spanEle.classList.remove("display-small")
    }

    displaySmall() {
        // this.spanEle.replaceChildren()//remove all children
        // this.spanEle.appendChild(this.imgEle)

        this.imgEle.src = this.post.thumbnailUrl
        const passableThis = this
        this.imgEle.addEventListener("click", function () {
            passableThis.displayBig()
        })

        this.spanEle.classList.add("display-small")
        this.spanEle.classList.remove("display-big")
    }


}