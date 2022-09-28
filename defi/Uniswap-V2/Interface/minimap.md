# 小地图

> 本小结作为主题讲解补充是对 [react](https://zh-hans.reactjs.org/), [Redux](https://redux.js.org/) 相关概念的快速讲解。

## 制作小地图原因：

v2 的前端版本使用很多插件，尤其是 Redux 而本地图指南重点讲解 Redux 起什么作用，这对非前端或者没用过 react 的同学会有帮助

## 不得不说的内容

```
Redux
诞生原因：实现复杂应用的 “状态/数据” 管理
三大原则:
  1. 单一的事件源
  2. 状态(state)是只读的
  3. 使用纯函数进行更改

我们在此使用`@reduxjs/toolkit`包来获取更加便捷的体验
```

## 制作小地图原因 2：

v2 的前端用户交互事件与后端（链）是解耦的，你不会看到这样的代码
“点击触发一个事件请求后端获取数据，绑定数据”
实现解耦关键是使用了 Redux 做“数据”管理

设计思想：使用 Redux 存储数据，让数据被监听，当数据变化时请求后端，拿到结果（拿到结果必然也会修改当前数据状态），重新绑定数据绘制 UI

## 简单的 demo 代码（这代码举例 reducer 的基本套路用法，看明白这个，v2 源码中很多代码你也看懂了）

```
// 通过向configureStore配置所需的reducer来进行状态的管理
import { configureStore } from '@reduxjs/toolkit'
configureStore({
  reducer: {application},
})
```

```
// 构建存储对象(state)
import { createReducer } from '@reduxjs/toolkit'
import { createAction } from '@reduxjs/toolkit'

let storeItem = {title: ""} // 定义用作存储的数据结构, 同时初始化值

// function createAction(type, prepareAction?)
// 我们在此处传入了Action type, 返回值为一个指定类型的<{title: string}>action creator, 可以在createReducer中使用
export const updateBlockNumber = createAction<{title: string}>('application/updateBlockNumber')

export default createReducer(storeItem, builder =>
    builder.addCase(
        // 此方法会区分 Action type字段的大小写
        updateBlockNumber,
        // state 为当前的最新的状态
        // 所有action 都包含 type 和 payload:
        //  type 为我们createAction传入的值
        //  payload 为负载, 即我们期望更新的数据. 可以通过后面说的dispatch方法设置
        (state, action) => {

        const { title } = action.payload
        return {
            ...state,     //保留旧值（此处照做）
            "title":title,//返回新值（也就是我们希望的效果：修改值）
        }
    })

);
```

```
// 最基本使用案例

import { useSelector, useDispatch } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

// 新建一个store 并且设置初始值
const store = configureStore({
  reducer: {application},
})

// 获取所有的 state
store.getState()

// 修改state的值
store.dispatch(updateBlockNumber({title:"修改的其值"}))
// 或者
const dispatch = useDispatch()
dispatch(updateBlockNumber({title:"修改的其值"}))


// 使用useSelector截取state任意部分的数据 同 store.getState() 是一回事，只不过 store.getState() 是全部数据
const application = useSelector(state => state.application)
// 之后可以通过 application.title 查看当前title的值

useEffect(()=>{
    //发送变化，todo
},[某些监听,的状态,值])
```
