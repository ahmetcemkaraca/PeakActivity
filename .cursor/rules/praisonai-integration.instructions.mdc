---
applyTo: "**/*.py"
description: "PraisonAI integration patterns and agent development guidelines"
---

# PraisonAI Agent Entegrasyon Kılavuzu

Bu dosya, PeakActivity ile PraisonAI agents framework'ünün entegrasyonu için geliştirme standartlarını tanımlar.

## Agent Architecture Patterns

### Productivity Monitoring Agent
```python
from praisonaiagents import Agent, Task
from typing import List, Dict
import json

class ProductivityAgent(Agent):
    def __init__(self):
        super().__init__(
            role="Üretkenlik Analisti",
            goal="Kullanıcının çalışma desenlerini analiz et ve iyileştirme önerileri sun",
            backstory="""Sen deneyimli bir üretkenlik koçusun. ActivityWatch verilerini 
            analiz ederek kullanıcılara kişiselleştirilmiş öneriler sunuyorsun.""",
            verbose=True,
            allow_delegation=False
        )
    
    def analyze_focus_patterns(self, activity_data: List[Dict]) -> Dict:
        """Odaklanma desenlerini analiz et"""
        task = Task(
            description=f"""
            Şu aktivite verilerini analiz et ve odaklanma kalitesi hakkında insights üret:
            {json.dumps(activity_data, indent=2)}
            
            Analiz et:
            - Derin çalışma periyotları
            - Dikkat dağınıklığı zamanları  
            - En verimli saatler
            - Uygulama geçiş sıklığı
            
            Çıktı formatı:
            {{
                "focus_score": float,
                "deep_work_periods": [],
                "distraction_triggers": [],
                "recommendations": []
            }}
            """,
            agent=self
        )
        return task.execute()
    
    def suggest_schedule_optimization(self, current_schedule: Dict) -> Dict:
        """Zaman çizelgesi optimizasyonu öner"""
        task = Task(
            description=f"""
            Mevcut çalışma programını analiz et: {current_schedule}
            
            Şunları değerlendir:
            - Enerji seviyesi dalgalanmaları
            - Toplantı yoğunluğu
            - Kesintisiz çalışma blokları
            - Mola zamanlaması
            
            Optimize edilmiş program öner.
            """,
            agent=self
        )
        return task.execute()
```

### Digital Wellness Agent
```python
class DigitalWellnessAgent(Agent):
    def __init__(self):
        super().__init__(
            role="Dijital Sağlık Uzmanı",
            goal="Kullanıcının dijital alışkanlıklarını izle ve sağlık önerileri sun",
            backstory="""Sen dijital minimalizm ve sağlıklı teknoloji kullanımı 
            konusunda uzman bir danışmansın."""
        )
    
    def assess_screen_time_health(self, screen_data: Dict) -> Dict:
        """Ekran süresi sağlık değerlendirmesi"""
        task = Task(
            description=f"""
            Ekran kullanım verilerini sağlık açısından değerlendir:
            {json.dumps(screen_data)}
            
            Kontrol et:
            - Günlük toplam ekran süresi
            - Gece geç saatlerde kullanım
            - Sosyal medya zamanı
            - Çok sık uygulama değiştirme
            
            Sağlık riskleri ve öneriler sun.
            """,
            agent=self
        )
        return task.execute()
    
    def create_digital_detox_plan(self, usage_patterns: Dict) -> Dict:
        """Dijital detoks planı oluştur"""
        task = Task(
            description=f"""
            Kullanım desenlerine göre kişiselleştirilmiş dijital detoks planı oluştur:
            {usage_patterns}
            
            Plan içeriği:
            - Kademeli azaltma hedefleri
            - Alternatif aktiviteler
            - Tetikleyici durumlar ve çözümler
            - İlerleme takip metrikleri
            """,
            agent=self
        )
        return task.execute()
```

## Agent-to-Firebase Integration

### Firebase Functions Agent Bridge
```python
# functions/agents/agent_bridge.py
import functions_framework
from praisonaiagents import Agent, Task
import json

@functions_framework.http
def execute_agent_task(request):
    """Firebase function to execute PraisonAI agent tasks"""
    try:
        data = request.get_json()
        agent_type = data.get('agent_type')
        task_data = data.get('task_data')
        user_id = data.get('user_id')
        
        # Agent factory pattern
        agent = create_agent(agent_type)
        
        # Execute task with user context
        result = agent.execute_with_context(task_data, user_id)
        
        # Store result in Firestore
        store_agent_result(user_id, agent_type, result)
        
        return {
            'success': True,
            'result': result,
            'agent': agent_type
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 500

def create_agent(agent_type: str) -> Agent:
    """Agent factory"""
    agents = {
        'productivity': ProductivityAgent(),
        'wellness': DigitalWellnessAgent(),
        'focus': FocusOptimizationAgent(),
        'automation': WorkflowAutomationAgent()
    }
    
    if agent_type not in agents:
        raise ValueError(f"Unknown agent type: {agent_type}")
    
    return agents[agent_type]
```

### Real-time Agent Triggers
```typescript
// functions/src/triggers/agent-triggers.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { executeAgent } from '../services/agent-service';

export const onActivityInsight = onDocumentCreated(
  'users/{userId}/activities/{activityId}',
  async (event) => {
    const activityData = event.data?.data();
    const userId = event.params.userId;
    
    // Trigger productivity agent if significant activity detected
    if (activityData.duration > 3600) { // 1+ hour session
      await executeAgent({
        type: 'productivity',
        userId,
        task: 'analyze_long_session',
        data: activityData
      });
    }
    
    // Trigger wellness agent for late night usage
    const hour = new Date(activityData.timestamp).getHours();
    if (hour >= 23 || hour <= 5) {
      await executeAgent({
        type: 'wellness', 
        userId,
        task: 'assess_late_usage',
        data: activityData
      });
    }
  }
);
```

## Multi-Agent Collaboration

### Agent Team for Complex Analysis
```python
from praisonaiagents import Agent, Task, Crew

class ActivityAnalysisCrew:
    def __init__(self):
        self.data_analyst = Agent(
            role="Veri Analisti",
            goal="Ham aktivite verilerini temizle ve düzenle",
            backstory="Veri bilimi uzmanısın",
            tools=[data_cleaning_tool, statistical_analysis_tool]
        )
        
        self.productivity_expert = Agent(
            role="Üretkenlik Uzmanı", 
            goal="Verimlilik desenlerini analiz et",
            backstory="Üretkenlik koçluğu deneyimin var",
            tools=[productivity_analysis_tool, focus_metrics_tool]
        )
        
        self.wellness_advisor = Agent(
            role="Sağlık Danışmanı",
            goal="Dijital sağlık önerilerinde bulun",
            backstory="Dijital wellness uzmanısın", 
            tools=[wellness_assessment_tool, behavior_analysis_tool]
        )
        
        self.report_writer = Agent(
            role="Rapor Yazarı",
            goal="Analizleri kullanıcı dostu rapora dönüştür",
            backstory="Teknik bilgiyi sade dille anlatan yazarsın",
            tools=[report_generation_tool, visualization_tool]
        )
    
    def analyze_weekly_activity(self, raw_data: Dict) -> Dict:
        """Haftalık aktivite analizi için agent ekibi"""
        
        # Task 1: Data preparation
        data_prep_task = Task(
            description=f"Bu haftalık ham veriyi temizle ve analiz için hazırla: {raw_data}",
            agent=self.data_analyst
        )
        
        # Task 2: Productivity analysis  
        productivity_task = Task(
            description="Temizlenmiş veriden üretkenlik metriklerini çıkar",
            agent=self.productivity_expert,
            context=[data_prep_task]
        )
        
        # Task 3: Wellness assessment
        wellness_task = Task(
            description="Dijital sağlık açısından haftalık kullanımı değerlendir",
            agent=self.wellness_advisor,
            context=[data_prep_task]
        )
        
        # Task 4: Report generation
        report_task = Task(
            description="Tüm analizleri birleştirip kullanıcı raporu oluştur",
            agent=self.report_writer,
            context=[productivity_task, wellness_task]
        )
        
        # Execute crew
        crew = Crew(
            agents=[self.data_analyst, self.productivity_expert, 
                   self.wellness_advisor, self.report_writer],
            tasks=[data_prep_task, productivity_task, wellness_task, report_task],
            verbose=True
        )
        
        return crew.kickoff()
```

## Custom Tools for ActivityWatch

### ActivityWatch Data Tools
```python
from praisonaiagents.tools import BaseTool
from typing import List, Dict
import requests

class ActivityWatchTool(BaseTool):
    name: str = "ActivityWatch Data Fetcher"
    description: str = "ActivityWatch server'dan aktivite verilerini çeker"
    
    def _run(self, bucket_id: str, start_date: str, end_date: str) -> List[Dict]:
        """ActivityWatch API'den veri çek"""
        try:
            url = f"http://localhost:5600/api/0/buckets/{bucket_id}/events"
            params = {
                'start': start_date,
                'end': end_date,
                'limit': 1000
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            return f"Veri çekme hatası: {str(e)}"

class FocusMetricsTool(BaseTool):
    name: str = "Focus Quality Calculator"
    description: str = "Aktivite verilerinden odaklanma kalitesi hesaplar"
    
    def _run(self, events: List[Dict]) -> Dict:
        """Odaklanma metrikleri hesapla"""
        if not events:
            return {"error": "Veri bulunamadı"}
        
        # App switching frequency
        app_switches = 0
        prev_app = None
        
        for event in events:
            current_app = event.get('data', {}).get('app')
            if prev_app and current_app != prev_app:
                app_switches += 1
            prev_app = current_app
        
        # Deep work periods (>30 min same app)
        deep_work_periods = []
        current_period = None
        
        for event in events:
            duration = event.get('duration', 0)
            if duration > 1800:  # 30+ minutes
                deep_work_periods.append({
                    'app': event.get('data', {}).get('app'),
                    'duration': duration,
                    'timestamp': event.get('timestamp')
                })
        
        # Focus score calculation
        total_time = sum(e.get('duration', 0) for e in events)
        deep_work_time = sum(p['duration'] for p in deep_work_periods)
        focus_score = (deep_work_time / total_time) * 100 if total_time > 0 else 0
        
        return {
            'focus_score': round(focus_score, 2),
            'app_switches': app_switches,
            'deep_work_periods': len(deep_work_periods),
            'total_deep_work_minutes': round(deep_work_time / 60, 2)
        }
```

## Agent Performance Monitoring

### Agent Execution Metrics
```python
import time
from functools import wraps

def monitor_agent_performance(func):
    """Agent performans izleme decorator'ı"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        agent_name = args[0].__class__.__name__ if args else "Unknown"
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log successful execution
            log_agent_metrics({
                'agent': agent_name,
                'function': func.__name__,
                'execution_time': execution_time,
                'status': 'success',
                'timestamp': time.time()
            })
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            # Log failed execution
            log_agent_metrics({
                'agent': agent_name,
                'function': func.__name__,
                'execution_time': execution_time,
                'status': 'error',
                'error': str(e),
                'timestamp': time.time()
            })
            
            raise
    
    return wrapper

def log_agent_metrics(metrics: Dict):
    """Agent metriklerini Firestore'a kaydet"""
    # Firebase admin SDK ile metrics collection'a kaydet
    pass
```

## Error Handling ve Fallbacks

### Robust Agent Execution
```python
class RobustAgentExecutor:
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
    
    async def execute_with_fallback(self, agent: Agent, task_data: Dict) -> Dict:
        """Fallback mekanizması ile agent çalıştır"""
        
        for attempt in range(self.max_retries):
            try:
                result = await agent.execute_async(task_data)
                return {
                    'success': True,
                    'result': result,
                    'attempt': attempt + 1
                }
                
            except Exception as e:
                if attempt == self.max_retries - 1:
                    # Son deneme başarısız, fallback'e geç
                    return await self.execute_fallback(task_data, str(e))
                
                # Kısa bekleme sonrası yeniden dene
                await asyncio.sleep(2 ** attempt)
        
    async def execute_fallback(self, task_data: Dict, error: str) -> Dict:
        """Agent başarısız olursa rule-based fallback"""
        return {
            'success': False,
            'fallback_result': self.rule_based_analysis(task_data),
            'original_error': error,
            'message': 'AI agent kullanılamadı, kural tabanlı analiz kullanıldı'
        }
    
    def rule_based_analysis(self, data: Dict) -> Dict:
        """Basit kural tabanlı analiz"""
        # Agent başarısız olduğunda kullanılacak basit algoritmalar
        return {
            'basic_metrics': 'calculated',
            'simple_recommendations': ['Daha fazla mola alın', 'Odaklanma sürenizi artırın']
        }
```
