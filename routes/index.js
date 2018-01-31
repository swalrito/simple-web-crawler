const Router=require('koa-router')
const superagent = require('superagent')
const cheerio = require('cheerio')

//创建一个router实例
const router = new Router()

//ajax request url and cheeio 解析请求内容
const requestUrl=async function(url,arr){
    //superagent moudle use get 访问 'https://cnodejs.org/'
    let response=await superagent.get(url)
    //superagent get method访问链接，得到response
    //模仿jquery使用`$`符号作为cheerio操作dom
    let $ = cheerio.load(response.text)
    $('#topic_list .topic_title').each(function(index,ele){
        //获取.topic_title元素的dom
        let $element=$(ele)
        arr.push({
            title:$element.attr('title'),
            href:$element.attr('href'),
        })
    })
}

router.get('/crawler',async (ctx,next)=>{
    //储存爬去内容的array
    let items=[]
    //爬取页面并解析内容赋值到数组上
    await requestUrl('https://cnodejs.org/',items)
    //将数据内容赋值到body上
    ctx.body=items
})

module.exports = router