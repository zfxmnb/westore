# wxstore
## 一个微信小程序状态管理工具
wxstore为类vuex的轻量级微信小程序状态管理工具
### 特点
* 类vuex，使用mutations、actions概念，跨端开发切换方便
* 合并多次同步的setData操作
* 使用时不需要关心异步回调问题
* 支持组件页面级的状态管理，也可绑定多个全局的状态管理器
* 内置diff，避免出现一次设置过多数据造成数据超限错误、以及不必要的状态更新，diff可独立于状态管理器使用
* 对于复杂对象数据有较大的性能提升
* 支持改变数组中的某一项或对象的某个属性
## 注意
* 使用时改变数组中的某一项或对象的某个属性与小程序自带setData略有差异,x.y 为非数组对象时 x.y[0] = 'xxx' x.y依然为对象；x.y 为数组时 x.y.z = 'xxx' x.y会自动转成非数组对象
* 正式版前可能任然存在问题，请谨慎使用
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
    setName({ data, setData, payload }) {
      setData({ name: payload})
    },
    setAge({ data, setData, payload }) {
      setData({ age: data.age + 1 })
    },
    setHeight({ data, setData, payload }) {
      let height = data.height >= 180 ? data.height : data.height + 6
      setData({ height })
    },
    addFriend({ data, setData, payload }) {
      setData({ friends: (data.friends || []).concat({ name: '小白兔', age: data.age }) })
    },
    updateFriends({ data, setData, payload }) {
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
        let key = `friends[${index}].name`
        newData[key] = '大白兔'
        setData(newData)
      }
    }
  }
}
// index.js
import store from './store.js'
import {
  StorePage,
  diff,
  clone
} from './../wxstore.js'
import globalStore from './../globalStore.js'
StorePage({
  data: {
    list: [{'index': 1}]
  },
  store,
  bindStores: [
    [globalStore, ['year']]
  ],
  bindData: [{
    'Name': 'name',
    'Age': 'age',
  }, 'friends', 'height'],
  mapMutations: ['addFriend', 'resetFriendName'],
  to() {
    wx.navigateTo({
      url: '/index/index',
    })
  },
  updateInfo(e) {
    globalStore.dispatch('addYear', {})
    this._store.commit('updateFriends')
    this._store.dispatch('updateUserInfo', e)
    const newData = ({ list: clone(this.data.list).concat([{ 'index': 1 }])})
    newData.list = newData.list.map((item) => {
      return {index: '1'}
    })
    const diffData = diff(this.data, newData)
    console.log(diffData)
    this.setData(diffData)
  },
  changeName(e) {
    this._store.commit('setName', e.currentTarget.dataset.name)
  },
  ...globalStore.mapActions(['addYear', { 'nextYear':'addYear'}])
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
    }
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