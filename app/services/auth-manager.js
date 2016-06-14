// app/serivces/auth-manager.js

import Ember from 'ember';

export default Ember.Service.extend({
    accessToken: null,

    // 判断accessToken是否是空
    isAuthenticated: Ember.computed.bool('accessToken'),

    // 发起请求校验登录用户
    authenticate: function(username, password) {
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
