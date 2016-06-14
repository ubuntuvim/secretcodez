// app/components/login-page.js

import Ember from 'ember';

export default Ember.Component.extend({
    authManager: Ember.inject.service('auth-manager'),  //注入service
    actions: {
        authenticate() {
            const { username, password } = this.getProperties('username', 'password');
            //调用service类中的authenticate方法校验登录的用户
            this.get('authManager').authenticate(username, password).then(() => {
                console.log('登录成功');
            }, (err) => {
                console.log('登录失败');
            });
        }
    }
});
