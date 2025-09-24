import hashlib
import random
import re

class Anonymizer:
    def __init__(self, config=None):
        self.config = config if config is not None else {
            'title': {'method': 'hash'},
            'app': {'method': 'hash'}
        }

    def anonymize_event(self, event_data):
        anonymized_data = event_data.copy()
        
        for field, options in self.config.items():
            if field in anonymized_data:
                method = options.get('method')
                if method == 'hash':
                    anonymized_data[field] = self._hash_data(anonymized_data[field])
                elif method == 'mask':
                    anonymized_data[field] = self._mask_data(anonymized_data[field])
                elif method == 'truncate':
                    length = options.get('length', 10)
                    anonymized_data[field] = self._truncate_data(anonymized_data[field], length)
                elif method == 'redact':
                    pattern = options.get('pattern', '(?<=[a-zA-Z0-9]{3})[a-zA-Z0-9](?=[a-zA-Z0-9]{3})') # Varsayılan olarak ortadaki karakterleri gizler
                    replace_with = options.get('replace_with', '*')
                    anonymized_data[field] = self._redact_data(anonymized_data[field], pattern, replace_with)
                elif method == 'randomize':
                    data_type = options.get('type', 'numeric')
                    anonymized_data[field] = self._randomize_data(anonymized_data[field], data_type)
        
        return anonymized_data

    def _hash_data(self, data):
        if isinstance(data, str):
            return hashlib.sha256(data.encode()).hexdigest()
        return data

    def _mask_data(self, data):
        if isinstance(data, str):
            return "[MASKED]"
        return data

    def _truncate_data(self, data, length):
        if isinstance(data, str):
            return data[:length]
        return data

    def _redact_data(self, data, pattern, replace_with):
        if isinstance(data, str):
            return re.sub(pattern, replace_with, data)
        return data

    def _randomize_data(self, data, data_type):
        if data_type == 'numeric':
            if isinstance(data, (int, float)):
                return data * random.uniform(0.9, 1.1)  # %10 sapma ile rastgeleleştirme
            return data
        elif data_type == 'categorical':
            # Kategorik veriler için basit bir shuffle veya rastgele seçim
            # Örnek: ['A', 'B', 'C'] -> ['C', 'A', 'B'] veya 'B'
            if isinstance(data, list):
                random.shuffle(data)
                return data
            elif isinstance(data, str):
                # Basit bir string için karakterleri karıştır
                return ''.join(random.sample(data, len(data)))
            return data
        return data 