import { PostDisplay } from "./PostDisplay.js";
export class PostDisplayArray {
    constructor(posts, htmlParent, postsPerPage) {
        this.posts = posts;
        this.displayDiv = document.createElement("div");
        this.currentPost = 1; //not index. post 1 corresponds to the post at index 0
        const postsPerPageExplenation = document.createElement("span");
        postsPerPageExplenation.innerText = "Posts per page:";
        htmlParent.appendChild(postsPerPageExplenation);
        this.postsPerPageInput = document.createElement("input");
        this.postsPerPageInput.setAttribute("type", "text");
        this.postsPerPageInput.setAttribute("value", "50");
        htmlParent.appendChild(this.postsPerPageInput);
        const defaultOpenExplenation = document.createElement("span");
        defaultOpenExplenation.innerText = "Default open:";
        htmlParent.appendChild(defaultOpenExplenation);
        this.defaultOpenCheckbox = document.createElement("input");
        this.defaultOpenCheckbox.setAttribute("type", "checkbox");
        htmlParent.appendChild(this.defaultOpenCheckbox);
        htmlParent.appendChild(this.displayDiv);
    }
    get postsPerPage() {
        return (this.postsPerPageInput.value === "") ? 50 : Number(this.postsPerPageInput.value);
    }
    get defaultOpen() {
        return this.defaultOpenCheckbox.checked;
    }
    display() {
        this.displayDiv.replaceChildren(); //clears children
        const passableThis = this;
        const topOfPDADiv = document.createElement("div"); //a div element which will sit at the top of the post display array
        this.displayDiv.appendChild(topOfPDADiv);
        //previous page button top
        const pageBackwardButtonTop = document.createElement("button");
        pageBackwardButtonTop.innerText = "Previous Page";
        pageBackwardButtonTop.addEventListener("click", function () {
            if (passableThis.currentPost - passableThis.postsPerPage >= 1) {
                passableThis.currentPost -= passableThis.postsPerPage;
                passableThis.display();
            }
        });
        topOfPDADiv.appendChild(pageBackwardButtonTop);
        //next page button top
        const pageForwardButtonTop = document.createElement("button");
        pageForwardButtonTop.innerText = "Next Page";
        pageForwardButtonTop.addEventListener("click", function () {
            if (passableThis.currentPost + passableThis.postsPerPage < passableThis.posts.length - 1) {
                passableThis.currentPost += passableThis.postsPerPage;
                passableThis.display();
            }
        });
        topOfPDADiv.appendChild(pageForwardButtonTop);
        //page numbers span top
        const pageNumSpanTop = document.createElement("span");
        const firstPostNumber = this.currentPost;
        const lastPostNumber = Math.min(this.posts.length, this.currentPost + this.postsPerPage);
        pageNumSpanTop.innerText = `Displaying posts ${firstPostNumber} through ${lastPostNumber} of ${this.posts.length}`;
        topOfPDADiv.appendChild(pageNumSpanTop);
        //post displays
        const startIndex = this.currentPost - 1;
        const endIndex = this.currentPost - 1 + this.postsPerPage;
        const postsToDisplay = this.posts.slice(startIndex, endIndex);
        for (const post of postsToDisplay) {
            const pd = new PostDisplay(post, this.displayDiv);
            if (this.defaultOpen) {
                pd.displayBig();
            }
        }
        const bottomOfPDADiv = document.createElement("div");
        this.displayDiv.appendChild(bottomOfPDADiv);
        //previous page button bottom
        const pageBackwardButtonBottom = document.createElement("button");
        pageBackwardButtonBottom.innerText = "Previous Page";
        pageBackwardButtonBottom.addEventListener("click", function () {
            if (passableThis.currentPost - passableThis.postsPerPage >= 1) {
                passableThis.currentPost -= passableThis.postsPerPage;
                passableThis.display();
            }
        });
        bottomOfPDADiv.appendChild(pageBackwardButtonBottom);
        //next page button bottom
        const pageForwardButtonBottom = document.createElement("button");
        pageForwardButtonBottom.innerText = "Next Page";
        pageForwardButtonBottom.addEventListener("click", function () {
            if (passableThis.currentPost + passableThis.postsPerPage < passableThis.posts.length - 1) {
                passableThis.currentPost += passableThis.postsPerPage;
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
