function fetchWithTimeout(url, options, timeout = 8000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Request timed out"));
        }, timeout);

        fetch(url, options).then(
            (response) => {
                clearTimeout(timer);
                resolve(response);
            },
            (err) => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
}

// Use fetchWithTimeout in your script
submitButton.addEventListener('click', function () {
    const orderNumber = orderInput.value;
    showLoadingScreen();

    fetchWithTimeout(`https://order-tracking-widgetsts.onrender.com/order-status?order_name=${orderNumber}`)
        .then(response => response.json())
        .then(data => {
            hideLoadingScreen();
            hideAllFrames();
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
            hideLoadingScreen();
            console.error('Error fetching order status:', error);
            alert("An error occurred while fetching the order status.");
        });
});
