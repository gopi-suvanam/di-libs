(()=>{

Function.prototype.derivative = function(x) {
  const delta = this.derivative.delta || 0.0001;
  const algorithm = this.derivative.algorithm || 'simple'; // default to simple

  let d1 = (this(x + delta / 2) - this(x - delta / 2)) / delta;

  if (algorithm === 'richardson') {
    let d2 = (this(x + delta / 4) - this(x - delta / 4)) / (delta / 2);
    return 2 * d2 - d1;
  } else {
    return d1;
  }
};


Function.prototype.root = function(x0, tolerance = 1e-5, max_iterations = 100, algorithm = 'newton-raphson', derivative = undefined) {
	  if (typeof x0 !== 'number' || typeof tolerance !== 'number' || typeof max_iterations !== 'number') {
	    throw new Error('Invalid input type');
	  }
	
	  let x = x0;
	  let f = this(x);
	  let iterations = 0;
	
	  if (derivative == undefined) {
	    this.derivative.tolerance = tolerance;
	    derivative = this.derivative(tolerance);
	  }
	
	  while (Math.abs(f) >= tolerance && iterations < max_iterations) {
	    let d = derivative(x);
	    if (d == 0) throw new Error("Encountered stationary point");
	    x = x - f / d;
	    f = this(x);
	    iterations++;
	  }
	
	  if (iterations == max_iterations) throw new Error("Ran out of iterations");
	  return x;
};

Function.prototype.inverse = function(y, x0 = 0) { 
  const tolerance = this.inverse.tolerance || 0.0001; 
  const max_iteration = this.inverse.max_iteration || 1000; 
  const self=this;
  const differenceFunction = function(x) {return self(x) - y};
  const derivative = differenceFunction.derivative.bind(differenceFunction);
  return differenceFunction.root(x0, tolerance, max_iteration,'newton-raphson',derivative); 
};

Function.prototype.integral = function( a,b) {

	const n=this.integral.n || 100;
	const method = this.integral.method || 'simpsons';
	const h = (b - a) / n;
	let sum = this(a) + this(b);
        if(method=='simpsons'){
		for (let i = 1; i < n; i++) {
		  const x = a + i * h;
		  sum += i % 2 === 0 ? 2 * this(x) : 4 * this(x);
		}
	
		return (h / 3) * sum;
	}else{
		sum=0;
		for (let i = 1; i < n; i++) {
		  const x = a + i * h;
		  sum += this(x)*h;
		}
		return sum;
	}

}

})();
