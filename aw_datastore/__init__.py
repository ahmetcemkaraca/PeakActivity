class Storage:
    pass

class EventDB:
    pass

class Datastore:
    pass

def get_storage_methods():
    return {"memory": Storage, "peewee": Storage} 