import store from './store.js'
import {
  StorePage,
  clone
} from './../wxstore.js'
import diff from '../utils/diff'
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
    
    let newData = clone(this.data)
    newData.list.concat([{ 'index': 1 }])
    newData.list = newData.list.map((item) => {
      return {index: '2'}
    })
    newData.test = 10000
    const diffData = diff(newData, this.data)
    console.log(newData, this.data, diffData)
    this.setData(diffData)
  },
  changeName(e) {
    this._store.commit('setName', e.currentTarget.dataset.name)
  },
  ...globalStore.mapActions(['addYear', { 'nextYear':'addYear'}])
})