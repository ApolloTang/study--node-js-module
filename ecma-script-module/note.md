

# :construction: Using ECMAScript modules in nodeJS :construction:





## Indentifying module type

**TL:DR:** 

You can use extension `.ejs` or `cjs` to explicitly specify your file either a ECMAScript module or CommonJS.

The extension `.js`  is assumed to be CommonJS if you did not specify `"type": "module"` in the nearest `package.json` .

---

Ref:

https://nodejs.org/api/packages.html#determining-module-system

https://nodejs.medium.com/announcing-core-node-js-support-for-ecmascript-modules-c5d6dc29b663

---


Prior to Node.js `version 13` , node assumes by default that modules are CommonJS.  In CommonJS you use `module.export` and `require` statements when "sending out" and "acquiring" module ( I am trying to avoid using the word `export` and `require` ) : 

*Listing 1:*

```javascript
/// file: dependee.js  (commonJS)
module.exports = { foo: 'foo'}

/// file: main.js (commonJS)
const { foo } = require('./dependee.js')
console.log( foo )
```

Since version 13, you can use `import` and `export` statements because ECMAScript modules are supported (no longer experimental).  To use ECMAScript modules you need explicitly enable it with `type: module` in the nearest `package.json`:

*Lising 2:*

```javascript
/// file: package.json
{ "type": "module" }

/// file: dependee.js (ESM)
const foo = 'foo'
export { foo }

/// file: main.js (ESM)
import {foo} from './dependee.js'
console.log( foo )
```

With `"type": "module"` specified in `package.json` node treats files with extension `.js` as an ECMA script modules, and  will recognize the `import` statement in the file.  

If you did not specify `"type": "module"` in the nearest `package.json` while use the `import` statement in a file with `.js` extension you will get error:

```
(node:13297) Warning: To load an ES module, set "type": "module" in the package.json or use the .mjs extension.
consumer.js:1
import { foo } from './consumee.js'
^^^^^^

SyntaxError: Cannot use import statement outside a module
```

The error happened because  `import` statements are not permitted in CommonJS [see here](https://nodejs.org/api/esm.html#import-statements). NodeJS assume all file with  `.js` is CommonJS  for backward compatibility. 

You can, however, tell nodeJS that your file is an ECMAScript modules by explicitly name the file with extension `.mjs`  without the need of using `package.json`:

*LIsting 3:*

```javascript
/// No package.json

/// file: dependee.mjs (ESM)
const foo = 'foo'
export { foo }

/// file: main.mjs (ESM)
import { foo } from './dependee.mjs'
console.log( foo )
```



## Interoperability with commonjs

https://nodejs.org/api/esm.html#interoperability-with-commonjs

----

With limitation, it is possible to mix ECMAScript module and CommonJS. There are two cases we have to discuss: *default export* and *named export*. Both of them are featues on ECMAScript module.

#### Default export

*Listing a1:*

```javascript
/** 
 * ESM feature: default export
 */

/// file: dependee.mjs
const fromMjs = 'mjs default export'
export default fromMjs

/// file: main.mjs
import defaultMjs from './dependee.mjs'
console.log(defaultMjs)
```

Since default export is a feature of ECMAScript module we have to **emulate ECMAScript default export from CommonJS** ([Ref](https://nodejs.org/api/esm.html#import-statements)): 

*Listing a2, ESM importing default export from CommonJS:*

```javascript
/** 
 * ESM ---> CJS default export
 */

/// file: dependee.cjs
const fromCjs = 'cjs default export'
module.exports = fromCjs

/// file: main.mjs
import defaultCjs from './dependee.cjs'
console.log(defaultCjs)
```

This emulated the ECMAScript default export of CommonJS can also be required by a CommonJS module:

*Listing a3, CommonJS requiring default export from CommonJS:*

```javascript
/** 
 * CJS ---> CJS default export
 */

/// file: dependee.cjs
const fromCjs = 'cjs default export'
module.exports = fromCjs

/// file: main.cjs
const defaultCjs = require('./dependee.cjs')
console.log(defaultCjs)
```

However, CommonJS cannot directly requiring a ECMAScript default export:

*Listing a4-error, CommonJS requiring ECMAScript default export :*

```javascript
/** 
 * CJS ---> EMS default export (ERROR)
 */

/// file: dependee.mjs
const fromMjs = 'mjs default export'
export default fromMjs

/// file: main.cjs
const defaultCjs = require('./dependee.cjs')
console.log(defaultCjs)
```

Result (error):

```
$ node main.cjs
internal/modules/cjs/loader.js:948
    throw new ERR_REQUIRE_ESM(filename);
    ^

Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: /..../dependee.mjs
```

*Listing a4-fixed, CommonJS requiring ECMAScript default export :*

```javascript
/** 
 * CJS ---> EMS default export (FIXED)
 */

/// file: dependee.mjs
const fromMjs = 'mjs default export'
export default fromMjs

/// file: main.cjs
;( async () => {
  const defaultCjs = ( await import('./dependee.mjs') ).default
  console.log(defaultCjs)
})()
```



#### Named export

Again, named export is also a feature of ECMAScript module: 

*Listing b1:*

```javascript
/** 
 * ESM feature: named export
 */

/// file: dependee.mjs (ESM)
const fromMjs = 'mjs named export'
export { fromMjs }

/// file: main.mjs (ESM)
import { fromMjs } from './dependee.mjs'
console.log( fromMjs )
```

To **emulate named export from CommonJS** we export an object:

*Listing b2, ESM emulate named export from CommonJS:*

```javascript
/** 
 * ESM ---> CJS named export
 */

/// file: dependee.cjs
const fromCjs = 'cjs named export'
module.exports = { fromCjs }

/// file: main.mjs
import { fromCjs } from './dependee.cjs'
console.log( fromCjs )
```


:warning: Be aware that the ECMAScript named import syntax above: 

```javascript
import { fromCjs } from './dependee.cjs'
```

is not the same as destructive assignament. That import statement is more accurate if we write it as follow (see:  [this](https://ponyfoo.com/articles/es6-destructuring-in-depth#special-case-import-statements) and [this](https://stackoverflow.com/questions/39376073/destructuring-assignment-within-import-statements)) :

```javascript
/// file: main.mjs
import objectFromPackage from './dependee.cjs'
const { fromCjs } = objectFromPackage
```

Since CommonJS exports an object to emulate named export, we can use destructive assignment and `require` in a stagement for the exported object:

*Listing b3, CommonJS requiring named export from CommonJS:*

```javascript
/** 
 * CJS ---> CJS named export
 */

/// file: dependee.cjs
const fromCjs = 'cjs named export'
module.exports = { fromCjs }

/// file: main.cjs
const { fromCjs } = require('./dependee.cjs')
console.log( fromCjs )
```

*Listing b4-error, CommonJS requiring named export from CommonJS:*

```javascript
/** 
 * CJS ---> ESM named export
 */

/// file: dependee.mjs
const fromMjs = 'mjs named export'
export { fromMjs }

/// file: main.cjs
const { fromCjs } = require('./dependee.mjs')
console.log( fromCjs )
```

Result (error):

```
$ node main.cjs
internal/modules/cjs/loader.js:948
    throw new ERR_REQUIRE_ESM(filename);
    ^

Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: /..../dependee.mjs
```

*Listing b4-fixed, CommonJS requiring named export from CommonJS:*

```javascript
/** 
 * CJS ---> ESM named export
 */

/// file: dependee.mjs
const fromMjs = 'mjs named export'
export { fromMjs }

/// file: main.cjs
;( async () => {
  const {fromMjs} = await import('./dependee.mjs')
  console.log( fromMjs )
})()
```



