const {Writable,Readable,finished}=require("stream");
const assert=require("assert");
const EventEmitter=require("events").EventEmitter;

class JigsawPipe extends Writable{
	constructor(jg,path,data){
		super();

		assert(jg,"param 1 must be a Jigsaw instance");
		assert(typeof(path)=="string","target 'path' must specified.");
		assert(jg.state=="ready","jigsaw must be ready state");

		this.event=new EventEmitter();
		this.jg=jg;
		this.path=path;
		this.data=data || {};
		this.sessionid=Math.random()+"";
		this.response={};
		this.firstSend=true;
	}
	_write(data,encoding,cb){
		try{
			assert(encoding=="buffer","chunk must be a buffer or can not pipe into");
			//assert(data.length<=10240,"chunk length < 10240B");			
			this._send(data,cb);
		}catch(err){
			cb(err);
		}
	}
	async _send(chunk,callback){
		let req=Math.random();

		try{

			let extra={};
			if(this.firstSend)
				extra={sessdata:this.data};


			let ret=await this.jg.send(this.path,{sid:this.sessionid,data:chunk.toString("base64"),end:false,...extra});

			if(ret && ret.ok==true){


				this.firstSend=false;
				callback(null);
			}else{

				this.firstSend=false;
				callback(new Error("pipe chunk failed"));
			}

		}catch(err){
	
			this.firstSend=false;
			callback(new Error("pipe chunk failed"+JSON.stringify(err)));
		}

	}
	getRes(){
		return this.response;
	}
	_final(cb){

		this.jg.send(this.path,{sid:this.sessionid,data:"",end:true,sessdata:this.data}).then((ret)=>{
			if(ret && ret.ok==true){
				this.response=ret.res;
				cb(null);
			}else{
				cb(new Error("finish pipe failed"+JSON.stringify(ret)));
			}
		}).catch((err)=>{
				cb(new Error("finish pipe failed"+JSON.stringify(err)));
		});


	}

}

module.exports=JigsawPipe;
