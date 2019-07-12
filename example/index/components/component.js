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
