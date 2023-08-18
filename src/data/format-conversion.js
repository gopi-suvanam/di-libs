/*
Array.to_dict(header=[],orient="records")
Dict.to_array(orient="records")
Array.to_csv(header=[])

*/

/*
Array.prototype.to_csv = function(header){
	if (header==undefined)
	 h="";
	else h=header.join(",")+"\n";
	
	csv=this.map(x=>x.join(",")).join("\n");
	
	return h+csv;

}



*/

(()=>{


Array.prototype.from_csv=function(csvString) {
  const re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  const re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
        
  return csvString.split("\n").map( text => {
  	// Return NULL if input string is not well formed CSV string.
        if (!re_valid.test(text)) return null;
        var a = [];                     // Initialize array to receive values.
        text.replace(re_value, // "Walk" the string using replace with callback.
            function(m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });
        // Handle special case of empty last value.
        if (/,\s*$/.test(text)) a.push('');
        
        return a.map(x=>isNaN(x)?x:parseFloat(x));
     });
}

Array.prototype.to_records = function(column_names){
	if(column_names == undefined){const shape=this.shape(); column_names=range(0,shape[1]);};
	const l=column_names.length;
	return this.map(  row=> {var r={};for(let i=0;i<l;i++) r[column_names[i]] = row[i];return r;});
}

Array.prototype.to_series = function(column_names){
	
	if(column_names == undefined){const shape=this.shape(); column_names=range(0,shape[1]);};
	const l=column_names.length;
	const tr=this.transpose();
	var series={};
	for(let i=0;i<l;i++) series[column_names[i]] = tr[i];
	return series;
}




})();