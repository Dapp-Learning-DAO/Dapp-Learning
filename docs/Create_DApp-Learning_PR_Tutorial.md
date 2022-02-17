# 提交 DApp-Learning PR 教程

此为文字教程，视频教程可转[提交PR视频教程](https://www.bilibili.com/video/BV1Bq4y1r7dx?spm_id_from=333.999.0.0)

### 0. 打开项目github 

https://github.com/rebase-network/Dapp-Learning

### 1. 点击右上角 Fork

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr0rmvpfj313j0u00wr.jpg)

Fork完之后可以发现我们的仓库中也存在一份相同昵称的项目：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr1mymj9j30wx0u0juy.jpg)

### 2. 接着我们可以把我们fork之后的仓库，拉到本地上

我们打开终端切到桌面，然后执行命令：

>>> git clone https://github.com/BNineCoding/Dapp-Learning.git

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr4kz43fj30y20cojtg.jpg)

注：其中 `BNineCoding` 是我自己github的username，你可以clone你自己fork后的项目链接

clone 完成后，我们可以在桌面上找到 DApp-Learning 的文件：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr569dt9j306205gwee.jpg)

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr68kf6sj312i0m2dic.jpg)

接下来我们可以对clone下来的项目进行修改。

### 3. 修改项目内容

修改 clone 的项目内容有很多IDE可以使用，这里建议大家使用 `Visual Studio Code`。

下载完 `Visual Studio Code` 后，我们使用 `Visual Studio Code` 打开我们桌面上的 `DApp-Learning`文件夹：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmraya1xrj30zb0n2q7k.jpg)

我们简单修改一下 README.md 下的内容，比如添加一个句号: "。"

然后我们在终端执行 `git status` ，可以发现 `README.md` 文件发生了变更：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrtrlrs4j30ve0d0aby.jpg)

接下来我们要将我们的修改提交到远端。

### 4. 提交云端修改

首先将我们的修改保存到本地缓存仓库中，执行命令:

>>> git add .

接着我们为我们的修改生成一个提交记录（commit），执行命令：

>>> git commit -m "update README"

然后我们将修改推送到远端，执行命令：

>>> git push 

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrw7ignpj30wk0myn1b.jpg)

如此一来我们的修改便成功提交到远端。

### 5. 提供PR将修改提交到主项目中

打开github上我们fork的项目，点击 Pull requests，然后点击 New pull request：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrzcq9j7j31is0ld40j.jpg)

界面会展示我修改过的内容：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrzsxonlj31i30rddji.jpg)

然后我们点击 Create pull request，即可提交PR到主项目中。

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwms212sigj316t0u0tc8.jpg)

如此一来我们便成功提交了PR：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwms2oku1xj31cc0u0wic.jpg)

可能有小伙伴想到了长久之后的工作会产生两个疑问：

- 1. 我fork的项目如何保持和原项目同步呢？（诉求：要merge原项目的代码到自己fork分支下）
- 2. 我想用原项目直接覆盖我fork的仓库，怎么做呢

这里也顺便解答一下。

### 6. fork的仓库如何去merge原项目代码

Github 网站提供了便捷的同步方式，你可以直接点击 `Fetch upstream`，即可将上游原项目最细代码同步到自己fork的项目下：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsazlm35j31fp0fj0uv.jpg)

不过我建议还是使用 git 命令操作，会更加便捷，git 上的术语为：给fork配置远程库

首先我们查看当前 fork项目 的远程库信息，执行命令：

>>> git remote -v

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsdu1bypj30sk03imxs.jpg)

可以发现当前目录下都是我们自己的链接，并没有上游原项目的链接。

接着我们确定一个将被同步给 fork 远程的上游仓库，执行命令：

>>>  git remote add upstream https://github.com/rebase-network/Dapp-Learning.git

执行完毕后我们再次查看远程库信息，执行命令：

>>> git remote -v

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsf730zaj318s0b2dix.jpg)

可以发现我们的远程库已经配置成功了，接下来我们要去拉取上游原项目的代码变更，执行指令：

>>> git fetch upstream

接下来我们要在自己的本地分支上，去rebase上游原项目的代码，执行指令：

>>> git rebase upstream/main

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmspglal6j30zo0b0go1.jpg)

注：网上有很多是直接merge命令，merge命令会重新生成一个commit节点，等到你提交PR时你merge的记录也会被带上去，所以不建议使用merge。

可以发现我们这里已经是最新的代码了，所以显示`not something we can merge`。

如果有了新的变动，merge完毕后我们推送到自己仓库的远端即可，执行指令:

>>> git push origin master

如果想让上游原项目直接覆盖本地fork的项目，可以执行命令:

>>> git reset upstream/main --hard

然后进行强行推送即可，执行命令:

>>> git push --force

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsqsco4fj31120n843j.jpg)
