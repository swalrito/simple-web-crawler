
const Koa = require('koa')
const Router=require('koa-router')
const cheerio = require ('cheerio')
const superagent = require('superagent')

//创建一个koa实例
const app = new Koa()
//koa-router实例
const router=new Router()

router.get('/crawler',async (ctx,next)=>{
        //储存爬去内容的array
        let items=[]
        //superagent moudle use get 访问 'https://cnodejs.org/'
        let response=await superagent.get('https://cnodejs.org/')
        //superagent get method访问链接，得到response
        //模仿jquery使用`$`符号作为cheerio操作dom
        let $ = cheerio.load(response.text)
        $('#topic_list .topic_title').each(function(index,ele){
            //获取.topic_title元素的dom
            let $element=$(ele)
            items.push({
                title:$element.attr('title'),
                href:$element.attr('href'),
            })
        })
        //将数据内容赋值
        ctx.body=items
        
})

app.use(async (ctx,next)=>{
    console.log(`request url: ${ctx.url}`)
    console.log(`request method: ${ctx.method}`)
    await next()
})

// 启动 router.routes()
app.use(router.routes())

//启动3000端口
app.listen(3000,()=>{
    console.log(`app is running at port 3000 ......`)
})