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