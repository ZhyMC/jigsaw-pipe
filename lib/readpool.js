const {Writable,Readable,finished}=require("stream");
const EventEmitter=require("events").EventEmitter;
const assert=require("assert");
const JigsawPipeReadable=require("./pipereadable");

class FullSessionError extends Error{constructor(p){super(p)}}
class ExistsSessionError extends Error{constructor(p){super(p)}}

class JigsawReadPool extends EventEmitter{
	constructor(jg,portname){
		super();

		assert(jg,"param 1 must be a Jigsaw instance");
		this.portname=portname;
		this.jg=jg;
		this.sessions={};
		this.jg.port(this.portname,this._pipeData.bind(this));
	}
	_createNewSession(sid,sessdata){
		if(this.sessions[sid])
			throw new ExistsSessionError("session exists");

		if(Object.keys(this.sessions).length>10)
			throw new FullSessionError("full of sessions,can not get a new session");

		let sess=new JigsawPipeReadable(this.jg,sid,sessdata);
		sess.event.once("dead",()=>{
			delete this.sessions[sid];
		});
		this.sessions[sid]=sess;

	}
	_getSession(sid,sessdata){
		try{

			this._createNewSession(sid,sessdata);

			this.emit("pipe",this.sessions[sid]);
			return this.sessions[sid];		
		}catch(err){
			if(err instanceof ExistsSessionError)
				return this.sessions[sid];
			else
				throw err;
			
		}
	
	}

	async _pipeData({sid,sessdata,data,end}){
		let sess=this._getSession(sid,sessdata);

		if(end){
			sess._handlePipeData(null);
			
			let res=await sess.getCloseDefer();
			return {ok:true,res}
		}else
			sess._handlePipeData(Buffer.from(data,"base64"));	

		return {ok:true};		
	}
}

module.exports=JigsawReadPool;
