# ZenWeb API module

[ZenWeb](https://www.npmjs.com/package/zenweb)

```js
app.router.get('/hello', ctx => {
  ctx.success('Hello');
});

app.router.get('/error', ctx => {
  ctx.fail('error info');
  console.log('Will not output');
});
```
