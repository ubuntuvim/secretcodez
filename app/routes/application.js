// app/routes/application.js
import Ember from 'ember';

export default Ember.Route.extend({
    // authManager: Ember.inject.service('auth-manager'),
    //
    // beforeModel() {
    //     if (!this.get('authManager').get('isAuthenticated')) {
    //         //如果出现错误直接转到登录界面
    //         this.transitionTo('login');
    //         return false;
    //     }
    // },
    actions: {
        // 处理所有的error事件
        error(reason, transition) {
            //如果出现错误直接转到登录界面
            this.transitionTo('login');
            return false;
        }
    }
});
