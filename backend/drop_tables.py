from sqlalchemy.schema import DropTable
from sqlalchemy.ext.compiler import compiles
from database import engine, Base
import models
# Import all models to ensure they are registered
from modules.selling import models
from modules.buying import models
from modules.stock import models
from modules.crm import models
from modules.accounts import models
from modules.accounts import tax_models # Import Tax Models
from modules.manufacturing import models
from modules.setup import models

# Enable CASCADE for PostgreSQL drops
@compiles(DropTable, "postgresql")
def _compile_drop_table(element, compiler, **kwargs):
    return compiler.visit_drop_table(element) + " CASCADE"

def drop_tables():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped.")

if __name__ == "__main__":
    drop_tables()
