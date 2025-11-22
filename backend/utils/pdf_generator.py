import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from datetime import datetime

# Setup Jinja2 Environment
template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
env = Environment(loader=FileSystemLoader(template_dir))

def generate_pdf(doc_data: dict, template_name: str = "standard_print_format.html") -> bytes:
    """
    Generate PDF bytes from a document dictionary.
    
    Args:
        doc_data: Dictionary containing:
            - doc_type: str (e.g., "Sales Invoice")
            - doc: dict/object (Document details)
            - company: dict/object (Company details)
            - items: list (Line items)
        template_name: Name of the HTML template file
        
    Returns:
        bytes: PDF file content
    """
    template = env.get_template(template_name)
    
    # Add current timestamp
    doc_data['now'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    html_content = template.render(**doc_data)
    
    # Generate PDF
    pdf_bytes = HTML(string=html_content).write_pdf()
    
    return pdf_bytes

