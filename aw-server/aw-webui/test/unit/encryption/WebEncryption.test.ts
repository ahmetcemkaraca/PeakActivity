import { WebCryptoService } from '../../../src/services/encryption/WebCryptoService';
import { ClientSideEncryption } from '../../../src/services/encryption/ClientSideEncryption';
import { LocalStorageEncryption } from '../../../src/services/encryption/LocalStorageEncryption';
import { IndexedDBEncryption } from '../../../src/services/encryption/IndexedDBEncryption';
import { BrowserKeyManager } from '../../../src/services/encryption/BrowserKeyManager';
import { OfflineEncryptionCache } from '../../../src/services/encryption/OfflineEncryptionCache';
import { CryptoJSFallbackService } from '../../../src/services/encryption/CryptoJSFallbackService';
import { shallowMount } from '@vue/test-utils';
import EncryptionSettings from '../../../src/views/settings/EncryptionSettings.vue';

// Mocking dependencies
const mockKeyDerivationService = {
  deriveKey: jest.fn(async (password, salt) => ({
    key: 'mockDerivedKey',
    salt: salt || new Uint8Array(),
  })),
  verifyKey: jest.fn(async (password, hash, salt) => true),
  generateSalt: jest.fn(async () => new Uint8Array(16)),
};

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IndexedDB
const indexedDBMock = (() => {
  const stores: { [dbName: string]: { [storeName: string]: { [id: string]: any } } } = {};
  return {
    open: jest.fn((dbName: string, version: number) => {
      const request = {
        onsuccess: jest.fn(),
        onupgradeneeded: jest.fn(),
        onerror: jest.fn(),
        result: {
          objectStoreNames: { contains: jest.fn(() => true) },
          createObjectStore: jest.fn(() => ({})),
          transaction: jest.fn((storeNames, mode) => ({
            objectStore: jest.fn(storeName => ({
              put: jest.fn(value => ({
                onsuccess: jest.fn(),
                onerror: jest.fn(),
              })),
              get: jest.fn(id => ({
                onsuccess: jest.fn(),
                onerror: jest.fn(),
                result: stores[dbName]?.[storeNames[0]]?.[id] || null,
              })),
              delete: jest.fn(id => ({
                onsuccess: jest.fn(),
                onerror: jest.fn(),
              })),
              clear: jest.fn(() => ({
                onsuccess: jest.fn(),
                onerror: jest.fn(),
              })),
            })),
          })),
          close: jest.fn(),
        },
      };

      setTimeout(() => {
        if (!stores[dbName]) {
          stores[dbName] = {};
          request.onupgradeneeded({ target: { result: request.result } } as any);
        }
        request.onsuccess({ target: { result: request.result } } as any);
      }, 0);
      return request;
    }),
  };
})();
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });

describe('Encryption Services Unit Tests', () => {
  const testData = 'This is a secret message.';
  const testUserKey = 'c29tZVJlYWxseVNlY3JldEtleUZvcldlYkNyaXB0bw=='; // Base64 encoded 256-bit key
  const testIv = 'c29tZVJhbmRvbUlWBg=='; // Base64 encoded 16-byte IV

  // WebCryptoService Tests
  describe('WebCryptoService', () => {
    let service: WebCryptoService;

    beforeEach(() => {
      service = new WebCryptoService();
    });

    it('should encrypt and decrypt data correctly', async () => {
      const encrypted = await service.encrypt(testData, testUserKey, testIv);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(testData);

      const decrypted = await service.decrypt(encrypted, testUserKey, testIv);
      expect(decrypted).toEqual(testData);
    });

    it('should generate a valid IV', async () => {
      const iv = await service.generateIv();
      expect(iv).toBeDefined();
      // Base64 decoding a 16-byte array results in 16 characters
      expect(atob(iv).length).toEqual(16);
    });
  });

  // CryptoJSFallbackService Tests
  describe('CryptoJSFallbackService', () => {
    let service: CryptoJSFallbackService;

    beforeEach(() => {
      service = new CryptoJSFallbackService();
    });

    it('should encrypt and decrypt data correctly with CryptoJS', async () => {
      const encrypted = await service.encrypt(testData, testUserKey, testIv);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(testData);

      const decrypted = await service.decrypt(encrypted, testUserKey, testIv);
      expect(decrypted).toEqual(testData);
    });

    it('should generate a valid IV with CryptoJS fallback', async () => {
      const iv = await service.generateIv();
      expect(iv).toBeDefined();
      // Base64 decoding a 16-byte array results in 16 characters
      expect(atob(iv).length).toEqual(16);
    });
  });

  // ClientSideEncryption Tests
  describe('ClientSideEncryption', () => {
    let clientSideEncryption: ClientSideEncryption;
    let webCryptoService: WebCryptoService;

    beforeEach(() => {
      webCryptoService = new WebCryptoService();
      clientSideEncryption = new ClientSideEncryption(
        webCryptoService,
        mockKeyDerivationService as any
      );
    });

    it('should encrypt and decrypt activity data with metadata', async () => {
      const { encryptedData, metadata } = await clientSideEncryption.encryptActivityData(
        testData,
        testUserKey
      );
      expect(encryptedData).toBeDefined();
      expect(metadata).toBeDefined();
      expect(metadata.algorithm).toEqual('AES-256-GCM');
      expect(metadata.iv).toBeDefined();
      expect(metadata.version).toEqual('1.0');

      const decryptedData = await clientSideEncryption.decryptActivityData(
        encryptedData,
        metadata,
        testUserKey
      );
      expect(decryptedData).toEqual(testData);
    });

    it('should throw error for unsupported algorithm', async () => {
      const metadata: any = { algorithm: 'UNSUPPORTED_ALG', iv: testIv, version: '1.0' };
      await expect(
        clientSideEncryption.decryptActivityData('fakeEncryptedData', metadata, testUserKey)
      ).rejects.toThrow('Desteklenmeyen şifreleme algoritması');
    });
  });

  // LocalStorageEncryption Tests
  describe('LocalStorageEncryption', () => {
    let localStorageEnc: LocalStorageEncryption;
    let clientSideEnc: ClientSideEncryption;

    beforeEach(() => {
      localStorageMock.clear(); // Clear local storage before each test
      clientSideEnc = new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      );
      localStorageEnc = new LocalStorageEncryption(clientSideEnc);
      localStorageEnc.setUserKey(testUserKey);
    });

    it('should encrypt and store data in localStorage', async () => {
      await localStorageEnc.setItem('myKey', testData);
      const stored = localStorageMock.getItem('myKey');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.encryptedData).toBeDefined();
      expect(parsed.metadata).toBeDefined();
    });

    it('should retrieve and decrypt data from localStorage', async () => {
      await localStorageEnc.setItem('myKey', testData);
      const retrieved = await localStorageEnc.getItem('myKey');
      expect(retrieved).toEqual(testData);
    });

    it('should remove item from localStorage', async () => {
      await localStorageEnc.setItem('myKey', testData);
      localStorageEnc.removeItem('myKey');
      expect(localStorageMock.getItem('myKey')).toBeNull();
    });

    it('should clear all items from localStorage', async () => {
      await localStorageEnc.setItem('myKey1', testData);
      await localStorageEnc.setItem('myKey2', testData);
      localStorageEnc.clear();
      expect(localStorageMock.getItem('myKey1')).toBeNull();
      expect(localStorageMock.getItem('myKey2')).toBeNull();
    });

    it('should throw error if user key is not set', async () => {
      localStorageEnc = new LocalStorageEncryption(clientSideEnc);
      await expect(localStorageEnc.setItem('key', 'value')).rejects.toThrow(
        'Kullanıcı anahtarı ayarlanmamış'
      );
      await expect(localStorageEnc.getItem('key')).rejects.toThrow(
        'Kullanıcı anahtarı ayarlanmamış'
      );
    });
  });

  // IndexedDBEncryption Tests
  describe('IndexedDBEncryption', () => {
    let indexedDBEnc: IndexedDBEncryption;
    let clientSideEnc: ClientSideEncryption;

    beforeEach(() => {
      // Reset indexedDBMock before each test by directly manipulating its internal state
      Object.keys(indexedDBMock.stores).forEach(dbName => {
        Object.keys(indexedDBMock.stores[dbName]).forEach(storeName => {
          indexedDBMock.stores[dbName][storeName] = {};
        });
      });
      clientSideEnc = new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      );
      indexedDBEnc = new IndexedDBEncryption(clientSideEnc);
      indexedDBEnc.setUserKey(testUserKey);

      // Mock the put and get operations for IndexedDB to store/retrieve from our internal mock store
      indexedDBMock.open.mockImplementation((dbName, version) => {
        const request = {
          onsuccess: jest.fn(),
          onupgradeneeded: jest.fn(),
          onerror: jest.fn(),
          result: {
            objectStoreNames: { contains: jest.fn(() => true) },
            createObjectStore: jest.fn(() => ({})),
            transaction: jest.fn((storeNames, mode) => ({
              objectStore: jest.fn(storeName => ({
                put: jest.fn(value => {
                  if (!indexedDBMock.stores[dbName]) indexedDBMock.stores[dbName] = {};
                  if (!indexedDBMock.stores[dbName][storeName])
                    indexedDBMock.stores[dbName][storeName] = {};
                  indexedDBMock.stores[dbName][storeName][value.id] = value;
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
                get: jest.fn(id => ({
                  onsuccess: jest.fn(),
                  onerror: jest.fn(),
                  result: indexedDBMock.stores[dbName]?.[storeName]?.[id] || null,
                })),
                delete: jest.fn(id => {
                  if (indexedDBMock.stores[dbName]?.[storeName]) {
                    delete indexedDBMock.stores[dbName][storeName][id];
                  }
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
                clear: jest.fn(() => {
                  if (indexedDBMock.stores[dbName]?.[storeName]) {
                    indexedDBMock.stores[dbName][storeName] = {};
                  }
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
              })),
            })),
            close: jest.fn(),
          },
        };

        setTimeout(() => {
          if (!indexedDBMock.stores[dbName]) {
            indexedDBMock.stores[dbName] = {};
            request.result.objectStoreNames.contains.mockReturnValue(false); // Simulate store not existing initially for upgrade
            request.onupgradeneeded({ target: { result: request.result } } as any);
            request.result.objectStoreNames.contains.mockReturnValue(true); // Simulate store existing after upgrade
          }
          request.onsuccess({ target: { result: request.result } } as any);
        }, 0);
        return request;
      });
    });

    it('should encrypt and store data in IndexedDB', async () => {
      await indexedDBEnc.setItem('idxDbKey', testData);
      const db = await indexedDBEnc['openDb'](); // Access private method for verification
      const transaction = db.transaction([indexedDBEnc['storeName']], 'readonly');
      const store = transaction.objectStore(indexedDBEnc['storeName']);

      const request = store.get('idxDbKey');
      await new Promise(resolve => {
        request.onsuccess = resolve;
        request.onerror = reject;
      });

      const stored = request.result;
      expect(stored).toBeDefined();
      expect(stored.encryptedData).toBeDefined();
      expect(stored.metadata).toBeDefined();
    });

    it('should retrieve and decrypt data from IndexedDB', async () => {
      await indexedDBEnc.setItem('idxDbKey', testData);
      const retrieved = await indexedDBEnc.getItem('idxDbKey');
      expect(retrieved).toEqual(testData);
    });

    it('should remove item from IndexedDB', async () => {
      await indexedDBEnc.setItem('idxDbKey', testData);
      await indexedDBEnc.removeItem('idxDbKey');
      const retrieved = await indexedDBEnc.getItem('idxDbKey');
      expect(retrieved).toBeNull();
    });

    it('should clear all items from IndexedDB', async () => {
      await indexedDBEnc.setItem('idxDbKey1', testData);
      await indexedDBEnc.setItem('idxDbKey2', testData);
      await indexedDBEnc.clear();
      const retrieved1 = await indexedDBEnc.getItem('idxDbKey1');
      const retrieved2 = await indexedDBEnc.getItem('idxDbKey2');
      expect(retrieved1).toBeNull();
      expect(retrieved2).toBeNull();
    });

    it('should throw error if user key is not set', async () => {
      indexedDBEnc = new IndexedDBEncryption(clientSideEnc);
      await expect(indexedDBEnc.setItem('key', 'value')).rejects.toThrow(
        'Kullanıcı anahtarı ayarlanmamış'
      );
      await expect(indexedDBEnc.getItem('key')).rejects.toThrow('Kullanıcı anahtarı ayarlanmamış');
    });
  });

  // BrowserKeyManager Tests
  describe('BrowserKeyManager', () => {
    let browserKeyManager: BrowserKeyManager;
    let localStorageEnc: LocalStorageEncryption;
    let indexedDBEnc: IndexedDBEncryption;

    beforeEach(() => {
      localStorageMock.clear();
      // Reset indexedDBMock before each test by directly manipulating its internal state
      Object.keys(indexedDBMock.stores).forEach(dbName => {
        Object.keys(indexedDBMock.stores[dbName]).forEach(storeName => {
          indexedDBMock.stores[dbName][storeName] = {};
        });
      });

      const clientSideEnc = new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      );
      localStorageEnc = new LocalStorageEncryption(clientSideEnc);
      indexedDBEnc = new IndexedDBEncryption(clientSideEnc);
      browserKeyManager = new BrowserKeyManager(mockKeyDerivationService as any, localStorageEnc);
    });

    it('should set up and retrieve browser key', async () => {
      const userId = 'testUser1';
      const masterPassword = 'securePassword123';

      const key = await browserKeyManager.setupBrowserKey(userId, masterPassword);
      expect(key).toBe('mockDerivedKey'); // From mockKeyDerivationService

      const retrievedKey = await browserKeyManager.retrieveBrowserKey(userId, masterPassword);
      expect(retrievedKey).toEqual(key);

      // Verify key stored in local storage through LocalStorageEncryption mock
      const storedMetadata = localStorageMock.getItem(`user_key_${userId}`);
      expect(storedMetadata).toBeDefined();
    });

    it('should clear browser data', async () => {
      const userId = 'testUser2';
      const masterPassword = 'securePassword123';

      await browserKeyManager.setupBrowserKey(userId, masterPassword);

      // Add some encrypted data to local storage and indexedDB to verify clearing
      await localStorageEnc.setItem('testDataLS', testData);
      await indexedDBEnc.setItem('testDataIDB', testData);

      await browserKeyManager.clearBrowserData(userId);

      expect(localStorageMock.getItem(`user_key_${userId}`)).toBeNull();
      expect(localStorageMock.getItem('testDataLS')).toBeNull();
      // Verify indexedDB is cleared - this mock needs to be reset for each test to truly reflect clearing
      const retrievedIDB = await indexedDBEnc.getItem('testDataIDB');
      expect(retrievedIDB).toBeNull();
    });
  });

  // OfflineEncryptionCache Tests
  describe('OfflineEncryptionCache', () => {
    let cacheService: OfflineEncryptionCache;
    let indexedDBEnc: IndexedDBEncryption;

    beforeEach(() => {
      // Reset indexedDBMock before each test by directly manipulating its internal state
      Object.keys(indexedDBMock.stores).forEach(dbName => {
        Object.keys(indexedDBMock.stores[dbName]).forEach(storeName => {
          indexedDBMock.stores[dbName][storeName] = {};
        });
      });

      const clientSideEnc = new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      );
      indexedDBEnc = new IndexedDBEncryption(clientSideEnc);
      cacheService = new OfflineEncryptionCache(indexedDBEnc);
      cacheService.setUserKey(testUserKey);

      // Manually set up the mock IndexedDB's put/get behavior for this specific test suite
      indexedDBMock.open.mockImplementation((dbName, version) => {
        const request = {
          onsuccess: jest.fn(),
          onupgradeneeded: jest.fn(),
          onerror: jest.fn(),
          result: {
            objectStoreNames: { contains: jest.fn(() => true) },
            createObjectStore: jest.fn(() => ({})),
            transaction: jest.fn((storeNames, mode) => ({
              objectStore: jest.fn(storeName => ({
                put: jest.fn(value => {
                  if (!indexedDBMock.stores[dbName]) indexedDBMock.stores[dbName] = {};
                  if (!indexedDBMock.stores[dbName][storeName])
                    indexedDBMock.stores[dbName][storeName] = {};
                  indexedDBMock.stores[dbName][storeName][value.id] = value;
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
                get: jest.fn(id => ({
                  onsuccess: jest.fn(),
                  onerror: jest.fn(),
                  result: indexedDBMock.stores[dbName]?.[storeName]?.[id] || null,
                })),
                delete: jest.fn(id => {
                  if (indexedDBMock.stores[dbName]?.[storeName]) {
                    delete indexedDBMock.stores[dbName][storeName][id];
                  }
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
                clear: jest.fn(() => {
                  if (indexedDBMock.stores[dbName]?.[storeName]) {
                    indexedDBMock.stores[dbName][storeName] = {};
                  }
                  return { onsuccess: jest.fn(), onerror: jest.fn() };
                }),
              })),
            })),
            close: jest.fn(),
          },
        };

        setTimeout(() => {
          if (!indexedDBMock.stores[dbName]) {
            indexedDBMock.stores[dbName] = {};
            request.result.objectStoreNames.contains.mockReturnValue(false); // Simulate store not existing initially for upgrade
            request.onupgradeneeded({ target: { result: request.result } } as any);
            request.result.objectStoreNames.contains.mockReturnValue(true); // Simulate store existing after upgrade
          }
          request.onsuccess({ target: { result: request.result } } as any);
        }, 0);
        return request;
      });
    });

    it('should cache and retrieve encrypted data', async () => {
      // Mock the underlying indexedDBEnc.setItem to store the raw encryptedData and metadata
      const mockEncryptedResult = await new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      ).encryptActivityData(testData, testUserKey);

      jest.spyOn(indexedDBEnc, 'setItem').mockImplementation(async (key, value) => {
        const parsed = JSON.parse(value);
        indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][key] = parsed; // Simulate IndexedDB storage
        return Promise.resolve();
      });

      jest.spyOn(indexedDBEnc, 'getItem').mockImplementation(async key => {
        const stored = indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][key];
        if (stored) {
          // Simulate IndexedDBEncryption's getItem returning decrypted data
          return new ClientSideEncryption(
            new WebCryptoService(),
            mockKeyDerivationService as any
          ).decryptActivityData(stored.encryptedData, stored.metadata, testUserKey);
        }
        return null;
      });

      await cacheService.cacheEncryptedData(
        'cacheKey1',
        mockEncryptedResult.encryptedData,
        mockEncryptedResult.metadata
      );

      const retrievedData = await cacheService.retrieveCachedData('cacheKey1');
      expect(retrievedData).toEqual(testData);
    });

    it('should remove cached data', async () => {
      const mockEncryptedResult = await new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      ).encryptActivityData(testData, testUserKey);

      jest.spyOn(indexedDBEnc, 'setItem').mockImplementation(async (key, value) => {
        const parsed = JSON.parse(value);
        indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][key] = parsed; // Simulate IndexedDB storage
        return Promise.resolve();
      });

      jest.spyOn(indexedDBEnc, 'removeItem').mockImplementation(async key => {
        delete indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][key];
        return Promise.resolve();
      });

      await cacheService.cacheEncryptedData(
        'cacheKey2',
        mockEncryptedResult.encryptedData,
        mockEncryptedResult.metadata
      );
      await cacheService.removeCachedData('cacheKey2');

      // Verify by checking the mock IndexedDB's internal state
      expect(
        indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][
          'activity-data-cache_cacheKey2'
        ]
      ).toBeUndefined();
    });

    it('should clear all cached data', async () => {
      const mockEncryptedResult1 = await new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      ).encryptActivityData(testData + '1', testUserKey);
      const mockEncryptedResult2 = await new ClientSideEncryption(
        new WebCryptoService(),
        mockKeyDerivationService as any
      ).encryptActivityData(testData + '2', testUserKey);

      jest.spyOn(indexedDBEnc, 'setItem').mockImplementation(async (key, value) => {
        const parsed = JSON.parse(value);
        indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'][key] = parsed;
        return Promise.resolve();
      });
      jest.spyOn(indexedDBEnc, 'clear').mockImplementation(async () => {
        indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData'] = {};
        return Promise.resolve();
      });

      await cacheService.cacheEncryptedData(
        'cacheKey1',
        mockEncryptedResult1.encryptedData,
        mockEncryptedResult1.metadata
      );
      await cacheService.cacheEncryptedData(
        'cacheKey2',
        mockEncryptedResult2.encryptedData,
        mockEncryptedResult2.metadata
      );
      await cacheService.clearCache();

      // Verify by checking the mock IndexedDB's internal state
      expect(
        Object.keys(indexedDBMock.stores['PeakActivityEncryptedDB']['encryptedData']).length
      ).toEqual(0);
    });

    it('should throw error if user key is not set when caching', async () => {
      cacheService = new OfflineEncryptionCache(indexedDBEnc);
      cacheService.setUserKey(''); // Unset the key
      const mockEncryptedResult = {
        encryptedData: 'fake',
        metadata: { algorithm: 'AES-256-GCM', iv: 'fake', version: '1.0' },
      };
      await expect(
        cacheService.cacheEncryptedData(
          'key',
          mockEncryptedResult.encryptedData,
          mockEncryptedResult.metadata
        )
      ).rejects.toThrow('Kullanıcı anahtarı ayarlanmamış');
    });

    it('should throw error if user key is not set when retrieving', async () => {
      cacheService = new OfflineEncryptionCache(indexedDBEnc);
      cacheService.setUserKey(''); // Unset the key
      await expect(cacheService.retrieveCachedData('key')).rejects.toThrow(
        'Kullanıcı anahtarı ayarlanmamış'
      );
    });
  });

  // New tests for EncryptionSettings.vue component
  describe('EncryptionSettings.vue', () => {
    let wrapper: any;

    beforeEach(() => {
      // Mock the necessary services that EncryptionSettings.vue might use
      // For example, if it uses a service to fetch/save settings, mock it here
      // Since this is a unit test for the component, we want to isolate it from actual service calls
      // We'll assume a mock settings service for now.
      const mockSettingsService = {
        loadEncryptionSettings: jest.fn(async () => ({
          encryptionEnabled: true,
          autoEncryption: true,
          encryptionAlgorithm: 'AES-256-GCM',
        })),
        saveEncryptionSettings: jest.fn(async settings => {
          return { success: true, settings };
        }),
      };

      // Mount the component with mocks
      wrapper = shallowMount(EncryptionSettings, {
        global: {
          provide: {
            settingsService: mockSettingsService, // Provide mock service if component injects it
          },
          // Mock router-link and other global components if necessary
          stubs: ['router-link'],
        },
      });
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it('should display current encryption settings upon creation', async () => {
      await wrapper.vm.$nextTick(); // Wait for component to update
      expect(
        wrapper.find('input[type="checkbox"][data-test="encryption-enabled"]').element.checked
      ).toBe(true);
      expect(
        wrapper.find('input[type="checkbox"][data-test="auto-encryption"]').element.checked
      ).toBe(true);
      expect(wrapper.find('select[data-test="encryption-algorithm"]').element.value).toBe(
        'AES-256-GCM'
      );
    });

    it('should update encryption enabled setting', async () => {
      const encryptionEnabledCheckbox = wrapper.find(
        'input[type="checkbox"][data-test="encryption-enabled"]'
      );
      await encryptionEnabledCheckbox.setValue(false);
      expect(wrapper.vm.encryptionEnabled).toBe(false);
      // Simulate save button click
      await wrapper.find('button[data-test="save-encryption-settings"]').trigger('click');
      // Verify that the save method on mock service was called with updated settings
      // expect(mockSettingsService.saveEncryptionSettings).toHaveBeenCalledWith(
      //   expect.objectContaining({ encryptionEnabled: false })
      // );
    });

    it('should update auto encryption setting', async () => {
      const autoEncryptionCheckbox = wrapper.find(
        'input[type="checkbox"][data-test="auto-encryption"]'
      );
      await autoEncryptionCheckbox.setValue(false);
      expect(wrapper.vm.autoEncryption).toBe(false);
      // Simulate save button click
      await wrapper.find('button[data-test="save-encryption-settings"]').trigger('click');
    });

    it('should update encryption algorithm setting', async () => {
      const encryptionAlgorithmSelect = wrapper.find('select[data-test="encryption-algorithm"]');
      await encryptionAlgorithmSelect.setValue('AES-128-GCM');
      expect(wrapper.vm.encryptionAlgorithm).toBe('AES-128-GCM');
      // Simulate save button click
      await wrapper.find('button[data-test="save-encryption-settings"]').trigger('click');
    });

    it('should handle saving encryption settings', async () => {
      // Here we can test the interaction with the mock service's save method
      // For example, if it calls a backend API, we would mock that API call.
      const saveButton = wrapper.find('button[data-test="save-encryption-settings"]');
      await saveButton.trigger('click');
      // We can assert that the save method was called with the correct arguments
      // expect(mockSettingsService.saveEncryptionSettings).toHaveBeenCalled();
    });

    // Add more tests for error handling, validation, etc.
  });
});
