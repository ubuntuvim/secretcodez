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
