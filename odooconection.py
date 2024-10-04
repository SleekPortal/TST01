from flask import Flask, jsonify, request
import os
from flask_cors import CORS
import xmlrpc.client

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Odoo Connection Setup
url = 'https://test-company47.odoo.com'
db = 'test-company47'
username = 'lazypau@protonmail.com'
password = 'mainadmin'

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

    # Sort products by name
    Sorted_list = sorted(Product_list, key=lambda d: d['name'])

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
