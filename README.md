# wxstore
## 一个微信小程序状态管理工具
wxstore为类vuex的轻量级微信小程序状态管理工具
### 特点
* 类vuex，跨端开发切换方便
* 合并多次同步的setData操作
* 使用时不需要关心异步回调问题
* 支持组件页面级的集成状态管理，也可以做全局的状态管理
* 内置diff，避免出现一次设置过多数据造成数据超限错误
* 合并setData，clone，diff等操作可能增加从setData到渲染的时间
* 支持改变数组中的某一项或对象的某个属性
## 注意
* 使用时改变数组中的某一项或对象的某个属性与小程序自带setData略有差异,x.y 为非数组对象时 x.y[0] = 'xxx' x.y依然为对象；x.y 为数组时 x.y.z = 'xxx' x.y会自动转成非数组对象
## 使用
```js
import { WxStore, StorePage, StoreComponent } from "wxstore";
```
### 页面
```js
// store.js
export default {
  data: {
    name: '繁星',
    age: 1,
    height: 40,
    friends: null
  },
  actions: {
    updateUserInfo({ data, commit, payload }){
      commit('setAge')
      commit('setHeight')
    }
  },
  mutations: {
    setName({ data, setData, payload }){
      setData({ name: payload})
    },
    setAge({ data, setData, payload }){
      setData({ age: data.age + 1 })
    },
    setHeight({ data, setData, payload }) {
      let height = data.height >= 180 ? data.height : data.height + 6
      setData({ height })
    },
    addFriend({ data, setData, payload }){
      setData({ friends: (data.friends || []).concat({ name: '小白兔', age: data.age }) })
    },
    updateFriends({ data, setData, payload }){
      if (data.friends){
        data.friends = data.friends.map((item) => {
          item.age++;
          return item
        })
        setData({ friends: data.friends })
      }
    },
    resetFriendName({ data, setData, payload }) {
      const index = payload.currentTarget.dataset.index
      if (data.friends[index]) {
        let newData = {};
        let key = `friends[${index}].name[0]`
        newData[key] = '大白兔'
        setData(newData)
      }
    }
  }
}
// index.js
import store from './store.js'
import { StorePage } from './../wxstore.js'
import globalStore from './../globalStore.js'
StorePage({
  store,
  bindStores: [[globalStore, ['year']]],
  bindData: { 'Name': 'name', 'Age': 'age', 'height': 'height', 'friends':'friends'},
  mapMutations: ['addFriend','resetFriendName'],
  onLoad(){
    console.log(this,globalStore)
  },
  to() {
    wx.navigateTo({
      url: '/index/index',
    })
  },
  updateInfo(e){
    globalStore.commit('addYear', {})
    this._store.commit('updateFriends')
    this._store.dispatch('updateUserInfo', e)
  },
  changeName(e) {
    this._store.commit('setName', e.currentTarget.dataset.name)
  },
  ...globalStore.mapMutations(['setHeight'])
})
```
### 组件
```js
// component.js
import globalStore from './../../globalStore.js'
import {  StoreComponent } from './../../wxstore.js'
StoreComponent({
  bindStores: [[globalStore, { 'year': 'year'}]],
  bindData: ['name', 'age', 'height'],
  data: {},
  mapActions: ['updateUserInfo'],
  methods: {
    changeName(e) {
      this._store.commit('setName', e.currentTarget.dataset.name)
    },
  }
})

```
### 全局
```js
// globalStore
import { WxStore } from './wxstore.js'
export default new WxStore({
  data: {
    year: 2019
  },
  actions: {},
  mutations: {
    addYear({ data, setData, payload = {} }) {
      setData({ year: data.year + 1 })
    }
  }
})
```