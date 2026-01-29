from factory import DjangoModelFactory, SubFactory
from factory.fuzzy import FuzzyText
from datetime import datetime, timedelta
from aw_server.models import Event, Bucket

class EventFactory(DjangoModelFactory):
    class Meta:
        model = Event
        django_get_or_create = ('id',)

    id = FuzzyText(length=36)
    timestamp = datetime.now().isoformat()
    duration = 3600  # 1 hour default
    data = {
        'app': 'code.exe',
        'title': FuzzyText(length=50),
        'url': None
    }

class BucketFactory(DjangoModelFactory):
    class Meta:
        model = Bucket
        django_get_or_create = ('id',)

    id = FuzzyText(length=50)
    type = 'currentwindow'
    client = 'aw-watcher-window'
    hostname = 'test-pc'
    created = datetime.now().isoformat()

# Usage example
# events = EventFactory.create_batch(10)
