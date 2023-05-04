/* 
single random_nromal var
array of random normal var
*/
(()=>{
if(random==undefined) 
	var random ={};
random.normal=function(mu,sigma){
	let z=Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
	return z*sigma+mu;
}

random.choice=function(choices){
	return choices[Math.floor( choices.length* Math.random())];
}

random.uniform=function(minimum,maximum){
	return Math.random()*(maximum-minimum)+minimum;
}
	
random.lognormal=function(mu,sigma){
	return Math.exp(random.normal(mu,sigma))
}
	
random.oned={};


random.oned.normal=function(length,mu,sigma){
	return Array.from({length: length}, 
		()=>random.normal(mu,sigma)
	  )
}

random.oned.uniform=function(length,minimum,maximum){
	return Array.from({length: length}, 
		()=>Math.random()*(maximum-minimum)+minimum
	  )
}
random.oned.lognormal=function(length,mu,sigma){
	return Array.from({length: length}, 
		()=>Math.exp(random.normal(mu,sigma))
	  )
}

random.oned.choice=function(length,choices){
	l=choices.length;

	return Array.from({length: length}, 
		()=>choices[Math.floor( l* Math.random())]
	  )
}

random.twod={};
random.twod.normal=function(length,width,mu,sigma){
	return Array.from({length: length}, 
		()=>random.oned.normal(width,mu,sigma)
	  )
}

random.twod.uniform=function(length,width,minimum,maximum){
	return Array.from({length: length}, 
		()=>random.oned.uniform(width,minimum,maximum)
	  )
}
random.twod.lognormal=function(length,mu,sigma){
	return Array.from({length: length}, 
		()=>random.oned.lognormal(width,mu,sigma)
	  )
}

random.twod.choice=function(length,width,choices){


	return Array.from({length: length}, 
		()=>random.twod.choice(width,choices)
	  )
}


if(window!=undefined)
	window.random=random;



})();