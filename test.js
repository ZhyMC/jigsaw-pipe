const {Writable,Readable,finished}=require("stream");
const util=require("util");
const streamfinished=util.promisify(finished);
const {jigsaw,domainserver}=require("jigsaw.js")("127.0.0.1","127.0.0.1");
const {JPool,JPipe}=require("./index");

const fs=require("fs");

let domserver=domainserver();

let jg=new jigsaw("test");

async function start(){
	let readpool=new JPool(jg,"recv");


	readpool.on("pipe",(pp)=>{

		pp.once("done",()=>{
			pp.setRes(pp.getData());
		})
		pp.resume();
			
	});

	for(let i=0;i<100;i++){
		let stream=fs.createReadStream("test.data",{highWaterMark:10240});

		let pipew=new JPipe(jg,"test:recv",{abc:123});


		pipew.on("error",(err)=>{
			console.error("error",err)
		});
		stream.pipe(pipew);
		try{
			await streamfinished(pipew);
			console.log(pipew.getRes())
		}catch(err){
			console.error(err);
		}
	}
	console.log(jg.producer.ports);

	jg.close();
	domserver.kill();

}
jg.once("ready",()=>{
	start();
})
