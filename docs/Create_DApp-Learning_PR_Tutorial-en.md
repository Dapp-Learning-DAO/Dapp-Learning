# Create DApp-Learning PR Tutorial

This is a text tutorial, video tutorial can be transferred[Create PR Video Tutorial](https://www.bilibili.com/video/BV1Bq4y1r7dx?spm_id_from=333.999.0.0)

### 0. Open github project

https://github.com/Dapp-Learning-DAO/Dapp-Learning

### 1. Click on the top right Fork

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr0rmvpfj313j0u00wr.jpg)

After the Fork, you can find that there is a project with the same nickname in our warehouse:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr1mymj9j30wx0u0juy.jpg)

### 2. Then we can pull the warehouse after our fork onto the local

We open the terminal and cut to the desktop, then execute the command:

>>> git clone https://github.com/BNineCoding/Dapp-Learning.git

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr4kz43fj30y20cojtg.jpg)

Note: where 'BNineCoding' is my own Github username, you can clone your own fork after the project link

After clone is completed, we can find the file of dapp-Learning on the desktop:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr569dt9j306205gwee.jpg)

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmr68kf6sj312i0m2dic.jpg)

Next, we can modify the clone project.

### 3. Modify project content

There are many ides available to modify the Clone project content, so we recommend using 'Visual Studio Code'.

After downloading 'Visual Studio Code', we use 'Visual Studio Code' to open the 'dapp-Learning' folder on our desktop:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmraya1xrj30zb0n2q7k.jpg)

Let's make a few simple changes to readme. md, such as adding a period: ".

Then we can run command `git status` on terminal，find `README.md` file had changed：

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrtrlrs4j30ve0d0aby.jpg)

Next we will commit our changes to the remote end.

### 4. Submitting remote Changes

To first save our changes to the local cache repository, run the following command:

>>> git add .

Next we generate a commit record for our changes, executing the command:

>>> git commit -m "update README"

We then push the changes to the remote, executing the command:

>>> git push 

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrw7ignpj30wk0myn1b.jpg)

This way our changes are successfully committed to the remote end.

### 5. Provide PR to commit changes to the main project

Open our forked project on Github, click Pull Requests, and then click New Pull Request:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrzcq9j7j31is0ld40j.jpg)

The screen shows what I changed:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmrzsxonlj31i30rddji.jpg)

Then click Create Pull Request to submit the PR to the main project.

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwms212sigj316t0u0tc8.jpg)

So we successfully submitted the PR:

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwms2oku1xj31cc0u0wic.jpg)

You may have two questions when you think about the long work ahead:

- 1. How do I keep my fork project synchronized with the original project? (Request: Merge original project code into own fork)
- 2. I want to directly cover my fork's warehouse with the original project. How do I do that

Here is also the answer.

### 6. How does the fork repository merge the original project code

Github provides a convenient way to synchronize the finest code from the original upstream project to your fork by clicking on 'Fetch Upstream' :

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsazlm35j31fp0fj0uv.jpg)

However, I recommend using the git command, which is more convenient. The git term is: configure remote libraries for fork

First we look at the remote library information for the current fork project, execute:

>>> git remote -v

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsdu1bypj30sk03imxs.jpg)

It can be found that the current directory is all our own links, and there is no link of the original project upstream.

We then identify an upstream repository that will be synchronized to the fork remote and execute the command:

>>>  git remote add upstream https://github.com/Dapp-Learning-DAO/Dapp-Learning.git

After executing, we check the remote library information again and execute the command:

>>> git remote -v

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsf730zaj318s0b2dix.jpg)

We can see that our remote library has been configured successfully. Next we need to pull the upstream original project code changes and execute the command:

>>> git fetch upstream

Next we need to upstream the original project code from rebase on our local branch and execute the command:

>>> git rebase upstream/main

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmspglal6j30zo0b0go1.jpg)

Note: Merge commands are not recommended because they create a new COMMIT node. When you commit PR, merge records will also be taken up.

You can see that we already have the latest code here, so it says' not something we can merge '.

If there is a new change, we can push it to the remote end of our warehouse after the merge is completed, and execute the command:

>>> git push origin master

If you want the upstream original project to overwrite the local fork's project directly, you can execute the command:

>>> git reset upstream/main --hard

Then forcibly push, execute command:

>>> git push --force

![](https://tva1.sinaimg.cn/large/008i3skNgy1gwmsqsco4fj31120n843j.jpg)
