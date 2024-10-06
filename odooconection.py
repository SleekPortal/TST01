from flask import Flask, jsonify, request
import os
from flask_cors import CORS
import xmlrpc.client
from datetime import datetime, date

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://lazypau.github.io"}})

# Fetch Odoo credentials from environment variables
url = os.environ.get('ODOO_URL')
db = os.environ.get('ODOO_DB')
username = os.environ.get('ODOO_USERNAME')
password = os.environ.get('ODOO_PASSWORD')

# Ensure environment variables are available
if not url or not db or not username or not password:
    raise ValueError("Missing Odoo environment variables. Please set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD.")

# Connect to Odoo via XML-RPC
common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
common.version()
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))

# Check read access on res.partner
models.execute_kw(db, uid, password, 'res.partner', 'check_access_rights', ['read'], {'raise_exception': False})

@app.route('/')
def home():
    return "Hello, the server is live!"

@app.route('/order-status', methods=['GET'])
def get_order_status():
    # Get the order name from the request
    order_name = request.args.get('order_name')

    # Fetch the status of the order from Odoo
    RawStatus = models.execute_kw(db, uid, password, 'stock.picking', 'search_read',
                                  [[['origin', '=', order_name]]],
                                  {'fields': ['state']})

    # Fetch the products of the order from Odoo
    Product_list = models.execute_kw(db, uid, password, 'sale.order.line', 'search_read',
                                     [[['order_id', '=', order_name]]],
                                     {'fields': ['product_id', 'name', 'product_uom_qty']})

    # Create a list to store product information along with their edition date
    Product_with_date = []

    # Loop through each product in the order
    for product in Product_list:
        product_id = product['product_id'][0]  # Get the product's ID from 'product_id'
        
        # Fetch the 'tec_fecha_edicion' field from 'product.template' for each product
        product_template_data = models.execute_kw(db, uid, password, 'product.template', 'search_read',
                                                  [[['id', '=', product_id]]],
                                                  {'fields': ['tec_fecha_edicion']})
        
        # Debugging print statements to check the values from Odoo
        print("Product Template Data:", product_template_data, flush=True)
        
        # If product template data exists and has a date, convert it to a datetime object
        if product_template_data and product_template_data[0].get('tec_fecha_edicion'):
            tec_fecha_edicion_str = product_template_data[0]['tec_fecha_edicion']
            tec_fecha_edicion = datetime.strptime(tec_fecha_edicion_str, '%Y-%m-%d').date()  # Adjust this if format is different
        else:
            tec_fecha_edicion = None  # Handle missing date case
        
        # Add the product with the parsed date (or None) to the list
        product['tec_fecha_edicion'] = tec_fecha_edicion
        Product_with_date.append(product)

    # Find the product with the latest 'tec_fecha_edicion', ignoring None dates
    latest_product = max((p for p in Product_with_date if p['tec_fecha_edicion']), 
                         key=lambda d: d['tec_fecha_edicion'], default=None)

    print("Latest Product:", latest_product, flush=True)


    # Compare the latest 'tec_fecha_edicion' with today's date
    if latest_product and latest_product['tec_fecha_edicion'] > date.today():
        preventa = True
    else:
        preventa = False
    
    print("L",preventa, flush=True)
    # Debugging today's date and the type of tec_fecha_edicion
    print("Today's date:", date.today(), flush=True)
    print("Type of today's date:", type(date.today()), flush=True)
    print("Latest Product tec_fecha_edicion:", latest_product['tec_fecha_edicion'], flush=True)
    print("Type of tec_fecha_edicion:", type(latest_product['tec_fecha_edicion']), flush=True)


    # Determine the delivery status and prepare the response
    if RawStatus:
        DeliveryStatus = RawStatus[0]['state']
        if DeliveryStatus == 'assigned':
            estado = 'preparacion'
            informacion = {}
        elif DeliveryStatus == 'done':
            estado = 'enviado'
            ShippingInfo = models.execute_kw(db, uid, password, 'stock.picking', 'search_read',
                                             [[['origin', '=', order_name]]],
                                             {'fields': ['carrier_id', 'carrier_tracking_ref']})
            if ShippingInfo:
                informacion = {'carrier': ShippingInfo[0]['carrier_id'][1], 'tracking': ShippingInfo[0]['carrier_tracking_ref']}
            else:
                informacion = {}
        else:
            if preventa:
                estado = 'preventa'
                informacion = {'producto': latest_product['name'], 'fecha': latest_product['tec_fecha_edicion']}
            else:
                estado = 'esperando'
                informacion = {}
    else:
        estado = 'not_found'
        informacion = {}

    return jsonify({'estado': estado, 'informacion': informacion})

# Run the Flask server
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))  # Render provides the port as an environment variable
    app.run(host='0.0.0.0', port=port)
