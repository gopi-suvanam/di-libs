(()=>{


const load_file= async function(){
     
	  const file_loader=document.createElement('input');
	  file_id= (Math.random() + 1).toString(36).substring(7);
	  file_loader.id= file_id;
	  file_loader.type="file";
	  file_loader.style.display='none';
	  document.body.appendChild(file_loader);

	await new Promise(resolve => setTimeout(resolve, 200));

	x= await new Promise(resolve => {
	 get_dom(file_id).addEventListener("change",event => {

	 const fr = new FileReader();


			 fr.onload=async function(event){
			   		content=event.target.result;
			   		get_dom(file_id).remove();
			   		resolve(content);

			 };

	   fr.readAsText( get_dom(file_id).files[0]);



	  });


		 get_dom(file_id).click();
	});
  return(x);
 
}

window.load_file=load_file;
})();
  