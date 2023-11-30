(()=>{

activation = {};
activation.linear = (x=>x);
activation.linear.inverse = ()=>(x=>x);

activation.softstep = (x=> //1/(1+e^(-x))
			  x>0?
			  1/(1+Math.exp(-x)):
			  Math.exp(x)/(1+Math.exp(x))
			  );
activation.softstep.inverse = ()=>(p=>-Math.log((1-p)/p));
 

activation.softplus = (x=> x>0?   //log(1+e^(x))
	   		Math.log(1+Math.exp(-x))+x:
	   		Math.log(1+Math.exp(x))
					  
			);
activation.softplus.inverse =()=>(y=>Math.log(1-Math.exp(-y)) + y )



const k=1;
activation.softlog = (x=>
		Math.log(activation.softplus(x)+k)-Math.log(activation.softplus(-x)+k)
		);
		




})();