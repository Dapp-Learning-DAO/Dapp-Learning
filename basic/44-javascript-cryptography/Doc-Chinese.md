##  JavaScript 的工作原理：密码学 + 如何应对中间人 (MITM) 攻击  
网络安全是 IT 领域的一个重要领域。每天都有来自世界各地的许多人通过互联网相互交流。当人们通过互联网进行交流时，其他人有可能在信息到达相关方之前窃听甚至劫持信息。此外，黑客可能会利用计算机网络中的漏洞窃取用户的个人数据。

那么人们如何通过互联网安全地发送信息以及 JavaScript 在其中扮演了什么角色？如果你很想知道，那么这篇文章就是为你准备的。

在本文中，您将了解什么是密码学、它在 JavaScript 中的工作原理以及它如何应对中间人攻击 (MitM)。

## 密码学导论
密码学意指保护信息和通信的过程，以便只有发送方和预期的接收方可以访问它们。密码学使用了很多技术来确保护通信过程的安全。这些技术包括基于密码的加密和解密、使用各种算法对通信过程进行Hash计算以及签名生成和验证。

由于很多移动应用在互联网上通信中使用了 JavaScript 相关技术, 因此需要了解在 JavaScript 中密码学是如何工作的。接下来的章节，我们将讨论下 JavaScript 的 Web Cryptography API 以及它如何支持加密。

## JavaScript 的 Web 加密 API
由于确保通过 Internet 进行安全通信很重要，因此一些 Web 浏览器已经实现了[crypto](https://developer.mozilla.org/en-US/docs/Web/API/Crypto)接口。但是，此接口定义不明确或密码学上不健全。JavaScript 的 Web 加密 API 提供了一个定义良好的接口，称为[SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

JavaScript 的网络加密 API 允许开发人员将基本的加密功能合并到他们的应用程序中，而无需第三方库。您可以签署文档、执行身份验证并执行通信的整体完整性检查。

例如，您可以通过运行以下代码来获取 8 位无符号整数数组的加密安全随机数据：

    const secure = window.crypto.getRandomValues(new Uint8Array(10));
    console.log(secure);

您可以在 Web 控制台上运行此代码。例如，如果我在 Chrome 的控制台上运行此代码，我将得到 10 个 8 位随机生成的无符号数字的输出。

![](https://miro.medium.com/max/598/0*QbI-hozmSVibF6DW)

我们可以看下 JavaScript 的网络加密 API 是如何工作的，以及我们如何从我们的网络控制台中实现这一点。

使用 JavaScript 的网络加密 API，服务器端是无法看到数据的，因为它是加密安全的。只有发送方和接收方可以访问通信数据。

![](https://miro.medium.com/max/700/0*EoQo41lZY6_RXAii)

从上图中，您可以看到来自发件人的数据是使用 API 加密的。接收方使用密钥解密数据，服务器和数据库无法解密加密数据。您可以做一些基本的加密操作，例如散列、签名生成和验证、加密和解密，本文将进一步讨论这些操作。

## 基本密码功能
你可以使用 JavaScript 的 Web 加密 API 执行许多加密功能。在本节中，我们将研究基本的加密函数，如散列、签名生成和验证、加密和解密。

### 加密
加密是基本的密码功能之一。在加密中，人类语言（明文）的消息通过密钥转换为计算机语言（密文）。为了让接收者理解来自发送者的消息，他们必须使用密钥。

![](https://miro.medium.com/max/576/0*g6rpKt5YynDCQ5n3)

JavaScript 的 Web 加密 API 中的加密过程使用 encrypt 方法。该encrypt方法具有以下语法：

    //Syntax for encrypt function
    const result = crypto.subtle.encrypt(algorithm, key, data);

encrypt 方法将返回以一个 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) , 其中包含“密文”的数组。如果在加密过程中发生错误，最好返回一个新的 Promise。为了更好地理解这一点，我们将使用密钥和算法加密纯文本。在您的 Web 浏览器中复制以下代码并注意输出的是加密文本。

    /*The function strToArrayBuffer converts string to fixed-length raw binary data buffer because 
    encrypt method must return a Promise that fulfills with an ArrayBuffer containing the "ciphertext"*/
    function strToArrayBuffer(str) {
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }
    //The function arrayBufferToString converts fixed-length raw binary data buffer to 16-bit unsigned String as our plaintext
    function arrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    //This object below will generate our algorithm key
    var algoKeyGen = {
        name: "AES-GCM",
        length: 256,
    };
    //This will generate random values of 8-bit unsigned integer
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    //This object will generate our encryption algorithm
    var algoEncrypt = {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
    };
    //states that key usage is for encryption
    var keyUsages = ["encrypt"];
    var plainText = "This is a secure message from Mary";
    var secretKey;
    //This generates our secret Key with key generation algorithm
    window.crypto.subtle
        .generateKey(algoKeyGen, false, keyUsages)
        .then(function (key) {
            secretKey = key;
        //Encrypt plaintext with key and algorithm converting the plaintext to ArrayBuffer
            return window.crypto.subtle.encrypt(
            algoEncrypt,
            key,
            strToArrayBuffer(plainText)
        );
    })
    .then(function (cipherText) {
    //print out Ciphertext in console
        console.log("Cipher Text: " + arrayBufferToString(cipherText));
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
    });
    
![](https://miro.medium.com/max/570/0*bIg_WMaJvjHWSc5J)


从代码来看，

    var algoKeyGen = { name: ‘AES-GCM’, length: 256};

指定了密钥，而

    var algoEncrypt = { name: ‘AES-GCM’, iv: iv, tagLength: 128};

指定了算法。函数 strToArrayBuffer 将字符串转换为二进制数组，因为Promise的ciphertext参数接受的是二进制数组。


### 解密
解密是加密的逆过程。在解密中，密文被转换回纯文本。基于此，来自授权用户的密钥是需要的。这就像试图用钥匙进入有所的房间一样。不会因为你有几把钥匙就被允许进入大楼。您被允许进入的唯一方法是钥匙是否匹配。

JavaScript 的 Web 加密 API 中的解密过程使用 decrypt 方法。下面是解密语法。

    //syntax for decrypting ciphertext
    const result = crypto.subtle.decrypt(algorithm, key, data);

因此，我们示例密文的解密语法如下所示。

    //This states that the keyusage for decrypting
    var keyUsages = ["decrypt"];
    //This object below is for algorithm key generation
    var algoKeyGen = {
        name: "AES-GCM",
        length: 256,
    };
    var plainText = "This is a secure message from Mary";
    var secretKey;
    //This will generate secrete key with algorithm key and keyusage
    window.crypto.subtle
        .generateKey(algoKeyGen, false, keyUsages)
        .then(function (key) {
            secretKey = key;
            //This will decrypt Cipheretext to plaintext
            return window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipherText);
    })
    //  Print plaintext in console.
    .then(function (plainText) {
        console.log("Plain Text: " + arrayBufferToString(plainText));
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
    });


那么，完整的加密和解密示例代码如下:

    // This code below will encrypt and decrypt plaintext

    /*The function strToArrayBuffer converts string to fixed-length raw binary data buffer because 
    encrypt method must return a Promise that fulfills with an ArrayBuffer containing the "ciphertext"*/
    function strToArrayBuffer(str) {
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
    return buf;
    }
    //The function arrayBufferToString converts fixed-length raw binary data buffer to 16-bit unsigned String as our plaintext
    function arrayBufferToString(buf) {
        return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    //This object below will generate our algorithm key
    var algoKeyGen = {
        name: "AES-GCM",
        length: 256,
    };
    //This will generate random values of 8-bit unsigned integer
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    //This object will generate our encryption algorithm
    var algoEncrypt = {
        name: "AES-GCM",
        iv: iv,
        tagLength: 128,
    };
    //states that key usage is for encrypting and decrypting
    var keyUsages = ["encrypt", "decrypt"];
    var plainText = "This is a secure message from Mary";
    var secretKey;
    //This generates our secret Key with key generation algorithm
    window.crypto.subtle
        .generateKey(algoKeyGen, false, keyUsages)
        .then(function (key) {
            secretKey = key;
            //Encrypt plaintext with key and algorithm converting the plaintext to ArrayBuffer
            return window.crypto.subtle.encrypt(
                algoEncrypt,
                key,
                strToArrayBuffer(plainText)
            );
        })
    .then(function (cipherText) {
        //This prints out the ciphertext, converting it from ArrayBuffer to 16-bit unsigned String
        console.log("Cipher Text: " + arrayBufferToString(cipherText));
        //This will decrypt ciphertext with secret key and algorithm
        return window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipherText);
    })
    //This prints out the plaintext, converting it from ArrayBuffer to 16-bit unsigned String
    .then(function (plainText) {
        console.log("Plain Text: " + arrayBufferToString(plainText));
    })
    .catch(function (err) {
        console.log("Error: " + err.message);
    });

当你运行这个程序时，它会输出之前加密的明文。

![](https://miro.medium.com/max/575/0*1QVfw-_HSz22ZtJS)

从代码来看，

    var secretKey;
    window.crypto.subtle.generateKey(algoKeyGen, false, keyUsages)
    .then(function (key) { secretKey = key;

生成一个密钥来解密消息。

加密过程大致分为对称加密和非对称加密。这种划分取决于用于解密的密钥类型。对于对称加密，加密和解密使用相同的密钥。而对于非对称加密，加密和解密使用不同的密钥对。授权用户共享的公钥用于加密，而接收者的私钥用于解密。密钥由其所有者保密。

![](https://miro.medium.com/max/567/0*Vqa1yAeYJio0RF5a)

### Hash哈希
Hash哈希是一种加密函数，它允许您将任意大小的数据映射到固定大小的数组。加密哈希函数将数据从明文转换为唯一的数字和字母串。哈希不像加密，它是一种单向函数。这意味着从哈希值中获取原始文本是困难的，几乎是不可能的。

哈希利用数学算法将纯文本转换为散列值。哈希没有像加密那样解密散列值的密钥。加密哈希函数主要用于身份验证。例如，在注册/登录中。当用户注册时，他们的密码在将它们存储在数据库中之前被哈希。每当用户尝试登录时，他们的密码都会被哈希并与数据库中的哈希值进行比较以确保它匹配。使用这种方法，如果攻击者劫持了软件公司的数据库，用户的登录详细信息对他们来说毫无用处，因为他们无法解码或理解密码。

![](https://miro.medium.com/max/547/0*oqlhISJ0TrPjoG74)

JavaScript 的 Web 加密 API 提供了 crypto.subtle.digest 允许您执行加密哈希函数的功能。使用crypto.subtle.digest function，您可以使用SHA-1,SHA-384或SHA-512算法哈希纯文本，使用以下语法。

    // Syntax for hashing plaintext
    const digest = crypto.subtle.digest(algorithm, data);

要了解如何使用 crypto.subtle.digest 函数哈希消息，让我们看一下下面的示例：

    const text = "This is a secure message from Mary";
    async function digestMessage(message) {
        const encode = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
        const hashBuffer = await crypto.subtle.digest("SHA-256", encode); // hash the message
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
        return hashHex;
    }
    const digestHex = await digestMessage(text);
    console.log(digestHex);

![](https://miro.medium.com/max/670/0*B4g8Jpu1dZOF1QMI)


在上面的示例程序中，我们使用算法对文本This is a secure message 进行了哈希处理SHA-256，并将字节转换为十六进制字符串。算法SHA-1现在易受攻击；因此，建议不要在生产模式下使用它。

### 签名生成和验证
这是你可以使用 JavaScript 的 Web Cryptography API 执行的另一个加密功能。使用sign and verify功能，您可以使用密钥签署文档。接收者使用他们的密钥来验证消息的身份验证。

假设您想将文档发送给朋友，为了使文件真实，您需要签名。收到消息的朋友看到​​签名后就会意识到这是您发送的。

要使用 sign 和 veryify 函数签署和验证文档，请使用以下语法。

    //syntax to sign document
    const signature = crypto.subtle.sign(algorithm, key, data);
    //syntax to generate document
    const result = crypto.subtle.verify(algorithm, key, signature, data);


### 密码算法
计算机没有自己的思想。因此，每当我们希望计算机执行某些任务时，我们会让他们知道如何去做。例如，如果您希望计算机执行基本计算，则必须告诉它要添加哪些数字以及如何添加。

算法是一组定义明确的计算机可实现的用于解决问题的指令。在密码学中，您需要指定您希望计算机如何执行加密功能。SHA 算法有多种风格，每种风格都指定了哈希值的位长。在本节中，我们将了解 JavaScript 的 Web Cryptography API 支持的基本加密函数。

### ECDH（椭圆曲线Diffie-Hellman）
该密码算法用于密钥生成和密钥协商。椭圆曲线 Diffie-Hellman 密钥协商协议允许拥有公私密钥对的两方进行安全通信。它用于椭圆曲线 Diffie-Hellman 密码术。

椭圆曲线 Diffie-Hellman 算法允许您执行以下操作：

* 密钥生成
* 位推导
* 密钥导入
* 密钥导出

### SHA（安全哈希算法）
该算法主要用于执行哈希函数。它将可变数据压缩为固定大小的位串输出。JavaScript 的 Web Cryptography API 允许您使用SHA-1和执行哈希函数SHA-2，支持“SHA-256”、“SHA-384”、“SHA-512”来使用此算法。您必须使用 crypto.subtle.digest功能来执行该加密过程。

### HMAC（基于哈希的消息认证码）
使用哈希函数对值进行哈希后，您需要验证传入消息是否等于哈希值。请记住，我们几乎无法将哈希值转换回其原始文本。为了比较值，该HMAC算法用于签署和验证文件以确定其真实性。使用此算法，您可以执行以下功能。
* 签名
* 验证
* 生成密钥
* 导入密钥
* 导出密钥
* 获取密钥长度

### HKDF（基于哈希的密钥派生函数）
基于哈希的密钥推导函数是一种基于HMAC的密码密钥推导函数。它使用提取然后扩展的方法。您可以使用此算法将共享机密转换为适合加密、完整性检查或身份验证的密钥。您可以使用此算法执行的操作如下：
* 位推导
* 密钥导入
* 获取密钥长度

### PBKDF2（基于密码的密钥推导函数2）
PBKDF2 算法用于派生密钥，使用基于 PKCS#5（Public Key Cryptography Standards #5）密码的密钥派生函数版本 2。就像 HKDF 函数一样，您可以执行 Bits Derivation、Key Import 和 Get Key长度与此算法。

### ECDSA（椭圆曲线数字签名算法）
椭圆曲线数字签名算法允许开发人员使用椭圆曲线加密技术签署和验证文档。它提供了数字签名算法(DSA) 的一种变体。您可以使用 ECDSA 算法执行以下操作。
* 签名
* 验证
* 生成密钥
* 导入密钥
* 导出密钥

### RSA（Rivest–Shamir–Adleman）算法
RSA 算法用于保护 Internet 上的信息。它是一种非对称密码算法。两个密钥用于加密和解密过程。一把钥匙是公开的，可以在授权用户之间共享，而第二把私有的钥匙必须保密。

Rivest–Shamir–Adleman 支持其他具有可与 RSA 算法一起使用的填充方案的算法。JavaScript 的 Web Cryptography API 支持以下 RSA 算法和填充方案。
* RSASSA-PKCS1-v1_5
* RSA-PSS
* RSA-OAEP

### AES（高级加密标准）算法
高级加密标准算法大多以其原始名称Rijndael为人所知。它用于电子数据的加密，由美国国家标准与技术研究院(NIST) 于 2001 年建立。

JavaScript 的 Web Cryptography API 支持使用 AES 块的不同加密模型，它们是：
* AES-CTR
* AES-CBC
* AES-GCM
* AES-KW

## JavaScript 的 Web 加密 API 用例
JavaScript 的 Web Cryptography API 在实时密码学中有许多应用。在本节中，我们将实时了解密码学的不同应用。

### 多重身份验证
有时，黑客可以窃取用户的密码。因此，即使这些密码在数据库中被哈希或加密，也无法阻止它们访问用户的帐户。为了确保访问帐户的人是真正的所有者，应用程序允许多因素身份验证。

与使用传输层身份验证不同，例如 TLS 客户端证书应用程序可以使用合适的客户端密钥，这些密钥可能是之前通过用户代理生成的，如多因素令牌。

### 受保护的文件交换
密码学的目标之一是在第三方存在的情况下保护互联网上的通信。因为有第三方不断监视其他人的对话，JavaScript 的 Web Cryptography API 允许您签署、验证和加密文档。保护文档需要授权用户拥有允许他们访问文档的密钥。

### 云储存
您可以在使用 JavaScript 的 Web Cryptography API 将文档上传到远程服务器之前对其进行保护。应用程序可以让用户选择私有或秘密密钥，导出加密密钥，加密文档，然后使用现有 API 将加密数据上传到服务提供商。

### 安全消息传递
用户可以使用非公开 (OTR)消息传递等方案通过 Internet 进行安全通信。参与通信的两方可以使用消息验证码 (MAC) 密钥对消息进行加密和解密，以防止篡改。

### JavaScript 对象签名和加密 (JOSE)
您可以使用 JavaScript 的 Web 加密 API 与 JavaScript 对象签名和加密 (JOSE) 工作组定义的结构和消息格式进行交互。

## 如何应对中间人攻击
中间人攻击 (MitM) 也可以称为中间人攻击或中间人攻击。这是一种网络攻击，攻击者窃听两方之间的通信，劫持或修改通信。

![](https://miro.medium.com/max/548/0*Ci-Jl1Mlki03m3A-)

例如，中间人可能会在信息到达另一方之前拦截从一方发送的信息。我们来看一个案例，两个人；南希和乔伊正在进行加密对话。

如果中间的一个人（詹姆斯）拿到了 Nancy 的密钥，他可以在将消息发送给 Joy 之前解密消息、查看或修改其内容。

![](https://miro.medium.com/max/531/0*D586dpehfQtaG2wY)

让我们来看看人们应对中间人攻击的各种方式
1. 篡改检测的使用是显示中间人攻击发生的极好方法。例如，各方可以检查响应时间的差异。
2. 使用相互认证是一种可以减轻中间人攻击的方法。因为服务器和客户端验证彼此的通信。
3. 取证分析是另一种处理中间人攻击的方法，因为它确定是否存在攻击并确定攻击的来源。

## 安全，一个大问题
每个人在通过互联网进行交流时都需要感到安全。不安全的保护不仅意味着您的通信可能会在互联网上泄露，一些攻击者甚至会从用户那里窃取、欺负用户，甚至追踪他们以造成身体伤害。

开发人员必须构建对用户来说可持续且安全的产品。当公司在构建产品时忽视用户隐私和安全会发生什么？

数据保护监管机构监管个人数据在互联网上的处理方式。例如，数据监管机构GDPR 将对侵权行为处以最高 2000 万欧元（约合 1800 万英镑）或全球年营业额 4% 的罚款（以较高者为准）。因此，公司必须采取一切必要步骤来确保用户数据始终安全。

这意味着公司还必须非常小心他们选择与之合作的第三方工具和供应商。所有组织采用的工具都必须安全并尊重隐私，这一点非常重要。这对于分析、监控、错误跟踪等大量数据摄取的产品尤其重要。


以下推荐一些相关的文章，有兴趣可以看下：
* [引擎、运行时和调用堆栈的概述](https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf?source=collection_home---2------1----------------)
* [深入谷歌 V8 引擎 + 编写优化代码的 5 个技巧](https://blog.sessionstack.com/how-javascript-works-inside-the-v8-engine-5-tips-on-how-to-write-optimized-code-ac089e62b12e?source=collection_home---2------2----------------)
* [内存管理+如何处理4种常见的内存泄漏](https://blog.sessionstack.com/how-javascript-works-memory-management-how-to-handle-4-common-memory-leaks-3f28b94cfbec?source=collection_home---2------0----------------)
* [事件循环和异步编程的兴起 + 5 种使用 async/await 更好地编码的方法](https://blog.sessionstack.com/how-javascript-works-event-loop-and-the-rise-of-async-programming-5-ways-to-better-coding-with-2f077c4438b5)
* [使用 SSE 深入研究 WebSockets 和 HTTP/2 + 如何选择正确的路径](https://blog.sessionstack.com/how-javascript-works-deep-dive-into-websockets-and-http-2-with-sse-how-to-pick-the-right-path-584e6b8e3bf7?source=collection_home---4------0----------------)
* [与 WebAssembly 的比较 + 为什么在某些情况下最好使用它而不是 JavaScript](https://blog.sessionstack.com/how-javascript-works-a-comparison-with-webassembly-why-in-certain-cases-its-better-to-use-it-d80945172d79)
* [Web Workers 的构建块 + 5 个你应该使用它们的案例](https://blog.sessionstack.com/how-javascript-works-the-building-blocks-of-web-workers-5-cases-when-you-should-use-them-a547c0757f6a)
* [Service Workers、他们的生命周期和用例](https://blog.sessionstack.com/how-javascript-works-service-workers-their-life-cycle-and-use-cases-52b19ad98b58)
* [Web 推送通知的机制](https://blog.sessionstack.com/how-javascript-works-the-mechanics-of-web-push-notifications-290176c5c55d)
* [使用 MutationObserver 跟踪 DOM 中的更改](https://blog.sessionstack.com/how-javascript-works-tracking-changes-in-the-dom-using-mutationobserver-86adc7446401)
* [渲染引擎和优化其性能的技巧](https://blog.sessionstack.com/how-javascript-works-the-rendering-engine-and-tips-to-optimize-its-performance-7b95553baeda)
* [网络层内部 + 如何优化其性能和安全性](https://blog.sessionstack.com/how-javascript-works-inside-the-networking-layer-how-to-optimize-its-performance-and-security-f71b7414d34c)
* [在 CSS 和 JS 动画的幕后 + 如何优化它们的性能](https://blog.sessionstack.com/how-javascript-works-under-the-hood-of-css-and-js-animations-how-to-optimize-their-performance-db0e79586216)
* [解析、抽象语法树 (AST) + 5 个关于如何最小化解析时间的技巧](https://blog.sessionstack.com/how-javascript-works-parsing-abstract-syntax-trees-asts-5-tips-on-how-to-minimize-parse-time-abfcf7e8a0c8)
* [类和继承的内部结构 + Babel 和 TypeScript 中的转译](https://blog.sessionstack.com/how-javascript-works-the-internals-of-classes-and-inheritance-transpiling-in-babel-and-113612cdc220)
* [存储引擎 + 如何选择合适的存储 API](https://blog.sessionstack.com/how-javascript-works-storage-engines-how-to-choose-the-proper-storage-api-da50879ef576)
* [Shadow DOM 的内部结构 + 如何构建自包含组件](https://blog.sessionstack.com/how-javascript-works-the-internals-of-shadow-dom-how-to-build-self-contained-components-244331c4de6e)
* [WebRTC 和点对点连接机制](https://blog.sessionstack.com/how-javascript-works-webrtc-and-the-mechanics-of-peer-to-peer-connectivity-87cc56c1d0ab)
* [自定义元素背后 + 构建可重用组件的最佳实践](https://blog.sessionstack.com/how-javascript-works-under-the-hood-of-custom-elements-best-practices-on-building-reusable-e118e888de0c)
* [异常 + 同步和异步代码的最佳实践](https://blog.sessionstack.com/how-javascript-works-exceptions-best-practices-for-synchronous-and-asynchronous-environments-39f66b59f012)
* [5 种类型的 XSS 攻击 + 防范技巧](https://blog.sessionstack.com/how-javascript-works-5-types-of-xss-attacks-tips-on-preventing-them-e6e28327748a)
* [CSRF 攻击 + 7 种缓解策略](https://blog.sessionstack.com/how-javascript-works-csrf-attacks-7-mitigation-strategies-757dfb08e7a6)
* [迭代器 + 获得对生成器高级控制的技巧](https://blog.sessionstack.com/how-javascript-works-iterators-tips-on-gaining-advanced-control-over-generators-41dc3eb3bc20)   

