const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

// Test activity query performance
suite.add('ActivityQueryService.queryActivities', {
  defer: true,
  fn: function(deferred) {
    // Mock data for benchmark
    const mockService = {
      queryActivities: async () => {
        // Simulate API call
        return { events: [], totalCount: 0 };
      }
    };

    mockService.queryActivities({ userId: 'test' }).then(() => {
      deferred.resolve();
    });
  }
});

// Test anomaly detection
suite.add('AnomalyDetectionService.detectAnomalies', {
  defer: true,
  fn: function(deferred) {
    const mockService = new (require('../src/services/anomaly-detection-service')).AnomalyDetectionService();
    
    mockService.detectAnomalies([
      { date: '2024-01-01', total_seconds: 28800 },
      { date: '2024-01-02', total_seconds: 30000 },
      { date: '2024-01-03', total_seconds: 25000 },
      { date: '2024-01-04', total_seconds: 32000 },
      { date: '2024-01-05', total_seconds: 40000 }
    ]).then(() => {
      deferred.resolve();
    });
  }
});

// Run benchmark
suite
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
  })
  .run({ async: true });
