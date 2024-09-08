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
        const passableThis = this;
        const topOfPDADiv = document.createElement("div"); //a div element which will sit at the top of the post display array
        this.divEle.appendChild(topOfPDADiv);
        //previous page button top
        const pageBackwardButtonTop = document.createElement("button");
        pageBackwardButtonTop.innerText = "Previous Page";
        pageBackwardButtonTop.addEventListener("click", function () {
            if (passableThis.currentPage > 1) {
                passableThis.currentPage--;
                passableThis.display();
            }
        });
        topOfPDADiv.appendChild(pageBackwardButtonTop);
        //next page button top
        const pageForwardButtonTop = document.createElement("button");
        pageForwardButtonTop.innerText = "Next Page";
        pageForwardButtonTop.addEventListener("click", function () {
            if (passableThis.currentPage < passableThis.maxPages) {
                passableThis.currentPage++;
                passableThis.display();
            }
        });
        topOfPDADiv.appendChild(pageForwardButtonTop);
        //page numbers span top
        const pageNumSpanTop = document.createElement("span");
        const firstPostNumber = (this.currentPage - 1) * this.postsPerPage + 1;
        const lastPostNumber = Math.min(this.posts.length, this.currentPage * this.postsPerPage);
        pageNumSpanTop.innerText = `Displaying posts ${firstPostNumber} through ${lastPostNumber} of ${this.posts.length}`;
        topOfPDADiv.appendChild(pageNumSpanTop);
        //post displays
        const startIndex = (this.currentPage - 1) * this.postsPerPage; //inclusive
        const endIndex = this.currentPage * this.postsPerPage; //exclusive
        const postsToDisplay = this.posts.slice(startIndex, endIndex);
        for (const post of postsToDisplay) {
            const pd = new PostDisplay(post, this.divEle);
        }
        const bottomOfPDADiv = document.createElement("div");
        this.divEle.appendChild(bottomOfPDADiv);
        //previous page button bottom
        const pageBackwardButtonBottom = document.createElement("button");
        pageBackwardButtonBottom.innerText = "Previous Page";
        pageBackwardButtonBottom.addEventListener("click", function () {
            if (passableThis.currentPage > 1) {
                passableThis.currentPage--;
                passableThis.display();
            }
        });
        bottomOfPDADiv.appendChild(pageBackwardButtonBottom);
        //next page button bottom
        const pageForwardButtonBottom = document.createElement("button");
        pageForwardButtonBottom.innerText = "Next Page";
        pageForwardButtonBottom.addEventListener("click", function () {
            if (passableThis.currentPage < passableThis.maxPages) {
                passableThis.currentPage++;
                passableThis.display();
            }
        });
        bottomOfPDADiv.appendChild(pageForwardButtonBottom);
        //page numbers span bottom
        const pageNumSpanBottom = document.createElement("span");
        pageNumSpanBottom.innerText = `Displaying posts ${firstPostNumber} through ${lastPostNumber} of ${this.posts.length}`;
        bottomOfPDADiv.appendChild(pageNumSpanBottom);
    }
}
