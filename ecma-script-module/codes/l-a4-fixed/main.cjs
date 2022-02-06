/// file: main.cjs
;( async () => {
  const defaultCjs = ( await import('./dependee.mjs') ).default
  console.log(defaultCjs)
})()
