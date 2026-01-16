# Configure PyMySQL to work as MySQLdb (only for production with MySQL)
try:
    import pymysql
    pymysql.version_info = (2, 2, 7, "final", 0)
    pymysql.__version__ = "2.2.7"
    pymysql.install_as_MySQLdb()
except ImportError:
    # PyMySQL not installed - using SQLite for development
    pass
