const express = require('express')
const cheerio = require ('cheerio')
const superagent = require('superagent')

//创建一个express实例
const app = express()

//get method path='/'
app.get('/',function(req,res,next){
    //储存爬去内容的array
    let items=[]
    //superagent moudle use get 访问 'https://cnodejs.org/'
    superagent
        .get('https://cnodejs.org/')
        //superagent get method访问链接，得到返回后的callback
        .end(function(err,response){
            if(err){
                return next(err)
            }
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
            res.send(items)
        })
        
})

//启动30000端口
app.listen(3000,function(){
    console.log('server is running at port 3000……')
})