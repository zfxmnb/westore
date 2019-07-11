const app = getApp()
import store from './store.js'
import { StorePage } from './../wxstore.js'
import globalStore from './../globalStore.js'
StorePage({
  store,
  bindStores: [[globalStore, ['year']]],
  bindData: { 'Name': 'name', 'Age': 'age', 'height': 'height', 'friends':'friends'},
  mapMutations: ['addFriend','resetFriendName'],
  onLoad() {
    console.log(this.parent)
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
