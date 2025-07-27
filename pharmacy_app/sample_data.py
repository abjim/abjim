#!/usr/bin/env python3
"""
Sample Data Generator for CDH Pharmacy POS System
Populates the database with sample medicines for testing
"""

import sqlite3
import os

# Sample medicines data
SAMPLE_MEDICINES = [
    {
        'name': 'Napa Tablet',
        'strength': '500mg',
        'generic': 'Paracetamol',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '10x10',
        'price': 1.20,
        'sortedName': 'Napa Tab 500mg',
        'stock_level': 500
    },
    {
        'name': 'Napa Syrup',
        'strength': '120mg/5ml',
        'generic': 'Paracetamol',
        'sub_generic': '',
        'dosage_form': 'Syrup',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '60ml',
        'price': 55.00,
        'sortedName': 'Napa Syrup 60ml',
        'stock_level': 100
    },
    {
        'name': 'Ace Tablet',
        'strength': '100mg',
        'generic': 'Aspirin',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '10x10',
        'price': 2.50,
        'sortedName': 'Ace Tab 100mg',
        'stock_level': 300
    },
    {
        'name': 'Flexin Tablet',
        'strength': '250mg',
        'generic': 'Cephalexin',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '4x6',
        'price': 8.00,
        'sortedName': 'Flexin 250mg',
        'stock_level': 200
    },
    {
        'name': 'Omepra Capsule',
        'strength': '20mg',
        'generic': 'Omeprazole',
        'sub_generic': '',
        'dosage_form': 'Capsule',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '2x14',
        'price': 3.50,
        'sortedName': 'Omepra 20mg',
        'stock_level': 150
    },
    {
        'name': 'Seclo Capsule',
        'strength': '20mg',
        'generic': 'Omeprazole',
        'sub_generic': '',
        'dosage_form': 'Capsule',
        'company': 'Square Pharmaceuticals',
        'package_size': '3x10',
        'price': 4.20,
        'sortedName': 'Seclo 20mg',
        'stock_level': 180
    },
    {
        'name': 'Amodis Tablet',
        'strength': '500mg',
        'generic': 'Amoxicillin',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '3x10',
        'price': 6.00,
        'sortedName': 'Amodis 500mg',
        'stock_level': 250
    },
    {
        'name': 'Amoxin Capsule',
        'strength': '250mg',
        'generic': 'Amoxicillin',
        'sub_generic': '',
        'dosage_form': 'Capsule',
        'company': 'Square Pharmaceuticals',
        'package_size': '4x6',
        'price': 4.50,
        'sortedName': 'Amoxin 250mg',
        'stock_level': 300
    },
    {
        'name': 'Sergel Tablet',
        'strength': '10mg',
        'generic': 'Sertraline',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '3x10',
        'price': 12.00,
        'sortedName': 'Sergel 10mg',
        'stock_level': 80
    },
    {
        'name': 'Monas Tablet',
        'strength': '10mg',
        'generic': 'Montelukast',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '3x10',
        'price': 15.00,
        'sortedName': 'Monas 10mg',
        'stock_level': 120
    },
    {
        'name': 'Insulin Mixtard',
        'strength': '100IU/ml',
        'generic': 'Insulin',
        'sub_generic': 'Human Insulin',
        'dosage_form': 'Injection',
        'company': 'Novo Nordisk',
        'package_size': '10ml Vial',
        'price': 450.00,
        'sortedName': 'Insulin Mixtard 10ml',
        'stock_level': 25
    },
    {
        'name': 'Glucophage Tablet',
        'strength': '500mg',
        'generic': 'Metformin',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '10x10',
        'price': 2.80,
        'sortedName': 'Glucophage 500mg',
        'stock_level': 400
    },
    {
        'name': 'Losectil Capsule',
        'strength': '40mg',
        'generic': 'Esomeprazole',
        'sub_generic': '',
        'dosage_form': 'Capsule',
        'company': 'Square Pharmaceuticals',
        'package_size': '2x14',
        'price': 7.50,
        'sortedName': 'Losectil 40mg',
        'stock_level': 100
    },
    {
        'name': 'Vastarel Tablet',
        'strength': '35mg',
        'generic': 'Trimetazidine',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Servier',
        'package_size': '6x10',
        'price': 18.00,
        'sortedName': 'Vastarel 35mg',
        'stock_level': 60
    },
    {
        'name': 'Fexo Tablet',
        'strength': '120mg',
        'generic': 'Fexofenadine',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '2x10',
        'price': 8.50,
        'sortedName': 'Fexo 120mg',
        'stock_level': 150
    },
    {
        'name': 'Tory Tablet',
        'strength': '90mg',
        'generic': 'Etoricoxib',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '2x10',
        'price': 12.50,
        'sortedName': 'Tory 90mg',
        'stock_level': 80
    },
    {
        'name': 'Axosin IV Injection',
        'strength': '2gm',
        'generic': 'Ceftriaxone',
        'sub_generic': '',
        'dosage_form': 'Injection',
        'company': 'Beximco Pharmaceuticals',
        'package_size': '1 Vial',
        'price': 85.00,
        'sortedName': 'Axosin IV 2gm',
        'stock_level': 50
    },
    {
        'name': 'Ciprocin Tablet',
        'strength': '500mg',
        'generic': 'Ciprofloxacin',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Square Pharmaceuticals',
        'package_size': '2x10',
        'price': 6.80,
        'sortedName': 'Ciprocin 500mg',
        'stock_level': 200
    },
    {
        'name': 'Zimax Capsule',
        'strength': '250mg',
        'generic': 'Azithromycin',
        'sub_generic': '',
        'dosage_form': 'Capsule',
        'company': 'Square Pharmaceuticals',
        'package_size': '1x6',
        'price': 45.00,
        'sortedName': 'Zimax 250mg',
        'stock_level': 100
    },
    {
        'name': 'Maxpro Tablet',
        'strength': '40mg',
        'generic': 'Esomeprazole',
        'sub_generic': '',
        'dosage_form': 'Tablet',
        'company': 'Renata',
        'package_size': '2x14',
        'price': 8.20,
        'sortedName': 'Maxpro 40mg',
        'stock_level': 120
    }
]

def create_sample_data():
    """Create sample data in the database"""
    
    # Database path
    db_path = 'data/medicines.db'
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if medicines table exists and has data
        cursor.execute("SELECT COUNT(*) FROM medicines")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"Database already contains {count} medicines.")
            response = input("Do you want to add sample data anyway? (y/N): ")
            if response.lower() != 'y':
                print("Sample data creation cancelled.")
                return
        
        # Insert sample medicines
        print("Adding sample medicines to database...")
        
        for medicine in SAMPLE_MEDICINES:
            cursor.execute("""
                INSERT INTO medicines (
                    name, strength, generic, sub_generic, dosage_form,
                    company, package_size, price, sortedName, stock_level, times_sold
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                medicine['name'],
                medicine['strength'],
                medicine['generic'],
                medicine['sub_generic'],
                medicine['dosage_form'],
                medicine['company'],
                medicine['package_size'],
                medicine['price'],
                medicine['sortedName'],
                medicine['stock_level'],
                0  # times_sold starts at 0
            ))
        
        conn.commit()
        
        print(f"✅ Successfully added {len(SAMPLE_MEDICINES)} sample medicines!")
        print("\nSample medicines include:")
        print("- Pain relief (Napa, Ace)")
        print("- Antibiotics (Flexin, Amodis, Amoxin)")
        print("- Gastric medicines (Omepra, Seclo, Losectil)")
        print("- Diabetes medicines (Insulin, Glucophage)")
        print("- And more common pharmacy items...")
        
        # Show summary by company
        cursor.execute("""
            SELECT company, COUNT(*) as count 
            FROM medicines 
            GROUP BY company 
            ORDER BY count DESC
        """)
        
        print("\nMedicines by company:")
        for company, count in cursor.fetchall():
            print(f"  {company}: {count} medicines")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        conn.rollback()
    
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    
    finally:
        conn.close()

def create_sample_patients():
    """Create sample patient data"""
    
    db_path = 'data/medicines.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    sample_patients = [
        {
            'name': 'Mr. Rahman',
            'phone': '01711-123456',
            'address': 'Bagichagao, Cumilla',
            'bed_no': '',
            'care_of': ''
        },
        {
            'name': 'Mrs. Fatima Begum',
            'phone': '01812-654321',
            'address': 'Cumilla Sadar',
            'bed_no': 'B-101',
            'care_of': 'Dr. Ahmed'
        },
        {
            'name': 'Md. Karim',
            'phone': '01555-789012',
            'address': 'Laksam, Cumilla',
            'bed_no': '',
            'care_of': ''
        }
    ]
    
    try:
        for patient in sample_patients:
            cursor.execute("""
                INSERT OR IGNORE INTO patients (name, phone, address, bed_no, care_of)
                VALUES (?, ?, ?, ?, ?)
            """, (
                patient['name'],
                patient['phone'],
                patient['address'],
                patient['bed_no'],
                patient['care_of']
            ))
        
        conn.commit()
        print("✅ Sample patients added successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error adding patients: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("CDH Pharmacy POS System - Sample Data Generator")
    print("=" * 50)
    
    # Import the app to initialize database schema
    try:
        from app import init_db
        print("📅 Initializing database schema...")
        init_db()
        print("✅ Database schema created successfully!")
    except ImportError:
        print("⚠️  Could not import app.py. Make sure it exists in the same directory.")
        print("⚠️  You may need to run this script from the pharmacy_app directory.")
        exit(1)
    
    # Create sample data
    create_sample_data()
    create_sample_patients()
    
    print("\n" + "=" * 50)
    print("🎉 Sample data creation complete!")
    print("📝 You can now:")
    print("   1. Run 'python app.py' to start the server")
    print("   2. Visit http://localhost:5000")
    print("   3. Test the POS system with sample medicines")
    print("   4. Create sample invoices and explore features")
    print("\n💡 Tip: Try searching for 'napa', 'square', or 'paracetamol'")