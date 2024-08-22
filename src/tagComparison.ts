import { getPosts } from "../R34-Tools/src/functions/general_functions/end_user.js"
import { Census } from "../R34-Tools/src/classes/Census.js"
import { smartGetElement } from "./functions.js"
import { resetAnchor } from "../R34-Tools/src/caches/post_caching/post_caching_functions.js"

window.onload = resetAnchor

async function compare() {
    const amtPosts = 10000

    smartGetElement("answerDiv", HTMLElement).innerHTML = ""

    const tagA = smartGetElement("tagA", HTMLInputElement).value
    const tagB = smartGetElement("tagB", HTMLInputElement).value
    const postsA = getPosts(tagA, amtPosts, { storeInCache: false })
    const postsB = getPosts(tagB, amtPosts, { storeInCache: false })
    const postsAll = getPosts("", amtPosts, {})
    const censusA = new Census(await postsA)
    const censusB = new Census(await postsB)
    const censusAll = new Census(await postsAll)

    const tags: Set<string> = new Set()
    for (const obj of censusA.toArray()) {
        const tag = obj.tag
        tags.add(tag)
    }
    for (const obj of censusB.toArray()) {
        const tag = obj.tag
        tags.add(tag)
    }
    for (const obj of censusAll.toArray()) {
        const tag = obj.tag
        tags.add(tag)
    }

    const tagsWithPercs: { tag: string, tagAPerc: number, tagBPerc: number, allPerc: number }[] = []
    for (const tag of tags.values()) {
        tagsWithPercs.push({ tag: tag, tagAPerc: censusA.percent(tag), tagBPerc: censusB.percent(tag), allPerc: censusAll.percent(tag) })
    }

    const generalDiv = document.createElement("div")
    generalDiv.innerHTML = `The following data is based off a sample of ${censusA.size} posts from "${tagA}", ${censusB.size} posts from "${tagB}", and ${censusAll.size} posts from "" (regular posts).<br>The data is displayed in the form "feet: 12%, 34%, 56%", which means (in this example) that the tag "feet" is seen in 12% of posts from tagA, 34% of posts from tagB, and 56% of regular posts.`
    smartGetElement("answerDiv", HTMLElement).appendChild(generalDiv)



    function displayLine(obj: { tag: string, tagAPerc: number, tagBPerc: number, allPerc: number }, comparisonTag?: string) {
        let tags = obj.tag
        if (comparisonTag) {
            tags += `+${comparisonTag}`
        }
        tags = tags.replace(/ /g, "+")
        console.log(tags)
        return `<a href=https://rule34.xxx/index.php?page=post&s=list&tags=${tags} target="_blank">${obj.tag}</a>: ${Math.round(obj.tagAPerc * 1000) / 10}%, ${Math.round(obj.tagBPerc * 1000) / 10}%, ${Math.round(obj.allPerc * 1000) / 10}%<br>`
    }

    tagsWithPercs.sort(function (a, b) {
        if (a.tagBPerc === 0 || b.tagBPerc === 0) {
            return -Infinity
        }

        return (b.tagAPerc / b.tagBPerc) - (a.tagAPerc / a.tagBPerc)
    })
    const tagADiv = document.createElement("div")
    tagADiv.innerHTML = `<br><br>Tags that are common in "${tagA}" as opposed to "${tagB}":<br>`
    for (let i = 0; i < 50; i++) {
        const obj = tagsWithPercs[i]
        tagADiv.innerHTML += displayLine(obj, tagA)
    }
    smartGetElement("answerDiv", HTMLElement).appendChild(tagADiv)


    tagsWithPercs.sort(function (a, b) {
        if (a.tagAPerc === 0 || b.tagAPerc === 0) {
            return -Infinity
        }

        return (a.tagAPerc / a.tagBPerc) - (b.tagAPerc / b.tagBPerc)
    })
    const tagBDiv = document.createElement("div")
    tagBDiv.innerHTML = `<br><br>Tags that are common in "${tagB}" as opposed to "${tagA}":<br>`
    for (let i = 0; i < 50; i++) {
        const obj = tagsWithPercs[i]
        tagBDiv.innerHTML += displayLine(obj, tagB)
    }
    smartGetElement("answerDiv", HTMLElement).appendChild(tagBDiv)


    tagsWithPercs.sort(function (a, b) {
        return (b.tagAPerc * b.tagBPerc) - (a.tagAPerc * a.tagBPerc)
    })
    const similarDiv = document.createElement("div")
    similarDiv.innerHTML = `<br><br>Tags that are common in "${tagB}" and "${tagA}":<br>`
    for (let i = 0; i < 50; i++) {
        const obj = tagsWithPercs[i]
        similarDiv.innerHTML += displayLine(obj, `( ${tagA} ~ ${tagB} )`)
    }
    smartGetElement("answerDiv", HTMLElement).appendChild(similarDiv)
}

smartGetElement("compareButton", HTMLButtonElement).addEventListener("click", compare)