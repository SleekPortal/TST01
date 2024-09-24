(function() {
    // Create the widget container and inject styles
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'order-tracking-widget';
    widgetContainer.style = 'text-align: center; margin-top: 20px; padding: 20px; background-color: #545454; color: white; border-radius: 10px; width: 400px; height: 400px; margin: 0 auto;';
    
    // Inject the HTML content into the widget container
    widgetContainer.innerHTML = `
        <div id="frame-1" class="frame visible" style="display: block;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/search_icon.png" alt="Search Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2 style="color: #ffffff; margin: 10px;">Busca Tu Pedido</h2>
            <div class="input-container" style="display: flex; align-items: center; margin-top: 10px;">
                <input type="text" id="orderInput" placeholder="Ej: S00055" style="padding: 10px; width: 247px; height: 40px; margin-right: 10px; border: 3px solid #ffffff; background-color: #1a1a1a; color: white; border-radius: 10px;">
                <button id="submit" style="height: 32px; background-color: #b9ff00; padding-left: 10px; padding-right: 10px; border: none; color: white; cursor: pointer;">COMPRUEBA</button>
            </div>
        </div>

        <div id="frame-2" class="frame" style="display: none;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/not_found_icon.png" alt="Not Found Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2>No encontrado</h2>
            <p><strong>No hemos encontrado ningún pedido con el nombre introducido. Por favor, verifica el número o contáctanos a <a href="mailto:tienda@thestoreteam.com">tienda@thestoreteam.com</a>.</strong></p>
        </div>

        <div id="frame-3" class="frame" style="display: none;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/in_preparation_icon.png" alt="In Preparation Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2>En Preparación</h2>
            <p><strong>Tenemos todos sus productos y su pedido será enviado en menos de 72h.</strong></p>
        </div>

        <div id="frame-4" class="frame" style="display: none;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/shipped_icon.png" alt="Shipped Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2>Enviado</h2>
            <p><strong>Su producto ha sido enviado. El pedido se ha enviado mediante {transportista} y el número de envío es {num_envio}.</strong></p>
        </div>

        <div id="frame-5" class="frame" style="display: none;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/waiting_icon.png" alt="Waiting Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2>Esperando Producto</h2>
            <p><strong>Estamos esperando la llegada de su producto.</strong></p>
        </div>

        <div id="frame-6" class="frame" style="display: none;">
            <img src="https://your-username.github.io/order-tracking-widgetSTS/assets/preorder_icon.png" alt="Preorder Icon" class="icon" style="width: 150px; margin-bottom: 10px;">
            <h2>Producto en Preventa</h2>
            <p><strong>El producto está en preventa y no se va a enviar hasta {fecha}. Si quieres un pedido parcial (4,99€), escribe a <a href="mailto:tienda@thestoreteam.com">tienda@thestoreteam.com</a>.</strong></p>
        </div>
    `;

    // Add the widget container to the document body
    document.body.appendChild(widgetContainer);

    // Handle the order tracking logic
    document.getElementById('submit').addEventListener('click', function() {
        const orderNumber = document.getElementById('orderInput').value;

        fetch(`https://order-tracking-widgetsts.onrender.com/order-status?order_name=${orderNumber}`)
            .then(response => response.json())
            .then(data => {
                hideAllFrames();
                if (data.estado === 'preparacion') {
                    document.getElementById('frame-3').style.display = 'block';
                } else if (data.estado === 'enviado') {
                    const frame4 = document.getElementById('frame-4');
                    frame4.innerHTML = `<h2>Enviado</h2><p>Su producto ha sido enviado. El pedido se ha enviado mediante ${data.informacion.carrier} y el número de envío es ${data.informacion.tracking}.</p>`;
                    frame4.style.display = 'block';
                } else if (data.estado === 'esperando') {
                    document.getElementById('frame-5').style.display = 'block';
                } else if (data.estado === 'preventa') {
                    const frame6 = document.getElementById('frame-6');
                    frame6.innerHTML = `<h2>Producto en Preventa</h2><p>El producto está en preventa y no se va a enviar hasta ${data.informacion.fecha}. Si quieres un pedido parcial (4,99€), escribe a <a href="mailto:tienda@thestoreteam.com">tienda@thestoreteam.com</a>.</p>`;
                    frame6.style.display = 'block';
                } else {
                    document.getElementById('frame-2').style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error fetching order status:', error);
            });
    });

    // Function to hide all frames
    function hideAllFrames() {
        document.querySelectorAll('.frame').forEach(frame => {
            frame.style.display = 'none';
        });
    }

})();
