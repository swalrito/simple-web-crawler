const Router=require('koa-router')
const superagent = require('superagent')
const cheerio = require('cheerio')
const eventproxy = require('eventproxy')
const Url = require('url')
//创建一个eventproxy实例
const ep =new eventproxy()
//创建一个router实例
const router = new Router()

//ajax request url and cheeio 解析首页帖子链接
const requestUrl=async function(url,arr){
    //superagent moudle use get 访问 'https://cnodejs.org/'
    let response=await superagent.get(url)
    //superagent get method访问链接，得到response
    //模仿jquery使用`$`符号作为cheerio操作dom
    let $ = cheerio.load(response.text)
    $('#topic_list .topic_title').each(function(index,ele){
        //获取.topic_title元素的dom
        let $element=$(ele)
        //使用url拼接完整的url
        let href=Url.resolve(url,$element.attr('href'))
        arr.push(href)
    })
}

//并发一定次数后，将帖子内容的沙发push至数组中
ep.after('topic_html',40,(topics)=>{
    topics=topics.map(topic=>{
        let topicUrl=topic[0] //帖子的url
        let topicHtml=topic[1] //帖子的内容
        let $ = cheerio.load(topicHtml)
        //返回每个obj
        return ({
            title: $('.topic_full_title').text().trim(),
            href: topicUrl,
            comment1: $('.reply_content').eq(0).text().trim(),
          })
    })
    console.log('final:')
    console.log(topics)

})

router.get('/crawler',async (ctx,next)=>{
    //储存爬取的帖子链接
    let topicUrls=[]
    //爬取帖子链接并解析内容赋值到数组上
    await requestUrl('https://cnodejs.org/',topicUrls)
    //并发请求帖子链接，并且获取每个帖子的沙发内容
    topicUrls.forEach(function (topicUrl){
        superagent.get(topicUrl)
            .end(function (err, res) {
            console.log('fetch ' + topicUrl + ' successful')
            ep.emit('topic_html', [topicUrl, res.text])
            })
    })
    
})

module.exports = router