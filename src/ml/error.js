(()=>{

if(typeof di=== 'undefined') di={};

let error={};

error.rms = (Y_,Y) =>
	Math.sqrt(Y_.subtract(Y).map(x=>x**2).mean());


di.error=error;
})();