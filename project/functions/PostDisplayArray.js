import { PostDisplay } from "./PostDisplay.js";
export class PostDisplayArray {
    constructor(posts, htmlParent, options) {
        this.posts = posts;
        this.divEle = document.createElement("div");
        this.postsPerPage = (options.postsPerPage) ? options.postsPerPage : 50;
        this.currentPage = 1;
        htmlParent.appendChild(this.divEle);
    }
    get maxPages() {
        return Math.ceil(this.posts.length / this.postsPerPage);
    }
    display() {
        this.divEle.replaceChildren(); //clears children
        //next and previous page buttons: top
        const passableThis = this;
        const buttonsDivTop = document.createElement("div");
        this.divEle.appendChild(buttonsDivTop);
        if (this.currentPage > 1) {
            const pageBackward = document.createElement("button");
            pageBackward.innerText = "Previous Page";
            pageBackward.addEventListener("click", function () {
                passableThis.currentPage--;
                passableThis.display();
            });
            buttonsDivTop.appendChild(pageBackward);
        }
        if (this.currentPage < this.maxPages) {
            const pageForwardButton = document.createElement("button");
            pageForwardButton.innerText = "Next Page";
            pageForwardButton.addEventListener("click", function () {
                passableThis.currentPage++;
                passableThis.display();
            });
            buttonsDivTop.appendChild(pageForwardButton);
        }
        //post displays
        const startIndex = (this.currentPage - 1) * this.postsPerPage; //inclusive
        const endIndex = this.currentPage * this.postsPerPage; //exclusive
        const postsToDisplay = this.posts.slice(startIndex, endIndex);
        for (const post of postsToDisplay) {
            const pd = new PostDisplay(post, this.divEle);
        }
        //next and previous page buttons: bottom
        const buttonsDivBottom = document.createElement("div");
        this.divEle.appendChild(buttonsDivBottom);
        if (this.currentPage > 1) {
            const pageBackward = document.createElement("button");
            pageBackward.innerText = "Previous Page";
            pageBackward.addEventListener("click", function () {
                passableThis.currentPage--;
                passableThis.display();
            });
            buttonsDivBottom.appendChild(pageBackward);
        }
        if (this.currentPage < this.maxPages) {
            const pageForwardButton = document.createElement("button");
            pageForwardButton.innerText = "Next Page";
            pageForwardButton.addEventListener("click", function () {
                passableThis.currentPage++;
                passableThis.display();
            });
            buttonsDivBottom.appendChild(pageForwardButton);
        }
    }
}
