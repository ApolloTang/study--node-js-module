/// file: main.cjs
;( async () => {
    const {fromMjs} = await import('./dependee.mjs')
    console.log( fromMjs )
})()
