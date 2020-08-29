const {Writable,Readable,finished}=require("stream");
const assert=require("assert");
const EventEmitter=require("events").EventEmitter;
const Q=require("q");

class JigsawPipeReadable extends Readable{
	constructor(jg,sessionid,sessdata){
		super();
	
		this.event=new EventEmitter();

		assert(jg,"param 1 must be a Jigsaw instance");
		this.jg=jg;
		this.portname=`__PipePoolR_${sessionid}`;
		this.deadtick=JigsawPipeReadable._getExpired();
		this.timer;
		this.state="close";
		this.sessdata=sessdata;
		this.response={};

		this.close_defer=Q.defer();
		this.start();
	}
	static _getExpired(){
		return 10;//在不进行feed后10s后会话过期
	}
	getData(){
		return this.sessdata || {};
	}
	getResponse(){
		return this.response;
	}
	setRes(res){
		this.response=res;
	}
	getCloseDefer(){
		return this.close_defer.promise;
	}
	start(){
		assert(this.state=="close","at this state, can not do start");
		this.once("end",()=>{
			this.close();
		});

		this.jg.port(this.portname,this._handlePipeData.bind(this));
		this.timer=setInterval(()=>{
			if(this.deadtick--<0){
				this.event.emit("timeout");
				this.close();
			}
		},1000);

		this.state="started";
		this.event.emit("started");
	}
	close(){
		if(this.state!="started")
			return;

		this.destroy();
		clearInterval(this.timer);
		delete this.jg.producer.ports[this.portname];

		this.state="dead";
		this.event.emit("dead");

		this.emit("done");
		this.close_defer.resolve(this.response);
	}
	feed(){
		this.deadtick=JigsawPipeReadable._getExpired();
	}
	_read(size){

	}
	_handlePipeData(data){
		if(this.state!="started")
			return;

		this.feed();
		this.push(data);
		if(data==null)
			this.close();
		
	}
}

module.exports=JigsawPipeReadable;