from flask import Flask, jsonify, request
import os
from flask_cors import CORS
import xmlrpc.client
from datetime import datetime, date
import re

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://sleekportal.github.io"}})

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

# Function to remove numbers inside square brackets from product name
def clean_product_name(product_name):
    # Remove anything inside square brackets including the brackets
    cleaned_name = re.sub(r'\[.*?\]', '', product_name).strip()
    return cleaned_name


@app.route('/')
def home():
    return "Hello, the server is live!"

def Status(order):

    # Function to remove numbers inside square brackets from product name
        # Fetch the status of the order from Odoo
    SaleOrder = models.execute_kw(db, uid, password, 'stock.picking', 'search_read',
                                    [[['origin', '=', order]]],
                                    {'fields': ['state','move_ids','carrier_id', 'carrier_tracking_ref']})
    
    
    if SaleOrder:
        if SaleOrder[0]['state']=='done':
            return {'status': 'sent', 'info': {'carrier': SaleOrder[0]['carrier_id'], 'tracking_ref': SaleOrder[0]['carrier_id']}}
        
        elif SaleOrder[0]['state']=='assigned':
            return {'status': 'ready', 'info':{}}
        
        elif SaleOrder[0]['state']=='confirmed':
            Products = models.execute_kw(db, uid, password, 'stock.move', 'search_read',
                                                    [[['id', '=', SaleOrder[0]['move_ids']]]],
                                                    {'fields': ['product_id','spfy_release_date']})
            
            # Ordenar por fecha
            SortedProducts = sorted(
                Products,
                key=lambda x: datetime.strptime(x['spfy_release_date'], "%Y-%m-%d"),
                reverse=True
            )

            if datetime.strptime(SortedProducts[0]['spfy_release_date'], "%Y-%m-%d").date()>date.today():
                return {'status': 'presale', 'info': {'product': clean_product_name(SortedProducts[0]['product_id'][1]), 'release_date': datetime.strptime(SortedProducts[0]['spfy_release_date'], "%Y-%m-%d").strftime("%d/%m/%y")}}
            else:
                return {'status': 'waiting_product', 'info': {'carrier': SaleOrder[0]['carrier_id'], 'tracking_ref': SaleOrder[0]['carrier_id']}}
        else:
            return {'status': 'something_went_wrong','info':{}}

    else:
        return {'status': 'not_found', 'info':{}}

@app.route('/order-status', methods=['GET'])
def get_order_status():
    # Get the order name from the request
    order_name = request.args.get('order_name')
    return jsonify(Status(order_name))


# Run the Flask server
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))  # Render provides the port as an environment variable
    app.run(host='0.0.0.0', port=port)
