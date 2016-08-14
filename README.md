# deploy-npm

deploy-npm will be install npm module automatically in the run-time.

## Introducion

```
deploy-npm makes to use the application without having to
enter the npm install command before running the application.
Based on the list of packages created in package.json
it will automatically run the command npm install in run-time.
(Before distribution, the developer must record the module
list using the npm install <package-name> --save command.)
```

## How to use deploy-npm?

- type command in terminal `npm install deploy-npm --save`
- and type your main js file highest `require('deploy-npm').automatic();`
- make the start callback function, and save the variable,
- and register the event listener, `require('deploy-npm').callback(startCallback);`
- If you want to more information, Check out the example code.

## How to built-in deploy-npm to my project?

- copy or download `deploy-npm.js` file in your project folder
- and just simply write it `require('./deploy-npm')` now can use it doesn't download this module.

## How to make another optional module install in run-time?

- deploy-npm support 2 automatic module check&install method.
- `require('deploy-npm').isModuleExist('module-name');`
- `require('deploy-npm').moduleInstall('module-name')`

![Showcase](http://i.imgur.com/1UcewPG.gif)

## Example

<https://github.com/HmHmmHm/deploy-npm/blob/master/example/test/app.js>
