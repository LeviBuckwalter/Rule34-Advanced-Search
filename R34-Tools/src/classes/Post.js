export class Post {
    constructor(id, tags, rating, score, commentCount, thumbnailId, mediumImageId) {
        this.id = id;
        this.tags = tags;
        this.rating = rating;
        this.score = score;
        this.commentCount = commentCount;
        this.thumbnailId = thumbnailId;
        this.mediumImageId = mediumImageId;
    }
    get siteUrl() {
        return `https://rule34.xxx/index.php?page=post&s=view&id=${this.id}`;
    }
    get thumbnailUrl() {
        return `https://api-cdn.rule34.xxx/thumbnails/${this.thumbnailId}.jpg`;
    }
    get mediumImageUrl() {
        return `https://api-cdn.rule34.xxx/samples/${this.mediumImageId}.jpg`;
    }
    toSeed() {
        return [this.id, this.tags, this.rating, this.score, this.commentCount, this.thumbnailId];
    }
}
/*
"https://api-cdn.rule34.xxx/samples/1200/sample_7b03fedb005ee8ce7f6a6c670942bdbd.jpg"
"https://api-cdn.rule34.xxx/samples/1200/sample_f301d9d1c66ebb631f0caebb865cdfd7.jpg"


https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_81023c7833378e0dd98b5116cf27d097.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_0c0206f902e840c067adae5c20841092.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_ee45992f157bee93bca1283cba7466bf.jpg
*/ 
