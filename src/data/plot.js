// Take dataframe as dataframejs or 2D array or X and Y as arrays
// Following plots:
// pie(X,Y, layout). 
// bar(labels,[Ys],layout)
// line([{x:,y:}],layout)
// scatter([{x:,y:}],layout)
//. Returns html.

(()=>{

Array.prototype.plot = function(type,dom,params){
  if(params == undefined) params ={};
  if(dom==undefined) var dom = curr_cell();
  if(type==undefined) var type='line';
  if(typeof(dom)=='string') dom = document.getElementById(dom);
  
  new_div=document.createElement("div");
  new_div.id='plot_'+(Math.random() + 1).toString(36).substring(7);
  
  dom.appendChild(new_div);
  
 
  
  if(type=='line' || type=='bar' ){
  	var name=params['name'] || String(params['names']);
  	var shape=this.shape();
  	if(shape[1]==2 && shape[0]>2) return this.transpose().plot(type,dom,params);
  	if(shape[1]>1 && shape[0]>1)
		var data=this.map(ln=>({y:ln,'type':type,name:name}));
	else
		var data=[{"y":this,type:type,name:name}];
	
	Plotly.newPlot(new_div, data,params['layout']);
	
  }
  if(type=='pie' ){
   
  	var name=params['name'] || String(params['names']);
  	var shape=this.shape();

  	if(shape[1]==2 && shape[0]>2) return this.transpose().plot(type,dom,params);
  
  
  	if(shape[1]>1 && shape[0]>1)
		var data=[{"values":this[1],lables:this[0],type:type,name:name}];
	else
		var data=[{"values":this,type:type,name:name}];
  
	test=Plotly.newPlot(new_div, data,params['layout']);
  }
  if(type=='multi-line' || type=='multi-bar'){
  
  	var data=[];
  	
  	var names=params['names'] || [];
  	
	
  	this.forEach(l=>{
  		var shape=l.shape();
  		if(shape[0]>1 && shape[1]>1)
  		 	data.push({"y":l[1],x:l[0],type:type.replace("multi-",""),name:names.shift()});
  		else
  		 	data.push({"y":l[1],x:l[0],type:type.replace("multi-",""),name:names.shift()});
		
	});
	Plotly.newPlot(new_div, data,params['layout']);

  }
  if(type=='scatter'){
  	var shape=this.shape();
  	if(shape[1]==2 && shape[0]>2) return this.transpose().plot(type,dom,params);
  	if(shape[0]<=1 || shape[1] <= 1) throw("Need two arrays for scatter");
    	var name=params['name'] || String(params['names']);
	var data=[{y:this[1],x:this[0],type:type,name:name}];
	
	Plotly.newPlot(new_div, data,params['layout']);
  
  }
  if(type=='multi-scatter'){
    	var data=[];

  	var names=params['names'] || [];  	
	
  	this.forEach(l=>{
  		if(names!=undefined && names.length>0)
			data.push({y:l[1],x:l[0],type:'scatter',name:names.shift()});
		else
			data.push({y:l[1],x:l[0],type:'scatter'});
	});
	Plotly.newPlot(new_div, data,params['layout']);
  
  }
  if(type=='contour'){
  	var shape=this.shape();
  	if(shape[1]==3 && shape[0]>3) return this.transpose().plot(type,dom,params);
  	if(shape[0] != 3) throw("Need three arrays for contour");
    	var name=params['name'] || String(params['names']) || "Contour";
	var data=[{y:this[1],x:this[0],z:this[2],type:type,name:name}];
	
	Plotly.newPlot(new_div, data,params['layout']);
  
  }
  new_div.classList.add('di-plot');
  return new_div.id;  
}


Array.prototype.to_html = function(columns,index){
	var thead="";
	var tbody="<tbody>";
	var shape=this.shape();
	if(shape[1]==0) throw("Not a 2d Array");
	if(columns!=undefined && columns.length==shape[1]) 
	  thead="<thead><tr><th></th>"+columns.map(x=>"<th>"+x+"</th>").join("")+"</tr></thead>"
	if(index==undefined) var index=this.map(row=>"<th>"+"</th>");
	else {
		if(index.length!=shape[0]) throw("Index is not same length as the data");
		else index=index.map(idx=>"<th>"+idx+"</th>");
	}
	this.forEach(row=>{
		tbody+="<tr>"+index.shift()+row.map(val=>"<td>"+val+"</td>").join("")+"</tr>"
	});
	tbody+="</tbody>";
	return "<table class='di-table'>"+thead+tbody+"</table>";
	
}



})();



