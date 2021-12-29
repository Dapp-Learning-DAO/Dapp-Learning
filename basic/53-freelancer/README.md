## FreeLancer 介绍

合约旨在为自由职业者提供一个付费机制, 根据项目的进度及完成情况, 项目方能阶段性进行付费, 从而避免拖欠款项或是项目进度无法保证的情况, 为双方建立一个互利共赢的付费机制.  
下面将在实操过程中详细介绍合约逻辑.

## 项目流程及函数接口说明

- 启动项目  
  将合约部署到测试网络上, 代表启动一个项目. 如下我们看到 constructor 接口中会把 projectState 初始化为 ProjectState.initiated.

```ts
constructor();
{
  freelancerAddress = payable(msg.sender);
  projectState = ProjectState.initiated;
}
```

- 开发者增加第一个任务  
  项目启动后, 开发者会把项目拆解为多个 task, 这样可以阶段性的得到 payments, 而不用担心项目方跑路, 最后没有得到任何的 payment.
  这里开发者调用 addSchedule , 表示增加第一个任务, 如 'addSchedule("DSP","Design Phase", 1250000000000000000)', 之后开发者还可以增加后续的 task, 全部 task 增加完成后, 开发者就可以发送合约给项目方, 使项目方进行操作.

```ts
function addSchedule(string memory _shortCode, string memory _description, uint256 _value)
        public
        inProjectState(ProjectState.initiated)
        onlyFreelancer
    {
        schedule memory s;
        s.shortCode = _shortCode;
        s.description = _description;
        s.scheduleState = ScheduleState.planned;
        s.value = _value;
        scheduleRegister[totalSchedules] = s;
        totalSchedules++;
        emit scheduleAdded(_shortCode);
    }
```

- 项目方承认项目启动  
  项目方接收到开发者发过来的合约后, 调用 acceptProject 接口表示承认项目启动

```ts
function acceptProject()
        public
        inProjectState(ProjectState.initiated)
    {
        clientAddress = msg.sender;
        projectState = ProjectState.accepted;
        emit projectAccepted(msg.sender);
    }
```

- 项目方为任务存入资金  
  项目方不必为所有任务存入所有资金, 只需要依次为任务存入资金即可. 比如项目方只为任务 1 存入资金 "fundTask(0)"

```ts
function fundTask(int256 _scheduleID)
        public
        payable
        inProjectState(ProjectState.accepted)
        inScheduleState(_scheduleID, ScheduleState.planned)
        ampleFunding(_scheduleID, msg.value)
        onlyClient
    {
        scheduleRegister[_scheduleID].scheduleState = ScheduleState.funded;
        emit taskFunded(_scheduleID);
    }
```

- 开发者启动任务  
  项目方在对应任务存入资金后, 开发者可以启动对应的任务 "startTask(0)" , 完成任务后发送给项目方, 让项目方认可任务完成

```ts
    function startTask(int256 _scheduleID)
        public
        inProjectState(ProjectState.accepted)
        inScheduleState(_scheduleID, ScheduleState.funded)
        onlyFreelancer
    {
        scheduleRegister[_scheduleID].scheduleState = ScheduleState.started;
        emit taskStarted(_scheduleID);
    }
```

- 项目方承认任务完成  
  开发者完成相应的任务后, 发送给项目方, 项目方调用 approveTask 接口认可任务完成 , 比如 "approveTask(0)"

```ts
function approveTask(int256 _scheduleID)
        public
        inProjectState(ProjectState.accepted)
        inScheduleState(_scheduleID, ScheduleState.started)
        onlyClient
    {
        scheduleRegister[_scheduleID].scheduleState = ScheduleState.approved;
        emit taskApproved(_scheduleID);
    }
```

- 开发者获取 payments
  项目方认可任务完成后, 开发者就可以先调用 getBalance 接口查看合约中是否存入了对应的资金, 之后可以调用 "releaseFunds" 获取任务对应的 payments, 比如 "releaseFunds(0)"

```ts
function releaseFunds(int256 _scheduleID)
        public
        payable
        inProjectState(ProjectState.accepted)
        inScheduleState(_scheduleID, ScheduleState.approved)
        onlyFreelancer
    {
        freelancerAddress.transfer(scheduleRegister[_scheduleID].value);
        scheduleRegister[_scheduleID].scheduleState = ScheduleState.released;
        emit fundsReleased(_scheduleID, scheduleRegister[_scheduleID].value);
    }
```

- 结束项目
  当开发者完成所有的 task 后, 项目就可以结束了, 这个时候, 项目方或是开发者都可以调用 endProject 接口结束项目

```ts
function endProject()
        public
        bothClientFreelancer
        noMoreFunds
    {
        projectState = ProjectState.closed;
        emit projectEnded();
    }

```

## 测试流程

- 安装依赖

```bash
yarn
```

- 执行测试文件

```bash
npx hardhat test
```
