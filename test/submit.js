function submitForm() {
    console.log("Submit form");
    
    const logResponse = (response) => {
        console.log(response);
    };

    fetch('https://peddiecs.peddie.org:5630/')
        .then(response => response.text())
        .then(logResponse)
        .catch(error => console.error(error));
}