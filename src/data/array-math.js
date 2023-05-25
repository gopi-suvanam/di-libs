/* functions for 1D array multiplication.. will fail if the array is not array of numbers */
(()=>{
Array.prototype.mean =function(){
	var sum=this.reduce((a, b) => a + b, 0);
	return sum/this.length;
};


Array.prototype.sum =function(){
	return this.reduce((a, b) => a + b, 0);
	
};

Array.prototype.max =function(){
	return this.reduce((a, b) => Math.max(a , b), this[0]);
	
};


Array.prototype.min =function(){
	return this.reduce((a, b) => Math.min(a , b), this[0]);
	
};

Array.prototype.scale =function(type){
	if(type=='min-max'){
		min=this.min();
		max=this.max();
		
		return this.map(x => (x-min)/(max-min));
	}
	
	if(type=='returns'){

		
		return this.map(x =>x/this[0]-1);
	}
	if(type=='standardize'){
		var mean=this.mean();
		var stdev=this.stdev();
		return this.map(x =>(x-mean)/stdev);
	}
	
};

const mult=function(left,other){
	if (Array.isArray(other)) return left.map((e,i) => mult(e , other[i]));
	if (Array.isArray(left)) 
		return left.map(x=>mult(x,other));
	else 
		return left*other;
	
}

Array.prototype.mult = function(other){
	return mult(this,other);
};

const add =function(left,other){
	if (Array.isArray(other)) return left.map((e,i) => add(e , other[i]));
	if (Array.isArray(left)) 
		return left.map(x=>add(x,other));
	else 
		return left+other;
	
}

Array.prototype.add = function(other){
	return add(this,other);
	     
};

const divide =function(left,other){
	if (Array.isArray(other)) return left.map((e,i) => divide(e , other[i]));
	if (Array.isArray(left)) 
		return left.map(x=>divide(x,other));
	else 
		return left/other;
	
}

Array.prototype.divide = function(other){
	return divide(this,other);
	     
};


const subtract =function(left,other){
	if (Array.isArray(other)) return left.map((e,i) => subtract(e , other[i]));
	if (Array.isArray(left)) 
		return left.map(x=>subtract(x,other));
	else 
		return left-other;
	
}

Array.prototype.subtract = function(other){
	return subtract(this,other);
	     
};


const power =function(left,other){
	if (Array.isArray(other)) return left.map((e,i) => power(e , other[i]));
	if (Array.isArray(left)) 
		return left.map(x=>power(x,other));
	else 
		return left**other;
	
}

Array.prototype.power = function(other){
	return power(this,other);
	     
};

const exp=function(x){
	return Array.isArray(x)?x.map(exp):Math.exp(x);
}
Array.prototype.exp = function(other){
	return exp(this);
	     
};

const log=function(x){
	return Array.isArray(x)?x.map(log):Math.log(x);
}
Array.prototype.log = function(other){
	return log(this);
	     
};

const square=function(x){
	return Array.isArray(x)?x.map(square):x*x;
}
Array.prototype.square = function(other){
	return square(this);
	     
};

const sqrt=function(x){
	return Array.isArray(x)?x.map(sqrt):Math.sqrt(x);
}
Array.prototype.sqrt = function(other){
	return sqrt(this);
	     
};

Array.prototype.dot = function(other){
	return this.mult(other).sum();
};

Array.prototype.stdev =function(){
	var mean=this.mean();
	return Math.sqrt(this.map(b=> (b-mean)**2).mean());
	
};

Array.prototype.var =function(){
	var mean=this.mean();
	return this.map(b=> (b-mean)**2).mean();
	
};

Array.prototype.covar = function(other){
	
	return this.add(-this.mean()).dot(other.add(-other.mean()))/this.length;
};

Array.prototype.correl = function(other){
	return this.covar(other)/(this.stdev()*other.stdev());
};

Array.prototype.transpose = function(){
	var tr=[];
	var length=this.map(x=>x.length).max();
	for(var i =0;i<length;i++){
	    tr.push(this.map(x=>x[i]));
	    
	}
	return tr;
};


Array.prototype.shape=function(){
	return [this.length,this.map(x=>x?x.length||0:0).max()];
};




Array.prototype.hist=function(buckets){
	if(buckets==undefined) var buckets =this.length>30?30:this.length;
	var hist =[];
	var min=this.min();
	var max=this.max();
	var bucket_size=(max-min)/buckets;
	var lower=min;
	for(var i =0;i<buckets;i+=1){
		higher=lower+bucket_size;
		hist.push([lower,this.filter(x=>(x>=lower && x<=higher)).length]);
		lower=higher;
		
	}
	return hist;
}

Array.prototype.dist=function(buckets){
	if(buckets==undefined) var buckets =this.length>30?30:this.length;
	var hist =[];
	var min=this.min();
	var max=this.max();
	var bucket_size=(max-min)/buckets;
	var lower=min;
	for(var i =0;i<buckets;i+=1){
		higher=lower+bucket_size;
		hist.push([(lower+higher)/2,this.filter(x=>(x>=lower && x<=higher)).length/bucket_size/this.length]);
		lower=higher;
		
	}
	return hist;
}



Array.prototype.cummsum=function(){
	var sum=0;
	return this.map((sum => value => sum += value)(0));
}


Array.prototype.ma =function(window){

}

Grouper = function(groups,original_shape){

	this.groups=groups;

  this.shape=original_shape;
  this.agg= function(ag){
  	

		if(this.shape[1]==0) {
		  var result = { };

		  Object.keys(groups).forEach(key=> {
			result[key] = ag(groups[key]);
		  });
		  return result;
		}
		else if(this.shape[1]>0) {
		  var result = { };

		  Object.keys(groups).forEach(key=> {

			result[key] = groups[key].transpose().map(ag);
		  });
		  return result;
		}
	}
}

Array.prototype.groupby = function(by){
	if(by.length!=this.length) throw("By array and this array should have same length");
	var unique = by.filter((value, index, array) => array.indexOf(value) === index);
	var groups={};

	for(var i=0;i<by.length;i+=1){

		if(groups[by[i]] == undefined) groups[by[i]] = [];
	   groups[by[i]].push(this[i]);
	}
	var grouper = new Grouper(groups,this.shape());
	
	return grouper;
}


window.sum=x=>x.sum();
window.mean=x=>x.mean();
window.stdev=x=>x.stdev();
window.min=x=>x.min();
window.max=x=>x.max();
window.count=x=>x.length;

window.range = (start, stop, step = 1) =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);


})();