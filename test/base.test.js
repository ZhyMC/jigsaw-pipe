const {jigsaw,domainserver}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
const {JPool,JPipe}=require("../index");
const {PassThrough,finished}=require("stream");
const util=require("util");
const streamfinished=util.promisify(finished);

let domserver;
let jg;

describe("基础测试",function(){

	before((done)=>{
		domserver=new domainserver();
		jg=new jigsaw("tester");
		jg.once("ready",()=>{
			done();
		})
	});

	it("开启10个不发送数据闲置的JPipe,之后JPool会自动关闭这些流",function(done){
			this.timeout(20000);

			let pool=new JPool(jg,"upload");
			let count=0;

			pool.on("pipe",(c)=>{
				c.once("done",(cb)=>{
					
					if(++count==10)
						done();
					cb();
				})
				c.resume();
		
			});

			for(let i=0;i<10;i++){
				let p=new JPipe(jg,"tester:upload");
				p.write(Buffer.allocUnsafe(1024));

			}
		
	})

	it("连续完成传输10000次,内存几乎没有增加",function(done){
		this.timeout(20000);

		let jg=new jigsaw("test");

		jg.once("ready",()=>{
				let pool=new JPool(jg,"upload");
				let count=0;

				pool.on("pipe",(c)=>{
					c.once("done",(cb)=>{
						c.setRes(c.getData());
						//console.log(++count);
						cb();
					})
					c.resume();
			

				});
				let buf=Buffer.allocUnsafe(10240);
				(async function(){
					let lastUsage=0;
					for(let i=0;i<10000;i++){
						//console.log(i);
						let j=new JPipe(jg,"test:upload",{abc:123});
						
						let p=new PassThrough();
						p.pipe(j);
						p.end(buf);

						if(i==1000){
							lastUsage=process.memoryUsage();

						}
						await streamfinished(j);
					}
					await jg.close();

					setTimeout(()=>{
						let Usage=process.memoryUsage();

						let heapused=Usage.heapUsed-lastUsage.heapUsed;
						let exused=Usage.external-lastUsage.external;


						if(heapused<1024*1024*10 && exused<1024*1024*10)
							done();
						else
							done(new Error("可能内存泄露,"+heapused+","+exused));

					},5000);


				})();

		});

		
	});



	after(()=>{
		jg.close();
		domserver.kill();
	})
});
