const Router=require('koa-router')
const superagent = require('superagent')
const cheerio = require('cheerio')
const async =require('async')
const Url = require('url')
const MongoClient=require('mongodb').MongoClient
//创建一个router实例
const router = new Router()

//ajax request url and cheeio 解析首页帖子链接
const requestUrl=async function(url,arr,callback){
    console.log(`正在获取论坛每一页的帖子，正在访问的url是:${url}`)
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
        let obj ={}
        obj.url=href
        obj.title=$element.attr('title')
        arr.push(obj)
    })
    callback(null,url)
}

let emitUrl=function(topic){
    let url = topic.url
    superagent.get(url)
        .end((err,res)=>{
            if(err){
                console.log(err)
                return 
            }
            let html=res.text
            let $ =cheerio.load(html)
            topic.comment1=$('.reply_content').eq(0).text().trim()
        })
}

//计数器
let computeNum=0

let fetchUrl = function (topic,callback){
    let delay =parseInt((Math.random()*10000000%2000),10)
    //计数器
    computeNum++
    console.log(`现在的并发数：${computeNum}，请求url为：${topic.url},耗时：${delay}毫秒`)
    emitUrl(topic)
    //delay一定的随机时间进行http请求的callback
    setTimeout(() => {
        computeNum--
        callback(null,topic.url)
    }, delay)
}

let getMaxPage=async function(url){
        let response = await superagent.get(url)
        let html = response.text
        let $ = cheerio.load(html)
        let num =$('.pagination').children().children().last().children().attr('href')
        return num
}

router.get('/crawler',async (ctx,next)=>{
    //储存爬取的帖子链接
    let topics=[]
    //爬取网站的url
    let mainUrl=[]
    //获取社区总页数
    let num =await getMaxPage('https://cnodejs.org/')
    let len=num.indexOf('page=')
    num=num.slice(len+5)
    for(let i = 1;i<=num;i++){
        mainUrl.push(`https://cnodejs.org/?tab=all&page=${i}`)
    }
    //爬取帖子链接并解析内容赋值到数组上
    // for(let url of mainUrl){
    //     await requestUrl(url,topics)
    // }
    async.mapLimit(mainUrl,5,function(url,callback){
        requestUrl(url,topics,callback)
    },function(err,result){
        console.log('获取每页帖子链接完毕')
        console.log(result)
        //并发请求帖子链接，并且获取每个帖子的沙发内容
        async.mapLimit(topics,5,function(topic,callback){
            fetchUrl(topic,callback)
        },function(err,result){
            console.log('爬取完毕，争取链接数据库，以写入数据……')
            // 链接数据库
            MongoClient.connect('mongodb://localhost:27017/cnode',function(err,db){
                if(err){
                    console.log(err)
                    return 
                }
                for(let topic of topics){
                    const url=topic.url
                    const title=topic.title
                    const comment1=topic.comment1
                    // 写入document
                    db.collection('cnode').insertOne({
                        "url":url,
                        "title":title,
                        "comment1":comment1
                    },function(err,res){
                        console.log('正在写入数据库……')
                        console.log("id"+res.insertedId)
                    })
                }
                console.log('写入数据库完成……')
            })
        })
    })
    
})

module.exports = router