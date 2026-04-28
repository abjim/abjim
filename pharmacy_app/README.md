# CDH Pharmacy POS System

A complete, fast, modern, and intelligent Pharmacy Billing and Inventory Assistant software built with Flask, SQLite, and vanilla JavaScript.

## 🚀 Features

### 🧠 Smart Search Engine
- **AI-like Medicine Search**: Search across name, generic, company, strength, package size
- **Multi-word Partial Matching**: "parace square" → matches Paracetamol by Square
- **Fuzzy Tolerance**: Handles space/hyphen/case variations
- **Relevance Ranking**: Shows most relevant results first

### 🛒 Controlled Add-to-Cart Flow
- **Pending Item Panel**: Review items before adding to cart
- **Quantity Control**: Adjust quantity with preview
- **Smart Cart Management**: Merge quantities for existing items
- **Error Prevention**: Reduces billing mistakes

### 🧾 80mm POS Receipt Printing
- **Optimized for Rongta RP328**: Perfect 80mm thermal printer support
- **Monospaced Layout**: Clean, professional receipts
- **Smart Labels**: Uses `sortedName` for clean product names
- **Custom Footer**: CDH Pharmacy branding

### 👥 Patient Management
- **Patient Database**: Store and reuse patient information
- **Quick Selection**: Dropdown for existing patients
- **Complete Info**: Name, phone, address, bed no, care of
- **Auto-complete**: Smart form filling

### 📜 Comprehensive Bill History
- **Search & Filter**: By invoice number, patient name, date range
- **Quick Actions**: View, reprint, export invoices
- **Detailed View**: Full invoice breakdown with items
- **CSV Export**: Export filtered results

### 📊 Advanced Analytics & Reports
- **Trending Medicines**: Track popular items (7/30/90 days)
- **Sales Statistics**: Total sales, average bill, patient count
- **Purchase Recommendations**: AI-driven restocking suggestions
- **Performance Insights**: Peak sales days, growth trends

### 💊 Medicine Management
- **Complete Database**: All medicine fields (generic, strength, company, etc.)
- **Smart Filtering**: Filter by company, generic, stock level
- **Bulk Operations**: CSV import/export
- **Stock Tracking**: Visual stock level indicators
- **Sales Analytics**: Track units sold per medicine

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, TailwindCSS, Vanilla JavaScript |
| Backend | Python Flask |
| Database | SQLite |
| Printing | 80mm POS thermal printer optimized |
| Design | Modern, responsive, component-based |

## 📁 File Structure

```
pharmacy_app/
├── templates/
│   ├── index.html        # Main POS interface
│   ├── invoice.html      # Print-optimized invoice
│   ├── history.html      # Bill history & search
│   ├── reports.html      # Analytics dashboard
│   └── manage.html       # Medicine management
├── static/
│   ├── style.css         # Tailwind + custom styles
│   └── script.js         # Modular JavaScript
├── data/
│   └── medicines.db      # SQLite database
├── app.py                # Flask backend
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ 
- Web browser (Chrome, Firefox, Edge, Safari)
- Optional: 80mm thermal printer for receipts

### Installation

1. **Clone or download the project**
   ```bash
   cd pharmacy_app
   ```

2. **Install Python dependencies**
   ```bash
   pip install flask
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   - Navigate to: `http://localhost:5000`
   - The database will be created automatically on first run

### First Setup

1. **Add some sample medicines** via the Manage section
2. **Create your first invoice** on the main POS screen
3. **Test printing** - receipts are optimized for 80mm printers

## 💊 Database Schema

### Medicines Table
```sql
medicines (
    id, name, strength, generic, sub_generic,
    dosage_form, company, product_url, package_size,
    price, sortedName, stock_level, times_sold
)
```

### Key Tables
- **patients**: Customer information
- **invoices**: Bill headers with totals
- **invoice_items**: Individual medicine line items
- **usage_logs**: Sales analytics data

## 🎯 Usage Guide

### Main POS Screen
1. **Search Medicine**: Type partial name, company, or generic
2. **Select from Dropdown**: Use arrow keys + Enter
3. **Review in Pending Panel**: Adjust quantity if needed
4. **Add to Bill**: Click "Add to Bill" button
5. **Enter Patient Info**: Required for invoice
6. **Save & Print**: Ctrl+S or click button

### Smart Search Examples
- `"parace"` → Finds Paracetamol products
- `"napa syrup"` → Finds Napa Syrup specifically  
- `"square 500"` → Finds Square company 500mg products
- `"insulin"` → Finds all insulin products

### Keyboard Shortcuts
- **Ctrl+S**: Save invoice
- **Ctrl+F**: Focus search
- **Escape**: Clear search/close panels
- **Arrow Keys**: Navigate search results
- **Enter**: Select highlighted item

## 🖨️ Printer Setup

### Recommended Printer
- **Rongta RP328** (80mm thermal printer)
- Any ESC/POS compatible 80mm printer

### Print Settings
- **Paper Width**: 80mm (302px)
- **Font**: Courier New (monospaced)
- **Auto-cut**: Enabled
- **Print Density**: Medium

### Browser Print Setup
1. Set margins to minimum (0.25" or less)
2. Enable background graphics
3. Select correct paper size (80mm or custom)

## 📊 Reports & Analytics

### Available Reports
- **Daily/Weekly/Monthly Sales**
- **Trending Medicines** 
- **Purchase Recommendations**
- **Patient Analysis**
- **Stock Level Reports**

### Export Options
- **CSV Export**: All reports support CSV download
- **Date Filtering**: Custom date ranges
- **Quick Filters**: 7/30/90 day presets

## 🔧 Customization

### Pharmacy Information
Edit in `templates/invoice.html`:
```html
<div class="print-title">CDH PHARMACY</div>
<div class="print-subtitle">Bagichagao, Cumilla-3500</div>
<div class="print-subtitle">Phone: 01XX-XXXXXX</div>
```

### Currency Symbol
Currently set to `৳` (Bangladeshi Taka). Change in:
- `static/script.js` - Search for `৳` and replace
- Template files - Update currency displays

### Print Layout
Modify `static/style.css` print section for different:
- Paper sizes
- Font sizes  
- Layout spacing
- Colors/formatting

## 🔐 Security Notes

- **Local Database**: Data stored in `data/medicines.db`
- **No External Dependencies**: Fully offline capable
- **Input Validation**: Server-side validation on all inputs
- **SQL Injection Protection**: Parameterized queries used

## 🔄 Backup & Restore

### Backup Database
```bash
cp data/medicines.db backup/medicines_backup_$(date +%Y%m%d).db
```

### Restore Database
```bash
cp backup/medicines_backup_YYYYMMDD.db data/medicines.db
```

### Export All Data
Use the CSV export features in each section for data portability.

## 🐛 Troubleshooting

### Common Issues

**Database not created**
- Ensure `data/` directory exists
- Check Python write permissions

**Print layout issues**
- Verify 80mm paper size in browser
- Check printer compatibility (ESC/POS)
- Adjust CSS print styles if needed

**Search not working**
- Check browser JavaScript console for errors
- Ensure Flask server is running
- Verify database has medicine data

**Slow performance**
- Add indexes to database for large datasets
- Clear browser cache
- Check available disk space

## 🆘 Support

### Quick Fixes
1. **Restart the Flask server** - Fixes most temporary issues
2. **Clear browser cache** - Resolves frontend issues
3. **Check browser console** - Shows JavaScript errors
4. **Verify database file** - Ensure `medicines.db` exists and is accessible

### Contact Information
- **Pharmacy**: CDH Pharmacy, Bagichagao, Cumilla-3500
- **Support**: Check database logs and error messages

## 📝 License

This software is designed for CDH Pharmacy. Modify and use according to your pharmacy's needs.

## 🏥 About CDH Pharmacy

**CDH Pharmacy**  
Bagichagao, Cumilla-3500, Bangladesh  
*Your trusted healthcare partner*

---

*Built with ❤️ for modern pharmacy management*