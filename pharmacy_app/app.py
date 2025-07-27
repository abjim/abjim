from flask import Flask, render_template, request, jsonify, send_file
import sqlite3
import json
from datetime import datetime, timedelta
import re
from collections import defaultdict
import os

app = Flask(__name__)

# Database path
DB_PATH = 'data/medicines.db'

def init_db():
    """Initialize the database with required tables"""
    os.makedirs('data', exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Medicines table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            strength TEXT,
            generic TEXT,
            sub_generic TEXT,
            dosage_form TEXT,
            company TEXT,
            product_url TEXT,
            package_size TEXT,
            price REAL NOT NULL,
            sortedName TEXT,
            stock_level INTEGER DEFAULT 0,
            times_sold INTEGER DEFAULT 0
        )
    ''')
    
    # Patients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            bed_no TEXT,
            care_of TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Invoices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE,
            patient_id INTEGER,
            patient_name TEXT,
            patient_phone TEXT,
            patient_address TEXT,
            patient_bed_no TEXT,
            patient_care_of TEXT,
            subtotal REAL,
            discount REAL DEFAULT 0,
            total REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
    ''')
    
    # Invoice items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS invoice_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_id INTEGER,
            medicine_id INTEGER,
            medicine_name TEXT,
            quantity INTEGER,
            unit_price REAL,
            total_price REAL,
            FOREIGN KEY (invoice_id) REFERENCES invoices (id),
            FOREIGN KEY (medicine_id) REFERENCES medicines (id)
        )
    ''')
    
    # Usage logs for analytics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER,
            quantity_sold INTEGER,
            sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (medicine_id) REFERENCES medicines (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def clean_search_term(term):
    """Clean and normalize search terms"""
    if not term:
        return ""
    return re.sub(r'[^\w\s]', ' ', term.lower()).strip()

def calculate_relevance_score(medicine, search_tokens):
    """Calculate relevance score for search results"""
    score = 0
    medicine_text = f"{medicine['name']} {medicine['generic']} {medicine['company']} {medicine['strength']} {medicine['package_size']} {medicine['sortedName']}".lower()
    
    for token in search_tokens:
        if token in medicine_text:
            score += 1
            # Boost score if found in name or sortedName
            if token in medicine['name'].lower() or token in (medicine['sortedName'] or '').lower():
                score += 2
    
    return score

@app.route('/')
def index():
    """Main POS interface"""
    return render_template('index.html')

@app.route('/invoice')
def invoice():
    """Invoice printing page"""
    return render_template('invoice.html')

@app.route('/history')
def history():
    """Bill history and reprint"""
    return render_template('history.html')

@app.route('/reports')
def reports():
    """Reports and analytics"""
    return render_template('reports.html')

@app.route('/manage')
def manage():
    """Medicine management"""
    return render_template('manage.html')

@app.route('/api/search_medicines')
def search_medicines():
    """Smart search for medicines"""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    search_tokens = clean_search_term(query).split()
    if not search_tokens:
        return jsonify([])
    
    conn = get_db_connection()
    
    # Build dynamic SQL query for fuzzy search
    sql_conditions = []
    params = []
    
    for token in search_tokens:
        token_param = f"%{token}%"
        condition = """(
            name LIKE ? OR 
            generic LIKE ? OR 
            company LIKE ? OR 
            strength LIKE ? OR 
            package_size LIKE ? OR 
            sortedName LIKE ?
        )"""
        sql_conditions.append(condition)
        params.extend([token_param] * 6)
    
    sql = f"""
        SELECT * FROM medicines 
        WHERE {' AND '.join(sql_conditions)}
        ORDER BY times_sold DESC, name ASC
        LIMIT 20
    """
    
    medicines = conn.execute(sql, params).fetchall()
    conn.close()
    
    # Calculate relevance scores and sort
    results = []
    for medicine in medicines:
        medicine_dict = dict(medicine)
        score = calculate_relevance_score(medicine_dict, search_tokens)
        medicine_dict['relevance_score'] = score
        results.append(medicine_dict)
    
    # Sort by relevance score (descending)
    results.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    return jsonify(results)

@app.route('/api/patients')
def get_patients():
    """Get all patients for dropdown"""
    conn = get_db_connection()
    patients = conn.execute("""
        SELECT DISTINCT name, phone, address, bed_no, care_of 
        FROM patients 
        ORDER BY name ASC
    """).fetchall()
    conn.close()
    
    return jsonify([dict(p) for p in patients])

@app.route('/api/save_invoice', methods=['POST'])
def save_invoice():
    """Save invoice and return invoice ID"""
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Generate invoice number
        last_invoice = cursor.execute("SELECT MAX(id) as max_id FROM invoices").fetchone()
        invoice_number = f"INV-{(last_invoice['max_id'] or 0) + 1:06d}"
        
        # Save patient if new
        patient_data = data.get('patient', {})
        patient_id = None
        if patient_data.get('name'):
            cursor.execute("""
                INSERT OR IGNORE INTO patients (name, phone, address, bed_no, care_of)
                VALUES (?, ?, ?, ?, ?)
            """, (
                patient_data.get('name'),
                patient_data.get('phone'),
                patient_data.get('address'),
                patient_data.get('bed_no'),
                patient_data.get('care_of')
            ))
            
            # Get patient ID
            patient_id = cursor.execute("""
                SELECT id FROM patients WHERE name = ? AND phone = ? AND address = ?
            """, (
                patient_data.get('name'),
                patient_data.get('phone'),
                patient_data.get('address')
            )).fetchone()
            if patient_id:
                patient_id = patient_id['id']
        
        # Save invoice
        cursor.execute("""
            INSERT INTO invoices (
                invoice_number, patient_id, patient_name, patient_phone, 
                patient_address, patient_bed_no, patient_care_of,
                subtotal, discount, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice_number,
            patient_id,
            patient_data.get('name'),
            patient_data.get('phone'),
            patient_data.get('address'),
            patient_data.get('bed_no'),
            patient_data.get('care_of'),
            data.get('subtotal', 0),
            data.get('discount', 0),
            data.get('total', 0)
        ))
        
        invoice_id = cursor.lastrowid
        
        # Save invoice items and update medicine stats
        for item in data.get('items', []):
            cursor.execute("""
                INSERT INTO invoice_items (
                    invoice_id, medicine_id, medicine_name, quantity, unit_price, total_price
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                invoice_id,
                item.get('id'),
                item.get('name'),
                item.get('quantity'),
                item.get('price'),
                item.get('total')
            ))
            
            # Update medicine usage stats
            cursor.execute("""
                UPDATE medicines 
                SET times_sold = times_sold + ? 
                WHERE id = ?
            """, (item.get('quantity'), item.get('id')))
            
            # Log usage for analytics
            cursor.execute("""
                INSERT INTO usage_logs (medicine_id, quantity_sold)
                VALUES (?, ?)
            """, (item.get('id'), item.get('quantity')))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'invoice_id': invoice_id,
            'invoice_number': invoice_number
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/get_invoice/<int:invoice_id>')
def get_invoice(invoice_id):
    """Get invoice details for printing/viewing"""
    conn = get_db_connection()
    
    # Get invoice details
    invoice = conn.execute("""
        SELECT * FROM invoices WHERE id = ?
    """, (invoice_id,)).fetchone()
    
    if not invoice:
        conn.close()
        return jsonify({'error': 'Invoice not found'}), 404
    
    # Get invoice items
    items = conn.execute("""
        SELECT * FROM invoice_items WHERE invoice_id = ?
    """, (invoice_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'invoice': dict(invoice),
        'items': [dict(item) for item in items]
    })

@app.route('/api/search_invoices')
def search_invoices():
    """Search invoices by various criteria"""
    query = request.args.get('q', '').strip()
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    conn = get_db_connection()
    
    sql = "SELECT * FROM invoices WHERE 1=1"
    params = []
    
    if query:
        sql += " AND (invoice_number LIKE ? OR patient_name LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%"])
    
    if start_date:
        sql += " AND date(created_at) >= ?"
        params.append(start_date)
    
    if end_date:
        sql += " AND date(created_at) <= ?"
        params.append(end_date)
    
    sql += " ORDER BY created_at DESC LIMIT 100"
    
    invoices = conn.execute(sql, params).fetchall()
    conn.close()
    
    return jsonify([dict(inv) for inv in invoices])

@app.route('/api/medicines')
def get_medicines():
    """Get all medicines for management"""
    conn = get_db_connection()
    medicines = conn.execute("""
        SELECT * FROM medicines 
        ORDER BY name ASC
    """).fetchall()
    conn.close()
    
    return jsonify([dict(m) for m in medicines])

@app.route('/api/save_medicine', methods=['POST'])
def save_medicine():
    """Add or update medicine"""
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if data.get('id'):
            # Update existing
            cursor.execute("""
                UPDATE medicines SET
                    name = ?, strength = ?, generic = ?, sub_generic = ?,
                    dosage_form = ?, company = ?, product_url = ?,
                    package_size = ?, price = ?, sortedName = ?, stock_level = ?
                WHERE id = ?
            """, (
                data.get('name'), data.get('strength'), data.get('generic'),
                data.get('sub_generic'), data.get('dosage_form'), data.get('company'),
                data.get('product_url'), data.get('package_size'), data.get('price'),
                data.get('sortedName'), data.get('stock_level'), data.get('id')
            ))
        else:
            # Insert new
            cursor.execute("""
                INSERT INTO medicines (
                    name, strength, generic, sub_generic, dosage_form,
                    company, product_url, package_size, price, sortedName, stock_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('name'), data.get('strength'), data.get('generic'),
                data.get('sub_generic'), data.get('dosage_form'), data.get('company'),
                data.get('product_url'), data.get('package_size'), data.get('price'),
                data.get('sortedName'), data.get('stock_level', 0)
            ))
        
        conn.commit()
        return jsonify({'success': True})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/delete_medicine/<int:medicine_id>', methods=['DELETE'])
def delete_medicine(medicine_id):
    """Delete medicine"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM medicines WHERE id = ?", (medicine_id,))
        conn.commit()
        return jsonify({'success': True})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        conn.close()

@app.route('/api/reports/trending')
def get_trending_medicines():
    """Get trending medicines for given period"""
    days = request.args.get('days', 7, type=int)
    
    conn = get_db_connection()
    
    trending = conn.execute("""
        SELECT 
            m.name, m.sortedName, m.company, m.generic,
            SUM(ul.quantity_sold) as total_sold,
            COUNT(DISTINCT ul.sale_date) as days_sold
        FROM usage_logs ul
        JOIN medicines m ON ul.medicine_id = m.id
        WHERE ul.sale_date >= datetime('now', '-{} days')
        GROUP BY m.id
        ORDER BY total_sold DESC
        LIMIT 20
    """.format(days)).fetchall()
    
    conn.close()
    
    return jsonify([dict(item) for item in trending])

@app.route('/api/reports/stats')
def get_sales_stats():
    """Get sales statistics"""
    days = request.args.get('days', 30, type=int)
    
    conn = get_db_connection()
    
    stats = conn.execute("""
        SELECT 
            COUNT(*) as total_invoices,
            SUM(total) as total_sales,
            AVG(total) as average_bill,
            COUNT(DISTINCT patient_name) as unique_patients
        FROM invoices
        WHERE created_at >= datetime('now', '-{} days')
    """.format(days)).fetchone()
    
    # Top medicines
    top_medicines = conn.execute("""
        SELECT 
            m.name, m.sortedName,
            SUM(ii.quantity) as total_quantity,
            SUM(ii.total_price) as total_revenue
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        JOIN medicines m ON ii.medicine_id = m.id
        WHERE i.created_at >= datetime('now', '-{} days')
        GROUP BY m.id
        ORDER BY total_quantity DESC
        LIMIT 10
    """.format(days)).fetchall()
    
    conn.close()
    
    return jsonify({
        'stats': dict(stats) if stats else {},
        'top_medicines': [dict(item) for item in top_medicines]
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)