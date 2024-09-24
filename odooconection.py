from flask import Flask, jsonify, request
from flask_cors import CORS

import xmlrpc.client

app = Flask(__name__)
CORS(app)

url = 'https://test-company47.odoo.com'
db = 'test-company47'
username = 'lazypau@protonmail.com'
password = 'mainadmin'

common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
common.version()
uid = common.authenticate(db, username, password, {})
models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))
models.execute_kw(db, uid, password, 'res.partner', 'check_access_rights', ['read'], {'raise_exception': False})
uid = common.authenticate(db, username, password, {})


@app.route('/order-status', methods=['GET'])
def get_order_status():
    order_name = request.args.get('order_name')

    RawStatus = models.execute_kw(db, uid, password, 'stock.picking', 'search_read',
                                [[['origin', '=', order_name]]],
                                {'fields': ['state']})

    Product_list = models.execute_kw(db, uid, password, 'sale.order.line', 'search_read', 
                                            [[['order_id', '=', order_name]]], 
                                            {'fields': ['product_id','name', 'product_uom_qty']})

    Sorted_list = sorted(Product_list, key=lambda d: d['name'])

    if RawStatus:
        DeliveryStatus = RawStatus[0]['state']
        print(DeliveryStatus)
        if DeliveryStatus == 'assigned':
            estado = 'preparacion'
            informacion = {}
        
        elif DeliveryStatus == 'done':
            estado = 'enviado'
            print("Enviado")
            ShippingInfo = models.execute_kw(db, uid, password, 'stock.picking', 'search_read',
                                    [[['origin', '=', order_name]]],
                                    {'fields': ['carrier_id','carrier_tracking_ref']})
            if ShippingInfo: informacion ={'carrier': ShippingInfo[0]['carrier_id'][1],'tracking': ShippingInfo[0]['carrier_tracking_ref']}
        else:
            estado = 'esperando'
            informacion = {}
    else:
        estado = 'not_found'
        informacion = {}
    
    return jsonify({'estado': estado, 'informacion': informacion})

if __name__ == '__main__':
    app.run(debug=True)



