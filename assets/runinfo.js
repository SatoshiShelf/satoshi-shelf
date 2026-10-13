window.RUNINFO = {
  "csv-report-tool": {
    "script": "csv_report.py",
    "req": false,
    "deps": []
  },
  "bulk-file-organizer": {
    "script": "bulk-file-organizer/organize.py",
    "req": false,
    "deps": []
  },
  "duplicate-file-finder": {
    "script": "duplicate-file-finder/find_duplicates.py",
    "req": false,
    "deps": []
  },
  "csv-to-excel-converter": {
    "script": "csv-to-excel/csv_to_excel.py",
    "req": true,
    "deps": [
      "openpyxl"
    ]
  },
  "expense-csv-analyzer": {
    "script": "expense-analyzer/analyze_expenses.py",
    "req": false,
    "deps": []
  },
  "pdf-toolkit": {
    "script": "pdf-toolkit/pdf_toolkit.py",
    "req": true,
    "deps": [
      "pypdf"
    ]
  },
  "image-batch-resizer": {
    "script": "image-batch-resizer/resize_images.py",
    "req": true,
    "deps": [
      "Pillow"
    ]
  },
  "qr-code-generator": {
    "script": "qr-generator/make_qr.py",
    "req": true,
    "deps": [
      "qrcode"
    ]
  },
  "secure-password-generator": {
    "script": "password-generator/gen_password.py",
    "req": false,
    "deps": []
  },
  "batch-file-renamer": {
    "script": "batch-renamer/rename.py",
    "req": false,
    "deps": []
  },
  "simple-web-scraper": {
    "script": "web-scraper/scrape.py",
    "req": true,
    "deps": [
      "beautifulsoup4",
      "requests"
    ]
  },
  "csv-data-cleaner": {
    "script": "data-cleaner/clean_csv.py",
    "req": false,
    "deps": []
  },
  "recipe-scaler-py": {
    "script": "recipe-scaler/scale_recipe.py",
    "req": false,
    "deps": []
  },
  "flashcard-quiz": {
    "script": "flashcard-quiz/quiz.py",
    "req": false,
    "deps": []
  },
  "grade-calculator-py": {
    "script": "grade-calculator/grade_calc.py",
    "req": false,
    "deps": []
  },
  "random-group-generator": {
    "script": "random-groups/make_groups.py",
    "req": false,
    "deps": []
  },
  "packing-list-generator": {
    "script": "packing-list/packing_list.py",
    "req": false,
    "deps": []
  },
  "interval-timer": {
    "script": "interval-timer/interval_timer.py",
    "req": false,
    "deps": []
  },
  "images-to-pdf": {
    "script": "images-to-pdf/images_to_pdf.py",
    "req": true,
    "deps": [
      "Pillow"
    ]
  },
  "pdf-to-text": {
    "script": "pdf-to-text/pdf_to_text.py",
    "req": true,
    "deps": [
      "pypdf"
    ]
  },
  "grocery-list-builder": {
    "script": "grocery-list/grocery_list.py",
    "req": false,
    "deps": []
  }
};
