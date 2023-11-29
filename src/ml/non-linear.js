(()=>{
if(typeof ml === 'undefined') ml={};

if(typeof numeric === 'undefined') console.log("Warning: ml.GLM will not work without numeric.js library");



function multivariateLinearRegression(xValues, yValues) {
  const n = xValues.length;
  const m = xValues[0].length;
  console.log(xValues.shape());
  // Add a column of ones for the intercept term
  
  const xMeans = xValues.reduce((acc, row) => row.map((val, i) => (acc[i] || 0) + val), Array(m).fill(0)).map(val => val / n);
  const yMean = yValues.reduce((acc, val) => acc + val, 0) / n;

  // Subtract means from the data (centering)
  const centeredX = xValues.map(row => row.map((val, i) => val - xMeans[i]));
  const centeredY = yValues.map(val => val - yMean);

  // Add a column of ones for the intercept term
  
  // Compute the transpose of the augmented X matrix
  const transposedX = centeredX.transpose();

  // Compute X'X and X'y

  const xTx = transposedX.mmult(centeredX);
  const xTy = transposedX.map((row, i) => row.reduce((acc, val) => acc + val * yValues[i], 0));

  // Calculate the coefficients (beta)
  const coefficients = numeric.solve(xTx, xTy);
  const constant = yMean-numeric.dot(coefficients,xMeans);
  
  return [constant,...coefficients];
}



ml.NonLinearLS=function(activation){
	this.activation = activation;
	this.coeffs=[];
	this.vars=[];
	this.invsere_activation = this.activation.inverse();
	
	this.fit =function(X,Y,vars){
		Y_ = Y.map(this.invsere_activation);
		
		if(vars==undefined){
			this.vars=Object.keys(X[0]);
		}
		else this.vars=vars;
		
		X_=X.map(row => this.vars.map(v=>row[v]));
		
		this.coeffs = multivariateLinearRegression(X_,Y_);
	}
	
		
		
	this.predict=function(X){
		const coeffs=this.coeffs;
		const activation=this.activation;
		const vars=this.vars;
		const predict_one = function(x){			 
			let x_=[1,...vars.map(v =>x[v] )];
			return activation(numeric.dot(x_,coeffs));
		}
		
	  	return X.map(predict_one);
	}

}

})()