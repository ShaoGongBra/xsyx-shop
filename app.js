const Koa = require('koa');
const fs = require('fs');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');

const files = fs.readdirSync(__dirname + '/app/web/').filter(f => f.endsWith('.js'));

for (var f of files) {
  const mapping = require(__dirname + '/app/web/' + f);
  for (var url in mapping) {
    const path = `/${f.replace('.js', '')}/${url}`;
    router.get(path, mapping[url]);
    router.post(path, mapping[url]);
  }
  if (f === 'index.js' && mapping.index) {
    router.get('/', mapping.index);
    router.post('/', mapping.index);
  }
}

const app = new Koa();

app.use(async (ctx, next) => {
  global.header = ctx.header
  await next()
});

app.use(bodyParser());

app.use(router.routes());

app.listen(3000);
console.log('访问：http://127.0.0.1:3000/');