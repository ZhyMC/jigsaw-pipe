## Jigsaw-Pipe 文档

### 1.1 简介
  
Jigsaw-Pipe是一个Jigsaw.js的附加组件，    
提供直接向Jigsaw接口发送以流的形式传输二进制数据的功能。    
   
### 1.2 安装
   
在项目下运行如下命令   
> npm install jigsaw-pipe  

即可安装     
   
请注意，```jigsaw-pipe```依赖```jigsaw.js```   
    
### 1.3 性能
    
通过本通道可以继承jigsaw.js可靠的消息传输功能，   
经测试，Jigsaw-Pipe 最大单线程带宽达到160Mbps以上，满足大多数二进制传输需求。    
   
   
### 2.1 用法及实例
   
#### 2.1.1 简单例子
   
   
recver.js   
```
const {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
const {JPool}=require("jigsaw-pipe");
const fs=require("fs");

let jg=new jigsaw("disk");

let pool=new JPool(jg,"upload");
pool.on("pipe",(conn)=>{
	let {filename}=conn.getData();
	conn.pipe(fs.createWriteStream(filename));
});
```
   
sender.js
```
const {jigsaw}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
const {JPipe}=require("jigsaw-pipe");
const fs=require("fs");

let jg=new jigsaw();

let pipe=new JPipe(jg,"disk:upload",{filename:"test.jpg"});
pipe.on("error",console.error);

let s=fs.createReadStream("test.jpg",{highWaterMark:10240});

s.pipe(pipe);
```
    
该例子演示了如何将```sender.js```目录下的```test.jpg```文件,   
发送到```recver.js```目录下     
   
   
### 3.1 API文档
   
#### 3.1.1 JPipe.prototype.constructor(jg,path,data)
   
此为JPipe的构造函数，其中jg参数要求传入一个jigsaw实例,用于传输数据,可以是一个匿名jigsaw。   
path代表目的地的路径，例如```recver:onData```    
data是一个对象,可以传输附加的数据,在JPool中可以通过pipe.getData()接收到该数据.       
     
   
JPipe继承于Node.js的Stream.Writable，所以本流是一个可写流。以new JPipe()创建本流后，请将流pipe于本流。   
请注意，若要将一个流Pipe至本流，那么highWaterMark属性数值不能超过10240，否则会触发一个被Error事件捕捉的异常。   
   
Pipe方法可以将流以管道的形式直接连接另一个流，并且自动管理流之间的数据流动，在数据流动完毕后会自动销毁，详细用法请参照Node.js的stream文档。   
   
   
#### 3.1.2 JPipe.prototype.getRes()
   
该方法返回一个来自JPool的回复信息，如果要取得回复，必须发生在JPipe的finish事件之后。   
    
例如:    
   
```
let j=new JPipe();
j.pipe(remote);

j.on("finish",()=>{
	console.log(j.getRes());
});

```
   
   
#### 3.1.3 事件 Error  
   
若在管道传输数据的过程中发生了错误，则会触发该事件。请务必监听该事件，否则异常发生后Node.js会终止进程。   
    
#### 3.2.1 JPool.prototype.constructor(jg,portname)
   
此为JPool的构造函数，JPool用于容纳并维护多个可读流的存在，如果创建了一个JPipe并指向本JPool，那么本Pool会开始管理这个数据流管道。   
   
jg代表要接收数据的jigsaw实例，该实例一般是有名字的jigsaw实例。  
portname代表要使用jigsaw实例的哪个portname作为接收数据的jigsaw接口，该接口不能是一个已经存在的接口。   
   
该类的一个典型实例是创建一个能接收文件的jigsaw接口。    
   
#### 3.2.2 事件 pipe   
   
```
let pool=new JPool();
pool.on("pipe",(conn)=>{

	conn.pipe(xxxxx);

	conn.getData(); //这是构造JPipe时的第三个参数的值	
	conn.on("done",(callback)=>{
		callback({msg:"ok"});//可以回复JPipe
	})
});
```
   
该事件会携带一个参数，这个参数代表了一个与JPipe的连接，并且是一个标准可读流，可以直接pipe至另一个可写流上。     
   
该流拥有一个事件done，可以调用回调函数进行回复信息。   
     
你也可以不回复信息，也可以不发送信息，可读流和可写流之间的数据仍然会自动传输。    
   
注意该连接是一次性的，在传输完数据后会自动销毁。   


#### 3.3.1 conn 的 done 事件 done(callback)

该事件会传递一个回调函数 callback 作为参数,若你监听了该事件，请务必调用一次callback用来回复数据。
   
   