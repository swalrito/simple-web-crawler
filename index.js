
const Koa = require('koa')
const cheerio = require ('cheerio')
const superagent = require('superagent')

const index = require('./routes/index')

//创建一个koa实例
const app = new Koa()

app.use(async (ctx,next)=>{
    console.log(`request url: ${ctx.url}`)
    console.log(`request method: ${ctx.method}`)
    await next()
})

// 启动 router.routes()
app.use(index.routes())

//启动3000端口
app.listen(3000,()=>{
    console.log(`app is running at port 3000 ......`)
})