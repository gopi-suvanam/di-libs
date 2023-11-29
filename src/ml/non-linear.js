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
  const xTy = transposedX.map(row => numeric.dot(row,centeredY));

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


ml.NonLinearEnsemble=function(activations,feature_selection_prob,sample_selection_prob,num_estimators,meta_activation){
	this.activations=activations;
	this.feature_selection_prob=feature_selection_prob;
	this.sample_selection_prob=sample_selection_prob;
	this.models=[];
	this.num_estimators=num_estimators;
	this.model_weights=[];
	this.vars=[];
	this.meta_model = null;
	this.meta_activation=meta_activation;
	
	this.fit=function(X,Y,vars){
		if (vars==undefined)
			this.vars=Object.keys(X[0]);
		else
			this.vars=vars;
		const num_samples = X.length;
		const index=range(0,num_samples);
		var errors=[];
		for(let model_no=0;model_no<num_estimators;model_no++){
			try{
				const model_activation = this.activations[Math.floor(this.activations.length * Math.random())]
				const model_vars = this.vars.filter(_=>Math.random()<this.feature_selection_prob);
				const model_samples= index.filter(_=>Math.random()<this.sample_selection_prob);
				const model_X= model_samples.map(i=>X[i]);
				const model_Y= model_samples.map(i=>Y[i]);
				var model=new ml.NonLinearLS(model_activation);
				model.fit(model_X,model_Y,model_vars);
			  let err=error.rms(model_Y,model.predict(model_X));
			  if(err>0)
				this.models.push(model);
			}catch(e){
				console.log("Failed for model_no",model_no,e);
			}
		}
		
		const meta_model_samples= index.filter(_=>Math.random()<this.sample_selection_prob);
		const meta_model_X= meta_model_samples.map(i=>X[i]);
		const meta_X = this.models.map(model=>model.predict(meta_model_X)).transpose();
		
		const meta_Y= meta_model_samples.map(i=>Y[i]);
		
			
		this.meta_model = new ml.NonLinearLS(meta_activation);
		this.meta_model.fit(meta_X,meta_Y);
		
		
	}
	this.predict=function(X){
		num_estimators=this.models.length;
		var meta_model_X = [];
		for(let model_no=0;model_no<num_estimators;model_no++){
			const Y_model = this.models[model_no].predict(X);
			meta_model_X.push(Y_model);
		}
		meta_model_X=meta_model_X.transpose();
		const Y_pred=this.meta_model.predict(meta_model_X);
		return Y_pred;
	
	}
	
	
}



})()