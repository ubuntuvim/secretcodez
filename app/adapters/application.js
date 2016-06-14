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
