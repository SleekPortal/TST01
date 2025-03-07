// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {

    const submitButton = document.getElementById('submit');
    const orderInput = document.getElementById('orderInput');
    const loadingScreen = document.getElementById('loading-screen');

    

    function showLoadingScreen() {
        console.log("Showing loading screen...");
        loadingScreen.classList.add('visible');
    }
    

    function hideLoadingScreen() {
        console.log("Hiding loading screen...");
        loadingScreen.classList.remove('visible');
    }

    // Ensure the loading screen is hidden initially
    hideLoadingScreen();

    // Add event listener to the submit button
    submitButton.addEventListener('click', function () {
        const orderNumber = orderInput.value;
        console.log("Order number entered:", orderNumber);

        // Show the loading screen when the button is clicked
        showLoadingScreen();

        // Fetch the order status from the backend
        fetch(`https://order-tracking-widgetsts.onrender.com/order-status?order_name=${orderNumber}`)
            .then(response => {
                console.log("Fetch response received", response);

                // Check if the response is ok (HTTP status code 200-299)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Data received from server:", data);
                hideLoadingScreen(); // Hide loading screen after data is fetched

                // Hide all frames first
                hideAllFrames();
                console.log("Log",data.informacion);
                // Show the appropriate frame based on the data
                if (data.estado === 'preparacion') {
                    document.getElementById('frame-3').classList.add('visible')
                } else if (data.estado === 'enviado') {
                    const frame = document.getElementById('frame-4');
                    frame.querySelector('p').innerHTML = `Su producto ha sido enviado. El pedido se ha enviado mediante ${data.informacion.carrier} y el número de envío es <a href= "https://s.correosexpress.com/SeguimientoSinCP/search?n=${data.informacion.tracking}" target="_blank"> ${data.informacion.tracking}</a>.`;
                    frame.classList.add('visible');
                } else if (data.estado === 'esperando') {
                    document.getElementById('frame-5').classList.add('visible');
                } else if (data.estado === 'preventa') {
                    const frame = document.getElementById('frame-6');
                    frame.querySelector('p').innerHTML = `El producto ${data.informacion.producto} está en preventa y no se va a enviar hasta ${data.informacion.fecha}. Si quieres un pedido parcial (4,99€), escribe a <a href="mailto:tienda@thestoreteam.com">tienda@thestoreteam.com`;
                    frame.classList.add('visible');
                } else {
                    document.getElementById('frame-2').classList.add('visible');
                }
            })
            .catch(error => {
                console.error('Error fetching order status:', error);
                hideLoadingScreen();  // Hide the loading screen if there's an error
                alert("Ha habido un error. Por favor, contacte atencion al cliente");
            });
    });

    // Function to hide all frames
    function hideAllFrames() {
        const frames = document.querySelectorAll('.frame');
        frames.forEach(frame => {
            frame.classList.remove('visible');
        });
    }
});
