// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {

  const submitButton = document.getElementById('submit');
  const orderInput = document.getElementById('orderInput');

  // Add event listener to the submit button
  submitButton.addEventListener('click', function () {
      // Get the order number from the input field
      const orderNumber = orderInput.value;

      // Fetch the order status from the backend (Flask server)
      fetch(`https://order-tracking-widgetsts.onrender.com/order-status?order_name=${orderNumber}`)
          .then(response => response.json())
          .then(data => {
              // Hide all frames first
              hideAllFrames();

              // Determine which frame to show based on the "estado"
              if (data.estado === 'preparacion') {
                  document.getElementById('frame-3').classList.add('visible');
              } else if (data.estado === 'enviado') {
                  const frame = document.getElementById('frame-4');
                  // Update only the paragraph content
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
          });
  });

  // Hide all frames
  function hideAllFrames() {
      const frames = document.querySelectorAll('.frame');
      frames.forEach(frame => {
          frame.classList.remove('visible');
      });
  }

});
