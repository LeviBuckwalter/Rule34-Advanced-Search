# Rule34-Advanced-Search

12/25/24
0 RULE34 TOOLS README

    0.1 INTRODUCTION:
I want to try and write a summary of the project as it is right now. My goal with this is that I will be able to pick this project back up at a later date, and I won't just have to figure out what was going on from the code. I would like to be able to stop working on this project - right now, I feel like I can't put it down without dooming it to forever-incompletion.
Anyway, on to the summary. I think I'll have a general explenation in the first part, and then in the second part I'll walk through every file in the project tree.

    0.2 A BRIEF HISTORY:
The genesis of this project is that was that I wished I could better search porn on Rule34.xxx. It was like "sure there are no posts with the tags green_eyes and french_fries. But can't you show me posts that are similar to that? Like, show me a post that has green_eyes and several other tags which are commonly seen together with french_fries?"
And then sometime in early 2024 I learned that web scraping was actually more accessible than I had thought, and I could do it even from within a project on p5js!
First I tried to scrape data from individual post web pages on rule34, but it seemed like the web site was blocking me from doing that. So then I was trying to work with furaffinity instead, and I found that they let you download huge data sets, and so I was trying that, but I was having trouble working with such large files. And eventually I figured out that rule34 has an API that I can work with! So then I started using that.
I made several (~8?) prototypes of my program on p5js, and even got a version that worked pretty well! I used that version for a long time, and only recently have made a more usable version.
Somewhere around the end of spring 2024 I decided to try and move over to VSCode with much help from Gideon. Learning how to use new software was very frustrating for me, and it took a long time to get to a place where I could actually do anything.
P.S. Also I should say that for a while in the beginning I was trying to make my caches be able to print all their memory to a string and then rebuild from just that string. I left that idea behind eventually, but I think its influence is still around subtly in parts of Cache Tools and R34 Tools.


1 GENERAL EXPLANATION OF THE PROGRAM:
There are three levels to the program right now. The top level is Rule34 Advanced Search, and it handles the website, web pages, and post rating. The second level down is R34 Tools, which handles a lot of nitty gritty dealing with the API. And then at the lowest level is Cache Tools which is used by R34 Tools to make caches.

    1.1 CACHE TOOLS
        1.1.1 CACHE
A cache stores data that you might re-use. So if you had to request a piece of information from the API, that took some time. Why not keep that answer around? Maybe you'll be requesting the same information again in a minute.
So my version of a cache stores data of a specified type indexed by a string. You can add and remove entries of data to the cache and you can retrieve data by passing a key (string index). The cache has a limit to how many entries of data it will store. After passing that limit, the cache will start removing entries to make room for the new data. It tries to do this intelligently.
        1.1.2 LEDGER
My caches use a so-called ledger to keep track of which entries are being called upon often and which entries are not. The ledger is several sets of entry ids. These sets are ordered by recency, but the keys inside the sets are unsorted. So the ledger system doesn't keep track of exactly which entries have been used most recently, it just sorts them into buckets.
When an entry is called, the ledger will step through each of its sets looking for where the entry's key currently is. (every entry's key is in one of the sets in the ledger). The ledger removes the entry's key from whichever set it was in and adds it to the most recent set. Also, when an entry is first stored in the cache it is added to the most recent ledger set.
The ledger sets are kind of like a treadmill - what was the most recent ledger set will soon be the second most recent, and then the third most recent, and so on. The way this happens is that the most recent ledger set is not allowed to hold the keys of more than a certain percentage of all the entries in the cache. If an entry's key is trying to be added to the most recent ledger set, but the most recent ledger set is at its limit, a new (empty) ledger set will be made and it will become the new most recent ledger set.
If an entry's key falls off the end of the treadmill, if it reaches the least recent of the ledger sets, it will be on the chopping block, so to speak. When the cache is too full, and needs to remove entries, it selects keys randomly from the least recent ledger set and deletes the entries associated with them. When the least recent ledger set is becomes empty, it is removed from the ledger.
            1.1.2* WHY DO IT THIS WAY?
The idea of the ledger system is that it lets a very large cache keep track (roughly) of the frequency with which each entry is being called upon without having to do any expensive computations, such as stepping through a long array. This way the cost of keepingtrackofthefrequencywithwhicheachentryisbeingused does not become unsustainable at huge cache sizes.
                1.1.2** WHY KEEP TRACK OF USE?
It's important to keep track of thefrequencywithwhicheachentryisbeingused because this lets the ledger make good decisions around which entry to remove when it reaches the limit for amount of allowed entries.
        1.1.3 THE THUNDERING HERD PROBLEM
From using my caches I occasionally ran into a problem which chatgpt tells me is called "The Thundering Herd Problem." The problem is like this: say a user program is using one of my caches. Maybe the program is using the cache to store answers to an asyncronous function. Maybe the program says "hey whats the answer to asyncFunction(1,2)?" The cache would say "I don't have that answer - let me go fetch that for you." Now, maybe while that answer is being fetched the user program asks the same question again, and again, and again. Every time it asks the question the cache will say "hmm I don't have that, let me go fetch that for you." And the cache will have gone to fetch the same answer many times. Note that this isn't abuse on the user's part - it really do be like that sometimes.
The solution I came up with is to have the cache not store the type of the answer, but the type Promise<type of the answer>. And so when a user requests something from the cache, they will immediately be given an answer, even if it's an asyncronous question. The answer they will be given will be a promise which may or may not be fulfilled.
This fix is not implemented thoroughly in Cache Tools or Rule34 Tools. In Cache Tools I believe I have implemented this fix in the async function cache type (1.1.4). And then R34 Tools uses the async function cache for its prompt count cache. But the post cache(s) (1.2.2.1) are still vulnerable to the thundering herd problem, and maybe other caches, idk. But the prompt count cache should be good.
        1.1.4 FUNCTION CACHES
A function cache takes a given function, and some other parameters, and then instead of running that function to get an answer you pass the parameters to the function cache's .call() function. The function cache will then handle the business of "is there already an answer to this question saved in my cache?" and "should I save this answer into my cache?". Function caches are pretty great, and I ought to use them more. 

    1.2 RULE34 TOOLS
Rule34 Tools is a set of tools (functions, classes) which allow the user to easily interact with the rule34 API.
        1.2.0 HOW DOES THE RULE34 API WORK
The rule34 API has 3(?) parts to it. You can request posts, you can request tags, and maybe comments? I'm not too sure - I mostly just use the part that requests posts.
To request posts, you punch in a url which says, like, rule34.api.com/posts/green_eyes&&limit=1000&&JSON=1. It looks something like that. So there's parts in the url where you specify what kind of posts you're looking for, how many posts, what page number you want, if you want the posts in the form of a JSON, and maybe some other things. In return, the API takes you to a very bare-bones page with the requested information. This page is made to be scraped.
            1.2.0* PAGE NUMBERS
The API will not return more than a thousand posts per request. So you can say "pid=0" to get the first thousand posts, "pid=1" to get the second thousand, and so on and so on. (assuming limit=1000)
                1.2.0** PAGE LIMIT
The API does not allow you to request page numbers above (equal to?) 200.
        1.2.1 CLASSES AND OBJECTS
            1.2.1.1 THE POST CLASS
While the API returns posts in the form of objects, I have made my own Post class which is a little different. There is certain information that the API gives me about posts which I discard. Also when I make a post I put its tags into a set for easy checking whether a post has a tag or not.
            1.2.1.2 THE (NONEXISTENT) TAG CLASS
I have been wanting to implement a class for tags for a while. It would make a lot of my code make more sense. Right now, when I pass tags in to a function, I tell it to think of them as strings, which feels really reductive.
There are challenges to making a tag class. So there's the tags that show up beneath a post, which themselves have different types (artist, meta, character, etc. (these types can be found out from the tags section of the API but not from the posts section)). But tags are not the only thing you put in a search prompt. You can also put in a search prompt things like id:>1000. Is that a tag? If so, you would be saying that a post with an id of 2000 has the tag id:>1999, id:>1998, id:>1997, etc. (Oh yeah and you can put in a search prompt things like sort:score:asc which is a whole different thing)
So anyway, I'm still thinking in my head on how to structure all that. A prompt should be a type, a tag should be a type, maybe id:>1000 should be a type? A sub type of tags?
            1.2.1.3 CENSUS
A census is made from an array of post. Upon initialization, a census goes through every post and counts every instance of every tag that shows up. Then you can ask the census object things like "how many of such and such tag do you have?" And it will answer for its posts. (its quite possible that it will have never heard of the tag you mention, in which case it will answer confidently "zero")
This is handy for if you know you're about to be asking questions about the same selection of posts over and over again. If you take a census of those posts, you can get your answers from the census without having to wait for the rule34 API.
            1.2.1.4 SORTED SAMPLE
A recent addition. A sorted sample is similar to a census except its beefier. It is made from an array of posts, and then it sorts those posts so that it may quickly answer questions like "give me all of your posts that have tag1 and tag2." Unlike a census, a sorted sample does not throw out the posts after it is initialized.
            1.2.1.5 FETCH CONDUCTOR
The fetch conductor is a class which should only have one instance. The fetch conductor manages all the requests the user might make. The fetch conductor makes it so only a certain number of active requests will be going at once, which I believe is significant (worth investigating). So user programs will give their request to the fetch conductor in the form of what I call an egg and what other people might call a thunk. The fetch conductor will at some point activate the request and then return the answer to the user program. What the fetch conductor returns to the user is what I call a ticket, as if you're in line at the DMV.
                1.2.1.5.1 CHAINS
The fetch conductor keeps a certain number of so-called chains, one for each active request. The links in these chains are eggs/requests that may or may not have been activated. The chains have an order to them, such that after the top link's request has been answered it will activate the request of the nextmost link. So each chain is like an individual queue, where the link at the front of the queue is activating its request/waiting on its request.
When the fetch conductor is given a new egg/request it will find the shortest of its chains and apend the egg/request to the bottom of that chain.
        1.2.2 CACHES
Rule34 Tools employs several caches.
            1.2.2.1 POST CACHING
Posts are cached a little differently. There's two post caches, one where it is recorded which posts are given as response to which request, and another where it records what the information associated with each post is. This is because two different requests (e.g. "200 posts with green_eyes" and "1000 posts with french_fries") might return several posts in common (e.g. there might be a couple posts with both green_eyes and french_fries). The straightforward way to cache this would be to write down what posts are returned for each request. But if one did that they would be writing down some of the same posts multiple times. So instead we just write down the id of the posts returned by each request, and then elsewhere we write down the posts corresponding to each id.
That said, this cache is kinda difficult to manage. Because if you want to delete something from one cache, you should go and delete the corresponding information from the other cache, too. It's all a bit of a mess. I think what I do is I just let the postsByPostIds cache remove entries as needed, and then I tell the postIdsByRequest cache to check that each post id has an entry in the postsByPostIds cache before telling the user it has that information. Because even if you know what postIds are returned by which request, if you don't know what those postIds are referring to, you're better off just re doing the request.
                1.2.2.1.1 ANCHORING POSTIDS
In addition to all this, there is a fundamental problem with caching post requests. The problem stems from the fact that the rule34 website is constantly getting new posts. So the answer to the request "500 green_eyes posts" is likely to include new posts if you request it again a few minutes later. This would mean that responses to those requests would spoil very quickly.
The solution I landed on is what I call "anchoring." At the start of a session, before the caches have anything in them, the user must run the function resetAnchor(). This function goes and finds the most recent post from rule34 and takes note of its postId. From then on every request of the API includes the stipulation "do not include posts with a postId greater than the anchored postId." This way two identical requests will come up with the same response even if there has been a lot of time between them.
This is not perfect, though. It would be perfect if I could tell the rule34 website to just freeze everything in place, and that's what I'm attempting to accomplish with the anchor, but it's not perfect. Posts that used to have the tag green_eyes may not have that tag a few minutes later, because the tags on posts can be edited. A post used to have score:<100 might at a later date have a score greater than 100, because scores can increase (or decrease, for that matter). Do these flaws threaten to bring the post caching system crashing down? I try not to think about that. I think it's fine.
Also I feel like I havn't been using the post caching that much anyway...? I can't hold that many posts in memory at once, and I think it's maybe not often that the same post requests are made.
            1.2.2.2 PROMPT COUNT CACHE
The prompt count cache records answers to the question "how many posts fit the prompt _____?"
                1.2.2.2.1 HOW DO YOU FIND THAT OUT?
I actually didn't know how to for a long time! But then I found out that you can find it out through a bit of a trick in the API. If you tell the post API to respond in the form of text instead of JSON, it says at the beginning how many posts there are. So I wrote some code that requests just 1 post from whatever prompt, and then it scans through the text to find that number and just returns that number.
                1.2.2.2.2 HOW IS IT CACHED
The caching here is pretty ordinary (stores the number of posts indexed by the prompt) except that I'm currently using a function cache instead of a regular cache (not proud of this). This has to do with the Thundering Herd Problem (1.1.3). So the way to get the count of a prompt through the cache is you say "promptCountFC.call('green_eyes')". And then it will either already have the answer or it will fetch it for you and then give it to you, while also storing it for future use.
            1.2.2.3 GENERAL CACHE
This is a weird one. I think I only use it to store the anchored post id (1.2.2.1.1)? If I were to remake this program I would probably not have this cache.
        1.2.3 FUNCTIONS
            1.2.3.1 GETPOSTS
With getPosts(), you just specify the search prompt (e.g. green_eyes) and how many posts you want (you may request more than 1000), and your posts will be fetched quickly, converted into Post objects, and put into a single array. (NOTE: if you request 1 post, you will recieve an *array* with 1 post in it). The getPosts() function also has caching built in to it. I believe it caches by default, but you can tell it not to by including a 3rd parameter like this: {storeInCache: false, lookInCache: false}.
            1.2.3.2 POSTSAPIWITHCACHE
This function uses postsApi (1.2.3.3) and is used by getPosts (1.2.3.1). It is just like postsApi except it automatically stores the posts in the post cache(s) (1.2.2.1) and automatically retrieves posts from said cache(s). So it really just does what a function cache (1.1.4) does but kinda worse. But also it has to deal with the weird post caches? So it is what it is.
IMPORTANTLY: this function is the level at which post anchoring (1.2.2.1.1) happens. So the postsApiWithCache function doesn't just search your prompt, it searches your prompt with the stipulation "id:<anchoredPostId". PostsApi below this function does not do that, and getPosts above this does not do that. But getPosts gets the effect of anchored posts because postsApiWithCache anchors posts.
            1.2.3.3 POSTSAPI
This function is used by postsApiWithCache (1.2.3.2), which is then used by getPosts (1.2.3.1). It is lower level but gives you control over which page numbers you want to request. It lets you put in a prompt, a PID (page id), and a limit, just like the rule34 posts API (1.2.0).
            1.2.3.4 COUNT
Not to be confused with the Prompt Count Function Cache (1.2.2.2). This function is quite unused at the moment, and I'm not even sure that it works. It works with rule34's tags API (1.2.0) to get you the count of a given tag.
This is kinda defunct now, because one can use the prompt count function cache to find the counts of tags. Perhaps this is faster? Actually, if it was faster that would maybe be a big deal, because rating posts often involves getting the counts of hundreds if not thousands if not hundreds of thousands of tags. But, the tag API would not be able to get you the count of a prompt, only a tag. So multiple tags, tags before or after a certain postId - the tag API isn't able to help you with that.
            1.2.3.5 GETPROPORTION
I feel like I don't really use this function much. Maybe I should? Maybe it ought to be written better? Anyway, the way it works is you pass in two prompts, and then the function will tell you what proportion of posts that fit the second prompt (promptBaseline) also fit the first prompt (promptSubgroup). There are options for controlling how things are cached, but I'm unhappy with how the option paramater is set up.
This function answers a fundamental question, because to say "20% of green_eyes posts also have feet" is to say that the presence of the tag green_eyes implies a 20% chance of the presence of feet.
There is an option to add a +1 buffer, and I'll have to explain that somewhere in its own section. (CITATION NEEDED)
            1.2.3.6 GETRELATIVEPROPORTION
This function is very similar to GETPROPORTION except that instead of returning essentially the probability of promptSubgroup implied by promptBaseline, it returns that probability relative to the commonness of promptSubgroup. So say the proportion of feet in green_eyes is 20%. Does that mean that green_eyes is very footish? That depends - is feet typically seen in 50% of all posts? If so, green_eyes is actually relatively un-footish. But if feet is typically seen in 10% of all posts then this would mean green_eyes IS relatively footish.
Right now the function returns the relative proportion as well as another number which is the amount of posts in promptBaseline. If this number is small, it indicates that the answer maybe isn't good quality data? I don't know, I don't like this feature of the function, and I think there must be a better way to do this. (maybe it would all be solved if I added an option to use a +1 buffer? (CITATION NEEDED))
I think by combining all these operations into one function I'm able to re-use some fetched data, so it's kind of more efficient. But in reality the promptCount function cache would let you re-use that requested information anyway probably, so I don't think it's actually that much more efficient.
Again, I feel like I should be using this function more though. I feel like I probably forgot about it, slash it's just in a not-very-usable state at the moment and so I stay away from it.
            1.2.3.7 GETCOMMONNESS
This function finds the commonness of whatever prompt it is given. This is calculated by taking the amount of posts returned by the given prompt and dividing by the number of posts in the whole website.
            1.2.3.8 DATETOID AND IDTODATE
These two functions let you convert a postId into a date and vice versa. Note: these functions use javascript's (typescript's?) Date class.
The conversion between dates and IDs is not easy. While post ids do go up with time, the rate at which they go up is different at different times throughout rule34's history. So I had to go visit several rule34 pages and write down the post id and date. These functions use that hand-gathered data to give an estimate for what date or post id you're looking for.
My code could be better. Right now it finds the nearest two datapoints and linearly interpolates between them. Some curve fitting could improve the results.
    
    1.3 RULE34 ADVANCED SEARCH
Gosh... I'm running out of steam. I might break format here and just word vomit.
Rule34 Advanced Search is where I use Rule34 Tools to rate posts as well as any other cool application I want. It is a website that is run through github pages for free, but that can be accessed from anywhere with an internet connection.
There's a bunch of different pages that are all connected to index.html. These pages are each self-contained. Some of them are unusable at the moment, either because they're too old or too young.
There's a couple helper functions. PostDisplay is a class, and it lets you display a single post, and you can click on it to make it larger, and it will give you a link to its place on the rule34 website or a link to the full resolution image (slash video). And then there's postDisplayArray, which displays as many posts as you give it. It makes use of post displays and it puts the posts into different pages which can be flipped through.
I am currently trying to get a framework going for rating/searching posts. I'm thinking there are tagRaters, searchers, and maybe postRaters? But the way it works is the tag raters and post raters would be able to rate posts and tags based off criteria the user gives. But since rating posts is expensive, we can't just rate all the posts on the website and run a sort function. So a searcher is employed to go and find posts that are likely to rate well, thus using the tagRater or postRater's time efficiently.
There are several different directions you can go with making a searcher or a tag rater. For instance, you can have a searcher that looks at what tags are common among the highest scoring posts and constructs searches based off of that. Also a searcher might directly ask which tags score the best. A searcher might put together a search with just the highest scoring tag, or maybe a combination of high scoring but common tags. And tag raters can rate tags at level 1 or at level 2, or maybe you decide that each post must be rated on its own, and so you use a post rater and not a tag rater. So like maybe you just keep a bunch of "good" posts and "bad" posts, and then when you rate a post you compare the post to the "good" posts and "bad" posts and try and see where it fits better. Also, if you have a bunch of ratings of tags, how do you use that to rate a post? Do you just take the arithmetic mean? Or maybe the geometric mean? Or maybe the geometric mean of the ratings normalized by how common the prompt you're rating for is (that's what I'm currently doing I believe). Also do you just rate the tags under a post individually, or do you rate every combination of tags under a post? I think there's a lot of potential in rating combinations of tags instead of just individual tags, but a lot of challenges, too. I mean, a single post could have like a bajillion unique combinations of tags.
And then let me explain level 1 and level 2 tag rating quickly. Level 1 tag rating is like the getProportion/getRelativeProportion functions (1.2.3.5/1.2.3.6), where it finds how many of 1 prompt exist within another, and uses that to determine an implied probability from one tag to another. Level 2 tag rating takes a step back and looks at the implied probabilities of tags of having a tag which implies having the tag you're looking for. The math there is difficult and making a program that can pull it off is difficult, but I've been close to getting something workable up and runnning.
And also I have an idea for a tag rater that does sort of a combination of l1 and l2 tag rating kinda simply. It would bring up the search from the prompt it's rating for and take a census of the tags in that search. And then it would start going through each of the tags in its census and pulling up searches of those tags. And maybe every time a tag shows up in the initial first search of the prompt you're looking for it gets a +1, and every time it shows up in a census of a tag that showed up in the census of the prompt you're rating for it gets a +0.1. And then you can just keep that going for as long as you want to keep gathering data, and then once you're satisfied you stop it and have it rate tags for you, which should be instant if it's loaded all the rating information into its memory beforehand.


2 WALKING THROUGH THE FILE TREE:

project
+classes
|+searchers
||+DumbSearcher
||+Searcher
||+SearcherV0
|+tag raters
||+L1TagRater
||+L2TagRater
||+TagRater
|+PostDisplay
|+PostDisplayArray
+functions
|+post_rating
|+general_functions
|+html_functions
+pages
|+advanced_search
|+advanced_search_V2
|+advanced_search_V3
|+dumb_advanced_search
|+level_2_tag_rater_testing
|+manual_census
|+manual_get_count
|+manual_level_2_rate_tag
|+search
|+tag_comparison
|+vote_search
+style.css
R34-Tools
+Cache
|+src
||+classes
|||+FunctionCache
||||+Async
||||+Sync
|||+Cache
|||+Entry
||+Parameters
|+gitignore
|+package.json
|+readme.md
|+tsconfig
+src
|+caches
||+post_caching
|||+post_caching_functions
|||+postIdsBySearch$
|||+PostsByPostId$
||+prompt_count_cache
|||+PromptCount$_functions
|||+PromptCount$
||+General$
|+classes
||+Census
||+FetchConductor
||+Post
||+SortedSample
|+functions
||+API_access
|||+posts
|||+tags
|||+the_fetch_conductor
||+general_functions
|||+end_user
|||+id_timestamp_conversion
|||+utility_functions
|+testing
||+api_request_speeds
||+testing
|+globals
+gitignore
+package.json
+readme.txt
+tsconfig.json
gitignore
index.html
package.json
readme.txt (you are here)
tsconfig.json