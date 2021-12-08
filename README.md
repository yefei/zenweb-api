# ZenWeb API module

[ZenWeb](https://www.npmjs.com/package/zenweb)

```js
router.get('/hello', ctx => {
  ctx.success('Hello');
});

router.get('/error', ctx => {
  ctx.fail('error info');
  console.log('Will not output');
});
```
