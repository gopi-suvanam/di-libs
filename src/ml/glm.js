(()=>{

if(typeof ml === 'undefined') ml={};

if(typeof numeric === 'undefined') console.log("Warning: ml.GLM will not work without numeric.js library");

ml.GLM=function(activation,error){
	this.activation = activation;
	this.error=error;
	this.coeffs=[];
	this.vars=[];
	this.c=0;
	this.a=0;
	this.b=1;
	this.training_error=0;
	this.fit =function(X,Y,vars){
		if(vars==undefined){
			this.vars=Object.keys(X[0]);
		}
		else this.vars=vars;
		err= params=>{
		  let new_params = JSON.parse(JSON.stringify(params));
			var model_params={};
			model_params["b"]=new_params.pop();
			model_params["a"]=new_params.pop();
			model_params["c"]=new_params.pop();
			model_params['coeffs']=new_params;
		  	const Y__=this.predict(X,model_params);
		
			return this.error(Y__,Y);
		}
		
		const coeffs0=this.vars.map(()=>0).concat([0,0,1]);
		const solution=numeric.uncmin(err,coeffs0);
		var best_coeffs=solution['solution'];
		this.b=best_coeffs.pop();
		this.a=best_coeffs.pop();
		this.c=best_coeffs.pop();
		this.coeffs=best_coeffs;
		this.training_error=solution['f'];
	}
	
		
		
	this.predict=function(X,model_params){
		if (model_params==undefined) {
			 var coeffs=this.coeffs;
			 var c=this.c;
			 var a=this.a;
			 var b=this.b;
		}else{
			 var coeffs=model_params['coeffs'];
			 var c=model_params['c'];
			 var a=model_params['a'];
			 var b=model_params['b'];
		}
		const activation=this.activation;
		const vars=this.vars;
		const predict_one = function(x){
			 
			
			let y=vars.map((v,idx) =>
				coeffs[idx]*x[v] ).sum()+c;
			return b*activation(y)+a;
		}
		
	  	return X.map(predict_one);
	}

}

ml.GLMEnsemble=function(activations,error,feature_selection_prob,sample_selection_prob,num_estimators,meta_activation){
	this.activations=activations;
	this.error=error;
	this.feature_selection_prob=feature_selection_prob;
	this.sample_selection_prob=sample_selection_prob;
	this.models=[];
	this.num_estimators=num_estimators;
	this.model_weights=[];
	this.vars=[];
	this.activation = activation.identity; //not being used currently
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
				var model=new ml.GLM(model_activation,this.error);
				model.fit(model_X,model_Y,model_vars);
				console.log("trained model number:",model_no);
				this.models.push(model);
				errors.push(model.training_error);
			}catch(e){
				console.log("Failed for model_no",model_no,e);
			}
		}
		
		const meta_model_samples= index.filter(_=>Math.random()<this.sample_selection_prob);
		const meta_model_X= meta_model_samples.map(i=>X[i]);
		const meta_X = this.models.map(model=>model.predict(meta_model_X)).transpose();
		
		const meta_Y= meta_model_samples.map(i=>Y[i]);
		
			
		this.meta_model = new ml.GLM(meta_activation,error);
		this.meta_model.fit(meta_X,meta_Y);
		
		errors=errors.map(x=>Math.exp(-x));
		
		this.model_weights=errors.divide(errors.sum());
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

})();