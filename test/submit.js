function submitForm(){
            
    if(window.jQuery){

        $.get("https://peddiecs.peddie.org/nodejs/",{
            email:$('#email').val(),
            password:$('#password').val()
        },function(res){
            
            if(res.message=="success"){
                console.log("success");
            }else{
                if(res.message){
                    alert(res.message);
                }
                console.log('got the message');
            }
        
        });
        
    }
}