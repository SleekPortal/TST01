// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {

    const submitButton = document.getElementById('submit');
    const orderInput = document.getElementById('orderInput');
    const loadingScreen = document.getElementById('loading-screen');

    // Show loading screen
    function showLoadingScreen() {
        console.log("Showing loading screen...");
        document.getElementById('loading-screen').style.visibility = 'visible';
        console.log("Loading screen is now visible");
    }

    // Hide loading screen
    function hideLoadingScreen() {
        console.log("Hiding loading screen...");
        document.getElementById('loading-screen').style.visibility = 'hidden';
        console.log("Hidden class added to loading screen");
        console.log("Current loading screen classes:", loadingScreen.classList);
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
        fetch(`https://your-backend-url/order-status?order_name=${orderNumber}`)
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

                // Show the appropriate frame based on the data
                if (data.estado === 'preparacion') {
                    document.getElementById('frame-3').classList.add('visible');
                } else if (data.estado === 'enviado') {
                    const frame = document.getElementById('frame-4');
                    frame.querySelector('p').innerHTML = `Su producto ha sido enviado. El pedido se ha enviado mediante ${data.informacion.carrier} y el número de envío es <a>${data.informacion.tracking}</a>.`;
                    frame.classList.add('visible');
                } else if (data.estado === 'esperando') {
                    document.getElementById('frame-5').classList.add('visible');
                } else if (data.estado === 'preventa') {
                    document.getElementById('frame-6').classList.add('visible');
                } else {
                    document.getElementById('frame-2').classList.add('visible');
                }
            })
            .catch(error => {
                console.error('Error fetching order status:', error);
                hideLoadingScreen();  // Hide the loading screen if there's an error
                alert("An error occurred while fetching the order status.");
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
