(()=>{

Function.prototype.derivative=function(delta=0.00001,algorithm=undefined){
  return x=>{
  	d1=(this(x+delta/2)-this(x-delta/2))/delta;
  	if (algorithm=='richardson'){
	  	d2=(this(x+delta/4)-this(x-delta/4))/(delta/2);
	  	return 2*d2-d1;
	}else{
		return d1;
	}
  }
}

Function.prototype.root=function( x0, tolerance, max_iterations,algorithm='newton-raphson',derivative) { 
	let f=this(x0);
	if(Math.abs(f)<tolerance) return x0;
	if(max_iterations==0) throw("Ran out of iterations");
  
	if(derivative==undefined) {
	  var derivative=this.derivative(tolerance);
	}
	var d=derivative(x0);
	if(d==0) throw("Encountered stationary point");
	let x=x0 -f/d; 
	return this.root(x,tolerance, max_iterations-1,derivative,algorithm)
	
}

Function.prototype.inverse = function(tolerence=0.00001,max_iteration=1000,x0=0){
   return y=>(x=>this(x)-y).root(x0,tolerence,max_iteration)
}

Function.prototype.integral = function( a,b,n,algorithm="simpsons") {

	
	const h = (b - a) / n;
	let sum = this(a) + this(b);

	for (let i = 1; i < n; i++) {
	  const x = a + i * h;
	  sum += i % 2 === 0 ? 2 * this(x) : 4 * this(x);
	}

	return (h / 3) * sum;

}

})();