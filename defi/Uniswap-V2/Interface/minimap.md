# 小地图
>本小结作为主题讲解补充是对react相关概念的快速讲解。

## 制作小地图原因：
v2的前端版本使用很多插件，尤其是reducer 而本地图指南重点讲解reducer起什么作用，这对非前端或者没用过react的同学会有帮助

## 不得不说的内容
~~~
reducer
诞生原因：实现复杂应用的 ”状态/数据“ 管理
程序设计目标特点：state只读，只能使用纯函数修改，注意用词”纯函数“
~~~

## 制作小地图原因2：
v2的前端用户交互事件与后端（链）是解耦的，你不会看到这样的代码
”点击触发一个事件请求后端获取数据，绑定数据“
实现解耦关键是使用了reducer做”数据“管理  

设计思想：使用reducer存储数据，让数据被监听，当数据变化时请求后端，拿到结果（拿到结果必然也会修改当前数据状态），重新绑定数据绘制UI

## 简单的demo代码（这代码举例reducer的基本套路用法，看明白这个，v2源码中很多代码你也看懂了）
~~~
//构建存储对象(state)
import { createReducer } from '@reduxjs/toolkit'
import { createAction } from '@reduxjs/toolkit'

let storeItem = {title:""} //存储数据结构

export const updateBlockNumber = createAction<{ title: string}>('application/updateBlockNumber')

export default createReducer(storeItem, builder =>
    
    builder.addCase( //此方法会区分 Action type字段的大小写
        updateBlockNumber,
         (state, action) => { //所有action 都包含 type 和 payload
        //存储状态
        const { title } = action.payload
        return {
            ...state,     //保留旧值（此处照做）
            "title":title,//返回新值（也就是我们希望的效果：修改值）
        }
    })

);
~~~

~~~
//最基本使用案例

import { useSelector } from 'react-redux'

//新建一个store 并且设置初始值
let store = createStore(createReducer,{title:"初始值"});
//获取state
store.getState()
//修改state的值 
store.dispatch(updateBlockNumber({title:"修改的其值"}))

  //使用useSelector截取state任意部分的数据 同 store.getState() 是一回事，只不过 store.getState() 是全部数据
 const post = useSelector(state =>
    state.posts.find(post => post.id === postId)
  )

useEffect(()=>{
    //发送变化，todo
},[某些监听,的状态,值])
~~~



