# Secretcodez

使用service实现登录、权限控制

官网对于登录、用户权限的介绍只有一段简单的说明，并没有详细说明如何使用service实现权限控制。下面地址是官网的说法：

[https://guides.emberjs.com/v2.6.0/applications/services/](https://guides.emberjs.com/v2.6.0/applications/services/)


> An Ember.Service is a long-lived Ember object that can be made available in different parts of your application.

> Services are useful for features that require shared state or persistent connections. Example uses of services might include:

> 1. User/session authentication.
> 2. Geolocation.
> 3. WebSockets.
> 4. Server-sent events or notifications.
> 5. Server-backed API calls that may not fit Ember Data.
> 6. Third-party APIs.
> 7. Logging.


`service`是啥东西呢？简单讲`service`也是一个`Ember.Object`只不过这个对象与普通的对象有点不一样。首先这种对象是放在文件夹`appName/app/services`目录下。其次放在这个目录下的对象Ember会自动注册（`registered`）或者注入（`injection`）到Ember项目中。这种对象有如下2个特点

1. 对象声明周期是session级别的
2. 在Ember项目的任何地方都可以调用

正是基于这两个特性才能实现权限的控制。最简单的例子就是用户的登录问题。目前也有现成的插件实现权限的控制，请看[使用ember-simple-auth实现Ember.js应用的权限控制](http://blog.ddlisting.com/2015/11/20/ember-application-authority-control/)所描述的方法，但是如果要根据自己项目需要去实现权限控制那么又如何做呢？


本篇博文将为你介绍如何使用`service`实现权限控制，我会创建一个简单的登录示例加以说明。如有不妥欢迎留言指正。

## 构建项目

```shell
ember new secretcodez
cd secretcodez
ember s
```
验证项目是否创建成功[http://localhost:4200](http://localhost:4200)。看到**Welcome to Ember**说明项创建成功。下面创建演示所需文件。

### 创建文件

```shell
ember g route secret --path '/'
ember g route login
ember g route application

ember g component secret-page
ember g component login-page

ember g model code description:string

ember g adapter application
```
项目演示用到的文件基本就这些。

## secret页面

```html
{{! app/templates/secret.hbs }}
{{secret-page model=model}}
```

```html
{{! app/templates/components/secret-page.hbs }}

<h1>OMG DA CODEZ!!</h1>

<ul>
{{#each model as |code|}}
  <li><strong>{{code.description}}</strong></li>
{{/each}}
</ul>
```

## 后端服务

为了测试创建一个简单的后端服务程序，使用的是Node，然后写死一些测试数据。就没必要动牛刀，创建一个数据库了！

```shell
ember g server
npm install
npm install body-parser --save-dev
```

打开`index.js`编辑后端请求监听。

```js
// server/index.js

const bodyParser = require('body-parser');

module.exports = function(app) {

  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/api/codes', function (req, res) {    
    return res.status(200).send({
      codes: [
        { id: 1, description: 'Obama Nuclear Missile Launching Code is: lovedronesandthensa' },
        { id: 2, description: 'Putin Nuclear Missile Launching Code is: invasioncoolashuntingshirtless' }
      ]
    });
  });

};
```

既然用到自己的后端服务那么对应的你就需要自定义适配器了。简单起见就创建`RESTAdapter`适配器吧。`JSONAPIAdapter`适配器相对麻烦点，需要格式化数据为[json api](http://jsonapi.org)。

```js
// app/adapters/application.js

export default DS.RESTAdapter.extend({
  namespace: 'api'
});
```

修改路由，获取后端数据。

```js
// app/routes/secret.js

export default Ember.Route.extend({
  model() {
    return this.store.findAll('code');
  }
});
```

重新启动项目。检查项目是否有错误！






## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* `git clone <repository-url>` this repository
* change into the new directory
* `npm install`
* `bower install`

## Running / Development

* `ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

