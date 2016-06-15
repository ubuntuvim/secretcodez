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
ember g route secret
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
{{! app/tempalates/components/secret-page.hbs}}
<h1>secret page</h1>

<ul>
    {{#each model as |code|}}
    <li>
        <strong>{{code.description}}</strong>
    </li>
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
执行完`ember g server`后，在APP目录下创建一个nodejs程序，自动植入到当前项目中，访问的domain和port与ember访问域名端口一致。

打开`index.js`编辑后端请求监听。

```js
// server/index.js

const bodyParser = require('body-parser');

module.exports = function(app) {

  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/api/codes', function (req, res) {    
    // 直接返回正确状态和测试数据
      return res.status(200).send({
          codes: [
              { id:1, description: '为了测试创建一个简单的后端服务程序，使用的是Node，然后写死一些测试数据。就没必要动牛刀，创建一个数据库了！' },
              { id:2, description: '本篇博文将为你介绍如何使用service实现权限控制，我会创建一个简单的登录示例加以说明。如有不妥欢迎留言指正。' }
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
使用属性`namespace`指定URL前缀，比如请求URL为[http://localhost:4200/api/codes](http://localhost:4200/api/codes)，自动在请求上加入前缀`api`。

修改路由，获取后端数据。

```js
// app/routes/secret.js

export default Ember.Route.extend({
  model() {
    // 返回后端数据，这些数据直接从 server/index.js 获取
    return this.store.findAll('code');
  }
});
```

重新启动项目。检查项目是否有错误！如果启动没问题，那么访问[http://localhost:4200/secret](http://localhost:4200/secret)你也会得到如下截图的效果。

![效果截图1](http://blog.ddlisting.com/content/images/2016/06/16061501.png)

从截图中可以看到发送一个请求`http://localhost:4200/api/codes`，并且从这个请求中获取到服务端返回的数据。你可以直接把这个URL放到浏览器地址栏执行，可以清楚的看到返回的数据。数据的格式是普通的json格式。

目前的效果是任何人都可以访问，还没实现权限控制的效果。那么如何去实现呢？不知道你是否看过前面的文章[adapter与serializer使用示例](http://blog.ddlisting.com/2016/06/06/adapter-serializer/)，如果你看过里面有介绍过在请求头加验证信息这个小结。如果我也想这么实现控制访问API的权限如何做呢？

#### 修改服务端，加入权限校验

```js
// 拦截 /api/codes 请求
app.get('/api/codes', function(req, res) {
    //获取数据之前先校验请求者是否有权访问资源
    //  做一个非常简单的判断，如果请求的头信息不等于BLOG.DDLISTING.COM则认为无权限
    if (req.headers['authorization'] !== 'BLOG.DDLISTING.COM') {
        return res.status(403).send('您无权访问此资源！')
    }
    // 直接返回正确状态和测试数据
    return res.status(200).send({
        codes: [
            { id:1, description: '为了测试创建一个简单的后端服务程序，使用的是Node，然后写死一些测试数据。就没必要动牛刀，创建一个数据库了！' },
            { id:2, description: '本篇博文将为你介绍如何使用service实现权限控制，我会创建一个简单的登录示例加以说明。如有不妥欢迎留言指正。' }
        ]
    });
})
```
注意：_代码只列出主要部分，其他的不变。_
在代码中加入了简单的权限校验，通常`authorization`的值应该是变化的或者是每个用户都是唯一的，比如oauth2中的`access token`。当你再次访问之前的资源[http://localhost:4200/secret](http://localhost:4200/secret)可以看到，报错了，提示无权访问。如下截图：

![无权访问](http://blog.ddlisting.com/content/images/2016/06/16061502.png)

显然这样的校验是没啥意义的，那么如果你也想模拟Oauth2也生成一个唯一的`access token`，你可以请求之前首先获取一个`access token`。但是这个`access token`不是随便就能获取的，需要通过登录成功后才能获取到。下面加入模拟登录的程序。仍然是修改`server/index.js`。

```js
// 登录
app.post('/api/login', function(req, res) {
    //判断用户名和密码是否正确，这里就直接判断字符串了，实际中通常是通过查询数据去判断登录的用户是否存在
    if (req.body.username === 'blog.ddlisting.com'
      && req.body.password === 'yes') {
          res.send({ access_token: 'BLOG.DDLISTING.COM' });
      } else {
          res.status(400).send({ error: '获取token错误！' });
      }
});
```
有了后端的服务之后显然我们需要在前端增加一个登录的表单，提供用户登录并且登录成功之后还要把获取到的`access_token`保存好，在发送请求的时候设置到请求的头。这个时候就需要用到`service`了！！

### 登录

#### 登录表单

```html
{{! app/templates/login.hbs 登录}}
{{login-page}}
```

```html
{{! app/templates/components/login-page.hbs 登录表单}}

{{link-to '点击查看有权才能访问的资源' ’secret}}

<h2>登录</h2>
<p>
    默认的用户名和密码为：blog.ddlisting.com/yes
</p>

<form class="" method="post" {{action 'authenticate' on='submit'}}>
    {{input type="text" value=username placeholder='blog.ddlisting.com'}}
    {{input type="password" value=password placeholder="密码"}}
    <br>
    <button type="submit">登录</button>
</form>
```

#### 登录处理

在组件类中添加处理登录的action。

```js
// app/components/login-page.js

import Ember from 'ember';

export default Ember.Component.extend({
    authManager: Ember.inject.service(),  //注入servi'auth-manager'ce
    actions: {
        authenticate() {
            const { username, password } = this.getProperties('username', 'password');
            //调用service类中的authenticate方法校验登录的用户
            this.get('authManager').authenticate(username, password),then(() => {
                console.log('登录成功');
            }, (err) => {
                console.log('登录失败');
            });
        }
    }
});
```
在这个类中使用了`service`类，并且调用此类中的`authenticate`方法。代码中的属性`authManager`就是一个`service`实例。下面定义`service`类。

```shell
ember g service auth-manager
```

```js
// app/serivces/auth-manager.js

import Ember from 'ember';

export default Ember.Service.extend({
    accessToken: null,

    // 判断accessToken是否是空
    isAuthenticated: Ember.computed.bool('accessToken'),

    // 发起请求校验登录用户
    authenticate(username, password) {
        return Ember.$.ajax({
            method: 'post',
            url: '/api/login',
            data: { username: username, password: password }
        }).then((res) => {
            // 设置返回的access_token到service类的属性中
            this.set('accessToken', res.access_token);
        }, (err) => {
            //登录失败
        });
    },
    invalidate() {
        this.set('accessToken', null);
    }
});
```
在组件类`login-page.js`中并没有直接发请求校验用户是否登录成功，而是通过调用`serivce`类的方法去校验，目的是为了把返回的值保存到`service`的属性中，这也是利用它的特性。方法`invalidate`的目的是执行退出登录操作，把保存到`service`属性中的值置空，使得计算属性`isAuthenticated`返回`false`。

一切都定义好了下面就是如何使用这个`service`属性了！修改适配器的代码，在请求头中加入`accessToken`。

```js
// import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

// 不使用默认适配器JSONAPIAdapter，而是使用RESTAdapter
export default DS.RESTAdapter.extend({
    namespace: 'api',  //访问请求前缀： http://localhost:4200/api/codes
    // 加入请求头
    authManager: Ember.inject.service('auth-manager'),
    headers: Ember.computed('authManager.accessToken', function() {
        //动态返回accessToken的值
        return {
            'authorization': `${this.get('authManager.accessToken')}`
        };
    })
});
```

到此代码基本写完了，为了处理服务端返回的错误直接在`application`路由中拦截`error`事件，在这个事件中处理错误的情况。
**说明**：所有的子路由的`error`事件都会自动冒泡到路由`application`的`error`事件中。

```js
// app/routes/application.js
import Ember from 'ember';

export default Ember.Route.extend({
    actions: {
        // 处理所有的error事件
        error(reason, transition) {
            //如果出现错误直接转到登录界面
            this.transitionTo('login');
            return false;
        }
    }
});
```
项目重启完毕(是手动终止在启动，否则会出现service未定义的情况)之后可以看到界面直接跳转到了登录页面，实现了简单的权限拦截（无权先登录）。

![登录](http://blog.ddlisting.com/content/images/2016/06/16061503.png)

**未登录直接点击链接“点击查看有权才能访问的资源”效果**

![未登录直接点击链接“点击查看有权才能访问的资源”效果截图](http://blog.ddlisting.com/content/images/2016/06/16061504.png)

可以看到浏览器控制台打印信息显示资源无权访问，返回的代码是`403`。

输入错误的用户名或密码的情况：

![用户名密码错误](http://blog.ddlisting.com/content/images/2016/06/16061506.png)

**登录成功再访问授权资源**

![登录成功再访问授权资源](http://blog.ddlisting.com/content/images/2016/06/16061505.png)

登录成功之后再点击链接可以正常访问了，并且正确看到后端返回的数据。


即使你点击链接“点击查看有权才能访问的资源”也还是会跳转回登录页面。那么开始测试登录后的效果，在表单中输入正确的用户名和密码。点击登录后跳转到了


## 退出
有登录就会有退出，退出相对简单，只要销毁了service类中的属性`accessToken`值即可。

```html
{{! app/tempalates/components/secret-page.hbs}}
<h1>secret page</h1>

<ul>
    {{#each model as |code|}}
    <li>
        <strong>{{code.description}}</strong>
    </li>
    {{/each}}
</ul>


<br><br>

<button type="button" {{action 'invalidate'}}>退出</button>
```

```js
// app/components/secret-page.js
import Ember from 'ember';

export default Ember.Component.extend({
    //注入service
    authManager: Ember.inject.service('auth-manager'),

    actions: {
        invalidate() {
            this.get('authManager').invalidate();  //退出登录状态
            //暂时粗暴处理，直接强制刷新，重新进入application路由触发error事件，再次判断是否登录
            location.reload();
        }
    }
});
```
对于退出事件的处理就比较简单粗暴了，直接刷新页面，由于属性`authManager`的值已经设置为`null`所以发起请求的时候是无权限的会再次触发`error`事件，然后跳转到登录页面。

到这里，基本上实现了一个简单的权限控制功能。例子比较简单，但是处理的思路大体上是这样做的，能实现这样的功能是基于`service`类的特性。也希望读者能通过本例理解懂得如何使用`service`。




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
