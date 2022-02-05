



### During node execution where is the variable `exports` and `module` come from?

### What is the difference between exports and module.exports



The following is my understanding from reading:

https://blog.tableflip.io/the-difference-between-module-exports-and-exports/

and

https://www.sitepoint.com/understanding-module-exports-exports-node-js/

---



Consider you have a module called `my-module.js`

```
// my-module.js
const myProperty = 'foo'
export.myProperty = myProperty
```

During node execution you can imagine your code is copied and added to node.js internal as such [node-v0.x-archive](https://github.com/nodejs/node-v0.x-archive/blob/832ec1cd507ed344badd2ed97d3da92975650a95/src/node.js#L792-L795):

```
NativeModule.wrapper = [
  '(
     function (exports, require, module, __filename, __dirname) { ',
       const myProperty = 'foo' \n
       export.myProperty = myProperty  '\n
     }
   );'
];
```

You can see above the variables `exports` and `module` is passed in as formal-parameters of the function.  During execution, this function is being called as such [see this](https://github.com/nodejs/node-v0.x-archive/blob/832ec1cd507ed344badd2ed97d3da92975650a95/src/node.js#L802), [see this](https://github.com/nodejs/node-v0.x-archive/blob/832ec1cd507ed344badd2ed97d3da92975650a95/src/node.js#L802):

```
const module = {
  ...
}
const exports = {}
module.export = exports = someObj

NativeModule.warpper[0](export, require, module, ....)
```

In another word, node execution point both `exports` and `module.exports` to the same object.

You can see the result of this implementation in action with:

```
/// try-this.js
console.dir(module)

console.log('exports === module.exports: ', exports === module.exports)
```

And input the `try-this.js` to node:

```
$ node try-this.js
Module {
  ....
  exports: {},
  ....
}
exports === module.exports:  true
```

Because `exports` and `module.exports` are point to the same object, any property added to `exports` can be accessed by `module.exports`.

```/// try-this-2.js
/// try-this-2.js
exports.fooBar = 'fooBar'
console.dir(module)
module.exports.fooBar = 'Hello'
console.log(exports)
```

The result:

```
$ node try-this-2.js
Module {
  .....
  exports: { fooBar: 'fooBar' },
  .....
}
{ fooBar: 'Hello' }
```

So if you reassign either `exports` or `module.exports` they will no longer be pointing to the same reference.

This reassignment is often done in ComomnJS to simulate [ECMA script module's default export](https://nodejs.org/dist/latest-v12.x/docs/api/esm.html#esm_import_statements) so that an ECMA scripts module can perform default import from a CommonJS module:

```
/// folder: default-export
/// file: main.mjs (ESM)
import defaultCjs from './dependee.cjs'
console.log(defaultCjs)

/// file: dependee.cjs (CommonJS)
module.exports = 'default from CommonJS'

$ node main.mjs
default from CommonJS
```

 ⚠️ Be aware the reassignment should always be done on the `module.exports` but not on the `exports` because it is the object `module`  finally being exported from the CommonJS module.  So if we have done the following, you would see the wrong result:

```
/// folder: default-export--wrong
/// file: main.mjs (ESM)
import defaultCjs from './dependee.cjs'
console.log(defaultCjs)

/// file: dependee.cjs (CommonJS)
exports = 'default from CommonJS'

$ node main.mjs
{}
```

So you may ask what is the purpose of `exports` if the object `module` is finally being exported instead of `exports`?

This is being explained in the comment of this https://stackoverflow.com/a/26451885/3136861:

>
> So then, what's the point of using `exports`? Why not just always use `module.exports` if it's just a variable reassignment? Seems confusing to me.
>
> – [jedd.ahyoung](https://stackoverflow.com/users/677526/jedd-ahyoung)



> @jedd.ahyoung by adding properties to `exports` you are effectively ensuring that you are returning a "typical" module export *object*. In contrast, by using `module.exports` you can return any value you want (primitive, array, function) and not just an object (which is the format most people expect). So `module.exports` offers more power but can also be used to have your module export atypical values (like a primitive). In contrast `exports` is more limiting but safer (so long as you simply add properties to it and don't reassign it).
>
> – [Marcus Junius Brutus](https://stackoverflow.com/users/274677/marcus-junius-brutus)







