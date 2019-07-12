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