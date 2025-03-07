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

    function hideAllFrames() {
        const frames = document.querySelectorAll('.frame');
        frames.forEach(frame => {
            frame.classList.remove('visible');
        });
    }

    // Ensure only #frame-1 is visible at the start
    hideAllFrames();
    document.getElementById('frame-1').classList.add('visible');

    submitButton.addEventListener('click', function () {
        const orderNumber = orderInput.value;
        console.log("Order number entered:", orderNumber);

        showLoadingScreen();

        fetch(`https://order-tracking-widgetsts.onrender.com/order-status?order_name=${orderNumber}`)
            .then(response => {
                console.log("Fetch response received", response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Data received from server:", data);
                hideLoadingScreen();

                // Hide all frames including #frame-1 before showing the correct one
                hideAllFrames();

                if (data.estado === 'preparacion') {
                    document.getElementById('frame-3').classList.add('visible');
                } else if (data.estado === 'enviado') {
                    const frame = document.getElementById('frame-4');
                    frame.querySelector('p').innerHTML = `Su producto ha sido enviado. El pedido se ha enviado mediante ${data.informacion.carrier} y el número de envío es <a href="https://s.correosexpress.com/SeguimientoSinCP/search?n=${data.informacion.tracking}" target="_blank">${data.informacion.tracking}</a>.`;
                    frame.classList.add('visible');
                } else if (data.estado === 'esperando') {
                    document.getElementById('frame-5').classList.add('visible');
                } else if (data.estado === 'preventa') {
                    const frame = document.getElementById('frame-6');
                    frame.querySelector('p').innerHTML = `El producto ${data.informacion.producto} está en preventa y no se va a enviar hasta ${data.informacion.fecha}. Si quieres un pedido parcial (4,99€), escribe a <a href="mailto:tienda@thestoreteam.com">tienda@thestoreteam.com</a>.`;
                    frame.classList.add('visible');
                } else {
                    document.getElementById('frame-2').classList.add('visible');
                }
            })
            .catch(error => {
                console.error('Error fetching order status:', error);
                hideLoadingScreen();
                alert("Ha habido un error. Por favor, contacte atencion al cliente");
            });
    });
});
