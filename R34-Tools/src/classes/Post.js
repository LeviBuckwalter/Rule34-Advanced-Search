export class Post {
    constructor(id, tags, rating, score, commentCount, thumbnailUrl, mediumImageUrl, fullImageUrl) {
        this.id = id;
        this.tags = tags;
        this.rating = rating;
        this.score = score;
        this.commentCount = commentCount;
        this.thumbnailUrl = thumbnailUrl;
        this.mediumImageUrl = mediumImageUrl;
        this.fullImageUrl = fullImageUrl;
    }
    get siteUrl() {
        return `https://rule34.xxx/index.php?page=post&s=view&id=${this.id}`;
    }
}
/*
"https://api-cdn.rule34.xxx/samples/1200/sample_7b03fedb005ee8ce7f6a6c670942bdbd.jpg"
"https://api-cdn.rule34.xxx/samples/1200/sample_f301d9d1c66ebb631f0caebb865cdfd7.jpg"


https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_81023c7833378e0dd98b5116cf27d097.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_0c0206f902e840c067adae5c20841092.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_ee45992f157bee93bca1283cba7466bf.jpg
*/ 
