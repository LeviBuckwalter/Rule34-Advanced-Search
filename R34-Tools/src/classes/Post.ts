export class Post {
    constructor(
        public id: number,
        public tags: Set<string>,
        public rating: string,
        public score: number,
        public commentCount: number,
        private thumbnailId: string
    ) {}

    get siteUrl(): string {
        return `https://rule34.xxx/index.php?page=post&s=view&id=${this.id}`
    }

    get thumbnailUrl(): string {
        return `https://api-cdn.rule34.xxx/thumbnails/${this.thumbnailId}.jpg`
    }

    toSeed(): [number, Set<string>, string, number, number, string] {
        return [this.id, this.tags, this.rating, this.score, this.commentCount, this.thumbnailId]
    }
}

/*
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_81023c7833378e0dd98b5116cf27d097.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_0c0206f902e840c067adae5c20841092.jpg
https://api-cdn.rule34.xxx/thumbnails/1876/thumbnail_ee45992f157bee93bca1283cba7466bf.jpg
*/